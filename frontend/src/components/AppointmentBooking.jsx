import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function AppointmentBooking({ onJoinRoom, selectedDoctor: doctorFromProps }) {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [consultationType, setConsultationType] = useState('video');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [userAppointments, setUserAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');

  useEffect(() => {
    if (user) {
      loadDoctors();
      loadUserAppointments();
    }
  }, []);

  // Handle doctor from props
  useEffect(() => {
    if (doctorFromProps && doctors.length > 0) {
      const doctor = doctors.find(d => d._id === doctorFromProps._id);
      if (doctor) {
        setSelectedDoctor(doctor);
      }
    }
  }, [doctorFromProps, doctors]);

  const loadDoctors = async () => {
    try {
      const response = await api.get('/users/doctors/specialization');
      // Convert grouped doctors to flat array
      const doctorsList = Object.values(response.data).flat();
      setDoctors(doctorsList);
    } catch (error) {
      setMessage({ text: 'Error loading doctors', type: 'error' });
      console.error('Error loading doctors:', error);
    }
  };

  const loadUserAppointments = async () => {
    try {
      const { data } = await api.get(`/appointments/patient/${user.id || user._id}`);
      setUserAppointments(data);
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  };

  const handleDoctorSelect = (doctor) => {
    setSelectedDoctor(doctor);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedDoctor || !appointmentDate) {
      setMessage({ text: 'Please select a doctor and date', type: 'error' });
      return;
    }

    if (selectedDoctor.role === 'doctor' && !selectedTimeSlot) {
      setMessage({ text: 'Please select an available time slot', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const appointmentData = {
        doctorId: selectedDoctor._id,
        patientId: user.id || user._id, // Handle both 'id' and '_id' fields
        requestedDate: appointmentDate,
        symptoms: symptoms,
        consultationType: consultationType,
        timeSlot: selectedTimeSlot,
      };

      const response = await api.post('/appointments/book', appointmentData);
      setMessage({ 
        text: 'Appointment request submitted successfully! The doctor will review and confirm your appointment.', 
        type: 'success' 
      });
      
      // Reset form
      setAppointmentDate('');
      setSymptoms('');
      setSelectedDoctor(null);
      
      // Reload appointments
      loadUserAppointments();
    } catch (error) {
      console.error('Error booking appointment:', error);
      setMessage({ 
        text: error.response?.data?.message || 'Error submitting appointment request', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getDayName = (date) => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  };

  const isDateAvailable = (date) => {
    if (!selectedDoctor || !selectedDoctor.availability || selectedDoctor.availability.length === 0) {
      return true; // No availability set, so all dates are potentially available
    }
    const dayName = getDayName(date);
    return selectedDoctor.availability.some(slot => slot.day === dayName);
  };

  const getAvailableTimeSlots = (date) => {
    if (!selectedDoctor || !selectedDoctor.availability || selectedDoctor.availability.length === 0) {
      return [];
    }
    const dayName = getDayName(date);
    const dayAvailability = selectedDoctor.availability.find(slot => slot.day === dayName);

    if (!dayAvailability) {
      return [];
    }

    const slots = [];
    let currentStart = new Date(`2000-01-01T${dayAvailability.startTime}:00`);
    const end = new Date(`2000-01-01T${dayAvailability.endTime}:00`);

    while (currentStart.getTime() + 60 * 60 * 1000 <= end.getTime()) {
      const slotEnd = new Date(currentStart.getTime() + 60 * 60 * 1000);
      slots.push({
        startTime: currentStart.toTimeString().substring(0, 5),
        endTime: slotEnd.toTimeString().substring(0, 5),
      });
      currentStart = slotEnd;
    }
    return slots;
  };

  const getStatusInfo = (appointment) => {
    switch (appointment.status) {
      case 'pending':
        return {
          text: 'Under Review',
          class: 'bg-yellow-100 text-yellow-800',
          icon: '⏳'
        };
      case 'confirmed':
        return {
          text: 'Confirmed',
          class: 'bg-green-100 text-green-800',
          icon: '✅'
        };
      case 'rejected':
        return {
          text: 'Rejected',
          class: 'bg-red-100 text-red-800',
          icon: '❌'
        };
      case 'completed':
        return {
          text: 'Completed',
          class: 'bg-blue-100 text-blue-800',
          icon: '✓'
        };
      case 'cancelled':
        return {
          text: 'Cancelled',
          class: 'bg-gray-100 text-gray-800',
          icon: '🚫'
        };
      default:
        return {
          text: appointment.status,
          class: 'bg-gray-100 text-gray-800',
          icon: '❓'
        };
    }
  };

  return (
    <div className="space-y-6">
      {message.text && (
        <div className={`p-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="card">
        <div className="card-body">
          <div className="section-title mb-4">Book an Appointment</div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Doctor</label>
              <div className="grid md:grid-cols-2 gap-2">
                {doctors.map(doctor => (
                  <div 
                    key={doctor._id} 
                    onClick={() => handleDoctorSelect(doctor)}
                    className={`p-3 border rounded-lg cursor-pointer ${selectedDoctor && selectedDoctor._id === doctor._id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
                  >
                    <div className="font-medium">{doctor.name}</div>
                    <div className="text-sm text-gray-500">{doctor.specialization || 'General Physician'}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Date</label>
                <input 
                  type="date" 
                  value={appointmentDate}
                  onChange={(e) => {
                    const date = new Date(e.target.value);
                    if (selectedDoctor && !isDateAvailable(date)) {
                      setMessage({ text: `Dr. ${selectedDoctor.name} is not available on this day.`, type: 'error' });
                      setAppointmentDate('');
                      setSelectedTimeSlot('');
                    } else {
                      setAppointmentDate(e.target.value);
                      setSelectedTimeSlot(''); // Reset time slot when date changes
                      setMessage({ text: '', type: '' });
                    }
                  }}
                  className="w-full p-2 border rounded"
                  min={new Date().toISOString().split('T')[0]}
                />
                {selectedDoctor && appointmentDate && isDateAvailable(new Date(appointmentDate)) && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Available Time Slots</label>
                    <div className="flex flex-wrap gap-2">
                      {getAvailableTimeSlots(new Date(appointmentDate)).map((slot, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setSelectedTimeSlot(`${slot.startTime}-${slot.endTime}`)}
                          className={`px-4 py-2 rounded-md text-sm font-medium ${selectedTimeSlot === `${slot.startTime}-${slot.endTime}` ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                        >
                          {slot.startTime} - {slot.endTime}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Type</label>
                <select
                  value={consultationType}
                  onChange={(e) => setConsultationType(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="video">Video Call</option>
                  <option value="chat">Chat</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Symptoms (Optional)</label>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="w-full p-2 border rounded"
                rows="3"
                placeholder="Describe your symptoms..."
              ></textarea>
            </div>

            <button 
              type="submit" 
              className="btn-primary disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Submitting Request...' : 'Submit Appointment Request'}
            </button>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="section-title mb-4">Your Appointments</div>
          
          {userAppointments.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-4">📅</div>
              <p className="text-gray-500">You don't have any appointments yet.</p>
              <p className="text-sm text-gray-400 mt-2">Book an appointment with a doctor to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {userAppointments.map(appointment => {
                const statusInfo = getStatusInfo(appointment);
                return (
                  <div key={appointment._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-slate-800">
                          {appointment.doctorId?.name || 'Unknown Doctor'}
                        </h3>
                        <p className="text-blue-600 font-medium">
                          {appointment.doctorId?.specialization || 'General Physician'}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.class}`}>
                        {statusInfo.icon} {statusInfo.text}
                      </span>
                    </div>
                    
                    {/* Appointment Details Grid */}
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Appointment Details</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Requested Date:</span>
                            <span className="text-sm font-medium">{formatDate(appointment.requestedDate)}</span>
                          </div>
                          {appointment.confirmedDate && appointment.status === 'confirmed' && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Confirmed Date:</span>
                              <span className="text-sm font-medium text-green-700">{formatDate(appointment.confirmedDate)}</span>
                            </div>
                          )}
                          {appointment.timeSlot && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Time Slot:</span>
                              <span className="text-sm font-medium text-green-700">{appointment.timeSlot}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Type:</span>
                            <span className="text-sm font-medium capitalize">{appointment.consultationType}</span>
                          </div>
                        </div>
                      </div>
                      
                      {appointment.symptoms && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Symptoms/Notes</h4>
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                            {appointment.symptoms}
                          </p>
                        </div>
                      )}
                      
                      {appointment.rejectionReason && (
                        <div className="md:col-span-2">
                          <h4 className="text-sm font-medium text-red-700 mb-2">Rejection Reason</h4>
                          <p className="text-sm text-red-600 bg-red-50 p-3 rounded">
                            {appointment.rejectionReason}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-3 border-t">
                      {appointment.status === 'confirmed' && (
                        <button 
                          onClick={() => onJoinRoom ? onJoinRoom(appointment._id) : null}
                          className="btn-primary text-sm"
                        >
                          Join Consultation
                        </button>
                      )}
                      
                      {appointment.status === 'pending' && (
                        <button 
                          onClick={async () => {
                            if (window.confirm('Are you sure you want to cancel this appointment request?')) {
                              try {
                                await api.put(`/appointments/${appointment._id}`, { status: 'cancelled' });
                                loadUserAppointments();
                                setMessage({ text: 'Appointment cancelled successfully', type: 'success' });
                              } catch (error) {
                                console.error('Error cancelling appointment:', error);
                                setMessage({ text: 'Error cancelling appointment', type: 'error' });
                              }
                            }
                          }}
                          className="btn-secondary text-sm text-red-600 hover:bg-red-50"
                        >
                          Cancel Request
                        </button>
                      )}
                      
                      <div className="text-xs text-gray-500 ml-auto pt-2">
                        Requested: {new Date(appointment.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
