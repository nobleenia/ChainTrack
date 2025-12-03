/**
 * Authorize Courier Modal
 * Allows sender to authorize a courier for their shipment
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  X,
  User,
  Phone,
  Truck,
  Copy,
  CheckCircle,
  AlertCircle,
  Loader2,
  Shield,
  Clock,
  Package,
  MapPin,
  Share2,
  Link2
} from 'lucide-react'
import { courierApi } from '../../services/courierApi'
import ShareCourierLinkModal from './ShareCourierLinkModal'

export default function AuthorizeCourierModal({ shipmentId, onClose, onSuccess }) {
  const [step, setStep] = useState('form') // 'form' | 'success'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [authResult, setAuthResult] = useState(null)
  const [copied, setCopied] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)

  const [formData, setFormData] = useState({
    courier_name: '',
    courier_phone: '',
    can_pickup: true,
    can_checkpoint: true,
    can_deliver: true,
    can_handoff: false,
    expires_in_hours: 48
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!formData.courier_name.trim()) {
      setError('Courier name is required')
      return
    }

    setLoading(true)
    try {
      const result = await courierApi.authorizeCourier(shipmentId, {
        courier_name: formData.courier_name,
        courier_phone: formData.courier_phone || undefined,
        can_pickup: formData.can_pickup,
        can_checkpoint: formData.can_checkpoint,
        can_deliver: formData.can_deliver,
        can_handoff: formData.can_handoff,
        expires_in_hours: parseInt(formData.expires_in_hours) || 48
      })
      setAuthResult(result.authorization)
      setStep('success')
      onSuccess?.()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to authorize courier')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
              <Truck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {step === 'form' ? 'Authorize Courier' : 'Courier Authorized!'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {step === 'form' ? 'Grant access to handle this shipment' : 'Share the code with the courier'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {step === 'form' ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-3 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Courier Info */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Courier Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="courier_name"
                  value={formData.courier_name}
                  onChange={handleChange}
                  placeholder="e.g., John Doe"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Courier Phone (optional)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  name="courier_phone"
                  value={formData.courier_phone}
                  onChange={handleChange}
                  placeholder="+234 xxx xxx xxxx"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Permissions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Permissions
              </label>
              <div className="space-y-2 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="can_pickup"
                    checked={formData.can_pickup}
                    onChange={handleChange}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600"
                  />
                  <Package className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Can pickup package</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="can_checkpoint"
                    checked={formData.can_checkpoint}
                    onChange={handleChange}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600"
                  />
                  <MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Can record checkpoints</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="can_deliver"
                    checked={formData.can_deliver}
                    onChange={handleChange}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600"
                  />
                  <CheckCircle className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Can mark as delivered</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="can_handoff"
                    checked={formData.can_handoff}
                    onChange={handleChange}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600"
                  />
                  <Truck className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Can hand off to another courier</span>
                </label>
              </div>
            </div>

            {/* Expiration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Authorization Expires In
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  name="expires_in_hours"
                  value={formData.expires_in_hours}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="24">24 hours</option>
                  <option value="48">48 hours</option>
                  <option value="72">72 hours</option>
                  <option value="168">1 week</option>
                </select>
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-emerald-600 text-white px-4 py-2.5 rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Authorizing...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    Authorize
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Success State */
          <div className="p-6 space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Share this authorization code with <strong className="text-gray-900 dark:text-white">{authResult?.courier?.name}</strong>
              </p>
            </div>

            {/* Auth Code Display */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-2 border-emerald-200 dark:border-emerald-700 rounded-xl p-6 text-center">
              <p className="text-sm text-emerald-700 dark:text-emerald-400 mb-2">Authorization Code</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-4xl font-mono font-bold tracking-wider text-emerald-700 dark:text-emerald-400">
                  {authResult?.auth_code}
                </span>
                <button
                  onClick={() => copyToClipboard(authResult?.auth_code)}
                  className="p-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                  title="Copy code"
                >
                  {copied ? (
                    <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Copy className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  )}
                </button>
              </div>
              {copied && (
                <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-2">Copied to clipboard!</p>
              )}
            </div>

            {/* Share Link Button */}
            <button
              onClick={() => setShowShareModal(true)}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-lg hover:bg-emerald-700 font-medium"
            >
              <Share2 className="h-5 w-5" />
              Share Link & QR Code with Courier
            </button>

            {/* Permissions Summary */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Permissions Granted:</p>
              <div className="flex flex-wrap gap-2">
                {authResult?.permissions?.can_pickup && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full">
                    Pickup
                  </span>
                )}
                {authResult?.permissions?.can_checkpoint && (
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded-full">
                    Checkpoints
                  </span>
                )}
                {authResult?.permissions?.can_deliver && (
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                    Deliver
                  </span>
                )}
                {authResult?.permissions?.can_handoff && (
                  <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs rounded-full">
                    Handoff
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Expires: {authResult?.status?.expires_at 
                  ? new Date(authResult.status.expires_at).toLocaleString()
                  : 'Never'}
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <p className="text-sm text-amber-800 dark:text-amber-300">
                <strong>⚠️ Important:</strong> Share this code securely with the courier. 
                They will need it to record checkpoints for this shipment.
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-gray-900 dark:bg-gray-700 text-white px-4 py-3 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 font-medium"
            >
              Done
            </button>
          </div>
        )}

        {/* Share Modal */}
        {showShareModal && authResult && (
          <ShareCourierLinkModal
            shipmentId={shipmentId}
            authCode={authResult.auth_code}
            courierName={authResult.courier?.name}
            expiresAt={authResult.status?.expires_at}
            onClose={() => setShowShareModal(false)}
          />
        )}
      </motion.div>
    </div>
  )
}
