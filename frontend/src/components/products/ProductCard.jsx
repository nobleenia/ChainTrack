/**
 * ProductCard Component
 * 
 * Displays a product summary in a card format.
 * Shows key product info, status, and QR code preview.
 * Used in product listings and dashboard.
 */

import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Package, 
  MapPin, 
  Calendar, 
  QrCode, 
  ArrowRight,
  History,
  Shield,
  UserX
} from 'lucide-react'
import StatusBadge from '../common/StatusBadge'

export default function ProductCard({ 
  product, 
  showActions = true,
  compact = false,
  onClick,
}) {
  const {
    id,
    product_id,
    name,
    category,
    origin,
    status,
    created_at,
    blockchain_hash,
    journey_count = 0,
    transferred_away = false, // Product was manufactured by current user but transferred to someone else
    current_holder,
  } = product

  // Format date
  const formattedDate = new Date(created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  // Truncate blockchain hash for display
  const truncatedHash = blockchain_hash 
    ? `${blockchain_hash.slice(0, 6)}...${blockchain_hash.slice(-4)}`
    : null

  const CardWrapper = onClick ? motion.div : Link

  return (
    <CardWrapper
      to={onClick ? undefined : `/products/${product_id}`}
      onClick={onClick}
      className="block"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <div className={`
        bg-white dark:bg-gray-800 rounded-xl border shadow-sm hover:shadow-md 
        transition-shadow overflow-hidden relative
        ${compact ? 'p-4' : 'p-6'}
        ${transferred_away 
          ? 'border-gray-300 dark:border-gray-600 opacity-60 hover:opacity-80' 
          : 'border-gray-200 dark:border-gray-700'
        }
      `}>
        {/* Transferred Away Indicator */}
        {transferred_away && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs px-2 py-1 rounded-full">
            <UserX size={12} />
            <span>Transferred</span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${transferred_away ? 'bg-gray-100 dark:bg-gray-700' : 'bg-primary-50 dark:bg-primary-900/30'}`}>
              <Package className={transferred_away ? 'text-gray-400' : 'text-primary-600 dark:text-primary-400'} size={compact ? 20 : 24} />
            </div>
            <div>
              <h3 className={`font-semibold ${transferred_away ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'} ${compact ? 'text-sm' : 'text-base'}`}>
                {name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{product_id}</p>
            </div>
          </div>
          {!transferred_away && <StatusBadge status={status} size={compact ? 'sm' : 'md'} />}
        </div>

        {/* Current Holder Info for transferred products */}
        {transferred_away && current_holder && (
          <div className="mb-3 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded px-2 py-1">
            Now with: <span className="font-medium">{current_holder.name || current_holder.company_name}</span>
          </div>
        )}

        {/* Info Grid */}
        <div className={`grid gap-3 ${compact ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'}`}>
          {/* Category */}
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Package size={16} className="text-gray-400" />
            <span className="text-sm capitalize">{category || 'General'}</span>
          </div>

          {/* Origin */}
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <MapPin size={16} className="text-gray-400" />
            <span className="text-sm truncate">{origin || 'Unknown'}</span>
          </div>

          {/* Date */}
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Calendar size={16} className="text-gray-400" />
            <span className="text-sm">{formattedDate}</span>
          </div>

          {/* Journey Count */}
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <History size={16} className="text-gray-400" />
            <span className="text-sm">{journey_count} transfers</span>
          </div>
        </div>

        {/* Blockchain Info */}
        {blockchain_hash && !compact && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 text-sm">
              <Shield size={16} className="text-green-500" />
              <span className="text-gray-500 dark:text-gray-400">On-chain:</span>
              <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded font-mono text-gray-600 dark:text-gray-300">
                {truncatedHash}
              </code>
            </div>
          </div>
        )}

        {/* Actions */}
        {showActions && !compact && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition">
              <QrCode size={16} />
              View QR Code
            </button>
            <span className={`flex items-center gap-1 text-sm font-medium ${transferred_away ? 'text-gray-400' : 'text-primary-600 dark:text-primary-400'}`}>
              {transferred_away ? 'View History' : 'View Details'}
              <ArrowRight size={16} />
            </span>
          </div>
        )}
      </div>
    </CardWrapper>
  )
}

/**
 * ProductCardSkeleton - Loading placeholder
 */
export function ProductCardSkeleton({ compact = false }) {
  return (
    <div className={`
      bg-white rounded-xl border border-gray-200 animate-pulse
      ${compact ? 'p-4' : 'p-6'}
    `}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-lg" />
          <div>
            <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
            <div className="h-3 w-24 bg-gray-200 rounded" />
          </div>
        </div>
        <div className="h-6 w-20 bg-gray-200 rounded-full" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-4 bg-gray-200 rounded" />
        ))}
      </div>
    </div>
  )
}
