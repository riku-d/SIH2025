import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import api, { friendlyError } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from './ui/Toast'
import { Field, Input, Textarea, Select } from './ui/Field'
import Button, { IconButton } from './ui/Button'
import Card, { CardBody, CardHeader } from './ui/Card'
import AppointmentCard from './AppointmentCard'
import DoctorPicker from './DoctorPicker'
import ConfirmDialog from './ui/ConfirmDialog'
import { SkeletonList } from './ui/Skeleton'
import { EmptyState, ErrorState } from './ui/States'
import { formatFileSize } from '../lib/status'

const MAX_FILES = 5
const MAX_BYTES = 50 * 1024 * 1024

export default function AppointmentBooking({ onJoinRoom, selectedDoctor: doctorFromProps }) {
  const { t } = useTranslation()
  const { userId } = useAuth()
  const toast = useToast()

  const [doctorsBySpecialty, setDoctorsBySpecialty] = useState({})
  const [selectedDoctor, setSelectedDoctor] = useState(doctorFromProps || null)
  const [appointmentDate, setAppointmentDate] = useState('')
  const [symptoms, setSymptoms] = useState('')
  const [consultationType, setConsultationType] = useState('video')
  const [errors, setErrors] = useState({})

  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploadPercent, setUploadPercent] = useState(null)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelling, setCancelling] = useState(false)

  const [mediaFiles, setMediaFiles] = useState([])
  const [isRecording, setIsRecording] = useState(false)
  const [recordingType, setRecordingType] = useState(null)
  const recorderRef = useRef(null)
  const streamRef = useRef(null)
  const videoRef = useRef(null)
  const abortRef = useRef(null)

  const load = useCallback(async () => {
    setLoadError(false)
    try {
      const [doctorsRes, appointmentsRes] = await Promise.all([
        api.get('/users/doctors/specialization'),
        api.get(`/appointments/patient/${userId}`)
      ])
      setDoctorsBySpecialty(doctorsRes.data || {})
      setAppointments(appointmentsRes.data || [])
    } catch (err) {
      console.error('Failed to load booking data:', err)
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { if (userId) load() }, [userId, load])

  useEffect(() => { if (doctorFromProps) setSelectedDoctor(doctorFromProps) }, [doctorFromProps])

  // Always release camera and microphone, even if the user navigates away
  // mid-recording.
  useEffect(() => () => {
    streamRef.current?.getTracks().forEach(track => track.stop())
    abortRef.current?.abort()
  }, [])

  const addFiles = (incoming) => {
    const room = MAX_FILES - mediaFiles.length
    if (room <= 0) {
      toast.warning(t('appointments.attachmentsHint'))
      return
    }
    const accepted = []
    for (const file of incoming.slice(0, room)) {
      if (!file.type.startsWith('video/') && !file.type.startsWith('audio/')) continue
      if (file.size > MAX_BYTES) {
        toast.error(t('appointments.attachmentsHint'))
        continue
      }
      accepted.push(file)
    }
    if (accepted.length) setMediaFiles(prev => [...prev, ...accepted])
  }

  const startRecording = async (type) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        type === 'video' ? { video: true, audio: true } : { audio: true }
      )
      streamRef.current = stream
      if (type === 'video' && videoRef.current) videoRef.current.srcObject = stream

      const recorder = new MediaRecorder(stream, {
        mimeType: type === 'video' ? 'video/webm' : 'audio/webm'
      })
      const chunks = []
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: type === 'video' ? 'video/webm' : 'audio/webm' })
        addFiles([new File([blob], `recording-${type}-${Date.now()}.webm`, { type: blob.type })])
        stream.getTracks().forEach(track => track.stop())
        streamRef.current = null
        if (videoRef.current) videoRef.current.srcObject = null
      }
      recorder.start()
      recorderRef.current = recorder
      setIsRecording(true)
      setRecordingType(type)
    } catch (err) {
      console.error('Recording failed to start:', err)
      toast.error(t('consultation.errors.permission'))
    }
  }

  const stopRecording = () => {
    recorderRef.current?.stop()
    recorderRef.current = null
    setIsRecording(false)
    setRecordingType(null)
  }

  const validate = () => {
    const next = {}
    if (!selectedDoctor) next.doctor = t('appointments.noDoctorSelected')
    if (!appointmentDate) next.date = t('common.required')
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    setUploadPercent(mediaFiles.length ? 0 : null)
    abortRef.current = new AbortController()

    try {
      const formData = new FormData()
      formData.append('patientId', userId)
      formData.append('doctorId', selectedDoctor._id)
      formData.append('requestedDate', appointmentDate)
      formData.append('symptoms', symptoms)
      formData.append('consultationType', consultationType)
      mediaFiles.forEach(file => formData.append('attachments', file))

      await api.post('/appointments/book', formData, {
        signal: abortRef.current.signal,
        // The feature exists for people on slow connections — they need to
        // see it moving, or they assume it froze and upload again.
        onUploadProgress: (event) => {
          if (!mediaFiles.length || !event.total) return
          setUploadPercent(Math.round((event.loaded * 100) / event.total))
        }
      })

      toast.success(t('appointments.requestSent'))
      setAppointmentDate('')
      setSymptoms('')
      setSelectedDoctor(null)
      setMediaFiles([])
      load()
    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return
      console.error('Booking failed:', err)
      toast.error(friendlyError(err))
    } finally {
      setSubmitting(false)
      setUploadPercent(null)
      abortRef.current = null
    }
  }

  const cancelAppointment = async () => {
    setCancelling(true)
    try {
      await api.put(`/appointments/${cancelTarget._id}/cancel`)
      toast.success(t('appointments.cancelled'))
      setCancelTarget(null)
      load()
    } catch (err) {
      console.error('Cancel failed:', err)
      toast.error(friendlyError(err))
    } finally {
      setCancelling(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <h2 className="section-title">{t('appointments.book')}</h2>
        </CardHeader>
        <CardBody>
          <form onSubmit={submit} noValidate className="flex flex-col gap-6">
            <div>
              <h3 className="label mb-2.5">{t('appointments.selectDoctor')}</h3>
              {loading ? (
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-card" />)}
                </div>
              ) : (
                <DoctorPicker
                  doctorsBySpecialty={doctorsBySpecialty}
                  selected={selectedDoctor}
                  onSelect={(d) => { setSelectedDoctor(d); setErrors(e => ({ ...e, doctor: undefined })) }}
                />
              )}
              {errors.doctor && <p className="error-text mt-2" role="alert">{errors.doctor}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={t('appointments.preferredDate')}
                hint={t('appointments.preferredDateHint')}
                error={errors.date}
                required
              >
                {(props) => (
                  <Input
                    {...props} type="date" min={today} value={appointmentDate} error={errors.date}
                    onChange={(e) => { setAppointmentDate(e.target.value); setErrors(err => ({ ...err, date: undefined })) }}
                  />
                )}
              </Field>
              <Field label={t('appointments.consultationType')}>
                {(props) => (
                  <Select {...props} value={consultationType} onChange={(e) => setConsultationType(e.target.value)}>
                    <option value="video">{t('appointments.video')}</option>
                    <option value="chat">{t('appointments.chat')}</option>
                  </Select>
                )}
              </Field>
            </div>

            <Field label={t('appointments.symptoms')}>
              {(props) => (
                <Textarea
                  {...props} rows="3" placeholder={t('appointments.symptomsPlaceholder')}
                  value={symptoms} onChange={(e) => setSymptoms(e.target.value)}
                />
              )}
            </Field>

            <fieldset className="border-t border-line-soft pt-5">
              <legend className="sr-only">{t('appointments.attachments')}</legend>
              <h3 className="label mb-1">{t('appointments.attachments')}</h3>
              <p className="hint mb-3">{t('appointments.attachmentsHint')}</p>

              <div className="flex flex-wrap gap-2 mb-3">
                {!isRecording ? (
                  <>
                    <Button type="button" variant="secondary" size="sm" onClick={() => startRecording('video')}
                      disabled={mediaFiles.length >= MAX_FILES}>
                      {t('appointments.recordVideo')}
                    </Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => startRecording('audio')}
                      disabled={mediaFiles.length >= MAX_FILES}>
                      {t('appointments.recordAudio')}
                    </Button>
                  </>
                ) : (
                  <Button type="button" variant="danger" size="sm" onClick={stopRecording}>
                    {t('appointments.stopRecording')}
                  </Button>
                )}
              </div>

              {isRecording && (
                <div className="mb-3" role="status">
                  <p className="flex items-center gap-2 text-small text-danger-500 font-medium mb-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-danger-500 animate-pulse" aria-hidden="true" />
                    {recordingType === 'video' ? t('appointments.recordingVideo') : t('appointments.recordingAudio')}
                  </p>
                  {recordingType === 'video' && (
                    <video ref={videoRef} autoPlay muted playsInline
                      className="w-full max-w-xs rounded-control bg-ink aspect-video" />
                  )}
                </div>
              )}

              <input
                type="file" multiple accept="video/*,audio/*" disabled={isRecording || mediaFiles.length >= MAX_FILES}
                onChange={(e) => { addFiles(Array.from(e.target.files)); e.target.value = '' }}
                aria-label={t('appointments.chooseFiles')}
                className="block w-full text-small text-muted
                           file:mr-3 file:py-2.5 file:px-4 file:rounded-control file:border file:border-line
                           file:text-small file:font-medium file:bg-surface-2 file:text-ink
                           hover:file:bg-line-soft file:cursor-pointer"
              />

              {mediaFiles.length > 0 && (
                <ul className="mt-3 flex flex-col gap-2">
                  {mediaFiles.map((file, i) => {
                    const url = URL.createObjectURL(file)
                    return (
                      <li key={`${file.name}-${i}`} className="flex items-center gap-3 p-3 bg-surface-2 rounded-control">
                        <div className="min-w-0 flex-1">
                          <p className="text-small font-medium text-ink truncate">{file.name}</p>
                          <p className="text-caption text-muted tabular">{formatFileSize(file.size)}</p>
                          {/* Playback before submitting — you couldn't check a
                              recording before sending it to a doctor. */}
                          {file.type.startsWith('audio') ? (
                            <audio controls src={url} className="mt-2 w-full max-w-xs h-9" />
                          ) : (
                            <video controls src={url} className="mt-2 w-full max-w-[14rem] rounded" />
                          )}
                        </div>
                        <IconButton
                          label={t('appointments.removeFile')}
                          onClick={() => setMediaFiles(prev => prev.filter((_, idx) => idx !== i))}
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                            <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </IconButton>
                      </li>
                    )
                  })}
                </ul>
              )}
            </fieldset>

            {uploadPercent !== null && (
              <div role="status" aria-live="polite">
                <div className="flex justify-between text-small mb-1.5">
                  <span className="text-ink font-medium">{t('appointments.uploading', { percent: uploadPercent })}</span>
                  <span className="text-muted tabular">{uploadPercent}%</span>
                </div>
                <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-600 transition-[width] duration-200" style={{ width: `${uploadPercent}%` }} />
                </div>
                <p className="hint mt-1.5">{t('appointments.uploadingHint')}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button type="submit" loading={submitting} disabled={isRecording} className="flex-1 sm:flex-none">
                {submitting ? t('appointments.submitting') : t('appointments.submit')}
              </Button>
              {submitting && uploadPercent !== null && (
                <Button type="button" variant="secondary" onClick={() => abortRef.current?.abort()}>
                  {t('common.cancel')}
                </Button>
              )}
            </div>
          </form>
        </CardBody>
      </Card>

      <section>
        <h2 className="section-title mb-4">{t('appointments.yourAppointments')}</h2>
        {loading ? (
          <SkeletonList count={2} />
        ) : loadError ? (
          <Card><CardBody><ErrorState onRetry={load} retryLabel={t('common.retry')} /></CardBody></Card>
        ) : appointments.length === 0 ? (
          <Card>
            <CardBody>
              <EmptyState
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                    <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" />
                  </svg>
                }
                title={t('appointments.empty')}
                message={t('appointments.emptyHelp')}
              />
            </CardBody>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {appointments.map(appointment => (
              <AppointmentCard
                key={appointment._id}
                appointment={appointment}
                perspective="patient"
                actions={
                  <>
                    {appointment.status === 'confirmed' && onJoinRoom && (
                      <Button size="sm" onClick={() => onJoinRoom(appointment._id)}>
                        {t('appointments.joinConsultation')}
                      </Button>
                    )}
                    {['pending', 'confirmed'].includes(appointment.status) && (
                      <Button variant="ghost" size="sm" className="text-danger-500"
                        onClick={() => setCancelTarget(appointment)}>
                        {t('appointments.cancelRequest')}
                      </Button>
                    )}
                  </>
                }
              />
            ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={cancelAppointment}
        loading={cancelling}
        title={t('appointments.cancelTitle')}
        message={t('appointments.cancelMessage')}
        confirmLabel={t('appointments.cancelConfirm')}
        cancelLabel={t('appointments.cancelKeep')}
      />
    </div>
  )
}
