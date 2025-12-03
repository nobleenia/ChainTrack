/**
 * Create Shipment Page
 * Form for creating new P2P deliveries
 */

import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Package,
  MapPin,
  User,
  Phone,
  Mail,
  FileText,
  Camera,
  Upload,
  X,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
  Copy
} from 'lucide-react'
import useShipmentStore from '../../store/shipmentStore'
import { useAuthStore } from '../../store/authStore'

export default function CreateShipmentPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { createShipment, loading, error, clearError } = useShipmentStore()
  const fileInputRef = useRef(null)

  const [formData, setFormData] = useState({
    description: '',
    // Receiver info
    receiver_name: '',
    receiver_email: '',
    receiver_phone: '',
    // Pickup address
    pickup_address: '',
    pickup_city: '',
    pickup_state: '',
    pickup_country: 'Nigeria',
    // Delivery address
    delivery_address: '',
    delivery_city: '',
    delivery_state: '',
    delivery_country: 'Nigeria',
    // Package details
    package_weight: '',
    package_dimensions: '',
    package_value: '',
    fragile: false,
    special_instructions: '',
    // Photos (multiple)
    pickup_photos: []
  })

  const [photoPreviews, setPhotoPreviews] = useState([])
  const [success, setSuccess] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files || [])
    
    // Check if adding would exceed limit
    if (formData.pickup_photos.length + files.length > 5) {
      setValidationErrors((prev) => ({
        ...prev,
        pickup_photos: 'Maximum 5 photos allowed'
      }))
      return
    }

    const validFiles = []
    const newPreviews = []

    for (const file of files) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setValidationErrors((prev) => ({
          ...prev,
          pickup_photos: 'Please select only image files'
        }))
        continue
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setValidationErrors((prev) => ({
          ...prev,
          pickup_photos: 'Each image must be less than 5MB'
        }))
        continue
      }
      validFiles.push(file)
    }

    if (validFiles.length > 0) {
      setValidationErrors((prev) => ({ ...prev, pickup_photos: null }))

      // Create previews for all valid files
      validFiles.forEach((file) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          setPhotoPreviews((prev) => [...prev, reader.result])
        }
        reader.readAsDataURL(file)
      })

      setFormData((prev) => ({
        ...prev,
        pickup_photos: [...prev.pickup_photos, ...validFiles]
      }))
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removePhoto = (index) => {
    setFormData((prev) => ({
      ...prev,
      pickup_photos: prev.pickup_photos.filter((_, i) => i !== index)
    }))
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const validateForm = () => {
    const errors = {}

    if (!formData.description.trim()) {
      errors.description = 'Description is required'
    }
    if (!formData.receiver_name.trim()) {
      errors.receiver_name = 'Receiver name is required'
    }
    if (!formData.receiver_phone.trim()) {
      errors.receiver_phone = 'Receiver phone is required'
    }
    if (!formData.pickup_address.trim()) {
      errors.pickup_address = 'Pickup address is required'
    }
    if (!formData.pickup_city.trim()) {
      errors.pickup_city = 'Pickup city is required'
    }
    if (!formData.delivery_address.trim()) {
      errors.delivery_address = 'Delivery address is required'
    }
    if (!formData.delivery_city.trim()) {
      errors.delivery_city = 'Delivery city is required'
    }
    if (formData.pickup_photos.length === 0) {
      errors.pickup_photos = 'At least one pickup photo is required for verification'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()

    if (!validateForm()) {
      return
    }

    try {
      // Use first photo as primary (base64), store all previews
      const photoData = photoPreviews.length > 0 ? photoPreviews[0] : null

      // Map frontend field names to backend expected names
      const shipmentData = {
        description: formData.description,
        receiver_name: formData.receiver_name,
        receiver_email: formData.receiver_email || undefined,
        receiver_phone: formData.receiver_phone,
        pickup_address: formData.pickup_address,
        pickup_city: formData.pickup_city,
        delivery_address: formData.delivery_address,
        delivery_city: formData.delivery_city,
        // Map package fields to backend expected names
        weight: formData.package_weight ? String(formData.package_weight) : undefined,
        dimensions: formData.package_dimensions || undefined,
        declared_value: formData.package_value ? parseFloat(formData.package_value) : undefined,
        special_instructions: formData.special_instructions || undefined,
        sender_photo_url: photoData
      }

      const result = await createShipment(shipmentData)
      setSuccess({
        shipment_id: result.shipment?.shipment_id || result.shipment_id,
        tracking_pin: result.shipment?.tracking_pin || result.tracking_pin
      })
    } catch (err) {
      // Error handled by store
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  // Success state
  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center"
        >
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-emerald-600" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">Shipment Created!</h2>
          <p className="text-gray-500 mb-8">
            Your shipment has been created successfully. Share the tracking details with the receiver.
          </p>

          <div className="bg-gray-50 rounded-xl p-6 mb-6 text-left">
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500">Shipment ID</label>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-mono font-bold text-gray-900">
                    {success.shipment_id}
                  </span>
                  <button
                    onClick={() => copyToClipboard(success.shipment_id)}
                    className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                    title="Copy"
                  >
                    <Copy className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-500">Tracking PIN</label>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-mono font-bold text-emerald-600 tracking-wider">
                    {success.tracking_pin}
                  </span>
                  <button
                    onClick={() => copyToClipboard(success.tracking_pin)}
                    className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                    title="Copy"
                  >
                    <Copy className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
                <p className="text-xs text-amber-600 mt-1">
                  ⚠️ Share this PIN securely with the receiver. They'll need it to track the package.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => navigate('/dashboard/shipments')}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              View All Shipments
            </button>
            <button
              onClick={() => navigate(`/dashboard/shipments/${success.shipment_id}`)}
              className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              View Shipment
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/dashboard/shipments')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Shipments
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Create New Shipment</h1>
        <p className="text-gray-500">Send a package with secure P2P tracking</p>
      </div>

      {/* Error Alert */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3"
        >
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Package Description */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-emerald-600" />
            Package Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="e.g., Electronics, Documents, Food items"
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                  validationErrors.description ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {validationErrors.description && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.description}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weight (kg)
              </label>
              <input
                type="number"
                name="package_weight"
                value={formData.package_weight}
                onChange={handleChange}
                placeholder="0.5"
                step="0.1"
                min="0"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dimensions (LxWxH cm)
              </label>
              <input
                type="text"
                name="package_dimensions"
                value={formData.package_dimensions}
                onChange={handleChange}
                placeholder="30x20x15"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Declared Value (₦)
              </label>
              <input
                type="number"
                name="package_value"
                value={formData.package_value}
                onChange={handleChange}
                placeholder="10000"
                min="0"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="fragile"
                  checked={formData.fragile}
                  onChange={handleChange}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Fragile - Handle with care</span>
              </label>
            </div>
          </div>
        </div>

        {/* Receiver Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-emerald-600" />
            Receiver Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                name="receiver_name"
                value={formData.receiver_name}
                onChange={handleChange}
                placeholder="John Doe"
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                  validationErrors.receiver_name ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {validationErrors.receiver_name && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.receiver_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                name="receiver_phone"
                value={formData.receiver_phone}
                onChange={handleChange}
                placeholder="+234 xxx xxx xxxx"
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                  validationErrors.receiver_phone ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {validationErrors.receiver_phone && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.receiver_phone}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email (optional)
              </label>
              <input
                type="email"
                name="receiver_email"
                value={formData.receiver_email}
                onChange={handleChange}
                placeholder="john@example.com"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Pickup Address */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            Pickup Address
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Address *
              </label>
              <input
                type="text"
                name="pickup_address"
                value={formData.pickup_address}
                onChange={handleChange}
                placeholder="123 Main Street, Lekki"
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                  validationErrors.pickup_address ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {validationErrors.pickup_address && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.pickup_address}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City *
              </label>
              <input
                type="text"
                name="pickup_city"
                value={formData.pickup_city}
                onChange={handleChange}
                placeholder="Lagos"
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                  validationErrors.pickup_city ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {validationErrors.pickup_city && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.pickup_city}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <input
                type="text"
                name="pickup_state"
                value={formData.pickup_state}
                onChange={handleChange}
                placeholder="Lagos State"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-emerald-600" />
            Delivery Address
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Address *
              </label>
              <input
                type="text"
                name="delivery_address"
                value={formData.delivery_address}
                onChange={handleChange}
                placeholder="456 Victoria Island"
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                  validationErrors.delivery_address ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {validationErrors.delivery_address && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.delivery_address}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City *
              </label>
              <input
                type="text"
                name="delivery_city"
                value={formData.delivery_city}
                onChange={handleChange}
                placeholder="Abuja"
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                  validationErrors.delivery_city ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {validationErrors.delivery_city && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.delivery_city}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <input
                type="text"
                name="delivery_state"
                value={formData.delivery_state}
                onChange={handleChange}
                placeholder="FCT"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Photo Upload - Multiple */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Camera className="h-5 w-5 text-emerald-600" />
            Package Photos * <span className="text-sm font-normal text-gray-500">({photoPreviews.length}/5)</span>
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Take clear photos of the package before shipping. These serve as proof of condition at pickup. You can upload up to 5 photos.
          </p>

          {/* Photo Previews Grid */}
          {photoPreviews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-4">
              {photoPreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Package photo ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {index === 0 && (
                    <span className="absolute bottom-1 left-1 bg-emerald-600 text-white text-xs px-1.5 py-0.5 rounded">
                      Primary
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Upload Button */}
          {photoPreviews.length < 5 && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                validationErrors.pickup_photos
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300 hover:border-emerald-400 hover:bg-emerald-50'
              }`}
            >
              <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600 font-medium">
                {photoPreviews.length === 0 ? 'Click to upload photos' : 'Add more photos'}
              </p>
              <p className="text-sm text-gray-400 mt-1">JPG, PNG up to 5MB each</p>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePhotoChange}
            accept="image/*"
            multiple
            className="hidden"
          />

          {validationErrors.pickup_photos && (
            <p className="text-red-500 text-sm mt-2">{validationErrors.pickup_photos}</p>
          )}
        </div>

        {/* Special Instructions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-600" />
            Special Instructions (Optional)
          </h2>

          <textarea
            name="special_instructions"
            value={formData.special_instructions}
            onChange={handleChange}
            placeholder="Any special handling instructions for the courier..."
            rows={3}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
          />
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard/shipments')}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-emerald-600 text-white px-4 py-3 rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Package className="h-5 w-5" />
                Create Shipment
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
