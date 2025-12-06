/**
 * SettingsPage
 * 
 * User settings including profile, password, notifications, and wallet.
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, 
  Lock, 
  Bell, 
  Wallet,
  Save,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Mail,
  Building,
  Phone,
  MapPin,
  Globe,
  Shield,
  Link as LinkIcon,
  Copy,
  CheckCircle,
  Key,
  Smartphone,
  X
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { authService } from '../services/productService'
import { Button, LoadingSpinner } from '../components/common'
import api from '../services/api'

// Tab configuration
const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'wallet', label: 'Wallet', icon: Wallet },
]

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore()
  const [activeTab, setActiveTab] = useState('profile')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState(null)
  
  // Fetch fresh user data on mount to get latest fields like user_id
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await authService.getCurrentUser()
        if (response.user) {
          updateUser(response.user)
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error)
      }
    }
    fetchUserData()
  }, [updateUser])
  
  // Profile form state
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    company_name: user?.company_name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    website: user?.website || '',
  })
  
  // Password form state
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  
  // Notification preferences
  const [notifications, setNotifications] = useState({
    email_transfers: true,
    email_verifications: true,
    email_newsletter: false,
    push_transfers: true,
    push_verifications: false,
  })
  
  // Wallet state
  const [walletAddress, setWalletAddress] = useState(user?.wallet_address || '')
  const [copied, setCopied] = useState(false)
  
  // 2FA state
  const [twoFactorStatus, setTwoFactorStatus] = useState({
    is_enabled: false,
    method: null,
    has_backup_codes: false
  })
  const [twoFactorStep, setTwoFactorStep] = useState(null) // 'setup', 'verify', 'backup', 'disable'
  const [otpCode, setOtpCode] = useState('')
  const [disablePassword, setDisablePassword] = useState('')
  const [backupCodes, setBackupCodes] = useState([])
  const [twoFactorLoading, setTwoFactorLoading] = useState(false)
  
  // Fetch 2FA status
  useEffect(() => {
    const fetch2FAStatus = async () => {
      try {
        const response = await api.get('/auth/2fa/status')
        setTwoFactorStatus(response.data)
      } catch (error) {
        console.error('Failed to fetch 2FA status:', error)
      }
    }
    fetch2FAStatus()
  }, [])

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  // Handle profile update
  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const response = await authService.updateProfile(profile)
      updateUser(response.user)
      showMessage('success', 'Profile updated successfully')
    } catch (error) {
      showMessage('error', error.response?.data?.error || 'Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle password change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    
    if (passwords.new !== passwords.confirm) {
      showMessage('error', 'Passwords do not match')
      return
    }
    
    if (passwords.new.length < 8) {
      showMessage('error', 'Password must be at least 8 characters')
      return
    }
    
    setIsLoading(true)
    
    try {
      await authService.changePassword(passwords.current, passwords.new)
      setPasswords({ current: '', new: '', confirm: '' })
      showMessage('success', 'Password changed successfully')
    } catch (error) {
      showMessage('error', error.response?.data?.error || 'Failed to change password')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle notification preferences update
  const handleNotificationChange = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  // ========== 2FA Functions ==========
  
  // Start 2FA setup
  const initiate2FASetup = async () => {
    setTwoFactorLoading(true)
    try {
      const response = await api.post('/auth/2fa/setup/initiate')
      showMessage('success', response.data.message)
      setTwoFactorStep('verify')
    } catch (error) {
      showMessage('error', error.response?.data?.error || 'Failed to initiate 2FA setup')
    } finally {
      setTwoFactorLoading(false)
    }
  }
  
  // Verify OTP and complete 2FA setup
  const verify2FASetup = async () => {
    if (otpCode.length !== 6) {
      showMessage('error', 'Please enter a 6-digit code')
      return
    }
    
    setTwoFactorLoading(true)
    try {
      const response = await api.post('/auth/2fa/setup/verify', { code: otpCode })
      setBackupCodes(response.data.backup_codes)
      setTwoFactorStep('backup')
      setOtpCode('')
      showMessage('success', '2FA enabled successfully!')
    } catch (error) {
      showMessage('error', error.response?.data?.error || 'Invalid verification code')
    } finally {
      setTwoFactorLoading(false)
    }
  }
  
  // Finish 2FA setup (after viewing backup codes)
  const finish2FASetup = () => {
    setTwoFactorStep(null)
    setBackupCodes([])
    setTwoFactorStatus(prev => ({ ...prev, is_enabled: true, has_backup_codes: true }))
  }
  
  // Disable 2FA
  const disable2FA = async () => {
    if (!disablePassword) {
      showMessage('error', 'Please enter your password')
      return
    }
    
    setTwoFactorLoading(true)
    try {
      await api.post('/auth/2fa/disable', { password: disablePassword })
      setTwoFactorStatus(prev => ({ ...prev, is_enabled: false }))
      setTwoFactorStep(null)
      setDisablePassword('')
      showMessage('success', 'Two-factor authentication disabled')
    } catch (error) {
      showMessage('error', error.response?.data?.error || 'Failed to disable 2FA')
    } finally {
      setTwoFactorLoading(false)
    }
  }
  
  // Regenerate backup codes
  const regenerateBackupCodes = async () => {
    if (!disablePassword) {
      showMessage('error', 'Please enter your password')
      return
    }
    
    setTwoFactorLoading(true)
    try {
      const response = await api.post('/auth/2fa/backup-codes/regenerate', { password: disablePassword })
      setBackupCodes(response.data.backup_codes)
      setTwoFactorStep('backup')
      setDisablePassword('')
      showMessage('success', 'New backup codes generated!')
    } catch (error) {
      showMessage('error', error.response?.data?.error || 'Failed to regenerate backup codes')
    } finally {
      setTwoFactorLoading(false)
    }
  }
  
  // Copy backup codes to clipboard
  const copyBackupCodes = () => {
    const codesText = backupCodes.join('\n')
    navigator.clipboard.writeText(codesText)
    showMessage('success', 'Backup codes copied to clipboard!')
  }

  // Save notification preferences
  const saveNotifications = async () => {
    setIsLoading(true)
    try {
      // In a real app, this would call an API
      await new Promise(resolve => setTimeout(resolve, 1000))
      showMessage('success', 'Notification preferences saved')
    } catch (error) {
      showMessage('error', 'Failed to save preferences')
    } finally {
      setIsLoading(false)
    }
  }

  // Copy wallet address
  const copyWalletAddress = () => {
    navigator.clipboard.writeText(walletAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Connect wallet (placeholder for MetaMask integration)
  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        })
        setWalletAddress(accounts[0])
        showMessage('success', 'Wallet connected successfully')
      } catch (error) {
        showMessage('error', 'Failed to connect wallet')
      }
    } else {
      showMessage('error', 'Please install MetaMask to connect your wallet')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Message Alert */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-lg flex items-center gap-3 ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="flex-shrink-0" size={20} />
            ) : (
              <AlertCircle className="flex-shrink-0" size={20} />
            )}
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
        <div className="border-b dark:border-gray-700">
          <nav className="flex -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition
                  ${activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={handleProfileSubmit}
              className="space-y-6"
            >
              {/* User ID Card */}
              {user?.user_id && (
                <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-primary-800 dark:text-primary-200">Your User ID</p>
                      <p className="text-xs text-primary-600 dark:text-primary-400 mt-0.5">
                        Share this ID with others to receive transfers directly to your account
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="px-3 py-2 bg-white dark:bg-gray-800 border border-primary-200 dark:border-primary-700 rounded-lg text-primary-700 dark:text-primary-300 font-mono font-bold">
                        {user.user_id}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(user.user_id)
                          showMessage('success', 'User ID copied to clipboard!')
                        }}
                        className="p-2 text-primary-600 hover:bg-primary-100 dark:hover:bg-primary-900/30 rounded-lg transition"
                        title="Copy User ID"
                      >
                        <Copy size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Company Name
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={profile.company_name}
                      onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Your Company Inc."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                    <textarea
                      value={profile.address}
                      onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                      rows={2}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="123 Main St, City, Country"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Website
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="url"
                      value={profile.website}
                      onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="https://yourcompany.com"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t dark:border-gray-700">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? <LoadingSpinner size="sm" /> : <Save size={18} />}
                  Save Changes
                </Button>
              </div>
            </motion.form>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              {/* Change Password */}
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Shield size={20} />
                  Change Password
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwords.current}
                        onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                        className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwords.new}
                        onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                        className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwords.confirm}
                        onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                        className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                <Button type="submit" disabled={isLoading}>
                  {isLoading ? <LoadingSpinner size="sm" /> : <Lock size={18} />}
                  Update Password
                </Button>
              </form>

              {/* Two-Factor Authentication */}
              <div className="pt-8 border-t dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <Shield size={20} />
                      Two-Factor Authentication
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  {twoFactorStatus.is_enabled && (
                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm font-medium">
                      <CheckCircle size={16} />
                      Enabled
                    </span>
                  )}
                </div>
                
                {/* 2FA Status & Actions */}
                {!twoFactorStep && (
                  <div className="space-y-4">
                    {twoFactorStatus.is_enabled ? (
                      <>
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <Shield className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" size={20} />
                            <div>
                              <p className="font-medium text-green-800 dark:text-green-200">2FA is enabled</p>
                              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                                Your account is protected with email-based verification codes.
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-3">
                          <Button 
                            variant="outline" 
                            onClick={() => setTwoFactorStep('regenerate')}
                          >
                            <Key size={18} />
                            Regenerate Backup Codes
                          </Button>
                          <Button 
                            variant="outline" 
                            className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
                            onClick={() => setTwoFactorStep('disable')}
                          >
                            <X size={18} />
                            Disable 2FA
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" size={20} />
                            <div>
                              <p className="font-medium text-amber-800 dark:text-amber-200">2FA is not enabled</p>
                              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                                Enable two-factor authentication to add an extra layer of security.
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <Button onClick={initiate2FASetup} disabled={twoFactorLoading}>
                          {twoFactorLoading ? <LoadingSpinner size="sm" /> : <Smartphone size={18} />}
                          Enable 2FA
                        </Button>
                      </>
                    )}
                  </div>
                )}
                
                {/* 2FA Setup - Verify Code Step */}
                {twoFactorStep === 'verify' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">Enter Verification Code</h4>
                      <button
                        onClick={() => { setTwoFactorStep(null); setOtpCode('') }}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <X size={20} />
                      </button>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      We've sent a 6-digit verification code to your email address. Enter it below to enable 2FA.
                    </p>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Verification Code
                      </label>
                      <input
                        type="text"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        maxLength={6}
                        className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    
                    <div className="flex gap-3">
                      <Button onClick={verify2FASetup} disabled={twoFactorLoading || otpCode.length !== 6}>
                        {twoFactorLoading ? <LoadingSpinner size="sm" /> : <Check size={18} />}
                        Verify & Enable
                      </Button>
                      <Button variant="outline" onClick={initiate2FASetup} disabled={twoFactorLoading}>
                        Resend Code
                      </Button>
                    </div>
                  </motion.div>
                )}
                
                {/* 2FA Setup - Backup Codes Step */}
                {twoFactorStep === 'backup' && backupCodes.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 space-y-4"
                  >
                    <div className="flex items-center gap-2">
                      <Key className="text-primary-600" size={20} />
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">Save Your Backup Codes</h4>
                    </div>
                    
                    <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg p-3">
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        <strong>Important:</strong> Save these backup codes in a secure location. You won't be able to see them again! Use them to access your account if you lose access to your email.
                      </p>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-2">
                        {backupCodes.map((code, index) => (
                          <code key={index} className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded text-center font-mono text-sm">
                            {code}
                          </code>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={copyBackupCodes}>
                        <Copy size={18} />
                        Copy Codes
                      </Button>
                      <Button onClick={finish2FASetup}>
                        <Check size={18} />
                        I've Saved My Codes
                      </Button>
                    </div>
                  </motion.div>
                )}
                
                {/* Disable 2FA */}
                {twoFactorStep === 'disable' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-red-800 dark:text-red-200">Disable Two-Factor Authentication</h4>
                      <button
                        onClick={() => { setTwoFactorStep(null); setDisablePassword('') }}
                        className="text-red-400 hover:text-red-600"
                      >
                        <X size={20} />
                      </button>
                    </div>
                    
                    <p className="text-sm text-red-700 dark:text-red-300">
                      This will remove the extra security layer from your account. Enter your password to confirm.
                    </p>
                    
                    <div>
                      <label className="block text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={disablePassword}
                        onChange={(e) => setDisablePassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full px-4 py-3 border border-red-300 dark:border-red-700 rounded-lg text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                    
                    <Button 
                      className="bg-red-600 hover:bg-red-700 text-white"
                      onClick={disable2FA} 
                      disabled={twoFactorLoading}
                    >
                      {twoFactorLoading ? <LoadingSpinner size="sm" /> : <X size={18} />}
                      Disable 2FA
                    </Button>
                  </motion.div>
                )}
                
                {/* Regenerate Backup Codes */}
                {twoFactorStep === 'regenerate' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">Regenerate Backup Codes</h4>
                      <button
                        onClick={() => { setTwoFactorStep(null); setDisablePassword('') }}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <X size={20} />
                      </button>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      This will invalidate your current backup codes and generate new ones. Enter your password to continue.
                    </p>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={disablePassword}
                        onChange={(e) => setDisablePassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    
                    <Button onClick={regenerateBackupCodes} disabled={twoFactorLoading}>
                      {twoFactorLoading ? <LoadingSpinner size="sm" /> : <Key size={18} />}
                      Generate New Codes
                    </Button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Email Notifications</h3>
              
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Transfer Updates</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Receive emails when products are transferred to or from you
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.email_transfers}
                    onChange={() => handleNotificationChange('email_transfers')}
                    className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Verification Alerts</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Get notified when your products are verified by consumers
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.email_verifications}
                    onChange={() => handleNotificationChange('email_verifications')}
                    className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Newsletter</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Receive updates about new features and industry news
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.email_newsletter}
                    onChange={() => handleNotificationChange('email_newsletter')}
                    className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                  />
                </label>
              </div>

              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 pt-6">Push Notifications</h3>
              
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Transfer Updates</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Receive push notifications for transfer activities
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.push_transfers}
                    onChange={() => handleNotificationChange('push_transfers')}
                    className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Verification Alerts</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Receive push notifications when products are verified
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.push_verifications}
                    onChange={() => handleNotificationChange('push_verifications')}
                    className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                  />
                </label>
              </div>

              <div className="flex justify-end pt-4 border-t dark:border-gray-700">
                <Button onClick={saveNotifications} disabled={isLoading}>
                  {isLoading ? <LoadingSpinner size="sm" /> : <Save size={18} />}
                  Save Preferences
                </Button>
              </div>
            </motion.div>
          )}

          {/* Wallet Tab */}
          {activeTab === 'wallet' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-6 text-white">
                <h3 className="text-lg font-medium mb-2">Blockchain Wallet</h3>
                <p className="text-primary-100 text-sm">
                  Connect your Ethereum wallet to sign blockchain transactions
                </p>
              </div>

              {walletAddress ? (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Connected Wallet Address</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-sm font-mono bg-white dark:bg-gray-800 px-3 py-2 rounded border dark:border-gray-600 break-all text-gray-900 dark:text-gray-100">
                        {walletAddress}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyWalletAddress}
                      >
                        {copied ? <Check size={18} /> : <Copy size={18} />}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle size={18} />
                    <span className="text-sm font-medium">Wallet Connected</span>
                  </div>

                  <div className="p-4 bg-amber-50 dark:bg-amber-900/30 rounded-lg border border-amber-200 dark:border-amber-700">
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      <strong>Note:</strong> This wallet will be used to sign product registrations 
                      and transfer confirmations on the Ethereum Sepolia testnet.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Wallet size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">No wallet connected</p>
                  <Button onClick={connectWallet}>
                    <LinkIcon size={18} />
                    Connect MetaMask Wallet
                  </Button>
                </div>
              )}

              <div className="pt-6 border-t dark:border-gray-700">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Test Network Faucets</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Get free test ETH for the Sepolia testnet to use with ChainTrack.
                </p>
                <div className="flex gap-4">
                  <a
                    href="https://sepoliafaucet.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline text-sm"
                  >
                    Sepolia Faucet →
                  </a>
                  <a
                    href="https://www.alchemy.com/faucets/ethereum-sepolia"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline text-sm"
                  >
                    Alchemy Faucet →
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
