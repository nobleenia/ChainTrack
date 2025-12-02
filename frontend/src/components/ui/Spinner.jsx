/**
 * Spinner Component
 * Loading indicator with multiple sizes
 */

import * as React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '../../utils/cn'

const spinnerVariants = cva(
  'animate-spin rounded-full border-2 border-current border-t-transparent',
  {
    variants: {
      size: {
        sm: 'h-4 w-4',
        default: 'h-6 w-6',
        lg: 'h-8 w-8',
        xl: 'h-12 w-12',
      },
      color: {
        default: 'text-primary-600 dark:text-primary-400',
        white: 'text-white',
        gray: 'text-gray-500 dark:text-gray-400',
        success: 'text-emerald-600 dark:text-emerald-400',
      },
    },
    defaultVariants: {
      size: 'default',
      color: 'default',
    },
  }
)

function Spinner({ className, size, color, label = 'Loading...', ...props }) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn('inline-flex items-center justify-center', className)}
      {...props}
    >
      <div className={spinnerVariants({ size, color })} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  )
}

export { Spinner, spinnerVariants }
