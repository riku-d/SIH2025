import React, { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api, { friendlyError } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from './ui/Toast'
import Card, { CardBody } from './ui/Card'
import Button from './ui/Button'
import { SkeletonList } from './ui/Skeleton'
import { EmptyState, ErrorState } from './ui/States'
import { formatDate } from '../lib/status'

export default function HealthRecords({ patientId: patientIdProp }) {
  const { t, i18n } = useTranslation()
  const { userId } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const patientId = patientIdProp || userId

  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [downloading, setDownloading] = useState(null)

  const load = useCallback(async () => {
    if (!patientId) return
    setLoading(true)
    setLoadError(false)
    try {
      const { data } = await api.get(`/records/${patientId}`)
      setRecords(data || [])
    } catch (err) {
      console.error('Failed to load health records:', err)
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [patientId])

  useEffect(() => { load() }, [load])

  // Downloads go through the axios instance so the Bearer token travels
  // with them — the old links were bare anchors and always failed auth.
  const download = async (url, filename, key) => {
    setDownloading(key)
    try {
      const response = await api.get(url, { responseType: 'blob' })
      const href = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = href
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(href)
    } catch (err) {
      console.error('PDF download failed:', err)
      toast.error(t('records.downloadError'))
    } finally {
      setDownloading(null)
    }
  }

  if (loading) return <SkeletonList count={2} />

  if (loadError) {
    return (
      <Card>
        <CardBody>
          <ErrorState title={t('records.loadError')} onRetry={load} retryLabel={t('common.retry')} />
        </CardBody>
      </Card>
    )
  }

  if (records.length === 0) {
    return (
      <Card>
        <CardBody>
          <EmptyState
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            title={t('records.empty')}
            message={t('records.emptyHelp')}
            action={!patientIdProp && <Link to="/patient/care/doctors" className="btn btn-primary">{t('doctors.bookAppointment')}</Link>}
          />
        </CardBody>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-small text-muted">{t('records.subtitle')}</p>
        {records.length > 1 && (
          <Button
            variant="secondary" size="sm"
            loading={downloading === 'all'}
            onClick={() => download(`/records/${patientId}/download`, 'gramsathi-health-records.pdf', 'all')}
          >
            {t('records.downloadAll')}
          </Button>
        )}
      </div>

      {records.map(record => {
        // The doctor lives on the populated appointment, not on the record
        // itself — reading record.doctorId meant every entry said "Unknown".
        const doctor = record.appointmentId?.doctorId
        return (
          <Card key={record._id}>
            <div className="card-header flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="card-title">{formatDate(record.createdAt, i18n.language)}</p>
                <p className="text-small text-muted">
                  {t('records.seenBy')}: {doctor?.name || t('records.unknownDoctor')}
                  {doctor?.specialization && ` · ${doctor.specialization}`}
                </p>
              </div>
              <Button
                variant="secondary" size="sm"
                loading={downloading === record._id}
                onClick={() => download(
                  `/records/${patientId}/download/${record._id}`,
                  `gramsathi-record-${formatDate(record.createdAt, 'en-CA')}.pdf`,
                  record._id
                )}
              >
                {t('records.downloadOne')}
              </Button>
            </div>
            <CardBody>
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-caption font-semibold text-muted uppercase tracking-wide mb-1.5">
                    {t('records.diagnosis')}
                  </h3>
                  <p className="text-body whitespace-pre-line">{record.diagnosis}</p>
                </div>
                {record.prescription && (
                  <div>
                    <h3 className="text-caption font-semibold text-muted uppercase tracking-wide mb-1.5">
                      {t('records.prescription')}
                    </h3>
                    <p className="text-body whitespace-pre-line bg-surface-2 rounded-control p-3">
                      {record.prescription}
                    </p>
                    {/* The app already sells these medicines; without this the
                        patient had to read the prescription and start a search
                        from scratch. */}
                    {!patientIdProp && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="mt-3"
                        onClick={() => navigate('/patient/medicine', { state: { prescription: record.prescription } })}
                      >
                        {t('records.orderPrescription')}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        )
      })}
    </div>
  )
}
