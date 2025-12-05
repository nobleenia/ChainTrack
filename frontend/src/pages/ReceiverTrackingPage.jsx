/**
 * Receiver Tracking Page
 * Enhanced tracking page for receivers with delivery confirmation capability
 * Includes estimated delivery time, live status, and confirm receipt functionality
 */

import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package,
  MapPin,
  CheckCircle,
  CheckCircle2,
  Truck,
  Clock,
  AlertTriangle,
  ShieldCheck,
  User,
  Calendar,
  Image,
  Search,
  Phone,
  Navigation,
  Timer,
  Camera,
  ArrowRight,
  X,
  Star,
  MessageSquare,
  RefreshCw,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react'
import api from '../services/api'

const statusConfig = {
  created: {
    label: 'Created',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    icon: Package,
    description: 'Shipment has been created and is awaiting pickup',
    progress: 0
  },
  picked_up: {
    label: 'Picked Up',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    icon: Truck,
    description: 'Package has been picked up by courier',
    progress: 25
  },
  in_transit: {
    label: 'In Transit',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    icon: Navigation,
    description: 'Package is on its way to your location',
    progress: 50
  },
  out_for_delivery: {
    label: 'Out for Delivery',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    icon: Truck,
    description: 'Package is out for delivery - arriving soon!',
    progress: 75
  },
  delivered: {
    label: 'Delivered',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    icon: CheckCircle,
    description: 'Package has been delivered to your location',
    progress: 90
  },
  confirmed: {
    label: 'Confirmed',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    icon: ShieldCheck,
    description: 'Delivery confirmed with proof',
    progress: 100
  }
}

const statusOrder = ['created', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'confirmed']

