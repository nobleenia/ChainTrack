/**
 * TransferCard Component
 * 
 * Displays a custody transfer record in card format.
 * Shows from/to parties, status, and blockchain confirmation.
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
  Shield
} from 'lucide-react'
import StatusBadge from '../common/StatusBadge'
import Button from '../common/Button'

export default function TransferCard({
  transfer,
  onConfirm,
  onReject,
  isPending = false,
  showActions = true,
}) {
  const {
    id,
    from_user,
    to_user,
    location,
    status,
    created_at,
    confirmed_at,
    blockchain_hash,
    notes,
  } = transfer

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-200 shadow-sm p-5"
    >
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
            <span className="text-sm text-gray-500">From</span>
          </div>
          <p className="font-medium text-gray-900 truncate">
            {from_user?.company_name || from_user?.name || 'Unknown'}
          </p>
          <p className="text-xs text-gray-500 capitalize">{from_user?.role}</p>
        </div>

        {/* Arrow */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
            <ArrowRight className="text-primary-600" size={20} />
          </div>
        </div>

        {/* To User */}
        <div className="flex-1 min-w-0 text-right">
          <div className="flex items-center gap-2 justify-end mb-1">
            <span className="text-sm text-gray-500">To</span>
            {to_user?.company_name ? (
              <Building size={16} className="text-gray-400" />
            ) : (
              <User size={16} className="text-gray-400" />
            )}
          </div>
          <p className="font-medium text-gray-900 truncate">
            {to_user?.company_name || to_user?.name || 'Unknown'}
          </p>
          <p className="text-xs text-gray-500 capitalize">{to_user?.role}</p>
        </div>
      </div>

      {/* Status & Info */}
      <div className="flex items-center justify-between py-3 border-y border-gray-100">
        <StatusBadge status={status} />
        
        <div className="flex items-center gap-4 text-sm text-gray-500">
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
        </div>
      </div>

      {/* Notes */}
      {notes && (
        <p className="mt-3 text-sm text-gray-600 italic">"{notes}"</p>
      )}

      {/* Blockchain Confirmation */}
      {blockchain_hash && (
        <div className="mt-3 flex items-center gap-2 text-sm">
          <Shield size={16} className="text-green-500" />
          <span className="text-gray-500">Confirmed on-chain:</span>
          <code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono text-gray-600">
            {truncatedHash}
          </code>
        </div>
      )}

      {/* Confirmation Time */}
      {confirmed_at && (
        <p className="mt-2 text-xs text-gray-500">
          Confirmed on {formatDate(confirmed_at)}
        </p>
      )}

      {/* Actions for pending transfers */}
      {showActions && isPending && status === 'pending' && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onReject?.(id)}
            leftIcon={<XCircle size={16} />}
          >
            Reject
          </Button>
          <Button
            variant="success"
            size="sm"
            onClick={() => onConfirm?.(id)}
            leftIcon={<CheckCircle size={16} />}
          >
            Confirm Receipt
          </Button>
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
    <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1">
          <div className="h-3 w-12 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-32 bg-gray-200 rounded mb-1" />
          <div className="h-3 w-20 bg-gray-200 rounded" />
        </div>
        <div className="w-10 h-10 bg-gray-200 rounded-full" />
        <div className="flex-1 flex flex-col items-end">
          <div className="h-3 w-12 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-32 bg-gray-200 rounded mb-1" />
          <div className="h-3 w-20 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="flex justify-between py-3 border-y border-gray-100">
        <div className="h-6 w-20 bg-gray-200 rounded-full" />
        <div className="h-4 w-40 bg-gray-200 rounded" />
      </div>
    </div>
  )
}
