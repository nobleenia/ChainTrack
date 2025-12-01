/**
 * VerifyPage
 * 
 * Public page to verify product authenticity.
 * Supports QR code scanning and manual product ID entry.
 */

import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
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
  ArrowRight,
  RefreshCw,
  Camera,
  AlertCircle,
  CheckCircle,
  Clock,
  Package
} from 'lucide-react'
import { productService } from '../services/productService'
import { Button, LoadingSpinner, StatusBadge } from '../components/common'

export default function VerifyPage() {
  const [searchParams] = useSearchParams()
  const initialProductId = searchParams.get('id') || ''
  
  // State
  const [productId, setProductId] = useState(initialProductId)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
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
    if (!productId.trim()) {
      setError('Please enter a product ID')
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const data = await productService.verifyProduct(productId.trim())
      setResult(data)
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
                  className="w-full pl-12 pr-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono"
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

            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={() => setShowScanner(true)}
              leftIcon={<Camera size={20} />}
            >
              Scan QR Code
            </Button>
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
                  }}
                  leftIcon={<RefreshCw size={18} />}
                >
                  Verify Another Product
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* QR Scanner Modal Placeholder */}
        {showScanner && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-xl p-6 max-w-md w-full text-center"
            >
              <QrCode size={64} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">QR Scanner</h3>
              <p className="text-gray-500 mb-4">
                Camera-based QR scanning requires additional setup.
                For now, please enter the product ID manually.
              </p>
              <Button onClick={() => setShowScanner(false)}>
                Close
              </Button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}
