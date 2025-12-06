/**
 * ClaimTransferPage
 * 
 * Public page for claiming transfers via claim token link.
 * Allows external recipients to claim ownership without needing an account.
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Package,
  User,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Shield,
  Clock,
  MapPin,
  Loader,
  XCircle,
  Mail,
  Lock,
  UserPlus
} from 'lucide-react'
import { transferService } from '../services/productService'
import { useAuthStore } from '../store/authStore'
import { Button, LoadingSpinner } from '../components/common'

export default function ClaimTransferPage() {
  const { claimToken } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, user, login } = useAuthStore()

  // State
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [transferData, setTransferData] = useState(null)
  const [productData, setProductData] = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [claimed, setClaimed] = useState(false)
  
  // Account creation options
  const [createAccount, setCreateAccount] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')

  // Fetch claim details
  useEffect(() => {
    const fetchClaimDetails = async () => {
      try {
        const data = await transferService.getClaimDetails(claimToken)
        setTransferData(data.transfer)
        setProductData(data.product)
        setName(data.transfer.recipient_name || '')
      } catch (err) {
        setError(err.response?.data?.error || 'Invalid or expired claim link')
      } finally {
        setIsLoading(false)
      }
    }

    if (claimToken) {
      fetchClaimDetails()
    }
  }, [claimToken])

  // Handle claim
  const handleClaim = async () => {
    // Validation for account creation
    if (createAccount) {
      if (!email || !password) {
        setError('Email and password are required to create an account')
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters')
        return
      }
    }

    setIsClaiming(true)
    setError(null)

    try {
      const claimData = {
        confirm_irreversible: true,
      }

      if (createAccount) {
        claimData.create_account = true
        claimData.email = email
        claimData.password = password
        claimData.name = name || transferData?.recipient_name
      }

      const result = await transferService.claimTransfer(claimToken, claimData)
      setClaimed(true)

      // If account was created, log them in
      if (result.access_token) {
        login(result.user, result.access_token, result.refresh_token)
        // Redirect to dashboard after a moment
        setTimeout(() => navigate('/dashboard'), 2000)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to claim transfer')
    } finally {
      setIsClaiming(false)
    }
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="xl" text="Loading transfer details..." />
      </div>
    )
  }

  // Error state (invalid/expired link)
  if (error && !transferData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <XCircle className="text-red-600 dark:text-red-400" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Invalid Claim Link
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {error}
          </p>
          <Link to="/">
            <Button>Go to Homepage</Button>
          </Link>
        </motion.div>
      </div>
    )
  }

  // Success state (claimed)
  if (claimed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
          >
            <CheckCircle className="text-green-600 dark:text-green-400" size={40} />
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Transfer Claimed!
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-2">
            You are now the owner of <strong>{productData?.name}</strong>.
          </p>
          {isAuthenticated && (
            <p className="text-sm text-green-600 dark:text-green-400 mb-6">
              Redirecting to your dashboard...
            </p>
          )}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-800 dark:text-green-300 flex items-center justify-center gap-2">
              <Shield size={16} />
              This transfer has been recorded on the blockchain
            </p>
          </div>
          {!isAuthenticated && (
            <Link to="/login">
              <Button>Login to Manage Your Products</Button>
            </Link>
          )}
        </motion.div>
      </div>
    )
  }

  // Main claim form
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <Package className="text-primary-600 dark:text-primary-400" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Claim Product Transfer
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {transferData?.sender} is transferring ownership of a product to you
          </p>
        </motion.div>

        {/* Transfer Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden mb-6"
        >
          {/* Product Info */}
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                <Package className="text-primary-600 dark:text-primary-400" size={28} />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {productData?.name}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Product ID: {productData?.product_id}
                </p>
                {productData?.description && (
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {productData.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Transfer Flow */}
          <div className="p-6 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center mb-2">
                  <User className="text-gray-600 dark:text-gray-300" size={24} />
                </div>
                <p className="font-medium text-gray-900 dark:text-gray-100">{transferData?.sender}</p>
                <p className="text-xs text-gray-500">Sender</p>
              </div>

              <ArrowRight className="text-primary-500" size={24} />

              <div className="text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-2">
                  <User className="text-primary-600 dark:text-primary-400" size={24} />
                </div>
                <p className="font-medium text-gray-900 dark:text-gray-100">{transferData?.recipient_name}</p>
                <p className="text-xs text-gray-500">You</p>
              </div>
            </div>
          </div>

          {/* Transfer Info */}
          <div className="p-6 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <MapPin size={16} className="text-gray-400" />
              <span className="text-gray-600 dark:text-gray-300">Location: {transferData?.location}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Clock size={16} className="text-gray-400" />
              <span className="text-gray-600 dark:text-gray-300">Initiated: {formatDate(transferData?.created_at)}</span>
            </div>
            {transferData?.notes && (
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-300 italic">"{transferData.notes}"</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Warning Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4 mb-6"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" size={20} />
            <div>
              <h3 className="font-medium text-yellow-800 dark:text-yellow-300">Important Notice</h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                By claiming this transfer, you confirm that you have received this product and accept full ownership. 
                This action is <strong>irreversible</strong> and will be permanently recorded on the blockchain.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Create Account Option */}
        {!isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                id="createAccount"
                checked={createAccount}
                onChange={(e) => setCreateAccount(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="createAccount" className="font-medium text-gray-900 dark:text-gray-100 cursor-pointer">
                Create an account to manage this product
              </label>
            </div>

            {createAccount && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Your Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      required
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      required
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-6"
          >
            <p className="text-red-700 dark:text-red-400 flex items-center gap-2">
              <XCircle size={18} />
              {error}
            </p>
          </motion.div>
        )}

        {/* Claim Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button
            size="lg"
            onClick={handleClaim}
            isLoading={isClaiming}
            leftIcon={<CheckCircle size={20} />}
            className="flex-1 sm:flex-none"
          >
            {createAccount ? 'Claim & Create Account' : 'Claim Product Ownership'}
          </Button>
        </motion.div>

        {/* Already have account? */}
        {!isAuthenticated && !createAccount && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Login first
            </Link>{' '}
            to claim this product under your account.
          </p>
        )}
      </div>
    </div>
  )
}
