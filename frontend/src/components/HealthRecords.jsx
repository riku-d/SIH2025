import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function HealthRecords() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      loadHealthRecords();
    }
  }, []);

  const loadHealthRecords = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/records/${user.id}`);
      setRecords(data);
      setError('');
    } catch (error) {
      console.error('Error loading health records:', error);
      setError('Failed to load health records. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-body">
          <div className="section-title mb-4">Your Health Records</div>
          
          {error && (
            <div className="p-3 rounded mb-4 bg-red-100 text-red-700">
              {error}
            </div>
          )}
          
          {records.length > 0 ? (
            <div className="space-y-4">
              {records.map((record) => (
                <div key={record._id} className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 p-4 border-b">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">Date: {formatDate(record.createdAt)}</h3>
                        <p className="text-sm text-gray-600">Doctor: {record.doctorId?.name || 'Unknown'}</p>
                      </div>
                      <a 
                        href={`/api/records/${user.id}/download/${record._id}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download PDF
                      </a>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Diagnosis</h4>
                      <p className="text-gray-800">{record.diagnosis}</p>
                    </div>
                    
                    {record.prescription && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Prescription</h4>
                        <p className="text-gray-800">{record.prescription}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-2 text-gray-500">No health records found</p>
              <p className="text-sm text-gray-400">Your health records will appear here after your appointments</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}