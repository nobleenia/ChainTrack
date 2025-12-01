/**
 * StatusBadge Component
 * 
 * Displays product or transfer status with appropriate colors.
 * Consistent visual indicator across the application.
 */

import { motion } from 'framer-motion'
import { 
  CheckCircle, 
  Clock, 
  Truck, 
  Package, 
  AlertTriangle,
  XCircle,
  Shield
} from 'lucide-react'

// Status configuration with colors and icons
const statusConfig = {
  // Product statuses
  active: {
    label: 'Active',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
  },
  in_transit: {
    label: 'In Transit',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Truck,
  },
  delivered: {
    label: 'Delivered',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: Package,
  },
  recalled: {
    label: 'Recalled',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: AlertTriangle,
  },
  
  // Transfer statuses
  pending: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
  },
  confirmed: {
    label: 'Confirmed',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
  },
  
  // Verification statuses
  verified: {
    label: 'Verified',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: Shield,
  },
  unverified: {
    label: 'Unverified',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: AlertTriangle,
  },
}

export default function StatusBadge({ 
  status, 
  size = 'md',
  showIcon = true,
  animate = false 
}) {
  const config = statusConfig[status] || {
    label: status,
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: Package,
  }
  
  const Icon = config.icon
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  }

  const Component = animate ? motion.span : 'span'
  const animationProps = animate ? {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { duration: 0.2 }
  } : {}

  return (
    <Component
      {...animationProps}
      className={`
        inline-flex items-center gap-1.5 font-medium rounded-full border
        ${config.color} ${sizeClasses[size]}
      `}
    >
      {showIcon && <Icon size={iconSizes[size]} />}
      {config.label}
    </Component>
  )
}
