/**
 * Share Courier Link Modal
 * Shows shareable link and QR code for courier access
 * Link is active until shipment is delivered
 */

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import {
  X,
  Copy,
  CheckCircle,
  Link2,
  QrCode,
  Share2,
  Download,
  Smartphone,
  Shield,
  Clock,
  MessageCircle,
  Mail
} from 'lucide-react'

export default function ShareCourierLinkModal({ 
  shipmentId, 
  authCode, 
  courierName, 
  expiresAt,
  onClose 
}) {
  const [copied, setCopied] = useState(null) // 'link' | 'code' | null
  const qrRef = useRef(null)

  // Generate the courier checkpoint URL
  const baseUrl = window.location.origin
  const courierLink = `${baseUrl}/courier/checkpoint?shipment=${shipmentId}&code=${authCode}`
  
  // Alternative: Direct to courier portal with pre-filled data
  const portalLink = `${baseUrl}/courier?shipment=${shipmentId}&code=${authCode}`

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const downloadQR = () => {
    const svg = qrRef.current?.querySelector('svg')
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      canvas.width = img.width * 2
      canvas.height = img.height * 2
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      
      const pngUrl = canvas.toDataURL('image/png')
      const downloadLink = document.createElement('a')
      downloadLink.href = pngUrl
      downloadLink.download = `courier-qr-${shipmentId}.png`
      downloadLink.click()
    }

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  const shareViaWhatsApp = () => {
    const message = `Hi ${courierName || 'Courier'},\n\nYou've been authorized to handle shipment ${shipmentId}.\n\nUse this link to record checkpoints:\n${courierLink}\n\nOr enter code: ${authCode}\n\nPowered by ChainTrack`
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
  }

  const shareViaSMS = () => {
    const message = `ChainTrack: You're authorized for shipment ${shipmentId}. Record checkpoints: ${courierLink} (Code: ${authCode})`
    window.open(`sms:?body=${encodeURIComponent(message)}`, '_blank')
  }

  const shareViaEmail = () => {
    const subject = `ChainTrack - Courier Authorization for ${shipmentId}`
    const body = `Hi ${courierName || 'Courier'},

You've been authorized to handle shipment ${shipmentId} on ChainTrack.

📦 Record Checkpoints Here:
${courierLink}

🔑 Authorization Code: ${authCode}

This link allows you to:
• Record pickup, checkpoints, and delivery
• Upload photos as proof
• Track your progress

${expiresAt ? `⏰ This authorization expires: ${new Date(expiresAt).toLocaleString()}` : ''}

Powered by ChainTrack - Blockchain Supply Chain Verification`
    
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank')
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Courier Access - ${shipmentId}`,
          text: `You've been authorized to handle shipment ${shipmentId}. Use code: ${authCode}`,
          url: courierLink
        })
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Share failed:', err)
        }
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                <Share2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Share with Courier</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {courierName ? `For ${courierName}` : 'Share access link'}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* QR Code */}
          <div className="text-center" ref={qrRef}>
            <div className="inline-block p-4 bg-white rounded-xl shadow-inner border border-gray-100">
              <QRCodeSVG
                value={courierLink}
                size={180}
                level="H"
                includeMargin
                imageSettings={{
                  src: '/favicon.ico',
                  height: 24,
                  width: 24,
                  excavate: true
                }}
              />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
              Scan to open courier checkpoint page
            </p>
            <button
              onClick={downloadQR}
              className="mt-2 text-sm text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 mx-auto"
            >
              <Download className="h-4 w-4" />
              Download QR Code
            </button>
          </div>

          {/* Link Section */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Shareable Link
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 overflow-hidden">
                <p className="text-sm text-gray-700 dark:text-gray-300 truncate font-mono">
                  {courierLink}
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(courierLink, 'link')}
                className={`p-2.5 rounded-lg transition-colors ${
                  copied === 'link'
                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400'
                }`}
              >
                {copied === 'link' ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Auth Code */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Authorization Code
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-lg px-4 py-3 text-center">
                <span className="text-2xl font-mono font-bold tracking-widest text-emerald-700 dark:text-emerald-400">
                  {authCode}
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(authCode, 'code')}
                className={`p-2.5 rounded-lg transition-colors ${
                  copied === 'code'
                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400'
                }`}
              >
                {copied === 'code' ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Share Options */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Share via
            </label>
            <div className="grid grid-cols-4 gap-2">
              {navigator.share && (
                <button
                  onClick={handleNativeShare}
                  className="flex flex-col items-center gap-1 p-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-xl transition-colors"
                >
                  <Share2 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Share</span>
                </button>
              )}
              <button
                onClick={shareViaWhatsApp}
                className="flex flex-col items-center gap-1 p-3 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-xl transition-colors"
              >
                <MessageCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="text-xs text-green-600 dark:text-green-400">WhatsApp</span>
              </button>
              <button
                onClick={shareViaSMS}
                className="flex flex-col items-center gap-1 p-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl transition-colors"
              >
                <Smartphone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="text-xs text-blue-600 dark:text-blue-400">SMS</span>
              </button>
              <button
                onClick={shareViaEmail}
                className="flex flex-col items-center gap-1 p-3 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-xl transition-colors"
              >
                <Mail className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <span className="text-xs text-purple-600 dark:text-purple-400">Email</span>
              </button>
            </div>
          </div>

          {/* Expiration Info */}
          {expiresAt && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-start gap-2">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-700 dark:text-amber-300">
                <p className="font-medium">Link expires</p>
                <p className="text-amber-600 dark:text-amber-400">
                  {new Date(expiresAt).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* Security Note */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 flex items-start gap-2">
            <Shield className="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              This link grants access to record checkpoints for this shipment only. 
              The link becomes inactive once the shipment is delivered.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0">
          <button
            onClick={onClose}
            className="w-full bg-gray-900 dark:bg-gray-700 text-white px-4 py-3 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-600 font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  )
}
