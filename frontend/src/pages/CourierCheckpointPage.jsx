/**
 * Courier Checkpoint Page
 * Allows couriers to record checkpoints using their authorization code
 */

import { useState, useRef, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Package,
  MapPin,
  Camera,
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Truck,
  QrCode,
  KeyRound,
  Navigation,
  Clock,
  Hash,
  ExternalLink,
  ArrowLeft
} from 'lucide-react'
import { shipmentApi } from '../services/shipmentApi'
import { courierApi } from '../services/courierApi'

const actionOptions = [
  { value: 'picked_up', label: 'Picked Up', icon: Package, color: 'blue' },
  { value: 'checkpoint', label: 'Checkpoint / Scan', icon: MapPin, color: 'purple' },
  { value: 'in_transit', label: 'In Transit', icon: Truck, color: 'yellow' },
  { value: 'out_for_delivery', label: 'Out for Delivery', icon: Navigation, color: 'orange' },
  { value: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'green' }
]

export default function CourierCheckpointPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  
  const [step, setStep] = useState('auth') // 'auth' | 'form' | 'success'
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState(null)
  const [shipmentInfo, setShipmentInfo] = useState(null)
  const [result, setResult] = useState(null)
  const [location, setLocation] = useState(null)
  const [gettingLocation, setGettingLocation] = useState(false)

  // Auth form
  const [authData, setAuthData] = useState({
    shipment_id: searchParams.get('shipment') || '',
    auth_code: searchParams.get('code') || ''
  })

  // Checkpoint form
  const [formData, setFormData] = useState({
    action: 'checkpoint',
    location: '',
    notes: '',
    photo: null
  })
  const [photoPreview, setPhotoPreview] = useState(null)

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
        // Reverse geocode (simplified - in production use a geocoding API)
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

  // Verify authorization
  const handleVerify = async (e) => {
    e.preventDefault()
    setError(null)

    if (!authData.shipment_id.trim() || !authData.auth_code.trim()) {
      setError('Both Shipment ID and Authorization Code are required')
      return
    }

    setVerifying(true)
    try {
      // Verify authorization
      const authResult = await courierApi.verifyAuthorization({
        shipment_id: authData.shipment_id,
        action: 'checkpoint',
        auth_code: authData.auth_code
      })

      if (!authResult.authorized) {
        setError(authResult.message || 'Authorization failed')
        setVerifying(false)
        return
      }

      // Get shipment info
      try {
        const shipment = await shipmentApi.getShipmentByPIN(
          authData.shipment_id, 
          authData.auth_code  // Use auth code as PIN for access
        )
        setShipmentInfo(shipment)
      } catch {
        // Shipment info optional, continue without it
      }

      setStep('form')
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.details || 'Authorization failed')
    } finally {
      setVerifying(false)
    }
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

    if (!formData.location.trim()) {
      setError('Location is required')
      return
    }

    setLoading(true)
    try {
      const response = await shipmentApi.addCheckpoint(authData.shipment_id, {
        action: formData.action,
        auth_code: authData.auth_code,
        location: formData.location,
        notes: formData.notes || undefined,
        photo_url: formData.photo || undefined
      })

      setResult(response)
      setStep('success')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record checkpoint')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Truck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">ChainTrack Courier</h1>
              <p className="text-sm text-gray-500">Record Checkpoint</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Step 1: Authorization */}
        {step === 'auth' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <KeyRound className="h-8 w-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Enter Authorization</h2>
              <p className="text-gray-500 mt-1">
                Enter the shipment ID and your authorization code
              </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shipment ID
                </label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={authData.shipment_id}
                    onChange={(e) => setAuthData(prev => ({ ...prev, shipment_id: e.target.value.toUpperCase() }))}
                    placeholder="SHP-XXXXXX"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Authorization Code
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={authData.auth_code}
                    onChange={(e) => setAuthData(prev => ({ ...prev, auth_code: e.target.value.toUpperCase() }))}
                    placeholder="XXXXXXXX"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg font-mono tracking-wider"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={verifying}
                className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
              >
                {verifying ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    Verify & Continue
                  </>
                )}
              </button>
            </form>

            {/* QR Scanner hint */}
            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-500">
                <QrCode className="h-4 w-4 inline mr-1" />
                Scan QR code on package for quick entry
              </p>
            </div>
          </motion.div>
        )}

        {/* Step 2: Checkpoint Form */}
        {step === 'form' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Shipment Info Card */}
            {shipmentInfo && (
              <div className="bg-white rounded-xl shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Shipment</p>
                    <p className="font-bold text-lg">{authData.shipment_id}</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
                    {shipmentInfo.status}
                  </span>
                </div>
              </div>
            )}

            {/* Checkpoint Form */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <button
                onClick={() => setStep('auth')}
                className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

              <h2 className="text-xl font-bold text-gray-900 mb-4">Record Checkpoint</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                {/* Action Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Action Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {actionOptions.map((option) => {
                      const Icon = option.icon
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, action: option.value }))}
                          className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                            formData.action === option.value
                              ? 'border-emerald-500 bg-emerald-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Icon className={`h-5 w-5 ${
                            formData.action === option.value ? 'text-emerald-600' : 'text-gray-400'
                          }`} />
                          <span className={`text-sm font-medium ${
                            formData.action === option.value ? 'text-emerald-700' : 'text-gray-600'
                          }`}>
                            {option.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location *
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="e.g., Ikeja, Lagos"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={gettingLocation}
                      className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      title="Get current location"
                    >
                      {gettingLocation ? (
                        <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
                      ) : (
                        <Navigation className="h-5 w-5 text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any additional notes..."
                    rows={2}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Photo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Photo (optional)
                  </label>
                  {photoPreview ? (
                    <div className="relative inline-block">
                      <img src={photoPreview} alt="Preview" className="max-h-40 rounded-lg" />
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoPreview(null)
                          setFormData(prev => ({ ...prev, photo: null }))
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-emerald-400 hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <Camera className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-600">Take or Upload Photo</span>
                    </button>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoChange}
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                >
                  {loading ? (
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
            </div>
          </motion.div>
        )}

        {/* Step 3: Success */}
        {step === 'success' && result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-lg p-6 text-center"
          >
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-emerald-600" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">Checkpoint Recorded!</h2>
            <p className="text-gray-500 mb-6">
              Your checkpoint has been recorded and added to the tamper-proof chain.
            </p>

            {/* Chain Entry Info */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Action</span>
                  <span className="font-medium">{result.checkpoint?.action}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Location</span>
                  <span className="font-medium">{result.checkpoint?.location}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Shipment Status</span>
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
                    {result.shipment_status}
                  </span>
                </div>
                
                {result.chain_entry && (
                  <>
                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                        <Hash className="h-4 w-4" />
                        Chain Entry #{result.chain_entry.sequence}
                      </div>
                      <p className="font-mono text-xs text-gray-600 break-all">
                        {result.chain_entry.hash?.substring(0, 32)}...
                      </p>
                    </div>
                    {result.chain_entry.blockchain_pending && (
                      <div className="flex items-center gap-2 text-amber-600 text-sm">
                        <Clock className="h-4 w-4" />
                        Pending blockchain confirmation
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setStep('form')
                  setFormData({
                    action: 'checkpoint',
                    location: '',
                    notes: '',
                    photo: null
                  })
                  setPhotoPreview(null)
                  setError(null)
                }}
                className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 font-medium"
              >
                Record Another Checkpoint
              </button>
              <button
                onClick={() => {
                  setStep('auth')
                  setAuthData({ shipment_id: '', auth_code: '' })
                }}
                className="w-full border border-gray-300 py-3 rounded-lg hover:bg-gray-50 font-medium"
              >
                New Shipment
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
