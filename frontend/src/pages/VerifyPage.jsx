/**
 * VerifyPage
 * 
 * Public page to verify product authenticity.
 * Supports QR code scanning and manual product ID entry.
 * Logged-in users earn reward points for verifications.
 */

import { useState, useEffect } from 'react'
import { useSearchParams, useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  QrCode, 
  Search, 
  Shield, 
  ShieldCheck, 
  ShieldX,
  MapPin,
  Calendar,
  User,
  Building,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Camera,
  AlertCircle,
  CheckCircle,
  Clock,
  Package,
  Barcode,
  Gift,
  Star,
  LogIn
} from 'lucide-react'
import { productService } from '../services/productService'
import { useAuthStore } from '../store/authStore'
import { Button, LoadingSpinner, StatusBadge, QRScanner } from '../components/common'

export default function VerifyPage() {
  const { productId: paramProductId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  // Support both route param /verify/123 and query param /verify?id=123
  const initialProductId = paramProductId || searchParams.get('id') || ''
  const { isAuthenticated, user } = useAuthStore()
  
  // State
  const [productId, setProductId] = useState(initialProductId)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [pointsEarned, setPointsEarned] = useState(null)
  const [showScanner, setShowScanner] = useState(false)

  // Auto-verify if ID is in URL
  useEffect(() => {
    if (initialProductId) {
      handleVerify()
    }
  }, [])

  // Handle verification
  const handleVerify = async (e) => {
    e?.preventDefault()
    verifyProductById(productId)
  }

  // Verify product by ID (used by form and scanner)
  const verifyProductById = async (id) => {
    if (!id?.trim()) {
      setError('Please enter a product ID')
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)
    setPointsEarned(null)

    try {
      const data = await productService.verifyProduct(id.trim())
      setResult(data)
      // Check if points were earned (only for authenticated users)
      if (data.rewards) {
        setPointsEarned(data.rewards)
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Product not found. Please check the ID and try again.')
      } else {
        setError(err.response?.data?.error || 'Verification failed')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="text-primary-600" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Verify Product Authenticity
          </h1>
          <p className="text-gray-500 max-w-md mx-auto">
            Enter a product ID or scan a QR code to verify its authenticity and view its complete journey.
          </p>
        </motion.div>

        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6"
        >
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  placeholder="Enter Product ID (e.g., PRD-XXXXX)"
                  className="w-full pl-12 pr-4 py-3 text-lg border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono placeholder-gray-400"
                />
              </div>
              <Button
                type="submit"
                isLoading={isLoading}
                leftIcon={!isLoading && <Shield size={20} />}
                className="px-6"
              >
                Verify
              </Button>
            </div>

            {/* QR Scanner Button */}
            <div className="flex items-center gap-4">
              <div className="flex-1 border-t border-gray-200" />
              <span className="text-gray-400 text-sm">or</span>
              <div className="flex-1 border-t border-gray-200" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={() => setShowScanner(true)}
                leftIcon={<Camera size={20} />}
              >
                Scan QR Code
              </Button>
              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={() => setShowScanner(true)}
                leftIcon={<Barcode size={20} />}
              >
                Scan Barcode
              </Button>
            </div>
          </form>
        </motion.div>

        {/* Error State */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3"
            >
              <ShieldX className="text-red-500 flex-shrink-0" size={24} />
              <div>
                <h3 className="font-medium text-red-800">Verification Failed</h3>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl border border-gray-200 p-8 text-center"
          >
            <LoadingSpinner size="lg" text="Verifying product..." />
          </motion.div>
        )}

        {/* Verification Result */}
        <AnimatePresence>
          {result && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Verification Status */}
              <div className={`rounded-xl p-6 flex items-center gap-4 ${
                result.verified 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-yellow-50 border border-yellow-200'
              }`}>
                {result.verified ? (
                  <ShieldCheck className="text-green-600" size={48} />
                ) : (
                  <AlertCircle className="text-yellow-600" size={48} />
                )}
                <div>
                  <h2 className={`text-xl font-bold ${
                    result.verified ? 'text-green-800' : 'text-yellow-800'
                  }`}>
                    {result.verified ? 'Authentic Product' : 'Verification Pending'}
                  </h2>
                  <p className={`text-sm ${
                    result.verified ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {result.verified 
                      ? 'This product has been verified on the blockchain.'
                      : 'Blockchain verification is still processing.'}
                  </p>
                </div>
              </div>

              {/* Points Earned Notification (for logged-in users) */}
              {pointsEarned && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <Star className="text-white" size={24} />
                    </div>
                    <div>
                      <p className="font-semibold text-purple-900">
                        +{pointsEarned.points_earned} Points Earned!
                      </p>
                      <p className="text-sm text-purple-600">
                        Total balance: {pointsEarned.total_points} points • {pointsEarned.tier} tier
                      </p>
                    </div>
                  </div>
                  <Link to="/rewards">
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                      <Gift size={16} className="mr-1" />
                      View Rewards
                    </Button>
                  </Link>
                </motion.div>
              )}

              {/* Sign up prompt for anonymous users */}
              {!isAuthenticated && result.access_level === 'basic' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Gift className="text-blue-600" size={20} />
                      </div>
                      <div>
                        <p className="font-medium text-blue-900">
                          Want full verification details & earn rewards?
                        </p>
                        <p className="text-sm text-blue-600">
                          Create an account to see product journey, earn points, and convert to crypto!
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link to="/login">
                        <Button variant="outline" size="sm">
                          <LogIn size={16} className="mr-1" />
                          Login
                        </Button>
                      </Link>
                      <Link to="/register">
                        <Button size="sm">
                          Sign Up Free
                        </Button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Product Details */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Package size={20} />
                    Product Information
                  </h3>
                </div>
                
                <div className="p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <span className="text-sm text-gray-500">Product Name</span>
                      <p className="font-medium text-gray-900 text-lg">{result.product?.name}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Product ID</span>
                      <p className="font-mono text-gray-900">{result.product?.product_id}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Manufacturer</span>
                      <p className="font-medium text-gray-900">
                        {result.product?.manufacturer?.company_name || result.product?.manufacturer?.name}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Origin</span>
                      <p className="font-medium text-gray-900 flex items-center gap-1">
                        <MapPin size={16} className="text-gray-400" />
                        {result.product?.origin || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Manufacturing Date</span>
                      <p className="font-medium text-gray-900">
                        {formatDate(result.product?.manufacturing_date)}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Status</span>
                      <StatusBadge status={result.product?.status} />
                    </div>
                  </div>

                  {result.product?.description && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <span className="text-sm text-gray-500">Description</span>
                      <p className="text-gray-700 mt-1">{result.product?.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Blockchain Info */}
              {result.blockchain && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Shield size={20} />
                      Blockchain Verification
                    </h3>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-500">Network</span>
                        <p className="font-medium text-gray-900">{result.blockchain?.network || 'Ethereum Sepolia'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Verification Status</span>
                        <p className="font-medium text-green-600 flex items-center gap-1">
                          <CheckCircle size={16} />
                          {result.blockchain?.verified ? 'Verified' : 'Pending'}
                        </p>
                      </div>
                      {result.blockchain?.hash && (
                        <div className="md:col-span-2">
                          <span className="text-sm text-gray-500">Transaction Hash</span>
                          <p className="font-mono text-sm text-gray-900 break-all bg-gray-50 p-2 rounded mt-1">
                            {result.blockchain.hash}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Product Journey */}
              {result.journey && result.journey.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Clock size={20} />
                      Product Journey ({result.journey.length} events)
                    </h3>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-4">
                      {result.journey.map((event, index) => (
                        <div 
                          key={index}
                          className="flex gap-4"
                        >
                          {/* Timeline indicator */}
                          <div className="flex flex-col items-center">
                            <div className={`w-3 h-3 rounded-full ${
                              index === 0 ? 'bg-primary-600' : 'bg-gray-300'
                            }`} />
                            {index < result.journey.length - 1 && (
                              <div className="w-0.5 h-full bg-gray-200 my-1" />
                            )}
                          </div>
                          
                          {/* Event details */}
                          <div className="flex-1 pb-4">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-gray-900 capitalize">
                                {event.action || 'Transfer'}
                              </span>
                              <span className="text-sm text-gray-500">
                                {formatDate(event.timestamp)}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              {event.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin size={14} />
                                  {event.location}
                                </span>
                              )}
                              {event.handler && (
                                <span className="flex items-center gap-1">
                                  <Building size={14} />
                                  {event.handler}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Verify Another */}
              <div className="text-center">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setResult(null)
                    setProductId('')
                    setPointsEarned(null)
                  }}
                  leftIcon={<RefreshCw size={18} />}
                >
                  Verify Another Product
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* QR/Barcode Scanner Modal */}
        <QRScanner
          isOpen={showScanner}
          onClose={() => setShowScanner(false)}
          onScan={(scannedId) => {
            setProductId(scannedId)
            setShowScanner(false)
            // Directly verify with scanned ID
            verifyProductById(scannedId)
          }}
        />
      </div>
    </div>
  )
}
