import React, { createContext, useContext, useCallback, useState, useRef } from 'react'
import { createPortal } from 'react-dom'

const ToastContext = createContext(null)

/**
 * Replaces 45 alert() calls. Native alerts block the page, look like
 * browser errors, can't be translated, and are suppressible on mobile —
 * so feedback could vanish entirely.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts(t => t.filter(x => x.id !== id))
  }, [])

  const push = useCallback((message, tone = 'info', duration = 4500) => {
    const id = ++idRef.current
    setToasts(t => [...t, { id, message, tone }])
    if (duration) setTimeout(() => dismiss(id), duration)
    return id
  }, [dismiss])

  const api = useRef({
    show: push,
    success: (m, d) => push(m, 'success', d),
    error:   (m, d) => push(m, 'error', d ?? 6500),
    warning: (m, d) => push(m, 'warning', d),
    info:    (m, d) => push(m, 'info', d),
    dismiss
  }).current

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        <div
          className="fixed top-3 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-1.5rem)] max-w-sm flex flex-col gap-2 pointer-events-none"
          role="region"
          aria-label="Notifications"
        >
          {toasts.map(t => (
            <div
              key={t.id}
              role={t.tone === 'error' ? 'alert' : 'status'}
              aria-live={t.tone === 'error' ? 'assertive' : 'polite'}
              className={`pointer-events-auto alert shadow-raised animate-toast-in ${
                { success: 'alert-success', error: 'alert-error', warning: 'alert-warning', info: 'alert-info' }[t.tone]
              }`}
            >
              <div className="flex-1 min-w-0">{t.message}</div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss"
                className="shrink-0 -mr-1 -mt-1 w-8 h-8 flex items-center justify-center rounded-control hover:bg-black/5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
