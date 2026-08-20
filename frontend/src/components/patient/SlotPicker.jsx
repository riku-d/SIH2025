import React, { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../services/api'
import { SLOTS, slotLabel, upcomingDays, dayLabel } from '../../lib/slots'
import Skeleton from '../ui/Skeleton'

/**
 * Pick a day, then a free hour.
 *
 * Replaces a bare <input type="date"> plus a free-text time box. Two reasons
 * that was the wrong control here: a date field on a low-end Android opens a
 * calendar widget that is genuinely hard to operate, and neither field showed
 * whether the doctor was actually free — so the patient guessed, the doctor
 * counter-proposed, and a booking took two round trips on a connection where
 * each one is expensive.
 *
 * Taken slots are shown struck through rather than hidden: seeing that the
 * morning is full is what makes the afternoon a choice rather than a mystery.
 */
export default function SlotPicker({ doctorId, value, onChange, error }) {
  const { t, i18n } = useTranslation()
  const [days] = useState(() => upcomingDays(7))
  const [availability, setAvailability] = useState(null)
  const [loading, setLoading] = useState(false)

  const selectedDay = value?.date || days[0].iso
  const selectedSlot = value?.slot || ''

  const load = useCallback(async () => {
    if (!doctorId || !selectedDay) return
    setLoading(true)
    try {
      const { data } = await api.get(`/appointments/doctor/${doctorId}/availability`, {
        params: { date: selectedDay }
      })
      setAvailability(data.slots)
    } catch {
      // Show every slot rather than none — the server rejects a genuine
      // clash on submit anyway, so guessing open beats blocking booking.
      setAvailability(SLOTS.map(slot => ({ slot, available: true })))
    } finally {
      setLoading(false)
    }
  }, [doctorId, selectedDay])

  useEffect(() => { load() }, [load])

  const pickDay = (iso) => onChange({ date: iso, slot: '' })
  const pickSlot = (slot) => onChange({ date: selectedDay, slot })

  const freeCount = availability?.filter(s => s.available).length ?? 0

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="label mb-2">{t('appointments.pickDay')}</p>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {days.map(day => {
            const active = day.iso === selectedDay
            return (
              <button
                key={day.iso}
                type="button"
                onClick={() => pickDay(day.iso)}
                aria-pressed={active}
                className={`shrink-0 min-w-[4.5rem] px-3 py-2.5 rounded-card border text-center transition-colors
                            ${active ? 'border-primary-500 bg-primary-50 text-primary-700'
                                     : 'border-line bg-surface hover:border-primary-200'}`}
              >
                <span className="block text-caption text-muted">{dayLabel(day, i18n.language, t)}</span>
                <span className={`block text-small font-semibold ${active ? 'text-primary-700' : 'text-ink'}`}>
                  {day.date.getDate()}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-2 mb-2">
          <p className="label mb-0">{t('appointments.pickTime')}</p>
          {!loading && availability && (
            <span className="text-caption text-muted">
              {freeCount > 0 ? t('appointments.slotsFree', { count: freeCount }) : t('appointments.noSlots')}
            </span>
          )}
        </div>

        {loading || !availability ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SLOTS.slice(0, 6).map(s => <Skeleton key={s} className="h-11 rounded-control" />)}
          </div>
        ) : (
          <div role="radiogroup" aria-label={t('appointments.pickTime')} className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {availability.map(({ slot, available }) => {
              const active = slot === selectedSlot
              return (
                <button
                  key={slot}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={!available}
                  onClick={() => pickSlot(slot)}
                  className={`px-2 py-2.5 rounded-control border text-small font-medium min-h-touch transition-colors
                              ${!available ? 'border-line-soft bg-surface-2 text-muted line-through cursor-not-allowed'
                                : active ? 'border-primary-500 bg-primary-600 text-white'
                                : 'border-line bg-surface text-ink hover:border-primary-300'}`}
                >
                  {slotLabel(slot, i18n.language)}
                </button>
              )
            })}
          </div>
        )}

        {freeCount === 0 && !loading && availability && (
          <p className="hint mt-2">{t('appointments.tryAnotherDay')}</p>
        )}
        {error && <p className="error-text mt-2">{error}</p>}
      </div>
    </div>
  )
}
