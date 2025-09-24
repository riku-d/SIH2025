import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function DoctorsList() {
  const navigate = useNavigate();
  const [doctorsBySpecialty, setDoctorsBySpecialty] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Add timestamp to prevent caching and ensure fresh data
        const timestamp = new Date().getTime();
        const response = await api.get(`/users/doctors/specialization?t=${timestamp}`);
        console.log('Fetched doctors from database (Dashboard):', response.data);
        
        setDoctorsBySpecialty(response.data || {});
        
        // Set the first specialty as selected by default if available
        const specialties = Object.keys(response.data || {});
        if (specialties.length > 0) {
          setSelectedSpecialty(specialties[0]);
        }
      } catch (err) {
        console.error('Error fetching doctors:', err);
        if (err.response?.status === 401) {
          setError('Please log in to view doctors.');
        } else if (err.response?.status === 403) {
          setError('You do not have permission to view doctors.');
        } else {
          setError(`Failed to load doctors: ${err.response?.data?.message || err.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  if (loading) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="section-title mb-4">Loading Doctors...</div>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="section-title mb-4">Error</div>
          <div className="text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  const specialties = Object.keys(doctorsBySpecialty);

  if (specialties.length === 0) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="section-title mb-4">No Doctors Available</div>
          <p>There are currently no doctors available in the system.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-body">
          <div className="section-title mb-4">Find Doctors by Specialty</div>
          
          <div className="flex flex-wrap gap-2 mb-6">
            {specialties.map(specialty => (
              <button
                key={specialty}
                onClick={() => setSelectedSpecialty(specialty)}
                className={`px-4 py-2 rounded-full text-sm ${selectedSpecialty === specialty 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {specialty}
              </button>
            ))}
          </div>
          
          {selectedSpecialty && (
            <div>
              <h3 className="font-medium text-lg mb-4">{selectedSpecialty} Specialists</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {doctorsBySpecialty[selectedSpecialty].map(doctor => (
                  <div key={doctor._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                        {doctor.profilePicture ? (
                          <img 
                            src={doctor.profilePicture} 
                            alt={doctor.name} 
                            className="h-16 w-16 rounded-full object-cover"
                          />
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{doctor.name}</h4>
                        <p className="text-sm text-gray-500">{doctor.specialization || 'General Physician'}</p>
                        {doctor.qualification && (
                          <p className="text-sm text-gray-500">{doctor.qualification}</p>
                        )}
                        <button
                          onClick={() => navigate('/book-appointment', { state: { selectedDoctor: doctor } })}
                          className="mt-2 text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                        >
                          Book Appointment
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}