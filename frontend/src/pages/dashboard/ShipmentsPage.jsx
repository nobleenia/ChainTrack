/**
 * Shipments Page
 * List and manage P2P deliveries/shipments
 */

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package,
  Plus,
  Search,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  ArrowRight,
  MapPin,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight,
  Printer,
  Eye,
  X
} from 'lucide-react'
import useShipmentStore from '../../store/shipmentStore'
import { useAuthStore } from '../../store/authStore'
import { generateShipmentLabel } from '../../utils/shipmentLabelPDF'
import shipmentApi from '../../services/shipmentApi'

const statusConfig = {
  created: {
    label: 'Created',
    color: 'bg-gray-100 text-gray-800',
    icon: Package
  },
  picked_up: {
    label: 'Picked Up',
    color: 'bg-blue-100 text-blue-800',
    icon: Truck
  },
  in_transit: {
    label: 'In Transit',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Truck
  },
  out_for_delivery: {
    label: 'Out for Delivery',
    color: 'bg-purple-100 text-purple-800',
    icon: MapPin
  },
  delivered: {
    label: 'Delivered',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle
  },
  confirmed: {
    label: 'Confirmed',
    color: 'bg-emerald-100 text-emerald-800',
    icon: CheckCircle
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-red-100 text-red-800',
    icon: XCircle
  }
}

function ShipmentCard({ shipment }) {
  const navigate = useNavigate()
  const StatusIcon = statusConfig[shipment.status]?.icon || Package
  const statusStyle = statusConfig[shipment.status] || statusConfig.created

  // Handle both nested and flat data structures
  const description = shipment.package?.description || shipment.description || 'No description'
  const pickupCity = shipment.pickup?.city || shipment.pickup_city || 'N/A'
  const deliveryCity = shipment.delivery?.city || shipment.delivery_city || 'N/A'
  const createdAt = shipment.timestamps?.created_at || shipment.created_at
  const checkpointCount = shipment.checkpoints?.length || shipment.checkpoint_count || 0
  const isTracked = shipment.is_tracked

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate(`/dashboard/shipments/${shipment.shipment_id}`)}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{shipment.shipment_id}</h3>
            {isTracked && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
                <Eye className="h-3 w-3" />
                Tracked
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusStyle.color}`}
        >
          <StatusIcon className="h-3.5 w-3.5" />
          {statusStyle.label}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <MapPin className="h-4 w-4 text-gray-400" />
          <span className="truncate">
            {pickupCity} → {deliveryCity}
          </span>
        </div>
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span>Created {createdAt ? new Date(createdAt).toLocaleDateString() : 'N/A'}</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="text-sm">
            <span className="text-gray-500 dark:text-gray-400">Checkpoints: </span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {checkpointCount}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              generateShipmentLabel(shipment)
            }}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
            title="Print Shipping Label"
          >
            <Printer className="h-4 w-4" />
          </button>
        </div>
        <button className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center gap-1">
          View Details
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  )
}

export default function ShipmentsPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const {
    shipments,
    pagination,
    loading,
    error,
    fetchShipments,
    clearError
  } = useShipmentStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [showTrackModal, setShowTrackModal] = useState(false)
  const [trackingForm, setTrackingForm] = useState({ shipmentId: '', pin: '' })
  const [trackingError, setTrackingError] = useState('')
  const [trackingLoading, setTrackingLoading] = useState(false)

  useEffect(() => {
    fetchShipments({
      page: pagination.page,
      per_page: pagination.per_page,
      status: statusFilter || undefined,
      role: roleFilter || undefined
    })
  }, [pagination.page, statusFilter, roleFilter])

  const handleClaimTracking = async (e) => {
    e.preventDefault()
    setTrackingError('')
    setTrackingLoading(true)

    try {
      await shipmentApi.claimForTracking(trackingForm.shipmentId, trackingForm.pin)
      setShowTrackModal(false)
      setTrackingForm({ shipmentId: '', pin: '' })
      // Refresh shipments list to include the new tracked shipment
      fetchShipments({
        page: 1,
        per_page: pagination.per_page,
        status: statusFilter || undefined,
        role: roleFilter || undefined
      })
    } catch (err) {
      setTrackingError(err.response?.data?.error || 'Failed to add shipment to tracking')
    } finally {
      setTrackingLoading(false)
    }
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      fetchShipments({
        page: newPage,
        per_page: pagination.per_page,
        status: statusFilter || undefined,
        role: roleFilter || undefined
      })
    }
  }

  const filteredShipments = shipments.filter((shipment) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    const description = shipment.package?.description || shipment.description || ''
    const receiverName = shipment.receiver?.name || shipment.receiver_name || ''
    return (
      shipment.shipment_id?.toLowerCase().includes(query) ||
      description.toLowerCase().includes(query) ||
      receiverName.toLowerCase().includes(query)
    )
  })

  return (
    <div className="space-y-6">
      {/* Track Shipment Modal */}
      <AnimatePresence>
        {showTrackModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowTrackModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Track a Shipment</h2>
                <button
                  onClick={() => setShowTrackModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Enter a shipment ID and PIN to add it to your tracking list. You'll be able to monitor its progress from your shipments dashboard.
              </p>

              <form onSubmit={handleClaimTracking} className="space-y-4">
                {trackingError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                    {trackingError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Shipment ID
                  </label>
                  <input
                    type="text"
                    placeholder="SHP-XXXXXX"
                    value={trackingForm.shipmentId}
                    onChange={(e) => setTrackingForm({ ...trackingForm, shipmentId: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tracking PIN
                  </label>
                  <input
                    type="text"
                    placeholder="Enter 6-digit PIN"
                    value={trackingForm.pin}
                    onChange={(e) => setTrackingForm({ ...trackingForm, pin: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                    maxLength={6}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowTrackModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={trackingLoading}
                    className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {trackingLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Adding...
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4" />
                        Add to Tracking
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Shipments</h1>
          <p className="text-gray-500 dark:text-gray-400">Track and manage your P2P deliveries</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTrackModal(true)}
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            <Eye className="h-5 w-5" />
            Track Shipment
          </button>
          <Link
            to="/dashboard/shipments/create"
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            <Plus className="h-5 w-5" />
            New Shipment
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ID, description, or receiver..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">All Statuses</option>
              <option value="created">Created</option>
              <option value="picked_up">Picked Up</option>
              <option value="in_transit">In Transit</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">All Shipments</option>
            <option value="sent">Sent by Me</option>
            <option value="handling">I'm Handling</option>
            <option value="tracked">Tracked by Me</option>
          </select>
        </div>
      </div>

      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 flex justify-between items-center"
          >
            <p className="text-red-700 dark:text-red-400">{error}</p>
            <button
              onClick={clearError}
              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm font-medium"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-600 border-t-transparent"></div>
        </div>
      )}

      {/* Shipments Grid */}
      {!loading && filteredShipments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredShipments.map((shipment) => (
            <ShipmentCard key={shipment.id} shipment={shipment} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredShipments.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <Package className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No shipments found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {searchQuery || statusFilter
              ? 'Try adjusting your filters'
              : 'Create your first shipment to get started'}
          </p>
          {!searchQuery && !statusFilter && (
            <Link
              to="/dashboard/shipments/create"
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              <Plus className="h-5 w-5" />
              Create Shipment
            </Link>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.pages > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing {((pagination.page - 1) * pagination.per_page) + 1} to{' '}
            {Math.min(pagination.page * pagination.per_page, pagination.total)} of{' '}
            {pagination.total} shipments
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
