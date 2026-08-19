import React from 'react'

const TONES = {
  info: 'alert-info',
  success: 'alert-success',
  warning: 'alert-warning',
  error: 'alert-error'
}

const ICONS = {
  info: 'M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  warning: 'M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z',
  error: 'M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
}

export default function Alert({ tone = 'info', title, action, className = '', children }) {
  return (
    <div className={`alert ${TONES[tone] || TONES.info} ${className}`} role={tone === 'error' ? 'alert' : 'status'}>
      <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d={ICONS[tone] || ICONS.info} />
      </svg>
      <div className="flex-1 min-w-0">
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        <div>{children}</div>
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  )
}
