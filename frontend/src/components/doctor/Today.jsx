import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import Alert from '../ui/Alert'
import Button from '../ui/Button'
import DoctorAppointments from './DoctorAppointments'

/**
 * The doctor's actual first question is "who am I seeing today" — the
 * data supported it all along (confirmedDate + timeSlot) and the old
 * reverse-chronological list of everything never answered it.
 */
export default function Today({ onJoinRoom }) {
  const { t } = useTranslation()
  const { userId } = useAuth()
  const navigate = useNavigate()
  const [pendingCount, setPendingCount] = useState(0)

  const load = useCallback(async () => {
    if (!userId) return
    try {
      const { data } = await api.get(`/appointments/doctor/${userId}`)
      setPendingCount((data || []).filter(a => a.status === 'pending').length)
    } catch (err) {
      console.error('Failed to count pending requests:', err)
    }
  }, [userId])

  useEffect(() => { load() }, [load])

  return (
    <div className="flex flex-col gap-5">
      {pendingCount > 0 && (
        <Alert
          tone="warning"
          title={t('doctor.today.pendingReview')}
          action={
            <Button size="sm" variant="secondary" onClick={() => navigate('/doctor/requests')}>
              {t('doctor.today.reviewNow')}
            </Button>
          }
        >
          {t('doctor.today.pendingReviewHelp', { count: pendingCount })}
        </Alert>
      )}

      <div>
        <h2 className="section-title mb-4">{t('doctor.today.title')}</h2>
        <DoctorAppointments mode="today" onJoinRoom={onJoinRoom} />
      </div>
    </div>
  )
}
