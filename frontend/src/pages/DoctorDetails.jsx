import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api, { friendlyError } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/ui/Toast'
import Card, { CardBody, CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Avatar from '../components/ui/Avatar'
import Badge from '../components/ui/Badge'
import { SkeletonCard } from '../components/ui/Skeleton'
import { ErrorState } from '../components/ui/States'

export default function DoctorDetails() {
  const { doctorId } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { userId } = useAuth()
  const toast = useToast()

  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const { data } = await api.get(`/users/doctor/${doctorId}`)
      setDoctor(data)
    } catch (err) {
      console.error('Failed to load doctor:', err)
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [doctorId])

  useEffect(() => { if (doctorId) load() }, [doctorId, load])


  if (loading) {
    return <div className="container-app py-8"><SkeletonCard /></div>
  }

  if (loadError || !doctor) {
    return (
      <div className="container-app py-8">
        <Card><CardBody>
          <ErrorState
            title={t('doctors.notFound')}
            message={t('errors.tryAgain')}
            onRetry={() => navigate('/patient/care/doctors')}
            retryLabel={t('doctors.backToDoctors')}
          />
        </CardBody></Card>
      </div>
    )
  }

  const specialization = doctor.specialization || t('doctors.generalPhysician')
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="container-app py-6 sm:py-8">
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => navigate('/patient/care/doctors')}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        {t('doctors.backToDoctors')}
      </Button>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Card>
            <CardBody>
              <div className="flex flex-col sm:flex-row gap-5 mb-6">
                <Avatar name={doctor.name} src={doctor.profilePicture} size="xl" />
                <div className="min-w-0">
                  <h1 className="page-title mb-1">{doctor.name}</h1>
                  <p className="text-lg text-primary-600 font-medium mb-2">{specialization}</p>
                  {doctor.qualification && <p className="text-body mb-3">{doctor.qualification}</p>}
                  <Badge tone="primary" dot>{t('doctors.consultsOnline')}</Badge>
                </div>
              </div>

              {doctor.bio && (
                <div className="mb-6">
                  <h2 className="text-caption font-semibold text-muted uppercase tracking-wide mb-1.5">
                    {t('doctors.aboutDoctor')}
                  </h2>
                  <p className="text-body whitespace-pre-line">{doctor.bio}</p>
                </div>
              )}

              <dl className="grid gap-4 sm:grid-cols-2">
                {doctor.qualification && (
                  <div>
                    <dt className="text-caption font-semibold text-muted uppercase tracking-wide mb-0.5">
                      {t('doctors.qualification')}
                    </dt>
                    <dd className="text-body">{doctor.qualification}</dd>
                  </div>
                )}
                {doctor.availability && (
                  <div>
                    <dt className="text-caption font-semibold text-muted uppercase tracking-wide mb-0.5">
                      {t('doctors.availability')}
                    </dt>
                    <dd className="text-body">{doctor.availability}</dd>
                  </div>
                )}
              </dl>
            </CardBody>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="lg:sticky lg:top-24">
            <CardHeader>
              <h2 className="section-title">{t('appointments.bookWith', { name: doctor.name })}</h2>
            </CardHeader>
            <CardBody>
              {/* One booking flow, not two.
                  This page used to carry its own cut-down form — no
                  attachments, no availability — while a fuller one lived at
                  /patient/care/book. Worse, the "add attachments" link pointed
                  at /patient/appointments, a route that redirects to the
                  appointment list and drops navigation state, so the doctor
                  the patient had just chosen was silently discarded. */}
              <p className="text-body mb-4">{t('appointments.bookWithHint')}</p>

              <Button
                block
                onClick={() => navigate('/patient/care/book', { state: { doctor } })}
              >
                {t('appointments.book')}
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
