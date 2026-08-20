import React, { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import Card, { CardBody } from '../ui/Card'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Avatar from '../ui/Avatar'
import Skeleton from '../ui/Skeleton'
import { appointmentStatus, orderStatus, formatDate, isToday } from '../../lib/status'

const QUICK = [
  { key: 'checkSymptoms', to: '/patient/care/symptoms', icon: 'M12 8v4l2.5 2.5M12 3a9 9 0 100 18 9 9 0 000-18z' },
  { key: 'findDoctor',    to: '/patient/care/doctors',  icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { key: 'orderMedicine', to: '/patient/medicine',      icon: 'M10.5 20.5l10-10a5 5 0 00-7-7l-10 10a5 5 0 007 7zM8.5 8.5l7 7' }
]

/**
 * Answers the question a patient opens the app with — "what's happening
 * with my care?" — before offering anything else. The old home was a menu
 * of six equal doors, which made the user do the prioritising.
 */
export default function PatientHome() {
  const { t, i18n } = useTranslation()
  const { userId, user } = useAuth()
  const navigate = useNavigate()

  const [data, setData] = useState({ appointment: null, record: null, order: null })
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!userId) return
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

    setData({
      appointment: upcoming,
      record: records.status === 'fulfilled' ? (records.value.data || [])[0] : null,
      order: orders.status === 'fulfilled'
        ? (orders.value.data?.orders || []).find(o => !['delivered', 'cancelled'].includes(o.status))
        : null
    })
    setLoading(false)
  }, [userId])

  useEffect(() => { load() }, [load])

  const firstName = (user?.name || '').split(' ')[0]

  return (
    <div className="flex flex-col gap-7">
      <FocusCard loading={loading} appointment={data.appointment} navigate={navigate} t={t} lang={i18n.language} firstName={firstName} />

      <section>
        <h2 className="text-caption font-semibold text-muted uppercase tracking-wide mb-3">
          {t('patient.overview.quickActions')}
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {QUICK.map(a => (
            <Link key={a.key} to={a.to} className="group action-tile">
              <span className="action-icon">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d={a.icon} />
                </svg>
              </span>
              <span className="font-semibold text-ink flex-1">{t(`patient.overview.${a.key}`)}</span>
              <svg className="w-4 h-4 shrink-0 text-muted transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary-600"
                   fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6l6 6-6 6" />
              </svg>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <MiniCard
          label={t('patient.overview.latestRecord')}
          loading={loading}
          empty={!data.record}
          emptyText={t('patient.overview.noRecordHelp')}
          to="/patient/records"
          linkLabel={t('common.viewAll')}
        >
          {data.record && (
            <>
              <p className="text-caption text-muted mb-1.5">
                {formatDate(data.record.createdAt, i18n.language)}
                {data.record.appointmentId?.doctorId?.name && ` · ${data.record.appointmentId.doctorId.name}`}
              </p>
              <p className="text-body line-clamp-2">{data.record.diagnosis}</p>
            </>
          )}
        </MiniCard>

        <MiniCard
          label={t('patient.overview.activeOrder')}
          loading={loading}
          empty={!data.order}
          emptyText={t('patient.overview.noOrderHelp')}
          to={data.order ? `/patient/medicine/orders/${data.order._id}` : '/patient/medicine'}
          linkLabel={data.order ? t('common.viewDetails') : t('patient.overview.orderMedicine')}
        >
          {data.order && (
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-ink truncate">{data.order.orderId}</p>
                <p className="text-caption text-muted truncate">{data.order.pharmacyId?.name}</p>
                <p className="text-small text-body tabular mt-1">₹{data.order.totalAmount}</p>
              </div>
              <Badge tone={orderStatus(data.order.status, t).tone}>{orderStatus(data.order.status, t).label}</Badge>
            </div>
          )}
        </MiniCard>
      </div>
    </div>
  )
}

/** The one thing that needs attention, given the full width it deserves. */
function FocusCard({ loading, appointment, navigate, t, lang, firstName }) {
  if (loading) {
    return (
      <Card><CardBody className="py-7">
        <Skeleton className="h-3 w-32 mb-4" />
        <Skeleton className="h-6 w-3/5 mb-3" />
        <Skeleton className="h-4 w-2/5" />
      </CardBody></Card>
    )
  }

  if (!appointment) {
    return (
      <Card className="relative overflow-hidden aurora border-0">
        <div className="absolute inset-0 grid-lines" aria-hidden="true" />
        <CardBody className="relative py-8">
          <p className="text-caption font-semibold uppercase tracking-wide text-white/60 mb-2">
            {t('patient.home.greeting', { name: firstName })}
          </p>
          <h2 className="text-d3 text-white mb-2">{t('patient.home.nothingTitle')}</h2>
          <p className="text-white/70 mb-6 max-w-md">{t('patient.home.nothingBody')}</p>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <Button className="bg-white text-primary-700 hover:bg-primary-50" onClick={() => navigate('/patient/care/symptoms')}>
              {t('patient.overview.checkSymptoms')}
            </Button>
            <Button variant="ghost" className="text-white border border-white/25 hover:bg-white/10" onClick={() => navigate('/patient/care/doctors')}>
              {t('patient.overview.findDoctor')}
            </Button>
          </div>
        </CardBody>
      </Card>
    )
  }

  const status = appointmentStatus(appointment.status, t)
  const when = appointment.confirmedDate || appointment.requestedDate
  const ready = appointment.status === 'confirmed'
  const today = isToday(when)

  return (
    <Card className={`relative overflow-hidden ${ready ? 'aurora border-0' : ''}`}>
      {ready && <div className="absolute inset-0 grid-lines" aria-hidden="true" />}
      <CardBody className="relative py-7">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className={`text-caption font-semibold uppercase tracking-wide ${ready ? 'text-white/60' : 'text-muted'}`}>
            {t('patient.overview.nextAppointment')}
          </span>
          {today && ready && <Badge tone="warning">{t('common.today')}</Badge>}
        </div>

        <div className="flex items-start gap-4 mb-5">
          <Avatar
            name={appointment.doctorId?.name || '?'}
            size="lg"
            className={ready ? 'bg-white/15 text-white' : ''}
          />
          <div className="min-w-0">
            <h2 className={`text-h2 truncate ${ready ? 'text-white' : 'text-ink'}`}>
              {appointment.doctorId?.name}
            </h2>
            <p className={ready ? 'text-white/70' : 'text-muted'}>
              {appointment.doctorId?.specialization || t('doctors.generalPhysician')}
            </p>
            <p className={`mt-2 font-medium tabular ${ready ? 'text-white' : 'text-ink'}`}>
              {formatDate(when, lang)}
              {appointment.timeSlot && ` · ${appointment.timeSlot}`}
            </p>
          </div>
        </div>

        {ready ? (
          <div className="flex flex-col sm:flex-row gap-2.5">
            <Button
              className="bg-white text-primary-700 hover:bg-primary-50"
              onClick={() => navigate(`/patient/care/call/${appointment._id}`)}
            >
              {t('appointments.joinConsultation')}
            </Button>
            <Button variant="ghost" className="text-white border border-white/25 hover:bg-white/10" onClick={() => navigate('/patient/care')}>
              {t('patient.home.viewCare')}
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone={status.tone}>{status.label}</Badge>
            <p className="text-small text-muted">{t('patient.home.awaitingBody')}</p>
          </div>
        )}
      </CardBody>
    </Card>
  )
}

function MiniCard({ label, loading, empty, emptyText, to, linkLabel, children }) {
  return (
    <Card className="relative overflow-hidden">
      <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary-500 to-accent-400" aria-hidden="true" />
      <CardBody>
        <h3 className="text-caption font-semibold text-muted uppercase tracking-wide mb-3">{label}</h3>
        {loading ? (
          <div className="space-y-2"><Skeleton className="h-4 w-3/5" /><Skeleton className="h-3 w-4/5" /></div>
        ) : empty ? (
          <p className="text-small text-muted mb-3">{emptyText}</p>
        ) : children}
        <Link to={to} className="link text-small inline-block mt-3">{linkLabel}</Link>
      </CardBody>
    </Card>
  )
}
