import React, { useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'

const FOCUSABLE = 'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'

/**
 * Replaces five hand-rolled `fixed inset-0` overlays, none of which
 * trapped focus, locked scroll, or closed on Esc. Below sm it presents
 * as a bottom sheet rather than a centred desktop box on a phone.
 */
export default function Modal({ open, onClose, title, description, size = 'md', footer, children }) {
  const panelRef = useRef(null)
  const restoreRef = useRef(null)

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') { e.stopPropagation(); onClose?.() }
    if (e.key !== 'Tab' || !panelRef.current) return
    const nodes = Array.from(panelRef.current.querySelectorAll(FOCUSABLE)).filter(n => n.offsetParent !== null)
    if (!nodes.length) return
    const first = nodes[0]
    const last = nodes[nodes.length - 1]
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
  }, [onClose])

  useEffect(() => {
    if (!open) return
    restoreRef.current = document.activeElement
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    const t = setTimeout(() => {
      const node = panelRef.current?.querySelector(FOCUSABLE)
      ;(node || panelRef.current)?.focus()
    }, 0)
    return () => {
      clearTimeout(t)
      document.body.style.overflow = overflow
      restoreRef.current?.focus?.()
    }
  }, [open])

  if (!open) return null

  const width = { sm: 'sm:max-w-sm', md: 'sm:max-w-md', lg: 'sm:max-w-lg', xl: 'sm:max-w-2xl' }[size] || 'sm:max-w-md'

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/50 animate-fade-in"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.() }}
      onKeyDown={handleKeyDown}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`w-full ${width} bg-surface rounded-t-sheet sm:rounded-sheet shadow-sheet
                    max-h-[92vh] sm:max-h-[85vh] flex flex-col outline-none
                    animate-sheet-up sm:animate-rise-in`}
      >
        <div className="flex items-start gap-4 px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-line-soft">
          <div className="flex-1 min-w-0">
            <h2 className="card-title">{title}</h2>
            {description && <p className="text-small text-muted mt-1">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 -mr-2 -mt-1 w-10 h-10 flex items-center justify-center rounded-control text-muted hover:text-ink hover:bg-surface-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 sm:px-6 py-5 overflow-y-auto flex-1">{children}</div>

        {footer && (
          <div className="px-5 sm:px-6 py-4 border-t border-line-soft flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
