import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function DoctorAppointmentManager({ onJoinRoom }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [confirmingAppointment, setConfirmingAppointment] = useState(null);
  const [confirmationData, setConfirmationData] = useState({
    confirmedDate: '',
    timeSlot: '',
    doctorNotes: ''
  });
  const [rejectionReason, setRejectionReason] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, confirmed, completed
  const [doctorDetails, setDoctorDetails] = useState(null);

  useEffect(() => {
    loadAppointments();
  }, []);

  useEffect(() => {
    const fetchDoctorProfile = async () => {
      try {
        const { data } = await api.get(`/users/${user.id}`);
        setDoctorDetails(data);
      } catch (error) {
        console.error("Error fetching doctor profile:", error);
      }
    };
    if (user && user.id) {
      fetchDoctorProfile();
    }
  }, [user]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/appointments/doctor/${user.id}`);
      setAppointments(response.data || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAppointment = async (e) => {
    e.preventDefault();
    if (!confirmingAppointment) return;

    try {
      setLoading(true);
      await api.put(`/appointments/${confirmingAppointment._id}/confirm`, confirmationData);
      
      // Refresh appointments
      await loadAppointments();
      
      // Reset state
      setConfirmingAppointment(null);
      setConfirmationData({
        confirmedDate: '',
        timeSlot: '',
        doctorNotes: ''
      });
      
      alert('Appointment confirmed successfully!');
    } catch (error) {
      console.error('Error confirming appointment:', error);
      alert(error.response?.data?.message || 'Error confirming appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectAppointment = async (appointmentId) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      setLoading(true);
      await api.put(`/appointments/${appointmentId}/reject`, {
        rejectionReason: rejectionReason
      });
      
      // Refresh appointments
      await loadAppointments();
      
      // Reset state
      setSelectedAppointment(null);
      setRejectionReason('');
      
      alert('Appointment rejected successfully');
    } catch (error) {
      console.error('Error rejecting appointment:', error);
      alert(error.response?.data?.message || 'Error rejecting appointment');
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (appointment) => {
    switch (appointment.status) {
      case 'pending':
        return {
          text: 'Pending Review',
          class: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: '⏳'
        };
      case 'confirmed':
        return {
          text: 'Confirmed',
          class: 'bg-green-100 text-green-800 border-green-200',
          icon: '✅'
        };
      case 'rejected':
        return {
          text: 'Rejected',
          class: 'bg-red-100 text-red-800 border-red-200',
          icon: '❌'
        };
      case 'completed':
        return {
          text: 'Completed',
          class: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: '✓'
        };
      case 'cancelled':
        return {
          text: 'Cancelled',
          class: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: '🚫'
        };
      default:
        return {
          text: appointment.status,
          class: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: '❓'
        };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDayName = (date) => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  };

  const getAvailableTimeSlotsForDoctor = (date) => {
    if (!doctorDetails || !doctorDetails.availability || doctorDetails.availability.length === 0) {
      return [];
    }
    const dayName = getDayName(date).toLowerCase();
    const dayAvailability = doctorDetails.availability.find(slot => slot.day.toLowerCase() === dayName);

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

  const filteredAppointments = appointments.filter(appointment => {
    if (filter === 'all') return true;
    return appointment.status === filter;
  });

  const pendingCount = appointments.filter(a => a.status === 'pending').length;
  const confirmedCount = appointments.filter(a => a.status === 'confirmed').length;

  // Generate time slots
  const timeSlots = [
    '09:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00',
    '14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00'
  ];

  if (loading && appointments.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Loading appointments...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-2xl text-yellow-600 mr-3">⏳</div>
            <div>
              <div className="text-2xl font-bold text-yellow-800">{pendingCount}</div>
              <div className="text-sm text-yellow-700">Pending Review</div>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-2xl text-green-600 mr-3">✅</div>
            <div>
              <div className="text-2xl font-bold text-green-800">{confirmedCount}</div>
              <div className="text-sm text-green-700">Confirmed</div>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-2xl text-blue-600 mr-3">📅</div>
            <div>
              <div className="text-2xl font-bold text-blue-800">{appointments.length}</div>
              <div className="text-sm text-blue-700">Total Appointments</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['all', 'pending', 'confirmed', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                filter === status
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {status} {status === 'pending' && pendingCount > 0 && `(${pendingCount})`}
            </button>
          ))}
        </nav>
      </div>

      {/* Appointments List */}
      {filteredAppointments.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No {filter === 'all' ? '' : filter} appointments
          </h3>
          <p className="text-gray-500">
            {filter === 'pending' 
              ? 'No appointment requests waiting for your review.' 
              : 'Your appointment list is empty.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((appointment) => {
            const statusInfo = getStatusInfo(appointment);
            return (
              <div key={appointment._id} className={`border rounded-lg p-6 ${statusInfo.class} border`}>
                {/* Appointment Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {appointment.patientId?.name || 'Unknown Patient'}
                    </h3>
                    <div className="text-sm text-gray-600 mt-1">
                      <span>📧 {appointment.patientId?.email}</span>
                      {appointment.patientId?.village && (
                        <span className="ml-4">📍 {appointment.patientId.village}</span>
                      )}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.class}`}>
                    {statusInfo.icon} {statusInfo.text}
                  </span>
                </div>

                {/* Appointment Details */}
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">Requested Date:</span>
                      <span className="text-sm text-gray-900">{formatDate(appointment.requestedDate)}</span>
                    </div>
                    {appointment.confirmedDate && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">Confirmed Date:</span>
                        <span className="text-sm text-green-700 font-medium">{formatDate(appointment.confirmedDate)}</span>
                      </div>
                    )}
                    {appointment.timeSlot && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">Time Slot:</span>
                        <span className="text-sm text-green-700 font-medium">{appointment.timeSlot}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">Consultation:</span>
                      <span className="text-sm text-gray-900 capitalize">{appointment.consultationType}</span>
                    </div>
                  </div>

                  {appointment.symptoms && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Patient Symptoms/Notes:</h4>
                      <div className="bg-white p-3 rounded border text-sm text-gray-700">
                        {appointment.symptoms}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t">
                  {appointment.status === 'pending' && (
                    <>
                      <button
                        onClick={() => {
                          setConfirmingAppointment(appointment);
                          setConfirmationData({
                            confirmedDate: appointment.requestedDate.split('T')[0],
                            timeSlot: '',
                            doctorNotes: ''
                          });
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium"
                      >
                        ✅ Confirm & Schedule
                      </button>
                      
                      <button
                        onClick={() => setSelectedAppointment(appointment)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium"
                      >
                        ❌ Reject
                      </button>
                    </>
                  )}
                  
                  {appointment.status === 'confirmed' && (
                    <button
                      onClick={() => onJoinRoom ? onJoinRoom(appointment._id) : null}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium"
                    >
                      🎥 Start Consultation
                    </button>
                  )}
                  
                  <div className="ml-auto text-xs text-gray-500 pt-2">
                    Requested: {new Date(appointment.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmingAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Appointment with {confirmingAppointment.patientId?.name}
            </h3>
            
            <form onSubmit={handleConfirmAppointment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Date
                </label>
                <input
                  type="date"
                  required
                  value={confirmationData.confirmedDate}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    setConfirmationData({...confirmationData, confirmedDate: newDate, timeSlot: ''});
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Slot
                </label>
                <select
                  required
                  value={confirmationData.timeSlot}
                  onChange={(e) => setConfirmationData({...confirmationData, timeSlot: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!confirmationData.confirmedDate}
                >
                  <option value="">Select a time slot</option>
                  {confirmationData.confirmedDate && getAvailableTimeSlotsForDoctor(new Date(confirmationData.confirmedDate)).map((slot, index) => (
                    <option key={index} value={`${slot.startTime}-${slot.endTime}`}>
                      {slot.startTime} - {slot.endTime}
                    </option>
                  ))}
                </select>
                {!confirmationData.confirmedDate && (
                  <p className="text-sm text-gray-500 mt-1">Please select a date first to see available time slots.</p>
                )}
                {confirmationData.confirmedDate && getAvailableTimeSlotsForDoctor(new Date(confirmationData.confirmedDate)).length === 0 && (
                  <p className="text-sm text-red-500 mt-1">No availability set for this day. Please choose another date or update your profile availability.</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  rows="3"
                  value={confirmationData.doctorNotes}
                  onChange={(e) => setConfirmationData({...confirmationData, doctorNotes: e.target.value})}
                  placeholder="Any additional notes for the patient..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmingAppointment(null)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded font-medium disabled:bg-gray-400"
                >
                  {loading ? 'Confirming...' : 'Confirm Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Reject Appointment Request
            </h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting {selectedAppointment.patientId?.name}'s appointment request:
            </p>
            
            <textarea
              rows="4"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Reason for rejection..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedAppointment(null);
                  setRejectionReason('');
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRejectAppointment(selectedAppointment._id)}
                disabled={loading || !rejectionReason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded font-medium disabled:bg-gray-400"
              >
                {loading ? 'Rejecting...' : 'Reject Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}