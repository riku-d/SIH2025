import React, { useEffect, useState } from 'react'
import Dashboard from '../components/Dashboard'
import VideoCall from '../components/VideoCall'
import ProfileSection from '../components/ProfileSection'
import PatientTracker from '../components/PatientTracker'
import DoctorAppointmentManager from '../components/DoctorAppointmentManager'
import api from '../services/api'

export default function DoctorDashboard() {
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const [selected, setSelected] = useState(null)
  const [activeTab, setActiveTab] = useState('appointments')
  
  const handleJoinRoom = (appointmentId) => {
    setSelected(appointmentId)
    setActiveTab('consultation')
  }

  const renderTabContent = () => {
    switch(activeTab) {
      case 'appointments':
        return <DoctorAppointmentManager onJoinRoom={handleJoinRoom} />;
      case 'consultation':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="section-title">Video Consultation</div>
              <button 
                onClick={() => setActiveTab('appointments')} 
                className="btn-secondary"
              >
                Back to Appointments
              </button>
            </div>
            <VideoCall roomId={`${selected}`} />
          </div>
        );
      case 'profile':
        return <ProfileSection />;
      case 'patients':
        return <PatientTracker />;
      default:
        return null;
    }
  };

  return (
    <Dashboard title="Doctor Dashboard">
      <div className="mb-6 border-b">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'appointments' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Appointments
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'profile' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('patients')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'patients' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Patient Tracker
          </button>
        </nav>
      </div>
      
      {renderTabContent()}
    </Dashboard>
  )
}


