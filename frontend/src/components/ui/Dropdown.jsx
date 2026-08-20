import React, { useEffect, useRef, useState } from 'react'

/**
 * The old language menu opened on :group-hover only, so it was inert on
 * touch and unreachable by keyboard — on the device most of our users
 * have. This is click-driven with Esc, arrows and click-outside.
 */
export default function Dropdown({ trigger, children, align = 'right', placement = 'bottom', label }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const onMenuKeyDown = (e) => {
    if (!['ArrowDown', 'ArrowUp'].includes(e.key)) return
    e.preventDefault()
    const items = Array.from(menuRef.current?.querySelectorAll('[role="menuitem"]') || [])
    if (!items.length) return
    const i = items.indexOf(document.activeElement)
    const next = e.key === 'ArrowDown' ? (i + 1) % items.length : (i - 1 + items.length) % items.length
    items[next].focus()
  }

  return (
    <div className="relative" ref={wrapRef}>
      {trigger({ open, toggle: () => setOpen(o => !o), 'aria-expanded': open, 'aria-haspopup': 'menu' })}
      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label={label}
          onKeyDown={onMenuKeyDown}
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} min-w-[12rem] z-40
                      ${placement === 'top' ? 'bottom-full mb-2' : 'mt-2'}
                      bg-surface border border-line rounded-card shadow-lifted py-1.5 animate-rise-in`}
        >
          {children({ close: () => setOpen(false) })}
        </div>
      )}
    </div>
  )
}

export function DropdownItem({ active = false, className = '', children, ...rest }) {
  return (
    <button
      type="button"
      role="menuitem"
      className={`w-full text-left px-4 py-2.5 text-small min-h-touch flex items-center gap-2.5
                  ${active ? 'bg-primary-50 text-primary-600 font-medium' : 'text-body hover:bg-surface-2'} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
