import React from 'react'
import { useTranslation } from 'react-i18next'
import Avatar from './ui/Avatar'
import Button from './ui/Button'

/**
 * One doctor rendering for all three surfaces — the doctors page, the
 * dashboard list and the booking picker each had their own before, with
 * different fields and different capabilities.
 */
export default function DoctorCard({ doctor, onBook, onView, selected, onSelect, compact = false }) {
  const { t } = useTranslation()
  const specialization = doctor.specialization || t('doctors.generalPhysician')

  // Selectable variant is a radio, so it works with a keyboard and
  // announces itself properly. The old picker used clickable divs.
  if (onSelect) {
    return (
      <label
        className={`flex items-start gap-3 p-4 rounded-card border cursor-pointer transition-colors
                    ${selected ? 'border-primary-500 bg-primary-50' : 'border-line bg-surface hover:border-primary-200'}`}
      >
        <input
          type="radio"
          name="doctor"
          className="sr-only"
          checked={Boolean(selected)}
          onChange={() => onSelect(doctor)}
        />
        <Avatar name={doctor.name} src={doctor.profilePicture} size="sm" />
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-ink truncate">{doctor.name}</span>
          <span className="block text-caption text-muted truncate">{specialization}</span>
          {doctor.availability && (
            <span className="block text-caption text-muted mt-0.5 truncate">{doctor.availability}</span>
          )}
        </span>
        <span
          aria-hidden="true"
          className={`shrink-0 w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center
                      ${selected ? 'border-primary-600 bg-primary-600' : 'border-line'}`}
        >
          {selected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
        </span>
      </label>
    )
  }

  return (
    <article className={`card card-interactive flex flex-col ${compact ? '' : 'h-full'}`}>
      <div className="card-body flex flex-col flex-1">
        <div className="flex items-start gap-3.5 mb-4">
          <Avatar name={doctor.name} src={doctor.profilePicture} size="lg" />
          <div className="min-w-0 flex-1">
            <h3 className="card-title truncate">{doctor.name}</h3>
            <p className="text-small text-primary-600 font-medium truncate">{specialization}</p>
            {doctor.qualification && (
              <p className="text-caption text-muted mt-0.5 truncate">{doctor.qualification}</p>
            )}
          </div>
        </div>

        <dl className="text-caption text-muted space-y-1.5 mb-5 flex-1">
          {doctor.availability && (
            <div className="flex gap-2">
              <dt className="shrink-0">{t('doctors.availability')}:</dt>
              <dd className="text-body min-w-0">{doctor.availability}</dd>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-primary-600">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.55-2.27A1 1 0 0121 8.62v6.76a1 1 0 01-1.45.89L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="font-medium">{t('doctors.consultsOnline')}</span>
          </div>
        </dl>

        <div className="flex gap-2 mt-auto">
          {onView && (
            <Button variant="secondary" size="sm" className="flex-1" onClick={() => onView(doctor)}>
              {t('doctors.viewProfile')}
            </Button>
          )}
          {onBook && (
            <Button size="sm" className="flex-1" onClick={() => onBook(doctor)}>
              {t('doctors.bookAppointment')}
            </Button>
          )}
        </div>
      </div>
    </article>
  )
}
