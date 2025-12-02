import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'

export default function MainLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { isAuthenticated } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()

  // Handle hash navigation for smooth scrolling
  const handleHashNavigation = (e, hash) => {
    e.preventDefault()
    setIsMenuOpen(false)
    
    // If we're not on the landing page, navigate there first
    if (location.pathname !== '/') {
      navigate('/' + hash)
    } else {
      // We're on landing page, scroll to section
      const element = document.querySelector(hash)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }

  // Handle scroll on page load if there's a hash
  useEffect(() => {
    if (location.hash && location.pathname === '/') {
      setTimeout(() => {
        const element = document.querySelector(location.hash)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    }
  }, [location])

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">C</span>
                </div>
                <span className="text-xl font-bold text-gray-900">ChainTrack</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a 
                href="#features" 
                onClick={(e) => handleHashNavigation(e, '#features')}
                className="text-gray-600 hover:text-primary-600 transition cursor-pointer"
              >
                Features
              </a>
              <a 
                href="#how-it-works" 
                onClick={(e) => handleHashNavigation(e, '#how-it-works')}
                className="text-gray-600 hover:text-primary-600 transition cursor-pointer"
              >
                How It Works
              </a>
              <Link to="/verify" className="text-gray-600 hover:text-primary-600 transition">
                Verify Product
              </Link>
              
              {isAuthenticated ? (
                <Link 
                  to="/dashboard" 
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
                >
                  Dashboard
                </Link>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link to="/login" className="text-gray-600 hover:text-primary-600 transition">
                    Log In
                  </Link>
                  <Link 
                    to="/register" 
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-600 hover:text-gray-900"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t"
          >
            <div className="px-4 py-4 space-y-4">
              <a 
                href="#features" 
                onClick={(e) => handleHashNavigation(e, '#features')}
                className="block text-gray-600 hover:text-primary-600 cursor-pointer"
              >
                Features
              </a>
              <a 
                href="#how-it-works" 
                onClick={(e) => handleHashNavigation(e, '#how-it-works')}
                className="block text-gray-600 hover:text-primary-600 cursor-pointer"
              >
                How It Works
              </a>
              <Link to="/verify" className="block text-gray-600 hover:text-primary-600">
                Verify Product
              </Link>
              <hr />
              {isAuthenticated ? (
                <Link 
                  to="/dashboard" 
                  className="block bg-primary-600 text-white px-4 py-2 rounded-lg text-center"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/login" className="block text-gray-600 hover:text-primary-600">
                    Log In
                  </Link>
                  <Link 
                    to="/register" 
                    className="block bg-primary-600 text-white px-4 py-2 rounded-lg text-center"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">C</span>
                </div>
                <span className="text-xl font-bold text-white">ChainTrack</span>
              </div>
              <p className="text-gray-400 max-w-md">
                Blockchain-powered supply chain transparency. Trust every product, verify every step.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link to="/#features" className="hover:text-white transition">Features</Link></li>
                <li><Link to="/#how-it-works" className="hover:text-white transition">How It Works</Link></li>
                <li><Link to="/verify" className="hover:text-white transition">Verify Product</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition">About Us</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500">
            <p>&copy; {new Date().getFullYear()} ChainTrack. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
