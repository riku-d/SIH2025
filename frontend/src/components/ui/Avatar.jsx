import React from 'react'

const SIZES = {
  sm: 'w-9 h-9 text-caption',
  md: 'w-12 h-12 text-base',
  lg: 'w-16 h-16 text-h3',
  xl: 'w-20 h-20 text-h2'
}

/** Replaces four separate initial-circle implementations. */
export default function Avatar({ name = '', src, size = 'md', className = '' }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'

  if (src) {
    return <img src={src} alt="" className={`${SIZES[size]} rounded-full object-cover shrink-0 ${className}`} />
  }
  return (
    <span
      aria-hidden="true"
      className={`${SIZES[size]} shrink-0 rounded-full bg-primary-100 text-primary-700 font-semibold flex items-center justify-center ${className}`}
    >
      {initials}
    </span>
  )
}
