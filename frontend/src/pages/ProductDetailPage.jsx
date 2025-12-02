/**
 * ProductDetailPage
 * 
 * Shows detailed product information including:
 * - Product metadata
 * - QR code for verification
 * - Complete journey/transfer history
 * - Blockchain verification status
 * - Transfer initiation (for product owners)
 */

import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Package, 
  MapPin, 
  Calendar, 
  QrCode, 
  ArrowLeft,
  ArrowRight,
  Shield,
  ShieldCheck,
  Clock,
  Building,
  User,
  Send,
  Download,
  Copy,
  Check,
  AlertCircle,
  ExternalLink
} from 'lucide-react'
import { productService, transferService } from '../services/productService'
import { useAuthStore } from '../store/authStore'
import { Button, LoadingSpinner, StatusBadge, Modal } from '../components/common'
import TransferCard from '../components/transfers/TransferCard'

export default function ProductDetailPage() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  
  // State
  const [product, setProduct] = useState(null)
  const [transfers, setTransfers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copiedHash, setCopiedHash] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [transferData, setTransferData] = useState({
    to_user_id: '',
    location: '',
    notes: ''
  })
  const [isTransferring, setIsTransferring] = useState(false)

  // Fetch product data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const [productData, transfersData] = await Promise.all([
          productService.getProduct(productId),
          transferService.getProductTransfers(productId).catch(() => ({ transfers: [] }))
        ])
        
        setProduct(productData.product)
        setTransfers(transfersData.transfers || [])
      } catch (err) {
        if (err.response?.status === 404) {
          setError('Product not found')
        } else {
          setError(err.response?.data?.error || 'Failed to load product')
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [productId])

  // Copy hash to clipboard
  const copyHash = () => {
    if (product?.blockchain_hash) {
      navigator.clipboard.writeText(product.blockchain_hash)
      setCopiedHash(true)
      setTimeout(() => setCopiedHash(false), 2000)
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

  // Check if current user owns this product
  const isOwner = product?.manufacturer?.id === user?.id || 
    (transfers.length > 0 && transfers[transfers.length - 1]?.to_user?.id === user?.id)

  // Handle transfer submission
  const handleTransfer = async (e) => {
    e.preventDefault()
    setIsTransferring(true)
    
    try {
      await transferService.createTransfer({
        product_id: product.id,
        ...transferData
      })
      setShowTransferModal(false)
      setTransferData({ to_user_id: '', location: '', notes: '' })
      // Refresh transfers
      const updatedTransfers = await transferService.getProductTransfers(productId)
      setTransfers(updatedTransfers.transfers || [])
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create transfer')
    } finally {
      setIsTransferring(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="xl" text="Loading product..." />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">{error}</h2>
        <p className="text-gray-500 mb-6">
          The product you're looking for might have been removed or doesn't exist.
        </p>
        <Link to="/products">
          <Button variant="secondary" leftIcon={<ArrowLeft size={18} />}>
            Back to Products
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link 
        to="/products" 
        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft size={20} />
        Back to Products
      </Link>

      {/* Product Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* QR Code */}
          <div className="flex-shrink-0">
            <div className="w-48 h-48 bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
              {product?.qr_code ? (
                <img 
                  src={`data:image/png;base64,${product.qr_code}`} 
                  alt="Product QR Code"
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <div className="text-center p-4">
                  <QrCode size={48} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-xs text-gray-500">QR Code</p>
                </div>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <Button variant="secondary" size="sm" fullWidth leftIcon={<Download size={16} />}>
                Download
              </Button>
            </div>
          </div>

          {/* Product Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{product?.name}</h1>
                <p className="text-gray-500 font-mono">{product?.product_id}</p>
              </div>
              <StatusBadge status={product?.status} size="lg" />
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Package size={18} className="text-gray-400" />
                <span className="capitalize">{product?.category || 'General'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin size={18} className="text-gray-400" />
                <span>{product?.origin || 'Unknown'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar size={18} className="text-gray-400" />
                <span>Manufactured: {formatDate(product?.manufacturing_date)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Building size={18} className="text-gray-400" />
                <span>{product?.manufacturer?.company_name || product?.manufacturer?.name}</span>
              </div>
            </div>

            {product?.description && (
              <p className="text-gray-600 mb-4">{product.description}</p>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Link to={`/verify?id=${product?.product_id}`}>
                <Button variant="outline" leftIcon={<Shield size={18} />}>
                  Verify Product
                </Button>
              </Link>
              {isOwner && (
                <Button 
                  onClick={() => setShowTransferModal(true)}
                  leftIcon={<Send size={18} />}
                >
                  Transfer Product
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Blockchain Info */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="text-primary-600" size={24} />
          Blockchain Verification
        </h2>

        {product?.blockchain_hash ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <ShieldCheck size={20} />
              <span className="font-medium">Verified on Ethereum Sepolia</span>
            </div>
            
            <div>
              <span className="text-sm text-gray-500">Transaction Hash</span>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 bg-gray-100 px-3 py-2 rounded-lg text-sm font-mono text-gray-700 truncate">
                  {product.blockchain_hash}
                </code>
                <button
                  onClick={copyHash}
                  className="p-2 text-gray-400 hover:text-gray-600 transition"
                  title="Copy hash"
                >
                  {copiedHash ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                </button>
                <a
                  href={`https://sepolia.etherscan.io/tx/${product.blockchain_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-400 hover:text-gray-600 transition"
                  title="View on Etherscan"
                >
                  <ExternalLink size={18} />
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-yellow-600">
            <Clock size={20} />
            <span>Blockchain verification pending</span>
          </div>
        )}
      </div>

      {/* Product Journey / Transfer History */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="text-primary-600" size={24} />
          Product Journey
        </h2>

        {transfers.length > 0 ? (
          <div className="space-y-4">
            {/* Timeline */}
            <div className="relative">
              {/* Manufacturing Event */}
              <div className="flex gap-4 pb-6">
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 rounded-full bg-primary-600" />
                  <div className="w-0.5 flex-1 bg-gray-200" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">Manufactured</span>
                    <span className="text-sm text-gray-500">{formatDate(product?.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                    <Building size={14} />
                    {product?.manufacturer?.company_name || product?.manufacturer?.name}
                  </p>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <MapPin size={14} />
                    {product?.origin || 'Unknown location'}
                  </p>
                </div>
              </div>

              {/* Transfer Events */}
              {transfers.map((transfer, index) => (
                <motion.div 
                  key={transfer.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-4 pb-6"
                >
                  <div className="flex flex-col items-center">
                    <div className={`w-4 h-4 rounded-full ${
                      transfer.status === 'confirmed' ? 'bg-green-500' : 
                      transfer.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-400'
                    }`} />
                    {index < transfers.length - 1 && (
                      <div className="w-0.5 flex-1 bg-gray-200" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 flex items-center gap-2">
                        Transferred
                        <StatusBadge status={transfer.status} size="sm" />
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDate(transfer.created_at)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      <span className="flex items-center gap-1">
                        <User size={14} />
                        From: {transfer.from_user?.company_name || transfer.from_user?.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <ArrowRight size={14} />
                        To: {transfer.to_user?.company_name || transfer.to_user?.name}
                      </span>
                      {transfer.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={14} />
                          {transfer.location}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Clock size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500">No transfers recorded yet</p>
          </div>
        )}
      </div>

      {/* Transfer Modal */}
      <Modal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        title="Transfer Product"
        size="md"
      >
        <form onSubmit={handleTransfer} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recipient User ID *
            </label>
            <input
              type="text"
              required
              value={transferData.to_user_id}
              onChange={(e) => setTransferData(prev => ({ ...prev, to_user_id: e.target.value }))}
              placeholder="Enter recipient's user ID"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Location
            </label>
            <input
              type="text"
              value={transferData.location}
              onChange={(e) => setTransferData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="e.g., Warehouse A, New York"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={transferData.notes}
              onChange={(e) => setTransferData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add any notes about this transfer..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowTransferModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isTransferring}
              leftIcon={<Send size={18} />}
            >
              Initiate Transfer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
