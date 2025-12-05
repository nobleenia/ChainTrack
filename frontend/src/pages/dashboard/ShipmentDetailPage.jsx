/**
 * Shipment Detail Page
 * View shipment details, timeline, and manage delivery
 */

import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import {
  Package,
  MapPin,
  User,
  Phone,
  Mail,
  Calendar,
  Clock,
  Camera,
  Upload,
  CheckCircle,
  XCircle,
  Truck,
  AlertCircle,
  ArrowLeft,
  Copy,
  QrCode,
  Plus,
  Loader2,
  FileText,
  Shield,
  UserPlus,
  Users,
  Link2,
  X,
  ExternalLink,
  Hash,
  Printer
} from 'lucide-react'
import { generateShipmentLabel } from '../../utils/shipmentLabelPDF'
import useShipmentStore from '../../store/shipmentStore'
import { useAuthStore } from '../../store/authStore'
import AuthorizeCourierModal from '../../components/shipment/AuthorizeCourierModal'
import CourierAuthorizationsList from '../../components/shipment/CourierAuthorizationsList'
import ChainIntegrityVerification from '../../components/shipment/ChainIntegrityVerification'

const statusConfig = {
  created: {
    label: 'Created',
    color: 'bg-gray-100 text-gray-800 border-gray-300',
    dotColor: 'bg-gray-500',
    icon: Package
  },
  picked_up: {
    label: 'Picked Up',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    dotColor: 'bg-blue-500',
    icon: Truck
  },
  in_transit: {
    label: 'In Transit',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    dotColor: 'bg-yellow-500',
    icon: Truck
  },
  out_for_delivery: {
    label: 'Out for Delivery',
    color: 'bg-purple-100 text-purple-800 border-purple-300',
    dotColor: 'bg-purple-500',
    icon: MapPin
  },
  delivered: {
    label: 'Delivered',
    color: 'bg-green-100 text-green-800 border-green-300',
    dotColor: 'bg-green-500',
    icon: CheckCircle
  },
  confirmed: {
    label: 'Confirmed',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    dotColor: 'bg-emerald-500',
    icon: Shield
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-red-100 text-red-800 border-red-300',
    dotColor: 'bg-red-500',
    icon: XCircle
  }
}

const actionConfig = {
  created: { label: 'Created', icon: Package },
  picked_up: { label: 'Picked Up', icon: Truck },
  checkpoint: { label: 'Checkpoint', icon: MapPin },
  in_transit: { label: 'In Transit', icon: Truck },
  out_for_delivery: { label: 'Out for Delivery', icon: MapPin },
  delivered: { label: 'Delivered', icon: CheckCircle },
  confirmed: { label: 'Confirmed by Receiver', icon: Shield }
}

