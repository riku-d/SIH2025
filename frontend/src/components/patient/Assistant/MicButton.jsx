import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  startRecording, transcribe, isRecordingSupported, isSecureContextForMic, stopSpeaking, MAX_RECORDING_MS
} from '../../../lib/voice'

const CANCEL_SLIDE_PX = 70
const MIN_RECORDING_MS = 400
const BARS = 18

/**
 * Hold to talk, slide left to cancel — the WhatsApp voice-note gesture.
 *
 * Deliberately not an invention: our users send voice notes every day and
 * already have this in their thumbs. Anything we designed ourselves would
 * have to be learned, by exactly the people least able to read instructions
 * explaining it.
 */
export default function MicButton({ lang, disabled, onTranscript, onError, onRecordingChange }) {
  const { t } = useTranslation()

  const [state, setState] = useState('idle') // idle | recording | cancelling | working
  const [level, setLevel] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [levels, setLevels] = useState(() => new Array(BARS).fill(0))

  const handleRef = useRef(null)
  const startXRef = useRef(0)
  const cancelRef = useRef(false)
  const timerRef = useRef(null)

  const supported = isRecordingSupported()
  const secure = isSecureContextForMic()

  useEffect(() => () => {
    handleRef.current?.cancel()
    clearInterval(timerRef.current)
  }, [])

  useEffect(() => { onRecordingChange?.(state === 'recording' || state === 'cancelling') }, [state, onRecordingChange])

  const finish = useCallback(async (handle) => {
    clearInterval(timerRef.current)
    setLevels(new Array(BARS).fill(0))

    if (cancelRef.current) { handle.cancel(); setState('idle'); return }

    // Below this it is a mis-tap, not a message.
    if (handle.durationMs() < MIN_RECORDING_MS) { handle.cancel(); setState('idle'); return }

    setState('working')
    try {
      const blob = await handle.stop()
      if (!blob || blob.size < 800) { setState('idle'); return }
      const result = await transcribe(blob, lang)
      if (!result.text) { onError?.('empty'); setState('idle'); return }
      // The blob rides along so the recording can be attached to a booking:
      // the doctor hears the complaint in the patient's own words.
      onTranscript({ ...result, blob })
    } catch (err) {
      onError?.(err.code || 'transcription_failed')
    } finally {
      setState('idle')
    }
  }, [lang, onTranscript, onError])

  const begin = useCallback(async (clientX) => {
    if (disabled || state !== 'idle') return

    if (!secure) { onError?.('insecure_context'); return }
    if (!supported) { onError?.('unsupported'); return }

    // Barge-in: the moment they start talking, we stop talking. Waiting for
    // the assistant to finish its sentence is the thing that makes voice
    // assistants feel like they are not listening.
    stopSpeaking()

    cancelRef.current = false
    startXRef.current = clientX
    setElapsed(0)

    try {
      const handle = await startRecording({
        onLevel: (l) => {
          setLevel(l)
          setLevels(prev => [...prev.slice(1), Math.min(1, l * 4)])
        },
        onAutoStop: () => { if (handleRef.current) finish(handleRef.current) }
      })
      handleRef.current = handle
      setState('recording')
      timerRef.current = setInterval(() => setElapsed(handle.durationMs()), 100)
    } catch (err) {
      // Denial is sticky — the browser will not ask again on its own.
      onError?.(err?.name === 'NotAllowedError' ? 'permission_denied' : 'mic_failed')
    }
  }, [disabled, state, secure, supported, onError, finish])

  const end = useCallback(() => {
    const handle = handleRef.current
    if (!handle) { setState('idle'); return }
    handleRef.current = null
    finish(handle)
  }, [finish])

  const move = useCallback((clientX) => {
    if (state !== 'recording' && state !== 'cancelling') return
    const slid = startXRef.current - clientX
    cancelRef.current = slid > CANCEL_SLIDE_PX
    setState(cancelRef.current ? 'cancelling' : 'recording')
  }, [state])

  /** Keyboard users cannot hold a button, so Space and Enter toggle instead. */
  const onKeyDown = (e) => {
    if (e.key !== ' ' && e.key !== 'Enter') return
    e.preventDefault()
    if (state === 'idle') begin(0)
    else if (state === 'recording') end()
  }

  const recording = state === 'recording' || state === 'cancelling'
  const remaining = Math.max(0, MAX_RECORDING_MS - elapsed)
  const seconds = Math.floor(elapsed / 1000)

  return (
    <>
      <button
        type="button"
        disabled={disabled || state === 'working'}
        aria-label={t('assistant.hold')}
        aria-pressed={recording}
        onPointerDown={(e) => {
          e.preventDefault()
          // Capture keeps the slide-to-cancel gesture alive when the finger
          // leaves the button, but throws if the pointer is already gone —
          // which must not stop the recording from starting.
          try { e.currentTarget.setPointerCapture?.(e.pointerId) } catch { /* not capturable */ }
          begin(e.clientX)
        }}
        onPointerMove={(e) => move(e.clientX)}
        onPointerUp={end}
        onPointerCancel={end}
        onKeyDown={onKeyDown}
        className={`shrink-0 relative w-11 h-11 rounded-full flex items-center justify-center
                    transition-colors select-none touch-none
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
                    disabled:opacity-40
                    ${state === 'cancelling' ? 'bg-danger-500 text-white'
                      : recording ? 'bg-primary-600 text-white'
                      : 'bg-primary-50 text-primary-700 hover:bg-primary-100'}`}
      >
        {/* A ring that grows with the voice: proof the mic is hearing them. */}
        {recording && (
          <span
            className="absolute inset-0 rounded-full bg-primary-500/30 pointer-events-none"
            style={{ transform: `scale(${1 + Math.min(level * 3, 0.85)})` }}
            aria-hidden="true"
          />
        )}
        {state === 'working' ? (
          <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        ) : (
          <svg className="w-5 h-5 relative" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15a3 3 0 003-3V6a3 3 0 10-6 0v6a3 3 0 003 3z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-14 0M12 18.5V22" />
          </svg>
        )}
      </button>

      {recording && (
        <div
          className="fixed inset-x-0 bottom-0 z-50 px-4 pb-6 pt-5 bg-surface border-t border-line shadow-sheet
                     flex flex-col gap-3 animate-sheet-up"
          role="status"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-danger-500 font-semibold tabular">
              <span className="w-2.5 h-2.5 rounded-full bg-danger-500 animate-pulse" aria-hidden="true" />
              {String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}
            </span>
            {remaining < 10_000 && (
              <span className="text-caption text-warning-600 font-medium tabular">
                {t('assistant.secondsLeft', { count: Math.ceil(remaining / 1000) })}
              </span>
            )}
          </div>

          <div className="flex items-center gap-[3px] h-10" aria-hidden="true">
            {levels.map((l, i) => (
              <span
                key={i}
                className={`flex-1 rounded-full transition-[height] duration-75 ${state === 'cancelling' ? 'bg-danger-300' : 'bg-primary-400'}`}
                style={{ height: `${Math.max(8, l * 100)}%` }}
              />
            ))}
          </div>

          <p className={`text-small text-center font-medium ${state === 'cancelling' ? 'text-danger-500' : 'text-muted'}`}>
            {state === 'cancelling' ? t('assistant.releaseToCancel') : t('assistant.slideToCancel')}
          </p>
        </div>
      )}
    </>
  )
}
