import React from 'react'
import { useTranslation } from 'react-i18next'
import Badge from './ui/Badge'
import Avatar from './ui/Avatar'
import { appointmentStatus, formatDate } from '../lib/status'

/**
 * Status is a left stripe plus one badge on a neutral surface. The doctor
 * view previously applied the same background+text+border triple to the
 * card and the badge, so pending cards were yellow text on yellow.
 */
export default function AppointmentCard({ appointment, perspective = 'patient', actions, children }) {
  const { t, i18n } = useTranslation()
  const status = appointmentStatus(appointment.status, t)

  const person = perspective === 'patient' ? appointment.doctorId : appointment.patientId
  const subtitle = perspective === 'patient'
    ? (appointment.doctorId?.specialization || t('doctors.generalPhysician'))
    : [appointment.patientId?.age && `${appointment.patientId.age}`, appointment.patientId?.village]
        .filter(Boolean).join(' · ')

  return (
    <article className={`card stripe ${status.stripe}`}>
      <div className="card-body">
        <div className="flex items-start gap-3 mb-4">
          <Avatar name={person?.name || '?'} size="md" />
          <div className="min-w-0 flex-1">
            <h3 className="card-title truncate">{person?.name || t('records.unknownDoctor')}</h3>
            {subtitle && <p className="text-small text-muted truncate">{subtitle}</p>}
          </div>
          <Badge tone={status.tone}>{status.label}</Badge>
        </div>

        <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2 text-small mb-4">
          <div className="flex justify-between gap-3 sm:block">
            <dt className="text-muted">
              {appointment.confirmedDate ? t('appointments.confirmedDate') : t('appointments.requestedDate')}
            </dt>
            <dd className="text-ink font-medium sm:mt-0.5">
              {formatDate(appointment.confirmedDate || appointment.requestedDate, i18n.language)}
            </dd>
          </div>
          {appointment.timeSlot && (
            <div className="flex justify-between gap-3 sm:block">
              <dt className="text-muted">{t('appointments.timeSlot')}</dt>
              <dd className="text-ink font-medium tabular sm:mt-0.5">{appointment.timeSlot}</dd>
            </div>
          )}
          <div className="flex justify-between gap-3 sm:block">
            <dt className="text-muted">{t('appointments.type')}</dt>
            <dd className="text-ink font-medium sm:mt-0.5">
              {t(`appointments.${appointment.consultationType === 'chat' ? 'chat' : 'video'}`)}
            </dd>
          </div>
          <div className="flex justify-between gap-3 sm:block">
            <dt className="text-muted">{t('appointments.requestedOn')}</dt>
            <dd className="text-body sm:mt-0.5">{formatDate(appointment.createdAt, i18n.language)}</dd>
          </div>
        </dl>

        {appointment.symptoms && (
          <div className="mb-4">
            <h4 className="text-caption font-semibold text-muted uppercase tracking-wide mb-1.5">
              {perspective === 'doctor' ? t('appointments.patientSymptoms') : t('appointments.symptoms')}
            </h4>
            <p className="text-small text-body bg-surface-2 rounded-control p-3">{appointment.symptoms}</p>
          </div>
        )}

        {appointment.doctorNotes && appointment.status === 'confirmed' && (
          <div className="mb-4">
            <h4 className="text-caption font-semibold text-muted uppercase tracking-wide mb-1.5">
              {t('appointments.doctorNotes')}
            </h4>
            <p className="text-small text-body bg-primary-50 rounded-control p-3">{appointment.doctorNotes}</p>
          </div>
        )}

        {appointment.rejectionReason && (
          <div className="mb-4">
            <h4 className="text-caption font-semibold text-danger-500 uppercase tracking-wide mb-1.5">
              {t('appointments.declineReason')}
            </h4>
            <p className="text-small text-body bg-danger-50 rounded-control p-3">{appointment.rejectionReason}</p>
          </div>
        )}

        {children}

        {actions && <div className="flex flex-wrap gap-2 pt-4 border-t border-line-soft">{actions}</div>}
      </div>
    </article>
  )
}
