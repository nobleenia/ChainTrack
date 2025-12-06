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

import { useState, useEffect, useCallback } from 'react'
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
  AlertTriangle,
  ExternalLink,
  Truck,
  Search,
  UserCheck,
  X,
  Eye
} from 'lucide-react'
import { productService, transferService, userService } from '../services/productService'
import { shipmentApi } from '../services/shipmentApi'
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
  const [activeShipment, setActiveShipment] = useState(null)
  const [recentlyDelivered, setRecentlyDelivered] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [transferError, setTransferError] = useState(null)  // Separate error for transfer operations
  const [copiedHash, setCopiedHash] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [transferData, setTransferData] = useState({
    recipient_name: '',
    recipient_address: '',
    recipient_type: 'store',
    recipient_email: '',
    recipient_phone: '',
    transfer_type: 'shipped',
    location: '',
    notes: ''
  })
  const [isTransferring, setIsTransferring] = useState(false)
  const [claimUrl, setClaimUrl] = useState(null) // Store claim URL after successful transfer

  // User search state for transfer
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [userSearchResults, setUserSearchResults] = useState([])
  const [isSearchingUsers, setIsSearchingUsers] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showUserSearch, setShowUserSearch] = useState(false)

  // Fetch product data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const [productData, transfersData, shipmentsData] = await Promise.all([
          productService.getProduct(productId),
          transferService.getProductTransfers(productId).catch(() => ({ transfers: [] })),
          shipmentApi.getProductShipments(productId).catch(() => ({ has_active_shipment: false, active_shipments: [] }))
        ])
        
        setProduct(productData.product)
        setTransfers(transfersData.transfers || [])
        
        // Set active shipment info
        if (shipmentsData.has_active_shipment && shipmentsData.active_shipments?.length > 0) {
          setActiveShipment(shipmentsData.active_shipments[0])
        } else {
          setActiveShipment(null)
        }
        
        // Set recently delivered shipment for transfer prompt
        setRecentlyDelivered(shipmentsData.recently_delivered || null)
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
  // Use current_holder_id if set, otherwise fall back to manufacturer (for products never transferred)
  const isOwner = product?.current_holder_id 
    ? product.current_holder_id === user?.id
    : product?.manufacturer?.id === user?.id

  // Check if current user is the original manufacturer
  const isManufacturer = product?.manufacturer?.id === user?.id
  
  // Check if manufacturer is viewing their transferred product (read-only mode)
  const isManufacturerViewingTransferred = isManufacturer && !isOwner

  // Check user role for permission controls
  const isConsumer = user?.role === 'consumer'
  
  // Check if product has a pending transfer
  const hasPendingTransfer = product?.has_pending_transfer || product?.status === 'pending_transfer'
  
  // Consumers cannot initiate transfers - they are end recipients
  const canTransfer = isOwner && !hasPendingTransfer && !isConsumer

  // Handle transfer submission
  const handleTransfer = async (e) => {
    e.preventDefault()
    setIsTransferring(true)
    setTransferError(null)
    setClaimUrl(null)
    
    try {
      // Build transfer payload
      const payload = {
        product_id: product.product_id,
        ...transferData
      }
      
      // Include to_user_id if a registered user was selected
      if (selectedUser) {
        payload.to_user_id = selectedUser.id
      }
      
      const response = await transferService.createTransfer(payload)
      
      // Check if there's a claim URL for external recipients
      // claim_url is at the root of the response, not inside transfer
      if (response.claim_url) {
        setClaimUrl(response.claim_url)
        // Don't close modal yet - show the claim link
      } else {
        // No claim URL - close modal
        setShowTransferModal(false)
      }
      
      // Reset form for next time
      setTransferData({ 
        recipient_name: '', 
        recipient_address: '', 
        recipient_type: 'store',
        recipient_email: '',
        recipient_phone: '',
        transfer_type: 'shipped', 
        location: '', 
        notes: '' 
      })
      setSelectedUser(null)
      setUserSearchQuery('')
      setUserSearchResults([])
      
      // Refresh transfers and product (don't let refresh errors affect the success)
      try {
        const [updatedTransfers, updatedProduct] = await Promise.all([
          transferService.getProductTransfers(productId),
          productService.getProduct(productId)
        ])
        setTransfers(updatedTransfers.transfers || [])
        setProduct(updatedProduct.product)
      } catch (refreshErr) {
        console.log('Transfer successful but failed to refresh data:', refreshErr)
        // Don't show error - transfer was successful
      }
    } catch (err) {
      setTransferError(err.response?.data?.error || 'Failed to create transfer')
    } finally {
      setIsTransferring(false)
    }
  }

  // Close transfer modal and reset claim URL
  const closeTransferModal = () => {
    setShowTransferModal(false)
    setClaimUrl(null)
    setTransferError(null)
    setSelectedUser(null)
    setUserSearchQuery('')
    setUserSearchResults([])
    setShowUserSearch(false)
  }

  // Copy claim URL to clipboard
  const copyClaimUrl = () => {
    if (claimUrl) {
      navigator.clipboard.writeText(claimUrl)
    }
  }

  // Search for registered users
  const searchUsers = async (query) => {
    if (query.length < 2) {
      setUserSearchResults([])
      return
    }
    
    setIsSearchingUsers(true)
    try {
      const data = await userService.searchUsers(query, { limit: 8 })
      setUserSearchResults(data.users || [])
    } catch (err) {
      console.error('User search failed:', err)
      setUserSearchResults([])
    } finally {
      setIsSearchingUsers(false)
    }
  }

  // Debounced user search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (userSearchQuery && showUserSearch) {
        searchUsers(userSearchQuery)
      }
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [userSearchQuery, showUserSearch])

  // Select a user from search results
  const selectUser = (selectedUserData) => {
    setSelectedUser(selectedUserData)
    setTransferData(prev => ({
      ...prev,
      to_user_id: selectedUserData.id,
      recipient_name: selectedUserData.company_name || selectedUserData.name,
      recipient_type: selectedUserData.role === 'retailer' ? 'retailer' : 
                     selectedUserData.role === 'distributor' ? 'distributor' :
                     selectedUserData.role === 'consumer' ? 'consumer' : 'store'
    }))
    setUserSearchQuery('')
    setUserSearchResults([])
    setShowUserSearch(false)
  }

  // Clear selected user
  const clearSelectedUser = () => {
    setSelectedUser(null)
    setTransferData(prev => ({
      ...prev,
      to_user_id: undefined,
      recipient_name: '',
    }))
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="xl" text="Loading product..." />
      </div>
    )
  }

  // Error state (only for product not found)
  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {error === 'Product not found' ? 'Product Not Found' : 'Error Loading Product'}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          {error}
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
        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <ArrowLeft size={20} />
        Back to Products
      </Link>

      {/* Product Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* QR Code */}
          <div className="flex-shrink-0">
            <div className="w-48 h-48 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
              {product?.qr_code_url ? (
                <img 
                  src={product.qr_code_url} 
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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{product?.name}</h1>
                <p className="text-gray-500 dark:text-gray-400 font-mono">{product?.product_id}</p>
              </div>
              <StatusBadge status={product?.status} size="lg" />
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <Package size={18} className="text-gray-400 dark:text-gray-500" />
                <span className="capitalize">{product?.category || 'General'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <MapPin size={18} className="text-gray-400 dark:text-gray-500" />
                <span>{product?.origin || 'Unknown'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <Calendar size={18} className="text-gray-400 dark:text-gray-500" />
                <span>Manufactured: {formatDate(product?.manufacturing_date)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <Building size={18} className="text-gray-400 dark:text-gray-500" />
                <span>{product?.manufacturer?.company_name || product?.manufacturer?.name}</span>
              </div>
            </div>

            {product?.description && (
              <p className="text-gray-600 dark:text-gray-300 mb-4">{product.description}</p>
            )}

            {/* Manufacturer Viewing Transferred Product Notice */}
            {isManufacturerViewingTransferred && (
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <Eye className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="font-medium text-blue-800 dark:text-blue-200">View Only</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      This product was manufactured by you but is now owned by{' '}
                      <span className="font-medium">
                        {product?.current_holder?.name || product?.current_holder?.company_name || 'another party'}
                      </span>. 
                      You can view the product journey and verify authenticity, but cannot make changes.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Pending Transfer Warning */}
            {isOwner && hasPendingTransfer && (
              <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Pending Transfer</h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      This product has a pending transfer awaiting acceptance. You cannot initiate a new transfer until the pending one is accepted, rejected, or cancelled.
                    </p>
                    <Link 
                      to="/transfers?tab=sent"
                      className="inline-flex items-center gap-1 text-sm font-medium text-yellow-700 dark:text-yellow-300 hover:text-yellow-800 dark:hover:text-yellow-200 mt-2"
                    >
                      View pending transfers <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <Link to={`/verify?id=${product?.product_id}`}>
                <Button variant="outline" leftIcon={<Shield size={18} />}>
                  Verify Product
                </Button>
              </Link>
              
              {/* Transfer button - only for non-consumer owners */}
              {isOwner && !isConsumer && (
                <Button 
                  onClick={() => setShowTransferModal(true)}
                  leftIcon={<Send size={18} />}
                  disabled={hasPendingTransfer || !!activeShipment}
                  title={
                    hasPendingTransfer 
                      ? 'Product has a pending transfer' 
                      : activeShipment 
                        ? `Product is being shipped (${activeShipment.shipment_id})`
                        : 'Transfer this product'
                  }
                >
                  Transfer Product
                </Button>
              )}
              
              {/* Ship button - available to all owners, disabled if active shipment */}
              {isOwner && (
                <Button 
                  variant="secondary"
                  onClick={() => navigate(`/dashboard/shipments/create?productId=${product?.product_id}&productName=${encodeURIComponent(product?.name || '')}`)}
                  leftIcon={<Truck size={18} />}
                  disabled={!!activeShipment}
                  title={activeShipment ? `Product is already being shipped (${activeShipment.shipment_id})` : 'Ship this product'}
                >
                  {activeShipment ? 'Shipment in Progress' : 'Ship Product'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Active Shipment Banner */}
      {activeShipment && isOwner && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                <Truck className="text-blue-600 dark:text-blue-400" size={20} />
              </div>
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  This product is currently being shipped
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Shipment {activeShipment.shipment_id} • Status: {activeShipment.status?.replace('_', ' ')}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/dashboard/shipments/${activeShipment.shipment_id}`)}
            >
              View Shipment
            </Button>
          </div>
        </motion.div>
      )}

      {/* Transfer Prompt Banner - show when shipment was recently delivered */}
      {recentlyDelivered && isOwner && !isConsumer && !hasPendingTransfer && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-800 rounded-lg">
                <Send className="text-amber-600 dark:text-amber-400" size={20} />
              </div>
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-100">
                  Shipment delivered - Ready for ownership transfer
                </p>
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  {recentlyDelivered.shipment_id} was delivered to {recentlyDelivered.receiver?.name}. 
                  Would you like to transfer ownership?
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => setShowTransferModal(true)}
              leftIcon={<Send size={16} />}
            >
              Transfer Now
            </Button>
          </div>
        </motion.div>
      )}

      {/* Blockchain Info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
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
              <span className="text-sm text-gray-500 dark:text-gray-400">Transaction Hash</span>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg text-sm font-mono text-gray-700 dark:text-gray-300 truncate">
                  {product.blockchain_hash}
                </code>
                <button
                  onClick={copyHash}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
                  title="Copy hash"
                >
                  {copiedHash ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                </button>
                <a
                  href={`https://sepolia.etherscan.io/tx/${product.blockchain_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
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
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
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
                  <div className="w-0.5 flex-1 bg-gray-200 dark:bg-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 dark:text-white">Manufactured</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(product?.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1 mt-1">
                    <Building size={14} />
                    {product?.manufacturer?.company_name || product?.manufacturer?.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1">
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
                      <div className="w-0.5 flex-1 bg-gray-200 dark:bg-gray-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        Transferred
                        <StatusBadge status={transfer.status} size="sm" />
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(transfer.created_at)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      <span className="flex items-center gap-1">
                        <User size={14} />
                        From: {transfer.from_user?.company_name || transfer.from_user?.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <ArrowRight size={14} />
                        To: {transfer.recipient?.name || transfer.to_user?.company_name || transfer.to_user?.name || 'External'}
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
            <Clock size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-gray-500 dark:text-gray-400">No transfers recorded yet</p>
          </div>
        )}
      </div>

      {/* Transfer Modal */}
      <Modal
        isOpen={showTransferModal}
        onClose={closeTransferModal}
        title={claimUrl ? "Transfer Initiated Successfully" : "Transfer Product"}
        size="lg"
      >
        {claimUrl ? (
          // Success state with claim URL
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Check className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="font-medium text-green-800 dark:text-green-200">Transfer Pending Acceptance</h4>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    The transfer has been initiated and is awaiting acceptance from the recipient. Share the claim link below with the recipient so they can accept the transfer.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Claim Link (share with recipient)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={claimUrl}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-mono text-gray-700 dark:text-gray-300"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={copyClaimUrl}
                  leftIcon={<Copy size={16} />}
                >
                  Copy
                </Button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                This link expires in 7 days. The recipient can use it to accept the transfer and take ownership.
              </p>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <p className="text-sm text-amber-800 dark:text-amber-200 flex items-start gap-2">
                <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Important:</strong> The product is now locked and cannot be transferred to anyone else until this transfer is accepted, rejected, or cancelled.
                </span>
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Link to="/transfers?tab=sent">
                <Button variant="outline">
                  View Pending Transfers
                </Button>
              </Link>
              <Button onClick={closeTransferModal}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          // Transfer form
          <form onSubmit={handleTransfer} className="space-y-4">
            {/* Transfer Error */}
            {transferError && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-3">
                <p className="text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
                  <AlertCircle size={16} />
                  {transferError}
                </p>
              </div>
            )}

            {/* Info Banner */}
            <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-700 rounded-lg p-3">
              <p className="text-sm text-sky-800 dark:text-sky-200">
                Transfer this product to another party. The recipient will need to accept the transfer before ownership changes. A claim link will be generated for external recipients.
              </p>
            </div>

            {/* Find Registered User Section */}
            <div className="border border-primary-200 dark:border-primary-800 rounded-lg p-4 bg-primary-50 dark:bg-primary-900/20">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-primary-800 dark:text-primary-200 flex items-center gap-2">
                  <Search size={16} />
                  Find Registered User
                </h4>
                {!showUserSearch && !selectedUser && (
                  <button
                    type="button"
                    onClick={() => setShowUserSearch(true)}
                    className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    Search by name or ID
                  </button>
                )}
              </div>

              {/* Selected User Display */}
              {selectedUser && (
                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border border-primary-200 dark:border-primary-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center">
                      <UserCheck className="text-primary-600 dark:text-primary-400" size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {selectedUser.company_name || selectedUser.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {selectedUser.user_id} • {selectedUser.role}
                        {selectedUser.is_verified && <span className="ml-1 text-green-600">✓ Verified</span>}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearSelectedUser}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}

              {/* User Search Input */}
              {showUserSearch && !selectedUser && (
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      placeholder="Search by company name, user name, or ID (e.g., MFR-ABC123)"
                      className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      autoFocus
                    />
                    {(userSearchQuery || isSearchingUsers) && (
                      <button
                        type="button"
                        onClick={() => {
                          setUserSearchQuery('')
                          setUserSearchResults([])
                          setShowUserSearch(false)
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>

                  {/* Search Results Dropdown */}
                  {(userSearchResults.length > 0 || isSearchingUsers) && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {isSearchingUsers ? (
                        <div className="p-4 text-center text-gray-500">
                          <LoadingSpinner size="sm" />
                        </div>
                      ) : (
                        userSearchResults.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => selectUser(u)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                          >
                            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center">
                              <User size={16} className="text-gray-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                {u.company_name || u.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {u.user_id} • {u.role}
                                {u.is_verified && <span className="ml-1 text-green-600">✓</span>}
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                      {!isSearchingUsers && userSearchQuery.length >= 2 && userSearchResults.length === 0 && (
                        <div className="p-4 text-center text-gray-500 text-sm">
                          No users found. They may not be registered yet.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {!showUserSearch && !selectedUser && (
                <p className="text-xs text-primary-600 dark:text-primary-400">
                  Search for registered users to transfer directly to their account, or enter recipient details manually below for external recipients.
                </p>
              )}
            </div>

            {/* Recipient Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Recipient Type *
              </label>
              <select
                required
                value={transferData.recipient_type}
                onChange={(e) => setTransferData(prev => ({ ...prev, recipient_type: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                disabled={!!selectedUser}
              >
                <option value="store">Store / Retail Shop</option>
                <option value="warehouse">Warehouse</option>
                <option value="distributor">Distributor</option>
                <option value="retailer">Retailer</option>
                <option value="consumer">End Consumer</option>
              </select>
            </div>

            {/* Recipient Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Recipient Name *
              </label>
              <input
                type="text"
                required
                value={transferData.recipient_name}
                onChange={(e) => setTransferData(prev => ({ ...prev, recipient_name: e.target.value }))}
                placeholder="e.g., SuperMart Lagos, ABC Distributors"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                disabled={!!selectedUser}
              />
            </div>

            {/* Recipient Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Recipient Address *
              </label>
              <input
                type="text"
                required
                value={transferData.recipient_address}
                onChange={(e) => setTransferData(prev => ({ ...prev, recipient_address: e.target.value }))}
                placeholder="e.g., 123 Main Street, Lagos, Nigeria"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* External Recipient Contact (Optional) */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                External Recipient Contact (Optional)
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Provide email or phone if the recipient is not a registered user. They will receive a claim link.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={transferData.recipient_email}
                    onChange={(e) => setTransferData(prev => ({ ...prev, recipient_email: e.target.value }))}
                    placeholder="recipient@example.com"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={transferData.recipient_phone}
                    onChange={(e) => setTransferData(prev => ({ ...prev, recipient_phone: e.target.value }))}
                    placeholder="+234 800 123 4567"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Transfer Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Transfer Type *
                </label>
                <select
                  required
                  value={transferData.transfer_type}
                  onChange={(e) => setTransferData(prev => ({ ...prev, transfer_type: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="received">Received</option>
                  <option value="returned">Returned</option>
                </select>
              </div>
              
              {/* Current Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Current Location *
                </label>
                <input
                  type="text"
                  required
                  value={transferData.location}
                  onChange={(e) => setTransferData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g., Lagos, Nigeria"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
            
            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes (Optional)
              </label>
              <textarea
                value={transferData.notes}
                onChange={(e) => setTransferData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add any notes about this transfer..."
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Blockchain Notice */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3">
              <p className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
                <Shield size={16} />
                This transfer will be permanently recorded on the Ethereum blockchain for authenticity verification.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={closeTransferModal}
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
        )}
      </Modal>
    </div>
  )
}
