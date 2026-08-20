import React, { Suspense, lazy, useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation, useParams, Link } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import AppShell from './components/app/AppShell.jsx'
import EmergencyButton from './components/EmergencyButton.jsx'
import AssistantLauncher from './components/patient/Assistant/AssistantLauncher.jsx'
import { useAuth } from './context/AuthContext.jsx'
import api from './services/api.js'
import { Loading } from './components/ui/States.jsx'

import LandingPage from './pages/LandingPage.jsx'
import LoginSignup from './pages/LoginSignup.jsx'

const PatientDashboard  = lazy(() => import('./pages/PatientDashboard.jsx'))
const DoctorDashboard   = lazy(() => import('./pages/DoctorDashboard.jsx'))
const HospitalDashboard = lazy(() => import('./pages/HospitalDashboard.jsx'))
const PharmacyDashboard = lazy(() => import('./pages/PharmacyDashboard.jsx'))

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

/** Signed-in routes get the app chrome; marketing routes get the header. */
function AppArea({ roles, children }) {
  const { user } = useAuth()
  const [badges, setBadges] = useState({})

  // The Requests badge is real information the doctor needs before they
  // navigate, so the shell fetches it rather than each page.
  useEffect(() => {
    if (user?.role !== 'doctor') return
    let cancelled = false

    const refresh = () => api.get(`/appointments/doctor/${user.id || user._id}`)
      .then(({ data }) => {
        if (cancelled) return
        setBadges({ pendingRequests: (data || []).filter(a => a.status === 'pending').length })
      })
      .catch(() => { /* the badge is an enhancement, not a blocker */ })

    refresh()

    // Confirming a request used to leave the count stale until a full
    // reload, so a doctor who had just cleared their queue still saw
    // unread-style badges telling them work was waiting.
    window.addEventListener('appointments:changed', refresh)
    return () => {
      cancelled = true
      window.removeEventListener('appointments:changed', refresh)
    }
  }, [user])

  return (
    <PrivateRoute roles={roles}>
      <AppShell badges={badges}>
        <Suspense fallback={<Loading className="py-24" />}>{children}</Suspense>
      </AppShell>
    </PrivateRoute>
  )
}

function MarketingArea({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-ground">
      <Navbar />
      <main id="main" className="flex-1">{children}</main>
    </div>
  )
}

/** Keeps links from the previous structure working. */
function RedirectWithParam({ build }) {
  const params = useParams()
  return <Navigate to={build(params)} replace />
}

export default function App() {
  return (
    <>
      <a href="#main" className="sr-only-focusable absolute z-50 top-2 left-2 btn btn-primary btn-sm">
        Skip to content
      </a>

      <Routes>
        <Route path="/" element={<MarketingArea><LandingPage /></MarketingArea>} />
        <Route path="/login" element={<MarketingArea><LoginSignup /></MarketingArea>} />

        <Route path="/patient/*"  element={<AppArea roles={['patient']}><PatientDashboard /></AppArea>} />
        <Route path="/doctor/*"   element={<AppArea roles={['doctor']}><DoctorDashboard /></AppArea>} />
        <Route path="/pharmacy/*" element={<AppArea roles={['pharmacy']}><PharmacyDashboard /></AppArea>} />
        <Route path="/hospital/*" element={<AppArea roles={['hospital']}><HospitalDashboard /></AppArea>} />

        {/* Previous top-level patient routes. */}
        <Route path="/doctors" element={<Navigate to="/patient/care/doctors" replace />} />
        <Route path="/doctors/:doctorId" element={<RedirectWithParam build={p => `/patient/care/doctors/${p.doctorId}`} />} />
        <Route path="/pharmacies" element={<Navigate to="/patient/medicine" replace />} />
        <Route path="/pharmacy-shop/:pharmacyId" element={<RedirectWithParam build={p => `/patient/medicine/${p.pharmacyId}`} />} />
        <Route path="/checkout/:pharmacyId" element={<RedirectWithParam build={p => `/patient/medicine/${p.pharmacyId}/checkout`} />} />
        <Route path="/order-success/:orderId" element={<RedirectWithParam build={p => `/patient/medicine/orders/${p.orderId}`} />} />

        <Route path="*" element={<MarketingArea><NotFound /></MarketingArea>} />
      </Routes>

      <AssistantLauncher />
      <EmergencyButton />
    </>
  )
}
