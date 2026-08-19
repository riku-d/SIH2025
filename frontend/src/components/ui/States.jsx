import React from 'react'
import Button from './Button'

/**
 * Empty states say what happened and what to do next. Error states never
 * show a raw API message — server text goes to the console, users get a
 * cause they can act on.
 */
export function EmptyState({ icon, title, message, action, className = '' }) {
  return (
    <div className={`text-center py-12 px-6 ${className}`}>
      {icon && (
        <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-full bg-surface-2 text-muted">
          {icon}
        </div>
      )}
      <h3 className="card-title mb-1.5">{title}</h3>
      {message && <p className="text-small text-muted max-w-sm mx-auto mb-5">{message}</p>}
      {action}
    </div>
  )
}

export function ErrorState({
  title = "We couldn't load this",
  message = 'Something went wrong on our side. Please try again.',
  onRetry,
  retryLabel = 'Try again',
  className = ''
}) {
  return (
    <div className={`text-center py-12 px-6 ${className}`} role="alert">
      <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-full bg-danger-50 text-danger-500">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      </div>
      <h3 className="card-title mb-1.5">{title}</h3>
      <p className="text-small text-muted max-w-sm mx-auto mb-5">{message}</p>
      {onRetry && <Button variant="secondary" onClick={onRetry}>{retryLabel}</Button>}
    </div>
  )
}

/** Small inline spinner for in-place loads that don't warrant a skeleton. */
export function Loading({ label = 'Loading…', className = '' }) {
  return (
    <div className={`flex items-center justify-center gap-3 py-10 text-muted ${className}`} role="status">
      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
        <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      <span className="text-small">{label}</span>
    </div>
  )
}
