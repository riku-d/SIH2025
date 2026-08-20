import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import Modal from './ui/Modal'

const SERVICES = [
  { key: 'ambulance', number: '108' },
  { key: 'emergency', number: '112' },
  { key: 'health',    number: '104' }
]

/**
 * Was an alert() saying "Emergency services contacted!" — which was not
 * true and is a dangerous thing to tell someone in a crisis. Now it
 * surfaces the real national numbers as tap-to-call links.
 */
export default function EmergencyButton() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  if (!user || user.role !== 'patient') return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-4 lg:right-5 z-40 h-12 lg:h-14 px-4 lg:px-5 rounded-full
                   bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] lg:bottom-5
                   bg-danger-500 text-white font-semibold shadow-lifted hover:bg-danger-600
                   transition-colors flex items-center gap-2"
      >
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h2.2a1 1 0 011 .77l.8 3.4a1 1 0 01-.53 1.1l-1.4.7a11 11 0 006 6l.7-1.4a1 1 0 011.1-.53l3.4.8a1 1 0 01.77 1V17a2 2 0 01-2 2A16 16 0 013 5z" />
        </svg>
        {t('emergency.button')}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t('emergency.title')}
        description={t('emergency.description')}
        size="sm"
      >
        <ul className="flex flex-col gap-2">
          {SERVICES.map(s => (
            <li key={s.number}>
              <a
                href={`tel:${s.number}`}
                className="flex items-center justify-between gap-4 p-4 rounded-card border border-line
                           hover:border-danger-500 hover:bg-danger-50 transition-colors min-h-touch"
              >
                <span className="font-medium text-ink">{t(`emergency.services.${s.key}`)}</span>
                <span className="text-h3 font-semibold text-danger-500 tabular">{s.number}</span>
              </a>
            </li>
          ))}
        </ul>
        <p className="hint mt-4">{t('emergency.note')}</p>
      </Modal>
    </>
  )
}
