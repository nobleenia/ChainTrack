import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { 
  ArrowLeft, 
  Mail, 
  MessageSquare, 
  Send, 
  MapPin, 
  Clock, 
  Phone,
  HelpCircle,
  Shield,
  Bug,
  Briefcase,
  CheckCircle
} from 'lucide-react'

const contactReasons = [
  { value: 'general', label: 'General Inquiry', icon: MessageSquare },
  { value: 'support', label: 'Technical Support', icon: HelpCircle },
  { value: 'security', label: 'Security Issue', icon: Shield },
  { value: 'bug', label: 'Bug Report', icon: Bug },
  { value: 'business', label: 'Business Partnership', icon: Briefcase },
]

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    reason: 'general',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setIsSubmitting(false)
    setIsSubmitted(true)
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Message Sent!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Thank you for reaching out. We'll get back to you within 24-48 hours.
            </p>
            <div className="space-y-3">
              <Link
                to="/"
                className="block w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
              >
                Back to Home
              </Link>
              <button
                onClick={() => {
                  setIsSubmitted(false)
                  setFormData({
                    name: '',
                    email: '',
                    reason: 'general',
                    subject: '',
                    message: ''
                  })
                }}
                className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Send Another Message
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link 
            to="/" 
            className="inline-flex items-center text-primary-100 hover:text-white mb-6 transition"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Home
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center space-x-3 mb-4">
              <Mail size={40} />
              <h1 className="text-3xl sm:text-4xl font-bold">Contact Us</h1>
            </div>
            <p className="text-primary-100 text-lg max-w-2xl">
              Have questions or need assistance? We're here to help. Reach out to our team and we'll respond as soon as possible.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Contact Cards */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Get in Touch</h3>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                    <Mail className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Email</p>
                    <a href="mailto:support@chaintrack.io" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                      support@chaintrack.io
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                    <Clock className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Response Time</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">24-48 business hours</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                    <MapPin className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Location</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Global (Remote Team)</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Department Emails */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Department Contacts</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">General</span>
                  <a href="mailto:hello@chaintrack.io" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                    hello@chaintrack.io
                  </a>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Support</span>
                  <a href="mailto:support@chaintrack.io" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                    support@chaintrack.io
                  </a>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Security</span>
                  <a href="mailto:security@chaintrack.io" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                    security@chaintrack.io
                  </a>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Privacy</span>
                  <a href="mailto:privacy@chaintrack.io" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                    privacy@chaintrack.io
                  </a>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Partnerships</span>
                  <a href="mailto:partners@chaintrack.io" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                    partners@chaintrack.io
                  </a>
                </div>
              </div>
            </motion.div>

            {/* FAQ Shortcut */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl p-6 border border-primary-200 dark:border-primary-800"
            >
              <div className="flex items-center space-x-3 mb-3">
                <HelpCircle className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Need Quick Help?</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Check our documentation for common questions and guides.
              </p>
              <Link
                to="/verify"
                className="inline-flex items-center text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
              >
                Try Product Verification
                <ArrowLeft size={16} className="ml-1 rotate-180" />
              </Link>
            </motion.div>
          </div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Send us a Message
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name & Email */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    What can we help you with? *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                    {contactReasons.map((reason) => (
                      <button
                        key={reason.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, reason: reason.value }))}
                        className={`flex flex-col items-center p-3 rounded-lg border-2 transition ${
                          formData.reason === reason.value
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                      >
                        <reason.icon 
                          size={20} 
                          className={formData.reason === reason.value 
                            ? 'text-primary-600 dark:text-primary-400' 
                            : 'text-gray-400'
                          } 
                        />
                        <span className={`text-xs mt-1 text-center ${
                          formData.reason === reason.value
                            ? 'text-primary-700 dark:text-primary-300 font-medium'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {reason.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Subject *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                    placeholder="Brief description of your inquiry"
                  />
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition resize-none"
                    placeholder="Please provide as much detail as possible..."
                  />
                </div>

                {/* Security Notice for Security Reports */}
                {formData.reason === 'security' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4"
                  >
                    <div className="flex items-start space-x-3">
                      <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                          Security Disclosure
                        </p>
                        <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                          For sensitive security issues, please email us directly at{' '}
                          <a href="mailto:security@chaintrack.io" className="underline font-medium">
                            security@chaintrack.io
                          </a>
                          . We take all security reports seriously and will respond promptly.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Submit Button */}
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    * Required fields
                  </p>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 focus:ring-4 focus:ring-primary-300 dark:focus:ring-primary-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Message
                        <Send size={18} className="ml-2" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
