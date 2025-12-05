/**
 * QRScanner Component
 * 
 * Camera-based QR code and barcode scanner using html5-qrcode
 * Supports both QR codes and various barcode formats
 */

import { useState, useEffect, useRef } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { motion } from 'framer-motion'
import { 
  Camera, 
  X, 
  RefreshCw, 
  SwitchCamera,
  QrCode,
  AlertCircle 
} from 'lucide-react'
import { Button } from './index'

// Supported formats (QR codes + common barcodes)
const SUPPORTED_FORMATS = [
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
]

export default function QRScanner({ isOpen, onClose, onScan }) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState(null)
  const [cameras, setCameras] = useState([])
  const [currentCamera, setCurrentCamera] = useState(null)
  const scannerRef = useRef(null)
  const containerRef = useRef(null)

  // Initialize scanner when modal opens
  useEffect(() => {
    if (isOpen) {
      initScanner()
    }
    return () => {
      stopScanner()
    }
  }, [isOpen])

  // Get available cameras
  const getCameras = async () => {
    try {
      const devices = await Html5Qrcode.getCameras()
      setCameras(devices)
      // Prefer back camera on mobile
      const backCamera = devices.find(d => 
        d.label.toLowerCase().includes('back') || 
        d.label.toLowerCase().includes('rear')
      )
      return backCamera || devices[0]
    } catch (err) {
      console.error('Failed to get cameras:', err)
      setError('Camera access denied. Please allow camera permissions.')
      return null
    }
  }

  // Initialize and start scanner
  const initScanner = async () => {
    setError(null)
    
    const camera = await getCameras()
    if (!camera) return

    setCurrentCamera(camera)

    try {
      scannerRef.current = new Html5Qrcode('qr-reader', {
        formatsToSupport: SUPPORTED_FORMATS,
        verbose: false
      })

      await scannerRef.current.start(
        camera.id,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          // Success callback
          handleScanSuccess(decodedText)
        },
        (errorMessage) => {
          // Error callback (ignore - continuous scanning)
        }
      )

      setIsScanning(true)
    } catch (err) {
      console.error('Failed to start scanner:', err)
      if (err.message?.includes('Permission denied')) {
        setError('Camera access denied. Please allow camera permissions in your browser settings.')
      } else {
        setError(`Failed to start camera: ${err.message}`)
      }
    }
  }

  // Stop scanner
  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop()
        scannerRef.current = null
      } catch (err) {
        console.error('Failed to stop scanner:', err)
      }
    }
    setIsScanning(false)
  }

  // Handle successful scan
  const handleScanSuccess = async (decodedText) => {
    // Stop scanning immediately to prevent duplicate reads
    await stopScanner()
    
    // Extract product ID from QR code
    // QR might contain full URL like https://chaintrack.io/verify/PRD-XXXXX
    let productId = decodedText
    
    // Try to extract product ID from URL
    const urlMatch = decodedText.match(/\/verify\/([A-Za-z0-9-]+)/)
    if (urlMatch) {
      productId = urlMatch[1]
    }
    
    // Or just use the raw value if it looks like a product ID
    if (!productId.startsWith('PRD-') && decodedText.includes('PRD-')) {
      const prdMatch = decodedText.match(/(PRD-[A-Z0-9-]+)/i)
      if (prdMatch) {
        productId = prdMatch[1]
      }
    }

    onScan(productId)
    onClose()
  }

  // Switch camera
  const switchCamera = async () => {
    if (cameras.length < 2) return
    
    await stopScanner()
    
    const currentIndex = cameras.findIndex(c => c.id === currentCamera?.id)
    const nextIndex = (currentIndex + 1) % cameras.length
    const nextCamera = cameras[nextIndex]
    
    setCurrentCamera(nextCamera)
    
    try {
      scannerRef.current = new Html5Qrcode('qr-reader')
      await scannerRef.current.start(
        nextCamera.id,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        handleScanSuccess,
        () => {}
      )
      setIsScanning(true)
    } catch (err) {
      setError(`Failed to switch camera: ${err.message}`)
    }
  }

  // Handle close
  const handleClose = async () => {
    await stopScanner()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/50 rounded-lg">
              <QrCode size={20} className="text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Scan QR Code or Barcode</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Point your camera at the code</p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Scanner Area */}
        <div className="relative">
          {/* Camera view container */}
          <div 
            id="qr-reader" 
            ref={containerRef}
            className="w-full aspect-square bg-black"
            style={{ maxHeight: '400px' }}
          />
          
          {/* Scanning overlay */}
          {isScanning && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Corner brackets */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 relative">
                  {/* Top left */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-primary-500 rounded-tl-lg" />
                  {/* Top right */}
                  <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-primary-500 rounded-tr-lg" />
                  {/* Bottom left */}
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-primary-500 rounded-bl-lg" />
                  {/* Bottom right */}
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-primary-500 rounded-br-lg" />
                  
                  {/* Scanning line animation */}
                  <motion.div
                    className="absolute left-0 right-0 h-0.5 bg-primary-500 shadow-lg"
                    style={{ boxShadow: '0 0 10px rgba(37, 99, 235, 0.8)' }}
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90">
              <div className="text-center p-6">
                <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
                <p className="text-white mb-4">{error}</p>
                <Button onClick={initScanner} variant="primary" leftIcon={<RefreshCw size={16} />}>
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isScanning ? 'Scanning...' : 'Initializing camera...'}
            </p>
            
            <div className="flex items-center gap-2">
              {cameras.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={switchCamera}
                  leftIcon={<SwitchCamera size={16} />}
                >
                  Switch
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleClose}
              >
                Cancel
              </Button>
            </div>
          </div>
          
          {/* Supported formats hint */}
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 text-center">
            Supports QR codes, EAN-13, EAN-8, Code 128, Code 39, UPC-A, UPC-E
          </p>
        </div>
      </motion.div>
    </div>
  )
}
