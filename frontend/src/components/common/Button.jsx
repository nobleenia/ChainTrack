/**
 * Button Component
 * 
 * Reusable button with multiple variants, sizes, and states.
 * Supports loading state, icons, and disabled state.
 */

import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { ButtonLoader } from './LoadingSpinner'

const variants = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-300',
  secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-300',
  outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-300',
  ghost: 'text-gray-600 hover:bg-gray-100 focus:ring-gray-300',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-300',
  success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-300',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
  xl: 'px-8 py-4 text-xl',
}

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  animate = true,
  ...props
}, ref) => {
  const isDisabled = disabled || isLoading

  const Component = animate ? motion.button : 'button'
  const animationProps = animate ? {
    whileHover: !isDisabled ? { scale: 1.02 } : {},
    whileTap: !isDisabled ? { scale: 0.98 } : {},
  } : {}

  return (
    <Component
      ref={ref}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center gap-2 font-medium rounded-lg
        transition-colors focus:outline-none focus:ring-4
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...animationProps}
      {...props}
    >
      {isLoading ? (
        <>
          <ButtonLoader color={variant === 'primary' || variant === 'danger' || variant === 'success' ? 'white' : 'gray'} />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </>
      )}
    </Component>
  )
})

Button.displayName = 'Button'

export default Button

/**
 * IconButton - Square button with just an icon
 */
export const IconButton = forwardRef(({
  icon,
  variant = 'ghost',
  size = 'md',
  className = '',
  ...props
}, ref) => {
  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3',
  }

  return (
    <Button
      ref={ref}
      variant={variant}
      className={`${sizeClasses[size]} ${className}`}
      {...props}
    >
      {icon}
    </Button>
  )
})

IconButton.displayName = 'IconButton'
