import { useState, useEffect } from 'react'
import {
  BookmarkIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'

const LOCAL_STORAGE_KEY = 'chaintrack_address_book'

function AddressBook({ onSelect, selectedId = null, mode = 'select' }) {
  const [addresses, setAddresses] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingAddress, setEditingAddress] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    label: ''
  })

  useEffect(() => {
    loadAddresses()
  }, [])

  const loadAddresses = () => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (saved) {
        setAddresses(JSON.parse(saved))
      }
    } catch (e) {
      console.error('Failed to load addresses:', e)
    }
  }

  const saveAddresses = (newAddresses) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newAddresses))
      setAddresses(newAddresses)
    } catch (e) {
      console.error('Failed to save addresses:', e)
    }
  }

  const handleAddAddress = () => {
    if (!formData.name || !formData.address) return

    const newAddress = {
      id: Date.now().toString(),
      ...formData,
      createdAt: new Date().toISOString()
    }

    saveAddresses([...addresses, newAddress])
    resetForm()
    setShowAddModal(false)
  }

  const handleEditAddress = () => {
    if (!formData.name || !formData.address || !editingAddress) return

    const updatedAddresses = addresses.map(addr =>
      addr.id === editingAddress.id
        ? { ...addr, ...formData, updatedAt: new Date().toISOString() }
        : addr
    )

    saveAddresses(updatedAddresses)
    resetForm()
    setEditingAddress(null)
  }

  const handleDeleteAddress = (id) => {
    if (!confirm('Are you sure you want to delete this address?')) return
    const updatedAddresses = addresses.filter(addr => addr.id !== id)
    saveAddresses(updatedAddresses)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      city: '',
      phone: '',
      email: '',
      label: ''
    })
  }

  const openEditModal = (address) => {
    setEditingAddress(address)
    setFormData({
      name: address.name,
      address: address.address,
      city: address.city || '',
      phone: address.phone || '',
      email: address.email || '',
      label: address.label || ''
    })
  }

  const filteredAddresses = addresses.filter(addr =>
    addr.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    addr.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    addr.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    addr.label?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const labelColors = {
    'home': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'work': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'warehouse': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'store': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    'default': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookmarkIcon className="w-5 h-5 text-primary-600" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Address Book</h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            ({addresses.length} saved)
          </span>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowAddModal(true)
          }}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Add New
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search addresses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Address List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {filteredAddresses.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {searchQuery ? 'No addresses match your search' : 'No saved addresses yet'}
          </div>
        ) : (
          filteredAddresses.map((addr) => (
            <motion.div
              key={addr.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 border rounded-lg cursor-pointer transition-all ${
                selectedId === addr.id
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600'
              }`}
              onClick={() => mode === 'select' && onSelect?.(addr)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">{addr.name}</span>
                    {addr.label && (
                      <span className={`px-2 py-0.5 text-xs rounded-full ${labelColors[addr.label.toLowerCase()] || labelColors.default}`}>
                        {addr.label}
                      </span>
                    )}
                    {selectedId === addr.id && (
                      <CheckIcon className="w-4 h-4 text-primary-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-start gap-1">
                    <MapPinIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {addr.address}{addr.city ? `, ${addr.city}` : ''}
                  </p>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {addr.phone && (
                      <span className="flex items-center gap-1">
                        <PhoneIcon className="w-3 h-3" />
                        {addr.phone}
                      </span>
                    )}
                    {addr.email && (
                      <span className="flex items-center gap-1">
                        <EnvelopeIcon className="w-3 h-3" />
                        {addr.email}
                      </span>
                    )}
                  </div>
                </div>
                {mode !== 'select' && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        openEditModal(addr)
                      }}
                      className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteAddress(addr.id)
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {(showAddModal || editingAddress) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => {
              setShowAddModal(false)
              setEditingAddress(null)
              resetForm()
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingAddress ? 'Edit Address' : 'Add New Address'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingAddress(null)
                    resetForm()
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name / Contact Person *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Address *
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Main Street, Apartment 4B"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Lagos"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+234..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@example.com"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Label
                  </label>
                  <select
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">No label</option>
                    <option value="Home">Home</option>
                    <option value="Work">Work</option>
                    <option value="Warehouse">Warehouse</option>
                    <option value="Store">Store</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingAddress(null)
                    resetForm()
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={editingAddress ? handleEditAddress : handleAddAddress}
                  disabled={!formData.name || !formData.address}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {editingAddress ? 'Save Changes' : 'Add Address'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AddressBook
