import React, { useEffect, useState } from 'react'
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { navFor } from '../../config/navigation'
import { LANGUAGES } from '../../translations/i18n'
import Dropdown, { DropdownItem } from '../ui/Dropdown'
import Avatar from '../ui/Avatar'

const Icon = ({ d, className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
)

/**
 * The application chrome, distinct from the marketing header. Signed-in
 * routes get a persistent sidebar on desktop and a thumb-reachable bottom
 * bar on mobile — the pattern every Indian consumer app already uses, so
 * it needs no learning.
 *
 * Tabs no longer switch between features; they only ever appear inside a
 * destination, for sub-views of one thing.
 */
export default function AppShell({ badges = {}, children }) {
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const items = navFor(user?.role)
  const current = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0]

  useEffect(() => { setMobileNavOpen(false) }, [location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const accountMenu = ({ close }) => (
    <>
      <div className="px-4 py-2.5 border-b border-line-soft mb-1">
        <p className="text-small font-medium text-ink truncate">{user?.name}</p>
        <p className="text-caption text-muted">{t(`roles.${user?.role}`, user?.role)}</p>
      </div>
      <DropdownItem onClick={() => { close(); navigate(`/${user.role}/profile`) }}>
        {t('navbar.profile')}
      </DropdownItem>
      <div className="px-2 py-1.5">
        <p className="px-2 pb-1.5 text-caption text-muted">{t('navbar.language')}</p>
        <div className="flex gap-1">
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              type="button"
              onClick={() => i18n.changeLanguage(l.code)}
              aria-pressed={i18n.language === l.code}
              className={`flex-1 px-2 py-2 rounded-control text-caption font-medium transition-colors ${
                i18n.language === l.code ? 'bg-primary-600 text-white' : 'bg-surface-2 text-body hover:bg-line-soft'
              }`}
            >
              {l.short}
            </button>
          ))}
        </div>
      </div>
      <div className="divider my-1.5" />
      <DropdownItem onClick={() => { close(); handleLogout() }} className="text-danger-500">
        {t('navbar.logout')}
      </DropdownItem>
    </>
  )

  return (
    <div className="min-h-screen bg-ground lg:grid lg:grid-cols-[248px_1fr]">

      {/* ───────── Desktop sidebar ───────── */}
      <aside className="hidden lg:flex flex-col sticky top-0 h-screen bg-surface border-r border-line">
        <Link to="/" className="flex items-center gap-2.5 px-5 h-16 shrink-0 border-b border-line rounded-control">
          <span className="w-8 h-8 rounded-control bg-primary-600 text-white flex items-center justify-center" aria-hidden="true">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" d="M12 6v12M6 12h12" />
            </svg>
          </span>
          <span className="font-semibold text-ink tracking-tight">GramSathi</span>
        </Link>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label={t('nav.primary')}>
          {items.map(item => (
            <NavLink
              key={item.key}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-control text-small font-medium transition-colors ${
                  isActive ? 'bg-primary-50 text-primary-600' : 'text-body hover:bg-surface-2 hover:text-ink'
                }`
              }
            >
              <Icon d={item.icon} />
              <span className="flex-1 truncate">{t(item.labelKey)}</span>
              {badges[item.badge] > 0 && (
                <span className="shrink-0 min-w-[1.25rem] h-5 px-1.5 rounded-full bg-warning-500 text-white text-[0.6875rem] font-semibold flex items-center justify-center tabular">
                  {badges[item.badge]}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-line">
          <Dropdown
            align="left"
            placement="top"
            label={t('navbar.account')}
            trigger={({ toggle, ...aria }) => (
              <button
                type="button"
                onClick={toggle}
                {...aria}
                className="w-full flex items-center gap-3 px-2 py-2 rounded-control hover:bg-surface-2 transition-colors"
              >
                <Avatar name={user?.name || ''} size="sm" />
                <span className="min-w-0 flex-1 text-left">
                  <span className="block text-small font-medium text-ink truncate">{user?.name}</span>
                  <span className="block text-caption text-muted truncate">{t(`roles.${user?.role}`, user?.role)}</span>
                </span>
                <svg className="w-4 h-4 text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          >
            {accountMenu}
          </Dropdown>
        </div>
      </aside>

      {/* ───────── Main column ───────── */}
      <div className="flex flex-col min-w-0">

        {/* Mobile top bar — identity and account only; destinations live
            in the bottom bar where the thumb is. */}
        <header className="lg:hidden sticky top-0 z-30 bg-surface border-b border-line">
          <div className="flex items-center justify-between gap-3 h-14 px-4">
            <Link to="/" className="flex items-center gap-2 rounded-control">
              <span className="w-7 h-7 rounded-control bg-primary-600 text-white flex items-center justify-center" aria-hidden="true">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                  <path strokeLinecap="round" d="M12 6v12M6 12h12" />
                </svg>
              </span>
              <span className="font-semibold text-ink text-small tracking-tight">GramSathi</span>
            </Link>

            <Dropdown
              label={t('navbar.account')}
              trigger={({ toggle, ...aria }) => (
                <button
                  type="button"
                  onClick={toggle}
                  {...aria}
                  aria-label={t('navbar.account')}
                  className="flex items-center gap-1.5 p-1 rounded-full hover:bg-surface-2"
                >
                  <Avatar name={user?.name || ''} size="sm" />
                  <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
            >
              {accountMenu}
            </Dropdown>
          </div>
        </header>

        <main id="main" className="flex-1 pb-20 lg:pb-0 min-w-0">{children}</main>

        {/* ───────── Mobile bottom bar ───────── */}
        <nav
          className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-surface border-t border-line"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          aria-label={t('nav.primary')}
        >
          <ul className="flex">
            {items.map(item => (
              <li key={item.key} className="flex-1">
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `relative flex flex-col items-center justify-center gap-1 py-2.5 min-h-touch transition-colors ${
                      isActive ? 'text-primary-600' : 'text-muted'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute top-0 inset-x-4 h-0.5 rounded-full bg-primary-600" aria-hidden="true" />
                      )}
                      <span className="relative">
                        <Icon d={item.icon} className="w-[22px] h-[22px]" />
                        {badges[item.badge] > 0 && (
                          <span className="absolute -top-1 -right-2 min-w-[1rem] h-4 px-1 rounded-full bg-warning-500 text-white text-[0.625rem] font-bold flex items-center justify-center tabular">
                            {badges[item.badge]}
                          </span>
                        )}
                      </span>
                      <span className="text-[0.6875rem] font-medium leading-none">{t(item.labelKey)}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  )
}
