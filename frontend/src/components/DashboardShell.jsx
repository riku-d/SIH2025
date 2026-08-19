import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Tabs from './ui/Tabs'

/**
 * Sections are driven by the URL rather than useState, so refresh keeps
 * your place and the Android back button steps back a section instead of
 * leaving the app — the primary navigation gesture on our target device.
 */
export default function DashboardShell({ title, description, base, sections, active, actions, children }) {
  const navigate = useNavigate()
  const location = useLocation()

  const onChange = (key) => {
    const path = key === 'index' ? base : `${base}/${key}`
    if (location.pathname !== path) navigate(path)
  }

  return (
    <div>
      {/* Tinted masthead so the app has a header rather than text floating
          on the page background. */}
      <div className="relative bg-surface border-b border-line overflow-hidden">
        <div className="absolute inset-0 grid-lines-ink" aria-hidden="true" />
        <div
          className="absolute -top-24 -right-16 w-80 h-80 rounded-full blur-3xl opacity-[.07]"
          style={{ background: 'radial-gradient(circle, #0B5F63, transparent 70%)' }}
          aria-hidden="true"
        />

        <div className="container-app relative pt-7 pb-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
            <div className="min-w-0">
              <h1 className="text-d3 text-ink">{title}</h1>
              {description && <p className="text-body mt-1.5 max-w-2xl">{description}</p>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
          </div>

          {sections?.length > 1 && (
            <Tabs items={sections} active={active} onChange={onChange} />
          )}
        </div>
      </div>

      <div className="container-app py-6 sm:py-8">{children}</div>
    </div>
  )
}
