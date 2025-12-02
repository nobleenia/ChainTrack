import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Package, 
  ArrowRightLeft, 
  CheckCircle, 
  TrendingUp,
  Plus,
  ArrowRight,
  Clock,
  ShieldCheck,
  Scan,
  History,
  Gift,
  Star,
  Coins
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { productService } from '../services/productService'
import { rewardsService } from '../services/rewardsService'

const statCards = [
  { 
    key: 'total_products', 
    label: 'Total Products', 
    icon: Package, 
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50'
  },
  { 
    key: 'in_transit', 
    label: 'In Transit', 
    icon: ArrowRightLeft, 
    color: 'bg-amber-500',
    bgColor: 'bg-amber-50'
  },
  { 
    key: 'delivered', 
    label: 'Delivered', 
    icon: CheckCircle, 
    color: 'bg-green-500',
    bgColor: 'bg-green-50'
  },
  { 
    key: 'total_verifications', 
    label: 'Verifications', 
    icon: TrendingUp, 
    color: 'bg-purple-500',
    bgColor: 'bg-purple-50'
  },
]

// Consumer-specific stat cards
const consumerStatCards = [
  { 
    key: 'products_verified', 
    label: 'Products Verified', 
    icon: ShieldCheck, 
    color: 'bg-green-500',
    bgColor: 'bg-green-50',
    value: 0
  },
  { 
    key: 'scans_today', 
    label: 'Scans Today', 
    icon: Scan, 
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50',
    value: 0
  },
  { 
    key: 'recent_checks', 
    label: 'Recent Checks', 
    icon: History, 
    color: 'bg-amber-500',
    bgColor: 'bg-amber-50',
    value: 0
  },
  { 
    key: 'authentic_found', 
    label: 'Authentic Found', 
    icon: CheckCircle, 
    color: 'bg-purple-500',
    bgColor: 'bg-purple-50',
    value: 0
  },
]

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState({
    total_products: 0,
    in_transit: 0,
    delivered: 0,
    total_verifications: 0
  })
  const [recentProducts, setRecentProducts] = useState([])
  const [rewards, setRewards] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch rewards for all users
        try {
          const rewardsData = await rewardsService.getRewardsSummary()
          setRewards(rewardsData)
        } catch (err) {
          console.log('Rewards not available:', err)
        }
        
        // For consumers, we might not need product stats
        if (user?.role === 'consumer') {
          setIsLoading(false)
          return
        }
        
        const [statsData, productsData] = await Promise.all([
          productService.getStats(),
          productService.getProducts({ per_page: 5 })
        ])
        setStats(statsData.stats)
        setRecentProducts(productsData.products)
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user?.role])

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-700'
      case 'in_transit': return 'bg-amber-100 text-amber-700'
      case 'delivered': return 'bg-blue-100 text-blue-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-600 mt-1">
            {user?.role === 'consumer' 
              ? 'Verify product authenticity and track supply chain journeys.'
              : "Here's what's happening with your supply chain today."
            }
          </p>
        </div>
        {user?.role !== 'consumer' && (
          <Link
            to="/products/new"
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            <Plus size={20} className="mr-2" />
            Register Product
          </Link>
        )}
        {user?.role === 'consumer' && (
          <Link
            to="/verify"
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            <ShieldCheck size={20} className="mr-2" />
            Verify Product
          </Link>
        )}
      </div>

      {/* Stats Grid - Different for consumers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" id="tour-stats">
        {(user?.role === 'consumer' ? consumerStatCards : statCards).map((stat, index) => (
          <motion.div
            key={stat.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {isLoading ? (
                    <span className="inline-block w-16 h-8 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    user?.role === 'consumer' 
                      ? (stat.value || 0).toLocaleString()
                      : (stats[stat.key]?.toLocaleString() || 0)
                  )}
                </p>
              </div>
              <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                <stat.icon size={24} className={stat.color.replace('bg-', 'text-')} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Products - hide for consumers */}
      {user?.role !== 'consumer' && (
      <div className="bg-white rounded-xl shadow-sm" id="tour-recent-products">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Products</h2>
          <Link 
            to="/products" 
            className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center"
          >
            View All
            <ArrowRight size={16} className="ml-1" />
          </Link>
        </div>
        
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                </div>
                <div className="h-6 w-20 bg-gray-200 rounded-full" />
              </div>
            ))}
          </div>
        ) : recentProducts.length > 0 ? (
          <div className="divide-y">
            {recentProducts.map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.product_id}`}
                className="flex items-center px-6 py-4 hover:bg-gray-50 transition"
              >
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Package size={20} className="text-primary-600" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-500">{product.product_id}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(product.status)}`}>
                    {product.status?.replace('_', ' ')}
                  </span>
                  <div className="text-sm text-gray-500 flex items-center">
                    <Clock size={14} className="mr-1" />
                    {new Date(product.created_at).toLocaleDateString()}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">No products registered yet</p>
            {user?.role !== 'consumer' && (
              <Link
                to="/products/new"
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
              >
                <Plus size={20} className="mr-2" />
                Register Your First Product
              </Link>
            )}
          </div>
        )}
      </div>
      )}

      {/* Consumer-specific Quick Actions */}
      {user?.role === 'consumer' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl p-6 text-white"
          >
            <h3 className="font-semibold text-lg mb-2">🔍 Verify a Product</h3>
            <p className="text-primary-100 text-sm mb-4">
              Scan a QR code or enter a product ID to verify authenticity and view its complete supply chain journey.
            </p>
            <Link
              to="/verify"
              className="inline-flex items-center text-white font-medium hover:underline"
            >
              Start Verification <ArrowRight size={16} className="ml-1" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white"
          >
            <h3 className="font-semibold text-lg mb-2">📱 Scan QR Code</h3>
            <p className="text-green-100 text-sm mb-4">
              Use your camera to scan product QR codes or barcodes for instant verification.
            </p>
            <Link
              to="/verify"
              className="inline-flex items-center text-white font-medium hover:underline"
            >
              Open Scanner <ArrowRight size={16} className="ml-1" />
            </Link>
          </motion.div>
        </div>
      )}

      {/* Rewards Card - All Users */}
      {rewards && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-500 via-indigo-500 to-purple-600 rounded-xl p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Gift size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-lg">My Rewards</h3>
                <p className="text-purple-200 text-sm">{rewards.tier} Tier</p>
              </div>
            </div>
            <Link
              to="/rewards"
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition"
            >
              View All
            </Link>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star size={16} />
                <span className="text-2xl font-bold">{rewards.points_balance?.toLocaleString() || 0}</span>
              </div>
              <p className="text-xs text-purple-200">Points</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Coins size={16} />
                <span className="text-2xl font-bold">{rewards.tokens_balance?.toFixed(2) || '0.00'}</span>
              </div>
              <p className="text-xs text-purple-200">CTK Tokens</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <ShieldCheck size={16} />
                <span className="text-2xl font-bold">{rewards.total_verifications || 0}</span>
              </div>
              <p className="text-xs text-purple-200">Verifications</p>
            </div>
          </div>
          
          <p className="mt-4 text-sm text-purple-200 text-center">
            🎯 Verify products to earn points! Convert 1,000 points to 1 CTK token.
          </p>
        </motion.div>
      )}

      {/* Quick Actions for different roles */}
      {user?.role === 'manufacturer' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl p-6 text-white"
          >
            <h3 className="font-semibold text-lg mb-2">Register Products</h3>
            <p className="text-primary-100 text-sm mb-4">
              Add new products to the blockchain and generate QR codes.
            </p>
            <Link
              to="/products/new"
              className="inline-flex items-center text-white font-medium hover:underline"
            >
              Get Started <ArrowRight size={16} className="ml-1" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white"
          >
            <h3 className="font-semibold text-lg mb-2">Transfer Products</h3>
            <p className="text-green-100 text-sm mb-4">
              Ship products to distributors and track their journey.
            </p>
            <Link
              to="/transfers"
              className="inline-flex items-center text-white font-medium hover:underline"
            >
              View Transfers <ArrowRight size={16} className="ml-1" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white"
          >
            <h3 className="font-semibold text-lg mb-2">View Analytics</h3>
            <p className="text-purple-100 text-sm mb-4">
              Track verifications and monitor supply chain performance.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center text-white font-medium hover:underline"
            >
              See Details <ArrowRight size={16} className="ml-1" />
            </Link>
          </motion.div>
        </div>
      )}
    </div>
  )
}
