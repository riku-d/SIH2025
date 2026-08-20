import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api, { friendlyError } from '../../../services/api'
import { useToast } from '../../ui/Toast'
import Button from '../../ui/Button'

/**
 * Actions the answer earned.
 *
 * Built from what retrieval actually returned rather than from a model tool
 * call: the medicine, its price and its stock are already known facts from
 * MedicineStock, so the card is deterministic. A model deciding on its own
 * to put items in someone's cart is neither needed here nor safe.
 *
 * Nothing here is automatic — the patient taps. Ordering medicine and
 * booking a consultation both cost money.
 */
export default function ActionCards({ citations }) {
  const { t } = useTranslation()
  const toast = useToast()
  const navigate = useNavigate()
  const [busyId, setBusyId] = useState(null)
  const [added, setAdded] = useState(() => new Set())

  const medicines = (citations || []).filter(c => c.kind === 'medicine' && c.medicineId)
  // Same medicine at two pharmacies is two real options; same row twice is not.
  const seen = new Set()
  const unique = medicines.filter(m => !seen.has(m.medicineId) && seen.add(m.medicineId)).slice(0, 3)

  if (!unique.length) return null

  const addToCart = async (medicine) => {
    setBusyId(medicine.medicineId)
    try {
      await api.post('/pharmacy/cart/add', {
        pharmacyId: medicine.pharmacyId,
        medicineId: medicine.medicineId,
        quantity: 1
      })
      setAdded(prev => new Set(prev).add(medicine.medicineId))
      toast.success(t('assistant.addedToCart', { name: medicine.title }))
    } catch (err) {
      toast.error(friendlyError(err))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <ul className="flex flex-col gap-2 w-full max-w-[92%] sm:max-w-[80%]">
      {unique.map(m => (
        <li
          key={m.medicineId}
          className="flex items-center gap-3 p-3 rounded-card border border-line bg-surface shadow-rest"
        >
          <span className="shrink-0 w-9 h-9 rounded-control bg-primary-50 text-primary-700 flex items-center justify-center">
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 20.5l10-10a5 5 0 00-7-7l-10 10a5 5 0 007 7zM8.5 8.5l7 7" />
            </svg>
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-small font-semibold text-ink truncate">{m.title}</p>
            <p className="text-caption text-muted truncate">
              {m.label}
              {typeof m.price === 'number' && <span className="tabular"> · ₹{m.price}</span>}
            </p>
          </div>

          {/* A prescription-only medicine is not something to hand someone a
              one-tap order button for. */}
          {m.prescriptionRequired ? (
            <span className="badge badge-warning shrink-0">{t('assistant.prescriptionOnly')}</span>
          ) : !m.inStock ? (
            <span className="badge badge-neutral shrink-0">{t('assistant.outOfStock')}</span>
          ) : added.has(m.medicineId) ? (
            <Button variant="secondary" size="sm" className="shrink-0" onClick={() => navigate(`/patient/medicine/${m.pharmacyId}`)}>
              {t('assistant.viewCart')}
            </Button>
          ) : (
            <Button
              size="sm"
              className="shrink-0"
              loading={busyId === m.medicineId}
              onClick={() => addToCart(m)}
            >
              {t('assistant.addToCart')}
            </Button>
          )}
        </li>
      ))}
    </ul>
  )
}
