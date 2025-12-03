/**
 * Courier Checkpoint Page
 * Enhanced with QR scanner, dark mode, and better mobile UX
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package,
  MapPin,
  Camera,
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Truck,
  QrCode,
  KeyRound,
  Navigation,
  Clock,
  Hash,
  ExternalLink,
  ArrowLeft,
  Shield,
  ScanLine,
  Flashlight,
  FlashlightOff,
  RotateCcw,
  User,
  ChevronRight,
  Info
} from 'lucide-react'
import { shipmentApi } from '../services/shipmentApi'
import { courierApi } from '../services/courierApi'

const actionOptions = [
  { value: 'picked_up', label: 'Picked Up', icon: Package, color: 'blue', description: 'Mark as collected from sender' },
  { value: 'checkpoint', label: 'Checkpoint', icon: MapPin, color: 'purple', description: 'Record current location' },
  { value: 'in_transit', label: 'In Transit', icon: Truck, color: 'yellow', description: 'Package is being transported' },
  { value: 'out_for_delivery', label: 'Out for Delivery', icon: Navigation, color: 'orange', description: 'Final delivery in progress' },
  { value: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'green', description: 'Successfully delivered' }
]

export default function CourierCheckpointPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  
  const [step, setStep] = useState('auth') // 'auth' | 'scan' | 'form' | 'success'
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState(null)
  const [shipmentInfo, setShipmentInfo] = useState(null)
  const [result, setResult] = useState(null)
  const [location, setLocation] = useState(null)
  const [gettingLocation, setGettingLocation] = useState(false)

  // QR Scanner state
  const [scanning, setScanning] = useState(false)
  const [flashlight, setFlashlight] = useState(false)
  const [cameraError, setCameraError] = useState(null)
  const [stream, setStream] = useState(null)

  // Auth form
  const [authData, setAuthData] = useState({
    shipment_id: searchParams.get('shipment') || '',
    auth_code: searchParams.get('code') || ''
  })

  // Checkpoint form
  const [formData, setFormData] = useState({
    action: 'checkpoint',
    location: '',
    notes: '',
    photo: null
  })
  const [photoPreview, setPhotoPreview] = useState(null)

  // Auto-verify if params provided
  useEffect(() => {
    if (authData.shipment_id && authData.auth_code && step === 'auth') {
      handleVerify(new Event('submit'))
    }
  }, []) // Only on mount

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [stream])

  // QR Scanner functionality
  const startScanner = async () => {
    setCameraError(null)
    setScanning(true)
    setStep('scan')

    try {
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(mediaStream)
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.play()
        requestAnimationFrame(scanQRCode)
      }
    } catch (err) {
      console.error('Camera error:', err)
      setCameraError('Unable to access camera. Please allow camera permissions or enter details manually.')
      setScanning(false)
      setStep('auth')
    }
  }

  const stopScanner = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setScanning(false)
    setFlashlight(false)
  }, [stream])

  const toggleFlashlight = async () => {
    if (!stream) return
    
    const track = stream.getVideoTracks()[0]
    const capabilities = track.getCapabilities()
    
    if (capabilities.torch) {
      await track.applyConstraints({
        advanced: [{ torch: !flashlight }]
      })
      setFlashlight(!flashlight)
    }
  }

  const scanQRCode = useCallback(() => {
    if (!scanning || !videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      
      // Use browser's built-in barcode detection if available
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new BarcodeDetector({ formats: ['qr_code'] })
        barcodeDetector.detect(imageData)
          .then(barcodes => {
            if (barcodes.length > 0) {
              handleQRCodeDetected(barcodes[0].rawValue)
            } else {
              requestAnimationFrame(scanQRCode)
            }
          })
          .catch(() => {
            requestAnimationFrame(scanQRCode)
          })
      } else {
        // Fallback: try to parse URL-like patterns
        requestAnimationFrame(scanQRCode)
      }
    } else {
      requestAnimationFrame(scanQRCode)
    }
  }, [scanning])

  const handleQRCodeDetected = (data) => {
    stopScanner()
    
    // Parse QR code data - expected formats:
    // URL: https://chaintrack.app/courier/checkpoint?shipment=SHP-XXX&code=XXX
    // JSON: {"shipment_id": "SHP-XXX", "auth_code": "XXX"}
    // Plain: SHP-XXX:AUTH-CODE
    
    try {
      // Try URL format
      if (data.includes('shipment=') || data.includes('code=')) {
        const url = new URL(data)
        const shipment = url.searchParams.get('shipment')
        const code = url.searchParams.get('code')
        if (shipment && code) {
          setAuthData({ shipment_id: shipment, auth_code: code })
          setStep('auth')
          return
        }
      }

      // Try JSON format
      if (data.startsWith('{')) {
        const parsed = JSON.parse(data)
        if (parsed.shipment_id && parsed.auth_code) {
          setAuthData({ 
            shipment_id: parsed.shipment_id, 
            auth_code: parsed.auth_code 
          })
          setStep('auth')
          return
        }
      }

      // Try plain format (SHIPMENT:CODE)
      if (data.includes(':')) {
        const [shipment, code] = data.split(':')
        if (shipment && code) {
          setAuthData({ shipment_id: shipment.trim(), auth_code: code.trim() })
          setStep('auth')
          return
        }
      }

      // If nothing worked, set whatever we got as shipment ID
      setAuthData(prev => ({ ...prev, shipment_id: data }))
      setStep('auth')
    } catch {
      setAuthData(prev => ({ ...prev, shipment_id: data }))
      setStep('auth')
    }
  }

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }

    setGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        setLocation({ lat: latitude, lng: longitude })
        
        // Try to get a readable address (simplified)
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          )
          const data = await response.json()
          const address = data.display_name?.split(',').slice(0, 3).join(', ') || 
                         `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          setFormData(prev => ({ ...prev, location: address }))
        } catch {
          setFormData(prev => ({
            ...prev,
            location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          }))
        }
        setGettingLocation(false)
      },
      (err) => {
        setError('Failed to get location: ' + err.message)
        setGettingLocation(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // Verify authorization
  const handleVerify = async (e) => {
    e.preventDefault()
    setError(null)

    if (!authData.shipment_id.trim() || !authData.auth_code.trim()) {
      setError('Both Shipment ID and Authorization Code are required')
      return
    }

    setVerifying(true)
    try {
      // Verify authorization
      const authResult = await courierApi.verifyAuthorization({
        shipment_id: authData.shipment_id,
        action: 'checkpoint',
        auth_code: authData.auth_code
      })

      if (!authResult.authorized) {
        setError(authResult.message || 'Authorization failed')
        setVerifying(false)
        return
      }

      // Get shipment info
      try {
        const shipment = await shipmentApi.getShipmentByPIN(
          authData.shipment_id, 
          authData.auth_code
        )
        setShipmentInfo(shipment)
      } catch {
        // Shipment info optional, continue without it
      }

      // Auto get location when entering form
      getCurrentLocation()
      setStep('form')
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.details || 'Authorization failed')
    } finally {
      setVerifying(false)
    }
  }

  // Handle photo
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Photo must be less than 5MB')
        return
      }
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photo: reader.result }))
        setPhotoPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  // Submit checkpoint
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!formData.location.trim()) {
      setError('Location is required')
      return
    }

    setLoading(true)
    try {
      const response = await shipmentApi.addCheckpoint(authData.shipment_id, {
        action: formData.action,
        auth_code: authData.auth_code,
        location: formData.location,
        notes: formData.notes || undefined,
        photo_url: formData.photo || undefined,
        gps_latitude: location?.lat,
        gps_longitude: location?.lng
      })

      setResult(response)
      setStep('success')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record checkpoint')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-20">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Truck className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900 dark:text-white">ChainTrack</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Courier Checkpoint</p>
              </div>
            </div>
            
            <Link
              to="/courier"
              className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <User className="h-4 w-4" />
              Courier Portal
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {/* QR Scanner View */}
          {step === 'scan' && (
            <motion.div
              key="scan"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-30"
            >
              {/* Camera View */}
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Scan Overlay */}
              <div className="absolute inset-0 flex flex-col">
                {/* Top bar */}
                <div className="bg-gradient-to-b from-black/70 to-transparent p-4">
                  <div className="flex items-center justify-between text-white">
                    <button
                      onClick={() => {
                        stopScanner()
                        setStep('auth')
                      }}
                      className="p-2 -m-2"
                    >
                      <X className="h-6 w-6" />
                    </button>
                    <span className="font-medium">Scan QR Code</span>
                    <button onClick={toggleFlashlight} className="p-2 -m-2">
                      {flashlight ? (
                        <Flashlight className="h-6 w-6 text-yellow-400" />
                      ) : (
                        <FlashlightOff className="h-6 w-6" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Scan Frame */}
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="relative w-64 h-64">
                    {/* Corner brackets */}
                    <div className="absolute top-0 left-0 w-12 h-12 border-l-4 border-t-4 border-emerald-400 rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-12 h-12 border-r-4 border-t-4 border-emerald-400 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-12 h-12 border-l-4 border-b-4 border-emerald-400 rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-12 h-12 border-r-4 border-b-4 border-emerald-400 rounded-br-lg" />
                    
                    {/* Scan line animation */}
                    <motion.div
                      className="absolute left-2 right-2 h-0.5 bg-emerald-400 shadow-lg shadow-emerald-400/50"
                      animate={{ top: ['10%', '90%', '10%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    />
                  </div>
                </div>

                {/* Bottom info */}
                <div className="bg-gradient-to-t from-black/70 to-transparent p-6 text-center">
                  <p className="text-white/80 text-sm">
                    Position the QR code within the frame
                  </p>
                  <button
                    onClick={() => {
                      stopScanner()
                      setStep('auth')
                    }}
                    className="mt-4 text-emerald-400 underline text-sm"
                  >
                    Enter manually instead
                  </button>
                </div>
              </div>

              {cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/90 p-6">
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                    <p className="text-white mb-4">{cameraError}</p>
                    <button
                      onClick={() => {
                        stopScanner()
                        setStep('auth')
                      }}
                      className="bg-emerald-600 text-white px-6 py-2 rounded-lg"
                    >
                      Enter Manually
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Step 1: Authorization */}
          {step === 'auth' && (
            <motion.div
              key="auth"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Main Auth Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
                    <KeyRound className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Enter Authorization</h2>
                  <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                    Enter shipment ID and your authorization code
                  </p>
                </div>

                <form onSubmit={handleVerify} className="space-y-4">
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-3 rounded-xl text-sm flex items-center gap-2"
                      >
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Shipment ID
                    </label>
                    <div className="relative">
                      <Package className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={authData.shipment_id}
                        onChange={(e) => setAuthData(prev => ({ ...prev, shipment_id: e.target.value.toUpperCase() }))}
                        placeholder="SHP-XXXXXX"
                        className="w-full pl-11 pr-4 py-3.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg font-mono bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Authorization Code
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={authData.auth_code}
                        onChange={(e) => setAuthData(prev => ({ ...prev, auth_code: e.target.value.toUpperCase() }))}
                        placeholder="XXXXXXXX"
                        className="w-full pl-11 pr-4 py-3.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg font-mono tracking-widest bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={verifying}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3.5 rounded-xl hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition-all"
                  >
                    {verifying ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5" />
                        Verify & Continue
                      </>
                    )}
                  </button>
                </form>

                {/* QR Scanner Button */}
                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={startScanner}
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-xl transition-colors text-gray-700 dark:text-gray-300"
                  >
                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                      <QrCode className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-medium">Scan QR Code</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Use camera to scan package QR</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Info Card */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4">
                <div className="flex gap-3">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    <p className="font-medium mb-1">Authorization Required</p>
                    <p className="text-blue-600 dark:text-blue-400">
                      You need a valid authorization code from the shipment owner to record checkpoints. 
                      Contact the sender if you don't have one.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Checkpoint Form */}
          {step === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Shipment Info Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                      <Package className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Shipment</p>
                      <p className="font-bold font-mono text-gray-900 dark:text-white">{authData.shipment_id}</p>
                    </div>
                  </div>
                  {shipmentInfo && (
                    <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-sm font-medium capitalize">
                      {shipmentInfo.status?.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
                
                {shipmentInfo && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">From:</span>
                      <span className="ml-1 text-gray-900 dark:text-white">{shipmentInfo.origin}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">To:</span>
                      <span className="ml-1 text-gray-900 dark:text-white">{shipmentInfo.destination}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Checkpoint Form */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700">
                <button
                  onClick={() => setStep('auth')}
                  className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-4 text-sm"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Change Shipment
                </button>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Record Checkpoint</h2>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-3 rounded-xl text-sm flex items-center gap-2"
                      >
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Action Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Action Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {actionOptions.map((option) => {
                        const Icon = option.icon
                        const isSelected = formData.action === option.value
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, action: option.value }))}
                            className={`p-3 rounded-xl border-2 transition-all text-left ${
                              isSelected
                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30'
                                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                            }`}
                          >
                            <Icon className={`h-5 w-5 mb-1 ${
                              isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'
                            }`} />
                            <p className={`text-sm font-medium ${
                              isSelected ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'
                            }`}>
                              {option.label}
                            </p>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Location *
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          value={formData.location}
                          onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                          placeholder="Enter or detect location"
                          className="w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={getCurrentLocation}
                        disabled={gettingLocation}
                        className="px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors flex items-center gap-2"
                        title="Get current location"
                      >
                        {gettingLocation ? (
                          <Loader2 className="h-5 w-5 animate-spin text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Navigation className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        )}
                      </button>
                    </div>
                    {location && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        GPS coordinates captured
                      </p>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Notes (optional)
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Any additional notes about this checkpoint..."
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 resize-none"
                    />
                  </div>

                  {/* Photo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Photo (optional)
                    </label>
                    {photoPreview ? (
                      <div className="relative">
                        <img 
                          src={photoPreview} 
                          alt="Preview" 
                          className="w-full h-40 object-cover rounded-xl" 
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoPreview(null)
                            setFormData(prev => ({ ...prev, photo: null }))
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors flex flex-col items-center justify-center gap-2"
                      >
                        <Camera className="h-8 w-8 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400 text-sm">Take or Upload Photo</span>
                      </button>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoChange}
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3.5 rounded-xl hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition-all"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Recording...
                      </>
                    ) : (
                      <>
                        <Shield className="h-5 w-5" />
                        Record Checkpoint
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* Step 3: Success */}
          {step === 'success' && result && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 text-center border border-gray-100 dark:border-gray-700"
            >
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30"
              >
                <CheckCircle className="h-10 w-10 text-white" />
              </motion.div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Checkpoint Recorded!</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Your checkpoint has been recorded and verified on-chain.
              </p>

              {/* Chain Entry Info */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6 text-left space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Action</span>
                  <span className="font-medium text-gray-900 dark:text-white capitalize">
                    {result.checkpoint?.action?.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Location</span>
                  <span className="font-medium text-gray-900 dark:text-white text-right max-w-[60%] truncate">
                    {result.checkpoint?.location}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
                  <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-sm font-medium capitalize">
                    {result.shipment_status?.replace(/_/g, ' ')}
                  </span>
                </div>
                
                {result.chain_entry && (
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-3 mt-3">
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                      <Hash className="h-4 w-4" />
                      <span>Chain Entry #{result.chain_entry.sequence}</span>
                    </div>
                    <p className="font-mono text-xs text-gray-600 dark:text-gray-400 break-all">
                      {result.chain_entry.hash?.substring(0, 40)}...
                    </p>
                  </div>
                )}

                {result.chain_entry?.blockchain_pending && (
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
                    <Clock className="h-4 w-4" />
                    Pending blockchain confirmation
                  </div>
                )}

                {result.blockchain_tx && (
                  <a
                    href={`https://sepolia.etherscan.io/tx/${result.blockchain_tx}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View on Blockchain
                  </a>
                )}
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setStep('form')
                    setFormData({
                      action: 'checkpoint',
                      location: '',
                      notes: '',
                      photo: null
                    })
                    setPhotoPreview(null)
                    setError(null)
                    getCurrentLocation()
                  }}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 rounded-xl hover:from-emerald-600 hover:to-teal-700 font-medium shadow-lg shadow-emerald-500/30 transition-all"
                >
                  Record Another Checkpoint
                </button>
                <button
                  onClick={() => {
                    setStep('auth')
                    setAuthData({ shipment_id: '', auth_code: '' })
                    setShipmentInfo(null)
                    setLocation(null)
                  }}
                  className="w-full border border-gray-300 dark:border-gray-600 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-gray-700 dark:text-gray-300 transition-colors"
                >
                  Different Shipment
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700 py-3 px-4">
        <div className="max-w-lg mx-auto flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span>Secured by blockchain verification</span>
        </div>
      </footer>
    </div>
  )
}
