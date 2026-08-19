import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import { useToast } from '../components/ui/Toast'
import api from '../services/api'

export default function OrderSuccess() {
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

  const getStatusColor = (status) => {
    const colors = {
      pending: 'text-yellow-600 bg-yellow-100',
      confirmed: 'text-blue-600 bg-blue-100',
      preparing: 'text-purple-600 bg-purple-100',
      ready: 'text-green-600 bg-green-100',
      dispatched: 'text-indigo-600 bg-indigo-100',
      delivered: 'text-green-600 bg-green-100',
      cancelled: 'text-red-600 bg-red-100'
    }
    return colors[status] || colors.pending
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
          <div className="text-gray-500 text-lg mb-4">Order not found</div>
          <Link to="/patient" className="btn-primary">Back to Dashboard</Link>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout title="Order Placed Successfully! 🎉">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Success Message */}
        <div className="card bg-green-50 border-green-200">
          <div className="card-body text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">Order Placed Successfully!</h2>
            <p className="text-green-700 mb-4">
              Your order has been confirmed and sent to the pharmacy for processing.
            </p>
            <div className="text-lg font-semibold text-green-800">
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
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
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
                <div className="text-sm text-gray-600">
                  📍 {order.pharmacyId?.address || order.pharmacyId?.location}
                </div>
                <div className="text-sm text-gray-600">
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
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{item.medicineName}</div>
                    <div className="text-sm text-gray-600">
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
              <div className="text-gray-700">
                <div className="font-medium">{order.deliveryAddress.name}</div>
                <div>{order.deliveryAddress.phone}</div>
                <div>{order.deliveryAddress.addressLine1}</div>
                {order.deliveryAddress.addressLine2 && <div>{order.deliveryAddress.addressLine2}</div>}
                <div>{order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}</div>
                {order.deliveryAddress.landmark && <div>Near {order.deliveryAddress.landmark}</div>}
              </div>
              {order.estimatedDelivery && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="text-blue-800 font-medium">
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
              <div className="p-3 bg-orange-50 rounded-lg">
                <div className="text-orange-800 font-medium mb-2">
                  🏪 Please collect your order from:
                </div>
                <div className="text-orange-700">
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
          <div className="card bg-yellow-50 border-yellow-200">
            <div className="card-body">
              <div className="flex items-start space-x-3">
                <div className="text-2xl">⚠️</div>
                <div>
                  <h4 className="font-semibold text-yellow-800 mb-2">Prescription Required</h4>
                  <p className="text-yellow-700 text-sm">
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
          <Link to="/patient" className="btn-primary">
            Back to Dashboard
          </Link>
          <Link to="/pharmacies" className="btn-secondary">
            Continue Shopping
          </Link>
        </div>

        {/* Contact Information */}
        <div className="card">
          <div className="card-body text-center">
            <h3 className="section-title mb-2">Need Help?</h3>
            <p className="text-gray-600 text-sm mb-4">
              If you have any questions about your order, please contact the pharmacy directly.
            </p>
            <div className="space-y-2">
              <div className="font-medium">{order.pharmacyId?.name}</div>
              <div className="text-sm text-gray-600">📞 {order.pharmacyId?.contact}</div>
            </div>
          </div>
        </div>

      </div>
    </PageLayout>
  )
}