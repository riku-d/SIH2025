import React from 'react'
import PageHeader from './ui/PageHeader'

/**
 * Replaces the old `Dashboard` wrapper, which rendered a bare h2 and no
 * room for a description or page actions.
 */
export default function PageLayout({ title, description, actions, children }) {
  return (
    <div className="container-app py-6 sm:py-8">
      {title && <PageHeader title={title} description={description} actions={actions} />}
      {children}
    </div>
  )
}
