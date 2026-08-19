import React, { useId } from 'react'

/**
 * A real <label> every time. Placeholders are examples, never the label —
 * they vanish the moment you type, which is exactly when a user working
 * in a second language needs them most.
 */
export function Field({ label, hint, error, required, children, htmlFor }) {
  const generated = useId()
  const id = htmlFor || generated
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined

  return (
    <div className="field">
      {label && (
        <label htmlFor={id} className={`label ${required ? 'label-required' : ''}`}>
          {label}
        </label>
      )}
      {children({ id, 'aria-describedby': [hintId, errorId].filter(Boolean).join(' ') || undefined, 'aria-invalid': error ? true : undefined })}
      {hint && !error && <p id={hintId} className="hint">{hint}</p>}
      {error && <p id={errorId} className="error-text" role="alert">{error}</p>}
    </div>
  )
}

export function Input({ error, className = '', ...rest }) {
  return <input className={`input ${error ? 'input-error' : ''} ${className}`} {...rest} />
}

export function Textarea({ error, className = '', ...rest }) {
  return <textarea className={`input ${error ? 'input-error' : ''} ${className}`} {...rest} />
}

export function Select({ error, className = '', children, ...rest }) {
  return (
    <select className={`input ${error ? 'input-error' : ''} ${className}`} {...rest}>
      {children}
    </select>
  )
}

/** Password field with a visibility toggle — essential on phone keyboards. */
export function PasswordInput({ error, className = '', label = 'Show password', ...rest }) {
  const [visible, setVisible] = React.useState(false)
  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        className={`input pr-12 ${error ? 'input-error' : ''} ${className}`}
        {...rest}
      />
      <button
        type="button"
        onClick={() => setVisible(v => !v)}
        aria-label={label}
        aria-pressed={visible}
        className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-muted hover:text-ink rounded-control"
      >
        {visible ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path strokeLinecap="round" d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.4 5.3A9.5 9.5 0 0112 5c5 0 9 4.5 9 7 0 .9-.6 2.1-1.6 3.3M6.2 6.6C4.2 8 3 9.9 3 12c0 2.5 4 7 9 7 1.3 0 2.5-.3 3.6-.8" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path strokeLinecap="round" d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
            <circle cx="12" cy="12" r="2.75" />
          </svg>
        )}
      </button>
    </div>
  )
}
