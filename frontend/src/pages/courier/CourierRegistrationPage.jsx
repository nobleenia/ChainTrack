/**
 * Courier Registration Page
 * Allows courier companies and individual couriers to register and get onboarded
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Truck,
  User,
  Building2,
  Phone,
  Mail,
  Shield,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Car,
  Bike,
  Package,
  Star,
  Clock,
  MapPin,
  FileText,
  Camera,
  Upload
} from 'lucide-react'
import { courierPortalApi } from '../../services/courierPortalApi'

const vehicleTypes = [
  { value: 'motorcycle', label: 'Motorcycle', icon: Bike, description: 'Quick urban deliveries' },
  { value: 'bicycle', label: 'Bicycle', icon: Bike, description: 'Eco-friendly local deliveries' },
  { value: 'car', label: 'Car', icon: Car, description: 'Standard packages' },
  { value: 'van', label: 'Van', icon: Truck, description: 'Larger shipments' },
  { value: 'truck', label: 'Truck', icon: Truck, description: 'Heavy cargo' }
]

const registrationSteps = [
  { id: 1, title: 'Account Type', description: 'Choose your courier type' },
  { id: 2, title: 'Basic Info', description: 'Your contact details' },
  { id: 3, title: 'Vehicle Info', description: 'Your delivery vehicle' },
  { id: 4, title: 'Verification', description: 'Verify your phone' }
]

export default function CourierRegistrationPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  
  const [formData, setFormData] = useState({
    courier_type: '', // individual or company
    display_name: '',
    company_name: '',
    phone: '',
    email: '',
    vehicle_type: '',
    vehicle_plate: '',
    otp: ''
  })

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const validateStep = () => {
    switch (step) {
      case 1:
        if (!formData.courier_type) {
          setError('Please select your courier type')
          return false
        }
        break
      case 2:
        if (!formData.display_name.trim()) {
          setError('Please enter your name')
          return false
        }
        if (formData.courier_type === 'company' && !formData.company_name.trim()) {
          setError('Please enter your company name')
          return false
        }
        if (!formData.phone.trim() || formData.phone.length < 10) {
          setError('Please enter a valid phone number')
          return false
        }
        break
      case 3:
        if (!formData.vehicle_type) {
          setError('Please select your vehicle type')
          return false
        }
        break
      case 4:
        if (!otpSent) {
          setError('Please request an OTP first')
          return false
        }
        if (!formData.otp || formData.otp.length !== 6) {
          setError('Please enter the 6-digit OTP')
          return false
        }
        break
    }
    return true
  }

  const nextStep = () => {
    if (validateStep()) {
      setStep(prev => Math.min(prev + 1, 4))
      setError(null)
    }
  }

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1))
    setError(null)
  }

  const requestOtp = async () => {
    setError(null)
    setLoading(true)
    
    try {
      await courierPortalApi.requestOtp(formData.phone)
      setOtpSent(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateStep()) return
    
    setLoading(true)
    setError(null)
    
    try {
      // Verify OTP and create profile
      const response = await courierPortalApi.verifyOtpAndRegister({
        phone: formData.phone,
        otp: formData.otp,
        display_name: formData.display_name,
        company_name: formData.company_name || null,
        email: formData.email || null,
        vehicle_type: formData.vehicle_type,
        vehicle_plate: formData.vehicle_plate || null
      })
      
      setSuccess(true)
      
      // Redirect to courier dashboard after short delay
      setTimeout(() => {
        navigate('/courier', { 
          state: { 
            registered: true,
            phone: formData.phone 
          }
        })
      }, 2000)
      
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Registration Successful!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Welcome to ChainTrack Courier Network. You can now accept delivery assignments.
          </p>
          <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Redirecting to dashboard...
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Truck className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900 dark:text-white">ChainTrack</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Courier Registration</p>
              </div>
            </Link>
            
            <Link
              to="/courier"
              className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Already registered? Login
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {registrationSteps.map((s, index) => (
              <div key={s.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                  step > s.id 
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : step === s.id
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                    : 'border-gray-300 dark:border-gray-600 text-gray-400'
                }`}>
                  {step > s.id ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <span className="font-semibold">{s.id}</span>
                  )}
                </div>
                {index < registrationSteps.length - 1 && (
                  <div className={`w-12 sm:w-24 h-1 mx-2 rounded ${
                    step > s.id ? 'bg-emerald-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {registrationSteps[step - 1].title}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {registrationSteps[step - 1].description}
            </p>
          </div>
        </div>

        {/* Form */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sm:p-8"
        >
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Step 1: Account Type */}
            {step === 1 && (
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Are you registering as an individual courier or a delivery company?
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => handleInputChange('courier_type', 'individual')}
                    className={`p-6 rounded-xl border-2 transition-all text-left ${
                      formData.courier_type === 'individual'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <User className={`h-8 w-8 mb-3 ${
                      formData.courier_type === 'individual' 
                        ? 'text-emerald-600 dark:text-emerald-400' 
                        : 'text-gray-400'
                    }`} />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Individual Courier</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Freelance delivery rider or driver
                    </p>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleInputChange('courier_type', 'company')}
                    className={`p-6 rounded-xl border-2 transition-all text-left ${
                      formData.courier_type === 'company'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <Building2 className={`h-8 w-8 mb-3 ${
                      formData.courier_type === 'company' 
                        ? 'text-emerald-600 dark:text-emerald-400' 
                        : 'text-gray-400'
                    }`} />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Delivery Company</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Logistics or courier company
                    </p>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Basic Info */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {formData.courier_type === 'company' ? 'Contact Person Name' : 'Full Name'} *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.display_name}
                      onChange={(e) => handleInputChange('display_name', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                {formData.courier_type === 'company' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Company Name *
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.company_name}
                        onChange={(e) => handleInputChange('company_name', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="Enter company name"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="+234 800 000 0000"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    We'll send an OTP to verify this number
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email (Optional)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="courier@example.com"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Vehicle Info */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Vehicle Type *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {vehicleTypes.map((vehicle) => {
                      const Icon = vehicle.icon
                      return (
                        <button
                          key={vehicle.value}
                          type="button"
                          onClick={() => handleInputChange('vehicle_type', vehicle.value)}
                          className={`p-4 rounded-xl border-2 transition-all text-center ${
                            formData.vehicle_type === vehicle.value
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <Icon className={`h-6 w-6 mx-auto mb-2 ${
                            formData.vehicle_type === vehicle.value 
                              ? 'text-emerald-600 dark:text-emerald-400' 
                              : 'text-gray-400'
                          }`} />
                          <p className={`font-medium text-sm ${
                            formData.vehicle_type === vehicle.value
                              ? 'text-emerald-700 dark:text-emerald-300'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {vehicle.label}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Vehicle Plate Number (Optional)
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.vehicle_plate}
                      onChange={(e) => handleInputChange('vehicle_plate', e.target.value.toUpperCase())}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent uppercase"
                      placeholder="ABC 123 XY"
                    />
                  </div>
                </div>

                {/* Benefits info */}
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 mt-6">
                  <h4 className="font-medium text-emerald-800 dark:text-emerald-300 mb-3 flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Benefits of Registering
                  </h4>
                  <ul className="space-y-2 text-sm text-emerald-700 dark:text-emerald-400">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Build your delivery reputation
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Track all your deliveries in one place
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Blockchain-verified delivery records
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Get prioritized for future assignments
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Step 4: Verification */}
            {step === 4 && (
              <div className="space-y-5">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    We'll send a verification code to <strong className="text-gray-900 dark:text-white">{formData.phone}</strong>
                  </p>
                </div>

                {!otpSent ? (
                  <button
                    type="button"
                    onClick={requestOtp}
                    disabled={loading}
                    className="w-full py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Phone className="h-5 w-5" />
                        Send Verification Code
                      </>
                    )}
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 text-center">
                      <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                      <p className="text-sm text-emerald-700 dark:text-emerald-300">
                        OTP sent to {formData.phone}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Enter 6-digit OTP
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={formData.otp}
                        onChange={(e) => handleInputChange('otp', e.target.value.replace(/\D/g, ''))}
                        className="w-full text-center text-2xl tracking-[0.5em] py-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="• • • • • •"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={requestOtp}
                      disabled={loading}
                      className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      Didn't receive code? Resend
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
              ) : (
                <div />
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : otpSent ? (
                <button
                  type="submit"
                  disabled={loading || formData.otp.length !== 6}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      Complete Registration
                      <CheckCircle className="h-4 w-4" />
                    </>
                  )}
                </button>
              ) : null}
            </div>
          </form>
        </motion.div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p className="flex items-center justify-center gap-2">
            <Shield className="h-4 w-4" />
            Your data is secured with blockchain verification
          </p>
        </div>
      </main>
    </div>
  )
}
