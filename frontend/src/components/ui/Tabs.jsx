import React, { useRef } from 'react'

/**
 * Scrollable on mobile with a keyboard arrow pattern. `items` is
 * [{ key, label, badge }]; the parent owns the active key so tabs can be
 * driven from the URL rather than component state.
 */
export default function Tabs({ items, active, onChange, className = '', label = 'Sections' }) {
  const ref = useRef(null)

  const onKeyDown = (e) => {
    const i = items.findIndex(t => t.key === active)
    if (i < 0) return
    let next = null
    if (e.key === 'ArrowRight') next = items[(i + 1) % items.length]
    if (e.key === 'ArrowLeft') next = items[(i - 1 + items.length) % items.length]
    if (e.key === 'Home') next = items[0]
    if (e.key === 'End') next = items[items.length - 1]
    if (!next) return
    e.preventDefault()
    onChange(next.key)
    ref.current?.querySelector(`[data-key="${next.key}"]`)?.focus()
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={ref} role="tablist" aria-label={label} className="tabs" onKeyDown={onKeyDown}>
        {items.map(t => {
          const isActive = t.key === active
          return (
            <button
              key={t.key}
              data-key={t.key}
              role="tab"
              type="button"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onChange(t.key)}
              className={`tab ${isActive ? 'tab-active' : ''}`}
            >
              {t.label}
              {t.badge > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-warning-500 text-white text-[0.6875rem] font-semibold tabular">
                  {t.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>
      {/* Edge fade signals there is more to scroll on narrow screens. */}
      <div className="pointer-events-none absolute right-0 top-0 bottom-px w-8 bg-gradient-to-l from-surface to-transparent sm:hidden" aria-hidden="true" />
    </div>
  )
}
