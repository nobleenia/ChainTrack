/**
 * SettingsPage
 * 
 * User settings including profile, password, notifications, and wallet.
 */

import { useState } from 'react'
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
  CheckCircle
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { authService } from '../services/productService'
import { Button, LoadingSpinner } from '../components/common'

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
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
                  <Shield size={20} />
                  Two-Factor Authentication
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  Add an extra layer of security to your account by enabling two-factor authentication.
                </p>
                <Button variant="outline">
                  Enable 2FA
                </Button>
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
