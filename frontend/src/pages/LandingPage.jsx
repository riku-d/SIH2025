import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import useReveal from '../hooks/useReveal'
import AppPreview from '../components/landing/AppPreview'

const ICONS = {
  video: 'M15 10l4.55-2.27A1 1 0 0121 8.62v6.76a1 1 0 01-1.45.89L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
  records: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  ai: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 8v4l2.5 2.5',
  pill: 'M10.5 20.5l10-10a5 5 0 00-7-7l-10 10a5 5 0 007 7zM8.5 8.5l7 7',
  signal: 'M2 8.8a15 15 0 0120 0M5 12.5a10 10 0 0114 0M8.5 16a5 5 0 017 0M12 20h.01',
  lang: 'M3 5h12M9 3v2m1.5 12L6 5m0 0L1.5 17M14 21l4-10 4 10M15.5 18h5',
  free: 'M12 8c-1.66 0-3 .9-3 2s1.34 2 3 2 3 .9 3 2-1.34 2-3 2m0-8c1.11 0 2.08.4 2.6 1M12 8V6m0 12v-2M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  download: 'M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z',
  patient: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  doctor: 'M8 3v4m8-4v4M6 9h12a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8a2 2 0 012-2zM12 13v4m-2-2h4',
  shop: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M17 17a2 2 0 100 4 2 2 0 000-4zM9 17a2 2 0 100 4 2 2 0 000-4z',
  hospital: 'M4 21V8l8-5 8 5v13M9 21v-6h6v6M12 10v3m-1.5-1.5h3'
}

