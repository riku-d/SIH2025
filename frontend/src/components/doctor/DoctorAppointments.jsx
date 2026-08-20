import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import api, { friendlyError } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../ui/Toast'
import Card, { CardBody } from '../ui/Card'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import { SLOTS, slotLabel } from '../../lib/slots'
import Tabs from '../ui/Tabs'
import { Field, Input, Textarea, Select } from '../ui/Field'
import { SkeletonList } from '../ui/Skeleton'
import { EmptyState, ErrorState } from '../ui/States'
import AppointmentCard from '../AppointmentCard'
import AppointmentAttachments from './AppointmentAttachments'
import { isToday, isFuture } from '../../lib/status'

const TIME_SLOTS = [
  '09:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00',
  '14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00'
]

/**
 * `mode` splits the two jobs the old single list conflated: reviewing new
 * requests, and working through today's confirmed schedule.
 */
export default function DoctorAppointments({ mode = 'all', onJoinRoom }) {
  const { t, i18n } = useTranslation()
  const { userId } = useAuth()
  const toast = useToast()

  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [filter, setFilter] = useState('all')
  const [busy, setBusy] = useState(false)

  const [confirmTarget, setConfirmTarget] = useState(null)
  const [acceptingId, setAcceptingId] = useState(null)
  const [confirmData, setConfirmData] = useState({ confirmedDate: '', timeSlot: '', doctorNotes: '' })
  const [declineTarget, setDeclineTarget] = useState(null)
  const [declineReason, setDeclineReason] = useState('')

  const load = useCallback(async () => {
    if (!userId) return
    setLoadError(false)
    try {
      const { data } = await api.get(`/appointments/doctor/${userId}`)
      setAppointments(data || [])
    } catch (err) {
      console.error('Failed to load appointments:', err)
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { load() }, [load])

  const visible = useMemo(() => {
    if (mode === 'requests') return appointments.filter(a => a.status === 'pending')
    if (mode === 'today') {
      return appointments
        .filter(a => a.status === 'confirmed' && isToday(a.confirmedDate || a.requestedDate))
        .sort((a, b) => (a.timeSlot || '').localeCompare(b.timeSlot || ''))
    }
    if (filter === 'all') return appointments
    return appointments.filter(a => a.status === filter)
  }, [appointments, mode, filter])

  /**
   * Confirms exactly what the patient asked for. The server fills the date
   * and slot from the request when the body omits them, so there is nothing
   * for the doctor to re-enter.
   */
  const acceptAsRequested = async (appointment) => {
    setAcceptingId(appointment._id)
    try {
      await api.put(`/appointments/${appointment._id}/confirm`, {})
      toast.success(t('appointments.confirmed'))
      await load()
      window.dispatchEvent(new CustomEvent('appointments:changed'))
    } catch (err) {
      toast.error(friendlyError(err))
    } finally {
      setAcceptingId(null)
    }
  }

  const confirm = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      await api.put(`/appointments/${confirmTarget._id}/confirm`, confirmData)
      toast.success(t('appointments.confirmed'))
      window.dispatchEvent(new CustomEvent('appointments:changed'))
      setConfirmTarget(null)
      load()
    } catch (err) {
      console.error('Confirm failed:', err)
      toast.error(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  const decline = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      await api.put(`/appointments/${declineTarget._id}/reject`, { rejectionReason: declineReason })
      window.dispatchEvent(new CustomEvent('appointments:changed'))
      toast.success(t('appointments.declined'))
      setDeclineTarget(null)
      setDeclineReason('')
      load()
    } catch (err) {
      console.error('Decline failed:', err)
      toast.error(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <SkeletonList count={3} />
  if (loadError) {
    return <Card><CardBody><ErrorState onRetry={load} retryLabel={t('common.retry')} /></CardBody></Card>
  }

  const emptyCopy = {
    today:    { title: t('doctor.today.empty'),    message: t('doctor.today.emptyHelp') },
    requests: { title: t('doctor.requests.empty'), message: t('doctor.requests.emptyHelp') },
    all:      { title: t('appointments.empty'),    message: t('appointments.emptyHelp') }
  }[mode]

  return (
    <div className="flex flex-col gap-4">
      {mode === 'all' && (
        <Tabs
          items={['all', 'pending', 'confirmed', 'completed'].map(key => ({
            key,
            label: t(`appointments.filters.${key}`),
            badge: key === 'pending' ? appointments.filter(a => a.status === 'pending').length : 0
          }))}
          active={filter}
          onChange={setFilter}
          label={t('common.filter')}
        />
      )}

      {visible.length === 0 ? (
        <Card><CardBody><EmptyState title={emptyCopy.title} message={emptyCopy.message} /></CardBody></Card>
      ) : (
        visible.map(appointment => (
          <AppointmentCard
            key={appointment._id}
            appointment={appointment}
            perspective="doctor"
            actions={
              <>
                {appointment.status === 'pending' && (
                  <>
                    {/* Accepting what was asked for is the overwhelmingly
                        common case, so it is one tap. It used to open a modal
                        and make the doctor retype the date and invent a time
                        slot as free text — for a request that already carried
                        both. Proposing a different time stays available, one
                        step behind, where it belongs. */}
                    <Button
                      size="sm"
                      loading={acceptingId === appointment._id}
                      onClick={() => acceptAsRequested(appointment)}
                    >
                      {appointment.timeSlot
                        ? t('appointments.acceptAt', { time: slotLabel(appointment.timeSlot, i18n.language) })
                        : t('appointments.confirmAction')}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setConfirmTarget(appointment)
                        setConfirmData({
                          confirmedDate: (appointment.requestedDate || '').split('T')[0],
                          timeSlot: appointment.timeSlot || '',
                          doctorNotes: ''
                        })
                      }}
                    >
                      {t('appointments.suggestAnother')}
                    </Button>
                    <Button size="sm" variant="ghost" className="text-danger-500" onClick={() => setDeclineTarget(appointment)}>
                      {t('appointments.declineAction')}
                    </Button>
                  </>
                )}
                {appointment.status === 'confirmed' && onJoinRoom && (
                  <Button size="sm" onClick={() => onJoinRoom(appointment._id)}>
                    {t('appointments.startConsultation')}
                  </Button>
                )}
              </>
            }
          >
            <AppointmentAttachments attachments={appointment.attachments} />
          </AppointmentCard>
        ))
      )}

      <Modal
        open={Boolean(confirmTarget)}
        onClose={() => setConfirmTarget(null)}
        title={t('appointments.confirmTitle', { name: confirmTarget?.patientId?.name || '' })}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmTarget(null)}>{t('common.cancel')}</Button>
            <Button form="confirm-form" type="submit" loading={busy}>{t('appointments.confirmAction')}</Button>
          </>
        }
      >
        <form id="confirm-form" onSubmit={confirm} className="flex flex-col gap-4">
          <Field label={t('appointments.confirmDate')} required>
            {(props) => (
              <Input
                {...props} type="date" required min={new Date().toISOString().split('T')[0]}
                value={confirmData.confirmedDate}
                onChange={(e) => setConfirmData(d => ({ ...d, confirmedDate: e.target.value }))}
              />
            )}
          </Field>
          <Field label={t('appointments.confirmSlot')} required>
            {(props) => (
              /* Was a free-text box, so the same hour arrived as "3pm",
                 "15:00" and "3-4 PM" — which made the double-booking check
                 miss clashes, because two spellings never collide. */
              <Select
                {...props} required value={confirmData.timeSlot}
                onChange={(e) => setConfirmData(d => ({ ...d, timeSlot: e.target.value }))}
              >
                <option value="">{t('appointments.chooseSlot')}</option>
                {SLOTS.map(slot => (
                  <option key={slot} value={slot}>{slotLabel(slot, i18n.language)}</option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={t('appointments.notesForPatient')}>
            {(props) => (
              <Textarea
                {...props} rows="3" placeholder={t('appointments.notesPlaceholder')}
                value={confirmData.doctorNotes}
                onChange={(e) => setConfirmData(d => ({ ...d, doctorNotes: e.target.value }))}
              />
            )}
          </Field>
        </form>
      </Modal>

      <Modal
        open={Boolean(declineTarget)}
        onClose={() => { setDeclineTarget(null); setDeclineReason('') }}
        title={t('appointments.declineTitle')}
        description={t('appointments.declineMessage', { name: declineTarget?.patientId?.name || '' })}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeclineTarget(null)}>{t('common.cancel')}</Button>
            <Button form="decline-form" type="submit" variant="danger" loading={busy} disabled={!declineReason.trim()}>
              {t('appointments.declineAction')}
            </Button>
          </>
        }
      >
        <form id="decline-form" onSubmit={decline}>
          <Field label={t('appointments.declineReasonLabel')} required>
            {(props) => (
              <Textarea
                {...props} rows="4" required placeholder={t('appointments.declineReasonPlaceholder')}
                value={declineReason} onChange={(e) => setDeclineReason(e.target.value)}
              />
            )}
          </Field>
        </form>
      </Modal>
    </div>
  )
}
