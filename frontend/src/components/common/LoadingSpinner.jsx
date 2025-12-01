/**
 * LoadingSpinner Component
 * 
 * A reusable loading indicator with customizable size and color.
 * Used throughout the app for async operations.
 */

import { motion } from 'framer-motion'

const sizes = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-3',
  xl: 'w-12 h-12 border-4',
}

const colors = {
  primary: 'border-primary-600 border-t-transparent',
  white: 'border-white border-t-transparent',
  gray: 'border-gray-400 border-t-transparent',
}

export default function LoadingSpinner({ 
  size = 'md', 
  color = 'primary',
  className = '',
  text = ''
}) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <motion.div
        className={`rounded-full animate-spin ${sizes[size]} ${colors[color]}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />
      {text && (
        <span className="text-sm text-gray-500">{text}</span>
      )}
    </div>
  )
}

/**
 * FullPageLoader - Covers entire screen with loading indicator
 */
export function FullPageLoader({ text = 'Loading...' }) {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <LoadingSpinner size="xl" text={text} />
    </div>
  )
}

/**
 * ButtonLoader - Inline spinner for buttons
 */
export function ButtonLoader({ color = 'white' }) {
  return <LoadingSpinner size="sm" color={color} />
}
