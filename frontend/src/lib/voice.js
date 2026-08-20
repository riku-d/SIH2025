/**
 * Voice input and output.
 *
 * Recording rather than the Web Speech API: SpeechRecognition is absent on
 * iOS Safari and unreliable for pa-IN, so it can never be the only path.
 * The recorder works wherever MediaRecorder does, and the audio goes to the
 * same model that already reads prescriptions.
 */

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

/** Safari has never supported webm; mp4 is its equivalent. */
function pickMimeType() {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']
  return candidates.find(type => window.MediaRecorder?.isTypeSupported?.(type)) || ''
}

export const MAX_RECORDING_MS = 60_000
const SILENCE_MS = 2000
const SILENCE_LEVEL = 0.045

export function isRecordingSupported() {
  return Boolean(navigator.mediaDevices?.getUserMedia && window.MediaRecorder)
}

/**
 * The mic needs a secure context. On a plain-http demo URL getUserMedia is
 * simply undefined, which looks like a broken button rather than a missing
 * prerequisite — so it is worth naming.
 */
export function isSecureContextForMic() {
  return window.isSecureContext || location.hostname === 'localhost' || location.hostname === '127.0.0.1'
}

/**
 * Starts recording. Resolves with a handle; `stop()` returns the blob and
 * `cancel()` throws it away — the slide-to-cancel gesture must not leave a
 * recording behind.
 */
export async function startRecording({ onLevel, onAutoStop } = {}) {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 }
  })

  const mimeType = pickMimeType()
  const recorder = new MediaRecorder(stream, {
    ...(mimeType ? { mimeType } : {}),
    // Opus at 16kbps is about 20KB for ten seconds — cheaper than the
    // photos these users already upload over the same connection.
    audioBitsPerSecond: 16_000
  })

  const chunks = []
  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }

  // Level metering: silence on screen reads as "it isn't hearing me".
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  const analyser = audioCtx.createAnalyser()
  analyser.fftSize = 512
  audioCtx.createMediaStreamSource(stream).connect(analyser)
  const buffer = new Uint8Array(analyser.frequencyBinCount)

  let timer = null
  let silenceSince = null
  let cancelled = false
  const startedAt = Date.now()

  const tick = () => {
    analyser.getByteTimeDomainData(buffer)
    let sum = 0
    for (let i = 0; i < buffer.length; i++) {
      const v = (buffer[i] - 128) / 128
      sum += v * v
    }
    const level = Math.sqrt(sum / buffer.length)
    onLevel?.(level)

    const elapsed = Date.now() - startedAt
    if (elapsed > MAX_RECORDING_MS) { clearInterval(timer); onAutoStop?.('max_duration'); return }

    // Only start counting silence once they have actually said something,
    // so a slow start does not end the recording before it begins.
    if (elapsed > 1200) {
      if (level < SILENCE_LEVEL) {
        silenceSince = silenceSince ?? Date.now()
        if (Date.now() - silenceSince > SILENCE_MS) { clearInterval(timer); onAutoStop?.('silence'); return }
      } else {
        silenceSince = null
      }
    }
  }

  const teardown = () => {
    if (timer) clearInterval(timer)
    stream.getTracks().forEach(track => track.stop())
    audioCtx.close().catch(() => {})
  }

  recorder.start()
  /**
   * setInterval, not requestAnimationFrame: rAF stops entirely in a
   * backgrounded tab, so a user who switched apps mid-recording would keep
   * recording past the 60-second cap with no silence detection at all.
   */
  timer = setInterval(tick, 60)

  return {
    get mimeType() { return recorder.mimeType || mimeType || 'audio/webm' },
    durationMs: () => Date.now() - startedAt,
    stop: () => new Promise(resolve => {
      if (recorder.state === 'inactive') { teardown(); resolve(null); return }
      recorder.onstop = () => {
        teardown()
        resolve(cancelled ? null : new Blob(chunks, { type: recorder.mimeType || mimeType || 'audio/webm' }))
      }
      recorder.stop()
    }),
    cancel: () => {
      cancelled = true
      if (recorder.state !== 'inactive') recorder.stop()
      teardown()
    }
  }
}

const blobToBase64 = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(String(reader.result).split(',')[1])
  reader.onerror = reject
  reader.readAsDataURL(blob)
})

/** Sends the recording for transcription. Returns { text, lang, urgent }. */
export async function transcribe(blob, lang, signal) {
  const data = await blobToBase64(blob)
  const token = localStorage.getItem('token')

  const res = await fetch(`${BASE}/assistant/transcribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ mimeType: blob.type || 'audio/webm', data, lang }),
    signal
  })

  if (!res.ok) {
    const err = new Error('transcription_failed')
    err.code = res.status === 429 ? 'rate_limit' : 'transcription_failed'
    throw err
  }
  return res.json()
}

/* ---------------------------------------------------------------- speech out */

const BCP47 = { en: 'en-IN', hi: 'hi-IN', pa: 'pa-IN' }

/**
 * Device voices vary a lot: Hindi is common, Punjabi frequently missing
 * entirely. Callers use this to decide whether to offer read-aloud rather
 * than presenting a speaker button that does nothing.
 */
export function voiceFor(lang) {
  const wanted = BCP47[lang] || BCP47.en
  const voices = window.speechSynthesis?.getVoices?.() || []
  if (!voices.length) return null
  const prefix = wanted.split('-')[0]
  return voices.find(v => v.lang === wanted)
      || voices.find(v => v.lang?.replace('_', '-').startsWith(prefix))
      || null
}

export function canSpeak(lang) {
  return Boolean(window.speechSynthesis) && Boolean(voiceFor(lang))
}

/** Voices load asynchronously in Chrome; without this the first call is silent. */
export function primeVoices() {
  if (!window.speechSynthesis) return Promise.resolve([])
  const existing = window.speechSynthesis.getVoices()
  if (existing.length) return Promise.resolve(existing)
  return new Promise(resolve => {
    const done = () => resolve(window.speechSynthesis.getVoices())
    window.speechSynthesis.addEventListener('voiceschanged', done, { once: true })
    setTimeout(done, 1000)
  })
}

export function stopSpeaking() {
  window.speechSynthesis?.cancel()
}

/**
 * Speaks a short summary — never the full markdown answer, which is
 * unlistenable and takes minutes.
 */
export function speak(text, lang, { onEnd } = {}) {
  if (!window.speechSynthesis || !text) return false
  stopSpeaking()

  const utterance = new SpeechSynthesisUtterance(stripMarkdown(text))
  const voice = voiceFor(lang)
  if (voice) utterance.voice = voice
  utterance.lang = voice?.lang || BCP47[lang] || BCP47.en
  utterance.rate = 0.95 // a touch slower: these are instructions, not prose
  utterance.onend = () => onEnd?.()
  utterance.onerror = () => onEnd?.()

  window.speechSynthesis.speak(utterance)
  return true
}

/** Asterisks and hashes read aloud as "asterisk"; strip them before speaking. */
function stripMarkdown(text) {
  return String(text)
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[*_#>`]/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}
