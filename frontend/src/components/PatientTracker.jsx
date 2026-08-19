import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import api, { friendlyError } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from './ui/Toast'
import Card, { CardBody, CardHeader } from './ui/Card'
import Button from './ui/Button'
import Avatar from './ui/Avatar'
import Modal from './ui/Modal'
import { Field, Textarea, Select } from './ui/Field'
import { SkeletonList } from './ui/Skeleton'
import { EmptyState, ErrorState } from './ui/States'
import { formatDate } from '../lib/status'

export default function PatientTracker() {
  const { t, i18n } = useTranslation()
  const { userId } = useAuth()
  const toast = useToast()

  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [selected, setSelected] = useState(null)
  const [records, setRecords] = useState([])
  const [recordsLoading, setRecordsLoading] = useState(false)

  const [writeOpen, setWriteOpen] = useState(false)
  const [draft, setDraft] = useState({ appointmentId: '', diagnosis: '', prescription: '' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!userId) return
    setLoadError(false)
    try {
      const { data } = await api.get(`/appointments/doctor/${userId}`)
      setAppointments(data || [])
    } catch (err) {
      console.error('Failed to load patients:', err)
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { load() }, [load])

  const patients = useMemo(() => {
    const seen = new Map()
    for (const appointment of appointments) {
      const patient = appointment.patientId
      if (patient?._id && !seen.has(patient._id)) seen.set(patient._id, patient)
    }
    return [...seen.values()]
  }, [appointments])

  // Appointments for this patient, so the doctor chooses which visit the
  // record belongs to instead of it silently binding to whichever one
  // Array.find happened to return first.
  const patientAppointments = useMemo(
    () => appointments.filter(a => a.patientId?._id === selected?._id),
    [appointments, selected]
  )

  const selectPatient = async (patient) => {
    setSelected(patient)
    setRecordsLoading(true)
    try {
      const { data } = await api.get(`/records/${patient._id}`)
      setRecords(data || [])
    } catch (err) {
      console.error('Failed to load patient records:', err)
      setRecords([])
    } finally {
      setRecordsLoading(false)
    }
  }

  const openWrite = () => {
    setDraft({
      appointmentId: patientAppointments[0]?._id || '',
      diagnosis: '',
      prescription: ''
    })
    setWriteOpen(true)
  }

  const saveRecord = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/records/create', {
        patientId: selected._id,
        appointmentId: draft.appointmentId,
        diagnosis: draft.diagnosis,
        prescription: draft.prescription
      })
      toast.success(t('records.recordSaved'))
      setWriteOpen(false)
      selectPatient(selected)
    } catch (err) {
      console.error('Record save failed:', err)
      toast.error(friendlyError(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <SkeletonList count={2} />
  if (loadError) {
    return <Card><CardBody><ErrorState onRetry={load} retryLabel={t('common.retry')} /></CardBody></Card>
  }
  if (patients.length === 0) {
    return (
      <Card><CardBody>
        <EmptyState title={t('records.noPatients')} message={t('records.noPatientsHelp')} />
      </CardBody></Card>
    )
  }

  return (
    <>
      <div className="grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader><h2 className="card-title">{t('doctor.sections.patients')}</h2></CardHeader>
            <CardBody className="p-0 sm:p-0">
              <ul className="divide-y divide-line-soft max-h-[32rem] overflow-y-auto">
                {patients.map(patient => (
                  <li key={patient._id}>
                    <button
                      type="button"
                      onClick={() => selectPatient(patient)}
                      aria-current={selected?._id === patient._id}
                      className={`w-full text-left flex items-center gap-3 px-5 py-4 min-h-touch transition-colors
                                  ${selected?._id === patient._id ? 'bg-primary-50' : 'hover:bg-surface-2'}`}
                    >
                      <Avatar name={patient.name} size="sm" />
                      <span className="min-w-0">
                        <span className="block font-medium text-ink truncate">{patient.name}</span>
                        <span className="block text-caption text-muted truncate">
                          {[patient.age, patient.village].filter(Boolean).join(' · ') || patient.email}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </div>

        <div className="lg:col-span-3">
          {!selected ? (
            <Card><CardBody>
              <EmptyState title={t('records.selectPatient')} message={t('records.selectPatientHelp')} />
            </CardBody></Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={selected.name} size="md" />
                    <div className="min-w-0">
                      <h2 className="card-title truncate">{selected.name}</h2>
                      <p className="text-small text-muted truncate">
                        {[selected.age, selected.village].filter(Boolean).join(' · ') || selected.email}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" onClick={openWrite} disabled={patientAppointments.length === 0}>
                    {t('records.addTitle')}
                  </Button>
                </div>
              </CardHeader>
              <CardBody>
                <h3 className="text-caption font-semibold text-muted uppercase tracking-wide mb-3">
                  {t('records.history')}
                </h3>
                {recordsLoading ? (
                  <SkeletonList count={1} />
                ) : records.length === 0 ? (
                  <p className="text-small text-muted">{t('records.empty')}</p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {records.map(record => (
                      <li key={record._id} className="border border-line rounded-card p-4">
                        <p className="text-caption text-muted mb-2">{formatDate(record.createdAt, i18n.language)}</p>
                        <p className="text-small font-medium text-ink mb-1">{t('records.diagnosis')}</p>
                        <p className="text-small text-body mb-3 whitespace-pre-line">{record.diagnosis}</p>
                        {record.prescription && (
                          <>
                            <p className="text-small font-medium text-ink mb-1">{t('records.prescription')}</p>
                            <p className="text-small text-body whitespace-pre-line">{record.prescription}</p>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      <Modal
        open={writeOpen}
        onClose={() => setWriteOpen(false)}
        title={t('records.addForPatient', { name: selected?.name || '' })}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setWriteOpen(false)}>{t('common.cancel')}</Button>
            <Button form="record-form" type="submit" loading={saving} disabled={!draft.diagnosis.trim()}>
              {t('records.saveRecord')}
            </Button>
          </>
        }
      >
        <form id="record-form" onSubmit={saveRecord} className="flex flex-col gap-4">
          <Field label={t('records.forAppointment')} required>
            {(props) => (
              <Select
                {...props} required value={draft.appointmentId}
                onChange={(e) => setDraft(d => ({ ...d, appointmentId: e.target.value }))}
              >
                {patientAppointments.map(a => (
                  <option key={a._id} value={a._id}>
                    {formatDate(a.confirmedDate || a.requestedDate, i18n.language)}
                    {a.timeSlot ? ` · ${a.timeSlot}` : ''}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={t('records.diagnosis')} required>
            {(props) => (
              <Textarea
                {...props} rows="4" required placeholder={t('records.diagnosisPlaceholder')}
                value={draft.diagnosis} onChange={(e) => setDraft(d => ({ ...d, diagnosis: e.target.value }))}
              />
            )}
          </Field>
          <Field label={t('records.prescription')}>
            {(props) => (
              <Textarea
                {...props} rows="4" placeholder={t('records.prescriptionPlaceholder')}
                value={draft.prescription} onChange={(e) => setDraft(d => ({ ...d, prescription: e.target.value }))}
              />
            )}
          </Field>
        </form>
      </Modal>
    </>
  )
}
