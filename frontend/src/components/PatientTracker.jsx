import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function PatientTracker() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const [appointments, setAppointments] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientRecords, setPatientRecords] = useState([]);
  const [newRecord, setNewRecord] = useState({ diagnosis: '', prescription: '' });
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (user) {
      loadAppointments();
    }
  }, []);

  const loadAppointments = async () => {
    try {
      const { data } = await api.get(`/appointments/doctor/${user.id}`);
      setAppointments(data);
    } catch (error) {
      setMessage({ text: 'Error loading appointments', type: 'error' });
    }
  };

  const handlePatientSelect = async (patient) => {
    setSelectedPatient(patient);
    try {
      const { data } = await api.get(`/records/${patient._id}`);
      setPatientRecords(data);
    } catch (error) {
      setPatientRecords([]);
      setMessage({ text: 'No records found or error loading records', type: 'info' });
    }
  };

  const handleInputChange = (e) => {
    setNewRecord({ ...newRecord, [e.target.name]: e.target.value });
  };

  const handleSubmitRecord = async (e) => {
    e.preventDefault();
    if (!selectedPatient || !newRecord.diagnosis) {
      setMessage({ text: 'Please select a patient and enter diagnosis', type: 'error' });
      return;
    }

    try {
      // Find the latest appointment for this patient
      const appointment = appointments.find(a => a.patientId._id === selectedPatient._id);
      if (!appointment) {
        setMessage({ text: 'No appointment found for this patient', type: 'error' });
        return;
      }

      await api.post('/records/create', {
        patientId: selectedPatient._id,
        appointmentId: appointment._id,
        diagnosis: newRecord.diagnosis,
        prescription: newRecord.prescription
      });

      // Refresh records
      const { data } = await api.get(`/records/${selectedPatient._id}`);
      setPatientRecords(data);
      
      // Reset form
      setNewRecord({ diagnosis: '', prescription: '' });
      setMessage({ text: 'Health record created successfully', type: 'success' });
      
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (error) {
      setMessage({ text: 'Error creating health record', type: 'error' });
    }
  };

  // Group patients by unique patient ID
  const uniquePatients = appointments.reduce((acc, appointment) => {
    const patientId = appointment.patientId?._id;
    if (patientId && !acc.some(p => p._id === patientId)) {
      acc.push(appointment.patientId);
    }
    return acc;
  }, []);

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-body">
          <div className="section-title mb-4">Patient Tracker</div>
          
          {message.text && (
            <div className={`p-3 rounded mb-4 ${message.type === 'success' ? 'bg-green-100 text-green-700' : message.type === 'info' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
              {message.text}
            </div>
          )}
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-lg mb-3">Your Patients</h3>
              {uniquePatients.length > 0 ? (
                <ul className="space-y-2">
                  {uniquePatients.map((patient) => (
                    <li 
                      key={patient._id} 
                      className={`border p-3 rounded cursor-pointer transition-colors ${selectedPatient?._id === patient._id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}`}
                      onClick={() => handlePatientSelect(patient)}
                    >
                      <div className="font-medium">{patient.name}</div>
                      {patient.age && <div className="text-sm text-gray-600">Age: {patient.age}</div>}
                      {patient.village && <div className="text-sm text-gray-600">Village: {patient.village}</div>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No patients found</p>
              )}
            </div>
            
            <div>
              {selectedPatient ? (
                <div>
                  <h3 className="font-semibold text-lg mb-3">Patient Details</h3>
                  <div className="p-4 border rounded bg-gray-50 mb-4">
                    <h4 className="font-medium">{selectedPatient.name}</h4>
                    {selectedPatient.age && <p className="text-sm">Age: {selectedPatient.age}</p>}
                    {selectedPatient.village && <p className="text-sm">Village: {selectedPatient.village}</p>}
                  </div>
                  
                  <h3 className="font-semibold text-lg mb-3">Add Health Record</h3>
                  <form onSubmit={handleSubmitRecord} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
                      <textarea 
                        name="diagnosis" 
                        value={newRecord.diagnosis} 
                        onChange={handleInputChange} 
                        className="input h-20"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Prescription</label>
                      <textarea 
                        name="prescription" 
                        value={newRecord.prescription} 
                        onChange={handleInputChange} 
                        className="input h-20"
                      />
                    </div>
                    <button type="submit" className="btn-primary">Save Record</button>
                  </form>
                </div>
              ) : (
                <p className="text-gray-500">Select a patient to view details and add health records</p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {selectedPatient && patientRecords.length > 0 && (
        <div className="card">
          <div className="card-body">
            <h3 className="font-semibold text-lg mb-3">Health Records History</h3>
            <div className="space-y-4">
              {patientRecords.map((record) => (
                <div key={record._id} className="border p-4 rounded">
                  <div className="flex justify-between">
                    <div className="font-medium">Date: {new Date(record.createdAt).toLocaleString()}</div>
                    <a 
                      href={`/api/records/${selectedPatient._id}/download`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Download PDF
                    </a>
                  </div>
                  <div className="mt-2">
                    <div className="text-sm font-medium text-gray-700">Diagnosis:</div>
                    <p className="text-gray-600">{record.diagnosis}</p>
                  </div>
                  {record.prescription && (
                    <div className="mt-2">
                      <div className="text-sm font-medium text-gray-700">Prescription:</div>
                      <p className="text-gray-600">{record.prescription}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}