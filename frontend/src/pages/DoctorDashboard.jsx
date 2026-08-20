import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Page from '../components/app/Page'
import Today from '../components/doctor/Today'
import DoctorAppointments from '../components/doctor/DoctorAppointments'
import PatientTracker from '../components/PatientTracker'
import ProfileSection from '../components/ProfileSection'
import Button from '../components/ui/Button'
import { Loading } from '../components/ui/States'

const VideoCall = lazy(() => import('../components/VideoCall'))

export default function DoctorDashboard() {
  const navigate = useNavigate()
  const joinRoom = (appointmentId) => navigate(`/doctor/call/${appointmentId}`)

  return (
    <Routes>
      <Route index element={<TodayRoute onJoinRoom={joinRoom} />} />
      <Route path="requests" element={<RequestsRoute onJoinRoom={joinRoom} />} />
      <Route path="appointments" element={<ScheduleRoute onJoinRoom={joinRoom} />} />
      <Route path="patients" element={<PatientsRoute />} />
      <Route path="profile" element={<ProfileRoute />} />
      <Route path="call/:appointmentId" element={<CallRoute />} />
      <Route path="consultation/:appointmentId" element={<LegacyCallRedirect />} />
      <Route path="*" element={<Navigate to="/doctor" replace />} />
    </Routes>
  )
}

function TodayRoute({ onJoinRoom }) {
  const { t } = useTranslation()
  return (
    <Page title={t('doctor.title')}>
      <Today onJoinRoom={onJoinRoom} />
    </Page>
  )
}

function RequestsRoute({ onJoinRoom }) {
  const { t } = useTranslation()
  return (
    <Page title={t('doctor.requests.title')} description={t('doctor.requests.description')}>
      <DoctorAppointments mode="requests" onJoinRoom={onJoinRoom} />
    </Page>
  )
}

function ScheduleRoute({ onJoinRoom }) {
  const { t } = useTranslation()
  return (
    <Page title={t('nav.doctor.appointments')}>
      <DoctorAppointments mode="all" onJoinRoom={onJoinRoom} />
    </Page>
  )
}

function PatientsRoute() {
  const { t } = useTranslation()
  return (
    <Page title={t('doctor.sections.patients')} description={t('records.selectPatientHelp')}>
      <PatientTracker />
    </Page>
  )
}

function ProfileRoute() {
  const { t } = useTranslation()
  return (
    <Page title={t('profile.title')} description={t('profile.subtitle')}>
      <ProfileSection />
    </Page>
  )
}

function CallRoute() {
  const { appointmentId } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h1 className="text-d3 text-ink">{t('consultation.title')}</h1>
        <Button variant="secondary" size="sm" onClick={() => navigate('/doctor')}>
          {t('consultation.back')}
        </Button>
      </div>
      <Suspense fallback={<Loading className="py-24" />}>
        <VideoCall
          roomId={appointmentId}
          perspective="doctor"
          // Ending a call hands straight to the record, instead of making
          // the doctor find the patient again in a separate section.
          onLeave={() => navigate('/doctor/patients', { state: { appointmentId } })}
        />
      </Suspense>
    </div>
  )
}

function LegacyCallRedirect() {
  const { appointmentId } = useParams()
  return <Navigate to={`/doctor/call/${appointmentId}`} replace />
}
