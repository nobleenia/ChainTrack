/**
 * Confirm Delivery Page
 * Allows receiver to confirm delivery and provide feedback to blockchain
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Package,
  CheckCircle,
  XCircle,
  Star,
  Camera,
  MessageSquare,
  Shield,
  Truck,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  ArrowLeft,
  Upload,
  X
} from 'lucide-react'
import { Button } from '../../components/common'
import { shipmentApi } from '../../services/shipmentApi'

const conditionOptions = [
  { value: 'perfect', label: 'Perfect Condition', icon: '✨', color: 'green' },
  { value: 'good', label: 'Good Condition', icon: '👍', color: 'blue' },
  { value: 'minor_damage', label: 'Minor Damage', icon: '⚠️', color: 'yellow' },
  { value: 'damaged', label: 'Significantly Damaged', icon: '❌', color: 'red' },
]

export default function ConfirmDeliveryPage() {
  const { shipmentId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const pin = searchParams.get('pin') || ''
  
  const [shipment, setShipment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    pin: pin,
    condition: '',
    rating: 0,
    feedback: '',
    signature: '',
  })
  
  const [photos, setPhotos] = useState([])
  const [photoPreviews, setPhotoPreviews] = useState([])

  useEffect(() => {
    fetchShipment()
  }, [shipmentId])

  const fetchShipment = async () => {
    try {
      setLoading(true)
      const response = await shipmentApi.getShipment(shipmentId)
      setShipment(response.shipment)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load shipment')
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files || [])
    
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue
      if (file.size > 5 * 1024 * 1024) continue
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreviews(prev => [...prev, reader.result])
      }
      reader.readAsDataURL(file)
      setPhotos(prev => [...prev, file])
    }
  }

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.pin) {
      setError('Tracking PIN is required')
      return
    }
    if (!formData.condition) {
      setError('Please select package condition')
      return
    }
    
    setSubmitting(true)
    setError(null)
    
    try {
      // Confirm delivery with feedback
      await shipmentApi.confirmDelivery(shipmentId, {
        pin: formData.pin,
        condition: formData.condition,
        rating: formData.rating,
        feedback: formData.feedback,
        delivery_photos: photoPreviews,
        receiver_signature: formData.signature,
      })
      
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to confirm delivery')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading shipment details...</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden"
          >
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-white text-center">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Delivery Confirmed!</h2>
              <p className="text-green-100">
                Your confirmation has been recorded on the blockchain.
              </p>
            </div>
            
            <div className="p-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-green-700">
                  <Shield className="h-5 w-5" />
                  <span className="font-medium">Blockchain Verified</span>
                </div>
                <p className="text-sm text-green-600 mt-1">
                  This delivery confirmation is permanently recorded and cannot be altered.
                </p>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipment ID:</span>
                  <span className="font-mono font-medium">{shipment?.shipment_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Condition:</span>
                  <span className="font-medium capitalize">{formData.condition.replace('_', ' ')}</span>
                </div>
                {formData.rating > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Rating:</span>
                    <span className="flex">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${star <= formData.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                        />
                      ))}
                    </span>
                  </div>
                )}
              </div>
              
              <Button
                onClick={() => navigate('/dashboard/shipments')}
                className="w-full mt-6"
              >
                Back to Shipments
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-500 to-blue-600 p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <Package className="h-6 w-6" />
              <h1 className="text-xl font-bold">Confirm Delivery</h1>
            </div>
            <p className="text-primary-100 text-sm">
              Verify receipt and provide feedback for shipment {shipment?.shipment_id}
            </p>
          </div>
          
          {/* Error */}
          {error && (
            <div className="mx-6 mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
              <button onClick={() => setError(null)} className="ml-auto">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Shipment Summary */}
            {shipment && (
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Truck className="h-4 w-4 text-gray-500" />
                  Shipment Details
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">From:</span>
                    <p className="font-medium">{shipment.pickup_city}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">To:</span>
                    <p className="font-medium">{shipment.delivery_city}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Contents:</span>
                    <p className="font-medium">{shipment.description}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Sender:</span>
                    <p className="font-medium">{shipment.sender?.name || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* PIN Verification */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tracking PIN *
              </label>
              <input
                type="text"
                value={formData.pin}
                onChange={(e) => setFormData(prev => ({ ...prev, pin: e.target.value }))}
                placeholder="Enter your tracking PIN"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono text-lg tracking-wider text-center"
                maxLength={10}
              />
              <p className="text-xs text-gray-500 mt-1">
                The PIN was shared with you when the shipment was created
              </p>
            </div>
            
            {/* Package Condition */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Package Condition *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {conditionOptions.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, condition: option.value }))}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      formData.condition === option.value
                        ? option.color === 'green' ? 'border-green-500 bg-green-50'
                        : option.color === 'blue' ? 'border-blue-500 bg-blue-50'
                        : option.color === 'yellow' ? 'border-yellow-500 bg-yellow-50'
                        : 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{option.icon}</span>
                    <span className="font-medium text-gray-900">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Rate Your Experience (Optional)
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
                    className="p-2 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= formData.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300 hover:text-yellow-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            
            {/* Feedback */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Feedback (Optional)
              </label>
              <textarea
                value={formData.feedback}
                onChange={(e) => setFormData(prev => ({ ...prev, feedback: e.target.value }))}
                placeholder="Any comments about the delivery?"
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            {/* Delivery Photos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Photos (Optional)
              </label>
              
              {photoPreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {photoPreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Delivery photo ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <label className="block border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Take or upload photos of the delivered package</p>
              </label>
            </div>
            
            {/* Blockchain Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">Blockchain Confirmation</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Your confirmation will be permanently recorded on the Ethereum blockchain, 
                    creating an immutable proof of delivery.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(-1)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || !formData.pin || !formData.condition}
                className="flex-1 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Confirming...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Confirm Delivery
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
