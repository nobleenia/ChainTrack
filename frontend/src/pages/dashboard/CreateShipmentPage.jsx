/**
 * Create Shipment Page
 * Form for creating new P2P deliveries with multi-photo support and barcode generation
 */

import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Package,
  MapPin,
  User,
  Phone,
  Mail,
  FileText,
  Camera,
  Upload,
  X,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
  Copy,
  Download,
  Printer,
  Plus,
  QrCode,
  Truck,
  ExternalLink
} from 'lucide-react'
import useShipmentStore from '../../store/shipmentStore'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../../components/common'

export default function CreateShipmentPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { createShipment, loading, error, clearError } = useShipmentStore()
  const fileInputRef = useRef(null)
  const barcodeRef = useRef(null)

  const [formData, setFormData] = useState({
    description: '',
    receiver_name: '',
    receiver_email: '',
    receiver_phone: '',
    pickup_address: '',
    pickup_city: '',
    delivery_address: '',
    delivery_city: '',
    package_weight: '',
    package_dimensions: '',
    package_value: '',
    special_instructions: '',
  })

  // Support multiple photos
  const [photos, setPhotos] = useState([])
  const [photoPreviews, setPhotoPreviews] = useState([])
  const [success, setSuccess] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})
  const [copiedField, setCopiedField] = useState(null)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  // Handle multiple photo uploads
  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files || [])
    
    const validFiles = []
    
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setValidationErrors((prev) => ({
          ...prev,
          photos: 'Please select only image files'
        }))
        continue
      }
      if (file.size > 5 * 1024 * 1024) {
        setValidationErrors((prev) => ({
          ...prev,
          photos: 'Each image must be less than 5MB'
        }))
        continue
      }
      validFiles.push(file)
    }

    if (validFiles.length === 0) return

    // Create previews for valid files
    validFiles.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreviews(prev => [...prev, reader.result])
      }
      reader.readAsDataURL(file)
    })

    setPhotos(prev => [...prev, ...validFiles])
    setValidationErrors((prev) => ({ ...prev, photos: null }))
  }

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const validateForm = () => {
    const errors = {}

    if (!formData.description.trim()) {
      errors.description = 'Description is required'
    }
    if (!formData.receiver_name.trim()) {
      errors.receiver_name = 'Receiver name is required'
    }
    if (!formData.receiver_phone.trim() && !formData.receiver_email.trim()) {
      errors.receiver_phone = 'At least phone or email is required'
    }
    if (!formData.pickup_address.trim()) {
      errors.pickup_address = 'Pickup address is required'
    }
    if (!formData.pickup_city.trim()) {
      errors.pickup_city = 'Pickup city is required'
    }
    if (!formData.delivery_address.trim()) {
      errors.delivery_address = 'Delivery address is required'
    }
    if (!formData.delivery_city.trim()) {
      errors.delivery_city = 'Delivery city is required'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()

    if (!validateForm()) {
      return
    }

    try {
      const photoDataUrls = photoPreviews.length > 0 ? photoPreviews : []

      const shipmentData = {
        description: formData.description,
        receiver_name: formData.receiver_name,
        receiver_email: formData.receiver_email || undefined,
        receiver_phone: formData.receiver_phone || undefined,
        pickup_address: formData.pickup_address,
        pickup_city: formData.pickup_city,
        delivery_address: formData.delivery_address,
        delivery_city: formData.delivery_city,
        weight: formData.package_weight ? String(formData.package_weight) : undefined,
        dimensions: formData.package_dimensions || undefined,
        declared_value: formData.package_value ? parseFloat(formData.package_value) : undefined,
        special_instructions: formData.special_instructions || undefined,
        sender_photo_url: photoDataUrls[0] || undefined,
      }

      console.log('Submitting shipment:', shipmentData)
      const result = await createShipment(shipmentData)
      console.log('Shipment created:', result)
      
      // tracking_pin is inside shipment object when include_pin=True
      setSuccess({
        shipment_id: result.shipment.shipment_id,
        tracking_pin: result.shipment.tracking_pin,
        shipment: result.shipment
      })
    } catch (err) {
      console.error('Shipment creation error:', err)
    }
  }

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  // Generate barcode using canvas
  const generateBarcodeCanvas = (text) => {
    if (!barcodeRef.current || !text) return
    
    const canvas = barcodeRef.current
    const ctx = canvas.getContext('2d')
    
    // Simple CODE128-style barcode visualization
    canvas.width = 280
    canvas.height = 80
    
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Generate bars based on text
    const barWidth = 2
    let x = 20
    
    ctx.fillStyle = '#000000'
    
    // Start pattern
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(x, 10, barWidth, 50)
      x += barWidth * 2
    }
    
    // Encode each character
    for (const char of text) {
      const code = char.charCodeAt(0)
      for (let i = 0; i < 8; i++) {
        if ((code >> (7 - i)) & 1) {
          ctx.fillRect(x, 10, barWidth, 50)
        }
        x += barWidth
      }
      x += barWidth // gap
    }
    
    // End pattern
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(x, 10, barWidth, 50)
      x += barWidth * 2
    }
    
    // Text below barcode
    ctx.font = '12px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(text, canvas.width / 2, 75)
  }

  // Effect to generate barcode when success
  useEffect(() => {
    if (success?.shipment_id) {
      setTimeout(() => generateBarcodeCanvas(success.shipment_id), 100)
    }
  }, [success])

  // Print shipping label
  const printLabel = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const labelHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>ChainTrack Shipping Label - ${success.shipment_id}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; }
          .label { 
            border: 3px solid #000; 
            padding: 20px; 
            max-width: 400px; 
            margin: 0 auto;
          }
          .header { 
            text-align: center; 
            border-bottom: 2px solid #000; 
            padding-bottom: 15px; 
            margin-bottom: 15px;
          }
          .logo { font-size: 24px; font-weight: bold; }
          .tracking-id { 
            font-size: 18px; 
            font-family: monospace; 
            margin-top: 10px;
          }
          .barcode-container { 
            text-align: center; 
            margin: 20px 0;
            padding: 10px;
            background: #f5f5f5;
          }
          .section { margin-bottom: 15px; }
          .section-title { 
            font-weight: bold; 
            font-size: 12px; 
            color: #666;
            text-transform: uppercase;
            margin-bottom: 5px;
          }
          .pin-section {
            background: #000;
            color: #fff;
            padding: 15px;
            text-align: center;
            margin: 15px 0;
          }
          .pin { font-size: 28px; font-family: monospace; letter-spacing: 4px; }
          .footer { 
            text-align: center; 
            font-size: 10px; 
            color: #666;
            border-top: 1px solid #ccc;
            padding-top: 10px;
            margin-top: 15px;
          }
          @media print { body { padding: 0; } .label { border-width: 2px; } }
        </style>
      </head>
      <body>
        <div class="label">
          <div class="header">
            <div class="logo">📦 ChainTrack</div>
            <div style="font-size: 12px; color: #666;">Blockchain-Verified Shipping</div>
            <div class="tracking-id">${success.shipment_id}</div>
          </div>
          
          <div class="barcode-container">
            <canvas id="barcode" width="280" height="80"></canvas>
          </div>
          
          <div class="section">
            <div class="section-title">From</div>
            <div><strong>${user?.name || 'Sender'}</strong><br>
            ${formData.pickup_address}<br>${formData.pickup_city}</div>
          </div>
          
          <div class="section">
            <div class="section-title">To</div>
            <div><strong>${formData.receiver_name}</strong><br>
            ${formData.delivery_address}<br>${formData.delivery_city}<br>
            ${formData.receiver_phone ? 'Tel: ' + formData.receiver_phone : ''}</div>
          </div>
          
          <div class="section">
            <div class="section-title">Contents</div>
            <div>${formData.description}</div>
          </div>
          
          <div class="pin-section">
            <div style="font-size: 10px; margin-bottom: 5px;">TRACKING PIN (Keep Secure)</div>
            <div class="pin">${success.tracking_pin}</div>
          </div>
          
          <div class="footer">
            Track your package at chaintrack.io/track<br>
            Powered by Ethereum Blockchain
          </div>
        </div>
        
        <script>
          const canvas = document.getElementById('barcode');
          const ctx = canvas.getContext('2d');
          const text = "${success.shipment_id}";
          const barWidth = 2;
          let x = 20;
          
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#000000';
          
          for (let i = 0; i < 3; i++) { ctx.fillRect(x, 10, barWidth, 50); x += barWidth * 2; }
          for (const char of text) {
            const code = char.charCodeAt(0);
            for (let i = 0; i < 8; i++) {
              if ((code >> (7 - i)) & 1) ctx.fillRect(x, 10, barWidth, 50);
              x += barWidth;
            }
            x += barWidth;
          }
          for (let i = 0; i < 3; i++) { ctx.fillRect(x, 10, barWidth, 50); x += barWidth * 2; }
          
          ctx.font = '12px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(text, canvas.width / 2, 75);
          
          setTimeout(() => window.print(), 300);
        </script>
      </body>
      </html>
    `
    
    printWindow.document.write(labelHtml)
    printWindow.document.close()
  }

  // Download label as image
  const downloadLabel = () => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    canvas.width = 400
    canvas.height = 500
    
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 3
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20)
    
    ctx.fillStyle = '#000000'
    ctx.font = 'bold 24px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('📦 ChainTrack', canvas.width / 2, 50)
    
    ctx.font = '12px Arial'
    ctx.fillStyle = '#666666'
    ctx.fillText('Blockchain-Verified Shipping', canvas.width / 2, 70)
    
    ctx.font = 'bold 16px monospace'
    ctx.fillStyle = '#000000'
    ctx.fillText(success.shipment_id, canvas.width / 2, 95)
    
    ctx.beginPath()
    ctx.moveTo(20, 110)
    ctx.lineTo(canvas.width - 20, 110)
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 1
    ctx.stroke()
    
    ctx.textAlign = 'left'
    ctx.font = 'bold 10px Arial'
    ctx.fillStyle = '#666'
    ctx.fillText('FROM', 30, 135)
    ctx.font = '12px Arial'
    ctx.fillStyle = '#000'
    ctx.fillText(user?.name || 'Sender', 30, 155)
    ctx.fillText(formData.pickup_address.substring(0, 40), 30, 170)
    ctx.fillText(formData.pickup_city, 30, 185)
    
    ctx.font = 'bold 10px Arial'
    ctx.fillStyle = '#666'
    ctx.fillText('TO', 30, 215)
    ctx.font = 'bold 12px Arial'
    ctx.fillStyle = '#000'
    ctx.fillText(formData.receiver_name, 30, 235)
    ctx.font = '12px Arial'
    ctx.fillText(formData.delivery_address.substring(0, 40), 30, 250)
    ctx.fillText(formData.delivery_city, 30, 265)
    if (formData.receiver_phone) {
      ctx.fillText('Tel: ' + formData.receiver_phone, 30, 280)
    }
    
    ctx.fillStyle = '#000000'
    ctx.fillRect(20, 310, canvas.width - 40, 60)
    ctx.fillStyle = '#ffffff'
    ctx.font = '10px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('TRACKING PIN (Keep Secure)', canvas.width / 2, 330)
    ctx.font = 'bold 28px monospace'
    ctx.fillText(success.tracking_pin, canvas.width / 2, 360)
    
    ctx.fillStyle = '#666666'
    ctx.font = '10px Arial'
    ctx.fillText('Track at chaintrack.io/track', canvas.width / 2, 400)
    ctx.fillText('Powered by Ethereum Blockchain', canvas.width / 2, 415)
    
    const link = document.createElement('a')
    link.download = `shipping-label-${success.shipment_id}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  // Success state with enhanced UI
  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
        >
          {/* Success Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-8 text-white text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Shipment Created Successfully!</h2>
            <p className="text-emerald-100">
              Your package is ready for pickup. Share the tracking details below.
            </p>
          </div>

          <div className="p-6">
            {/* Tracking ID & Barcode */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <div className="text-center mb-4">
                <label className="text-sm text-gray-500 block mb-1">Tracking ID</label>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl font-mono font-bold text-gray-900">
                    {success.shipment_id}
                  </span>
                  <button
                    onClick={() => copyToClipboard(success.shipment_id, 'id')}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    title="Copy"
                  >
                    {copiedField === 'id' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Copy className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>

              {/* Barcode Canvas */}
              <div className="flex justify-center bg-white p-4 rounded-lg border">
                <canvas ref={barcodeRef} width="280" height="80"></canvas>
              </div>
            </div>

            {/* Tracking PIN */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
              <div className="text-center">
                <label className="text-sm text-amber-700 font-medium block mb-2">
                  🔐 Secure Tracking PIN
                </label>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-4xl font-mono font-bold text-amber-800 tracking-widest">
                    {success.tracking_pin}
                  </span>
                  <button
                    onClick={() => copyToClipboard(success.tracking_pin, 'pin')}
                    className="p-2 hover:bg-amber-200 rounded-lg transition-colors"
                    title="Copy"
                  >
                    {copiedField === 'pin' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Copy className="h-5 w-5 text-amber-700" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-amber-600 mt-3">
                  ⚠️ Share this PIN securely with the receiver. They'll need it to track and confirm delivery.
                </p>
              </div>
            </div>

            {/* Shipment Summary */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Package className="h-5 w-5 text-gray-500" />
                Shipment Details
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">From:</span>
                  <p className="font-medium">{formData.pickup_city}</p>
                </div>
                <div>
                  <span className="text-gray-500">To:</span>
                  <p className="font-medium">{formData.delivery_city}</p>
                </div>
                <div>
                  <span className="text-gray-500">Receiver:</span>
                  <p className="font-medium">{formData.receiver_name}</p>
                </div>
                <div>
                  <span className="text-gray-500">Contents:</span>
                  <p className="font-medium truncate">{formData.description}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <Button
                variant="outline"
                onClick={printLabel}
                className="flex items-center justify-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Print Label
              </Button>
              <Button
                variant="outline"
                onClick={downloadLabel}
                className="flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Label
              </Button>
            </div>

            {/* Blockchain Info */}
            {success.shipment?.blockchain_hash && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-blue-700 text-sm">
                  <CheckCircle className="h-4 w-4" />
                  <span>Registered on blockchain</span>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${success.shipment.blockchain_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto flex items-center gap-1 text-blue-600 hover:underline"
                  >
                    View on Etherscan <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => navigate('/dashboard/shipments')}
                className="flex-1"
              >
                View All Shipments
              </Button>
              <Button
                onClick={() => navigate(`/dashboard/shipments/${success.shipment?.id}`)}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Truck className="h-4 w-4" />
                Track Shipment
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Create New Shipment</h1>
        <p className="text-gray-500 mt-1">
          Fill in the details to create a blockchain-tracked delivery
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2"
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={clearError} className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Package Description */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-primary-600" />
            Package Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="e.g., Electronics - Laptop"
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                  validationErrors.description ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {validationErrors.description && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  name="package_weight"
                  value={formData.package_weight}
                  onChange={handleChange}
                  placeholder="0.5"
                  step="0.1"
                  min="0"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dimensions (cm)
                </label>
                <input
                  type="text"
                  name="package_dimensions"
                  value={formData.package_dimensions}
                  onChange={handleChange}
                  placeholder="30x20x15"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Value (₦)
                </label>
                <input
                  type="number"
                  name="package_value"
                  value={formData.package_value}
                  onChange={handleChange}
                  placeholder="50000"
                  min="0"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Special Instructions
              </label>
              <textarea
                name="special_instructions"
                value={formData.special_instructions}
                onChange={handleChange}
                placeholder="e.g., Handle with care, fragile contents"
                rows={2}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Receiver Information */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-primary-600" />
            Receiver Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Receiver Name *
              </label>
              <input
                type="text"
                name="receiver_name"
                value={formData.receiver_name}
                onChange={handleChange}
                placeholder="Full name"
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                  validationErrors.receiver_name ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {validationErrors.receiver_name && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.receiver_name}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    name="receiver_phone"
                    value={formData.receiver_phone}
                    onChange={handleChange}
                    placeholder="+234 XXX XXX XXXX"
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                      validationErrors.receiver_phone ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                </div>
                {validationErrors.receiver_phone && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.receiver_phone}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email (Optional)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    name="receiver_email"
                    value={formData.receiver_email}
                    onChange={handleChange}
                    placeholder="email@example.com"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Addresses */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary-600" />
            Pickup & Delivery Addresses
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Pickup Address */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-700 flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                  A
                </div>
                Pickup Address
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address *
                </label>
                <input
                  type="text"
                  name="pickup_address"
                  value={formData.pickup_address}
                  onChange={handleChange}
                  placeholder="123 Main Street"
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                    validationErrors.pickup_address ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {validationErrors.pickup_address && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.pickup_address}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  name="pickup_city"
                  value={formData.pickup_city}
                  onChange={handleChange}
                  placeholder="Lagos"
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                    validationErrors.pickup_city ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {validationErrors.pickup_city && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.pickup_city}</p>
                )}
              </div>
            </div>

            {/* Delivery Address */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-700 flex items-center gap-2">
                <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">
                  B
                </div>
                Delivery Address
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address *
                </label>
                <input
                  type="text"
                  name="delivery_address"
                  value={formData.delivery_address}
                  onChange={handleChange}
                  placeholder="456 Oak Avenue"
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                    validationErrors.delivery_address ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {validationErrors.delivery_address && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.delivery_address}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  name="delivery_city"
                  value={formData.delivery_city}
                  onChange={handleChange}
                  placeholder="Abuja"
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                    validationErrors.delivery_city ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {validationErrors.delivery_city && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.delivery_city}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Package Photos - Multiple Support */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary-600" />
            Package Photos
            <span className="text-sm font-normal text-gray-500">(Optional - helps verification)</span>
          </h2>

          <div className="space-y-4">
            {/* Photo Previews */}
            {photoPreviews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {photoPreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Package photo ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    {index === 0 && (
                      <span className="absolute bottom-2 left-2 bg-primary-600 text-white text-xs px-2 py-0.5 rounded">
                        Main
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                validationErrors.photos
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300 hover:border-primary-400 hover:bg-primary-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoChange}
                className="hidden"
              />
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  {photoPreviews.length > 0 ? (
                    <Plus className="h-6 w-6 text-gray-400" />
                  ) : (
                    <Upload className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {photoPreviews.length > 0
                    ? 'Click to add more photos'
                    : 'Click or drag to upload photos'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  PNG, JPG up to 5MB each • Multiple photos supported
                </p>
              </div>
            </div>
            {validationErrors.photos && (
              <p className="text-red-500 text-sm">{validationErrors.photos}</p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(-1)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating Shipment...
              </>
            ) : (
              <>
                <Package className="h-4 w-4" />
                Create Shipment
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
