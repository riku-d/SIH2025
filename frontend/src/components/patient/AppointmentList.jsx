import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api, { friendlyError } from '../../services/api'
import { useToast } from '../ui/Toast'
import AppointmentCard from '../AppointmentCard'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import Card, { CardBody } from '../ui/Card'
import { EmptyState } from '../ui/States'

export default function AppointmentList({ appointments, onChanged, emptyAction }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const toast = useToast()
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelling, setCancelling] = useState(false)

  const cancel = async () => {
    setCancelling(true)
    try {
      await api.put(`/appointments/${cancelTarget._id}/cancel`)
      toast.success(t('appointments.cancelled'))
      setCancelTarget(null)
      onChanged?.()
    } catch (err) {
      console.error('Cancel failed:', err)
      toast.error(friendlyError(err))
    } finally {
      setCancelling(false)
    }
  }

  if (!appointments.length) {
    return (
      <Card><CardBody>
        <EmptyState
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" />
            </svg>
          }
          title={t('appointments.empty')}
          message={t('appointments.emptyHelp')}
          action={emptyAction}
        />
      </CardBody></Card>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {appointments.map(appointment => (
          <AppointmentCard
            key={appointment._id}
            appointment={appointment}
            perspective="patient"
            actions={
              <>
                {appointment.status === 'confirmed' && (
                  <Button size="sm" onClick={() => navigate(`/patient/care/call/${appointment._id}`)}>
                    {t('appointments.joinConsultation')}
                  </Button>
                )}
                {['pending', 'confirmed'].includes(appointment.status) && (
                  <Button variant="ghost" size="sm" className="text-danger-500" onClick={() => setCancelTarget(appointment)}>
                    {t('appointments.cancelRequest')}
                  </Button>
                )}
              </>
            }
          />
        ))}
      </div>

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={cancel}
        loading={cancelling}
        title={t('appointments.cancelTitle')}
        message={t('appointments.cancelMessage')}
        confirmLabel={t('appointments.cancelConfirm')}
        cancelLabel={t('appointments.cancelKeep')}
      />
    </>
  )
}
