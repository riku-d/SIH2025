import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../services/api'
import PageLayout from '../components/PageLayout'
import Card, { CardBody } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { Field, Input } from '../components/ui/Field'
import { SkeletonGrid } from '../components/ui/Skeleton'
import { EmptyState, ErrorState } from '../components/ui/States'

export default function PharmacyPage() {
  const { t } = useTranslation()
  const [pharmacies, setPharmacies] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [locationFilter, setLocationFilter] = useState('')

  const load = useCallback(async (params = {}) => {
    setLoading(true)
    setLoadError(false)
    try {
      const { data } = await api.get('/pharmacy/all', { params })
      setPharmacies(data || [])
    } catch (err) {
      console.error('Failed to load pharmacies:', err)
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const search = (e) => {
    e.preventDefault()
    const params = {}
    if (searchTerm) params.search = searchTerm
    if (locationFilter) params.location = locationFilter
    load(params)
  }

  const clear = () => {
    setSearchTerm('')
    setLocationFilter('')
    load()
  }

  return (
    <PageLayout title={t('pharmacy.title')} description={t('pharmacy.subtitle')}>
      <Card className="mb-6">
        <CardBody>
          <form onSubmit={search} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
            <Field label={t('common.search')}>
              {(props) => (
                <Input {...props} type="search" placeholder={t('pharmacy.searchPlaceholder')}
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              )}
            </Field>
            <Field label={t('common.filter')}>
              {(props) => (
                <Input {...props} type="search" placeholder={t('pharmacy.locationPlaceholder')}
                  value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} />
              )}
            </Field>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1 lg:flex-none">{t('common.search')}</Button>
              <Button type="button" variant="secondary" onClick={clear}>{t('common.clear')}</Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {loading ? (
        <SkeletonGrid count={6} />
      ) : loadError ? (
        <Card><CardBody>
          <ErrorState title={t('pharmacy.loadError')} onRetry={() => load()} retryLabel={t('common.retry')} />
        </CardBody></Card>
      ) : pharmacies.length === 0 ? (
        <Card><CardBody>
          <EmptyState
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 20.5l10-10a5 5 0 00-7-7l-10 10a5 5 0 007 7zM8.5 8.5l7 7" />
              </svg>
            }
            title={t('pharmacy.empty')}
            message={t('pharmacy.emptyHelp')}
            action={(searchTerm || locationFilter) && <Button variant="secondary" onClick={clear}>{t('common.clear')}</Button>}
          />
        </CardBody></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pharmacies.map(pharmacy => (
            <Card key={pharmacy._id} interactive className="h-full">
              <Link to={`/pharmacy-shop/${pharmacy._id}`} className="card-body flex flex-col h-full no-underline">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h2 className="card-title min-w-0">{pharmacy.name}</h2>
                  <Badge tone={pharmacy.deliveryAvailable ? 'success' : 'neutral'}>
                    {pharmacy.deliveryAvailable ? t('pharmacy.delivery') : t('pharmacy.pickup')}
                  </Badge>
                </div>

                <dl className="text-small text-body space-y-1.5 mb-4 flex-1">
                  <div className="flex gap-2">
                    <dt className="sr-only">{t('common.status')}</dt>
                    <dd className="text-muted">{pharmacy.location}</dd>
                  </div>
                  {pharmacy.contact && (
                    <div className="flex gap-2">
                      <dt className="sr-only">{t('common.phone')}</dt>
                      <dd className="text-muted tabular">{pharmacy.contact}</dd>
                    </div>
                  )}
                  {pharmacy.description && (
                    <p className="text-muted line-clamp-2 pt-1">{pharmacy.description}</p>
                  )}
                </dl>

                <div className="flex items-center justify-between gap-3 pt-3 border-t border-line-soft text-caption text-muted">
                  <span className="tabular">
                    {pharmacy.openingHours?.open} – {pharmacy.openingHours?.close}
                  </span>
                  <span className="text-primary-600 font-medium">{t('pharmacy.shopNow')} →</span>
                </div>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </PageLayout>
  )
}
