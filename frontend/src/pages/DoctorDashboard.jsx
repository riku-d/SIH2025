import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import DashboardShell from '../components/DashboardShell'
import Today from '../components/doctor/Today'
import DoctorAppointments from '../components/doctor/DoctorAppointments'
import PatientTracker from '../components/PatientTracker'
import ProfileSection from '../components/ProfileSection'
import Button from '../components/ui/Button'
import { Loading } from '../components/ui/States'

const VideoCall = lazy(() => import('../components/VideoCall'))

const SECTIONS = ['index', 'requests', 'appointments', 'patients', 'profile']

export default function DoctorDashboard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  const segment = location.pathname.replace(/^\/doctor\/?/, '').split('/')[0]
  const active = SECTIONS.includes(segment) && segment ? segment : 'index'

  const sections = [
    { key: 'index',        label: t('doctor.sections.today') },
    { key: 'requests',     label: t('doctor.sections.requests') },
    { key: 'appointments', label: t('doctor.sections.appointments') },
    { key: 'patients',     label: t('doctor.sections.patients') },
    { key: 'profile',      label: t('doctor.sections.profile') }
  ]

  const joinRoom = (appointmentId) => navigate(`/doctor/consultation/${appointmentId}`)

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
    <DashboardShell title={t('doctor.title')} base="/doctor" sections={sections} active={active}>
      <Routes>
        <Route index element={<Today onJoinRoom={joinRoom} />} />
        <Route path="requests" element={<DoctorAppointments mode="requests" onJoinRoom={joinRoom} />} />
        <Route path="appointments" element={<DoctorAppointments mode="all" onJoinRoom={joinRoom} />} />
        <Route path="patients" element={<PatientTracker />} />
        <Route path="profile" element={<ProfileSection />} />
        <Route path="*" element={<Navigate to="/doctor" replace />} />
      </Routes>
    </DashboardShell>
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
        <Button variant="secondary" size="sm" onClick={() => navigate('/doctor')}>
          {t('consultation.back')}
        </Button>
      </div>
      <VideoCall roomId={appointmentId} perspective="doctor" onLeave={() => navigate('/doctor')} />
    </div>
  )
}
