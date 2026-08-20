import React from 'react'
import { useTranslation } from 'react-i18next'

/**
 * The empty state. A blank text box teaches a user nothing about what the
 * assistant can do — these are the same four affordances the old form had,
 * kept because they are the only thing on screen that answers "what can I
 * ask?". Tapping one seeds a real sentence the user edits rather than
 * writing from nothing.
 */
export const HELP_TYPES = [
  {
    value: 'medical_assistance', key: 'medicalAssistance',
    icon: 'M12 21s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 11c0 5.5-7 10-7 10z'
  },
  {
    value: 'prescription_reader', key: 'prescriptionReader',
    icon: 'M9 12h6m-6 4h4m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.6a1 1 0 01.7.3l5.4 5.4a1 1 0 01.3.7V19a2 2 0 01-2 2z'
  },
  {
    value: 'medicine_describer', key: 'medicineDescriber',
    icon: 'M10.5 20.5l10-10a5 5 0 00-7-7l-10 10a5 5 0 007 7zM8.5 8.5l7 7'
  },
  {
    value: 'report_analyzer', key: 'reportAnalyzer',
    icon: 'M4 19V5m0 14h16M8 16V9m4 7V6m4 10v-4'
  }
]

export default function StarterCards({ onPick, greeting, canSpeak, onSpeak }) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-5 py-2">
      {greeting && (
        <div className="flex flex-col items-start gap-1.5">
          <p className="text-base text-ink font-medium max-w-prose">{greeting}</p>
          {/* The assistant introduces itself out loud on request. For a user
              who cannot read, this is the only part of the empty state that
              tells them what to do. */}
          {canSpeak && (
            <button
              type="button"
              onClick={() => onSpeak(greeting)}
              className="inline-flex items-center gap-1.5 px-2 py-1 -ml-2 rounded-control text-caption
                         text-primary-700 hover:bg-primary-50 transition-colors min-h-touch"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5L6.5 9H4a1 1 0 00-1 1v4a1 1 0 001 1h2.5L11 19V5zM15.5 9.5a3.5 3.5 0 010 5M18 7a7 7 0 010 10" />
              </svg>
              {t('assistant.playGreeting')}
            </button>
          )}
        </div>
      )}

      <div>
        <h2 className="text-caption font-semibold text-muted uppercase tracking-wide mb-1">
          {t('assistant.starterTitle')}
        </h2>
        <p className="hint mb-3">{t('assistant.starterHint')}</p>

        <div className="grid gap-2.5 sm:grid-cols-2">
          {HELP_TYPES.map(h => (
            <button
              key={h.value}
              type="button"
              onClick={() => onPick(h.value, t(`assistant.seeds.${h.key}`))}
              onContextMenu={(e) => {
                // Long-press on touch raises the context menu; intercept it
                // and read the card aloud instead.
                if (!canSpeak) return
                e.preventDefault()
                onSpeak(`${t(`symptomChecker.helpTypes.${h.key}`)}. ${t(`symptomChecker.helpHints.${h.key}`)}`)
              }}
              className="group flex items-start gap-3 p-3.5 text-left rounded-card border border-line
                         bg-surface hover:border-primary-300 hover:bg-primary-50 transition-colors
                         min-h-touch focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              <span className="shrink-0 w-9 h-9 rounded-control flex items-center justify-center
                               bg-surface-2 text-muted group-hover:bg-primary-600 group-hover:text-white
                               transition-colors">
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d={h.icon} />
                </svg>
              </span>
              <span className="min-w-0">
                <span className="block text-small font-semibold text-ink">
                  {t(`symptomChecker.helpTypes.${h.key}`)}
                </span>
                <span className="block text-caption text-muted mt-0.5">
                  {t(`symptomChecker.helpHints.${h.key}`)}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
