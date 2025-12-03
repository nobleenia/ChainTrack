/**
 * Courier Landing Page
 * Entry point for couriers with two paths:
 * 1. Quick access with authorization code (anonymous)
 * 2. Phone login for verified couriers (dashboard access)
 */

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Truck,
  KeyRound,
  Smartphone,
  Package,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Loader2,
  Shield,
  Clock,
  MapPin,
  ChevronRight,
  User,
  QrCode
} from 'lucide-react'
import useCourierStore from '../../store/courierStore'

export default function CourierLandingPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isAuthenticated, profile, initializeAuth } = useCourierStore()
  
  const [mode, setMode] = useState('landing') // 'landing' | 'auth-code' | 'phone-login'
  const [loading, setLoading] = useState(true)

  // Check if already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      if (isAuthenticated) {
        navigate('/courier/dashboard')
        return
      }
      
      const result = await initializeAuth()
      if (result) {
        navigate('/courier/dashboard')
      }
      setLoading(false)
    }
    
    checkAuth()
  }, [isAuthenticated, initializeAuth, navigate])

  // Check for auth code in URL
  useEffect(() => {
    const code = searchParams.get('code')
    const shipment = searchParams.get('shipment')
    if (code || shipment) {
      setMode('auth-code')
    }
  }, [searchParams])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Truck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 dark:text-white">ChainTrack</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Courier Portal</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {mode === 'landing' && (
            <LandingView 
              key="landing"
              onSelectAuthCode={() => setMode('auth-code')}
              onSelectPhoneLogin={() => setMode('phone-login')}
            />
          )}
          
          {mode === 'auth-code' && (
            <AuthCodeView 
              key="auth-code"
              onBack={() => setMode('landing')}
              initialShipment={searchParams.get('shipment')}
              initialCode={searchParams.get('code')}
            />
          )}
          
          {mode === 'phone-login' && (
            <PhoneLoginView 
              key="phone-login"
              onBack={() => setMode('landing')}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Powered by blockchain technology for transparent, tamper-proof tracking</p>
        </div>
      </footer>
    </div>
  )
}

