import React from 'react'

export default function Dashboard({ title, children }) {
  return (
    <div className="container-app space-y-4 py-6">
      <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
      {children}
    </div>
  )
}


