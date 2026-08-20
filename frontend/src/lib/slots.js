/** Mirrors backend/config/slots.js — keep the two lists in step. */
export const SLOTS = [
  '09:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00',
  '14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00', '18:00-19:00'
]

/**
 * "09:00-10:00" reads as clock arithmetic. People say "9 – 10 AM", and for a
 * patient who reads little, fewer characters and a familiar am/pm is easier
 * than a 24-hour range.
 */
export function slotLabel(slot, lang = 'en') {
  const [from, to] = slot.split('-')
  return `${clock(from, lang)} – ${clock(to, lang)}`
}

function clock(hhmm, lang) {
  const [h] = hhmm.split(':').map(Number)
  const suffix = h < 12
    ? { en: 'AM', hi: 'सुबह', pa: 'ਸਵੇਰੇ' }[lang] || 'AM'
    : { en: 'PM', hi: 'शाम', pa: 'ਸ਼ਾਮ' }[lang] || 'PM'
  const twelve = h % 12 === 0 ? 12 : h % 12
  return lang === 'en' ? `${twelve} ${suffix}` : `${suffix} ${twelve}`
}

/** The next `count` days, starting today — what a patient realistically books. */
export function upcomingDays(count = 7) {
  const days = []
  for (let i = 0; i < count; i++) {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() + i)
    days.push({ date, iso: toISODate(date), offset: i })
  }
  return days
}

/** Local date, not toISOString — that shifts to UTC and can land a day early. */
export function toISODate(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function dayLabel(day, lang, t) {
  if (day.offset === 0) return t('appointments.today')
  if (day.offset === 1) return t('appointments.tomorrow')
  return day.date.toLocaleDateString(lang === 'en' ? 'en-IN' : lang, { weekday: 'short' })
}
