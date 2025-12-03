/**
 * Courier Authorizations List
 * Shows all authorized couriers for a shipment
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  Phone,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Copy,
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { courierApi } from '../../services/courierApi'

export default function CourierAuthorizationsList({ shipmentId, onAuthorizeCourier }) {
  const [authorizations, setAuthorizations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState(true)
  const [revoking, setRevoking] = useState(null)

  const fetchAuthorizations = async () => {
    try {
      const result = await courierApi.getAuthorizations(shipmentId)
      setAuthorizations(result.authorizations || [])
      setError(null)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load authorizations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAuthorizations()
  }, [shipmentId])

  const handleRevoke = async (authId) => {
    if (!confirm('Are you sure you want to revoke this authorization?')) return
    
    setRevoking(authId)
    try {
      await courierApi.revokeAuthorization(authId)
      await fetchAuthorizations()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to revoke authorization')
    } finally {
      setRevoking(null)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center gap-2 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading authorizations...
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-emerald-600" />
          <span className="font-semibold text-gray-900">Authorized Couriers</span>
          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-sm rounded-full">
            {authorizations.length}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-100">
              {error && (
                <div className="p-4 bg-red-50 text-red-700 text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              {authorizations.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <User className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 mb-4">No couriers authorized yet</p>
                  <button
                    onClick={onAuthorizeCourier}
                    className="text-emerald-600 hover:text-emerald-700 font-medium text-sm"
                  >
                    + Authorize a courier
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {authorizations.map((auth) => (
                    <div key={auth.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            auth.status.is_valid ? 'bg-emerald-100' : 'bg-gray-100'
                          }`}>
                            <User className={`h-5 w-5 ${
                              auth.status.is_valid ? 'text-emerald-600' : 'text-gray-400'
                            }`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">
                                {auth.courier?.name || 'Unknown'}
                              </span>
                              {auth.status.is_valid ? (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  Active
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full flex items-center gap-1">
                                  <XCircle className="h-3 w-3" />
                                  Expired/Revoked
                                </span>
                              )}
                            </div>
                            {auth.courier?.phone && (
                              <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                                <Phone className="h-3 w-3" />
                                {auth.courier.phone}
                              </div>
                            )}
                            
                            {/* Auth Code */}
                            {auth.status.is_valid && (
                              <div className="flex items-center gap-2 mt-2">
                                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                  {auth.auth_code}
                                </span>
                                <button
                                  onClick={() => copyToClipboard(auth.auth_code)}
                                  className="p-1 hover:bg-gray-100 rounded"
                                  title="Copy code"
                                >
                                  <Copy className="h-3 w-3 text-gray-500" />
                                </button>
                              </div>
                            )}

                            {/* Permissions */}
                            <div className="flex flex-wrap gap-1 mt-2">
                              {auth.permissions?.can_pickup && (
                                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-xs rounded">
                                  Pickup
                                </span>
                              )}
                              {auth.permissions?.can_checkpoint && (
                                <span className="px-1.5 py-0.5 bg-purple-50 text-purple-600 text-xs rounded">
                                  Checkpoints
                                </span>
                              )}
                              {auth.permissions?.can_deliver && (
                                <span className="px-1.5 py-0.5 bg-green-50 text-green-600 text-xs rounded">
                                  Deliver
                                </span>
                              )}
                              {auth.permissions?.can_handoff && (
                                <span className="px-1.5 py-0.5 bg-orange-50 text-orange-600 text-xs rounded">
                                  Handoff
                                </span>
                              )}
                            </div>

                            {/* Usage Stats */}
                            <div className="text-xs text-gray-400 mt-2 space-y-0.5">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Expires: {auth.status.expires_at 
                                  ? new Date(auth.status.expires_at).toLocaleString()
                                  : 'Never'}
                              </div>
                              {auth.usage?.checkpoints_recorded > 0 && (
                                <div>
                                  {auth.usage.checkpoints_recorded} checkpoint(s) recorded
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Revoke Button */}
                        {auth.status.is_valid && (
                          <button
                            onClick={() => handleRevoke(auth.id)}
                            disabled={revoking === auth.id}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Revoke authorization"
                          >
                            {revoking === auth.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Button */}
              {authorizations.length > 0 && (
                <div className="p-4 border-t border-gray-100">
                  <button
                    onClick={onAuthorizeCourier}
                    className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-600 hover:border-emerald-400 hover:text-emerald-600 rounded-lg transition-colors text-sm font-medium"
                  >
                    + Authorize Another Courier
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
