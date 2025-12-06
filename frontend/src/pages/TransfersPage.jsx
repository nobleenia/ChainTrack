/**
 * TransfersPage
 * 
 * Displays custody transfer history with proper acceptance workflow.
 * Users can accept/reject incoming transfers before ownership changes.
 */

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowRightLeft, 
  Clock, 
  CheckCircle, 
  XCircle,
  Filter,
  RefreshCw,
  Inbox,
  Send,
  AlertTriangle,
  AlertCircle,
  Copy,
  Check,
  Link as LinkIcon
} from 'lucide-react'
import { transferService } from '../services/productService'
import { useAuthStore } from '../store/authStore'
import TransferCard, { TransferCardSkeleton } from '../components/transfers/TransferCard'
import { Button, Modal, LoadingSpinner } from '../components/common'

// Tab options
const tabs = [
  { id: 'pending', label: 'Pending', icon: Clock, badge: true },
  { id: 'incoming', label: 'Received', icon: Inbox },
  { id: 'outgoing', label: 'Sent', icon: Send },
  { id: 'all', label: 'All', icon: ArrowRightLeft },
]

// Status filter options
const statusFilters = [
  { value: '', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default function TransfersPage() {
  // URL params for tab selection
  const [searchParams, setSearchParams] = useSearchParams()
  const tabFromUrl = searchParams.get('tab')
  
  // State
  const [transfers, setTransfers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'pending')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedTransfer, setSelectedTransfer] = useState(null)
  const [showAcceptModal, setShowAcceptModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showClaimLinkModal, setShowClaimLinkModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [copiedClaimLink, setCopiedClaimLink] = useState(false)

  const { user } = useAuthStore()

  // Update URL when tab changes
  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    setSearchParams({ tab: tabId })
  }

  // Fetch transfers
  const fetchTransfers = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Map frontend tab to backend direction param
      const directionMap = {
        'pending': 'pending',
        'incoming': 'received',
        'outgoing': 'sent',
        'all': 'all'
      }
      
      const params = {
        direction: directionMap[activeTab] || 'all',
      }
      
      // Add status filter if selected
      if (statusFilter) {
        params.status = statusFilter
      }
      
      const data = await transferService.getTransfers(params)
      
      setTransfers(data.transfers || [])
      setPendingCount(data.pending_incoming || 0)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load transfers')
      setTransfers([])
    } finally {
      setIsLoading(false)
    }
  }, [activeTab, statusFilter])

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchTransfers()
  }, [fetchTransfers])

  // Handle accept transfer
  const handleAcceptTransfer = async () => {
    if (!selectedTransfer) return
    setIsProcessing(true)
    
    try {
      await transferService.acceptTransfer(selectedTransfer.id, true)
      setShowAcceptModal(false)
      setSelectedTransfer(null)
      fetchTransfers()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to accept transfer')
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle reject transfer
  const handleRejectTransfer = async () => {
    if (!selectedTransfer) return
    setIsProcessing(true)
    
    try {
      await transferService.rejectTransfer(selectedTransfer.id, rejectReason || null)
      setShowRejectModal(false)
      setSelectedTransfer(null)
      setRejectReason('')
      fetchTransfers()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reject transfer')
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle cancel transfer
  const handleCancelTransfer = async () => {
    if (!selectedTransfer) return
    setIsProcessing(true)
    
    try {
      await transferService.cancelTransfer(selectedTransfer.id, cancelReason || null)
      setShowCancelModal(false)
      setSelectedTransfer(null)
      setCancelReason('')
      fetchTransfers()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel transfer')
    } finally {
      setIsProcessing(false)
    }
  }

  // Open modals
  const openAcceptModal = (transfer) => {
    setSelectedTransfer(transfer)
    setShowAcceptModal(true)
  }

  const openRejectModal = (transfer) => {
    setSelectedTransfer(transfer)
    setShowRejectModal(true)
  }

  const openCancelModal = (transfer) => {
    setSelectedTransfer(transfer)
    setShowCancelModal(true)
  }

  const openClaimLinkModal = (transfer) => {
    setSelectedTransfer(transfer)
    setShowClaimLinkModal(true)
    setCopiedClaimLink(false)
  }

  // Copy claim link to clipboard
  const copyClaimLink = () => {
    if (selectedTransfer?.claim_url) {
      navigator.clipboard.writeText(selectedTransfer.claim_url)
      setCopiedClaimLink(true)
      setTimeout(() => setCopiedClaimLink(false), 2000)
    }
  }

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'accepted':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Transfers</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage ownership transfers for your products
          </p>
        </div>

        {pendingCount > 0 && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300 px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <AlertTriangle size={18} />
            <span className="font-medium">
              {pendingCount} transfer{pendingCount !== 1 ? 's' : ''} awaiting your response
            </span>
          </motion.div>
        )}
      </div>

      {/* Tabs & Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                  {tab.badge && pendingCount > 0 && (
                    <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-yellow-500 text-white">
                      {pendingCount}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 appearance-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                {statusFilters.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            
            <button
              onClick={fetchTransfers}
              disabled={isLoading}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg flex items-center gap-2"
        >
          <AlertCircle size={18} />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <XCircle size={18} />
          </button>
        </motion.div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <TransferCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && transfers.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
        >
          <ArrowRightLeft size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No transfers found</h3>
          <p className="text-gray-500 dark:text-gray-400">
            {activeTab === 'pending'
              ? "No pending transfers awaiting your response"
              : activeTab === 'incoming'
              ? "You haven't received any transfers yet"
              : activeTab === 'outgoing'
              ? "You haven't initiated any transfers"
              : 'No transfer records yet'}
          </p>
        </motion.div>
      )}

      {/* Transfers List */}
      {!isLoading && transfers.length > 0 && (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {transfers.map((transfer, index) => (
              <motion.div
                key={transfer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <TransferCard
                  transfer={transfer}
                  currentUserId={user?.id}
                  onAccept={() => openAcceptModal(transfer)}
                  onReject={() => openRejectModal(transfer)}
                  onCancel={() => openCancelModal(transfer)}
                  onShowClaimLink={() => openClaimLinkModal(transfer)}
                />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Accept Transfer Modal */}
      <Modal
        isOpen={showAcceptModal}
        onClose={() => !isProcessing && setShowAcceptModal(false)}
        title="Accept Transfer"
        size="md"
      >
        <div className="space-y-4">
          {/* Warning */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-yellow-600 dark:text-yellow-400 mt-0.5" size={20} />
              <div>
                <h4 className="font-medium text-yellow-800 dark:text-yellow-300">Irreversible Action</h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                  By accepting this transfer, you become the <strong>legal owner</strong> of this product. 
                  This action cannot be undone and will be permanently recorded on the blockchain.
                </p>
              </div>
            </div>
          </div>

          {/* Product Info */}
          {selectedTransfer?.product && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                {selectedTransfer.product.name}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Product ID: {selectedTransfer.product.product_id}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                From: {selectedTransfer.from_user?.name || 'Unknown'}
              </p>
            </div>
          )}

          <p className="text-gray-600 dark:text-gray-400">
            Do you confirm that you now have physical custody of this product and accept ownership?
          </p>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowAcceptModal(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="success"
              onClick={handleAcceptTransfer}
              isLoading={isProcessing}
              leftIcon={<CheckCircle size={18} />}
            >
              Accept Ownership
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject Transfer Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => !isProcessing && setShowRejectModal(false)}
        title="Reject Transfer"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to reject this transfer? The product will remain with the sender.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Reason for rejection (optional)
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Product not received, wrong item, damaged..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowRejectModal(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleRejectTransfer}
              isLoading={isProcessing}
              leftIcon={<XCircle size={18} />}
            >
              Reject Transfer
            </Button>
          </div>
        </div>
      </Modal>

      {/* Cancel Transfer Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => !isProcessing && setShowCancelModal(false)}
        title="Cancel Transfer"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to cancel this transfer? The product will become available for transfer again.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Reason for cancellation (optional)
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g., Change of plans, incorrect recipient..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowCancelModal(false)}
              disabled={isProcessing}
            >
              Keep Transfer
            </Button>
            <Button
              variant="danger"
              onClick={handleCancelTransfer}
              isLoading={isProcessing}
              leftIcon={<XCircle size={18} />}
            >
              Cancel Transfer
            </Button>
          </div>
        </div>
      </Modal>

      {/* Claim Link Modal */}
      <Modal
        isOpen={showClaimLinkModal}
        onClose={() => setShowClaimLinkModal(false)}
        title="Share Claim Link"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Share this link with the recipient so they can claim ownership of the product.
            The link expires in 7 days.
          </p>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={selectedTransfer?.claim_url || 'No claim link available'}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
            />
            <Button
              variant="secondary"
              onClick={copyClaimLink}
              leftIcon={copiedClaimLink ? <Check size={18} /> : <Copy size={18} />}
            >
              {copiedClaimLink ? 'Copied!' : 'Copy'}
            </Button>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
            <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <LinkIcon size={16} />
              The recipient can use this link to claim the product without needing an account.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  )
}
