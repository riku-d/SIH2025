import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import logo from '../assets/images/logo.png'

export default function Navbar() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { t, i18n } = useTranslation()
  
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
  }

  return (
    <nav className="bg-white/60 backdrop-blur-xl shadow-lg sticky top-0 z-50 border-b border-white/20">
      <div className="container-app py-3 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Rural Telemedicine" className="h-12" />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-5">
          <Link to="/" className="text-slate-700 hover:text-blue-600 font-medium">{t('navbar.home')}</Link>
          {user && user.role === 'patient' ? (
            <Link to="/doctors" className="text-slate-700 hover:text-blue-600 font-medium">{t('navbar.doctors')}</Link>
          ) : (
            <a href="#features" className="text-slate-700 hover:text-blue-600 font-medium">{t('navbar.features')}</a>
          )}
          <a href="#" className="text-slate-700 hover:text-blue-600 font-medium">{t('navbar.about')}</a>
          <a href="#" className="text-slate-700 hover:text-blue-600 font-medium">{t('navbar.contact')}</a>
          
          {/* Language Selector */}
          <div className="relative group">
            <button
              id="language-selector"
              className="flex items-center gap-2 text-slate-700 hover:text-blue-600 font-medium"
            >
              <span>{i18n.language.toUpperCase()}</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="absolute right-0 mt-1 w-48 bg-white/95 backdrop-blur-md rounded-md shadow-lg py-1 hidden group-hover:block" id="language-dropdown">
              <a
                href="#" 
                onClick={(e) => { e.preventDefault(); changeLanguage('en'); }}
                className={`block px-4 py-2 text-sm ${i18n.language === 'en' ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-gray-100'}`}
              >
                {t('languages.english')}
              </a>
              <a
                href="#" 
                onClick={(e) => { e.preventDefault(); changeLanguage('hi'); }}
                className={`block px-4 py-2 text-sm ${i18n.language === 'hi' ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-gray-100'}`}
              >
                {t('languages.hindi')}
              </a>
              <a
                href="#" 
                onClick={(e) => { e.preventDefault(); changeLanguage('pa'); }}
                className={`block px-4 py-2 text-sm ${i18n.language === 'pa' ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-gray-100'}`}
              >
                {t('languages.punjabi')}
              </a>
            </div>
          </div>
          
          {!user && (
            <Link to="/login" className="btn-primary ml-2">
              {t('navbar.loginSignup')}
            </Link>
          )}
          
          {user && (
            <div className="flex items-center gap-3">
              <div className="text-slate-700">
                <span className="font-medium">{user.name}</span>
                <span className="text-xs text-slate-500 ml-2 capitalize">({user.role})</span>
              </div>
              <Link 
                to={`/${user.role}`} 
                className="btn-primary py-1 px-3 text-sm"
              >
                {t('navbar.dashboard')}
              </Link>
              <button 
                onClick={logout} 
                className="btn-secondary py-1 px-3 text-sm"
              >
                {t('navbar.logout')}
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <button 
          className="md:hidden text-slate-700" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/70 backdrop-blur-xl border-t border-white/30 py-3">
          <div className="container-app space-y-3">
            <Link to="/" className="block text-slate-700 hover:text-blue-600 font-medium py-2" onClick={() => setMobileMenuOpen(false)}>{t('navbar.home')}</Link>
            {user && user.role === 'patient' ? (
              <Link to="/doctors" className="block text-slate-700 hover:text-blue-600 font-medium py-2" onClick={() => setMobileMenuOpen(false)}>{t('navbar.doctors')}</Link>
            ) : (
              <a href="#features" className="block text-slate-700 hover:text-blue-600 font-medium py-2" onClick={() => setMobileMenuOpen(false)}>{t('navbar.features')}</a>
            )}
            <a href="#" className="block text-slate-700 hover:text-blue-600 font-medium py-2" onClick={() => setMobileMenuOpen(false)}>{t('navbar.about')}</a>
            <a href="#" className="block text-slate-700 hover:text-blue-600 font-medium py-2" onClick={() => setMobileMenuOpen(false)}>{t('navbar.contact')}</a>
            
            {/* Mobile Language Selector */}
            <div className="py-2">
              <div className="font-medium mb-1 text-slate-600">{t('languages.english').replace(' ', '')} / {t('languages.hindi').replace(' ', '')} / {t('languages.punjabi').replace(' ', '')}</div>
              <div className="flex gap-1">
                <button
                  onClick={() => { changeLanguage('en'); setMobileMenuOpen(false); }}
                  className={`px-3 py-1 rounded-full text-sm ${i18n.language === 'en' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-slate-700'}`}
                >
                  ENG
                </button>
                <button
                  onClick={() => { changeLanguage('hi'); setMobileMenuOpen(false); }}
                  className={`px-3 py-1 rounded-full text-sm ${i18n.language === 'hi' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-slate-700'}`}
                >
                  हिन्दी
                </button>
                <button
                  onClick={() => { changeLanguage('pa'); setMobileMenuOpen(false); }}
                  className={`px-3 py-1 rounded-full text-sm ${i18n.language === 'pa' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-slate-700'}`}
                >
                  ਪੰਜਾਬੀ
                </button>
              </div>
            </div>
            
            {!user && (
              <Link to="/login" className="block btn-primary w-full text-center" onClick={() => setMobileMenuOpen(false)}>
                {t('navbar.loginSignup')}
              </Link>
            )}
            
            {user && (
              <div className="pt-2 border-t border-slate-200">
                <div className="text-slate-700 mb-2">
                  <span className="font-medium">{user.name}</span>
                  <span className="text-xs text-slate-500 ml-2 capitalize">({user.role})</span>
                </div>
                <button 
                  onClick={() => {
                    logout()
                    setMobileMenuOpen(false)
                  }} 
                  className="btn-secondary w-full"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}


