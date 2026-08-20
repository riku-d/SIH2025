import React from 'react'
import { useNavigate } from 'react-router-dom'
import Tabs from '../ui/Tabs'

/**
 * A page inside the app shell. `tabs` are sub-views of this one page —
 * never a way to switch between features, which is what the old six-item
 * strip was doing.
 */
export default function Page({ title, description, actions, back, tabs, activeTab, onTabChange, children }) {
  const navigate = useNavigate()

  return (
    <>
      <div className="bg-surface border-b border-line">
        <div className="px-4 sm:px-6 lg:px-8 pt-6 max-w-5xl">
          {back && (
            <button
              type="button"
              onClick={() => (typeof back === 'string' ? navigate(back) : navigate(-1))}
              className="inline-flex items-center gap-1.5 -ml-1 mb-3 px-2 py-1 rounded-control text-small text-muted hover:text-ink hover:bg-surface-2 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              {typeof back === 'object' ? back.label : 'Back'}
            </button>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between pb-5">
            <div className="min-w-0">
              <h1 className="text-d3 text-ink">{title}</h1>
              {description && <p className="text-body mt-1.5">{description}</p>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
          </div>

          {tabs?.length > 1 && (
            <Tabs items={tabs} active={activeTab} onChange={onTabChange} />
          )}
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-5xl">{children}</div>
    </>
  )
}
