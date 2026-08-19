import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import DoctorCard from './DoctorCard'
import { Field, Input, Select } from './ui/Field'
import { EmptyState } from './ui/States'

/**
 * Searchable, filterable and keyboard-navigable. The old booking form
 * rendered every doctor in the system as an unfiltered grid of clickable
 * divs, which stopped working past about twenty doctors.
 */
export default function DoctorPicker({ doctorsBySpecialty, selected, onSelect }) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [specialty, setSpecialty] = useState('')

  const specialties = useMemo(() => Object.keys(doctorsBySpecialty || {}).sort(), [doctorsBySpecialty])

  const doctors = useMemo(() => {
    const pool = specialty
      ? (doctorsBySpecialty[specialty] || [])
      : Object.values(doctorsBySpecialty || {}).flat()
    const q = query.trim().toLowerCase()
    if (!q) return pool
    return pool.filter(d =>
      d.name?.toLowerCase().includes(q) ||
      d.specialization?.toLowerCase().includes(q)
    )
  }, [doctorsBySpecialty, specialty, query])

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t('common.search')}>
          {(props) => (
            <Input
              {...props} type="search"
              placeholder={t('appointments.selectDoctorHint')}
              value={query} onChange={(e) => setQuery(e.target.value)}
            />
          )}
        </Field>
        <Field label={t('doctors.specialty')}>
          {(props) => (
            <Select {...props} value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
              <option value="">{t('doctors.allSpecialties')}</option>
              {specialties.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          )}
        </Field>
      </div>

      {doctors.length === 0 ? (
        <EmptyState title={t('doctors.empty')} message={t('doctors.emptyHelp')} className="py-8" />
      ) : (
        <div
          role="radiogroup"
          aria-label={t('appointments.selectDoctor')}
          className="grid gap-2.5 sm:grid-cols-2 max-h-[26rem] overflow-y-auto pr-1"
        >
          {doctors.map(doctor => (
            <DoctorCard
              key={doctor._id}
              doctor={doctor}
              selected={selected?._id === doctor._id}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}
