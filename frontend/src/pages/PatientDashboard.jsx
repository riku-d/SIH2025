import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Page from '../components/app/Page'
import PatientHome from '../components/patient/PatientHome'
import CarePage from '../components/patient/CarePage'
import BookingForm from '../components/patient/BookingForm'
import OrderHistory from '../components/patient/OrderHistory'
import HealthRecords from '../components/HealthRecords'
import ProfileSection from '../components/ProfileSection'
import AssistantChat from '../components/patient/Assistant/AssistantChat'
import DoctorsPage from './DoctorsPage'
import DoctorDetails from './DoctorDetails'
import PharmacyPage from './PharmacyPage'
import PharmacyShop from './PharmacyShop'
import CheckoutPage from './CheckoutPage'
import OrderSuccess from './OrderSuccess'
import Button from '../components/ui/Button'
import { Loading } from '../components/ui/States'

const VideoCall = lazy(() => import('../components/VideoCall'))

export default function PatientDashboard() {
  return (
    <Routes>
      <Route index element={<HomeRoute />} />

      {/* Care — the whole "see a doctor" journey lives under one destination. */}
      <Route path="care" element={<CarePage />} />
      <Route path="care/symptoms" element={<SymptomsRoute />} />
      <Route path="care/doctors" element={<DoctorsPage />} />
      <Route path="care/doctors/:doctorId" element={<DoctorDetails />} />
      <Route path="care/book" element={<BookRoute />} />
      <Route path="care/call/:appointmentId" element={<CallRoute />} />

      <Route path="records" element={<RecordsRoute />} />

      {/* Medicine — browsing, cart, checkout and orders as one destination. */}
      <Route path="medicine" element={<PharmacyPage />} />
      <Route path="medicine/orders" element={<OrdersRoute />} />
      <Route path="medicine/orders/:orderId" element={<OrderSuccess />} />
      <Route path="medicine/:pharmacyId" element={<PharmacyShop />} />
      <Route path="medicine/:pharmacyId/checkout" element={<CheckoutPage />} />

      <Route path="profile" element={<ProfileRoute />} />

      {/* Section paths from the previous tab structure. */}
      <Route path="appointments" element={<Navigate to="/patient/care" replace />} />
      <Route path="symptoms" element={<Navigate to="/patient/care/symptoms" replace />} />
      <Route path="orders" element={<Navigate to="/patient/medicine/orders" replace />} />
      <Route path="*" element={<Navigate to="/patient" replace />} />
    </Routes>
  )
}

function HomeRoute() {
  const { t } = useTranslation()
  return (
    <Page title={t('patient.title')}>
      <PatientHome />
    </Page>
  )
}

function SymptomsRoute() {
  const { t } = useTranslation()
  return (
    <Page title={t('assistant.title')} description={t('assistant.subtitle')} back={{ label: t('nav.patient.care') }}>
      <AssistantChat />
    </Page>
  )
}

function BookRoute() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  return (
    <Page title={t('appointments.book')} back="/patient/care">
      <BookingForm
        selectedDoctor={location.state?.doctor}
        prefillSymptoms={location.state?.symptoms}
        prefillMedia={location.state?.media}
        onBooked={() => navigate('/patient/care')}
      />
    </Page>
  )
}

function RecordsRoute() {
  const { t } = useTranslation()
  return (
    <Page title={t('records.title')} description={t('records.subtitle')}>
      <HealthRecords />
    </Page>
  )
}

function OrdersRoute() {
  const { t } = useTranslation()
  return (
    <Page title={t('patient.sections.orders')} back="/patient/medicine">
      <OrderHistory />
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
        <Button variant="secondary" size="sm" onClick={() => navigate('/patient/care')}>
          {t('consultation.back')}
        </Button>
      </div>
      <Suspense fallback={<Loading className="py-24" />}>
        <VideoCall roomId={appointmentId} perspective="patient" onLeave={() => navigate('/patient/care')} />
      </Suspense>
    </div>
  )
}
