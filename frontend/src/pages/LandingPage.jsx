import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Shield, 
  Eye, 
  Zap, 
  ArrowRight, 
  Factory, 
  Truck, 
  Store, 
  User,
  CheckCircle,
  QrCode,
  Lock,
  Globe,
  Sparkles
} from 'lucide-react'
import DemoLoginModal from '../components/demo/DemoLoginModal'

const features = [
  {
    icon: Shield,
    title: 'Immutable Records',
    description: 'Every product event is permanently recorded on Ethereum blockchain, creating tamper-proof history.'
  },
  {
    icon: Eye,
    title: 'Full Transparency',
    description: 'Track products in real-time from manufacture to delivery with complete visibility.'
  },
  {
    icon: Zap,
    title: 'Instant Verification',
    description: 'Consumers scan QR codes to instantly verify product authenticity and journey.'
  },
  {
    icon: Lock,
    title: 'Secure & Trustless',
    description: 'No single point of failure. Blockchain ensures data integrity without intermediaries.'
  }
]

const steps = [
  {
    icon: Factory,
    title: 'Manufacture',
    description: 'Products are registered on blockchain at point of manufacture with unique identifiers.'
  },
  {
    icon: Truck,
    title: 'Track',
    description: 'Every custody transfer is recorded on-chain as products move through the supply chain.'
  },
  {
    icon: Store,
    title: 'Deliver',
    description: 'Retailers receive verified products with complete provenance documentation.'
  },
  {
    icon: User,
    title: 'Verify',
    description: 'Consumers scan QR codes to confirm authenticity before purchase.'
  }
]

const stats = [
  { value: '10K+', label: 'Products Tracked' },
  { value: '500+', label: 'Companies' },
  { value: '1M+', label: 'Verifications' },
  { value: '99.9%', label: 'Uptime' }
]

