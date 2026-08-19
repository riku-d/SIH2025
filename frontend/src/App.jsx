import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate, useLocation, Link } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import EmergencyButton from './components/EmergencyButton.jsx'
import { useAuth } from './context/AuthContext.jsx'
import { Loading } from './components/ui/States.jsx'

import LandingPage from './pages/LandingPage.jsx'
import LoginSignup from './pages/LoginSignup.jsx'

// Dashboards are the bulk of the bundle and only ever seen by one role
// each, so they load on demand rather than on first paint.
const PatientDashboard  = lazy(() => import('./pages/PatientDashboard.jsx'))
const DoctorDashboard   = lazy(() => import('./pages/DoctorDashboard.jsx'))
const HospitalDashboard = lazy(() => import('./pages/HospitalDashboard.jsx'))
const PharmacyDashboard = lazy(() => import('./pages/PharmacyDashboard.jsx'))
const DoctorsPage       = lazy(() => import('./pages/DoctorsPage.jsx'))
const DoctorDetails     = lazy(() => import('./pages/DoctorDetails.jsx'))
const PharmacyPage      = lazy(() => import('./pages/PharmacyPage.jsx'))
const PharmacyShop      = lazy(() => import('./pages/PharmacyShop.jsx'))
const CheckoutPage      = lazy(() => import('./pages/CheckoutPage.jsx'))
const OrderSuccess      = lazy(() => import('./pages/OrderSuccess.jsx'))

function NotFound() {
  return (
    <div className="container-app py-16">
      <div className="card max-w-lg mx-auto">
        <div className="card-body">
          <div className="text-center py-12 px-6">
            <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-full bg-surface-2 text-muted">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="M20 20l-3.5-3.5" />
              </svg>
            </div>
            <h1 className="card-title mb-1.5">Page not found</h1>
            <p className="text-small text-muted max-w-sm mx-auto mb-5">
              The page you're looking for doesn't exist or has moved.
            </p>
            <Link to="/" className="btn btn-primary">Go to home</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function PrivateRoute({ children, roles }) {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={`/${user.role}`} replace />
  }
  return children
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-ground">
      <a
        href="#main"
        className="sr-only-focusable absolute z-50 top-2 left-2 btn btn-primary btn-sm"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main" className="flex-1">
        <Suspense fallback={<Loading label="Loading…" className="py-24" />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginSignup />} />

            {/* Dashboard sections are nested so they live in the URL. */}
            <Route path="/patient/*"  element={<PrivateRoute roles={['patient']}><PatientDashboard /></PrivateRoute>} />
            <Route path="/doctor/*"   element={<PrivateRoute roles={['doctor']}><DoctorDashboard /></PrivateRoute>} />
            <Route path="/pharmacy/*" element={<PrivateRoute roles={['pharmacy']}><PharmacyDashboard /></PrivateRoute>} />
            <Route path="/hospital/*" element={<PrivateRoute roles={['hospital']}><HospitalDashboard /></PrivateRoute>} />

            {/* Existing patient routes, unchanged so no link breaks. */}
            <Route path="/doctors"                element={<PrivateRoute roles={['patient']}><DoctorsPage /></PrivateRoute>} />
            <Route path="/doctors/:doctorId"      element={<PrivateRoute roles={['patient']}><DoctorDetails /></PrivateRoute>} />
            <Route path="/pharmacies"             element={<PrivateRoute roles={['patient']}><PharmacyPage /></PrivateRoute>} />
            <Route path="/pharmacy-shop/:pharmacyId" element={<PrivateRoute roles={['patient']}><PharmacyShop /></PrivateRoute>} />
            <Route path="/checkout/:pharmacyId"   element={<PrivateRoute roles={['patient']}><CheckoutPage /></PrivateRoute>} />
            <Route path="/order-success/:orderId" element={<PrivateRoute roles={['patient']}><OrderSuccess /></PrivateRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <EmergencyButton />
    </div>
  )
}
