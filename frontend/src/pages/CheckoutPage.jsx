import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import { useToast } from '../components/ui/Toast'
import api, { friendlyError } from '../services/api'
import { Field, Input } from '../components/ui/Field'
import Button from '../components/ui/Button'
import { compressImage } from '../lib/compressImage'
import { useTranslation } from 'react-i18next'

export default function CheckoutPage() {
  const toast = useToast()
  const { pharmacyId } = useParams()
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  
  const [cart, setCart] = useState(null)
  const [pharmacy, setPharmacy] = useState(null)
  const [loading, setLoading] = useState(true)
  const { t } = useTranslation()
  const [orderType, setOrderType] = useState('delivery')
  const [prescriptionImage, setPrescriptionImage] = useState('')
  const [attachingPrescription, setAttachingPrescription] = useState(false)
  const prescriptionInputRef = useRef(null)
  const [deliveryAddress, setDeliveryAddress] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    landmark: ''
  })
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [addressErrors, setAddressErrors] = useState({})

  useEffect(() => {
    if (!user || user.role !== 'patient') {
      navigate('/login')
      return
    }
    fetchCheckoutData()
  }, [])

  const fetchCheckoutData = async () => {
    try {
      setLoading(true)
      
      // Fetch cart
      const { data: cartData } = await api.get(`/pharmacy/cart/${pharmacyId}`)
      if (!cartData || cartData.items?.length === 0) {
        toast.error('Your cart is empty!')
        navigate(`/patient/medicine/${pharmacyId}`)
        return
      }
      setCart(cartData)
      
      // Fetch pharmacy details
      const { data: pharmacyData } = await api.get(`/pharmacy/${pharmacyId}`)
      setPharmacy(pharmacyData)
      
      // Set default order type based on pharmacy delivery availability
      if (!pharmacyData.deliveryAvailable) {
        setOrderType('pickup')
      }
      
    } catch (error) {
      console.error('Error fetching checkout data:', error)
      toast.error('Error loading checkout data')
      navigate(`/patient/medicine/${pharmacyId}`)
    } finally {
      setLoading(false)
    }
  }

  const calculateDeliveryFee = () => {
    if (orderType === 'pickup') return 0
    if (!cart) return 0
    
    const subtotal = cart.totalAmount
    return subtotal < 500 ? 50 : 0 // Free delivery above ₹500
  }

  const getFinalTotal = () => {
    if (!cart) return 0
    return cart.totalAmount + calculateDeliveryFee()
  }

  const clearAddressError = (key) =>
    setAddressErrors(prev => (prev[key] ? { ...prev, [key]: undefined } : prev))

  const validateForm = () => {
    if (orderType !== 'delivery') return true
    const next = {}
    if (!deliveryAddress.name.trim()) next.name = 'Please enter the name for delivery.'
    if (!deliveryAddress.phone.trim()) next.phone = 'Please enter a phone number.'
    else if (!/^[0-9]{10}$/.test(deliveryAddress.phone.replace(/\D/g, '').slice(-10))) next.phone = 'Enter a 10-digit mobile number.'
    if (!deliveryAddress.addressLine1.trim()) next.addressLine1 = 'Please enter the address.'
    if (!deliveryAddress.city.trim()) next.city = 'Please enter the city or village.'
    if (!deliveryAddress.state.trim()) next.state = 'Please enter the state.'
    if (!deliveryAddress.pincode.trim()) next.pincode = 'Please enter the pincode.'
    else if (!/^[0-9]{6}$/.test(deliveryAddress.pincode.trim())) next.pincode = 'A pincode is 6 digits.'
    setAddressErrors(next)
    if (Object.keys(next).length) {
      document.querySelector('[aria-invalid="true"]')?.focus()
      return false
    }
    return true
  }

  /** Compressed first: a prescription photographed on a cheap phone is 4MB. */
  const onPrescriptionPicked = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setAttachingPrescription(true)
    try {
      const compressed = await compressImage(file)
      const reader = new FileReader()
      reader.onload = () => {
        setPrescriptionImage(String(reader.result))
        setAddressErrors(prev => ({ ...prev, prescription: undefined }))
      }
      reader.readAsDataURL(compressed)
    } finally {
      setAttachingPrescription(false)
    }
  }

  const placeOrder = async () => {
    if (!validateForm()) return

    if (hasPrescriptionItems() && !prescriptionImage) {
      setAddressErrors(prev => ({ ...prev, prescription: t('checkout.prescriptionMissing') }))
      toast.error(t('checkout.prescriptionMissing'))
      return
    }
    
    try {
      setSubmitting(true)
      
      const orderData = {
        pharmacyId,
        orderType,
        notes
      }
      
      if (orderType === 'delivery') {
        orderData.deliveryAddress = deliveryAddress
      }
      if (prescriptionImage) orderData.prescriptionImage = prescriptionImage
      
      const { data } = await api.post('/pharmacy/orders', orderData)
      
      // Redirect to order success page
      navigate(`/patient/medicine/orders/${data._id}`)
      
    } catch (error) {
      console.error('Order failed:', error)
      toast.error(friendlyError(error))
    } finally {
      setSubmitting(false)
    }
  }

  const hasPrescriptionItems = () => {
    return cart?.items?.some(item => item.medicineId.prescriptionRequired) || false
  }

  if (loading) {
    return (
      <PageLayout title="Checkout">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading checkout...</div>
        </div>
      </PageLayout>
    )
  }

  if (!cart || !pharmacy) {
    return (
      <PageLayout title="Checkout">
        <div className="text-center py-12">
          <div className="text-muted text-lg">Unable to load checkout data</div>
          <button 
            onClick={() => navigate(`/patient/medicine/${pharmacyId}`)}
            className="btn btn-primary mt-4"
          >
            Back to Shop
          </button>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout title={`Checkout - ${pharmacy.name}`}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Checkout Form */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Order Type Selection */}
          <div className="card">
            <div className="card-body">
              <h3 className="section-title mb-4">Order Type</h3>
              <div className="space-y-3">
                {pharmacy.deliveryAvailable && (
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="orderType"
                      value="delivery"
                      checked={orderType === 'delivery'}
                      onChange={e => setOrderType(e.target.value)}
                      className="w-4 h-4 text-info-600"
                    />
                    <div>
                      <div className="font-medium">Home Delivery</div>
                      <div className="text-small text-muted">
                        Get medicines delivered to your address
                        {calculateDeliveryFee() > 0 && (
                          <span className="text-warning-600"> (+₹{calculateDeliveryFee()} delivery fee)</span>
                        )}
                      </div>
                    </div>
                  </label>
                )}
                
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="orderType"
                    value="pickup"
                    checked={orderType === 'pickup'}
                    onChange={e => setOrderType(e.target.value)}
                    className="w-4 h-4 text-info-600"
                  />
                  <div>
                    <div className="font-medium">Store Pickup</div>
                    <div className="text-small text-muted">
                      Collect your order from {pharmacy.name}
                    </div>
                  </div>
                </label>
              </div>
              
              {orderType === 'pickup' && (
                <div className="mt-4 p-3 bg-info-50 rounded-lg">
                  <div className="text-small font-medium text-info-600 mb-1">Pickup Address:</div>
                  <div className="text-small text-info-600">
                    {pharmacy.address || pharmacy.location}<br/>
                    📞 {pharmacy.contact}<br/>
                    ⏰ {pharmacy.openingHours?.open} - {pharmacy.openingHours?.close}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Address Form */}
          {orderType === 'delivery' && (
            <div className="card">
              <div className="card-body">
                <h3 className="section-title mb-4">Delivery Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Full name" error={addressErrors.name} required>
                    {(props) => (
                      <Input {...props} autoComplete="name" error={addressErrors.name}
                        value={deliveryAddress.name}
                        onChange={e => { setDeliveryAddress({...deliveryAddress, name: e.target.value}); clearAddressError('name') }} />
                    )}
                  </Field>
                  <Field label="Phone number" error={addressErrors.phone} required>
                    {(props) => (
                      <Input {...props} type="tel" inputMode="tel" autoComplete="tel" error={addressErrors.phone}
                        placeholder="10-digit mobile number"
                        value={deliveryAddress.phone}
                        onChange={e => { setDeliveryAddress({...deliveryAddress, phone: e.target.value}); clearAddressError('phone') }} />
                    )}
                  </Field>
                  <div className="md:col-span-2">
                    <Field label="Address line 1" error={addressErrors.addressLine1} required>
                      {(props) => (
                        <Input {...props} autoComplete="address-line1" error={addressErrors.addressLine1}
                          placeholder="House number, street"
                          value={deliveryAddress.addressLine1}
                          onChange={e => { setDeliveryAddress({...deliveryAddress, addressLine1: e.target.value}); clearAddressError('addressLine1') }} />
                      )}
                    </Field>
                  </div>
                  <div className="md:col-span-2">
                    <Field label="Address line 2" hint="Optional">
                      {(props) => (
                        <Input {...props} autoComplete="address-line2"
                          value={deliveryAddress.addressLine2}
                          onChange={e => setDeliveryAddress({...deliveryAddress, addressLine2: e.target.value})} />
                      )}
                    </Field>
                  </div>
                  <Field label="City or village" error={addressErrors.city} required>
                    {(props) => (
                      <Input {...props} autoComplete="address-level2" error={addressErrors.city}
                        value={deliveryAddress.city}
                        onChange={e => { setDeliveryAddress({...deliveryAddress, city: e.target.value}); clearAddressError('city') }} />
                    )}
                  </Field>
                  <Field label="State" error={addressErrors.state} required>
                    {(props) => (
                      <Input {...props} autoComplete="address-level1" error={addressErrors.state}
                        value={deliveryAddress.state}
                        onChange={e => { setDeliveryAddress({...deliveryAddress, state: e.target.value}); clearAddressError('state') }} />
                    )}
                  </Field>
                  <Field label="Pincode" error={addressErrors.pincode} required>
                    {(props) => (
                      <Input {...props} inputMode="numeric" maxLength="6" autoComplete="postal-code" error={addressErrors.pincode}
                        placeholder="6 digits"
                        value={deliveryAddress.pincode}
                        onChange={e => { setDeliveryAddress({...deliveryAddress, pincode: e.target.value}); clearAddressError('pincode') }} />
                    )}
                  </Field>
                  <Field label="Landmark" hint="Optional">
                    {(props) => (
                      <Input {...props} placeholder="Near the school, temple…"
                        value={deliveryAddress.landmark}
                        onChange={e => setDeliveryAddress({...deliveryAddress, landmark: e.target.value})} />
                    )}
                  </Field>
                </div>
              </div>
            </div>
          )}

          {/* Prescription Notice */}
          {hasPrescriptionItems() && (
            <div className="card">
              <div className="card-body">
                <h4 className="card-title mb-1">{t('checkout.prescriptionTitle')}</h4>
                <p className="text-small text-body mb-4">{t('checkout.prescriptionHelp')}</p>

                {/* The order used to be placed on a promise to show the
                    prescription later, which meant Schedule H medicines could
                    be bought with one tap. The pharmacy now receives the photo
                    with the order, and the server refuses the order without it. */}
                {prescriptionImage ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={prescriptionImage}
                      alt={t('checkout.prescriptionTitle')}
                      className="h-20 w-20 object-cover rounded-control border border-line"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-small font-medium text-success-600">{t('checkout.prescriptionAdded')}</p>
                      <button
                        type="button"
                        className="link text-caption"
                        onClick={() => setPrescriptionImage('')}
                      >
                        {t('checkout.prescriptionReplace')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <input
                      ref={prescriptionInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="sr-only"
                      onChange={onPrescriptionPicked}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      loading={attachingPrescription}
                      onClick={() => prescriptionInputRef.current?.click()}
                    >
                      {t('checkout.prescriptionAdd')}
                    </Button>
                  </>
                )}

                {addressErrors.prescription && <p className="error-text mt-2" role="alert">{addressErrors.prescription}</p>}
              </div>
            </div>
          )}

          {/* Additional Notes */}
          <div className="card">
            <div className="card-body">
              <h3 className="section-title mb-4">Additional Notes (Optional)</h3>
              <textarea
                className="input"
                placeholder="Any special instructions or notes..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="space-y-6">
          
          {/* Order Items */}
          <div className="card">
            <div className="card-body">
              <h3 className="section-title mb-4">Order Summary</h3>
              <div className="space-y-3">
                {cart.items.map(item => (
                  <div key={item.medicineId._id} className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-small">{item.medicineId.medicineName}</div>
                      <div className="text-caption text-muted">
                        {item.medicineId.brand && `${item.medicineId.brand} • `}
                        Qty: {item.quantity}
                        {item.medicineId.prescriptionRequired && (
                          <span className="text-info-600 font-medium"> • Rx Required</span>
                        )}
                      </div>
                    </div>
                    <div className="text-small font-medium">₹{item.finalPrice * item.quantity}</div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 mt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{cart.totalAmount}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Delivery Fee:</span>
                  <span>
                    {calculateDeliveryFee() === 0 ? 'FREE' : `₹${calculateDeliveryFee()}`}
                  </span>
                </div>
                
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>₹{getFinalTotal()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="card">
            <div className="card-body">
              <h3 className="section-title mb-4">Payment Method</h3>
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    defaultChecked
                    className="w-4 h-4 text-info-600"
                  />
                  <div>
                    <div className="font-medium">Cash on Delivery</div>
                    <div className="text-small text-muted">Pay when you receive your order</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Place Order Button */}
          <button
            onClick={placeOrder}
            disabled={submitting}
            className={`btn btn-primary w-full text-lg py-3 ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {submitting ? 'Placing Order...' : `Place Order - ₹${getFinalTotal()}`}
          </button>

          {/* Back to Shop */}
          <button
            onClick={() => navigate(`/patient/medicine/${pharmacyId}`)}
            className="btn btn-secondary w-full"
          >
            ← Back to Shop
          </button>
        </div>
      </div>
    </PageLayout>
  )
}