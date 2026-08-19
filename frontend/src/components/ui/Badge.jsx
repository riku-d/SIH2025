import React from 'react'

const TONES = {
  neutral: 'badge-neutral',
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  info: 'badge-info',
  primary: 'badge-primary'
}

export default function Badge({ tone = 'neutral', dot = false, className = '', children }) {
  return (
    <span className={`badge ${TONES[tone] || TONES.neutral} ${className}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" aria-hidden="true" />}
      {children}
    </span>
  )
}
