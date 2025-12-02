/**
 * Track Shipment Page (Public)
 * Allow anyone to track a shipment with ID and PIN
 */

import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package,
  Search,
  MapPin,
  CheckCircle,
  Truck,
  Clock,
  AlertCircle,
  XCircle,
  Shield,
  ArrowRight,
  Lock
} from 'lucide-react'
import useShipmentStore from '../store/shipmentStore'

const statusConfig = {
  created: {
    label: 'Created',
    color: 'bg-gray-100 text-gray-800',
    dotColor: 'bg-gray-500',
    icon: Package,
    description: 'Shipment has been created and is awaiting pickup'
  },
  picked_up: {
    label: 'Picked Up',
    color: 'bg-blue-100 text-blue-800',
    dotColor: 'bg-blue-500',
    icon: Truck,
    description: 'Package has been picked up by courier'
  },
  in_transit: {
    label: 'In Transit',
    color: 'bg-yellow-100 text-yellow-800',
    dotColor: 'bg-yellow-500',
    icon: Truck,
    description: 'Package is on its way to the destination'
  },
  out_for_delivery: {
    label: 'Out for Delivery',
    color: 'bg-purple-100 text-purple-800',
    dotColor: 'bg-purple-500',
    icon: MapPin,
    description: 'Package is out for final delivery'
  },
  delivered: {
    label: 'Delivered',
    color: 'bg-green-100 text-green-800',
    dotColor: 'bg-green-500',
    icon: CheckCircle,
    description: 'Package has been delivered'
  },
  confirmed: {
    label: 'Confirmed',
    color: 'bg-emerald-100 text-emerald-800',
    dotColor: 'bg-emerald-500',
    icon: Shield,
    description: 'Delivery has been confirmed by receiver'
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-red-100 text-red-800',
    dotColor: 'bg-red-500',
    icon: XCircle,
    description: 'Shipment has been cancelled'
  }
}

const statusOrder = ['created', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'confirmed']

function ProgressBar({ currentStatus }) {
  const currentIndex = statusOrder.indexOf(currentStatus)
  if (currentStatus === 'cancelled') return null

  return (
    <div className="relative">
      <div className="flex justify-between mb-2">
        {statusOrder.slice(0, 5).map((status, index) => {
          const isCompleted = index <= currentIndex
          const isCurrent = index === currentIndex
          const config = statusConfig[status]
          const Icon = config.icon

          return (
            <div
              key={status}
              className={`flex flex-col items-center ${
                index === 0 ? 'items-start' : index === 4 ? 'items-end' : ''
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isCompleted
                    ? 'bg-emerald-100'
                    : 'bg-gray-100'
                } ${isCurrent ? 'ring-2 ring-emerald-500 ring-offset-2' : ''}`}
              >
                <Icon
                  className={`h-5 w-5 ${
                    isCompleted ? 'text-emerald-600' : 'text-gray-400'
                  }`}
                />
              </div>
              <span
                className={`text-xs mt-2 ${
                  isCompleted ? 'text-emerald-600 font-medium' : 'text-gray-400'
                } hidden sm:block`}
              >
                {config.label}
              </span>
            </div>
          )
        })}
      </div>
      <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-200 -z-10">
        <div
          className="h-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${(currentIndex / 4) * 100}%` }}
        />
      </div>
    </div>
  )
}

