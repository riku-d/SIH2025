/**
 * One navigation source of truth. Previously the navbar and a six-item
 * tab strip each defined their own list, which is why "Doctors" and
 * "Appointments" — the same job — lived in two different bars.
 *
 * Four destinations per role, maximum: that is what fits a thumb-reachable
 * bottom bar without hiding anything behind a scroll.
 */
export const ICONS = {
  home:      'M3 10.5L12 3l9 7.5M5.5 9.5V20a1 1 0 001 1h11a1 1 0 001-1V9.5',
  care:      'M12 21s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 11c0 5.5-7 10-7 10z',
  records:   'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  medicine:  'M10.5 20.5l10-10a5 5 0 00-7-7l-10 10a5 5 0 007 7zM8.5 8.5l7 7',
  today:     'M8 3v4m8-4v4M4 11h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z',
  inbox:     'M4 13h4l2 3h4l2-3h4M4 13l2.2-7.3A1 1 0 017.2 5h9.6a1 1 0 011 .7L20 13v5a1 1 0 01-1 1H5a1 1 0 01-1-1v-5z',
  calendar:  'M8 3v4m8-4v4M4 11h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z',
  patients:  'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  stock:     'M4 7l8-4 8 4v10l-8 4-8-4V7zM4 7l8 4m0 0l8-4m-8 4v10',
  orders:    'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M17 17a2 2 0 100 4 2 2 0 000-4zM9 17a2 2 0 100 4 2 2 0 000-4z',
  building:  'M4 21V8l8-5 8 5v13M9 21v-6h6v6M12 10v3m-1.5-1.5h3',
  shop:      'M4 8h16l-1 12H5L4 8zM9 8V6a3 3 0 016 0v2',
  profile:   'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
}

const NAV = {
  patient: [
    { key: 'home',     to: '/patient',          icon: ICONS.home,     labelKey: 'nav.patient.home',     end: true },
    { key: 'care',     to: '/patient/care',     icon: ICONS.care,     labelKey: 'nav.patient.care' },
    { key: 'records',  to: '/patient/records',  icon: ICONS.records,  labelKey: 'nav.patient.records' },
    { key: 'medicine', to: '/patient/medicine', icon: ICONS.medicine, labelKey: 'nav.patient.medicine' }
  ],
  doctor: [
    { key: 'today',        to: '/doctor',              icon: ICONS.today,    labelKey: 'nav.doctor.today', end: true },
    { key: 'requests',     to: '/doctor/requests',     icon: ICONS.inbox,    labelKey: 'nav.doctor.requests', badge: 'pendingRequests' },
    { key: 'appointments', to: '/doctor/appointments', icon: ICONS.calendar, labelKey: 'nav.doctor.appointments' },
    { key: 'patients',     to: '/doctor/patients',     icon: ICONS.patients, labelKey: 'nav.doctor.patients' }
  ],
  pharmacy: [
    { key: 'overview',  to: '/pharmacy',           icon: ICONS.home,   labelKey: 'nav.pharmacy.overview', end: true },
    { key: 'medicines', to: '/pharmacy/medicines', icon: ICONS.stock,  labelKey: 'nav.pharmacy.medicines' },
    { key: 'orders',    to: '/pharmacy/orders',    icon: ICONS.orders, labelKey: 'nav.pharmacy.orders' }
  ],
  hospital: [
    { key: 'overview', to: '/hospital', icon: ICONS.building, labelKey: 'nav.hospital.overview', end: true }
  ]
}

export function navFor(role) {
  return NAV[role] || []
}
