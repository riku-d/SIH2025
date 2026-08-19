import React from 'react'

const VARIANTS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  outline: 'btn-outline',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
  accent: 'btn-accent'
}

const SIZES = { sm: 'btn-sm', md: '', lg: 'btn-lg' }

/**
 * Geometry comes from .btn, colour from the variant. Loading swaps the
 * label in place rather than resizing the button, so a slow connection
 * never shifts the layout under the user's thumb.
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  block = false,
  icon = null,
  className = '',
  children,
  disabled,
  type = 'button',
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`btn ${VARIANTS[variant] || VARIANTS.primary} ${SIZES[size]} ${block ? 'btn-block' : ''} ${className}`}
      {...rest}
    >
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}

/** Icon-only button — still needs an accessible name and a 44px target. */
export function IconButton({ label, variant = 'ghost', className = '', children, ...rest }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`btn btn-icon ${VARIANTS[variant] || VARIANTS.ghost} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
