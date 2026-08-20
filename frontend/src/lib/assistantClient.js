/**
 * SSE client for the assistant. EventSource can't POST — and a turn carries
 * a message list plus base64 photos — so the stream is read off a fetch body
 * instead.
 */

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function authHeaders() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/** Mirrors the 401 handling in services/api.js, which axios owns and this doesn't. */
function handleUnauthorized() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  window.dispatchEvent(new CustomEvent('auth:unauthorized'))
  const here = window.location.hash.replace(/^#/, '')
  if (here && !here.startsWith('/login')) sessionStorage.setItem('auth:returnTo', here)
  if (!here.startsWith('/login')) window.location.hash = '#/login?expired=1'
}

const OFFLINE_KEY = 'gramsathi:assistant:offline'

/**
 * The offline pack is cached the first time the app reaches the server, so a
 * later visit with no signal still has correct first-aid answers to give.
 */
export function cachedOfflineAnswer(text, lang = 'en') {
  try {
    const pack = JSON.parse(localStorage.getItem(`${OFFLINE_KEY}:${lang}`) || 'null')
    if (!pack) return null
    const lower = String(text || '').toLowerCase()
    const rule = pack.rules?.find(r => r.match.some(k => lower.includes(k)))
    return rule ? rule.text : pack.fallback
  } catch {
    return null
  }
}

export async function fetchAssistantConfig(lang) {
  const res = await fetch(`${BASE}/assistant/config?lang=${encodeURIComponent(lang || 'en')}`, {
    headers: authHeaders()
  })
  if (res.status === 401) { handleUnauthorized(); throw new Error('unauthorized') }
  if (!res.ok) throw new Error('config_failed')
  const config = await res.json()
  if (config.offline) {
    try { localStorage.setItem(`${OFFLINE_KEY}:${lang || 'en'}`, JSON.stringify(config.offline)) } catch { /* quota */ }
  }
  return config
}

/**
 * Calls `onEvent` for each server event as it arrives. Resolves when the
 * stream closes. Aborting via `signal` is a normal outcome, not an error —
 * that is the Stop button.
 */
export async function streamAssistant({ helpType, lang, messages, signal, onEvent }) {
  let res
  try {
    res = await fetch(`${BASE}/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ helpType, lang, messages }),
      signal
    })
  } catch (err) {
    if (signal?.aborted) return
    onEvent({ type: 'error', code: 'network' })
    return
  }

  if (res.status === 401) { handleUnauthorized(); onEvent({ type: 'error', code: 'unauthorized' }); return }
  if (!res.ok || !res.body) {
    onEvent({ type: 'error', code: res.status === 413 ? 'too_large' : 'network' })
    return
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  const drain = (frame) => {
    const line = frame.split('\n').find(l => l.startsWith('data:'))
    if (!line) return
    const payload = line.slice(5).trim()
    if (!payload) return
    try {
      onEvent(JSON.parse(payload))
    } catch {
      /* a frame we could not parse tells the user nothing useful */
    }
  }

  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true }).replace(/\r/g, '')
      let boundary
      while ((boundary = buffer.indexOf('\n\n')) !== -1) {
        drain(buffer.slice(0, boundary))
        buffer = buffer.slice(boundary + 2)
      }
    }
    if (buffer.trim()) drain(buffer)
  } catch (err) {
    if (signal?.aborted) return // Stop button, not a failure
    onEvent({ type: 'error', code: 'network' })
  }
}

/** Files travel as base64 without the data: prefix, matching the server contract. */
export const fileToInline = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve({ mimeType: file.type, data: String(reader.result).split(',')[1] })
  reader.onerror = reject
  reader.readAsDataURL(file)
})
