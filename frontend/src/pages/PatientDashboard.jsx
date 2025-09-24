import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Dashboard from '../components/Dashboard'
import SymptomChecker from '../components/SymptomChecker'
import VideoCall from '../components/VideoCall'
import ProfileSection from '../components/ProfileSection'
import AppointmentsList from '../components/AppointmentsList'
import HealthRecords from '../components/HealthRecords'
import api from '../services/api'

export default function PatientDashboard() {
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const location = useLocation()
  const [roomId, setRoomId] = useState('')
  const [activeTab, setActiveTab] = useState('profile')

  const handleJoinRoom = (appointmentId) => {
    setRoomId(appointmentId)
    setActiveTab('consultation')
  }

  useEffect(() => {
    if (location.state) {
      const { activeTab: stateTab, roomId: stateRoomId } = location.state
      if (stateTab) setActiveTab(stateTab)
      if (stateRoomId) setRoomId(stateRoomId)
      // Clear state after consuming to avoid repeated effects on navigation
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  const renderTabContent = () => {
    switch(activeTab) {
      case 'appointments':
        return <AppointmentsList onJoinRoom={handleJoinRoom} />;
      case 'profile':
        return <ProfileSection />;
      case 'records':
        return <HealthRecords />;
      case 'consultation':
        return (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="section-title">Video Consultation</div>
              <button 
                onClick={() => setActiveTab('appointments')} 
                className="text-sm text-blue-600 hover:underline"
              >
                Back to Appointments
              </button>
            </div>
            <VideoCall roomId={roomId} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dashboard title="Patient Dashboard">
      <div className="mb-6 border-b">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'profile' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Profile
          </button>
          {/* Find Doctors tab removed per requirements */}
          <button
            onClick={() => setActiveTab('appointments')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'appointments' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Appointments
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'records' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Health Records
          </button>
        </nav>
      </div>
      
      {renderTabContent()}
    </Dashboard>
  )
}