function AddCheckpointModal({ shipmentId, onClose, onSuccess }) {
  const { addCheckpoint, loading } = useShipmentStore()
  const fileInputRef = useRef(null)
  const [formData, setFormData] = useState({
    action: 'checkpoint',
    location: '',
    notes: '',
    handler_name: '',
    photo: null
  })
  const [photoPreview, setPhotoPreview] = useState(null)
  const [error, setError] = useState(null)

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, photo: reader.result }))
        setPhotoPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.location.trim()) {
      setError('Location is required')
      return
    }

    try {
      await addCheckpoint(shipmentId, {
        action: formData.action,
        location: formData.location,
        notes: formData.notes || undefined,
        handler_name: formData.handler_name || undefined,
        photo: formData.photo || undefined
      })
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add checkpoint')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add Checkpoint</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-3 rounded-lg text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Action</label>
            <select
              value={formData.action}
              onChange={(e) => setFormData((prev) => ({ ...prev, action: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="checkpoint">Checkpoint / Scan</option>
              <option value="picked_up">Picked Up</option>
              <option value="in_transit">In Transit</option>
              <option value="out_for_delivery">Out for Delivery</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location *
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
              placeholder="e.g., Ikeja, Lagos"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Handler Name (optional)
            </label>
            <input
              type="text"
              value={formData.handler_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, handler_name: e.target.value }))}
              placeholder="Courier name"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Any additional notes..."
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Photo (optional)
            </label>
            {photoPreview ? (
              <div className="relative inline-block">
                <img src={photoPreview} alt="Preview" className="max-w-[200px] rounded-lg" />
                <button
                  type="button"
                  onClick={() => {
                    setPhotoPreview(null)
                    setFormData((prev) => ({ ...prev, photo: null }))
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Camera className="h-4 w-4" />
                Add Photo
              </button>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-emerald-600 text-white px-4 py-2.5 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Checkpoint'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

function DeliveryModal({ shipmentId, onClose, onSuccess }) {
  const { markDelivered, loading } = useShipmentStore()
  const fileInputRef = useRef(null)
  const [formData, setFormData] = useState({
    recipient_name: '',
    notes: '',
    photo: null
  })
  const [photoPreview, setPhotoPreview] = useState(null)
  const [error, setError] = useState(null)

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, photo: reader.result }))
        setPhotoPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.recipient_name.trim()) {
      setError('Recipient name is required')
      return
    }
    if (!formData.photo) {
      setError('Delivery photo is required')
      return
    }

    try {
      await markDelivered(shipmentId, {
        recipient_name: formData.recipient_name,
        notes: formData.notes || undefined,
        delivery_photo: formData.photo
      })
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to mark as delivered')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold dark:text-white">Mark as Delivered</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded dark:text-gray-400">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-3 rounded-lg text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Recipient Name *
            </label>
            <input
              type="text"
              value={formData.recipient_name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, recipient_name: e.target.value }))
              }
              placeholder="Person who received the package"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Delivery Photo *
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Take a photo of the delivered package as proof of delivery
            </p>
            {photoPreview ? (
              <div className="relative inline-block">
                <img src={photoPreview} alt="Preview" className="max-w-full rounded-lg" />
                <button
                  type="button"
                  onClick={() => {
                    setPhotoPreview(null)
                    setFormData((prev) => ({ ...prev, photo: null }))
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 w-full justify-center text-gray-700 dark:text-gray-300"
              >
                <Camera className="h-5 w-5" />
                Take/Upload Photo
              </button>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Any delivery notes..."
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-emerald-600 text-white px-4 py-2.5 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Confirm Delivery'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

function ConfirmReceiptModal({ shipmentId, onClose, onSuccess }) {
  const { confirmDelivery, loading } = useShipmentStore()
  const canvasRef = useRef(null)
  const [formData, setFormData] = useState({
    rating: 5,
    feedback: '',
    signature: null
  })
  const [isDrawing, setIsDrawing] = useState(false)
  const [error, setError] = useState(null)

  // Signature drawing handlers
  const startDrawing = (e) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false)
      const canvas = canvasRef.current
      setFormData((prev) => ({ ...prev, signature: canvas.toDataURL() }))
    }
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setFormData((prev) => ({ ...prev, signature: null }))
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      ctx.strokeStyle = '#1f2937'
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.signature) {
      setError('Please sign to confirm receipt')
      return
    }

    try {
      await confirmDelivery(shipmentId, {
        rating: formData.rating,
        feedback: formData.feedback || undefined,
        signature: formData.signature
      })
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to confirm delivery')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Confirm Receipt</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rate Delivery
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, rating: star }))}
                  className={`text-2xl ${
                    star <= formData.rating ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Feedback (optional)
            </label>
            <textarea
              value={formData.feedback}
              onChange={(e) => setFormData((prev) => ({ ...prev, feedback: e.target.value }))}
              placeholder="How was your delivery experience?"
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Signature *
            </label>
            <div className="border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
              <canvas
                ref={canvasRef}
                width={350}
                height={150}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full cursor-crosshair touch-none bg-white"
              />
            </div>
            <button
              type="button"
              onClick={clearSignature}
              className="text-sm text-gray-500 hover:text-gray-700 mt-1"
            >
              Clear signature
            </button>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-emerald-600 text-white px-4 py-2.5 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? 'Confirming...' : 'Confirm Receipt'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default function ShipmentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const {
    currentShipment: shipment,
    loading,
    error,
    fetchShipment,
    clearCurrentShipment
  } = useShipmentStore()

  const [showQR, setShowQR] = useState(false)
  const [showAddCheckpoint, setShowAddCheckpoint] = useState(false)
  const [showDelivery, setShowDelivery] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showAuthorizeCourier, setShowAuthorizeCourier] = useState(false)
  const [showCourierAuthorizations, setShowCourierAuthorizations] = useState(false)
  const [showChainVerification, setShowChainVerification] = useState(false)

  useEffect(() => {
    fetchShipment(id)
    return () => clearCurrentShipment()
  }, [id])

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  const isSender = (shipment?.sender?.id || shipment?.sender_id) === user?.id
  const isReceiver = (shipment?.receiver?.email || shipment?.receiver_email) === user?.email

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="h-16 w-16 mx-auto text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Shipment</h2>
        <p className="text-gray-500 mb-4">{error}</p>
        <button
          onClick={() => navigate('/dashboard/shipments')}
          className="text-emerald-600 hover:text-emerald-700 font-medium"
        >
          ← Back to Shipments
        </button>
      </div>
    )
  }

  if (!shipment) return null

  const statusStyle = statusConfig[shipment.status] || statusConfig.created
  const StatusIcon = statusStyle.icon

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/dashboard/shipments')}
          className="flex items-center gap-2 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Shipments
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{shipment.shipment_id}</h1>
              <button
                onClick={() => copyToClipboard(shipment.shipment_id)}
                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title="Copy ID"
              >
                <Copy className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-300">{shipment.package?.description || shipment.description || 'Shipment'}</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowQR(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <QrCode className="h-5 w-5" />
              QR Code
            </button>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${statusStyle.color}`}
            >
              <StatusIcon className="h-4 w-4" />
              {statusStyle.label}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Route Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Route Information</h2>
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-blue-600" />
                </div>
                <div className="w-0.5 h-16 bg-gray-200 my-2" />
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Pickup Location</p>
                  <p className="font-medium text-gray-900">{shipment.pickup?.address || shipment.pickup_address || 'N/A'}</p>
                  <p className="text-gray-700">
                    {shipment.pickup?.city || shipment.pickup_city || ''}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Delivery Location</p>
                  <p className="font-medium text-gray-900">{shipment.delivery?.address || shipment.delivery_address || 'N/A'}</p>
                  <p className="text-gray-700">
                    {shipment.delivery?.city || shipment.delivery_city || ''}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Tracking Timeline</h2>
              {isSender && !['delivered', 'confirmed', 'cancelled'].includes(shipment.status) && (
                <button
                  onClick={() => setShowAddCheckpoint(true)}
                  className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700"
                >
                  <Plus className="h-4 w-4" />
                  Add Checkpoint
                </button>
              )}
            </div>

            <div className="space-y-0">
              {/* Shipment created */}
              <TimelineItem
                action="created"
                timestamp={shipment.timestamps?.created_at || shipment.created_at}
                location={shipment.pickup?.city || shipment.pickup_city || 'Origin'}
                notes="Shipment created"
                isFirst
              />

              {/* Checkpoints */}
              {shipment.checkpoints?.map((checkpoint, index) => (
                <TimelineItem
                  key={checkpoint.id}
                  action={checkpoint.action}
                  timestamp={checkpoint.created_at}
                  location={checkpoint.location}
                  notes={checkpoint.notes}
                  handler={checkpoint.handler_name}
                  photo={checkpoint.photo_hash}
                />
              ))}

              {/* Delivery proof */}
              {shipment.delivery_proof && (
                <TimelineItem
                  action="delivered"
                  timestamp={shipment.delivery_proof.delivered_at}
                  location={`${shipment.delivery_city}, ${shipment.delivery_country}`}
                  notes={`Received by ${shipment.delivery_proof.recipient_name}`}
                  photo={shipment.delivery_proof.delivery_photo_hash}
                />
              )}

              {/* Confirmation */}
              {shipment.status === 'confirmed' && (
                <TimelineItem
                  action="confirmed"
                  timestamp={shipment.delivery_proof?.confirmed_at}
                  location={`${shipment.delivery_city}, ${shipment.delivery_country}`}
                  notes="Delivery confirmed by receiver"
                  isLast
                />
              )}
            </div>
          </div>

          {/* Package Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Package Details</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Description</p>
                <p className="font-medium text-gray-900">{shipment.package?.description || shipment.description || 'N/A'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {(shipment.package?.weight || shipment.weight) && (
                  <div>
                    <p className="text-sm text-gray-500">Weight</p>
                    <p className="font-medium text-gray-900">{shipment.package?.weight || shipment.weight} kg</p>
                  </div>
                )}
                {(shipment.package?.dimensions || shipment.dimensions) && (
                  <div>
                    <p className="text-sm text-gray-500">Dimensions</p>
                    <p className="font-medium text-gray-900">{shipment.package?.dimensions || shipment.dimensions}</p>
                  </div>
                )}
                {(shipment.package?.declared_value || shipment.declared_value) && (
                  <div>
                    <p className="text-sm text-gray-500">Declared Value</p>
                    <p className="font-medium text-gray-900">₦{(shipment.package?.declared_value || shipment.declared_value)?.toLocaleString()}</p>
                  </div>
                )}
                {shipment.package?.type && (
                  <div>
                    <p className="text-sm text-gray-500">Package Type</p>
                    <p className="font-medium text-gray-900">{shipment.package.type}</p>
                  </div>
                )}
              </div>
            </div>
            {(shipment.package?.special_instructions || shipment.special_instructions) && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">Special Instructions</p>
                <p className="text-gray-700">{shipment.package?.special_instructions || shipment.special_instructions}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Actions & Info */}
        <div className="space-y-6">
          {/* Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Actions</h3>
            <div className="space-y-3">
              {/* Mark as Delivered - Only for receiver (incoming shipments) */}
              {isReceiver &&
                ['created', 'picked_up', 'in_transit', 'out_for_delivery'].includes(
                  shipment.status
                ) && (
                  <button
                    onClick={() => setShowDelivery(true)}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-lg hover:bg-emerald-700"
                  >
                    <CheckCircle className="h-5 w-5" />
                    Mark as Delivered
                  </button>
                )}

              {isReceiver && shipment.status === 'delivered' && (
                <button
                  onClick={() => setShowConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-lg hover:bg-emerald-700"
                >
                  <Shield className="h-5 w-5" />
                  Confirm Receipt
                </button>
              )}

              {isSender &&
                shipment.status === 'created' && (
                  <button
                    onClick={() => setShowAddCheckpoint(true)}
                    className="w-full flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50"
                  >
                    <Plus className="h-5 w-5" />
                    Add Checkpoint
                  </button>
                )}

              {/* Courier Authorization - Only for sender */}
              {isSender && !['delivered', 'confirmed', 'cancelled'].includes(shipment.status) && (
                <>
                  <button
                    onClick={() => setShowAuthorizeCourier(true)}
                    className="w-full flex items-center justify-center gap-2 border border-emerald-300 text-emerald-700 px-4 py-2.5 rounded-lg hover:bg-emerald-50"
                  >
                    <UserPlus className="h-5 w-5" />
                    Authorize Courier
                  </button>
                  <button
                    onClick={() => setShowCourierAuthorizations(true)}
                    className="w-full flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50"
                  >
                    <Users className="h-5 w-5" />
                    Manage Authorizations
                  </button>
                </>
              )}

              {/* Chain Verification - Available to sender and receiver */}
              {(isSender || isReceiver) && shipment.checkpoints?.length > 0 && (
                <button
                  onClick={() => setShowChainVerification(true)}
                  className="w-full flex items-center justify-center gap-2 border border-blue-300 text-blue-700 px-4 py-2.5 rounded-lg hover:bg-blue-50"
                >
                  <Link2 className="h-5 w-5" />
                  Verify Chain Integrity
                </button>
              )}

              {/* Print Shipping Label - Always available */}
              <button
                onClick={() => generateShipmentLabel(shipment)}
                className="w-full flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50"
              >
                <Printer className="h-5 w-5" />
                Print Shipping Label
              </button>
            </div>
          </div>

          {/* Receiver Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Receiver</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-400" />
                <span className="text-gray-900">{shipment.receiver?.name || shipment.receiver_name || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <span className="text-gray-900">{shipment.receiver?.phone || shipment.receiver_phone || 'N/A'}</span>
              </div>
              {(shipment.receiver?.email || shipment.receiver_email) && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-900">{shipment.receiver?.email || shipment.receiver_email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Dates</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="text-gray-900">{(shipment.timestamps?.created_at || shipment.created_at) ? new Date(shipment.timestamps?.created_at || shipment.created_at).toLocaleString() : 'N/A'}</p>
                </div>
              </div>
              {(shipment.timestamps?.delivered_at || shipment.delivered_at) && (
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Delivered</p>
                    <p className="text-gray-900">{new Date(shipment.timestamps?.delivered_at || shipment.delivered_at).toLocaleString()}</p>
                  </div>
                </div>
              )}
              {(shipment.timestamps?.confirmed_at || shipment.confirmed_at) && (
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-emerald-500" />
                  <div>
                    <p className="text-sm text-gray-500">Confirmed</p>
                    <p className="text-gray-900">{new Date(shipment.timestamps?.confirmed_at || shipment.confirmed_at).toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Blockchain Info - Only visible to sender for security */}
          {(shipment.blockchain?.hash || shipment.blockchain_hash) && isSender && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-600" />
                Blockchain Verified
              </h3>
              <div className="space-y-3">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-emerald-700 text-sm font-medium mb-1">
                    <CheckCircle className="h-4 w-4" />
                    On-Chain Record
                  </div>
                  <p className="text-xs text-emerald-600">This shipment is recorded on the Sepolia testnet blockchain</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    Transaction Hash
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-xs text-gray-700 break-all flex-1">
                      {shipment.blockchain?.hash || shipment.blockchain_hash}
                    </p>
                    <button
                      onClick={() => copyToClipboard(shipment.blockchain?.hash || shipment.blockchain_hash)}
                      className="p-1 hover:bg-gray-200 rounded flex-shrink-0"
                      title="Copy hash"
                    >
                      <Copy className="h-3 w-3 text-gray-500" />
                    </button>
                  </div>
                </div>
                {(shipment.blockchain?.block || shipment.blockchain_block) && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Block Number</p>
                    <p className="font-mono text-sm text-gray-700">
                      #{shipment.blockchain?.block || shipment.blockchain_block}
                    </p>
                  </div>
                )}
                <a
                  href={`https://sepolia.etherscan.io/tx/${shipment.blockchain?.hash || shipment.blockchain_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-lg transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  View on Etherscan
                </a>
              </div>
            </div>
          )}

          {/* Blockchain Verified Badge - For non-senders (doesn't show tx hash) */}
          {(shipment.blockchain?.hash || shipment.blockchain_hash) && !isSender && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Shield className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Blockchain Verified</p>
                  <p className="text-sm text-gray-500">This shipment is recorded on-chain</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQR && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full text-center"
            >
              <h3 className="text-lg font-semibold mb-4">Scan to Track</h3>
              <div className="bg-white p-4 rounded-lg inline-block mb-4">
                <QRCodeSVG
                  value={`${window.location.origin}/track?id=${shipment.shipment_id}`}
                  size={200}
                  level="H"
                />
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Scan this QR code to track this shipment
              </p>
              <button
                onClick={() => setShowQR(false)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modals */}
      {showAddCheckpoint && (
        <AddCheckpointModal
          shipmentId={shipment.id}
          onClose={() => setShowAddCheckpoint(false)}
          onSuccess={() => {
            setShowAddCheckpoint(false)
            fetchShipment(id)
          }}
        />
      )}

      {showDelivery && (
        <DeliveryModal
          shipmentId={shipment.id}
          onClose={() => setShowDelivery(false)}
          onSuccess={() => {
            setShowDelivery(false)
            fetchShipment(id)
          }}
        />
      )}

      {showConfirm && (
        <ConfirmReceiptModal
          shipmentId={shipment.id}
          onClose={() => setShowConfirm(false)}
          onSuccess={() => {
            setShowConfirm(false)
            fetchShipment(id)
          }}
        />
      )}

      {/* Courier Authorization Modals */}
      {showAuthorizeCourier && (
        <AuthorizeCourierModal
          shipmentId={shipment.shipment_id}
          onClose={() => setShowAuthorizeCourier(false)}
        />
      )}

      {showCourierAuthorizations && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full my-8"
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Authorized Couriers</h3>
              <button
                onClick={() => setShowCourierAuthorizations(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="p-6">
              <CourierAuthorizationsList shipmentId={shipment.shipment_id} />
            </div>
          </motion.div>
        </div>
      )}

      {showChainVerification && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-3xl w-full my-8"
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Chain Integrity Verification</h3>
              <button
                onClick={() => setShowChainVerification(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="p-6">
              <ChainIntegrityVerification shipmentId={shipment.shipment_id} />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

function TimelineItem({ action, timestamp, location, notes, handler, photo, isFirst, isLast }) {
  const config = actionConfig[action] || actionConfig.checkpoint
  const Icon = config.icon

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            action === 'confirmed'
              ? 'bg-emerald-100'
              : action === 'delivered'
              ? 'bg-green-100'
              : 'bg-gray-100'
          }`}
        >
          <Icon
            className={`h-5 w-5 ${
              action === 'confirmed'
                ? 'text-emerald-600'
                : action === 'delivered'
                ? 'text-green-600'
                : 'text-gray-600'
            }`}
          />
        </div>
        {!isLast && <div className="w-0.5 h-full bg-gray-200 min-h-[40px]" />}
      </div>
      <div className="flex-1 pb-6">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{config.label}</span>
          {handler && (
            <span className="text-sm text-gray-500">by {handler}</span>
          )}
        </div>
        <p className="text-sm text-gray-500">{location}</p>
        {notes && <p className="text-sm text-gray-600 mt-1">{notes}</p>}
        <p className="text-xs text-gray-400 mt-1">
          {timestamp && new Date(timestamp).toLocaleString()}
        </p>
      </div>
    </div>
  )
}
