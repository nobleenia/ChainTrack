/**
 * TransferCard Component
 * 
 * Displays a custody transfer record with proper status workflow.
 * Shows from/to parties, status, and appropriate action buttons.
 */

import { motion } from 'framer-motion'
import { 
  ArrowRight, 
  User, 
  Building, 
  MapPin, 
  Clock,
  CheckCircle,
  XCircle,
  Shield,
  Package,
  Link as LinkIcon,
  AlertTriangle
} from 'lucide-react'
import Button from '../common/Button'

// Status configuration
const statusConfig = {
  pending: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    icon: Clock,
  },
  accepted: {
    label: 'Accepted',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    icon: CheckCircle,
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    icon: XCircle,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
    icon: XCircle,
  },
  expired: {
    label: 'Expired',
    color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
    icon: Clock,
  },
}

export default function TransferCard({
  transfer,
  currentUserId,
  onAccept,
  onReject,
  onCancel,
  onShowClaimLink,
}) {
  const {
    id,
    from_user,
    to_user,
    recipient,
    recipient_name,
    product,
    location,
    status,
    created_at,
    confirmed_at,
    responded_at,
    blockchain_hash,
    notes,
    rejection_reason,
    has_claim_token,
  } = transfer

  // Determine if current user is sender or recipient
  const isSender = from_user?.id === currentUserId
  const isRecipient = to_user?.id === currentUserId
  const isPending = status === 'pending'

  // Get status config
  const statusInfo = statusConfig[status] || statusConfig.pending
  const StatusIcon = statusInfo.icon

  // Format dates
  const formatDate = (dateString) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Truncate hash
  const truncatedHash = blockchain_hash
    ? `${blockchain_hash.slice(0, 6)}...${blockchain_hash.slice(-4)}`
    : null

  // Get recipient display name
  const recipientDisplay = to_user?.name || to_user?.company_name || recipient_name || 'External Recipient'
  const recipientType = recipient?.recipient_type || (to_user ? 'registered' : 'external')

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-gray-800 rounded-xl border shadow-sm p-5 ${
        isPending && isRecipient 
          ? 'border-yellow-300 dark:border-yellow-600' 
          : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      {/* Pending indicator for recipient */}
      {isPending && isRecipient && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <AlertTriangle size={16} className="text-yellow-600 dark:text-yellow-400" />
          <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
            Action Required: Accept or reject this transfer
          </span>
        </div>
      )}

      {/* Product Info (if available) */}
      {product && (
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
          <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
            <Package className="text-primary-600 dark:text-primary-400" size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
              {product.name}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              ID: {product.product_id}
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
            <span className="flex items-center gap-1">
              <StatusIcon size={12} />
              {statusInfo.label}
            </span>
          </div>
        </div>
      )}

      {/* Transfer Flow */}
      <div className="flex items-center gap-4 mb-4">
        {/* From User */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {from_user?.company_name ? (
              <Building size={16} className="text-gray-400" />
            ) : (
              <User size={16} className="text-gray-400" />
            )}
            <span className="text-sm text-gray-500 dark:text-gray-400">From</span>
            {isSender && (
              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                You
              </span>
            )}
          </div>
          <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
            {from_user?.company_name || from_user?.name || 'Unknown'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{from_user?.role}</p>
        </div>

        {/* Arrow */}
        <div className="flex-shrink-0">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isPending 
              ? 'bg-yellow-50 dark:bg-yellow-900/30' 
              : status === 'accepted' 
              ? 'bg-green-50 dark:bg-green-900/30' 
              : 'bg-gray-50 dark:bg-gray-700'
          }`}>
            <ArrowRight className={`${
              isPending 
                ? 'text-yellow-600 dark:text-yellow-400' 
                : status === 'accepted' 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-gray-400'
            }`} size={20} />
          </div>
        </div>

        {/* To User */}
        <div className="flex-1 min-w-0 text-right">
          <div className="flex items-center gap-2 justify-end mb-1">
            <span className="text-sm text-gray-500 dark:text-gray-400">To</span>
            {isRecipient && (
              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                You
              </span>
            )}
            {recipientType === 'external' ? (
              <Building size={16} className="text-gray-400" />
            ) : (
              <User size={16} className="text-gray-400" />
            )}
          </div>
          <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
            {recipientDisplay}
          </p>
          {recipientType === 'external' && (
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
              {recipient?.recipient_type || 'external'}
            </p>
          )}
          {to_user?.role && (
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{to_user.role}</p>
          )}
        </div>
      </div>

      {/* Info Row */}
      <div className="flex flex-wrap items-center gap-4 py-3 border-y border-gray-100 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
        {location && (
          <span className="flex items-center gap-1">
            <MapPin size={14} />
            {location}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Clock size={14} />
          {formatDate(created_at)}
        </span>
        {!product && (
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        )}
      </div>

      {/* Notes */}
      {notes && (
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 italic">"{notes}"</p>
      )}

      {/* Rejection Reason */}
      {rejection_reason && (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-400">
            <strong>Reason:</strong> {rejection_reason}
          </p>
        </div>
      )}

      {/* Blockchain Confirmation */}
      {blockchain_hash && (
        <div className="mt-3 flex items-center gap-2 text-sm">
          <Shield size={16} className="text-green-500" />
          <span className="text-gray-500 dark:text-gray-400">On-chain:</span>
          <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded font-mono text-gray-600 dark:text-gray-300">
            {truncatedHash}
          </code>
        </div>
      )}

      {/* Response Time */}
      {responded_at && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {status === 'accepted' ? 'Accepted' : status === 'rejected' ? 'Rejected' : 'Responded'} on {formatDate(responded_at)}
        </p>
      )}

      {/* Actions */}
      {isPending && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          {/* Recipient Actions */}
          {isRecipient && (
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onReject}
                leftIcon={<XCircle size={16} />}
              >
                Reject
              </Button>
              <Button
                variant="success"
                size="sm"
                onClick={onAccept}
                leftIcon={<CheckCircle size={16} />}
              >
                Accept Ownership
              </Button>
            </div>
          )}

          {/* Sender Actions */}
          {isSender && (
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Waiting for recipient to accept...
              </div>
              <div className="flex gap-3">
                {has_claim_token && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onShowClaimLink}
                    leftIcon={<LinkIcon size={16} />}
                  >
                    Share Link
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCancel}
                  leftIcon={<XCircle size={16} />}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}

/**
 * TransferCardSkeleton - Loading placeholder
 */
export function TransferCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="flex-1">
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-1" />
          <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
      </div>
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1">
          <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-1" />
          <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
        <div className="flex-1 flex flex-col items-end">
          <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-1" />
          <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
      <div className="flex justify-between py-3 border-y border-gray-100 dark:border-gray-700">
        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    </div>
  )
}
