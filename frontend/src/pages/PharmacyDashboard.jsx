import React, { useEffect, useState } from 'react'
import Dashboard from '../components/Dashboard'
import api from '../services/api'

export default function PharmacyDashboard() {
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const [medicineName, setMedicineName] = useState('Paracetamol')
  const [quantity, setQuantity] = useState(0)
  const [search, setSearch] = useState('Paracetamol')
  const [results, setResults] = useState([])

  const updateStock = async () => {
    await api.post('/pharmacy/update-stock', { pharmacyId: user.id, medicineName, quantity: Number(quantity) })
    checkStock()
  }

  const checkStock = async () => {
    const { data } = await api.get(`/pharmacy/check-stock/${encodeURIComponent(search)}`)
    setResults(data)
  }

  useEffect(() => { checkStock() }, [])

  return (
    <Dashboard title="Pharmacy Dashboard">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <div className="card-body space-y-2">
            <div className="section-title">Update Stock</div>
            <input className="input" value={medicineName} onChange={e => setMedicineName(e.target.value)} />
            <input className="input" type="number" value={quantity} onChange={e => setQuantity(e.target.value)} />
            <button onClick={updateStock} className="btn-primary">Save</button>
          </div>
        </div>
        <div className="card">
          <div className="card-body space-y-2">
            <div className="section-title">Check Stock</div>
            <div className="flex gap-2">
              <input className="input" value={search} onChange={e => setSearch(e.target.value)} />
              <button onClick={checkStock} className="btn-secondary">Search</button>
            </div>
            <ul className="space-y-2">
              {results.map(r => (
                <li key={r._id} className="border p-2 rounded">
                  <div className="font-semibold">{r.medicineName} - Qty: {r.quantity}</div>
                  <div className="text-sm text-gray-600">{r.pharmacyId?.name} • {r.pharmacyId?.location}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Dashboard>
  )
}