export default function LandingPage() {
  const [showDemoModal, setShowDemoModal] = useState(false)

  return (
    <div className="overflow-hidden">
      {/* Demo Login Modal */}
      <DemoLoginModal 
        isOpen={showDemoModal} 
        onClose={() => setShowDemoModal(false)} 
      />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white overflow-hidden">
        {/* Floating geometric shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Floating cubes - enhanced motion */}
          <motion.div
            className="absolute top-20 left-[10%] w-16 h-16 border-2 border-white/10"
            animate={{ y: [0, -30, 0], x: [0, 10, 0], rotate: [45, 90, 45], scale: [1, 1.1, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute top-40 right-[15%] w-12 h-12 border-2 border-white/10"
            animate={{ y: [0, 25, 0], x: [0, -15, 0], rotate: [12, 45, 12], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-32 left-[20%] w-20 h-20 border border-white/5"
            animate={{ y: [0, -35, 0], rotate: [30, 75, 30], scale: [1, 0.9, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute top-[60%] right-[30%] w-10 h-10 border border-white/10"
            animate={{ y: [0, 28, 0], x: [0, 12, 0], rotate: [20, 60, 20] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute top-16 right-[40%] w-8 h-8 border border-white/8"
            animate={{ y: [0, -20, 0], x: [0, -8, 0], rotate: [60, 120, 60], opacity: [0.08, 0.15, 0.08] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-20 left-[45%] w-14 h-14 border border-white/5"
            animate={{ y: [0, 30, 0], rotate: [15, 50, 15], scale: [1, 1.15, 1] }}
            transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Floating hexagons - enhanced motion */}
          <motion.div
            className="absolute top-32 right-[25%] w-14 h-14 bg-white/5"
            style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
            animate={{ y: [0, 30, 0], x: [0, -10, 0], scale: [1, 1.2, 1], rotate: [0, 30, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-20 right-[10%] w-10 h-10 bg-white/5"
            style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
            animate={{ y: [0, -25, 0], scale: [1, 0.8, 1], rotate: [0, -20, 0], opacity: [0.05, 0.12, 0.05] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute top-1/2 left-[5%] w-8 h-8 bg-white/5"
            style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
            animate={{ y: [0, 18, 0], x: [0, 15, 0], rotate: [0, 45, 0] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute top-[70%] left-[35%] w-12 h-12 bg-white/4"
            style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
            animate={{ y: [0, -28, 0], scale: [1, 1.15, 1], rotate: [0, -25, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute top-[20%] left-[55%] w-6 h-6 bg-white/6"
            style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
            animate={{ y: [0, 22, 0], x: [0, -10, 0], rotate: [0, 60, 0], opacity: [0.06, 0.12, 0.06] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-[35%] right-[8%] w-16 h-16 bg-white/3"
            style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
            animate={{ y: [0, 35, 0], rotate: [0, 40, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Small floating dots/circles - enhanced motion */}
          <motion.div
            className="absolute top-24 left-[40%] w-3 h-3 rounded-full bg-white/10"
            animate={{ y: [0, -18, 0], x: [0, 8, 0], scale: [1, 1.5, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-40 left-[60%] w-2 h-2 rounded-full bg-white/15"
            animate={{ y: [0, 22, 0], x: [0, -6, 0], opacity: [0.15, 0.3, 0.15] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute top-1/3 right-[5%] w-4 h-4 rounded-full bg-white/10"
            animate={{ y: [0, -20, 0], x: [0, -12, 0], scale: [1, 1.3, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute top-[15%] left-[25%] w-2 h-2 rounded-full bg-white/12"
            animate={{ y: [0, 15, 0], x: [0, 10, 0], opacity: [0.12, 0.25, 0.12] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-[25%] left-[8%] w-3 h-3 rounded-full bg-white/8"
            animate={{ y: [0, -22, 0], x: [0, 8, 0], scale: [1, 1.4, 1] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute top-[45%] right-[20%] w-2 h-2 rounded-full bg-white/10"
            animate={{ y: [0, 16, 0], x: [0, -5, 0], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-[15%] left-[70%] w-4 h-4 rounded-full bg-white/8"
            animate={{ y: [0, -15, 0], x: [0, -10, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute top-[80%] left-[15%] w-2 h-2 rounded-full bg-white/12"
            animate={{ y: [0, 20, 0], x: [0, 6, 0], opacity: [0.12, 0.22, 0.12] }}
            transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Triangles - enhanced motion */}
          <motion.div
            className="absolute top-[25%] right-[35%] w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[16px] border-b-white/8"
            animate={{ y: [0, -25, 0], x: [0, 10, 0], rotate: [0, 30, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-[45%] left-[30%] w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[12px] border-b-white/6"
            animate={{ y: [0, 20, 0], x: [0, -8, 0], rotate: [0, -25, 0], opacity: [0.06, 0.12, 0.06] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        
        {/* Original blur effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500 rounded-full opacity-20 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-400 rounded-full opacity-20 blur-3xl" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                Trust Every Product.
                <span className="block text-primary-200">Verify Every Step.</span>
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-primary-100 max-w-xl">
                Blockchain-powered supply chain transparency. Register products on Ethereum, 
                track movements in real-time, and let consumers verify authenticity instantly.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/register"
                  className="inline-flex items-center px-6 py-3 bg-white text-primary-600 font-semibold rounded-lg hover:bg-primary-50 transition shadow-lg"
                >
                  Get Started Free
                  <ArrowRight className="ml-2" size={20} />
                </Link>
                {/* Demo button temporarily hidden
                <button
                  onClick={() => setShowDemoModal(true)}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-semibold rounded-lg hover:from-amber-500 hover:to-orange-600 transition shadow-lg animate-pulse hover:animate-none"
                >
                  <Sparkles className="mr-2" size={20} />
                  Try Demo
                </button>
                */}
                <Link
                  to="/verify"
                  className="inline-flex items-center px-6 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition"
                >
                  <QrCode className="mr-2" size={20} />
                  Verify a Product
                </Link>
                <Link
                  to="/track"
                  className="inline-flex items-center px-6 py-3 border-2 border-primary-300 text-primary-100 font-semibold rounded-lg hover:bg-white/10 transition"
                >
                  <Truck className="mr-2" size={20} />
                  Track Shipment
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="hidden lg:block"
            >
              {/* Supply Chain Animation */}
              <div className="relative">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                  <div className="flex items-center justify-between">
                    {[Factory, Truck, Store, User].map((Icon, index) => (
                      <div key={index} className="flex flex-col items-center">
                        <motion.div
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                          className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mb-2"
                        >
                          <Icon size={32} />
                        </motion.div>
                        <div className="w-2 h-2 bg-green-400 rounded-full" />
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 h-1 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-green-400"
                      animate={{ width: ['0%', '100%'] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />
                  </div>
                  <p className="text-center mt-4 text-primary-100 text-sm">
                    Live product tracking on Ethereum blockchain
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white dark:bg-gray-800 py-12 border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl sm:text-4xl font-bold text-primary-600 dark:text-primary-400">{stat.value}</div>
                <div className="text-gray-600 dark:text-gray-400 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Why Choose ChainTrack?
            </h2>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Built on Ethereum blockchain for maximum security and transparency
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-lg transition card-hover"
              >
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/50 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon size={24} className="text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              How It Works
            </h2>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              From factory to consumer, every step is verified on the blockchain
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-gray-200 dark:bg-gray-600" />
                )}
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                    <step.icon size={28} className="text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center text-sm font-bold text-primary-600 dark:text-primary-400">
                    {index + 1}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{step.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Transform Your Supply Chain?
            </h2>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Join hundreds of companies already using ChainTrack to build trust with their customers.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center px-8 py-4 bg-white text-primary-600 font-semibold rounded-lg hover:bg-primary-50 transition shadow-lg text-lg"
            >
              Start Free Trial
              <ArrowRight className="ml-2" size={20} />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
