import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import Page from '../app/Page'
import Button from '../ui/Button'
import Card, { CardBody } from '../ui/Card'
import AppointmentList from './AppointmentList'
import { SkeletonList } from '../ui/Skeleton'
import { ErrorState } from '../ui/States'

const PAST = ['completed', 'rejected', 'cancelled']

/**
 * Care is one destination covering the whole "see a doctor" journey.
 * Upcoming/Past are genuine sub-views of the same list, which is what
 * tabs are actually for.
 */
export default function CarePage() {
  const { t } = useTranslation()
  const { userId } = useAuth()
  const navigate = useNavigate()

  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [tab, setTab] = useState('upcoming')

  const load = useCallback(async () => {
    if (!userId) return
    setLoadError(false)
    try {
      const { data } = await api.get(`/appointments/patient/${userId}`)
      setAppointments(data || [])
    } catch (err) {
      console.error('Failed to load appointments:', err)
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { load() }, [load])

  const upcoming = useMemo(() => appointments.filter(a => !PAST.includes(a.status)), [appointments])
  const past = useMemo(() => appointments.filter(a => PAST.includes(a.status)), [appointments])
  const visible = tab === 'upcoming' ? upcoming : past

  const bookButton = (
    <Button onClick={() => navigate('/patient/care/book')}>
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
      </svg>
      {t('appointments.book')}
    </Button>
  )

  return (
    <Page
      title={t('care.title')}
      description={t('care.subtitle')}
      actions={bookButton}
      tabs={[
        { key: 'upcoming', label: t('common.upcoming'), badge: upcoming.length },
        { key: 'past', label: t('common.past') }
      ]}
      activeTab={tab}
      onTabChange={setTab}
    >
      {loading ? (
        <SkeletonList count={2} />
      ) : loadError ? (
        <Card><CardBody><ErrorState onRetry={load} retryLabel={t('common.retry')} /></CardBody></Card>
      ) : (
        <AppointmentList
          appointments={visible}
          onChanged={load}
          emptyAction={tab === 'upcoming' ? bookButton : null}
        />
      )}
    </Page>
  )
}
