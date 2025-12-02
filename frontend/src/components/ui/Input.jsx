/**
 * Input Component
 * A styled input with error states and icon support
 * Based on shadcn/ui patterns with project-specific styling
 */

import * as React from 'react'
import { cn } from '../../utils/cn'

const Input = React.forwardRef(
  ({ className, type = 'text', error, icon: Icon, iconPosition = 'left', ...props }, ref) => {
    const hasIcon = !!Icon
    
    return (
      <div className="relative">
        {hasIcon && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        )}
        <input
          type={type}
          className={cn(
            'flex h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors',
            'file:border-0 file:bg-transparent file:text-sm file:font-medium',
            'placeholder:text-gray-400',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus-visible:ring-offset-gray-900',
            error
              ? 'border-red-500 focus-visible:ring-red-500'
              : 'border-gray-300 dark:border-gray-600',
            hasIcon && iconPosition === 'left' && 'pl-10',
            hasIcon && iconPosition === 'right' && 'pr-10',
            className
          )}
          ref={ref}
          aria-invalid={error ? 'true' : 'false'}
          {...props}
        />
        {hasIcon && iconPosition === 'right' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        )}
        {error && typeof error === 'string' && (
          <p className="mt-1 text-sm text-red-500" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
