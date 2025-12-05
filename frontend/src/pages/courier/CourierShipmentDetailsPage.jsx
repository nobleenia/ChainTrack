/**
 * Courier Shipment Details Page
 * View shipment details and record checkpoints
 */

import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package,
  MapPin,
  Clock,
  CheckCircle,
  Truck,
  ArrowLeft,
  Camera,
  Navigation,
  Upload,
  X,
  Loader2,
  AlertCircle,
  ExternalLink,
  Shield,
  Hash,
  ChevronDown
} from 'lucide-react'
import useCourierStore from '../../store/courierStore'

const actionOptions = [
  { value: 'picked_up', label: 'Picked Up', icon: Package, color: 'blue', description: 'Mark package as picked up from sender' },
  { value: 'checkpoint', label: 'Checkpoint', icon: MapPin, color: 'purple', description: 'Record current location/status' },
  { value: 'in_transit', label: 'In Transit', icon: Truck, color: 'yellow', description: 'Package is being transported' },
  { value: 'out_for_delivery', label: 'Out for Delivery', icon: Navigation, color: 'orange', description: 'Package is out for final delivery' },
  { value: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'green', description: 'Package delivered to recipient' }
]

export default function CourierShipmentDetailsPage() {
  const { shipmentId } = useParams()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  
  const { 
    isAuthenticated, 
    currentShipment, 
    fetchShipmentDetails, 
    recordCheckpoint,
    clearCurrentShipment,
    isLoading 
  } = useCourierStore()
  
  const [showCheckpointForm, setShowCheckpointForm] = useState(false)
  const [formData, setFormData] = useState({
    action: 'checkpoint',
    location: '',
    notes: '',
    photo: null
  })
  const [photoPreview, setPhotoPreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [location, setLocation] = useState(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/courier')
    }
  }, [isAuthenticated, navigate])

  // Fetch shipment details
  useEffect(() => {
    if (isAuthenticated && shipmentId) {
      fetchShipmentDetails(shipmentId)
    }
    
    return () => clearCurrentShipment()
  }, [isAuthenticated, shipmentId, fetchShipmentDetails, clearCurrentShipment])

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }

    setGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        setLocation({ lat: latitude, lng: longitude })
        setFormData(prev => ({
          ...prev,
          location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
        }))
        setGettingLocation(false)
      },
      (err) => {
        setError('Failed to get location: ' + err.message)
        setGettingLocation(false)
      },
      { enableHighAccuracy: true }
    )
  }

  // Handle photo
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Photo must be less than 5MB')
        return
      }
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photo: reader.result }))
        setPhotoPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  // Submit checkpoint
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!formData.location.trim()) {
      setError('Location is required')
      return
    }

    setSubmitting(true)
    try {
      const result = await recordCheckpoint(shipmentId, {
        action: formData.action,
        location: formData.location,
        notes: formData.notes || undefined,
        photo_url: formData.photo || undefined,
        gps_latitude: location?.lat,
        gps_longitude: location?.lng
      })
      
      setSuccess({
        message: 'Checkpoint recorded successfully!',
        blockchain: result.blockchain
      })
      
      // Reset form
      setFormData({
        action: 'checkpoint',
        location: '',
        notes: '',
        photo: null
      })
      setPhotoPreview(null)
      setLocation(null)
      setShowCheckpointForm(false)
      
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record checkpoint')
    } finally {
      setSubmitting(false)
    }
  }

  const shipment = currentShipment?.shipment
  const checkpoints = currentShipment?.checkpoints || []
  const authorization = currentShipment?.authorization

  if (isLoading || !shipment) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link
              to="/courier/shipments"
              className="p-2 -ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="font-mono font-bold text-gray-900 dark:text-white">{shipment.shipment_id}</h1>
              <StatusBadge status={shipment.status} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Success Message */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl p-4"
            >
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">{success.message}</span>
              </div>
              {success.blockchain && (
                <a
                  href={success.blockchain.explorer_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 mt-2 text-sm text-green-600 dark:text-green-400 hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  View on Blockchain
                </a>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Shipment Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Shipment Details</h2>
          
          <div className="space-y-4">
            {/* Route */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Route</p>
                <p className="font-medium text-gray-900 dark:text-white">{shipment.origin}</p>
                <p className="text-gray-400">↓</p>
                <p className="font-medium text-gray-900 dark:text-white">{shipment.destination}</p>
              </div>
            </div>

            {/* Description */}
            {shipment.description && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Package className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Description</p>
                  <p className="text-gray-900 dark:text-white">{shipment.description}</p>
                </div>
              </div>
            )}

            {/* ETA */}
            {shipment.estimated_delivery && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Estimated Delivery</p>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(shipment.estimated_delivery).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}

            {/* Blockchain */}
            {shipment.blockchain_tx && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Blockchain Record</p>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${shipment.blockchain_tx}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 hover:underline text-sm flex items-center gap-1"
                  >
                    {shipment.blockchain_tx.slice(0, 20)}...
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Permissions */}
          {authorization?.permissions && (
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Your Permissions</p>
              <div className="flex flex-wrap gap-2">
                {authorization.permissions.can_pickup && (
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm">
                    ✓ Pickup
                  </span>
                )}
                {authorization.permissions.can_checkpoint && (
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-sm">
                    ✓ Checkpoint
                  </span>
                )}
                {authorization.permissions.can_deliver && (
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm">
                    ✓ Deliver
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Checkpoints Timeline */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
            Checkpoint History ({checkpoints.length})
          </h2>
          
          {checkpoints.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No checkpoints recorded yet
            </p>
          ) : (
            <div className="space-y-4">
              {checkpoints.map((cp, index) => (
                <CheckpointItem 
                  key={cp.id} 
                  checkpoint={cp} 
                  isLast={index === checkpoints.length - 1}
                />
              ))}
            </div>
          )}
        </div>

        {/* Checkpoint Form */}
        <AnimatePresence>
          {showCheckpointForm && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 dark:text-white">Record Checkpoint</h2>
                <button
                  onClick={() => setShowCheckpointForm(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-3 rounded-lg text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                {/* Action Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Action
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {actionOptions.map(option => {
                      const Icon = option.icon
                      const isSelected = formData.action === option.value
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, action: option.value }))}
                          className={`p-3 rounded-lg border-2 text-left transition ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                          }`}
                        >
                          <Icon className={`h-5 w-5 mb-1 ${isSelected ? 'text-emerald-600' : 'text-gray-400'}`} />
                          <p className={`text-sm font-medium ${isSelected ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'}`}>
                            {option.label}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Location *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Enter location or use GPS"
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={gettingLocation}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center gap-2"
                    >
                      {gettingLocation ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Navigation className="h-4 w-4" />
                      )}
                      GPS
                    </button>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes (optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Add any notes about this checkpoint..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Photo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Photo (optional)
                  </label>
                  {photoPreview ? (
                    <div className="relative">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, photo: null }))
                          setPhotoPreview(null)
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-emerald-500 transition flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400"
                    >
                      <Camera className="h-8 w-8" />
                      <span>Take or upload photo</span>
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2 transition"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Recording...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      Record Checkpoint
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Fixed Bottom Action */}
      {!showCheckpointForm && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => setShowCheckpointForm(true)}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 font-medium flex items-center justify-center gap-2 transition"
            >
              <MapPin className="h-5 w-5" />
              Record Checkpoint
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }) {
  const statusConfig = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    picked_up: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    in_transit: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    out_for_delivery: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
  }

  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${statusConfig[status] || statusConfig.pending}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

function CheckpointItem({ checkpoint, isLast }) {
  const actionIcons = {
    picked_up: Package,
    checkpoint: MapPin,
    in_transit: Truck,
    out_for_delivery: Navigation,
    delivered: CheckCircle
  }
  const Icon = actionIcons[checkpoint.action] || MapPin

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
          <Icon className="h-5 w-5 text-emerald-600" />
        </div>
        {!isLast && (
          <div className="w-0.5 flex-1 bg-gray-200 dark:bg-gray-700 my-2" />
        )}
      </div>
      <div className="flex-1 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium text-gray-900 dark:text-white capitalize">
              {checkpoint.action.replace(/_/g, ' ')}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              by {checkpoint.handler_name}
            </p>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {new Date(checkpoint.timestamp).toLocaleString()}
          </p>
        </div>
        {checkpoint.location && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {checkpoint.location}
          </p>
        )}
        {checkpoint.notes && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {checkpoint.notes}
          </p>
        )}
        {checkpoint.blockchain_tx && (
          <a
            href={`https://sepolia.etherscan.io/tx/${checkpoint.blockchain_tx}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:underline mt-2"
          >
            <Shield className="h-3 w-3" />
            Verified on blockchain
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  )
}
