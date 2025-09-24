import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function DoctorsPage() {
  const [doctorsBySpecialty, setDoctorsBySpecialty] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  

  // Booking modal state (date-only)
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [consultationType, setConsultationType] = useState('video');
  const [symptoms, setSymptoms] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingMessage, setBookingMessage] = useState({ text: '', type: '' });

  const fetchDoctors = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      // Add timestamp to prevent caching and ensure fresh data
      const timestamp = new Date().getTime();
      const response = await api.get(`/users/doctors/specialization?t=${timestamp}`);
      console.log('Fetched doctors from database:', response.data);
      
      setDoctorsBySpecialty(response.data || {});
      setLastUpdated(new Date());
      
      // Set the first specialty as selected by default if available and not refreshing
      if (!isRefresh) {
        const specialties = Object.keys(response.data || {});
        if (specialties.length > 0) {
          setSelectedSpecialty(specialties[0]);
        }
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
      setRefreshing(false);
    }
  };

  const formatAvailability = (availability) => {
    if (!availability) return '';
    // If backend returns an array of day slots [{day,startTime,endTime}, ...]
    if (Array.isArray(availability)) {
      if (availability.length === 0) return '';
      const dayOrder = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
      const toShort = (d) => (d || '').toString().slice(0,3).toUpperCase();
      // group by time window key
      const groups = {};
      for (const slot of availability) {
        if (!slot || typeof slot !== 'object') continue;
        const day = (slot.day || '').toString().toLowerCase();
        const st = slot.startTime || '';
        const et = slot.endTime || '';
        const key = `${st}-${et}`;
        const idx = dayOrder.indexOf(day);
        if (idx >= 0) {
          if (!groups[key]) groups[key] = [];
          groups[key].push(idx);
        }
      }
      const formatRanges = (indices) => {
        const daysSorted = [...new Set(indices)].sort((a,b)=>a-b);
        const parts = [];
        let start = daysSorted[0];
        let prev = daysSorted[0];
        for (let i=1;i<daysSorted.length;i++){
          const cur = daysSorted[i];
          if (cur === prev + 1) {
            prev = cur;
            continue;
          }
          const len = prev - start + 1;
          if (len >= 3) parts.push(`${toShort(dayOrder[start])}-${toShort(dayOrder[prev])}`);
          else {
            for (let d=start; d<=prev; d++) parts.push(toShort(dayOrder[d]));
          }
          start = prev = cur;
        }
        const len = prev - start + 1;
        if (len >= 3) parts.push(`${toShort(dayOrder[start])}-${toShort(dayOrder[prev])}`);
        else { for (let d=start; d<=prev; d++) parts.push(toShort(dayOrder[d])); }
        return parts;
      };
      const segments = [];
      for (const key of Object.keys(groups)){
        const daySegments = formatRanges(groups[key]);
        const timeLabel = key === '-' ? '' : key; // if times empty
        segments.push(`${daySegments.join(', ')}${timeLabel ? ` ${timeLabel}` : ''}`);
      }
      return segments.join('; ');
    }
    // If it's a string already
    if (typeof availability === 'string') return availability;
    // As a fallback for objects
    try {
      return JSON.stringify(availability);
    } catch (_) {
      return '';
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleRefresh = () => {
    fetchDoctors(true);
  };

  // Get all doctors as flat array for search
  const allDoctors = Object.values(doctorsBySpecialty).flat();
  const specialties = Object.keys(doctorsBySpecialty);

  // Filter doctors based on search and specialty
  const getFilteredDoctors = () => {
    let doctors = selectedSpecialty ? doctorsBySpecialty[selectedSpecialty] || [] : allDoctors;
    
    if (searchTerm) {
      doctors = doctors.filter(doctor => 
        doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doctor.specialization && doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    return doctors;
  };
  
  const filteredDoctors = getFilteredDoctors();

  const handleViewProfile = (doctor) => {
    setSelectedDoctor(doctor);
  };
  
  const handleBookAppointment = (doctor) => {
    setBookingDoctor(doctor);
    setAppointmentDate('');
    setConsultationType('video');
    setSymptoms('');
    setBookingMessage({ text: '', type: '' });
    setBookingOpen(true);
  };
  
  const handleCloseModal = () => {
    setSelectedDoctor(null);
  };

  // Helpers for availability
  const getDayName = (date) => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  };

  const isDateAvailable = (doctor, date) => {
    if (!doctor || !doctor.availability || !Array.isArray(doctor.availability) || doctor.availability.length === 0) {
      return true; // allow all dates if no structured availability
    }
    const dayName = getDayName(date);
    return doctor.availability.some(slot => slot.day === dayName);
  };


  const submitBooking = async (e) => {
    e.preventDefault();
    if (!bookingDoctor || !appointmentDate) {
      setBookingMessage({ text: 'Please select a date.', type: 'error' });
      return;
    }
    setBookingLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const payload = {
        doctorId: bookingDoctor._id,
        patientId: user.id || user._id,
        requestedDate: appointmentDate,
        consultationType,
        symptoms
      };
      await api.post('/appointments/book', payload);
      setBookingMessage({ text: 'Appointment request submitted successfully!', type: 'success' });
      // close after short delay
      setTimeout(() => {
        setBookingOpen(false);
      }, 1200);
    } catch (err) {
      setBookingMessage({ text: err.response?.data?.message || 'Error submitting appointment request', type: 'error' });
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container-app py-10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading doctors...</p>
        </div>
      </div>
    );
  }

  // no full-page error return; show inline alert instead

  return (
    <div className="container-app py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-800 mb-2">Find a Doctor</h1>
            <p className="text-slate-600 text-lg">Connect with qualified healthcare professionals in your area</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all ${
              refreshing 
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 active:bg-blue-200'
            }`}
          >
            <svg 
              className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="card mb-8">
        <div className="card-body">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">Search Doctors</label>
              <input
                type="text"
                placeholder="Search by name or specialization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input"
              />
            </div>
            <div className="md:w-64">
              <label className="block text-sm font-medium text-slate-700 mb-2">Filter by Specialty</label>
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="input"
              >
                <option value="">All Specialties</option>
                {specialties.map(specialty => (
                  <option key={specialty} value={specialty}>
                    {specialty}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="mb-6 flex justify-between items-center">
        <p className="text-slate-600">
          Found {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? 's' : ''}
          {selectedSpecialty && ` in ${selectedSpecialty}`}
        </p>
        {lastUpdated && (
          <p className="text-sm text-slate-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Doctors Grid */}
      {filteredDoctors.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-12">
            <div className="text-slate-400 text-6xl mb-4">👨‍⚕️</div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">No doctors found</h3>
            <p className="text-slate-600">Try adjusting your search criteria</p>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map(doctor => (
            <div key={doctor._id} className="card hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="card-body">
                {/* Doctor Avatar */}
                <div className="flex items-center mb-4">
                  <div className="h-16 w-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mr-4">
                    {doctor.profilePicture ? (
                      <img 
                        src={doctor.profilePicture} 
                        alt={doctor.name} 
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    ) : (
                      doctor.name.charAt(0)
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-slate-800">{doctor.name}</h3>
                    <p className="text-blue-600 font-medium">{doctor.specialization || 'General Physician'}</p>
                  </div>
                </div>

                {/* Doctor Info */}
                <div className="space-y-2 mb-4">
                  {doctor.qualification && (
                    <div className="flex items-center text-slate-600">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.75 2.524z"/>
                      </svg>
                      <span className="text-sm">{doctor.qualification}</span>
                    </div>
                  )}
                  
                  {doctor.availability && (
                    <div className="flex items-center text-slate-600">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                      </svg>
                      <span className="text-sm">Available: {formatAvailability(doctor.availability) || 'Contact for availability'}</span>
                    </div>
                  )}

                  <div className="flex items-center text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm font-medium">Available for consultation</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewProfile(doctor)}
                    className="flex-1 btn-secondary py-2 font-semibold"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleBookAppointment(doctor)}
                    className="flex-1 btn-primary py-2 font-semibold"
                  >
                    Book Appointment
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Doctor Detail Modal */}
      {selectedDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Doctor Details</h2>
                <button
                  onClick={handleCloseModal}
                  className="text-slate-500 hover:text-slate-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              {/* Doctor Profile */}
              <div className="flex items-start mb-6">
                <div className="h-20 w-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mr-6 flex-shrink-0">
                  {selectedDoctor.profilePicture ? (
                    <img 
                      src={selectedDoctor.profilePicture} 
                      alt={selectedDoctor.name} 
                      className="h-20 w-20 rounded-full object-cover"
                    />
                  ) : (
                    selectedDoctor.name.charAt(0)
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{selectedDoctor.name}</h3>
                  <p className="text-lg text-blue-600 font-semibold mb-1">{selectedDoctor.specialization || 'General Physician'}</p>
                  {selectedDoctor.qualification && (
                    <p className="text-slate-600 mb-2">{selectedDoctor.qualification}</p>
                  )}
                  <div className="flex items-center text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm font-medium">Available for consultation</span>
                  </div>
                </div>
              </div>
              
              {/* Doctor Information */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold text-slate-800 mb-3">Professional Information</h4>
                  <div className="space-y-3">
                    {selectedDoctor.specialization && (
                      <div className="flex items-center">
                        <svg className="w-4 h-4 text-blue-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <div>
                          <span className="text-slate-600 text-xs">Specialization</span>
                          <p className="font-medium text-sm">{selectedDoctor.specialization}</p>
                        </div>
                      </div>
                    )}
                    
                    {selectedDoctor.qualification && (
                      <div className="flex items-center">
                        <svg className="w-4 h-4 text-blue-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.75 2.524z"/>
                        </svg>
                        <div>
                          <span className="text-slate-600 text-xs">Qualification</span>
                          <p className="font-medium text-sm">{selectedDoctor.qualification}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-blue-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                      </svg>
                      <div>
                        <span className="text-slate-600 text-xs">Email</span>
                        <p className="font-medium text-sm">{selectedDoctor.email}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-800 mb-3">Availability</h4>
                  <div className="space-y-3">
                    {selectedDoctor.availability ? (
                      <div className="flex items-center">
                        <svg className="w-4 h-4 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                        </svg>
                        <div>
                          <span className="text-slate-600 text-xs">Available Hours</span>
                          <p className="font-medium text-green-700 text-sm">{formatAvailability(selectedDoctor.availability) || 'Contact for availability'}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-600 text-sm">Contact for availability</p>
                    )}

                    <div className="p-3 bg-blue-50 rounded-lg">
                      <h5 className="font-semibold text-blue-800 mb-2 text-sm">Consultation Options</h5>
                      <div className="space-y-1">
                        <div className="flex items-center text-blue-700 text-sm">
                          <svg className="w-3 h-3 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                          </svg>
                          Video Consultation
                        </div>
                        <div className="flex items-center text-blue-700 text-sm">
                          <svg className="w-3 h-3 mr-2" fill="currentColor" viewBox="0 0 20 20">
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
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 btn-secondary py-3"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleCloseModal();
                    handleBookAppointment(selectedDoctor);
                  }}
                  className="flex-1 btn-primary py-3"
                >
                  Book Appointment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {bookingOpen && bookingDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Book Appointment</h2>
                <button onClick={() => setBookingOpen(false)} className="text-slate-500 hover:text-slate-700 text-2xl">×</button>
              </div>

              {bookingMessage.text && (
                <div className={`mb-4 p-3 rounded ${bookingMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {bookingMessage.text}
                </div>
              )}

              <div className="mb-4">
                <div className="flex items-center">
                  <div className="h-12 w-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-lg font-bold mr-3">
                    {bookingDoctor.name?.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">{bookingDoctor.name}</div>
                    <div className="text-blue-600 text-sm">{bookingDoctor.specialization || 'General Physician'}</div>
                  </div>
                </div>
              </div>

              <form onSubmit={submitBooking} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Date</label>
                  <input
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => {
                      const dateVal = e.target.value;
                      if (dateVal && !isDateAvailable(bookingDoctor, new Date(dateVal))) {
                        setBookingMessage({ text: `Dr. ${bookingDoctor.name} is not available on this day.`, type: 'error' });
                        setAppointmentDate('');
                      } else {
                        setAppointmentDate(dateVal);
                        setBookingMessage({ text: '', type: '' });
                      }
                    }}
                    className="input"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                {/* Time slots removed; doctor will assign specific time */}

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Consultation Type</label>
                    <select
                      value={consultationType}
                      onChange={(e) => setConsultationType(e.target.value)}
                      className="input"
                    >
                      <option value="video">Video Call</option>
                      <option value="chat">Chat</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Symptoms (Optional)</label>
                    <input
                      type="text"
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      className="input"
                      placeholder="Describe symptoms..."
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button type="button" onClick={() => setBookingOpen(false)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" className="btn-primary flex-1 disabled:opacity-60" disabled={bookingLoading}>
                    {bookingLoading ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
