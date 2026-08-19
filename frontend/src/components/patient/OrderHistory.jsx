import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../services/api'
import Card, { CardBody } from '../ui/Card'
import Badge from '../ui/Badge'
import { SkeletonList } from '../ui/Skeleton'
import { EmptyState, ErrorState } from '../ui/States'
import { orderStatus, formatDate } from '../../lib/status'

export default function OrderHistory() {
  const { t, i18n } = useTranslation()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const { data } = await api.get('/pharmacy/my/patient-orders')
      setOrders(data.orders || [])
    } catch (err) {
      // Previously this failed silently to the console and rendered "no orders".
      console.error('Failed to load orders:', err)
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <SkeletonList count={2} />
  if (loadError) {
    return <Card><CardBody><ErrorState onRetry={load} retryLabel={t('common.retry')} /></CardBody></Card>
  }
  if (orders.length === 0) {
    return (
      <Card><CardBody>
        <EmptyState
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.3 2.3M17 17a2 2 0 100 4 2 2 0 000-4zM9 17a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
          }
          title={t('pharmacy.cartEmpty')}
          message={t('patient.overview.noOrderHelp')}
          action={<Link to="/pharmacies" className="btn btn-primary">{t('patient.overview.orderMedicine')}</Link>}
        />
      </CardBody></Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {orders.map(order => {
        const status = orderStatus(order.status, t)
        return (
          <Card key={order._id}>
            <CardBody>
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <p className="card-title">{order.orderId}</p>
                  <p className="text-small text-muted">
                    {order.pharmacyId?.name} · {formatDate(order.createdAt, i18n.language)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="card-title tabular">₹{order.totalAmount}</p>
                  <Badge tone={status.tone} className="mt-1">{status.label}</Badge>
                </div>
              </div>

              <ul className="text-small text-body space-y-1 mb-4">
                {order.items?.slice(0, 3).map((item, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    <span className="min-w-0 truncate">{item.medicineName} × {item.quantity}</span>
                    <span className="tabular shrink-0">₹{item.total}</span>
                  </li>
                ))}
                {order.items?.length > 3 && (
                  <li className="text-muted">+{order.items.length - 3}</li>
                )}
              </ul>

              <div className="flex flex-wrap gap-2 pt-4 border-t border-line-soft">
                <Link to={`/order-success/${order._id}`} className="btn btn-secondary btn-sm">
                  {t('common.viewDetails')}
                </Link>
                {order.pharmacyId?._id && (
                  <Link to={`/pharmacy-shop/${order.pharmacyId._id}`} className="btn btn-ghost btn-sm">
                    {t('pharmacy.shopNow')}
                  </Link>
                )}
              </div>
            </CardBody>
          </Card>
        )
      })}
    </div>
  )
}
