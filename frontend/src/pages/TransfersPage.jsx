/**
 * TransfersPage
 * 
 * Displays custody transfer history and pending transfers.
 * Users can confirm/reject incoming transfers.
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowRightLeft, 
  Clock, 
  CheckCircle, 
  XCircle,
  Filter,
  RefreshCw,
  Inbox,
  Send
} from 'lucide-react'
import { transferService } from '../services/productService'
import { useAuthStore } from '../store/authStore'
import TransferCard, { TransferCardSkeleton } from '../components/transfers/TransferCard'
import { Button, Modal, LoadingSpinner } from '../components/common'

// Tab options
const tabs = [
  { id: 'incoming', label: 'Incoming', icon: Inbox },
  { id: 'outgoing', label: 'Outgoing', icon: Send },
  { id: 'all', label: 'All Transfers', icon: ArrowRightLeft },
]

// Status filter options
const statusFilters = [
  { value: '', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'rejected', label: 'Rejected' },
]

export default function TransfersPage() {
  // State
  const [transfers, setTransfers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('incoming')
  const [statusFilter, setStatusFilter] = useState('')
  const [confirmingId, setConfirmingId] = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [actionType, setActionType] = useState(null) // 'confirm' | 'reject'

  const { user } = useAuthStore()

  // Fetch transfers
  const fetchTransfers = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Map frontend tab to backend direction param
      const directionMap = {
        'incoming': 'received',
        'outgoing': 'sent',
        'all': 'all'
      }
      
      const params = {
        direction: directionMap[activeTab] || 'all',
      }
      
      const data = await transferService.getTransfers(params)
      
      // Client-side status filtering
      // Backend uses is_confirmed boolean, not status string
      let filteredTransfers = data.transfers || []
      if (statusFilter) {
        filteredTransfers = filteredTransfers.filter(t => {
          if (statusFilter === 'confirmed') {
            return t.is_confirmed === true
          } else if (statusFilter === 'pending') {
            return t.is_confirmed === false
          } else if (statusFilter === 'rejected') {
            return t.status === 'rejected' // if rejection is ever implemented
          }
          return true
        })
      }
      
      setTransfers(filteredTransfers)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load transfers')
      setTransfers([])
    } finally {
      setIsLoading(false)
    }
  }, [activeTab, statusFilter, user?.id])

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchTransfers()
  }, [fetchTransfers])

  // Handle confirm transfer
  const handleConfirmTransfer = async () => {
    if (!confirmingId) return
    
    try {
      await transferService.confirmTransfer(confirmingId)
      setShowConfirmModal(false)
      setConfirmingId(null)
      fetchTransfers() // Refresh list
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to confirm transfer')
    }
  }

  // Open confirm modal
  const openConfirmModal = (transferId, type) => {
    setConfirmingId(transferId)
    setActionType(type)
    setShowConfirmModal(true)
  }

  // Count pending incoming transfers
  const pendingCount = transfers.filter(
    t => t.status === 'pending' && t.to_user?.id === user?.id
  ).length

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Transfers</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage custody transfers for your products
          </p>
        </div>

        {pendingCount > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300 px-4 py-2 rounded-lg flex items-center gap-2">
            <Clock size={18} />
            <span className="font-medium">{pendingCount} pending transfer{pendingCount !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Tabs & Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex gap-2">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                    activeTab === tab.id
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
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
          className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg"
        >
          {error}
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
            {activeTab === 'incoming'
              ? "You don't have any incoming transfers"
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
                  isPending={transfer.to_user?.id === user?.id}
                  onConfirm={(id) => openConfirmModal(id, 'confirm')}
                  onReject={(id) => openConfirmModal(id, 'reject')}
                />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title={actionType === 'confirm' ? 'Confirm Transfer' : 'Reject Transfer'}
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowConfirmModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant={actionType === 'confirm' ? 'success' : 'danger'}
              onClick={handleConfirmTransfer}
              leftIcon={actionType === 'confirm' ? <CheckCircle size={18} /> : <XCircle size={18} />}
            >
              {actionType === 'confirm' ? 'Confirm Receipt' : 'Reject Transfer'}
            </Button>
          </div>
        }
      >
        <p className="text-gray-600 dark:text-gray-400">
          {actionType === 'confirm'
            ? 'By confirming, you acknowledge receiving custody of this product. This action will be recorded on the blockchain.'
            : 'Are you sure you want to reject this transfer? This action cannot be undone.'}
        </p>
      </Modal>
    </div>
  )
}
