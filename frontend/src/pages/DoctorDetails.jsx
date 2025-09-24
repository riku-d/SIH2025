import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function DoctorDetails() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Centralized booking on /book-appointment

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/users/doctor/${doctorId}`);
        setDoctor(response.data);
      } catch (err) {
        setError('Failed to load doctor details. Please try again later.');
        console.error('Error fetching doctor:', err);
      } finally {
        setLoading(false);
      }
    };

    if (doctorId) {
      fetchDoctor();
    }
  }, [doctorId]);

  const goToBookAppointment = () => {
    if (doctor) {
      navigate('/book-appointment', { state: { selectedDoctor: doctor } });
    }
  };

  if (loading) {
    return (
      <div className="container-app py-10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading doctor details...</p>
        </div>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="container-app py-10">
        <div className="card bg-red-50 border-red-200">
          <div className="card-body text-center">
            <div className="text-red-600 text-xl mb-2">⚠️ Error</div>
            <p className="text-red-700">{error || 'Doctor not found'}</p>
            <button 
              onClick={() => navigate('/doctors')}
              className="btn-primary mt-4"
            >
              Back to Doctors
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-app py-8">
      {/* Back Button */}
      <button 
        onClick={() => navigate('/doctors')}
        className="btn-secondary mb-6 flex items-center"
      >
        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"/>
        </svg>
        Back to Doctors
      </button>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Doctor Profile */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-body">
              {/* Doctor Header */}
              <div className="flex items-start mb-6">
                <div className="h-24 w-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mr-6">
                  {doctor.profilePicture ? (
                    <img 
                      src={doctor.profilePicture} 
                      alt={doctor.name} 
                      className="h-24 w-24 rounded-full object-cover"
                    />
                  ) : (
                    doctor.name.charAt(0)
                  )}
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-slate-800 mb-2">{doctor.name}</h1>
                  <p className="text-xl text-blue-600 font-semibold mb-2">{doctor.specialization || 'General Physician'}</p>
                  {doctor.qualification && (
                    <p className="text-slate-600 mb-2">{doctor.qualification}</p>
                  )}
                  <div className="flex items-center text-green-600">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="font-medium">Available for consultation</span>
                  </div>
                </div>
              </div>

              {/* Doctor Details */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-3">Professional Information</h3>
                  <div className="space-y-3">
                    {doctor.specialization && (
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-blue-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <div>
                          <span className="text-slate-600 text-sm">Specialization</span>
                          <p className="font-medium">{doctor.specialization}</p>
                        </div>
                      </div>
                    )}
                    
                    {doctor.qualification && (
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-blue-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.75 2.524z"/>
                        </svg>
                        <div>
                          <span className="text-slate-600 text-sm">Qualification</span>
                          <p className="font-medium">{doctor.qualification}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-blue-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                      </svg>
                      <div>
                        <span className="text-slate-600 text-sm">Email</span>
                        <p className="font-medium">{doctor.email}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-3">Availability</h3>
                  <div className="space-y-3">
                    {doctor.availability ? (
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                        </svg>
                        <div>
                          <span className="text-slate-600 text-sm">Available Hours</span>
                          <p className="font-medium text-green-700">{doctor.availability}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-600">Contact for availability</p>
                    )}

                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-2">Consultation Options</h4>
                      <div className="space-y-2">
                        <div className="flex items-center text-blue-700">
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                          </svg>
                          Video Consultation
                        </div>
                        <div className="flex items-center text-blue-700">
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                          </svg>
                          Chat Consultation
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Section */}
        <div className="lg:col-span-1">
          <div className="card sticky top-4">
            <div className="card-body">
              <h3 className="text-xl font-semibold text-slate-800 mb-4">Book Appointment</h3>
              <div className="text-center">
                <p className="text-slate-600 mb-6">Schedule a consultation with {doctor.name}</p>
                <button
                  onClick={goToBookAppointment}
                  className="w-full btn-primary py-3 text-lg font-semibold"
                >
                  Book Appointment
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}