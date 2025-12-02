/**
 * Accessibility Utilities
 * WCAG 2.1 AA compliant helpers for the ChainTrack application
 */

/**
 * Screen reader only class for visually hidden text
 */
export const srOnly = 'sr-only'

/**
 * Focus ring classes for keyboard navigation
 */
export const focusRing = 'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900'

/**
 * Skip link classes for keyboard users
 */
export const skipLinkClasses = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-lg'

/**
 * ARIA live region announcer
 * Use for dynamic content updates that should be announced to screen readers
 */
export function AriaLiveRegion({ message, priority = 'polite' }) {
  return (
    <div
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  )
}

/**
 * Skip to main content link
 * Should be the first focusable element on the page
 */
export function SkipLink({ targetId = 'main-content', children = 'Skip to main content' }) {
  return (
    <a
      href={`#${targetId}`}
      className={skipLinkClasses}
    >
      {children}
    </a>
  )
}

/**
 * Accessible icon button wrapper
 */
export function IconButton({ 
  onClick, 
  label, 
  icon: Icon, 
  className = '',
  disabled = false,
  ...props 
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
      className={`${focusRing} ${className}`}
      {...props}
    >
      <Icon aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </button>
  )
}

/**
 * Accessible loading spinner
 */
export function LoadingSpinner({ size = 'md', label = 'Loading...' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }
  
  return (
    <div role="status" aria-label={label}>
      <svg
        className={`animate-spin ${sizeClasses[size]} text-primary-600`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  )
}

/**
 * Accessible alert/notification component
 */
export function Alert({ 
  type = 'info', 
  message, 
  title,
  onDismiss,
  className = '' 
}) {
  const typeStyles = {
    info: 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-700',
    success: 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700',
    warning: 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-700',
    error: 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700'
  }
  
  const roleMap = {
    info: 'status',
    success: 'status',
    warning: 'alert',
    error: 'alert'
  }
  
  return (
    <div
      role={roleMap[type]}
      aria-live={type === 'error' || type === 'warning' ? 'assertive' : 'polite'}
      className={`p-4 border rounded-lg ${typeStyles[type]} ${className}`}
    >
      {title && <h4 className="font-semibold mb-1">{title}</h4>}
      <p>{message}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss alert"
          className={`mt-2 text-sm underline ${focusRing}`}
        >
          Dismiss
        </button>
      )}
    </div>
  )
}

/**
 * Accessible modal dialog wrapper
 */
export function useModalA11y(isOpen, onClose) {
  // Trap focus inside modal when open
  useEffect(() => {
    if (!isOpen) return
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    
    // Prevent background scroll
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])
}

import { useEffect, useRef } from 'react'

/**
 * Hook to announce messages to screen readers
 */
export function useAnnounce() {
  const announce = (message, priority = 'polite') => {
    const announcer = document.createElement('div')
    announcer.setAttribute('aria-live', priority)
    announcer.setAttribute('aria-atomic', 'true')
    announcer.setAttribute('class', 'sr-only')
    announcer.textContent = message
    document.body.appendChild(announcer)
    
    setTimeout(() => {
      document.body.removeChild(announcer)
    }, 1000)
  }
  
  return announce
}

/**
 * Standalone function to announce messages to screen readers
 * Use when you need to announce outside of a React component
 */
export function announceToScreenReader(message, priority = 'polite') {
  const liveRegion = document.getElementById('aria-live-region')
  if (liveRegion) {
    liveRegion.textContent = message
    // Clear after announcement
    setTimeout(() => {
      liveRegion.textContent = ''
    }, 1000)
  } else {
    // Fallback: create temporary announcer
    const announcer = document.createElement('div')
    announcer.setAttribute('aria-live', priority)
    announcer.setAttribute('aria-atomic', 'true')
    announcer.setAttribute('class', 'sr-only')
    announcer.textContent = message
    document.body.appendChild(announcer)
    setTimeout(() => {
      document.body.removeChild(announcer)
    }, 1000)
  }
}

/**
 * Focus trap hook for modals and dialogs
 */
export function useFocusTrap(ref, isActive) {
  useEffect(() => {
    if (!isActive || !ref.current) return
    
    const element = ref.current
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]
    
    // Focus first element
    firstElement?.focus()
    
    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }
    
    element.addEventListener('keydown', handleKeyDown)
    return () => element.removeEventListener('keydown', handleKeyDown)
  }, [ref, isActive])
}

/**
 * FocusTrap component wrapper for modals and dialogs
 * Traps focus within the component when active
 */
export function FocusTrap({ children, active = true }) {
  const containerRef = useRef(null)
  
  useEffect(() => {
    if (!active || !containerRef.current) return
    
    const element = containerRef.current
    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    const focusableElements = element.querySelectorAll(focusableSelector)
    
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]
    
    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }
    
    element.addEventListener('keydown', handleKeyDown)
    return () => element.removeEventListener('keydown', handleKeyDown)
  }, [active])
  
  return (
    <div ref={containerRef}>
      {children}
    </div>
  )
}
