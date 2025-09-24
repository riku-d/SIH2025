import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import LandingPage from './pages/LandingPage.jsx'
import LoginSignup from './pages/LoginSignup.jsx'
import PatientDashboard from './pages/PatientDashboard.jsx'
import DoctorDashboard from './pages/DoctorDashboard.jsx'
import PharmacyDashboard from './pages/PharmacyDashboard.jsx'
import DoctorsPage from './pages/DoctorsPage.jsx'
import DoctorDetails from './pages/DoctorDetails.jsx'

function NotFound() {
  return (
    <div className="container-app py-10">
      <div className="card"><div className="card-body">
        <div className="section-title mb-2">Page not found</div>
        <p className="text-slate-600">The page you are looking for does not exist.</p>
      </div></div>
    </div>
  )
}

const PrivateRoute = ({ children, roles }) => {
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  if (!token || !user) return <Navigate to="/login" />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />
  return children
}

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginSignup />} />
          <Route path="/patient" element={<PrivateRoute roles={["patient"]}><PatientDashboard /></PrivateRoute>} />
          <Route path="/doctor" element={<PrivateRoute roles={["doctor"]}><DoctorDashboard /></PrivateRoute>} />
          <Route path="/pharmacy" element={<PrivateRoute roles={["pharmacy"]}><PharmacyDashboard /></PrivateRoute>} />
          <Route path="/doctors" element={<PrivateRoute roles={["patient"]}><DoctorsPage /></PrivateRoute>} />
          <Route path="/doctors/:doctorId" element={<PrivateRoute roles={["patient"]}><DoctorDetails /></PrivateRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </div>
  )
}


