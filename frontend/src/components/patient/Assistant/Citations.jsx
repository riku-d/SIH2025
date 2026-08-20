import React from 'react'
import { useTranslation } from 'react-i18next'

const KIND_STYLE = {
  medicine:  'bg-primary-50 text-primary-700 border-primary-100',
  record:    'bg-info-50 text-info-600 border-info-100',
  reference: 'bg-surface-2 text-muted border-line'
}

const ICONS = {
  medicine:  'M10.5 20.5l10-10a5 5 0 00-7-7l-10 10a5 5 0 007 7zM8.5 8.5l7 7',
  record:    'M9 12h6m-6 4h4m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.6a1 1 0 01.7.3l5.4 5.4a1 1 0 01.3.7V19a2 2 0 01-2 2z',
  reference: 'M12 6.5A5.5 5.5 0 0117.5 12M12 3a9 9 0 100 18 9 9 0 000-18z'
}

/**
 * What the answer was grounded in.
 *
 * Without this, a retrieved answer looks exactly like an invented one — the
 * whole point of grounding in real pharmacy stock is lost on the person
 * reading it. Stock and price come from the same row the pharmacy screen
 * shows, so they are worth stating outright.
 */
export default function Citations({ items }) {
  const { t } = useTranslation()
  if (!items?.length) return null

  // Two pharmacies stocking the same medicine is one fact, not two chips.
  const seen = new Set()
  const unique = items.filter(c => {
    const key = `${c.kind}:${c.title}:${c.label}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-caption text-muted">{t('assistant.groundedIn')}</span>
      {unique.map((c, i) => (
        <span
          key={i}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-caption ${KIND_STYLE[c.kind] || KIND_STYLE.reference}`}
          title={c.title}
        >
          <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d={ICONS[c.kind] || ICONS.reference} />
          </svg>
          <span className="truncate max-w-[13rem]">{c.label}</span>
          {c.kind === 'medicine' && typeof c.price === 'number' && (
            <span className="tabular font-medium">
              ₹{c.price}{c.inStock ? '' : ` · ${t('assistant.outOfStock')}`}
            </span>
          )}
        </span>
      ))}
    </div>
  )
}
