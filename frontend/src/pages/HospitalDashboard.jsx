import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import api, { friendlyError } from '../services/api'
import { useToast } from '../components/ui/Toast'
import PageLayout from '../components/PageLayout'
import Card, { CardBody, CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Avatar from '../components/ui/Avatar'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { Field, Input, Select } from '../components/ui/Field'
import { SkeletonList } from '../components/ui/Skeleton'
import { EmptyState, ErrorState } from '../components/ui/States'

/**
 * Now uses the shared page shell — it previously rendered its own H1 and
 * its own Logout button directly under the navbar's, and leaned on
 * `btn-danger` and `btn-sm`, neither of which existed, so every remove
 * button rendered as unstyled text.
 */
export default function HospitalDashboard() {
  const { t } = useTranslation()
  const toast = useToast()

  const [hospital, setHospital] = useState(null)
  const [doctors, setDoctors] = useState([])
  const [pharmacies, setPharmacies] = useState([])
  const [availablePharmacies, setAvailablePharmacies] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  const [doctorOpen, setDoctorOpen] = useState(false)
  const [pharmacyOpen, setPharmacyOpen] = useState(false)
  const [doctorEmail, setDoctorEmail] = useState('')
  const [pharmacyId, setPharmacyId] = useState('')
  const [busy, setBusy] = useState(false)
  const [removeTarget, setRemoveTarget] = useState(null)

  const load = useCallback(async () => {
    setLoadError(false)
    try {
      const { data } = await api.get('/hospital/my/profile')
      setHospital(data)
      setDoctors(data.doctors || [])
      setPharmacies(data.pharmacies || [])

      const all = await api.get('/pharmacy/all')
      setAvailablePharmacies(
        (all.data || []).filter(p => !(data.pharmacies || []).some(existing => existing._id === p._id))
      )
    } catch (err) {
      console.error('Failed to load hospital data:', err)
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const addDoctor = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      const { data } = await api.get('/users/doctors')
      const doctor = (data || []).find(d => d.email?.toLowerCase() === doctorEmail.trim().toLowerCase())
      if (!doctor) {
        toast.error(t('hospital.doctorNotFound'))
        return
      }
      await api.post('/hospital/doctors/add', { doctorId: doctor._id })
      toast.success(t('hospital.doctorAdded'))
      setDoctorEmail('')
      setDoctorOpen(false)
      load()
    } catch (err) {
      console.error('Add doctor failed:', err)
      toast.error(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  const addPharmacy = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      await api.post('/hospital/pharmacies/add', { pharmacyId })
      toast.success(t('hospital.pharmacyAdded'))
      setPharmacyId('')
      setPharmacyOpen(false)
      load()
    } catch (err) {
      console.error('Add pharmacy failed:', err)
      toast.error(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      if (removeTarget.kind === 'doctor') {
        await api.delete('/hospital/doctors/remove', { data: { doctorId: removeTarget.id } })
        toast.success(t('hospital.doctorRemoved'))
      } else {
        await api.delete('/hospital/pharmacies/remove', { data: { pharmacyId: removeTarget.id } })
        toast.success(t('hospital.pharmacyRemoved'))
      }
      setRemoveTarget(null)
      load()
    } catch (err) {
      console.error('Remove failed:', err)
      toast.error(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <PageLayout title={t('hospital.title')}><SkeletonList count={2} /></PageLayout>
  }

  if (loadError) {
    return (
      <PageLayout title={t('hospital.title')}>
        <Card><CardBody>
          <ErrorState title={t('hospital.loadError')} onRetry={load} retryLabel={t('common.retry')} />
        </CardBody></Card>
      </PageLayout>
    )
  }

  return (
    <PageLayout title={hospital?.name || t('hospital.title')} description={hospital?.address}>
      <div className="flex flex-col gap-5">
        <Card>
          <CardHeader><h2 className="card-title">{t('hospital.profile')}</h2></CardHeader>
          <CardBody>
            <dl className="grid gap-4 sm:grid-cols-2">
              {[
                [t('common.name'), hospital?.name],
                [t('common.email'), hospital?.email],
                [t('common.phone'), hospital?.phone],
                [t('hospital.address'), hospital?.address]
              ].map(([label, value]) => value ? (
                <div key={label}>
                  <dt className="text-caption font-semibold text-muted uppercase tracking-wide mb-0.5">{label}</dt>
                  <dd className="text-body break-words">{value}</dd>
                </div>
              ) : null)}
            </dl>
          </CardBody>
        </Card>

        <AssociationList
          title={t('hospital.doctors')}
          addLabel={t('hospital.addDoctor')}
          onAdd={() => setDoctorOpen(true)}
          items={doctors}
          emptyTitle={t('hospital.noDoctors')}
          emptyMessage={t('hospital.noDoctorsHelp')}
          renderMeta={(d) => [d.specialization, d.email].filter(Boolean).join(' · ')}
          onRemove={(d) => setRemoveTarget({ kind: 'doctor', id: d._id, name: d.name })}
          removeLabel={t('common.remove')}
        />

        <AssociationList
          title={t('hospital.pharmacies')}
          addLabel={t('hospital.addPharmacy')}
          onAdd={() => setPharmacyOpen(true)}
          items={pharmacies}
          emptyTitle={t('hospital.noPharmacies')}
          emptyMessage={t('hospital.noPharmaciesHelp')}
          renderMeta={(p) => [p.location, p.contact].filter(Boolean).join(' · ')}
          onRemove={(p) => setRemoveTarget({ kind: 'pharmacy', id: p._id, name: p.name })}
          removeLabel={t('common.remove')}
        />
      </div>

      <Modal
        open={doctorOpen} onClose={() => setDoctorOpen(false)}
        title={t('hospital.addDoctor')} description={t('hospital.addDoctorHelp')} size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDoctorOpen(false)}>{t('common.cancel')}</Button>
            <Button form="add-doctor" type="submit" loading={busy}>{t('common.add')}</Button>
          </>
        }
      >
        <form id="add-doctor" onSubmit={addDoctor}>
          <Field label={t('common.email')} required>
            {(props) => (
              <Input {...props} type="email" required autoComplete="off"
                placeholder={t('auth.emailPlaceholder')}
                value={doctorEmail} onChange={(e) => setDoctorEmail(e.target.value)} />
            )}
          </Field>
        </form>
      </Modal>

      <Modal
        open={pharmacyOpen} onClose={() => setPharmacyOpen(false)}
        title={t('hospital.addPharmacy')} size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPharmacyOpen(false)}>{t('common.cancel')}</Button>
            <Button form="add-pharmacy" type="submit" loading={busy} disabled={!pharmacyId}>{t('common.add')}</Button>
          </>
        }
      >
        <form id="add-pharmacy" onSubmit={addPharmacy}>
          <Field label={t('hospital.pharmacies')} required>
            {(props) => (
              <Select {...props} required value={pharmacyId} onChange={(e) => setPharmacyId(e.target.value)}>
                <option value="">{t('hospital.choosePharmacy')}</option>
                {availablePharmacies.map(p => (
                  <option key={p._id} value={p._id}>{p.name} — {p.location}</option>
                ))}
              </Select>
            )}
          </Field>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(removeTarget)}
        onClose={() => setRemoveTarget(null)}
        onConfirm={remove}
        loading={busy}
        title={t('hospital.removeTitle')}
        message={t('hospital.removeMessage', { name: removeTarget?.name || '' })}
        confirmLabel={t('common.remove')}
        cancelLabel={t('common.cancel')}
      />
    </PageLayout>
  )
}

/** Cards on mobile, a list on desktop — the old raw tables forced the
 *  whole page to scroll sideways on a phone. */
function AssociationList({ title, addLabel, onAdd, items, emptyTitle, emptyMessage, renderMeta, onRemove, removeLabel }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="card-title">{title}</h2>
          <Button size="sm" onClick={onAdd}>{addLabel}</Button>
        </div>
      </CardHeader>
      <CardBody className={items.length ? 'p-0 sm:p-0' : ''}>
        {items.length === 0 ? (
          <EmptyState title={emptyTitle} message={emptyMessage} className="py-8" />
        ) : (
          <ul className="divide-y divide-line-soft">
            {items.map(item => (
              <li key={item._id} className="flex items-center gap-3 px-5 py-4">
                <Avatar name={item.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink truncate">{item.name}</p>
                  <p className="text-caption text-muted truncate">{renderMeta(item)}</p>
                </div>
                <Button variant="ghost" size="sm" className="text-danger-500 shrink-0" onClick={() => onRemove(item)}>
                  {removeLabel}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  )
}
