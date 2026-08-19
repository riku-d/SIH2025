/**
 * One status vocabulary for the whole app. Status is a stripe plus a
 * badge on a neutral surface — flooding the card background with the
 * status colour is what dropped body text below AA contrast.
 */
export function appointmentStatus(status, t) {
  const map = {
    pending:   { tone: 'warning', stripe: 'stripe-warning', key: 'pending' },
    confirmed: { tone: 'success', stripe: 'stripe-success', key: 'confirmed' },
    rejected:  { tone: 'danger',  stripe: 'stripe-danger',  key: 'rejected' },
    completed: { tone: 'info',    stripe: 'stripe-info',    key: 'completed' },
    cancelled: { tone: 'neutral', stripe: 'stripe-neutral', key: 'cancelled' }
  }
  const found = map[status] || { tone: 'neutral', stripe: 'stripe-neutral', key: 'unknown' }
  return { ...found, label: t ? t(`status.appointment.${found.key}`) : status }
}

export function orderStatus(status, t) {
  const map = {
    pending: 'warning', confirmed: 'info', preparing: 'info', ready: 'info',
    dispatched: 'info', delivered: 'success', cancelled: 'neutral'
  }
  const tone = map[status] || 'neutral'
  return { tone, label: t ? t(`status.order.${status}`, status) : status }
}

export const ORDER_FLOW = ['pending', 'confirmed', 'preparing', 'ready', 'dispatched', 'delivered']

export function formatDate(value, locale = undefined, opts) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(locale, opts || { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDateLong(value, locale = undefined) {
  return formatDate(value, locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export function formatFileSize(bytes) {
  if (!bytes) return '0 KB'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(1))} ${units[i]}`
}

export function isSameDay(a, b) {
  const d1 = new Date(a), d2 = new Date(b)
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate()
}

export function isToday(value) { return value ? isSameDay(value, new Date()) : false }
export function isFuture(value) { return value ? new Date(value) >= new Date(new Date().toDateString()) : false }
