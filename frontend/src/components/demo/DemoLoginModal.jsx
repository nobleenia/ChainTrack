/**
 * Demo Login Modal Component
 * Allows users to quickly log in as different demo personas
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Factory, Truck, Store, User, Sparkles, ChevronRight } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

const DEMO_ACCOUNTS = [
  {
    id: 'manufacturer',
    email: 'manufacturer@demo.com',
    password: 'demo1234',
    role: 'Manufacturer',
    icon: Factory,
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-700',
    description: 'Register products, manage inventory, initiate transfers',
    features: ['Register new products', 'Create shipments', 'View production analytics']
  },
  {
    id: 'distributor',
    email: 'distributor@demo.com',
    password: 'demo1234',
    role: 'Distributor',
    icon: Truck,
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-200 dark:border-amber-700',
    description: 'Receive products, manage logistics, track shipments',
    features: ['Accept transfers', 'Update shipment status', 'Route optimization']
  },
  {
    id: 'retailer',
    email: 'retailer@demo.com',
    password: 'demo1234',
    role: 'Retailer',
    icon: Store,
    color: 'from-emerald-500 to-green-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    borderColor: 'border-emerald-200 dark:border-emerald-700',
    description: 'Receive inventory, sell to consumers, verify authenticity',
    features: ['Inventory management', 'Point of sale', 'Customer verification']
  },
  {
    id: 'consumer',
    email: 'consumer@demo.com',
    password: 'demo1234',
    role: 'Consumer',
    icon: User,
    color: 'from-purple-500 to-violet-500',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-700',
    description: 'Verify products, view history, track owned items',
    features: ['Scan & verify', 'View product journey', 'Ownership history']
  }
]

export default function DemoLoginModal({ isOpen, onClose }) {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState(null)
  const [selectedAccount, setSelectedAccount] = useState(null)

  const handleDemoLogin = async (account) => {
    setLoading(account.id)
    setError(null)
    
    try {
      await login(account.email, account.password)
      onClose()
      navigate('/dashboard')
    } catch (err) {
      setError(`Failed to login as ${account.role}. Please try again.`)
      console.error('Demo login error:', err)
    } finally {
      setLoading(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Try ChainTrack Demo</h2>
              <p className="text-emerald-100 text-sm mt-1">
                Experience the platform as different supply chain participants
              </p>
            </div>
          </div>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}
        
        {/* Account grid */}
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Select a demo account to explore ChainTrack from their perspective:
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {DEMO_ACCOUNTS.map((account) => {
              const Icon = account.icon
              const isLoading = loading === account.id
              const isSelected = selectedAccount === account.id
              
              return (
                <button
                  key={account.id}
                  onClick={() => handleDemoLogin(account)}
                  onMouseEnter={() => setSelectedAccount(account.id)}
                  onMouseLeave={() => setSelectedAccount(null)}
                  disabled={loading !== null}
                  className={`
                    relative p-4 rounded-xl border-2 text-left transition-all duration-300
                    ${account.bgColor} ${account.borderColor}
                    hover:scale-[1.02] hover:shadow-lg
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${isSelected ? 'ring-2 ring-offset-2 ring-emerald-500 dark:ring-offset-gray-800' : ''}
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${account.color} shadow-lg`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {account.role}
                        </h3>
                        {isLoading ? (
                          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${isSelected ? 'translate-x-1' : ''}`} />
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {account.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-1 mt-2">
                        {account.features.map((feature, idx) => (
                          <span 
                            key={idx}
                            className="text-xs px-2 py-0.5 bg-white/60 dark:bg-gray-700/60 rounded-full text-gray-700 dark:text-gray-300"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Demo accounts have pre-populated data to showcase platform features.
            No real transactions will be made.
          </p>
        </div>
      </div>
    </div>
  )
}
