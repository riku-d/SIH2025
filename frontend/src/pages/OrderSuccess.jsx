import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import { useToast } from '../components/ui/Toast'
import api from '../services/api'
import Badge from '../components/ui/Badge'
import { orderStatus } from '../lib/status'
import { useTranslation } from 'react-i18next'

export default function OrderSuccess() {
  const { t } = useTranslation()
  const toast = useToast()
  const { orderId } = useParams()
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || user.role !== 'patient') {
      navigate('/login')
      return
    }
    fetchOrder()
  }, [])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      const { data } = await api.get(`/pharmacy/orders/${orderId}`)
      setOrder(data)
    } catch (error) {
      console.error('Error fetching order:', error)
      toast.error('Order not found')
      navigate('/patient')
    } finally {
      setLoading(false)
    }
  }


  if (loading) {
    return (
      <PageLayout title="Order Confirmation">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading order details...</div>
        </div>
      </PageLayout>
    )
  }

  if (!order) {
    return (
      <PageLayout title="Order Not Found">
        <div className="text-center py-12">
          <div className="text-muted text-lg mb-4">Order not found</div>
          <Link to="/patient" className="btn btn-primary">Back to Dashboard</Link>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout title="Order Placed Successfully! 🎉">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Success Message */}
        <div className="card bg-success-50 border-success-100">
          <div className="card-body text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-success-600 mb-2">Order Placed Successfully!</h2>
            <p className="text-success-600 mb-4">
              Your order has been confirmed and sent to the pharmacy for processing.
            </p>
            <div className="text-lg font-semibold text-success-600">
              Order ID: {order.orderId}
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Order Information */}
          <div className="card">
            <div className="card-body">
              <h3 className="section-title mb-4">Order Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">Order ID:</span>
                  <span className="font-mono">{order.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Status:</span>
                  <Badge tone={orderStatus(order.status, t).tone}>{orderStatus(order.status, t).label}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Order Type:</span>
                  <span className="capitalize">{order.orderType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Order Date:</span>
                  <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Payment Method:</span>
                  <span>Cash on {order.orderType === 'delivery' ? 'Delivery' : 'Pickup'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pharmacy Information */}
          <div className="card">
            <div className="card-body">
              <h3 className="section-title mb-4">Pharmacy Details</h3>
              <div className="space-y-2">
                <div className="font-semibold">{order.pharmacyId?.name}</div>
                <div className="text-small text-muted">
                  📍 {order.pharmacyId?.address || order.pharmacyId?.location}
                </div>
                <div className="text-small text-muted">
                  📞 {order.pharmacyId?.contact}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="card">
          <div className="card-body">
            <h3 className="section-title mb-4">Order Items</h3>
            <div className="space-y-3">
              {order.items?.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-surface-2 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{item.medicineName}</div>
                    <div className="text-small text-muted">
                      Quantity: {item.quantity} × ₹{item.finalPrice}
                    </div>
                  </div>
                  <div className="font-semibold">₹{item.total}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Billing Details */}
        <div className="card">
          <div className="card-body">
            <h3 className="section-title mb-4">Billing Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{order.totalAmount - (order.deliveryFee || 0)}</span>
              </div>
              {order.deliveryFee > 0 && (
                <div className="flex justify-between">
                  <span>Delivery Fee:</span>
                  <span>₹{order.deliveryFee}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-lg border-t pt-2">
                <span>Total Amount:</span>
                <span>₹{order.totalAmount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery/Pickup Information */}
        {order.orderType === 'delivery' && order.deliveryAddress ? (
          <div className="card">
            <div className="card-body">
              <h3 className="section-title mb-4">Delivery Address</h3>
              <div className="text-body">
                <div className="font-medium">{order.deliveryAddress.name}</div>
                <div>{order.deliveryAddress.phone}</div>
                <div>{order.deliveryAddress.addressLine1}</div>
                {order.deliveryAddress.addressLine2 && <div>{order.deliveryAddress.addressLine2}</div>}
                <div>{order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}</div>
                {order.deliveryAddress.landmark && <div>Near {order.deliveryAddress.landmark}</div>}
              </div>
              {order.estimatedDelivery && (
                <div className="mt-4 p-3 bg-info-50 rounded-lg">
                  <div className="text-info-600 font-medium">
                    🚚 Estimated Delivery: {new Date(order.estimatedDelivery).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-body">
              <h3 className="section-title mb-4">Pickup Information</h3>
              <div className="p-3 bg-warning-50 rounded-lg">
                <div className="text-warning-600 font-medium mb-2">
                  🏪 Please collect your order from:
                </div>
                <div className="text-warning-600">
                  <div className="font-medium">{order.pharmacyId?.name}</div>
                  <div>{order.pharmacyId?.address || order.pharmacyId?.location}</div>
                  <div>📞 {order.pharmacyId?.contact}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Prescription Notice */}
        {order.prescriptionRequired && (
          <div className="card bg-warning-50 border-warning-100">
            <div className="card-body">
              <div className="flex items-start space-x-3">
                <div className="text-2xl">⚠️</div>
                <div>
                  <h4 className="font-semibold text-warning-600 mb-2">Prescription Required</h4>
                  <p className="text-warning-600 text-small">
                    Please have your valid prescription ready for verification 
                    {order.orderType === 'delivery' ? ' at the time of delivery' : ' when collecting from the pharmacy'}.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Link to="/patient" className="btn btn-primary">
            Back to Dashboard
          </Link>
          <Link to="/patient/medicine" className="btn btn-secondary">
            Continue Shopping
          </Link>
        </div>

        {/* Contact Information */}
        <div className="card">
          <div className="card-body text-center">
            <h3 className="section-title mb-2">Need Help?</h3>
            <p className="text-muted text-small mb-4">
              If you have any questions about your order, please contact the pharmacy directly.
            </p>
            <div className="space-y-2">
              <div className="font-medium">{order.pharmacyId?.name}</div>
              <div className="text-small text-muted">📞 {order.pharmacyId?.contact}</div>
            </div>
          </div>
        </div>

      </div>
    </PageLayout>
  )
}