import React, { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import Card, { CardBody } from '../ui/Card'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Skeleton from '../ui/Skeleton'
import { appointmentStatus, formatDate, orderStatus } from '../../lib/status'

const ACTIONS = [
  { key: 'findDoctor', to: '/doctors', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { key: 'checkSymptoms', to: '/patient/symptoms', icon: 'M12 8v4l2.5 2.5M12 3a9 9 0 100 18 9 9 0 000-18z' },
  { key: 'orderMedicine', to: '/pharmacies', icon: 'M10.5 20.5l10-10a5 5 0 00-7-7l-10 10a5 5 0 007 7zM8.5 8.5l7 7' }
]

/**
 * The dashboard used to open on the profile form. This answers the
 * question a patient actually signs in to ask: what is happening with
 * my care right now?
 */
export default function Overview() {
  const { t, i18n } = useTranslation()
  const { userId, user } = useAuth()
  const navigate = useNavigate()

  const [data, setData] = useState({ appointment: null, record: null, order: null })
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!userId) return
    try {
      // Individual failures shouldn't blank the whole page.
      const [appointments, records, orders] = await Promise.allSettled([
        api.get(`/appointments/patient/${userId}`),
        api.get(`/records/${userId}`),
        api.get('/pharmacy/my/patient-orders')
      ])

      const upcoming = appointments.status === 'fulfilled'
        ? (appointments.value.data || [])
            .filter(a => ['pending', 'confirmed'].includes(a.status))
            .sort((a, b) => new Date(a.confirmedDate || a.requestedDate) - new Date(b.confirmedDate || b.requestedDate))[0]
        : null

      const latestRecord = records.status === 'fulfilled' ? (records.value.data || [])[0] : null

      const activeOrder = orders.status === 'fulfilled'
        ? (orders.value.data?.orders || []).find(o => !['delivered', 'cancelled'].includes(o.status))
        : null

      setData({ appointment: upcoming, record: latestRecord, order: activeOrder })
    } catch (err) {
      console.error('Overview load failed:', err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { load() }, [load])

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="section-title mb-4">{t('patient.overview.quickActions')}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {ACTIONS.map(a => (
            <Link key={a.key} to={a.to} className="group action-tile">
              <span className="action-icon">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d={a.icon} />
                </svg>
              </span>
              <span className="font-semibold text-ink flex-1">{t(`patient.overview.${a.key}`)}</span>
              <svg
                className="w-4 h-4 shrink-0 text-muted transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary-600"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6l6 6-6 6" />
              </svg>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <SummaryCard
          title={t('patient.overview.nextAppointment')}
          loading={loading}
          empty={!data.appointment}
          emptyTitle={t('patient.overview.noAppointment')}
          emptyMessage={t('patient.overview.noAppointmentHelp')}
          emptyAction={<Button size="sm" onClick={() => navigate('/doctors')}>{t('patient.overview.findDoctor')}</Button>}
        >
          {data.appointment && (
            <>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <p className="font-medium text-ink truncate">{data.appointment.doctorId?.name}</p>
                  <p className="text-small text-muted truncate">
                    {data.appointment.doctorId?.specialization || t('doctors.generalPhysician')}
                  </p>
                </div>
                <Badge tone={appointmentStatus(data.appointment.status, t).tone}>
                  {appointmentStatus(data.appointment.status, t).label}
                </Badge>
              </div>
              <p className="text-small text-body">
                {formatDate(data.appointment.confirmedDate || data.appointment.requestedDate, i18n.language)}
                {data.appointment.timeSlot && <span className="tabular"> · {data.appointment.timeSlot}</span>}
              </p>
              <Link to="/patient/appointments" className="link text-small mt-3 inline-block">
                {t('common.viewAll')}
              </Link>
            </>
          )}
        </SummaryCard>

        <SummaryCard
          title={t('patient.overview.latestRecord')}
          loading={loading}
          empty={!data.record}
          emptyTitle={t('patient.overview.noRecord')}
          emptyMessage={t('patient.overview.noRecordHelp')}
        >
          {data.record && (
            <>
              <p className="text-small text-muted mb-1.5">
                {formatDate(data.record.createdAt, i18n.language)}
                {data.record.appointmentId?.doctorId?.name && ` · ${data.record.appointmentId.doctorId.name}`}
              </p>
              <p className="text-body line-clamp-3">{data.record.diagnosis}</p>
              <Link to="/patient/records" className="link text-small mt-3 inline-block">
                {t('common.viewAll')}
              </Link>
            </>
          )}
        </SummaryCard>

        <SummaryCard
          title={t('patient.overview.activeOrder')}
          loading={loading}
          empty={!data.order}
          emptyTitle={t('patient.overview.noOrder')}
          emptyMessage={t('patient.overview.noOrderHelp')}
          emptyAction={<Button size="sm" variant="secondary" onClick={() => navigate('/pharmacies')}>{t('patient.overview.orderMedicine')}</Button>}
        >
          {data.order && (
            <>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <p className="font-medium text-ink truncate">{data.order.orderId}</p>
                  <p className="text-small text-muted truncate">{data.order.pharmacyId?.name}</p>
                </div>
                <Badge tone={orderStatus(data.order.status, t).tone}>{orderStatus(data.order.status, t).label}</Badge>
              </div>
              <p className="text-small text-body tabular">₹{data.order.totalAmount}</p>
              <Link to={`/order-success/${data.order._id}`} className="link text-small mt-3 inline-block">
                {t('common.viewDetails')}
              </Link>
            </>
          )}
        </SummaryCard>
      </div>
    </div>
  )
}

function SummaryCard({ title, loading, empty, emptyTitle, emptyMessage, emptyAction, children }) {
  return (
    <Card className="relative overflow-hidden">
      <span
        className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary-500 to-accent-400"
        aria-hidden="true"
      />
      <CardBody>
        <h3 className="text-caption font-semibold text-muted uppercase tracking-wide mb-3">{title}</h3>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-2/5" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        ) : empty ? (
          <div>
            <p className="font-medium text-ink mb-1">{emptyTitle}</p>
            <p className="text-small text-muted mb-4">{emptyMessage}</p>
            {emptyAction}
          </div>
        ) : children}
      </CardBody>
    </Card>
  )
}
