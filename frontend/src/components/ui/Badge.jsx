/**
 * Badge Component
 * Small status indicators with various color variants
 * Based on shadcn/ui patterns with project-specific styling
 */

import * as React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '../../utils/cn'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-300',
        secondary:
          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
        success:
          'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
        warning:
          'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
        destructive:
          'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
        outline:
          'border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300',
        // Supply chain specific statuses
        manufactured:
          'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        shipped:
          'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
        delivered:
          'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
        verified:
          'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
        pending:
          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

function Badge({ className, variant, ...props }) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
