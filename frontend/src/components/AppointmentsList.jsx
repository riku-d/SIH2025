import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function AppointmentsList({ onJoinRoom }) {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const [userAppointments, setUserAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (user) {
      loadUserAppointments();
    }
  }, []);

  const loadUserAppointments = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/appointments/patient/${user.id || user._id}`);
      setUserAppointments(data);
    } catch (error) {
      console.error('Error loading appointments:', error);
      setMessage({ text: 'Error loading appointments', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
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

  if (loading) {
    return (
      <div className="card">
        <div className="card-body text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message.text && (
        <div className={`p-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

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