// Landing View - Choose between auth code or phone login
function LandingView({ onSelectAuthCode, onSelectPhoneLogin }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      {/* Hero */}
      <div className="text-center py-8">
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <Truck className="h-10 w-10 text-emerald-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Courier Portal
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          Record checkpoints, track deliveries, and build your reputation with blockchain-verified records.
        </p>
      </div>

      {/* Options */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Auth Code Option */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onSelectAuthCode}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border-2 border-transparent hover:border-emerald-500 transition text-left"
        >
          <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mb-4">
            <KeyRound className="h-7 w-7 text-emerald-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            I have an Authorization Code
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Enter the code provided by the sender to record a checkpoint or delivery.
          </p>
          <div className="flex items-center text-emerald-600 font-medium">
            Quick Access <ArrowRight className="ml-2 h-4 w-4" />
          </div>
        </motion.button>

        {/* Phone Login Option */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onSelectPhoneLogin}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border-2 border-transparent hover:border-purple-500 transition text-left"
        >
          <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-4">
            <Smartphone className="h-7 w-7 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Sign in with Phone
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Access your dashboard, view assigned shipments, and track your delivery history.
          </p>
          <div className="flex items-center text-purple-600 font-medium">
            Courier Dashboard <ArrowRight className="ml-2 h-4 w-4" />
          </div>
        </motion.button>
      </div>

      {/* Features */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Why use ChainTrack?
        </h3>
        <div className="grid md:grid-cols-3 gap-6">
          <Feature 
            icon={Shield}
            title="Blockchain Verified"
            description="Every checkpoint is recorded on the blockchain for tamper-proof tracking."
          />
          <Feature 
            icon={Clock}
            title="Real-time Updates"
            description="Senders and receivers get instant notifications when you record checkpoints."
          />
          <Feature 
            icon={MapPin}
            title="Location Tracking"
            description="GPS coordinates are captured with each checkpoint for full transparency."
          />
        </div>
      </div>

      {/* Register CTA */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white text-center">
        <h3 className="text-xl font-bold mb-2">New to ChainTrack?</h3>
        <p className="text-emerald-100 mb-4">
          Register as a courier to build your reputation, track deliveries, and access exclusive benefits.
        </p>
        <a 
          href="/courier/register"
          className="inline-flex items-center gap-2 bg-white text-emerald-600 px-6 py-2.5 rounded-xl font-semibold hover:bg-emerald-50 transition"
        >
          <User className="h-5 w-5" />
          Register as Courier
        </a>
      </div>
    </motion.div>
  )
}

function Feature({ icon: Icon, title, description }) {
  return (
    <div className="flex gap-3">
      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
      </div>
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white">{title}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </div>
    </div>
  )
}

// Auth Code View - Quick access with authorization code
function AuthCodeView({ onBack, initialShipment, initialCode }) {
  const navigate = useNavigate()
  const [shipmentId, setShipmentId] = useState(initialShipment || '')
  const [authCode, setAuthCode] = useState(initialCode || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    setError(null)

    if (!shipmentId.trim() || !authCode.trim()) {
      setError('Both Shipment ID and Authorization Code are required')
      return
    }

    // Navigate to checkpoint page with params
    navigate(`/courier/checkpoint?shipment=${shipmentId.toUpperCase()}&code=${authCode.toUpperCase()}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-md mx-auto"
    >
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition"
      >
        <ChevronRight className="h-4 w-4 rotate-180" />
        Back
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <KeyRound className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Enter Authorization</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Enter the shipment ID and your authorization code
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Shipment ID
            </label>
            <div className="relative">
              <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={shipmentId}
                onChange={(e) => setShipmentId(e.target.value.toUpperCase())}
                placeholder="SHP-XXXXXX"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg font-mono bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Authorization Code
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value.toUpperCase())}
                placeholder="XXXXXXXX"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg font-mono tracking-wider bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2 transition"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5" />
                Continue
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            <QrCode className="h-4 w-4 inline mr-1" />
            Scan QR code on package for quick entry
          </p>
        </div>
      </div>
    </motion.div>
  )
}

// Phone Login View
function PhoneLoginView({ onBack }) {
  const navigate = useNavigate()
  const { requestOtp, verifyOtp, isLoading, error, clearError } = useCourierStore()
  
  const [step, setStep] = useState('phone') // 'phone' | 'otp' | 'name'
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [isNewUser, setIsNewUser] = useState(false)
  const [localError, setLocalError] = useState(null)
  const [devOtp, setDevOtp] = useState(null) // For development only

  const handleRequestOtp = async (e) => {
    e.preventDefault()
    setLocalError(null)
    clearError()

    if (!phone.trim()) {
      setLocalError('Phone number is required')
      return
    }

    try {
      const result = await requestOtp(phone, displayName || null)
      
      // Development: store OTP for display
      if (result._dev_otp) {
        setDevOtp(result._dev_otp)
      }
      
      setStep('otp')
    } catch (err) {
      // If new user required
      if (err.response?.data?.error?.includes('display_name')) {
        setIsNewUser(true)
        setStep('name')
      }
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setLocalError(null)
    clearError()

    if (!otp.trim() || otp.length !== 6) {
      setLocalError('Please enter a valid 6-digit OTP')
      return
    }

    try {
      await verifyOtp(phone, otp)
      navigate('/courier/dashboard')
    } catch {
      // Error handled by store
    }
  }

  const handleSetName = async (e) => {
    e.preventDefault()
    if (!displayName.trim()) {
      setLocalError('Name is required')
      return
    }

    try {
      const result = await requestOtp(phone, displayName)
      if (result._dev_otp) {
        setDevOtp(result._dev_otp)
      }
      setStep('otp')
    } catch {
      // Error handled by store
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-md mx-auto"
    >
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition"
      >
        <ChevronRight className="h-4 w-4 rotate-180" />
        Back
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Smartphone className="h-8 w-8 text-purple-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {step === 'phone' && 'Sign in with Phone'}
            {step === 'name' && 'Create Your Profile'}
            {step === 'otp' && 'Enter Verification Code'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {step === 'phone' && 'Enter your phone number to receive a verification code'}
            {step === 'name' && "You're new! Please enter your name"}
            {step === 'otp' && `We sent a code to ${phone}`}
          </p>
        </div>

        {(localError || error) && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-3 rounded-lg text-sm flex items-center gap-2 mb-4">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {localError || error}
          </div>
        )}

        {/* Development OTP Display */}
        {devOtp && step === 'otp' && (
          <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 p-3 rounded-lg text-sm mb-4">
            <strong>Dev Mode:</strong> Your OTP is <code className="font-mono font-bold">{devOtp}</code>
          </div>
        )}

        {/* Phone Step */}
        {step === 'phone' && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2 transition"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Send Verification Code'
              )}
            </button>
          </form>
        )}

        {/* Name Step (for new users) */}
        {step === 'name' && (
          <form onSubmit={handleSetName} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Your Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="John Smith"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2 transition"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Continue'
              )}
            </button>
          </form>
        )}

        {/* OTP Step */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Verification Code
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-center text-2xl font-mono tracking-widest bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2 transition"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Verify & Sign In
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setOtp('')
                setDevOtp(null)
                handleRequestOtp({ preventDefault: () => {} })
              }}
              className="w-full text-purple-600 dark:text-purple-400 py-2 text-sm hover:underline"
            >
              Resend Code
            </button>
          </form>
        )}

        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No password required. We'll send you a one-time code.
          </p>
        </div>
      </div>
    </motion.div>
  )
}