export default function ReceiverTrackingPage() {
  const [searchParams] = useSearchParams()
  const [trackingId, setTrackingId] = useState(searchParams.get('id') || '')
  const [pin, setPin] = useState(searchParams.get('pin') || '')
  const [shipment, setShipment] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)

  // Auto-search if URL params provided
  useEffect(() => {
    if (trackingId && pin) {
      handleSearch()
    }
  }, [])

  // Auto-refresh every 30 seconds when enabled
  useEffect(() => {
    let interval
    if (autoRefresh && shipment && !['delivered', 'confirmed'].includes(shipment.status)) {
      interval = setInterval(() => {
        handleSearch(true)
      }, 30000)
    }
    return () => clearInterval(interval)
  }, [autoRefresh, shipment])

  const handleSearch = async (silent = false) => {
    if (!trackingId.trim() || !pin.trim()) {
      if (!silent) setError('Please enter both tracking ID and PIN')
      return
    }

    if (!silent) {
      setLoading(true)
      setError('')
      setSearched(true)
    }

    try {
      const response = await api.get(`/api/shipments/track/${trackingId.trim()}?pin=${pin.trim()}`)
      setShipment(response.data)
      if (!silent) setAutoRefresh(true)
    } catch (err) {
      if (!silent) {
        setShipment(null)
        if (err.response?.status === 404) {
          setError('Shipment not found. Please check your tracking ID.')
        } else if (err.response?.status === 403) {
          setError('Invalid PIN. Please check and try again.')
        } else {
          setError('Failed to fetch shipment details. Please try again.')
        }
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const getCurrentStatusIndex = () => {
    if (!shipment) return -1
    return statusOrder.indexOf(shipment.status)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    })
  }

  const getEstimatedDelivery = () => {
    if (!shipment) return null
    
    // If already delivered/confirmed, show actual delivery time
    if (['delivered', 'confirmed'].includes(shipment.status)) {
      return {
        label: 'Delivered',
        time: formatDate(shipment.delivered_at || shipment.checkpoints?.find(c => c.action === 'delivered')?.timestamp)
      }
    }

    // Calculate estimated delivery based on status and created time
    if (shipment.estimated_delivery) {
      return {
        label: 'Estimated Delivery',
        time: formatDate(shipment.estimated_delivery)
      }
    }

    // Fallback estimation based on status
    const created = new Date(shipment.created_at)
    let estimatedHours = 48 // Default 48 hours

    switch (shipment.status) {
      case 'out_for_delivery':
        estimatedHours = 4
        break
      case 'in_transit':
        estimatedHours = 24
        break
      case 'picked_up':
        estimatedHours = 36
        break
    }

    const estimated = new Date(created.getTime() + estimatedHours * 60 * 60 * 1000)
    return {
      label: 'Estimated Delivery',
      time: estimated.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
    }
  }

  const copyTrackingLink = () => {
    const url = `${window.location.origin}/track/receiver?id=${trackingId}&pin=${pin}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="relative py-12 md:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600"></div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-6">
              <Package className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Track Your Package
            </h1>
            <p className="text-lg text-emerald-100 max-w-xl mx-auto">
              Enter your tracking details to see real-time updates and confirm delivery
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search Form */}
      <section className="relative -mt-8 pb-8">
        <div className="max-w-2xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6"
          >
            <form onSubmit={(e) => { e.preventDefault(); handleSearch() }} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tracking ID
                  </label>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={trackingId}
                      onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
                      placeholder="SHP-XXXXXX"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    PIN Code
                  </label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="6-digit PIN"
                      maxLength={6}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Track Package
                  </>
                )}
              </button>
            </form>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3"
              >
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700 dark:text-red-400">{error}</p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Results */}
      <AnimatePresence mode="wait">
        {shipment && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="pb-16"
          >
            <div className="max-w-4xl mx-auto px-4">
              {/* Status Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden mb-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-emerald-200 text-sm">Tracking ID</p>
                        <button
                          onClick={copyTrackingLink}
                          className="p-1 hover:bg-white/10 rounded transition-colors"
                          title="Copy tracking link"
                        >
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-2xl font-bold">{shipment.shipment_id}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      {autoRefresh && !['delivered', 'confirmed'].includes(shipment.status) && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-200">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          Auto-updating
                        </span>
                      )}
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${statusConfig[shipment.status]?.color}`}>
                        {(() => {
                          const StatusIcon = statusConfig[shipment.status]?.icon || Package
                          return <StatusIcon className="w-5 h-5" />
                        })()}
                        <span className="font-semibold">{statusConfig[shipment.status]?.label}</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-6">
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${statusConfig[shipment.status]?.progress || 0}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full bg-white rounded-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Estimated Delivery */}
                {getEstimatedDelivery() && (
                  <div className="px-6 py-4 bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-100 dark:border-emerald-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Timer className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        <div>
                          <p className="text-sm text-emerald-700 dark:text-emerald-300">{getEstimatedDelivery().label}</p>
                          <p className="font-semibold text-emerald-800 dark:text-emerald-200">{getEstimatedDelivery().time}</p>
                        </div>
                      </div>
                      {shipment.status === 'out_for_delivery' && (
                        <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-sm font-medium rounded-full animate-pulse">
                          Arriving Today
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Status Description */}
                <div className="p-6">
                  <p className="text-center text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg py-3 px-4">
                    {statusConfig[shipment.status]?.description}
                  </p>

                  {/* Progress Steps */}
                  <div className="mt-8 flex items-center justify-between overflow-x-auto pb-2">
                    {statusOrder.slice(0, 5).map((status, index) => {
                      const isCompleted = getCurrentStatusIndex() >= index
                      const isCurrent = getCurrentStatusIndex() === index
                      const StatusIcon = statusConfig[status].icon

                      return (
                        <div key={status} className="flex flex-col items-center min-w-[70px] relative">
                          {index > 0 && (
                            <div className={`absolute right-1/2 top-5 w-full h-0.5 -translate-y-1/2 ${
                              isCompleted ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'
                            }`} style={{ width: 'calc(100% - 40px)', right: 'calc(50% + 20px)' }} />
                          )}
                          <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                            isCompleted
                              ? 'bg-emerald-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                          } ${isCurrent ? 'ring-4 ring-emerald-200 dark:ring-emerald-900' : ''}`}>
                            {isCompleted && index < getCurrentStatusIndex() ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : (
                              <StatusIcon className="w-5 h-5" />
                            )}
                          </div>
                          <p className={`mt-2 text-xs font-medium text-center ${
                            isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'
                          }`}>
                            {statusConfig[status].label}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {shipment.status === 'delivered' && !shipment.delivery_proof && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 mb-6 text-white"
                >
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-center sm:text-left">
                      <h3 className="text-xl font-bold mb-1">Package Delivered!</h3>
                      <p className="text-emerald-100">Confirm receipt and provide feedback</p>
                    </div>
                    <Link
                      to={`/confirm-delivery/${shipment.shipment_id}?pin=${pin}`}
                      className="flex items-center gap-2 bg-white text-emerald-600 px-6 py-3 rounded-xl font-semibold hover:bg-emerald-50 transition-colors"
                    >
                      <Camera className="w-5 h-5" />
                      Confirm Receipt
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </motion.div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Package Info */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-emerald-600" />
                    Package Details
                  </h3>
                  <div className="space-y-3">
                    <DetailRow label="Description" value={shipment.package?.description || shipment.description || 'Package'} />
                    {shipment.package?.weight && <DetailRow label="Weight" value={`${shipment.package.weight} kg`} />}
                    {shipment.package?.declared_value && (
                      <DetailRow label="Value" value={`₦${shipment.package.declared_value.toLocaleString()}`} />
                    )}
                    <DetailRow label="Created" value={formatDate(shipment.created_at)} />
                  </div>
                </div>

                {/* Delivery Info */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                    Delivery Details
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-3 h-3 bg-emerald-600 rounded-full mt-1.5 flex-shrink-0"></div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">From</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {shipment.pickup_address || shipment.origin || 'Sender Location'}
                        </p>
                      </div>
                    </div>
                    <div className="ml-1.5 w-0.5 h-6 bg-gray-200 dark:bg-gray-700"></div>
                    <div className="flex items-start gap-3">
                      <div className="w-3 h-3 bg-teal-500 rounded-full mt-1.5 flex-shrink-0"></div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">To</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {shipment.delivery_address || shipment.destination || 'Your Location'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tracking Timeline */}
              {shipment.checkpoints && shipment.checkpoints.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-emerald-600" />
                    Tracking History
                  </h3>
                  <div className="space-y-0">
                    {[...shipment.checkpoints].reverse().map((checkpoint, index) => (
                      <div key={checkpoint.id || index} className="relative flex gap-4">
                        {index < shipment.checkpoints.length - 1 && (
                          <div className="absolute left-[11px] top-8 w-0.5 h-full bg-gray-200 dark:bg-gray-700"></div>
                        )}
                        <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                          index === 0 ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}>
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                        <div className="pb-6 flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                            <p className="font-medium text-gray-900 dark:text-white capitalize">
                              {checkpoint.action?.replace(/_/g, ' ') || checkpoint.status_update}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {formatDate(checkpoint.timestamp || checkpoint.created_at)}
                            </p>
                          </div>
                          {checkpoint.location && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-1">
                              <MapPin className="w-4 h-4" />
                              {checkpoint.location}
                            </p>
                          )}
                          {checkpoint.handler_name && (
                            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                              Handler: {checkpoint.handler_name}
                            </p>
                          )}
                          {checkpoint.notes && (
                            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1 italic">
                              "{checkpoint.notes}"
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Delivery Proof */}
              {shipment.delivery_proof && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-green-600" />
                    Delivery Confirmed
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <User className="w-4 h-4" />
                        <span>Received by:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {shipment.delivery_proof.receiver_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>Confirmed:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatDate(shipment.delivery_proof.confirmed_at)}
                        </span>
                      </div>
                      {shipment.delivery_proof.rating && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Star className="w-4 h-4" />
                          <span>Rating:</span>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= shipment.delivery_proof.rating
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      {shipment.delivery_proof.feedback && (
                        <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                          <MessageSquare className="w-4 h-4 mt-0.5" />
                          <span className="italic">"{shipment.delivery_proof.feedback}"</span>
                        </div>
                      )}
                    </div>
                    {shipment.delivery_proof.photo_url && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Proof Photo</p>
                        <a
                          href={shipment.delivery_proof.photo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                        >
                          <Image className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                          <span className="text-gray-700 dark:text-gray-300">View Photo</span>
                          <ExternalLink className="w-4 h-4 text-gray-500" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Blockchain Verification */}
                  {shipment.delivery_proof.blockchain_hash && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-sm font-medium">Blockchain Verified</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 font-mono break-all">
                        TX: {shipment.delivery_proof.blockchain_hash}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Contact Sender */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Need help? Contact the sender or{' '}
                  <a href="mailto:support@chaintrack.com" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                    support@chaintrack.com
                  </a>
                </p>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {searched && !shipment && !loading && !error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No shipment found with the provided details</p>
        </motion.div>
      )}
    </div>
  )
}

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <span className="text-gray-600 dark:text-gray-400">{label}</span>
      <span className="font-medium text-gray-900 dark:text-white">{value}</span>
    </div>
  )
}
