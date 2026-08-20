import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../../context/AuthContext'
import api from '../../../services/api'
import { hasRedFlag } from '../../../lib/aiSafety'
import { streamAssistant, fetchAssistantConfig, fileToInline, cachedOfflineAnswer } from '../../../lib/assistantClient'
import { loadThread, saveThread, clearThread } from '../../../lib/assistantStore'
import { compressImage } from '../../../lib/compressImage'
import { enqueue, resolve as resolveOutbox, takePending, clear as clearOutbox, SEND_STATE } from '../../../lib/outbox'
import Alert from '../../ui/Alert'
import Button from '../../ui/Button'
import { useToast } from '../../ui/Toast'
import StarterCards from './StarterCards'
import MessageBubble from './MessageBubble'
import Composer from './Composer'
import MicButton from './MicButton'
import { speak, stopSpeaking, primeVoices, canSpeak } from '../../../lib/voice'

const MAX_FILES = 3
const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

/** Only what the server contract needs — previews and local status stay here. */
const forWire = (messages) => messages
  .filter(m => m.status !== 'error')
  .map(m => ({ role: m.role, text: m.text, files: m.files?.map(f => ({ mimeType: f.mimeType, data: f.data })) }))

export default function AssistantChat({ compact = false }) {
  const { t, i18n } = useTranslation()
  const { userId } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [files, setFiles] = useState([])
  const [helpType, setHelpType] = useState('medical_assistance')
  const [streaming, setStreaming] = useState(false)
  const [greeting, setGreeting] = useState('')
  const [ready, setReady] = useState(false)
  const [speakingId, setSpeakingId] = useState(null)
  const [voiceReady, setVoiceReady] = useState(false)
  const [recording, setRecording] = useState(false)
  const [handingOver, setHandingOver] = useState(false)

  const abortRef = useRef(null)
  // Held outside state: these are only ever read when handing over to a
  // booking, and re-rendering the transcript for them buys nothing.
  const voiceNotesRef = useRef([])
  const bottomRef = useRef(null)
  const scrollRef = useRef(null)

  // Restore the transcript before first paint of the list, so a returning
  // user does not watch their own history appear a beat later.
  useEffect(() => {
    let cancelled = false
    loadThread(userId).then(saved => {
      if (cancelled) return
      const interrupted = takePending(userId)
      // Anything still queued never got an answer — the tab closed mid-send.
      // Marking it failed gives the user a Retry instead of a message that
      // looks sent and simply never came back.
      const restored = saved.map(m =>
        interrupted.some(e => e.id === m.id) ? { ...m, sendState: SEND_STATE.FAILED } : m
      )
      setMessages(restored)
      setReady(true)
    })
    return () => { cancelled = true }
  }, [userId])

  useEffect(() => {
    fetchAssistantConfig(i18n.language)
      .then(cfg => setGreeting(cfg.greeting))
      .catch(() => setGreeting(t('assistant.greeting')))
  }, [i18n.language, t])

  useEffect(() => {
    if (ready) saveThread(userId, messages)
  }, [userId, messages, ready])

  // Only follow the stream when the user is already at the bottom; yanking
  // the view while they are reading an earlier answer is worse than a
  // slightly stale scroll position.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120
    if (nearBottom) bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  useEffect(() => {
    primeVoices().then(() => setVoiceReady(canSpeak(i18n.language)))
  }, [i18n.language])

  useEffect(() => () => { abortRef.current?.abort(); stopSpeaking() }, [])

  /** Mirrors the modality: a spoken question gets a spoken answer. */
  const readAloud = useCallback((id, text) => {
    if (!text) return
    const spoken = speak(text, i18n.language, { onEnd: () => setSpeakingId(null) })
    if (spoken) setSpeakingId(id)
  }, [i18n.language])

  const toggleSpeech = useCallback((message) => {
    if (speakingId === message.id) { stopSpeaking(); setSpeakingId(null); return }
    readAloud(message.id, message.spoken || message.text)
  }, [speakingId, readAloud])

  const run = useCallback(async (history, { viaVoice = false } = {}) => {
    const replyId = newId()
    // The banner is driven by the patient's own words, so it can appear
    // before the model has produced a single token.
    const latest = [...history].reverse().find(m => m.role === 'user')
    const urgent = hasRedFlag(latest?.text)

    const pendingUser = [...history].reverse().find(m => m.role === 'user')
    if (pendingUser) enqueue(userId, pendingUser)

    const withSendState = history.map(m =>
      m.id === pendingUser?.id ? { ...m, sendState: SEND_STATE.SENDING } : m
    )

    setMessages([...withSendState, { id: replyId, role: 'assistant', text: '', status: 'streaming', urgent }])
    setStreaming(true)

    // Anything the assistant is still saying is now stale.
    stopSpeaking()
    setSpeakingId(null)

    // The escalation is spoken before the model answers, because someone who
    // cannot type often cannot read the banner either.
    if (urgent && viaVoice) readAloud(replyId, t('symptomChecker.urgent'))

    const controller = new AbortController()
    abortRef.current = controller

    const patch = (fn) => setMessages(prev => prev.map(m => (m.id === replyId ? fn(m) : m)))

    await streamAssistant({
      helpType,
      lang: i18n.language,
      messages: forWire(history),
      signal: controller.signal,
      onEvent: (event) => {
        if (event.type === 'delta') patch(m => ({ ...m, text: m.text + event.text }))
        else if (event.type === 'redflag') patch(m => ({ ...m, urgent: true }))
        else if (event.type === 'citations') patch(m => ({ ...m, citations: event.items }))
        else if (event.type === 'spoken') {
          patch(m => ({ ...m, spoken: event.text }))
          // Start talking now rather than after the written answer lands —
          // the summary arrives first exactly so this can happen early.
          if (viaVoice && !urgent) readAloud(replyId, event.text)
        }
        else if (event.type === 'done') patch(m => ({
          ...m,
          text: event.text || m.text,
          spoken: event.spoken || m.spoken,
          citations: event.citations || m.citations,
          followUps: event.followUps || [],
          truncated: Boolean(event.truncated),
          status: 'done'
        }))
        else if (event.type === 'error') {
          /**
           * Any failure that leaves us with nothing still gets a real answer
           * where one is written down, rather than only an apology. That now
           * includes a busy or quota-exhausted model, not just a dead
           * network — from the patient's side those are the same event, and
           * the stored first-aid guidance is just as correct either way.
           */
          const NO_ANSWER = ['network', 'busy', 'rate_limit', 'not_configured']
          const offline = NO_ANSWER.includes(event.code) && !event.partial
            ? cachedOfflineAnswer(latest?.text, i18n.language)
            : null
          patch(m => ({
            ...m,
            text: event.partial || offline || m.text,
            offline: Boolean(offline),
            // Which of the two it was, so the badge does not tell someone
            // with four bars of signal that they are offline.
            offlineReason: offline ? (event.code === 'network' ? 'network' : 'busy') : undefined,
            status: offline ? 'done' : 'error',
            errorCode: event.code
          }))
        }
      }
    })

    // Aborting resolves normally, so a stopped stream keeps whatever text
    // arrived and simply stops being "streaming".
    patch(m => (m.status === 'streaming' ? { ...m, status: 'done' } : m))

    // The user's message is settled by whether their words reached the
    // server, which is not the same as whether the answer was any good.
    setMessages(prev => {
      const reply = prev.find(m => m.id === replyId)
      // An offline answer is a stored one — the server never saw the
      // question, so the message is not delivered and must stay retryable.
      // Without this the fallback quietly masks every failed send.
      const delivered = reply?.status !== 'error' && !reply?.offline
      if (delivered && pendingUser) resolveOutbox(userId, pendingUser.id)
      return prev.map(m => m.id === pendingUser?.id
        ? { ...m, sendState: delivered ? SEND_STATE.SENT : SEND_STATE.FAILED }
        : m)
    })

    setStreaming(false)
    abortRef.current = null
  }, [helpType, i18n.language, readAloud, t, userId])

  const send = useCallback(async (options = {}) => {
    const text = (options.text ?? draft).trim()
    if (!text && !files.length) return

    const userMessage = { id: newId(), role: 'user', text, files, status: 'done', viaVoice: options.viaVoice }
    setDraft('')
    setFiles([])
    await run([...messages, userMessage], { viaVoice: Boolean(options.viaVoice) })
  }, [draft, files, messages, run])

  /**
   * A finished recording. The transcript goes straight out rather than
   * waiting for the user to press send — holding the mic and releasing is
   * already the whole gesture, and asking a non-reader to confirm written
   * text before it sends would defeat the point.
   *
   * The language detected from the audio wins over the app setting: someone
   * who cannot read is not going to find the language dropdown.
   */
  const onTranscript = useCallback(({ text, lang, blob }) => {
    if (lang && lang !== i18n.language) i18n.changeLanguage(lang)
    if (blob) {
      const ext = (blob.type.split('/')[1] || 'webm').split(';')[0]
      voiceNotesRef.current.push(new File([blob], `voice-${Date.now()}.${ext}`, { type: blob.type }))
    }
    send({ text, viaVoice: true })
  }, [send, i18n])

  const onVoiceError = useCallback((code) => {
    toast.error(t(`assistant.voiceErrors.${code}`, t('assistant.voiceErrors.mic_failed')))
  }, [toast, t])

  /** Drops the failed reply and replays the turn that produced it. */
  const retry = useCallback(() => {
    const history = messages.filter(m => m.status !== 'error')
    if (!history.length) return
    run(history)
  }, [messages, run])

  const stop = useCallback(() => abortRef.current?.abort(), [])

  const attach = useCallback(async (fileList) => {
    const room = MAX_FILES - files.length
    const incoming = Array.from(fileList || []).filter(f => f.type.startsWith('image/')).slice(0, room)
    if (!incoming.length) return
    const inlined = await Promise.all(incoming.map(async f => fileToInline(await compressImage(f))))
    setFiles(prev => [...prev, ...inlined])
  }, [files.length])

  const reset = useCallback(() => {
    if (messages.length && !window.confirm(t('assistant.newChatConfirm'))) return
    abortRef.current?.abort()
    setMessages([])
    setDraft('')
    setFiles([])
    clearThread(userId)
    clearOutbox(userId)
    toast.info(t('assistant.cleared'))
  }, [messages.length, t, toast, userId])

  /**
   * Handing over to a doctor. The complaint is summarised first so the
   * consultation opens with the story already written down, and any voice
   * notes travel with it.
   */
  const talkToDoctor = useCallback(async () => {
    const spoken = messages.filter(m => m.role === 'user').map(m => m.text).filter(Boolean).join('\n')
    let summary = ''
    setHandingOver(true)
    try {
      const { data } = await api.post('/assistant/summarise', {
        messages: messages.map(m => ({ role: m.role, text: m.text })),
        lang: i18n.language
      })
      summary = data?.summary || ''
    } catch {
      /* the raw words are a fine fallback; never block the booking */
    } finally {
      setHandingOver(false)
    }
    navigate('/patient/care/book', {
      state: { symptoms: summary || spoken, media: voiceNotesRef.current.slice(-3) }
    })
  }, [messages, i18n.language, navigate])

  const pickStarter = (value, seed) => {
    setHelpType(value)
    setDraft(seed)
  }

  const empty = messages.length === 0
  const anyUrgent = messages.some(m => m.urgent)
  // Only the newest answer's suggestions; older ones are stale by now.
  const followUps = messages[messages.length - 1]?.followUps || []

  return (
    <div className={`flex flex-col min-h-0 ${compact ? 'h-full' : 'h-[calc(100dvh-13rem)] min-h-[26rem]'}`}>
      {!empty && (
        <div className="flex justify-end pb-2">
          <Button variant="ghost" size="sm" onClick={reset}>{t('assistant.newChat')}</Button>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0 pr-0.5">
        {empty ? (
          <StarterCards
          onPick={pickStarter}
          greeting={greeting}
          canSpeak={voiceReady}
          onSpeak={(text) => readAloud('greeting', text)}
        />
        ) : (
          <ul className="flex flex-col gap-4 pb-2">
            {messages.map((m, i) => (
              <MessageBubble
                key={m.id}
                message={m}
                onRetry={retry}
                isLast={i === messages.length - 1}
                canSpeak={voiceReady}
                speaking={speakingId === m.id}
                onToggleSpeech={() => toggleSpeech(m)}
              />
            ))}
          </ul>
        )}
        <div ref={bottomRef} />
      </div>

      {/* On the full page, bottom padding reserves the corner the Emergency
          button floats in — without it the send control sits underneath the
          FAB, and the one screen where someone may be describing an
          emergency is the worst place to make either button hard to hit.
          Inside the sheet the FAB is behind the overlay, so the same padding
          would only push the composer up and leave dead space. */}
      <div className={`pt-3 mt-1 border-t border-line flex flex-col gap-2.5 ${compact ? '' : 'pb-16 lg:pb-20'}`}>
        {/* Tapping beats typing, and beats speaking again: the follow-ups a
            patient actually has are predictable, and offering them costs one
            tap instead of a whole sentence. */}
        {!streaming && followUps.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-caption text-muted">{t('assistant.askNext')}</span>
            {followUps.map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => send({ text: q })}
                className="px-2.5 py-1 rounded-full border border-line bg-surface text-caption text-body
                           hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Talking to a real doctor stays the primary escape hatch, and it
            surfaces as soon as anything urgent has been said. */}
        {anyUrgent && (
          <Button variant="danger" block loading={handingOver} onClick={talkToDoctor}>
            {handingOver ? t('assistant.preparingSummary') : t('symptomChecker.findDoctor')}
          </Button>
        )}

        <Composer
          value={draft}
          onChange={setDraft}
          onSend={send}
          onStop={stop}
          streaming={streaming}
          files={files}
          onAttach={attach}
          onRemoveFile={(i) => setFiles(prev => prev.filter((_, idx) => idx !== i))}
          hint={empty && !draft ? t('assistant.micHint') : null}
          mic={
            <MicButton
              lang={i18n.language}
              disabled={streaming}
              onTranscript={onTranscript}
              onError={onVoiceError}
              onRecordingChange={setRecording}
            />
          }
        />

        {/* One pinned disclaimer. Repeating it under every answer trains
            people to skip it, which is worse than showing it once. Hidden
            while recording, where the sheet already occupies this space. */}
        {!recording && (
          <p className="text-caption text-muted leading-snug">{t('symptomChecker.disclaimer')}</p>
        )}
      </div>
    </div>
  )
}
