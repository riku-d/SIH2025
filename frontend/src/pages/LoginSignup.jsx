import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api, { friendlyError } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Field, Input, Select, PasswordInput } from '../components/ui/Field'
import Button from '../components/ui/Button'
import Alert from '../components/ui/Alert'

const ROLES = ['patient', 'doctor', 'pharmacy', 'hospital']

export default function LoginSignup() {
  const [isLogin, setIsLogin] = useState(true)
  const [form, setForm] = useState({ role: 'patient' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const { t } = useTranslation()
  const { login } = useAuth()

  useEffect(() => {
    if (params.get('expired')) setFormError(t('auth.sessionExpired'))
  }, [params, t])

  const set = (key) => (e) => {
    const value = e.target.value
    setForm(f => ({ ...f, [key]: value }))
    // Clear the field's error as soon as the user starts fixing it.
    setErrors(prev => (prev[key] ? { ...prev, [key]: undefined } : prev))
  }

  const validate = () => {
    const next = {}
    const email = (form.email || '').trim()
    const password = form.password || ''

    if (!email) next.email = t('auth.errors.emailRequired')
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = t('auth.errors.emailInvalid')

    if (!password) next.password = t('auth.errors.passwordRequired')
    else if (!isLogin && password.length < 6) next.password = t('auth.errors.passwordShort')

    if (!isLogin) {
      if (!(form.name || '').trim()) next.name = t('auth.errors.nameRequired')
      if (form.confirmPassword !== password) next.confirmPassword = t('auth.errors.confirmMismatch')
      if (form.role === 'patient' && form.age) {
        const age = Number(form.age)
        if (!Number.isFinite(age) || age < 1 || age > 120) next.age = t('auth.errors.ageInvalid')
      }
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const switchMode = (login) => {
    setIsLogin(login)
    setErrors({})
    setFormError('')
    setNotice('')
  }

  const submit = async (e) => {
    e.preventDefault()
    setFormError('')
    setNotice('')
    if (!validate()) return

    setSubmitting(true)
    try {
      if (isLogin) {
        const { data } = await api.post('/auth/login', {
          email: form.email.trim(),
          password: form.password
        })
        login(data.token, data.user)
        // Every role has a route named after it — the old ternary had no
        // hospital branch, so hospital users were bounced back to the
        // landing page after a successful sign-in.
        const returnTo = sessionStorage.getItem('auth:returnTo')
        sessionStorage.removeItem('auth:returnTo')
        navigate(returnTo || location.state?.from || `/${data.user.role}`, { replace: true })
      } else {
        await api.post('/auth/register', {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
          age: form.age,
          village: form.village,
          specialization: form.specialization,
          qualification: form.qualification,
          availability: form.availability
        })
        // Carry the email across so signing in is one field, not two.
        setForm({ role: form.role, email: form.email })
        setIsLogin(true)
        setNotice(t('auth.accountCreated'))
      }
    } catch (err) {
      console.error('Auth failed:', err)
      setFormError(friendlyError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container-app py-10 sm:py-14">
      <div className="max-w-md mx-auto">
        <div className="card">
          <div className="card-body">
            <div role="tablist" aria-label={t('navbar.account')} className="grid grid-cols-2 gap-1 p-1 bg-surface-2 rounded-control mb-6">
              <button
                type="button" role="tab" aria-selected={isLogin}
                onClick={() => switchMode(true)}
                className={`py-2.5 rounded-control text-small font-medium min-h-touch transition-colors ${
                  isLogin ? 'bg-surface text-ink shadow-rest' : 'text-muted hover:text-ink'
                }`}
              >
                {t('auth.signInTab')}
              </button>
              <button
                type="button" role="tab" aria-selected={!isLogin}
                onClick={() => switchMode(false)}
                className={`py-2.5 rounded-control text-small font-medium min-h-touch transition-colors ${
                  !isLogin ? 'bg-surface text-ink shadow-rest' : 'text-muted hover:text-ink'
                }`}
              >
                {t('auth.signUpTab')}
              </button>
            </div>

            <div className="mb-6">
              <h1 className="text-h2 text-ink mb-1.5">{isLogin ? t('auth.signInTitle') : t('auth.signUpTitle')}</h1>
              <p className="text-small text-muted">{isLogin ? t('auth.signInSubtitle') : t('auth.signUpSubtitle')}</p>
            </div>

            {notice && <Alert tone="success" className="mb-5">{notice}</Alert>}
            {formError && <Alert tone="error" className="mb-5">{formError}</Alert>}

            <form onSubmit={submit} noValidate className="flex flex-col gap-4">
              {!isLogin && (
                <>
                  <Field label={t('auth.name')} error={errors.name} required>
                    {(props) => (
                      <Input
                        {...props} type="text" autoComplete="name"
                        placeholder={t('auth.namePlaceholder')}
                        value={form.name || ''} onChange={set('name')} error={errors.name}
                      />
                    )}
                  </Field>

                  <Field label={t('auth.role')} required>
                    {(props) => (
                      <Select {...props} value={form.role} onChange={set('role')}>
                        {ROLES.map(r => <option key={r} value={r}>{t(`roles.${r}`)}</option>)}
                      </Select>
                    )}
                  </Field>

                  {form.role === 'patient' && (
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label={t('auth.age')} error={errors.age}>
                        {(props) => (
                          <Input {...props} type="number" inputMode="numeric" min="1" max="120"
                            value={form.age || ''} onChange={set('age')} error={errors.age} />
                        )}
                      </Field>
                      <Field label={t('auth.village')}>
                        {(props) => <Input {...props} type="text" value={form.village || ''} onChange={set('village')} />}
                      </Field>
                    </div>
                  )}

                  {form.role === 'doctor' && (
                    <>
                      <Field label={t('auth.specialization')}>
                        {(props) => (
                          <Input {...props} type="text" placeholder={t('auth.specializationPlaceholder')}
                            value={form.specialization || ''} onChange={set('specialization')} />
                        )}
                      </Field>
                      <Field label={t('auth.qualification')}>
                        {(props) => (
                          <Input {...props} type="text" placeholder={t('auth.qualificationPlaceholder')}
                            value={form.qualification || ''} onChange={set('qualification')} />
                        )}
                      </Field>
                      <Field label={t('auth.availability')}>
                        {(props) => (
                          <Input {...props} type="text" placeholder={t('auth.availabilityPlaceholder')}
                            value={form.availability || ''} onChange={set('availability')} />
                        )}
                      </Field>
                    </>
                  )}
                </>
              )}

              <Field label={t('auth.email')} error={errors.email} required>
                {(props) => (
                  <Input
                    {...props} type="email" inputMode="email" autoComplete="email"
                    autoCapitalize="none" spellCheck="false"
                    placeholder={t('auth.emailPlaceholder')}
                    value={form.email || ''} onChange={set('email')} error={errors.email}
                  />
                )}
              </Field>

              <Field
                label={t('auth.password')}
                error={errors.password}
                hint={!isLogin ? t('auth.passwordHint') : undefined}
                required
              >
                {(props) => (
                  <PasswordInput
                    {...props}
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    label={t('auth.showPassword')}
                    value={form.password || ''} onChange={set('password')} error={errors.password}
                  />
                )}
              </Field>

              {!isLogin && (
                <Field label={t('auth.confirmPassword')} error={errors.confirmPassword} required>
                  {(props) => (
                    <PasswordInput
                      {...props} autoComplete="new-password" label={t('auth.showPassword')}
                      value={form.confirmPassword || ''} onChange={set('confirmPassword')}
                      error={errors.confirmPassword}
                    />
                  )}
                </Field>
              )}

              <Button type="submit" block loading={submitting} className="mt-1">
                {submitting
                  ? (isLogin ? t('auth.signingIn') : t('auth.creatingAccount'))
                  : (isLogin ? t('auth.signIn') : t('auth.createAccount'))}
              </Button>
            </form>

            <p className="text-small text-muted text-center mt-6">
              {isLogin ? t('auth.noAccount') : t('auth.haveAccount')}{' '}
              <button type="button" onClick={() => switchMode(!isLogin)} className="link font-medium">
                {isLogin ? t('auth.signUpTab') : t('auth.signInTab')}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
