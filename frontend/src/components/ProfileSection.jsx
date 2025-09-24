import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function ProfileSection() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState({ text: '', type: '' });
  const [doctorAvailability, setDoctorAvailability] = useState({
    monday: { selected: false, startTime: '', endTime: '' },
    tuesday: { selected: false, startTime: '', endTime: '' },
    wednesday: { selected: false, startTime: '', endTime: '' },
    thursday: { selected: false, startTime: '', endTime: '' },
    friday: { selected: false, startTime: '', endTime: '' },
    saturday: { selected: false, startTime: '', endTime: '' },
    sunday: { selected: false, startTime: '', endTime: '' },
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get(`/users/${user.id}`);
      setProfile(data);
      setFormData(data);
      if (data.role === 'doctor' && data.availability) {
        const initialAvailability = {
          monday: { selected: false, startTime: '', endTime: '' },
          tuesday: { selected: false, startTime: '', endTime: '' },
          wednesday: { selected: false, startTime: '', endTime: '' },
          thursday: { selected: false, startTime: '', endTime: '' },
          friday: { selected: false, startTime: '', endTime: '' },
          saturday: { selected: false, startTime: '', endTime: '' },
          sunday: { selected: false, startTime: '', endTime: '' },
        };
        data.availability.forEach(slot => {
          if (initialAvailability[slot.day]) {
            initialAvailability[slot.day] = { selected: true, startTime: slot.startTime, endTime: slot.endTime };
          }
        });
        setDoctorAvailability(initialAvailability);
      }
    } catch (error) {
      setMessage({ text: 'Error fetching profile', type: 'error' });
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvailabilityChange = (day, field) => (e) => {
    setDoctorAvailability(prevAvailability => ({
      ...prevAvailability,
      [day]: { ...prevAvailability[day], [field]: e.target.value }
    }));
  };

  const handleDayToggle = (day) => (e) => {
    setDoctorAvailability(prevAvailability => ({
      ...prevAvailability,
      [day]: { ...prevAvailability[day], selected: e.target.checked }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedFormData = { ...formData };
      if (profile.role === 'doctor') {
        updatedFormData.availability = Object.entries(doctorAvailability)
          .filter(([day, availability]) => availability.selected)
          .map(([day, availability]) => ({
            day,
            startTime: availability.startTime,
            endTime: availability.endTime,
          }));
      }
      const { data } = await api.put(`/users/${user.id}`, updatedFormData);
      setProfile(data);
      setIsEditing(false);
      setMessage({ text: 'Profile updated successfully', type: 'success' });
      
      // Update user name in localStorage
      const updatedUser = { ...user, name: data.name };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (error) {
      setMessage({ text: 'Error updating profile', type: 'error' });
    }
  };

  if (!profile) {
    return <div className="card"><div className="card-body">Loading profile...</div></div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 shadow-lg rounded-lg bg-white">
      <div className="space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Your Profile</h2>
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)} 
              className="btn-secondary"
            >
              Edit Profile
            </button>
          )}
        </div>

        {message.text && (
          <div className={`mt-4 mb-4 p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message.text}
          </div>
        )}

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input 
                type="text" 
                name="name" 
                value={formData.name || ''} 
                onChange={handleChange} 
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input 
                type="text" 
                name="phone" 
                value={formData.phone || ''} 
                onChange={handleChange} 
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea 
                name="bio" 
                value={formData.bio || ''} 
                onChange={handleChange} 
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm h-24"
              />
            </div>

            {profile.role === 'patient' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <input 
                    type="number" 
                    name="age" 
                    value={formData.age || ''} 
                    onChange={handleChange} 
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Village</label>
                  <input 
                    type="text" 
                    name="village" 
                    value={formData.village || ''} 
                    onChange={handleChange} 
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </>
            )}

            {profile.role === 'doctor' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                  <input 
                    type="text" 
                    name="specialization" 
                    value={formData.specialization || ''} 
                    onChange={handleChange} 
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
                  <input 
                    type="text" 
                    name="qualification" 
                    value={formData.qualification || ''} 
                    onChange={handleChange} 
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
                  <div className="space-y-2 mt-2">
                    {Object.keys(doctorAvailability).map(day => (
                      <div key={day} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={day}
                          checked={doctorAvailability[day].selected}
                          onChange={handleDayToggle(day)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={day} className="text-sm font-medium text-gray-700 capitalize">{day}</label>
                        {doctorAvailability[day].selected && (
                          <div className="flex items-center space-x-2">
                            <input
                              type="time"
                              value={doctorAvailability[day].startTime}
                              onChange={handleAvailabilityChange(day, 'startTime')}
                              className="mt-1 block w-24 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                            <span>-</span>
                            <input
                              type="time"
                              value={doctorAvailability[day].endTime}
                              onChange={handleAvailabilityChange(day, 'endTime')}
                              className="mt-1 block w-24 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-2">
              <button type="submit" className="btn-primary">Save Changes</button>
              <button 
                type="button" 
                onClick={() => {
                  setIsEditing(false);
                  setFormData(profile);
                  const initialAvailability = {
                    monday: { selected: false, startTime: '', endTime: '' },
                    tuesday: { selected: false, startTime: '', endTime: '' },
                    wednesday: { selected: false, startTime: '', endTime: '' },
                    thursday: { selected: false, startTime: '', endTime: '' },
                    friday: { selected: false, startTime: '', endTime: '' },
                    saturday: { selected: false, startTime: '', endTime: '' },
                    sunday: { selected: false, startTime: '', endTime: '' },
                  };
                  profile.availability.forEach(slot => {
                    if (initialAvailability[slot.day]) {
                      initialAvailability[slot.day] = { selected: true, startTime: slot.startTime, endTime: slot.endTime };
                    }
                  });
                  setDoctorAvailability(initialAvailability);
                }} 
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-lg">
              <div className="w-24 h-24 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 text-3xl font-bold border-4 border-blue-400 shadow-md">
                {profile.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <div className="mb-3">
                  <div className="text-3xl font-bold text-gray-900">{profile.name}</div>
                  <div className="text-lg text-blue-700 capitalize">{profile.role}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg mt-4">
              {profile.phone && (
                <div className="flex items-center gap-2 text-gray-700 text-base">
                  <span className="font-semibold">Phone:</span>
                  <span>{profile.phone}</span>
                </div>
              )}
              {profile.email && (
                <div className="flex items-center gap-2 text-gray-700 text-base">
                  <span className="font-semibold">Email:</span>
                  <span>{profile.email}</span>
                </div>
              )}
            </div>

            {profile.bio && (
              <div className="bg-gray-50 p-4 rounded-lg mt-4">
                <div className="font-semibold text-gray-800 mb-1">Bio</div>
                <div className="text-gray-700 leading-relaxed">{profile.bio}</div>
              </div>
            )}

            {profile.role === 'patient' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                {profile.age && (
                  <div>
                    <div className="font-semibold text-gray-800 mb-1">Age</div>
                    <div className="text-gray-700">{profile.age}</div>
                  </div>
                )}
                {profile.village && (
                  <div>
                    <div className="font-semibold text-gray-800 mb-1">Village</div>
                    <div className="text-gray-700">{profile.village}</div>
                  </div>
                )}
              </div>
            )}

            {profile.role === 'doctor' && (
              <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                {profile.specialization && (
                  <div>
                    <div className="font-semibold text-gray-800 mb-1">Specialization</div>
                    <div className="text-gray-700">{profile.specialization}</div>
                  </div>
                )}
                {profile.qualification && (
                  <div>
                    <div className="font-semibold text-gray-800 mb-1">Qualification</div>
                    <div className="text-gray-700">{profile.qualification}</div>
                  </div>
                )}
                {profile.availability && profile.availability.length > 0 && (
                  <div>
                    <div className="font-semibold text-gray-800 mb-1">Availability</div>
                    <div className="text-gray-700 space-y-1">
                      {profile.availability.map((slot, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span>{slot.day}:</span>
                          <span>{slot.startTime} - {slot.endTime}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}