export default function TrackPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { trackingResult, loading, error, trackShipment, clearTracking } = useShipmentStore()

  const [shipmentId, setShipmentId] = useState(searchParams.get('id') || '')
  const [pin, setPin] = useState('')
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    return () => clearTracking()
  }, [])

  const handleTrack = async (e) => {
    e.preventDefault()
    if (!shipmentId.trim() || !pin.trim()) return

    setHasSearched(true)
    try {
      await trackShipment(shipmentId.trim(), pin.trim())
    } catch (err) {
      // Error handled by store
    }
  }

  const shipment = trackingResult
  const statusStyle = shipment ? statusConfig[shipment.status] : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <Package className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">ChainTrack</span>
            </Link>
            <Link
              to="/login"
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-12">
        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 mb-8"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Track Your Shipment</h1>
            <p className="text-gray-500">
              Enter your shipment ID and PIN to track your package
            </p>
          </div>

          <form onSubmit={handleTrack} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shipment ID
              </label>
              <input
                type="text"
                value={shipmentId}
                onChange={(e) => setShipmentId(e.target.value.toUpperCase())}
                placeholder="SHP-XXXXXX"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tracking PIN
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="6-digit PIN"
                  maxLength={6}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg font-mono tracking-widest"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !shipmentId.trim() || !pin.trim()}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Tracking...
                </>
              ) : (
                <>
                  <Search className="h-5 w-5" />
                  Track Shipment
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && hasSearched && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-red-800 mb-1">Tracking Failed</h3>
                  <p className="text-red-700">{error}</p>
                  <p className="text-sm text-red-600 mt-2">
                    Please check your shipment ID and PIN and try again.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tracking Result */}
        <AnimatePresence>
          {shipment && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Status Card */}
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm text-gray-500">Shipment ID</p>
                    <h2 className="text-2xl font-bold text-gray-900 font-mono">
                      {shipment.shipment_id}
                    </h2>
                  </div>
                  <span
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium ${statusStyle.color}`}
                  >
                    <statusStyle.icon className="h-5 w-5" />
                    {statusStyle.label}
                  </span>
                </div>

                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                  <p className="text-gray-600">{statusStyle.description}</p>
                </div>

                {/* Progress Bar */}
                <ProgressBar currentStatus={shipment.status} />
              </div>

              {/* Route Info */}
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Route Information</h3>
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="w-0.5 h-20 bg-gray-200 my-2" />
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-emerald-600" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-6">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">From</p>
                      <p className="font-medium text-gray-900">{shipment.pickup_city}</p>
                      <p className="text-gray-600">{shipment.pickup_country}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">To</p>
                      <p className="font-medium text-gray-900">{shipment.delivery_city}</p>
                      <p className="text-gray-600">{shipment.delivery_country}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Tracking History</h3>
                <div className="space-y-0">
                  {/* Created */}
                  <TimelineItem
                    label="Shipment Created"
                    timestamp={shipment.created_at}
                    location={`${shipment.pickup_city}, ${shipment.pickup_country}`}
                    isCompleted
                    isFirst
                  />

                  {/* Checkpoints */}
                  {shipment.checkpoints?.map((checkpoint, index) => (
                    <TimelineItem
                      key={checkpoint.id}
                      label={formatAction(checkpoint.action)}
                      timestamp={checkpoint.created_at}
                      location={checkpoint.location}
                      notes={checkpoint.notes}
                      isCompleted
                    />
                  ))}

                  {/* Delivered */}
                  {shipment.delivery_proof && (
                    <TimelineItem
                      label="Delivered"
                      timestamp={shipment.delivery_proof.delivered_at}
                      location={`${shipment.delivery_city}, ${shipment.delivery_country}`}
                      notes={`Received by ${shipment.delivery_proof.recipient_name}`}
                      isCompleted
                    />
                  )}

                  {/* Confirmed */}
                  {shipment.status === 'confirmed' && (
                    <TimelineItem
                      label="Confirmed by Receiver"
                      timestamp={shipment.delivery_proof?.confirmed_at}
                      location={`${shipment.delivery_city}, ${shipment.delivery_country}`}
                      isCompleted
                      isLast
                    />
                  )}

                  {/* Pending steps */}
                  {!['delivered', 'confirmed', 'cancelled'].includes(shipment.status) && (
                    <>
                      {shipment.status !== 'out_for_delivery' && (
                        <TimelineItem
                          label="Out for Delivery"
                          isPending
                        />
                      )}
                      <TimelineItem
                        label="Delivered"
                        isPending
                        isLast
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Package Info */}
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Package Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Description</p>
                    <p className="font-medium">{shipment.description}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="font-medium">
                      {new Date(shipment.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Blockchain Verification */}
              {shipment.blockchain_tx_hash && (
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-xl p-8 text-white">
                  <div className="flex items-center gap-3 mb-4">
                    <Shield className="h-8 w-8" />
                    <h3 className="text-lg font-semibold">Blockchain Verified</h3>
                  </div>
                  <p className="text-emerald-100 mb-4">
                    This shipment has been recorded on the blockchain for immutable tracking.
                  </p>
                  <div className="bg-white/10 rounded-lg p-4">
                    <p className="text-xs text-emerald-200 mb-1">Transaction Hash</p>
                    <p className="font-mono text-sm break-all">{shipment.blockchain_tx_hash}</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA for non-users */}
        {!shipment && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mt-12"
          >
            <p className="text-gray-600 mb-4">
              Want to send your own packages with blockchain-verified tracking?
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 bg-white text-emerald-600 px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-shadow font-medium"
            >
              Create Free Account
              <ArrowRight className="h-5 w-5" />
            </Link>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-gray-500 text-sm">
          <p>© 2025 ChainTrack. Blockchain-powered supply chain transparency.</p>
        </div>
      </footer>
    </div>
  )
}

function TimelineItem({ label, timestamp, location, notes, isCompleted, isPending, isFirst, isLast }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className={`w-4 h-4 rounded-full ${
            isCompleted
              ? 'bg-emerald-500'
              : isPending
              ? 'bg-gray-300'
              : 'bg-gray-200'
          }`}
        />
        {!isLast && (
          <div
            className={`w-0.5 h-16 ${
              isCompleted ? 'bg-emerald-500' : 'bg-gray-200'
            }`}
          />
        )}
      </div>
      <div className="flex-1 pb-6">
        <p className={`font-medium ${isPending ? 'text-gray-400' : 'text-gray-900'}`}>
          {label}
        </p>
        {location && <p className="text-sm text-gray-500">{location}</p>}
        {notes && <p className="text-sm text-gray-600 mt-1">{notes}</p>}
        {timestamp && (
          <p className="text-xs text-gray-400 mt-1">
            {new Date(timestamp).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  )
}

function formatAction(action) {
  const labels = {
    created: 'Created',
    picked_up: 'Picked Up',
    checkpoint: 'Checkpoint',
    in_transit: 'In Transit',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    confirmed: 'Confirmed'
  }
  return labels[action] || action
}
