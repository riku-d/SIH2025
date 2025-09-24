import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function LoginSignup() {
  const [isLogin, setIsLogin] = useState(true)
  const [form, setForm] = useState({ role: 'patient' })
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const [doctorAvailability, setDoctorAvailability] = useState({
    monday: { selected: false, startTime: '', endTime: '' },
    tuesday: { selected: false, startTime: '', endTime: '' },
    wednesday: { selected: false, startTime: '', endTime: '' },
    thursday: { selected: false, startTime: '', endTime: '' },
    friday: { selected: false, startTime: '', endTime: '' },
    saturday: { selected: false, startTime: '', endTime: '' },
    sunday: { selected: false, startTime: '', endTime: '' },
  })

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (isLogin) {
        const { data } = await api.post('/auth/login', { email: form.email, password: form.password })
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        const role = data.user.role
        navigate(role === 'patient' ? '/patient' : role === 'doctor' ? '/doctor' : '/pharmacy')
      } else {
        await api.post('/auth/register', {
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          age: form.age,
          village: form.village,
          specialization: form.specialization,
          qualification: form.qualification,
          availability: Object.entries(doctorAvailability)
            .filter(([day, availability]) => availability.selected)
            .map(([day, availability]) => ({
              day,
              startTime: availability.startTime,
              endTime: availability.endTime,
            }))
        })
        setIsLogin(true)
      }
    } catch (e) { setError(e.response?.data?.message || 'Error') }
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

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

  return (
    <div className="container-app py-10">
      <div className="max-w-md mx-auto card">
        <div className="card-body">
          <div className="flex justify-between mb-4">
            <button className={`btn ${isLogin ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setIsLogin(true)}>Login</button>
            <button className={`btn ${!isLogin ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setIsLogin(false)}>Sign Up</button>
          </div>
          {error && <div className="text-red-600 mb-2">{error}</div>}
          <form className="space-y-2" onSubmit={submit}>
            {!isLogin && (
              <>
                <input className="input" placeholder="Name" onChange={set('name')} />
                <select className="input" value={form.role} onChange={set('role')}>
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                  <option value="pharmacy">Pharmacy</option>
                </select>
                {form.role === 'patient' && (
                  <>
                    <input className="input" placeholder="Age" onChange={set('age')} />
                    <input className="input" placeholder="Village" onChange={set('village')} />
                  </>
                )}
                {form.role === 'doctor' && (
                  <>
                    <input className="input" placeholder="Specialization" onChange={set('specialization')} />
                    <input className="input" placeholder="Qualification" onChange={set('qualification')} />
                    
                    <div className="space-y-2 mt-2">
                      <label className="block text-sm font-medium text-gray-700">Availability</label>
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
                                className="input w-24"
                              />
                              <span>-</span>
                              <input
                                type="time"
                                value={doctorAvailability[day].endTime}
                                onChange={handleAvailabilityChange(day, 'endTime')}
                                className="input w-24"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
            <input className="input" placeholder="Email" onChange={set('email')} />
            <input className="input" placeholder="Password" type="password" onChange={set('password')} />
            <button className="w-full btn-primary">{isLogin ? 'Login' : 'Create Account'}</button>
          </form>
        </div>
      </div>
    </div>
  )
}


