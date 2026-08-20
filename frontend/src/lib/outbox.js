/**
 * Keeps a message the user has already said from being lost.
 *
 * On a rural connection a request fails often, and re-recording a voice note
 * or re-typing a sentence in Devanagari on a cheap phone is expensive enough
 * that people give up instead. So a send is optimistic: the message appears
 * immediately, carries its own state, and survives a reload while pending.
 *
 * Deliberately not an automatic retry loop — a health question resent
 * silently ten minutes later, answered while nobody is looking, is worse
 * than one the user chooses to send again.
 */
const KEY = 'gramsathi:assistant:outbox'

export const SEND_STATE = {
  SENDING: 'sending',
  SENT: 'sent',
  FAILED: 'failed'
}

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

function write(entries) {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries.slice(-10)))
  } catch {
    /* full or unavailable — the in-memory copy still works this session */
  }
}

/** Records a message as in-flight. Text only: photos are too big to park here. */
export function enqueue(userId, message) {
  if (!userId) return
  const entries = read().filter(e => e.id !== message.id)
  entries.push({
    id: message.id,
    userId,
    text: message.text,
    hadFiles: Boolean(message.files?.length),
    viaVoice: Boolean(message.viaVoice),
    at: Date.now()
  })
  write(entries)
}

export function resolve(userId, messageId) {
  write(read().filter(e => !(e.userId === userId && e.id === messageId)))
}

/**
 * Anything still queued from a previous session was interrupted — the tab
 * closed or the app was killed mid-send. It never got an answer.
 */
export function takePending(userId) {
  const entries = read()
  const mine = entries.filter(e => e.userId === userId)
  write(entries.filter(e => e.userId !== userId))
  return mine
}

export function clear(userId) {
  write(read().filter(e => e.userId !== userId))
}
