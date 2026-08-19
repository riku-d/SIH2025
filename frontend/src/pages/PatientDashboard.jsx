import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import DashboardShell from '../components/DashboardShell'
import Overview from '../components/patient/Overview'
import OrderHistory from '../components/patient/OrderHistory'
import AppointmentBooking from '../components/AppointmentBooking'
import HealthRecords from '../components/HealthRecords'
import ProfileSection from '../components/ProfileSection'
import EnhancedSymptomChecker from '../components/EnhancedSymptomChecker'
import Button from '../components/ui/Button'
import { Loading } from '../components/ui/States'

// Pulls in simple-peer and its polyfills, so it stays out of the main chunk.
const VideoCall = lazy(() => import('../components/VideoCall'))

const SECTIONS = ['index', 'appointments', 'symptoms', 'records', 'orders', 'profile']

export default function PatientDashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const location = useLocation()

  const segment = location.pathname.replace(/^\/patient\/?/, '').split('/')[0]
  const active = SECTIONS.includes(segment) && segment ? segment : 'index'

  const sections = [
    { key: 'index',        label: t('patient.sections.overview') },
    { key: 'appointments', label: t('patient.sections.appointments') },
    { key: 'symptoms',     label: t('patient.sections.symptoms') },
    { key: 'records',      label: t('patient.sections.records') },
    { key: 'orders',       label: t('patient.sections.orders') },
    { key: 'profile',      label: t('patient.sections.profile') }
  ]

  // The consultation takes over the page — tabs would be noise mid-call.
  if (segment === 'consultation') {
    return (
      <Suspense fallback={<Loading className="py-24" />}>
        <Routes>
          <Route path="consultation/:appointmentId" element={<ConsultationView />} />
        </Routes>
      </Suspense>
    )
  }

  return (
    <DashboardShell
      title={t('patient.title')}
      description={user?.name ? t('patient.welcome', { name: user.name }) : undefined}
      base="/patient"
      sections={sections}
      active={active}
    >
      <Routes>
        <Route index element={<Overview />} />
        <Route path="appointments" element={<AppointmentsSection />} />
        <Route path="symptoms" element={<EnhancedSymptomChecker />} />
        <Route path="records" element={<HealthRecords />} />
        <Route path="orders" element={<OrderHistory />} />
        <Route path="profile" element={<ProfileSection />} />
        <Route path="*" element={<Navigate to="/patient" replace />} />
      </Routes>
    </DashboardShell>
  )
}

function AppointmentsSection() {
  const navigate = useNavigate()
  const location = useLocation()
  return (
    <AppointmentBooking
      selectedDoctor={location.state?.doctor}
      onJoinRoom={(appointmentId) => navigate(`/patient/consultation/${appointmentId}`)}
    />
  )
}

function ConsultationView() {
  const { appointmentId } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <div className="container-app py-6 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h1 className="page-title">{t('consultation.title')}</h1>
        <Button variant="secondary" size="sm" onClick={() => navigate('/patient/appointments')}>
          {t('consultation.back')}
        </Button>
      </div>
      <VideoCall roomId={appointmentId} perspective="patient" onLeave={() => navigate('/patient/appointments')} />
    </div>
  )
}
