/**
 * Courier Shipments Page
 * Lists all shipments assigned to the courier with filtering
 */

import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package,
  MapPin,
  Clock,
  CheckCircle,
  Truck,
  ChevronRight,
  ArrowLeft,
  Filter,
  Search,
  RefreshCw,
  Loader2,
  AlertCircle
} from 'lucide-react'
import useCourierStore from '../../store/courierStore'

const statusFilters = [
  { value: '', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'picked_up', label: 'Picked Up' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' }
]

export default function CourierShipmentsPage() {
  const navigate = useNavigate()
  const { isAuthenticated, shipments, fetchShipments, isLoading } = useCourierStore()
  
  const [statusFilter, setStatusFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/courier')
    }
  }, [isAuthenticated, navigate])

  // Fetch on mount and filter change
  useEffect(() => {
    if (isAuthenticated) {
      fetchShipments(statusFilter || null)
    }
  }, [isAuthenticated, statusFilter, fetchShipments])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchShipments(statusFilter || null)
    setRefreshing(false)
  }

  // Filter shipments by search
  const filteredShipments = shipments.filter(item => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      item.shipment.shipment_id.toLowerCase().includes(query) ||
      item.shipment.origin.toLowerCase().includes(query) ||
      item.shipment.destination.toLowerCase().includes(query)
    )
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                to="/courier/dashboard"
                className="p-2 -ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="font-bold text-gray-900 dark:text-white">My Shipments</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {shipments.length} assignment{shipments.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition"
            >
              <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Search & Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, origin, or destination..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Status Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Filter className="h-4 w-4 text-gray-400 flex-shrink-0" />
            {statusFilters.map(filter => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
                  statusFilter === filter.value
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto" />
            <p className="text-gray-500 dark:text-gray-400 mt-2">Loading shipments...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredShipments.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
            <Package className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-900 dark:text-white font-medium">No shipments found</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {searchQuery || statusFilter 
                ? 'Try adjusting your filters'
                : "You'll see shipments here when you're assigned to deliver them"
              }
            </p>
          </div>
        )}

        {/* Shipments List */}
        <AnimatePresence mode="wait">
          {!isLoading && filteredShipments.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {filteredShipments.map((item, index) => (
                <ShipmentCard key={item.shipment.id} data={item} index={index} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

function ShipmentCard({ data, index }) {
  const { shipment, authorization, checkpoints_count } = data
  
  const statusConfig = {
    pending: {
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      icon: Clock
    },
    picked_up: {
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      icon: Package
    },
    in_transit: {
      color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      icon: Truck
    },
    out_for_delivery: {
      color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      icon: Truck
    },
    delivered: {
      color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      icon: CheckCircle
    }
  }

  const status = statusConfig[shipment.status] || statusConfig.pending
  const StatusIcon = status.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        to={`/courier/shipments/${shipment.shipment_id}`}
        className="block bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800"
      >
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${status.color}`}>
            <StatusIcon className="h-6 w-6" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-mono font-medium text-gray-900 dark:text-white">
                  {shipment.shipment_id}
                </p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium capitalize ${status.color}`}>
                  {shipment.status.replace(/_/g, ' ')}
                </span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
            </div>

            <div className="space-y-2">
              {/* Route */}
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="text-gray-600 dark:text-gray-400">
                  <p className="truncate">{shipment.origin}</p>
                  <p className="text-gray-400 dark:text-gray-500">↓</p>
                  <p className="truncate">{shipment.destination}</p>
                </div>
              </div>

              {/* Meta */}
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500 pt-2 border-t border-gray-100 dark:border-gray-700">
                <span>{checkpoints_count} checkpoint{checkpoints_count !== 1 ? 's' : ''}</span>
                {shipment.estimated_delivery && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    ETA: {new Date(shipment.estimated_delivery).toLocaleDateString()}
                  </span>
                )}
              </div>

              {/* Permissions */}
              {authorization?.permissions && (
                <div className="flex flex-wrap gap-1 pt-2">
                  {authorization.permissions.can_pickup && (
                    <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-xs">
                      Pickup
                    </span>
                  )}
                  {authorization.permissions.can_checkpoint && (
                    <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded text-xs">
                      Checkpoint
                    </span>
                  )}
                  {authorization.permissions.can_deliver && (
                    <span className="px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded text-xs">
                      Deliver
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
