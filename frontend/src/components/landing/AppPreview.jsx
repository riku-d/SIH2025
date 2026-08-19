import React from 'react'
import { useTranslation } from 'react-i18next'

/**
 * The product shot, drawn in CSS rather than screenshotted — it shows the
 * real appointment card, stays sharp at any density, translates with the
 * rest of the page, and adds zero bytes to the download.
 */
export default function AppPreview() {
  const { t } = useTranslation()

  return (
    <div className="relative mx-auto w-[268px] sm:w-[300px]">
      <div
        aria-hidden="true"
        className="absolute -inset-10 rounded-full blur-3xl opacity-60"
        style={{ background: 'radial-gradient(circle, rgba(79,176,175,.55), transparent 68%)' }}
      />

      <div className="device relative animate-float">
        <div className="bg-ground">
          <div className="flex items-center justify-between px-4 pt-3 pb-2 text-[10px] font-semibold text-ink/70 tabular">
            <span>9:41</span>
            <span className="flex items-center gap-1">
              <span className="w-3.5 h-1.5 rounded-sm bg-ink/25" />
              <span className="w-4 h-2 rounded-[2px] border border-ink/30" />
            </span>
          </div>

          <div className="px-4 pb-3 flex items-center gap-2 border-b border-line">
            <span className="w-6 h-6 rounded-md bg-primary-600 text-white flex items-center justify-center text-[11px] font-bold">+</span>
            <span className="text-[13px] font-semibold text-ink">GramSathi</span>
          </div>

          <div className="p-3.5 space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              {t('patient.overview.nextAppointment')}
            </p>

            <div className="bg-surface rounded-xl border border-line border-l-[3px] border-l-success-500 p-3 shadow-rest">
              <div className="flex items-start gap-2.5 mb-2.5">
                <span className="w-8 h-8 shrink-0 rounded-full bg-primary-100 text-primary-700 text-[11px] font-bold flex items-center justify-center">
                  MS
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-semibold text-ink leading-tight">Dr. Meera Sharma</p>
                  <p className="text-[10px] text-muted">General Medicine</p>
                </div>
                <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-success-50 border border-success-100 text-success-600 text-[9px] font-bold">
                  {t('status.appointment.confirmed')}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] pt-2 border-t border-line-soft">
                <span className="text-muted">{t('appointments.timeSlot')}</span>
                <span className="font-semibold text-ink tabular">10:00–11:00</span>
              </div>
            </div>

            <div className="relative rounded-xl bg-ink aspect-[4/3] overflow-hidden flex items-center justify-center">
              <span className="absolute inset-0 opacity-40"
                    style={{ background: 'radial-gradient(circle at 50% 40%, rgba(79,176,175,.7), transparent 65%)' }} />
              <span className="relative w-11 h-11 rounded-full bg-white/15 border border-white/25 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.5-2.25v8.5L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </span>
              <span className="absolute bottom-2 left-2 right-2 flex items-center justify-center gap-1.5">
                <span className="w-6 h-6 rounded-full bg-white/20 border border-white/25" />
                <span className="w-6 h-6 rounded-full bg-white/20 border border-white/25" />
                <span className="w-6 h-6 rounded-full bg-danger-500" />
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              {['Home', 'Doctors', 'Records', 'Shop'].map((label, i) => (
                <span key={label} className="flex flex-col items-center gap-1 flex-1">
                  <span className={`w-4 h-4 rounded ${i === 0 ? 'bg-primary-600' : 'bg-line'}`} />
                  <span className={`text-[8px] ${i === 0 ? 'text-primary-600 font-semibold' : 'text-muted'}`}>{label}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="hidden sm:flex absolute -left-10 lg:-left-14 top-28 items-center gap-2 px-3 py-2 rounded-xl bg-white/95 backdrop-blur border border-line shadow-lifted">
        <span className="relative flex w-2 h-2">
          <span className="absolute inset-0 rounded-full bg-success-500 animate-pulse-ring" />
          <span className="relative w-2 h-2 rounded-full bg-success-500" />
        </span>
        <span className="text-[11px] font-semibold text-ink whitespace-nowrap">{t('landing.chipLive')}</span>
      </div>

      <div className="hidden sm:flex absolute -right-4 lg:-right-8 bottom-32 items-center gap-2 px-3 py-2 rounded-xl bg-white/95 backdrop-blur border border-line shadow-lifted">
        <span className="text-[13px]" aria-hidden="true">🩺</span>
        <span className="text-[11px] font-semibold text-ink whitespace-nowrap">{t('landing.chipLang')}</span>
      </div>
    </div>
  )
}
