import React, { useState } from 'react'
import api from '../services/api'

export default function SymptomChecker() {
  const [text, setText] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/symptom-checker/query', { text })
      setResults(data.suggestions || [])
    } finally { setLoading(false) }
  }

  return (
    <div className="card">
      <div className="card-body">
        <h3 className="section-title mb-2">AI Symptom Checker</h3>
        <form onSubmit={submit} className="flex gap-2">
          <input value={text} onChange={e => setText(e.target.value)} placeholder="Describe your symptoms..." className="input flex-1" />
          <button className="btn-primary" disabled={loading}>{loading ? 'Checking...' : 'Check'}</button>
        </form>
        <ul className="mt-3 list-disc ml-6">
          {results.map((r, i) => (
            <li key={i}><span className="font-medium">{r.condition}:</span> {r.advice}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}


