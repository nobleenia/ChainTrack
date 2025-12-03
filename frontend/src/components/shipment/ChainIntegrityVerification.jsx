/**
 * Chain Integrity Verification Component
 * Displays tamper-proof chain status and verification results
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Link,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Hash,
  Lock
} from 'lucide-react'
import { courierApi } from '../../services/courierApi'

export default function ChainIntegrityVerification({ shipmentId }) {
  const [verification, setVerification] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState(false)
  const [verifying, setVerifying] = useState(false)

  const fetchVerification = async () => {
    try {
      const result = await courierApi.verifyChainIntegrity(shipmentId)
      setVerification(result)
      setError(null)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to verify chain')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVerification()
  }, [shipmentId])

  const handleReVerify = async () => {
    setVerifying(true)
    await fetchVerification()
    setVerifying(false)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center gap-2 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Verifying chain integrity...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      </div>
    )
  }

  if (!verification || verification.checkpoints_verified === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            <Link className="h-5 w-5 text-gray-400" />
          </div>
          <div>
            <p className="font-medium text-gray-900">No Checkpoints Yet</p>
            <p className="text-sm text-gray-500">Chain verification will be available after the first checkpoint</p>
          </div>
        </div>
      </div>
    )
  }

  const isValid = verification.chain_valid

  return (
    <div className={`rounded-xl shadow-sm border-2 ${
      isValid 
        ? 'bg-emerald-50 border-emerald-200' 
        : 'bg-red-50 border-red-200'
    }`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            isValid ? 'bg-emerald-100' : 'bg-red-100'
          }`}>
            {isValid ? (
              <ShieldCheck className="h-6 w-6 text-emerald-600" />
            ) : (
              <ShieldAlert className="h-6 w-6 text-red-600" />
            )}
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className={`font-semibold ${isValid ? 'text-emerald-900' : 'text-red-900'}`}>
                {isValid ? 'Chain Verified' : 'Chain Compromised'}
              </span>
              {isValid ? (
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
            </div>
            <p className={`text-sm ${isValid ? 'text-emerald-700' : 'text-red-700'}`}>
              {verification.checkpoints_verified} checkpoint(s) verified
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleReVerify()
            }}
            disabled={verifying}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              isValid 
                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
          >
            {verifying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Re-verify'
            )}
          </button>
          {expanded ? (
            <ChevronUp className={`h-5 w-5 ${isValid ? 'text-emerald-600' : 'text-red-600'}`} />
          ) : (
            <ChevronDown className={`h-5 w-5 ${isValid ? 'text-emerald-600' : 'text-red-600'}`} />
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className={`border-t ${isValid ? 'border-emerald-200' : 'border-red-200'}`}>
              {/* Explanation */}
              <div className="p-4 border-b border-opacity-50" style={{ borderColor: isValid ? '#a7f3d0' : '#fecaca' }}>
                <div className="flex items-start gap-3">
                  <Lock className={`h-5 w-5 mt-0.5 ${isValid ? 'text-emerald-600' : 'text-red-600'}`} />
                  <div className="text-sm">
                    <p className={isValid ? 'text-emerald-800' : 'text-red-800'}>
                      {isValid ? (
                        <>
                          <strong>Tamper-proof verification passed.</strong> Each checkpoint is cryptographically 
                          linked to the previous one. Any modification would break the chain.
                        </>
                      ) : (
                        <>
                          <strong>Warning: Chain integrity compromised!</strong> One or more checkpoints 
                          may have been tampered with. The hash chain has been broken.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Chain Details */}
              <div className="p-4">
                <h4 className={`text-sm font-medium mb-3 ${isValid ? 'text-emerald-900' : 'text-red-900'}`}>
                  Chain Details
                </h4>
                <div className="space-y-2">
                  {verification.verification_results?.map((entry, index) => (
                    <div
                      key={entry.sequence}
                      className={`p-3 rounded-lg border ${
                        entry.is_valid 
                          ? 'bg-white border-emerald-200' 
                          : 'bg-red-100 border-red-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                            entry.is_valid 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-red-200 text-red-700'
                          }`}>
                            {entry.sequence}
                          </span>
                          <span className="text-sm font-medium text-gray-700">
                            Checkpoint #{entry.checkpoint_id}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {entry.blockchain_verified && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" />
                              On-chain
                            </span>
                          )}
                          {entry.is_valid ? (
                            <CheckCircle className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                      </div>
                      
                      {/* Verification Details */}
                      <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                        <div className={`px-2 py-1 rounded ${
                          entry.chain_valid ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                        }`}>
                          Chain: {entry.chain_valid ? '✓' : '✗'}
                        </div>
                        <div className={`px-2 py-1 rounded ${
                          entry.data_valid ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                        }`}>
                          Data: {entry.data_valid ? '✓' : '✗'}
                        </div>
                        <div className={`px-2 py-1 rounded ${
                          entry.hash_valid ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                        }`}>
                          Hash: {entry.hash_valid ? '✓' : '✗'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verified At */}
              <div className={`px-4 pb-4 text-xs ${isValid ? 'text-emerald-600' : 'text-red-600'}`}>
                Verified at: {new Date(verification.verified_at).toLocaleString()}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
