import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

// Import assets
import heroBanner from '../assets/images/hero-banner.png'
import doctorIllustration from '../assets/images/doctor-illustration.svg'
import patientIllustration from '../assets/images/patient-illustration.svg'
import waveDivider from '../assets/images/wave-divider.svg'
import mobileAppMockup from '../assets/images/mobile-app-mockup.svg'
import teleconsultationIcon from '../assets/images/teleconsultation-icon.svg'
import healthRecordsIcon from '../assets/images/health-records-icon.svg'
import medicineTrackerIcon from '../assets/images/medicine-tracker-icon.svg'
import logo from '../assets/images/logo.svg'

export default function LandingPage() {
  const { t } = useTranslation()
  // Testimonial data
  const testimonials = [
    {
      id: 1,
      name: 'Dr. Rajesh Kumar',
      role: 'Cardiologist',
      content: 'This platform has allowed me to reach patients in remote villages who would otherwise have no access to specialized cardiac care.',
      avatar: '👨‍⚕️'
    },
    {
      id: 2,
      name: 'Meera Devi',
      role: 'Patient',
      content: 'I no longer need to travel 50km to consult with my doctor. The video calls are clear and the medicine reminders are very helpful.',
      avatar: '👩'
    },
    {
      id: 3,
      name: 'Suresh Patel',
      role: 'Village Health Worker',
      content: 'The platform has transformed how we deliver healthcare in our village. We can now connect patients with specialists instantly.',
      avatar: '👨‍⚕️'
    }
  ];

  return (
    <div className="w-full">
      {/* Hero Section - Full Width */}
      <section className="relative overflow-hidden w-full min-h-[70vh] bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 flex flex-col justify-center items-center text-white px-6 py-20 min-h-[70vh]">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 text-center max-w-4xl leading-tight">
            {t('hero.title')}
          </h1>
          <p className="text-xl md:text-2xl max-w-3xl text-center font-light mb-10 text-blue-100">
            {t('hero.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            {!JSON.parse(localStorage.getItem('user') || 'null') ? (
              <Link to="/login" className="btn-primary text-lg px-8 py-4 bg-white text-blue-700 hover:bg-blue-50 font-semibold">
                Get Started Today
              </Link>
            ) : (
              <Link to={`/${JSON.parse(localStorage.getItem('user')).role}`} className="btn-primary text-lg px-8 py-4 bg-white text-blue-700 hover:bg-blue-50 font-semibold">
                Go to Dashboard
              </Link>
            )}
            <a href="#features" className="btn text-lg px-8 py-4 border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur font-semibold">
              {t('hero.cta')}
            </a>
          </div>
        </div>
        {/* Decorative wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-16">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="white"></path>
          </svg>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-16 bg-gray-50">
        <div className="container-app text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">{t('mission.title')}</h2>
          <p className="text-slate-600 max-w-4xl mx-auto text-xl leading-relaxed">{t('mission.description')}</p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container-app">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4 text-center">{t('services.title')}</h2>
          <p className="text-slate-600 text-center mb-12 text-lg">{t('services.description')}</p>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="card transform transition-all duration-300 hover:scale-105 hover:shadow-xl bg-white border-l-4 border-l-blue-500">
              <div className="card-body text-center p-8">
                <div className="w-24 h-24 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-4 text-slate-800">{t('features.teleconsultation.title')}</h3>
                <p className="text-slate-600 leading-relaxed">{t('features.teleconsultation.description')}</p>
              </div>
            </div>
            <div className="card transform transition-all duration-300 hover:scale-105 hover:shadow-xl bg-white border-l-4 border-l-green-500">
              <div className="card-body text-center p-8">
                <div className="w-24 h-24 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-4 text-slate-800">Health Records</h3>
                <p className="text-slate-600 leading-relaxed">{t('features.healthRecords.description')}</p>
              </div>
            </div>
            <div className="card transform transition-all duration-300 hover:scale-105 hover:shadow-xl bg-white border-l-4 border-l-purple-500">
              <div className="card-body text-center p-8">
                <div className="w-24 h-24 mx-auto mb-6 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-4 text-slate-800">Medicine Tracker</h3>
                <p className="text-slate-600 leading-relaxed">{t('features.medicineTracker.description')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 py-20 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container-app relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">{t('impact.title')}</h2>
          <p className="text-blue-100 text-center mb-12 text-lg">{t('impact.description')}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center max-w-5xl mx-auto">
            <div className="transform hover:scale-105 transition-transform">
              <div className="text-5xl md:text-6xl font-bold mb-3 text-yellow-300">500+</div>
              <div className="text-blue-100 font-medium text-lg">{t('impact.villages')}</div>
            </div>
            <div className="transform hover:scale-105 transition-transform">
              <div className="text-5xl md:text-6xl font-bold mb-3 text-yellow-300">10,000+</div>
              <div className="text-blue-100 font-medium text-lg">{t('impact.consultations')}</div>
            </div>
            <div className="transform hover:scale-105 transition-transform">
              <div className="text-5xl md:text-6xl font-bold mb-3 text-yellow-300">200+</div>
              <div className="text-blue-100 font-medium text-lg">{t('impact.doctors')}</div>
            </div>
            <div className="transform hover:scale-105 transition-transform">
              <div className="text-5xl md:text-6xl font-bold mb-3 text-yellow-300">50+</div>
              <div className="text-blue-100 font-medium text-lg">{t('impact.pharmacies')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="container-app">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4 text-center">{t('testimonials.title')}</h2>
          <p className="text-slate-600 text-center mb-12 text-lg">{t('testimonials.subtitle')}</p>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-8 transform hover:scale-105 transition-all duration-300 relative">
                <div className="text-blue-600 text-6xl mb-4 opacity-20 absolute top-4 left-4">“</div>
                <div className="relative z-10">
                  <p className="text-slate-700 mb-6 italic text-lg leading-relaxed">{testimonial.content}</p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl mr-4">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800">{testimonial.name}</div>
                      <div className="text-slate-500 text-sm">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container-app text-center">
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border border-blue-100 p-12 max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">{t('cta.title')}</h2>
            <p className="text-slate-600 max-w-2xl mx-auto mb-8 text-lg leading-relaxed">{t('cta.description')}</p>
            {!JSON.parse(localStorage.getItem('user') || 'null') && (
              <Link to="/login" className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-4 rounded-lg font-semibold transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
                {t('cta.button')}
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="container-app">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-xl mb-4 text-blue-400">{t('hero.title')}</h3>
              <p className="text-slate-300 leading-relaxed">Bringing quality healthcare to every corner of rural communities through innovative technology.</p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">{t('footer.quickLinksTitle')}</h3>
              <ul className="space-y-3 text-slate-300">
                <li><a href="#features" className="hover:text-blue-400 transition-colors">Features</a></li>
                {!JSON.parse(localStorage.getItem('user') || 'null') ? (
                  <li><Link to="/login" className="hover:text-blue-400 transition-colors">Login</Link></li>
                ) : (
                  <li><Link to={`/${JSON.parse(localStorage.getItem('user')).role}`} className="hover:text-blue-400 transition-colors">Dashboard</Link></li>
                )}
                <li><a href="#" className="hover:text-blue-400 transition-colors">About Us</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">{t('footer.featuresTitle')}</h3>
              <ul className="space-y-3 text-slate-300">
                <li><a href="#" className="hover:text-blue-400 transition-colors">Teleconsultation</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Health Records</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Medicine Tracker</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">{t('footer.contactTitle')}</h3>
              <ul className="space-y-3 text-slate-300">
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                  </svg>
                  {t('footer.infoEmail')}
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                  </svg>
                  +91 98765 43210
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center">
            <p className="text-slate-400">{t('footer.copyright', { year: new Date().getFullYear() })}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}


