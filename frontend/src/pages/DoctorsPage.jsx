import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../services/api'
import DoctorCard from '../components/DoctorCard'
import PageHeader from '../components/ui/PageHeader'
import Card, { CardBody } from '../components/ui/Card'
import { Field, Input, Select } from '../components/ui/Field'
import { SkeletonGrid } from '../components/ui/Skeleton'
import { EmptyState, ErrorState } from '../components/ui/States'

export default function DoctorsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [doctorsBySpecialty, setDoctorsBySpecialty] = useState({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [query, setQuery] = useState('')
  const [specialty, setSpecialty] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const { data } = await api.get('/users/doctors/specialization')
      setDoctorsBySpecialty(data || {})
    } catch (err) {
      console.error('Failed to load doctors:', err)
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const specialties = useMemo(() => Object.keys(doctorsBySpecialty).sort(), [doctorsBySpecialty])

  const doctors = useMemo(() => {
    const pool = specialty
      ? (doctorsBySpecialty[specialty] || [])
      : Object.values(doctorsBySpecialty).flat()
    const q = query.trim().toLowerCase()
    if (!q) return pool
    return pool.filter(d =>
      d.name?.toLowerCase().includes(q) ||
      d.specialization?.toLowerCase().includes(q)
    )
  }, [doctorsBySpecialty, specialty, query])

  // One profile, at /doctors/:id — the old "View details" opened a modal
  // that duplicated the whole page.
  const openProfile = (doctor) => navigate(`/patient/care/doctors/${doctor._id}`)

  return (
    <div className="container-app py-6 sm:py-8">
      <PageHeader title={t('doctors.title')} description={t('doctors.subtitle')} />

      <Card className="mb-6">
        <CardBody>
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <Field label={t('common.search')}>
              {(props) => (
                <Input
                  {...props} type="search" placeholder={t('doctors.searchPlaceholder')}
                  value={query} onChange={(e) => setQuery(e.target.value)}
                />
              )}
            </Field>
            <Field label={t('doctors.specialty')}>
              {(props) => (
                <Select {...props} value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="sm:w-56">
                  <option value="">{t('doctors.allSpecialties')}</option>
                  {specialties.map(s => <option key={s} value={s}>{s}</option>)}
                </Select>
              )}
            </Field>
          </div>
        </CardBody>
      </Card>

      {loading ? (
        <SkeletonGrid count={6} />
      ) : loadError ? (
        <Card><CardBody>
          <ErrorState title={t('doctors.loadError')} onRetry={load} retryLabel={t('common.retry')} />
        </CardBody></Card>
      ) : doctors.length === 0 ? (
        <Card><CardBody>
          <EmptyState
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                <circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="M20 20l-3.5-3.5" />
              </svg>
            }
            title={t('doctors.empty')}
            message={t('doctors.emptyHelp')}
          />
        </CardBody></Card>
      ) : (
        <>
          <p className="text-small text-muted mb-4" role="status">
            {t('doctors.found', { count: doctors.length })}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {doctors.map(doctor => (
              <DoctorCard
                key={doctor._id}
                doctor={doctor}
                onView={openProfile}
                onBook={openProfile}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
