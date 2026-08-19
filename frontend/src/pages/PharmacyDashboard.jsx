import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import Tabs from '../components/ui/Tabs'
import { useToast } from '../components/ui/Toast'
import api, { friendlyError } from '../services/api'
import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SIGNAL_URL || 'http://localhost:5000'

export default function PharmacyDashboard() {
  const toast = useToast()
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const navigate = useNavigate()
  const location = useLocation()
  const segment = location.pathname.replace(/^\/pharmacy\/?/, '').split('/')[0]
  const activeTab = ['medicines', 'orders', 'profile'].includes(segment) ? segment : 'overview'
  const setActiveTab = (tab) => navigate(tab === 'overview' ? '/pharmacy' : `/pharmacy/${tab}`)
  const [pharmacy, setPharmacy] = useState(null)
  const [medicines, setMedicines] = useState([])
  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  
  // Medicine form states
  const [medicineForm, setMedicineForm] = useState({
    medicineName: '',
    genericName: '',
    brand: '',
    category: 'General',
    dosage: '',
    form: 'Tablet',
    price: '',
    mrp: '',
    discount: 0,
    quantity: '',
    minQuantity: 5,
    expiryDate: '',
    manufacturer: '',
    prescriptionRequired: false,
    description: ''
  })
  
  const [editingMedicine, setEditingMedicine] = useState(null)
  const [showMedicineForm, setShowMedicineForm] = useState(false)
  
  // Pharmacy profile form
  const [pharmacyForm, setPharmacyForm] = useState({
    name: '',
    location: '',
    address: '',
    contact: '',
    email: '',
    description: '',
    openingHours: { open: '09:00', close: '21:00' },
    deliveryAvailable: true,
    deliveryRadius: 5
  })

  useEffect(() => {
    console.log('PharmacyDashboard mounted, user:', user)
    const socket = io(SOCKET_URL)
    
    // Join pharmacy room for real-time updates
    socket.emit('join-pharmacy-room', user.id)
    
    // Listen for new orders
    socket.on('new-order', (order) => {
      setOrders(prev => [order, ...prev])
      // Show notification
      toast.info(`New order received: ${order.orderId}`)
    })
    
    console.log('About to fetch pharmacy data...')
    fetchPharmacyData()
    
    return () => {
      socket.disconnect()
    }
  }, [])

  const fetchPharmacyData = async () => {
    try {
      setLoading(true)
      
      // Fetch pharmacy profile
      let pharmacyData = null
      try {
        console.log('Fetching pharmacy profile...')
        const { data } = await api.get('/pharmacy/my/profile')
        console.log('Pharmacy profile data:', data)
        pharmacyData = data
        setPharmacy(data)
        setPharmacyForm(data)
      } catch (error) {
        console.error('Error fetching pharmacy profile:', error.response?.data || error.message)
        if (error.response?.status === 404) {
          // Pharmacy not created yet
          console.log('No pharmacy found - user needs to create one')
          setPharmacy(null)
          setLoading(false)
          return
        } else {
          console.error('Error fetching pharmacy profile:', error)
          setLoading(false)
          return
        }
      }
      
      // Fetch medicines and orders only if pharmacy exists
      if (pharmacyData?._id) {
        console.log('Pharmacy found, fetching medicines and orders...')
        try {
          console.log('Making API calls to fetch medicines and orders')
          const [medicinesResponse, ordersResponse] = await Promise.all([
            api.get('/pharmacy/my/medicines'),
            api.get('/pharmacy/my/orders')
          ])
          
          console.log('Medicines API response:', medicinesResponse.data)
          console.log('Orders API response:', ordersResponse.data)
          
          const medicinesData = medicinesResponse.data
          const ordersData = ordersResponse.data
          
          console.log('Setting medicines:', medicinesData.medicines?.length || 0, 'items')
          setMedicines(medicinesData.medicines || [])
          setOrders(ordersData.orders || [])
          
          // Calculate stats
          const totalMedicines = medicinesData.medicines?.length || 0
          const totalOrders = ordersData.orders?.length || 0
          const pendingOrders = ordersData.orders?.filter(o => o.status === 'pending').length || 0
          const lowStockItems = medicinesData.medicines?.filter(m => m.quantity <= m.minQuantity).length || 0
          
          setStats({ totalMedicines, totalOrders, pendingOrders, lowStockItems })
        } catch (error) {
          console.error('Error fetching medicines/orders:', error)
          console.error('Error details:', error.response?.data || error.message)
          // Set empty arrays as fallback
          setMedicines([])
          setOrders([])
          setStats({ totalMedicines: 0, totalOrders: 0, pendingOrders: 0, lowStockItems: 0 })
        }
      } else {
        console.log('No pharmacy ID found, cannot fetch medicines')
        setMedicines([])
        setOrders([])
        setStats({ totalMedicines: 0, totalOrders: 0, pendingOrders: 0, lowStockItems: 0 })
      }
    } catch (error) {
      console.error('Error in fetchPharmacyData:', error)
    } finally {
      setLoading(false)
    }
  }

  const createPharmacy = async () => {
    try {
      // Validate required fields
      if (!pharmacyForm.name || !pharmacyForm.location || !pharmacyForm.address || !pharmacyForm.contact) {
        toast.warning('Please fill in all required fields (marked with *)')
        return
      }
      
      console.log('Creating pharmacy with data:', pharmacyForm)
      const { data } = await api.post('/pharmacy/create', pharmacyForm)
      console.log('Pharmacy created:', data)
      setPharmacy(data)
      toast.success('Pharmacy created successfully!')
      fetchPharmacyData()
    } catch (error) {
      console.error('Error creating pharmacy:', error)
      console.error('Error response:', error.response)
      
      // Detail is in the console above; the user gets a cause they can act on.
      toast.error(friendlyError(error, "Your pharmacy profile couldn't be created. Please try again."))
    }
  }

  const updatePharmacy = async () => {
    try {
      const { data } = await api.put('/pharmacy/my/profile', pharmacyForm)
      setPharmacy(data)
      toast.success('Pharmacy updated successfully!')
    } catch (error) {
      toast.error(friendlyError(error))
    }
  }

  const addMedicine = async () => {
    try {
      const medicineData = {
        ...medicineForm,
        price: parseFloat(medicineForm.price),
        mrp: parseFloat(medicineForm.mrp),
        quantity: parseInt(medicineForm.quantity),
        minQuantity: parseInt(medicineForm.minQuantity),
        discount: parseFloat(medicineForm.discount) || 0
      }
      
      if (editingMedicine) {
        await api.put(`/pharmacy/medicines/${editingMedicine._id}`, medicineData)
        toast.success('Medicine updated successfully!')
      } else {
        await api.post('/pharmacy/medicines', medicineData)
        toast.success('Medicine added successfully!')
      }
      
      setShowMedicineForm(false)
      setEditingMedicine(null)
      resetMedicineForm()
      fetchPharmacyData()
    } catch (error) {
      toast.error(friendlyError(error))
    }
  }

  const deleteMedicine = async (medicineId) => {
    if (confirm('Are you sure you want to delete this medicine?')) {
      try {
        await api.delete(`/pharmacy/medicines/${medicineId}`)
        toast.success('Medicine deleted successfully!')
        fetchPharmacyData()
      } catch (error) {
        toast.error(friendlyError(error))
      }
    }
  }

  const editMedicine = (medicine) => {
    setEditingMedicine(medicine)
    setMedicineForm({
      ...medicine,
      expiryDate: medicine.expiryDate ? new Date(medicine.expiryDate).toISOString().split('T')[0] : ''
    })
    setShowMedicineForm(true)
  }

  const resetMedicineForm = () => {
    setMedicineForm({
      medicineName: '',
      genericName: '',
      brand: '',
      category: 'General',
      dosage: '',
      form: 'Tablet',
      price: '',
      mrp: '',
      discount: 0,
      quantity: '',
      minQuantity: 5,
      expiryDate: '',
      manufacturer: '',
      prescriptionRequired: false,
      description: ''
    })
  }

  const updateOrderStatus = async (orderId, status) => {
    try {
      await api.put(`/pharmacy/orders/${orderId}/status`, { status })
      toast.success('Order status updated successfully!')
      fetchPharmacyData()
    } catch (error) {
      toast.error(friendlyError(error))
    }
  }

  const getStockStatusBadge = (medicine) => {
    if (medicine.quantity === 0) {
      return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">Out of Stock</span>
    } else if (medicine.quantity <= medicine.minQuantity) {
      return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">Low Stock</span>
    }
    return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">In Stock</span>
  }

  const getOrderStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-purple-100 text-purple-800',
      ready: 'bg-green-100 text-green-800',
      dispatched: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return <span className={`px-2 py-1 text-xs rounded-full ${colors[status] || colors.pending}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  }

  if (loading) {
    return (
      <PageLayout title="Pharmacy Dashboard">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </PageLayout>
    )
  }

  if (!pharmacy) {
    return (
      <PageLayout title="Setup Your Pharmacy">
        <div className="max-w-2xl mx-auto">
          <div className="card">
            <div className="card-body">
              <h2 className="section-title mb-4">Create Your Pharmacy Profile</h2>
              <div className="space-y-4">
                <input
                  className="input"
                  placeholder="Pharmacy Name *"
                  value={pharmacyForm.name}
                  onChange={e => setPharmacyForm({...pharmacyForm, name: e.target.value})}
                />
                <input
                  className="input"
                  placeholder="Location *"
                  value={pharmacyForm.location}
                  onChange={e => setPharmacyForm({...pharmacyForm, location: e.target.value})}
                />
                <textarea
                  className="input"
                  placeholder="Full Address *"
                  value={pharmacyForm.address}
                  onChange={e => setPharmacyForm({...pharmacyForm, address: e.target.value})}
                  rows={2}
                />
                <input
                  className="input"
                  placeholder="Contact Number *"
                  value={pharmacyForm.contact}
                  onChange={e => setPharmacyForm({...pharmacyForm, contact: e.target.value})}
                />
                <input
                  className="input"
                  placeholder="Email"
                  type="email"
                  value={pharmacyForm.email}
                  onChange={e => setPharmacyForm({...pharmacyForm, email: e.target.value})}
                />
                <textarea
                  className="input"
                  placeholder="Description"
                  value={pharmacyForm.description}
                  onChange={e => setPharmacyForm({...pharmacyForm, description: e.target.value})}
                  rows={3}
                />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Opening Time</label>
                    <input
                      className="input"
                      type="time"
                      value={pharmacyForm.openingHours.open}
                      onChange={e => setPharmacyForm({...pharmacyForm, openingHours: {...pharmacyForm.openingHours, open: e.target.value}})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Closing Time</label>
                    <input
                      className="input"
                      type="time"
                      value={pharmacyForm.openingHours.close}
                      onChange={e => setPharmacyForm({...pharmacyForm, openingHours: {...pharmacyForm.openingHours, close: e.target.value}})}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="delivery"
                    checked={pharmacyForm.deliveryAvailable}
                    onChange={e => setPharmacyForm({...pharmacyForm, deliveryAvailable: e.target.checked})}
                  />
                  <label htmlFor="delivery">Delivery Available</label>
                </div>
                {pharmacyForm.deliveryAvailable && (
                  <input
                    className="input"
                    placeholder="Delivery Radius (km)"
                    type="number"
                    value={pharmacyForm.deliveryRadius}
                    onChange={e => setPharmacyForm({...pharmacyForm, deliveryRadius: parseInt(e.target.value)})}
                  />
                )}
                <button onClick={createPharmacy} className="btn-primary w-full">
                  Create Pharmacy
                </button>
              </div>
            </div>
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout title={`${pharmacy.name} - Dashboard`}>
      {/* Tabs */}
      <Tabs
        className="mb-6"
        active={activeTab}
        onChange={setActiveTab}
        items={[
          { key: 'overview', label: 'Overview' },
          { key: 'medicines', label: 'Medicines' },
          { key: 'orders', label: 'Orders' },
          { key: 'profile', label: 'Profile' }
        ]}
      />

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="card">
              <div className="card-body text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalMedicines}</div>
                <div className="text-sm text-gray-600">Total Medicines</div>
              </div>
            </div>
            <div className="card">
              <div className="card-body text-center">
                <div className="text-2xl font-bold text-green-600">{stats.totalOrders}</div>
                <div className="text-sm text-gray-600">Total Orders</div>
              </div>
            </div>
            <div className="card">
              <div className="card-body text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.pendingOrders}</div>
                <div className="text-sm text-gray-600">Pending Orders</div>
              </div>
            </div>
            <div className="card">
              <div className="card-body text-center">
                <div className="text-2xl font-bold text-red-600">{stats.lowStockItems}</div>
                <div className="text-sm text-gray-600">Low Stock Items</div>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="card">
            <div className="card-body">
              <h3 className="section-title mb-4">Recent Orders</h3>
              <div className="space-y-4">
                {orders.slice(0, 5).map(order => (
                  <div key={order._id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium">{order.orderId}</div>
                      <div className="text-sm text-gray-600">{order.userId?.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">₹{order.totalAmount}</div>
                      {getOrderStatusBadge(order.status)}
                    </div>
                  </div>
                ))}
                {orders.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    No orders yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Medicines Tab */}
      {activeTab === 'medicines' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="section-title">Medicine Inventory</h3>
            <button 
              onClick={() => {
                resetMedicineForm()
                setShowMedicineForm(true)
                setEditingMedicine(null)
              }}
              className="btn-primary"
            >
              Add Medicine
            </button>
          </div>

          {/* Medicine Form Modal */}
          {showMedicineForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <h3 className="section-title mb-4">
                    {editingMedicine ? 'Edit Medicine' : 'Add New Medicine'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      className="input"
                      placeholder="Medicine Name *"
                      value={medicineForm.medicineName}
                      onChange={e => setMedicineForm({...medicineForm, medicineName: e.target.value})}
                    />
                    <input
                      className="input"
                      placeholder="Generic Name"
                      value={medicineForm.genericName}
                      onChange={e => setMedicineForm({...medicineForm, genericName: e.target.value})}
                    />
                    <input
                      className="input"
                      placeholder="Brand"
                      value={medicineForm.brand}
                      onChange={e => setMedicineForm({...medicineForm, brand: e.target.value})}
                    />
                    <select
                      className="input"
                      value={medicineForm.category}
                      onChange={e => setMedicineForm({...medicineForm, category: e.target.value})}
                    >
                      <option>General</option>
                      <option>Prescription</option>
                      <option>Ayurvedic</option>
                      <option>Homeopathic</option>
                      <option>Vitamins</option>
                    </select>
                    <input
                      className="input"
                      placeholder="Dosage"
                      value={medicineForm.dosage}
                      onChange={e => setMedicineForm({...medicineForm, dosage: e.target.value})}
                    />
                    <select
                      className="input"
                      value={medicineForm.form}
                      onChange={e => setMedicineForm({...medicineForm, form: e.target.value})}
                    >
                      <option>Tablet</option>
                      <option>Capsule</option>
                      <option>Syrup</option>
                      <option>Injection</option>
                      <option>Cream</option>
                      <option>Drops</option>
                      <option>Powder</option>
                      <option>Other</option>
                    </select>
                    <input
                      className="input"
                      placeholder="Price *"
                      type="number"
                      step="0.01"
                      value={medicineForm.price}
                      onChange={e => setMedicineForm({...medicineForm, price: e.target.value})}
                    />
                    <input
                      className="input"
                      placeholder="MRP *"
                      type="number"
                      step="0.01"
                      value={medicineForm.mrp}
                      onChange={e => setMedicineForm({...medicineForm, mrp: e.target.value})}
                    />
                    <input
                      className="input"
                      placeholder="Discount %"
                      type="number"
                      value={medicineForm.discount}
                      onChange={e => setMedicineForm({...medicineForm, discount: e.target.value})}
                    />
                    <input
                      className="input"
                      placeholder="Quantity *"
                      type="number"
                      value={medicineForm.quantity}
                      onChange={e => setMedicineForm({...medicineForm, quantity: e.target.value})}
                    />
                    <input
                      className="input"
                      placeholder="Minimum Quantity Alert"
                      type="number"
                      value={medicineForm.minQuantity}
                      onChange={e => setMedicineForm({...medicineForm, minQuantity: e.target.value})}
                    />
                    <input
                      className="input"
                      placeholder="Expiry Date"
                      type="date"
                      value={medicineForm.expiryDate}
                      onChange={e => setMedicineForm({...medicineForm, expiryDate: e.target.value})}
                    />
                    <input
                      className="input"
                      placeholder="Manufacturer"
                      value={medicineForm.manufacturer}
                      onChange={e => setMedicineForm({...medicineForm, manufacturer: e.target.value})}
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="prescription"
                        checked={medicineForm.prescriptionRequired}
                        onChange={e => setMedicineForm({...medicineForm, prescriptionRequired: e.target.checked})}
                      />
                      <label htmlFor="prescription">Prescription Required</label>
                    </div>
                  </div>
                  <textarea
                    className="input w-full mt-4"
                    placeholder="Description"
                    value={medicineForm.description}
                    onChange={e => setMedicineForm({...medicineForm, description: e.target.value})}
                    rows={3}
                  />
                  <div className="flex gap-2 mt-4">
                    <button onClick={addMedicine} className="btn-primary">
                      {editingMedicine ? 'Update' : 'Add'} Medicine
                    </button>
                    <button 
                      onClick={() => {
                        setShowMedicineForm(false)
                        setEditingMedicine(null)
                      }}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Medicines List */}
          <div className="space-y-4">
            {medicines.map(medicine => (
              <div key={medicine._id} className="card">
                <div className="card-body">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{medicine.medicineName}</h4>
                        {getStockStatusBadge(medicine)}
                        {medicine.prescriptionRequired && (
                          <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                            Rx Required
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>Brand: {medicine.brand || 'N/A'}</div>
                        <div>Form: {medicine.form}</div>
                        <div>Price: ₹{medicine.price}</div>
                        <div>Stock: {medicine.quantity}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => editMedicine(medicine)}
                        className="btn-secondary text-xs"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => deleteMedicine(medicine._id)}
                        className="btn-secondary text-xs text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {medicines.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No medicines added yet. Add your first medicine to get started!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div>
          <h3 className="section-title mb-6">Order Management</h3>
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order._id} className="card">
                <div className="card-body">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="font-semibold">{order.orderId}</div>
                      <div className="text-sm text-gray-600">
                        Customer: {order.userId?.name} | 
                        Type: {order.orderType} | 
                        Total: ₹{order.totalAmount}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getOrderStatusBadge(order.status)}
                      <select 
                        className="input text-xs"
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="preparing">Preparing</option>
                        <option value="ready">Ready</option>
                        {order.orderType === 'delivery' && <option value="dispatched">Dispatched</option>}
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Order Items */}
                  <div className="border-t pt-4">
                    <div className="text-sm font-medium mb-2">Items:</div>
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>{item.medicineName} × {item.quantity}</span>
                          <span>₹{item.total}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {order.orderType === 'delivery' && order.deliveryAddress && (
                    <div className="border-t pt-4 mt-4">
                      <div className="text-sm font-medium mb-2">Delivery Address:</div>
                      <div className="text-sm text-gray-600">
                        {order.deliveryAddress.name}, {order.deliveryAddress.phone}<br/>
                        {order.deliveryAddress.addressLine1}<br/>
                        {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No orders received yet
              </div>
            )}
          </div>
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="max-w-2xl">
          <h3 className="section-title mb-6">Pharmacy Profile</h3>
          <div className="card">
            <div className="card-body space-y-4">
              <input
                className="input"
                placeholder="Pharmacy Name *"
                value={pharmacyForm.name}
                onChange={e => setPharmacyForm({...pharmacyForm, name: e.target.value})}
              />
              <input
                className="input"
                placeholder="Location *"
                value={pharmacyForm.location}
                onChange={e => setPharmacyForm({...pharmacyForm, location: e.target.value})}
              />
              <textarea
                className="input"
                placeholder="Full Address *"
                value={pharmacyForm.address}
                onChange={e => setPharmacyForm({...pharmacyForm, address: e.target.value})}
                rows={2}
              />
              <input
                className="input"
                placeholder="Contact Number *"
                value={pharmacyForm.contact}
                onChange={e => setPharmacyForm({...pharmacyForm, contact: e.target.value})}
              />
              <input
                className="input"
                placeholder="Email"
                type="email"
                value={pharmacyForm.email}
                onChange={e => setPharmacyForm({...pharmacyForm, email: e.target.value})}
              />
              <textarea
                className="input"
                placeholder="Description"
                value={pharmacyForm.description}
                onChange={e => setPharmacyForm({...pharmacyForm, description: e.target.value})}
                rows={3}
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Opening Time</label>
                  <input
                    className="input"
                    type="time"
                    value={pharmacyForm.openingHours?.open || '09:00'}
                    onChange={e => setPharmacyForm({...pharmacyForm, openingHours: {...pharmacyForm.openingHours, open: e.target.value}})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Closing Time</label>
                  <input
                    className="input"
                    type="time"
                    value={pharmacyForm.openingHours?.close || '21:00'}
                    onChange={e => setPharmacyForm({...pharmacyForm, openingHours: {...pharmacyForm.openingHours, close: e.target.value}})}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="deliveryUpdate"
                  checked={pharmacyForm.deliveryAvailable}
                  onChange={e => setPharmacyForm({...pharmacyForm, deliveryAvailable: e.target.checked})}
                />
                <label htmlFor="deliveryUpdate">Delivery Available</label>
              </div>
              {pharmacyForm.deliveryAvailable && (
                <input
                  className="input"
                  placeholder="Delivery Radius (km)"
                  type="number"
                  value={pharmacyForm.deliveryRadius}
                  onChange={e => setPharmacyForm({...pharmacyForm, deliveryRadius: parseInt(e.target.value)})}
                />
              )}
              <button onClick={updatePharmacy} className="btn-primary">
                Update Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}


