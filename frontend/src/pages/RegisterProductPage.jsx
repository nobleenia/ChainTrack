/**
 * RegisterProductPage
 * 
 * Form to register new products on the blockchain.
 * Generates unique product ID and QR code upon successful registration.
 */

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Package, 
  MapPin, 
  Calendar, 
  FileText, 
  Tag,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  QrCode,
  Shield
} from 'lucide-react'
import { productService } from '../services/productService'
import { Button, LoadingSpinner } from '../components/common'

// Product category options
const categories = [
  { value: 'food', label: 'Food & Beverage', icon: '🍎' },
  { value: 'electronics', label: 'Electronics', icon: '📱' },
  { value: 'pharmaceutical', label: 'Pharmaceutical', icon: '💊' },
  { value: 'clothing', label: 'Clothing & Apparel', icon: '👕' },
  { value: 'automotive', label: 'Automotive', icon: '🚗' },
  { value: 'cosmetics', label: 'Cosmetics', icon: '💄' },
  { value: 'other', label: 'Other', icon: '📦' },
]

export default function RegisterProductPage() {
  const navigate = useNavigate()
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    origin: '',
    batch_number: '',
    manufacturing_date: '',
    expiry_date: '',
    metadata: {
      weight: '',
      dimensions: '',
      certification: '',
    },
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [step, setStep] = useState(1) // 1: Basic Info, 2: Details, 3: Review

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target
    
    // Handle nested metadata fields
    if (name.startsWith('metadata.')) {
      const metaField = name.split('.')[1]
      setFormData(prev => ({
        ...prev,
        metadata: { ...prev.metadata, [metaField]: value }
      }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  // Validate current step
  const validateStep = () => {
    if (step === 1) {
      if (!formData.name.trim()) {
        setError('Product name is required')
        return false
      }
      if (!formData.category) {
        setError('Please select a category')
        return false
      }
    }
    if (step === 2) {
      if (!formData.origin.trim()) {
        setError('Origin/Location is required')
        return false
      }
    }
    setError(null)
    return true
  }

  // Handle next step
  const handleNext = () => {
    if (validateStep()) {
      setStep(prev => prev + 1)
    }
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Clean up empty metadata fields
      const cleanedData = {
        ...formData,
        metadata: Object.fromEntries(
          Object.entries(formData.metadata).filter(([_, v]) => v.trim())
        ),
      }

      const response = await productService.registerProduct(cleanedData)
      
      setSuccess({
        product: response.product,
        message: 'Product registered successfully!',
      })
      setStep(4) // Success step
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register product')
    } finally {
      setIsLoading(false)
    }
  }

  // Step indicator
  const steps = [
    { num: 1, label: 'Basic Info' },
    { num: 2, label: 'Details' },
    { num: 3, label: 'Review' },
  ]

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back Button */}
      <Link 
        to="/products" 
        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft size={20} />
        Back to Products
      </Link>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Register New Product</h1>
        <p className="text-gray-500 mt-1">
          Add a product to the blockchain for secure tracking
        </p>
      </div>

      {/* Step Indicator */}
      {step < 4 && (
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((s, index) => (
              <div key={s.num} className="flex items-center">
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full font-medium
                  ${step >= s.num 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-200 text-gray-500'}
                `}>
                  {step > s.num ? <CheckCircle size={20} /> : s.num}
                </div>
                <span className={`ml-3 font-medium ${
                  step >= s.num ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {s.label}
                </span>
                {index < steps.length - 1 && (
                  <div className={`w-16 lg:w-32 h-1 mx-4 rounded ${
                    step > s.num ? 'bg-primary-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2"
        >
          <AlertCircle size={20} />
          {error}
        </motion.div>
      )}

      {/* Form Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <form onSubmit={handleSubmit}>
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-6 space-y-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Package className="text-primary-600" size={24} />
                Basic Information
              </h2>

              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Organic Coffee Beans - Premium Arabica"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>

              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {categories.map(cat => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, category: cat.value }))}
                      className={`p-3 rounded-lg border-2 text-center transition ${
                        formData.category === cat.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-2xl block mb-1">{cat.icon}</span>
                      <span className="text-xs font-medium text-gray-700">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your product..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </motion.div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-6 space-y-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="text-primary-600" size={24} />
                Product Details
              </h2>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Origin */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin size={16} className="inline mr-1" />
                    Origin / Manufacturing Location *
                  </label>
                  <input
                    type="text"
                    name="origin"
                    value={formData.origin}
                    onChange={handleChange}
                    placeholder="e.g., Bogotá, Colombia"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                {/* Batch Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Tag size={16} className="inline mr-1" />
                    Batch Number
                  </label>
                  <input
                    type="text"
                    name="batch_number"
                    value={formData.batch_number}
                    onChange={handleChange}
                    placeholder="e.g., BATCH-2024-001"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {/* Manufacturing Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar size={16} className="inline mr-1" />
                    Manufacturing Date
                  </label>
                  <input
                    type="date"
                    name="manufacturing_date"
                    value={formData.manufacturing_date}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {/* Expiry Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar size={16} className="inline mr-1" />
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    name="expiry_date"
                    value={formData.expiry_date}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Additional Metadata */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Additional Information (Optional)
                </h3>
                <div className="grid sm:grid-cols-3 gap-4">
                  <input
                    type="text"
                    name="metadata.weight"
                    value={formData.metadata.weight}
                    onChange={handleChange}
                    placeholder="Weight (e.g., 1kg)"
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                  <input
                    type="text"
                    name="metadata.dimensions"
                    value={formData.metadata.dimensions}
                    onChange={handleChange}
                    placeholder="Dimensions"
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                  <input
                    type="text"
                    name="metadata.certification"
                    value={formData.metadata.certification}
                    onChange={handleChange}
                    placeholder="Certification"
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-6 space-y-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CheckCircle className="text-primary-600" size={24} />
                Review & Submit
              </h2>

              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">Product Name</span>
                    <p className="font-medium text-gray-900">{formData.name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Category</span>
                    <p className="font-medium text-gray-900 capitalize">{formData.category}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Origin</span>
                    <p className="font-medium text-gray-900">{formData.origin}</p>
                  </div>
                  {formData.batch_number && (
                    <div>
                      <span className="text-sm text-gray-500">Batch Number</span>
                      <p className="font-medium text-gray-900">{formData.batch_number}</p>
                    </div>
                  )}
                  {formData.manufacturing_date && (
                    <div>
                      <span className="text-sm text-gray-500">Manufacturing Date</span>
                      <p className="font-medium text-gray-900">{formData.manufacturing_date}</p>
                    </div>
                  )}
                  {formData.expiry_date && (
                    <div>
                      <span className="text-sm text-gray-500">Expiry Date</span>
                      <p className="font-medium text-gray-900">{formData.expiry_date}</p>
                    </div>
                  )}
                </div>
                {formData.description && (
                  <div>
                    <span className="text-sm text-gray-500">Description</span>
                    <p className="text-gray-900">{formData.description}</p>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="font-medium text-blue-900">Blockchain Registration</p>
                    <p className="text-sm text-blue-700 mt-1">
                      This product will be permanently recorded on the Ethereum blockchain.
                      A unique product ID and QR code will be generated for tracking.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Success Step */}
          {step === 4 && success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 text-center"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-green-600" size={32} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Product Registered Successfully!
              </h2>
              <p className="text-gray-500 mb-6">
                Your product has been added to the blockchain.
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">Product ID</span>
                    <p className="font-mono font-medium text-gray-900">
                      {success.product?.product_id}
                    </p>
                  </div>
                  {success.product?.blockchain_hash && (
                    <div>
                      <span className="text-sm text-gray-500">Blockchain Hash</span>
                      <p className="font-mono text-sm text-gray-900 truncate">
                        {success.product.blockchain_hash}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* QR Code Preview Placeholder */}
              <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 mb-6">
                <QrCode size={80} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">QR Code Generated</p>
              </div>

              <div className="flex justify-center gap-4">
                <Link to="/products">
                  <Button variant="secondary">
                    View All Products
                  </Button>
                </Link>
                <Link to={`/products/${success.product?.id}`}>
                  <Button rightIcon={<ArrowRight size={20} />}>
                    View Product
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}

          {/* Form Actions */}
          {step < 4 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl flex justify-between">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setStep(prev => prev - 1)}
                  leftIcon={<ArrowLeft size={20} />}
                >
                  Back
                </Button>
              ) : (
                <div />
              )}

              {step < 3 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  rightIcon={<ArrowRight size={20} />}
                >
                  Continue
                </Button>
              ) : (
                <Button
                  type="submit"
                  isLoading={isLoading}
                  leftIcon={<Shield size={20} />}
                >
                  Register Product
                </Button>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
