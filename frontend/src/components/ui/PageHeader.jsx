import React from 'react'

export default function PageHeader({ title, description, actions, back, className = '' }) {
  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6 ${className}`}>
      <div className="min-w-0">
        {back}
        <h1 className="page-title">{title}</h1>
        {description && <p className="text-body mt-1.5 max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}
