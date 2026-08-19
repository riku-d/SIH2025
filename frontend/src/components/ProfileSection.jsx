import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import api, { friendlyError } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from './ui/Toast'
import Card, { CardBody, CardHeader } from './ui/Card'
import Button from './ui/Button'
import Avatar from './ui/Avatar'
import Modal from './ui/Modal'
import { Field, Input, Textarea, PasswordInput } from './ui/Field'
import { SkeletonCard } from './ui/Skeleton'
import { ErrorState } from './ui/States'

export default function ProfileSection() {
  const { t } = useTranslation()
  const { userId, updateUser } = useAuth()
  const toast = useToast()

  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({})
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [saving, setSaving] = useState(false)

  const [passwordOpen, setPasswordOpen] = useState(false)
  const [passwordForm, setPasswordForm] = useState({})
  const [passwordErrors, setPasswordErrors] = useState({})
  const [savingPassword, setSavingPassword] = useState(false)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setLoadError(false)
    try {
      const { data } = await api.get(`/users/${userId}`)
      setProfile(data)
      setForm(data)
    } catch (err) {
      console.error('Failed to load profile:', err)
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { load() }, [load])

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data } = await api.put(`/users/${userId}`, form)
      setProfile(data)
      setForm(data)
      // Was setEditing(false) — an undefined function, so this threw after
      // the save succeeded and the form never left edit mode.
      setIsEditing(false)
      updateUser({ name: data.name })
      toast.success(t('profile.saved'))
    } catch (err) {
      console.error('Profile save failed:', err)
      toast.error(t('profile.saveError'))
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async (e) => {
    e.preventDefault()
    const next = {}
    if (!passwordForm.currentPassword) next.currentPassword = t('auth.errors.passwordRequired')
    if (!passwordForm.newPassword) next.newPassword = t('auth.errors.passwordRequired')
    else if (passwordForm.newPassword.length < 6) next.newPassword = t('auth.errors.passwordShort')
    if (passwordForm.confirmPassword !== passwordForm.newPassword) next.confirmPassword = t('auth.errors.confirmMismatch')
    setPasswordErrors(next)
    if (Object.keys(next).length) return

    setSavingPassword(true)
    try {
      await api.put(`/users/${userId}/password`, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      })
      toast.success(t('profile.passwordUpdated'))
      setPasswordOpen(false)
      setPasswordForm({})
    } catch (err) {
      console.error('Password change failed:', err)
      toast.error(t('profile.passwordError'))
    } finally {
      setSavingPassword(false)
    }
  }

  if (loading) return <SkeletonCard />
  if (loadError) {
    return (
      <Card><CardBody>
        <ErrorState title={t('profile.loadError')} onRetry={load} retryLabel={t('common.retry')} />
      </CardBody></Card>
    )
  }

  const detail = (label, value) => value ? (
    <div key={label}>
      <dt className="text-caption font-semibold text-muted uppercase tracking-wide mb-0.5">{label}</dt>
      <dd className="text-body">{value}</dd>
    </div>
  ) : null

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="section-title">{t('profile.title')}</h2>
              <p className="text-small text-muted mt-1">{t('profile.subtitle')}</p>
            </div>
            {!isEditing && (
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => setPasswordOpen(true)}>
                  {t('profile.changePassword')}
                </Button>
                <Button size="sm" onClick={() => setIsEditing(true)}>{t('profile.edit')}</Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardBody>
          {isEditing ? (
            <form onSubmit={save} className="flex flex-col gap-4">
              <Field label={t('common.name')} required>
                {(props) => <Input {...props} value={form.name || ''} onChange={set('name')} required autoComplete="name" />}
              </Field>
              <Field label={t('common.phone')}>
                {(props) => <Input {...props} type="tel" inputMode="tel" value={form.phone || ''} onChange={set('phone')} autoComplete="tel" />}
              </Field>
              <Field label={t('profile.bio')}>
                {(props) => <Textarea {...props} rows="3" placeholder={t('profile.bioPlaceholder')} value={form.bio || ''} onChange={set('bio')} />}
              </Field>

              {profile.role === 'patient' && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t('profile.age')}>
                    {(props) => <Input {...props} type="number" inputMode="numeric" min="1" max="120" value={form.age || ''} onChange={set('age')} />}
                  </Field>
                  <Field label={t('profile.village')}>
                    {(props) => <Input {...props} value={form.village || ''} onChange={set('village')} />}
                  </Field>
                </div>
              )}

              {profile.role === 'doctor' && (
                <>
                  <Field label={t('profile.specialization')}>
                    {(props) => <Input {...props} value={form.specialization || ''} onChange={set('specialization')} />}
                  </Field>
                  <Field label={t('profile.qualification')}>
                    {(props) => <Input {...props} value={form.qualification || ''} onChange={set('qualification')} />}
                  </Field>
                  <Field label={t('profile.availability')} hint={t('auth.availabilityPlaceholder')}>
                    {(props) => <Input {...props} value={form.availability || ''} onChange={set('availability')} />}
                  </Field>
                </>
              )}

              <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => { setIsEditing(false); setForm(profile) }}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" loading={saving}>{t('common.saveChanges')}</Button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <Avatar name={profile.name} src={profile.profilePicture} size="xl" />
                <div className="min-w-0">
                  <h3 className="text-h2 text-ink truncate">{profile.name}</h3>
                  <p className="text-body">{t(`roles.${profile.role}`, profile.role)}</p>
                  {profile.email && <p className="text-small text-muted break-all">{profile.email}</p>}
                </div>
              </div>

              <dl className="grid gap-4 sm:grid-cols-2">
                {detail(t('common.phone'), profile.phone)}
                {profile.role === 'patient' && detail(t('profile.age'), profile.age)}
                {profile.role === 'patient' && detail(t('profile.village'), profile.village)}
                {profile.role === 'doctor' && detail(t('profile.specialization'), profile.specialization)}
                {profile.role === 'doctor' && detail(t('profile.qualification'), profile.qualification)}
                {profile.role === 'doctor' && detail(t('profile.availability'), profile.availability)}
              </dl>

              {profile.bio && (
                <div>
                  <h4 className="text-caption font-semibold text-muted uppercase tracking-wide mb-1.5">{t('profile.bio')}</h4>
                  <p className="text-body whitespace-pre-line">{profile.bio}</p>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* The password endpoint existed from the start but had no UI anywhere. */}
      <Modal
        open={passwordOpen}
        onClose={() => { setPasswordOpen(false); setPasswordErrors({}) }}
        title={t('profile.changePassword')}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPasswordOpen(false)}>{t('common.cancel')}</Button>
            <Button form="password-form" type="submit" loading={savingPassword}>{t('profile.updatePassword')}</Button>
          </>
        }
      >
        <form id="password-form" onSubmit={changePassword} noValidate className="flex flex-col gap-4">
          <Field label={t('profile.currentPassword')} error={passwordErrors.currentPassword} required>
            {(props) => (
              <PasswordInput {...props} autoComplete="current-password" label={t('auth.showPassword')}
                value={passwordForm.currentPassword || ''} error={passwordErrors.currentPassword}
                onChange={(e) => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))} />
            )}
          </Field>
          <Field label={t('profile.newPassword')} hint={t('auth.passwordHint')} error={passwordErrors.newPassword} required>
            {(props) => (
              <PasswordInput {...props} autoComplete="new-password" label={t('auth.showPassword')}
                value={passwordForm.newPassword || ''} error={passwordErrors.newPassword}
                onChange={(e) => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))} />
            )}
          </Field>
          <Field label={t('profile.confirmNewPassword')} error={passwordErrors.confirmPassword} required>
            {(props) => (
              <PasswordInput {...props} autoComplete="new-password" label={t('auth.showPassword')}
                value={passwordForm.confirmPassword || ''} error={passwordErrors.confirmPassword}
                onChange={(e) => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))} />
            )}
          </Field>
        </form>
      </Modal>
    </>
  )
}
