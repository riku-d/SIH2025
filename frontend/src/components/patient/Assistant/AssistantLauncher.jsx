import React, { useState, useEffect, lazy, Suspense } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../../context/AuthContext'
import { Loading } from '../../ui/States'

// Only paid for when someone actually opens the assistant.
const AssistantChat = lazy(() => import('./AssistantChat'))

/**
 * The assistant, reachable from anywhere.
 *
 * The natural moment to ask "can I take this with my BP tablet?" is while
 * looking at the pharmacy shelf, not after navigating to a separate page.
 * The role nav is capped at four destinations, so a floating button — the
 * pattern EmergencyButton already establishes — is how this gets everywhere
 * without displacing something.
 *
 * It sits above the Emergency button rather than beside it: in a real
 * emergency the red one must stay exactly where muscle memory expects.
 */
export default function AssistantLauncher() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  // Redundant on the assistant's own page, and it would cover the composer.
  const onAssistantPage = location.pathname.startsWith('/patient/care/symptoms')

  useEffect(() => {
    if (!open) return
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = overflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!user || user.role !== 'patient' || onAssistantPage) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('assistant.launcher')}
        className="fixed right-4 lg:right-5 z-40 h-12 lg:h-14 px-4 lg:px-5 rounded-full
                   bottom-[calc(env(safe-area-inset-bottom)+9.5rem)] lg:bottom-[5.5rem]
                   bg-primary-600 text-white font-semibold shadow-lifted hover:bg-primary-500
                   transition-colors flex items-center gap-2"
      >
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15a3 3 0 003-3V6a3 3 0 10-6 0v6a3 3 0 003 3z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-14 0M12 18.5V22" />
        </svg>
        <span className="hidden sm:inline">{t('assistant.launcher')}</span>
      </button>

      {open && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/50 animate-fade-in"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t('assistant.title')}
            className="w-full sm:max-w-2xl bg-surface rounded-t-sheet sm:rounded-sheet shadow-sheet
                       flex flex-col animate-sheet-up sm:animate-rise-in
                       h-[88dvh] sm:h-[80dvh] max-h-[88dvh]"
          >
            <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-line shrink-0">
              <div className="min-w-0">
                <h2 className="card-title truncate">{t('assistant.title')}</h2>
                <p className="text-caption text-muted truncate">{t('assistant.subtitle')}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t('common.close', 'Close')}
                className="btn btn-icon btn-ghost shrink-0"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 min-h-0 px-4 sm:px-5 py-4">
              <Suspense fallback={<Loading className="py-16" />}>
                {/* Same conversation as the full page — one transcript,
                    whichever way it was opened. */}
                <AssistantChat compact />
              </Suspense>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
