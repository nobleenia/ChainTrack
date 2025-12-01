import { useEffect, useState, useCallback } from 'react'
import Shepherd from 'shepherd.js'
import 'shepherd.js/dist/css/shepherd.css'

const tourSteps = [
  {
    id: 'welcome',
    title: '👋 Welcome to ChainTrack!',
    text: 'This is your dashboard - your command center for tracking all your products on the blockchain. Let me show you around!',
    attachTo: { element: '#tour-sidebar', on: 'right' },
    buttons: [
      { text: 'Skip Tour', action: 'cancel', secondary: true },
      { text: 'Next →', action: 'next' }
    ]
  },
  {
    id: 'stats',
    title: '📊 Your Statistics',
    text: 'Here you can see an overview of your products, transfers, and verifications at a glance.',
    attachTo: { element: '#tour-stats', on: 'bottom' },
    buttons: [
      { text: '← Back', action: 'back', secondary: true },
      { text: 'Next →', action: 'next' }
    ]
  },
  {
    id: 'register-product',
    title: '📦 Register Products',
    text: 'As a manufacturer, you can register new products here. Each product gets a unique ID and is recorded on the Ethereum blockchain.',
    attachTo: { element: '#tour-register-product', on: 'top' },
    buttons: [
      { text: '← Back', action: 'back', secondary: true },
      { text: 'Next →', action: 'next' }
    ]
  },
  {
    id: 'recent-products',
    title: '📋 Recent Products',
    text: 'View all your registered products here. Click on any product to see its full journey through the supply chain.',
    attachTo: { element: '#tour-recent-products', on: 'top' },
    buttons: [
      { text: '← Back', action: 'back', secondary: true },
      { text: 'Done! 🎉', action: 'complete' }
    ]
  }
]

export function useTour() {
  const [tour, setTour] = useState(null)

  useEffect(() => {
    const shepherdTour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        cancelIcon: { enabled: true },
        classes: 'shadow-xl rounded-lg',
        scrollTo: { behavior: 'smooth', block: 'center' }
      }
    })

    tourSteps.forEach((step) => {
      shepherdTour.addStep({
        id: step.id,
        title: step.title,
        text: step.text,
        attachTo: step.attachTo,
        buttons: step.buttons.map((btn) => ({
          text: btn.text,
          classes: btn.secondary 
            ? 'shepherd-button-secondary' 
            : 'shepherd-button-primary',
          action: () => {
            if (btn.action === 'next') shepherdTour.next()
            else if (btn.action === 'back') shepherdTour.back()
            else if (btn.action === 'cancel') shepherdTour.cancel()
            else if (btn.action === 'complete') {
              localStorage.setItem('chaintrack-tour-completed', 'true')
              shepherdTour.complete()
            }
          }
        }))
      })
    })

    shepherdTour.on('cancel', () => {
      localStorage.setItem('chaintrack-tour-completed', 'true')
    })

    setTour(shepherdTour)

    return () => shepherdTour.complete()
  }, [])

  const startTour = useCallback(() => {
    if (tour) {
      tour.start()
    }
  }, [tour])

  const resetTour = useCallback(() => {
    localStorage.removeItem('chaintrack-tour-completed')
  }, [])

  // Custom styles for tour
  const TourComponent = (
    <style>{`
      .shepherd-element {
        z-index: 9999;
      }
      .shepherd-modal-overlay-container {
        z-index: 9998;
      }
      .shepherd-content {
        border-radius: 12px;
        padding: 0;
      }
      .shepherd-header {
        background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
        color: white;
        padding: 16px 20px;
        border-radius: 12px 12px 0 0;
      }
      .shepherd-title {
        font-size: 18px;
        font-weight: 600;
      }
      .shepherd-cancel-icon {
        color: white;
      }
      .shepherd-text {
        padding: 20px;
        font-size: 15px;
        line-height: 1.6;
        color: #374151;
      }
      .shepherd-footer {
        padding: 16px 20px;
        border-top: 1px solid #e5e7eb;
      }
      .shepherd-button-primary {
        background: #2563eb;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 8px;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s;
      }
      .shepherd-button-primary:hover {
        background: #1d4ed8;
      }
      .shepherd-button-secondary {
        background: transparent;
        color: #6b7280;
        border: 1px solid #d1d5db;
        padding: 10px 20px;
        border-radius: 8px;
        font-weight: 500;
        cursor: pointer;
        margin-right: 8px;
      }
      .shepherd-button-secondary:hover {
        background: #f3f4f6;
      }
      .shepherd-arrow::before {
        background: white;
      }
    `}</style>
  )

  return { startTour, resetTour, TourComponent }
}
