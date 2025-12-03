/**
 * Courier Dashboard
 * Main dashboard for verified couriers showing:
 * - Stats overview
 * - Assigned shipments
 * - Recent activity
 */

import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Truck,
  Package,
  CheckCircle,
  Clock,
  MapPin,
  TrendingUp,
  Star,
  ChevronRight,
  LogOut,
  User,
  RefreshCw,
  AlertCircle,
  Loader2,
  ExternalLink,
  Shield,
  Activity
} from 'lucide-react'
import useCourierStore from '../../store/courierStore'

export default function CourierDashboard() {
  const navigate = useNavigate()
  const { 
    isAuthenticated, 
    profile, 
    shipments, 
    stats, 
    activities,
    fetchShipments, 
    fetchStats,
    fetchActivities,
    logout,
    isLoading 
  } = useCourierStore()
  
  const [refreshing, setRefreshing] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/courier')
    }
  }, [isAuthenticated, navigate])

  // Fetch data on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchShipments()
      fetchStats()
      fetchActivities(10)
    }
  }, [isAuthenticated, fetchShipments, fetchStats, fetchActivities])

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([
      fetchShipments(),
      fetchStats(),
      fetchActivities(10)
    ])
    setRefreshing(false)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/courier')
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  const profileStats = stats?.profile?.stats || profile.stats || {}

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900 dark:text-white">ChainTrack</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Courier Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition"
              >
                <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              
              <Link
                to="/courier/profile"
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">
                  {profile.display_name}
                </span>
              </Link>

              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-600 rounded-lg transition"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Welcome back, {profile.display_name}!</h2>
              <p className="text-emerald-100 mt-1">
                {shipments.length > 0 
                  ? `You have ${shipments.length} active assignment${shipments.length !== 1 ? 's' : ''}`
                  : 'No active assignments right now'
                }
              </p>
            </div>
            {profile.phone_verified && (
              <div className="hidden sm:flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
                <Shield className="h-4 w-4" />
                <span className="text-sm">Verified Courier</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Package}
            label="Total Deliveries"
            value={profileStats.total_deliveries || 0}
            color="blue"
          />
          <StatCard
            icon={CheckCircle}
            label="Success Rate"
            value={`${profileStats.success_rate || 100}%`}
            color="green"
          />
          <StatCard
            icon={Clock}
            label="On-Time"
            value={`${profileStats.on_time_percentage || 100}%`}
            color="yellow"
          />
          <StatCard
            icon={Star}
            label="Rating"
            value={profileStats.average_rating?.toFixed(1) || '5.0'}
            subtitle={`${profileStats.total_ratings || 0} reviews`}
            color="purple"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Active Shipments */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Package className="h-5 w-5 text-emerald-600" />
                Active Assignments
              </h3>
              <Link 
                to="/courier/shipments"
                className="text-sm text-emerald-600 hover:underline flex items-center gap-1"
              >
                View All <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {isLoading ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto" />
              </div>
            ) : shipments.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
                <Package className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No active assignments</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  You'll see shipments here when you're assigned to deliver them
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {shipments.slice(0, 5).map((item, index) => (
                  <ShipmentCard key={item.shipment.id} data={item} index={index} />
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-600" />
              Recent Activity
            </h3>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              {activities.length === 0 ? (
                <div className="p-6 text-center">
                  <Clock className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {activities.slice(0, 5).map((activity, index) => (
                    <ActivityItem key={activity.id || index} activity={activity} />
                  ))}
                </div>
              )}
            </div>

            {/* Blockchain Stats */}
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-4 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-5 w-5" />
                <span className="font-medium">Blockchain Records</span>
              </div>
              <p className="text-3xl font-bold">
                {profileStats.total_blockchain_records || 0}
              </p>
              <p className="text-purple-200 text-sm">
                Checkpoints recorded on-chain
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickAction
              icon={MapPin}
              label="Record Checkpoint"
              href="/courier/checkpoint"
              color="emerald"
            />
            <QuickAction
              icon={Package}
              label="My Shipments"
              href="/courier/shipments"
              color="blue"
            />
            <QuickAction
              icon={TrendingUp}
              label="My Stats"
              href="/courier/stats"
              color="purple"
            />
            <QuickAction
              icon={User}
              label="Profile"
              href="/courier/profile"
              color="gray"
            />
          </div>
        </div>
      </main>
    </div>
  )
}

// Stat Card Component
function StatCard({ icon: Icon, label, value, subtitle, color }) {
  const colors = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm"
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colors[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>}
    </motion.div>
  )
}

// Shipment Card Component
function ShipmentCard({ data, index }) {
  const { shipment, authorization, checkpoints_count } = data
  
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    picked_up: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    in_transit: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    out_for_delivery: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link
        to={`/courier/shipments/${shipment.shipment_id}`}
        className="block bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800"
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-mono font-medium text-gray-900 dark:text-white">
              {shipment.shipment_id}
            </p>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium capitalize ${statusColors[shipment.status] || statusColors.pending}`}>
              {shipment.status.replace(/_/g, ' ')}
            </span>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{shipment.origin} → {shipment.destination}</span>
          </div>
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-500">
            <span>{checkpoints_count} checkpoints</span>
            {shipment.estimated_delivery && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(shipment.estimated_delivery).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

// Activity Item Component
function ActivityItem({ activity }) {
  const actionIcons = {
    checkpoint: MapPin,
    pickup: Package,
    delivery: CheckCircle,
    auth_used: Shield
  }
  const Icon = actionIcons[activity.activity_type] || Activity

  return (
    <div className="px-4 py-3 flex items-start gap-3">
      <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
        <Icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
          {activity.action || activity.activity_type.replace(/_/g, ' ')}
        </p>
        {activity.location && (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {activity.location}
          </p>
        )}
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {new Date(activity.created_at).toLocaleString()}
        </p>
      </div>
      {activity.blockchain?.tx_hash && (
        <a
          href={`https://sepolia.etherscan.io/tx/${activity.blockchain.tx_hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-600 hover:text-emerald-700"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      )}
    </div>
  )
}

// Quick Action Component
function QuickAction({ icon: Icon, label, href, color }) {
  const colors = {
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 hover:bg-emerald-200 dark:hover:bg-emerald-900/50',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 hover:bg-blue-200 dark:hover:bg-blue-900/50',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 hover:bg-purple-200 dark:hover:bg-purple-900/50',
    gray: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
  }

  return (
    <Link
      to={href}
      className={`flex flex-col items-center gap-2 p-4 rounded-xl transition ${colors[color]}`}
    >
      <Icon className="h-6 w-6" />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  )
}