const Icon = ({ d, className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
)

export default function LandingPage() {
  const { t } = useTranslation()
  const { isAuthenticated, user } = useAuth()
  useReveal()

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const primaryCta = isAuthenticated
    ? { to: `/${user.role}`, label: t('hero.dashboard') }
    : { to: '/login', label: t('hero.cta') }

  return (
    <div className="w-full overflow-x-clip">

      {/* ───────────────────────── Hero ───────────────────────── */}
      <section className="relative aurora text-white overflow-hidden">
        <div className="absolute inset-0 grid-lines" aria-hidden="true" />
        <div
          className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ground to-transparent"
          aria-hidden="true"
        />

        <div className="container-app relative pt-14 pb-20 sm:pt-20 sm:pb-28">
          <div className="grid lg:grid-cols-[1.05fr_auto] gap-14 lg:gap-10 items-center">
            <div className="max-w-2xl">
              <p className="eyebrow eyebrow-dark reveal">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-300" aria-hidden="true" />
                {t('landing.eyebrow')}
              </p>

              <h1 className="text-d1 text-white mt-6 mb-6 reveal" data-reveal-delay="60">
                {t('landing.headlineA')}{' '}
                <span className="text-gradient">{t('landing.headlineB')}</span>
              </h1>

              <p className="text-lg sm:text-xl text-white/75 leading-relaxed max-w-xl mb-9 reveal" data-reveal-delay="120">
                {t('hero.subtitle')}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-10 reveal" data-reveal-delay="180">
                <Link to={primaryCta.to} className="btn btn-lg bg-white text-primary-700 hover:bg-primary-50 shadow-lifted font-semibold">
                  {primaryCta.label}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6l6 6-6 6" />
                  </svg>
                </Link>
                <button type="button" onClick={() => scrollTo('how')} className="btn btn-lg border border-white/25 text-white hover:bg-white/10 backdrop-blur-sm">
                  {t('hero.ctaSecondary')}
                </button>
              </div>

              <dl className="flex flex-wrap gap-x-10 gap-y-4 reveal" data-reveal-delay="240">
                {['lowBandwidth', 'languages', 'free'].map(key => (
                  <div key={key} className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-accent-200">
                      <Icon d={ICONS[key === 'lowBandwidth' ? 'signal' : key === 'languages' ? 'lang' : 'free']} className="w-4 h-4" />
                    </span>
                    <div>
                      <dt className="text-small font-semibold text-white leading-tight">{t(`trust.${key}.title`)}</dt>
                    </div>
                  </div>
                ))}
              </dl>
            </div>

            <div className="reveal justify-self-center lg:pl-6" data-reveal-delay="300">
              <AppPreview />
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────── How it works ───────────────────── */}
      <section id="how" className="relative bg-ground scroll-mt-20">
        <div className="absolute inset-0 grid-lines-ink" aria-hidden="true" />
        <div className="container-app relative py-16 sm:py-24">
          <div className="max-w-2xl mb-12 reveal">
            <p className="eyebrow eyebrow-light mb-4">{t('landing.howEyebrow')}</p>
            <h2 className="text-d2 text-ink mb-4">{t('landing.howTitle')}</h2>
            <p className="text-lg text-body">{t('landing.howSubtitle')}</p>
          </div>

          <ol className="grid gap-6 md:grid-cols-3 relative">
            {/* The connector is real information: these steps are a sequence. */}
            <div className="hidden md:block absolute top-7 left-[16.6%] right-[16.6%] h-px bg-gradient-to-r from-primary-200 via-accent-200 to-primary-200" aria-hidden="true" />
            {['step1', 'step2', 'step3'].map((key, i) => (
              <li key={key} className="relative reveal" data-reveal-delay={i * 90}>
                <span className="relative z-10 w-14 h-14 rounded-2xl bg-surface border border-line shadow-raised flex items-center justify-center text-d3 font-bold text-primary-600 tabular mb-5">
                  {i + 1}
                </span>
                <h3 className="card-title mb-2">{t(`landing.${key}.title`)}</h3>
                <p className="text-body">{t(`landing.${key}.description`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ─────────────────── Features (bento) ─────────────────── */}
      <section id="features" className="bg-surface border-y border-line scroll-mt-20">
        <div className="container-app py-16 sm:py-24">
          <div className="max-w-2xl mb-12 reveal">
            <p className="eyebrow eyebrow-light mb-4">{t('landing.featuresEyebrow')}</p>
            <h2 className="text-d2 text-ink mb-4">{t('services.title')}</h2>
            <p className="text-lg text-body">{t('services.description')}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-6 auto-rows-[minmax(0,auto)]">
            {/* Lead tile — dark, wide, carries the video call */}
            <article className="bento-dark md:col-span-4 aurora reveal">
              <div className="absolute inset-0 grid-lines" aria-hidden="true" />
              <div className="relative max-w-md">
                <span className="w-11 h-11 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center mb-5">
                  <Icon d={ICONS.video} className="w-5 h-5 text-accent-200" />
                </span>
                <h3 className="text-d3 text-white mb-3">{t('features.teleconsultation.title')}</h3>
                <p className="text-white/70 leading-relaxed">{t('features.teleconsultation.description')}</p>
              </div>
            </article>

            <article className="bento md:col-span-2 reveal" data-reveal-delay="80">
              <span className="w-11 h-11 rounded-xl bg-accent-50 text-accent-600 flex items-center justify-center mb-5">
                <Icon d={ICONS.ai} className="w-5 h-5" />
              </span>
              <h3 className="card-title mb-2">{t('features.symptomChecker.title')}</h3>
              <p className="text-small text-body leading-relaxed">{t('features.symptomChecker.description')}</p>
            </article>

            <article className="bento md:col-span-2 reveal" data-reveal-delay="40">
              <span className="w-11 h-11 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-5">
                <Icon d={ICONS.records} className="w-5 h-5" />
              </span>
              <h3 className="card-title mb-2">{t('features.healthRecords.title')}</h3>
              <p className="text-small text-body leading-relaxed">{t('features.healthRecords.description')}</p>
            </article>

            <article className="bento md:col-span-4 reveal" data-reveal-delay="120">
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <div className="flex-1">
                  <span className="w-11 h-11 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-5">
                    <Icon d={ICONS.pill} className="w-5 h-5" />
                  </span>
                  <h3 className="card-title mb-2">{t('features.medicineTracker.title')}</h3>
                  <p className="text-small text-body leading-relaxed">{t('features.medicineTracker.description')}</p>
                </div>

                {/* Order status strip — the flow, shown rather than described */}
                <div className="shrink-0 w-full sm:w-52 rounded-xl bg-surface-2 border border-line p-4">
                  <p className="text-caption font-semibold text-muted uppercase tracking-wide mb-3">
                    {t('patient.overview.activeOrder')}
                  </p>
                  <ul className="space-y-2.5">
                    {['confirmed', 'preparing', 'dispatched'].map((s, i) => (
                      <li key={s} className="flex items-center gap-2.5 text-caption">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${i < 2 ? 'bg-success-500' : 'bg-line'}`} />
                        <span className={i < 2 ? 'text-ink font-medium' : 'text-muted'}>
                          {t(`status.order.${s}`)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ───────────────────── Who it's for ───────────────────── */}
      <section className="bg-ground">
        <div className="container-app py-16 sm:py-24">
          <div className="max-w-2xl mb-12 reveal">
            <p className="eyebrow eyebrow-light mb-4">{t('landing.rolesEyebrow')}</p>
            <h2 className="text-d2 text-ink mb-4">{t('landing.rolesTitle')}</h2>
            <p className="text-lg text-body">{t('landing.rolesSubtitle')}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['patient', ICONS.patient],
              ['doctor', ICONS.doctor],
              ['pharmacy', ICONS.shop],
              ['hospital', ICONS.hospital]
            ].map(([role, icon], i) => (
              <article
                key={role}
                className="group relative bg-surface rounded-sheet border border-line p-6 transition-all duration-300 hover:border-primary-200 hover:shadow-lifted reveal"
                data-reveal-delay={i * 70}
              >
                <span className="w-11 h-11 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-5 transition-colors group-hover:bg-primary-600 group-hover:text-white">
                  <Icon d={icon} className="w-5 h-5" />
                </span>
                <h3 className="card-title mb-2">{t(`roles.${role}`)}</h3>
                <p className="text-small text-body leading-relaxed">{t(`landing.roleCopy.${role}`)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────── CTA ───────────────────────── */}
      {!isAuthenticated && (
        <section className="bg-surface border-t border-line">
          <div className="container-app py-16 sm:py-24">
            <div className="relative overflow-hidden rounded-sheet aurora px-6 py-14 sm:px-14 sm:py-20 text-center reveal">
              <div className="absolute inset-0 grid-lines" aria-hidden="true" />
              <div className="relative max-w-2xl mx-auto">
                <h2 className="text-d2 text-white mb-4">{t('cta.title')}</h2>
                <p className="text-lg text-white/75 mb-9">{t('cta.description')}</p>
                <Link to="/login" className="btn btn-lg bg-white text-primary-700 hover:bg-primary-50 shadow-lifted font-semibold">
                  {t('cta.button')}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6l6 6-6 6" />
                  </svg>
                </Link>
                <p className="text-caption text-white/55 mt-5">{t('landing.ctaNote')}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ───────────────────────── Footer ─────────────────────── */}
      <footer className="bg-primary-900 text-white/70">
        <div className="container-app py-14">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 mb-12">
            <div className="lg:col-span-2 max-w-sm">
              <div className="flex items-center gap-2.5 mb-4">
                <span className="w-9 h-9 rounded-control bg-white/10 border border-white/15 text-white flex items-center justify-center" aria-hidden="true">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" d="M12 6v12M6 12h12" />
                  </svg>
                </span>
                <span className="font-semibold text-white text-h3">{t('hero.title')}</span>
              </div>
              <p className="text-small leading-relaxed mb-5">{t('footer.tagline')}</p>
              <p className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-danger-500/15 border border-danger-500/25 text-white text-caption font-medium">
                {t('footer.emergencyNote')}
              </p>
            </div>

            <div>
              <h2 className="font-semibold text-white text-small mb-4">{t('footer.quickLinksTitle')}</h2>
              <ul className="space-y-3 text-small">
                <li><button type="button" onClick={() => scrollTo('how')} className="hover:text-white transition-colors">{t('landing.howEyebrow')}</button></li>
                <li><button type="button" onClick={() => scrollTo('features')} className="hover:text-white transition-colors">{t('footer.featuresTitle')}</button></li>
                <li>
                  {isAuthenticated
                    ? <Link to={`/${user.role}`} className="hover:text-white transition-colors">{t('navbar.dashboard')}</Link>
                    : <Link to="/login" className="hover:text-white transition-colors">{t('navbar.loginSignup')}</Link>}
                </li>
              </ul>
            </div>

            <div>
              <h2 className="font-semibold text-white text-small mb-4">{t('footer.contactTitle')}</h2>
              <ul className="space-y-3 text-small">
                <li><a href={`mailto:${t('footer.infoEmail')}`} className="hover:text-white transition-colors break-all">{t('footer.infoEmail')}</a></li>
                <li><a href={`tel:${t('footer.phoneNumber').replace(/\s/g, '')}`} className="hover:text-white transition-colors tabular">{t('footer.phoneNumber')}</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 text-caption">
            <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
