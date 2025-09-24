import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppointmentBooking from '../components/AppointmentBooking';

export default function BookAppointmentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  useEffect(() => {
    // Check if a doctor was passed via navigation state
    if (location.state && location.state.selectedDoctor) {
      setSelectedDoctor(location.state.selectedDoctor);
    }
  }, [location.state]);

  const handleJoinRoom = (appointmentId) => {
    // Navigate to patient dashboard with consultation tab
    navigate('/patient', { state: { activeTab: 'consultation', roomId: appointmentId } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container-app">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Book an Appointment</h1>
          <p className="text-slate-600 text-lg">Schedule a consultation with our qualified healthcare professionals</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <AppointmentBooking 
            onJoinRoom={handleJoinRoom} 
            selectedDoctor={selectedDoctor}
          />
        </div>
      </div>
    </div>
  );
}
