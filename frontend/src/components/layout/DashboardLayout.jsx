import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { 
  LayoutDashboard, 
  Package, 
  ArrowRightLeft, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  ChevronDown,
  Bell,
  User,
  Plus,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Info,
  Trash2,
  Gift,
  Truck,
  BarChart3,
  RefreshCw
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useNotificationStore } from '../../store/notificationStore'
import { useTour } from '../../hooks/useTour'
import ThemeToggle from '../common/ThemeToggle'
import WalletConnect from '../common/WalletConnect'

// Navigation items - all roles get Verify Product and Shipments
// Consumers get Products (view only) but not Transfers (they receive, don't initiate transfers)
const getNavigation = (userRole) => {
  if (userRole === 'consumer') {
    return [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Products', href: '/products', icon: Package },  // View owned products
      { name: 'Shipments', href: '/dashboard/shipments', icon: Truck },
      { name: 'Analytics', href: '/dashboard/shipments/analytics', icon: BarChart3 },
      { name: 'Verify Product', href: '/verify', icon: ShieldCheck },
      { name: 'Rewards', href: '/rewards', icon: Gift },
      { name: 'Settings', href: '/settings', icon: Settings },
    ]
  }
  // Manufacturers, Distributors, Retailers get full navigation including Verify and Shipments
  return [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Transfers', href: '/transfers', icon: ArrowRightLeft },
    { name: 'Shipments', href: '/dashboard/shipments', icon: Truck },
    { name: 'Analytics', href: '/dashboard/shipments/analytics', icon: BarChart3 },
    { name: 'Verify Product', href: '/verify', icon: ShieldCheck },
    { name: 'Rewards', href: '/rewards', icon: Gift },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]
}

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { startTour, TourComponent } = useTour()
  
  // Notification store
  const { 
    notifications, 
    unreadCount, 
    isLoading: notificationsLoading,
    fetchNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    removeNotification,
    clearNotifications,
    startPolling,
    stopPolling
  } = useNotificationStore()

  const handleLogout = () => {
    stopPolling()
    logout()
    navigate('/login')
  }

  // Fetch notifications on mount and start polling
  useEffect(() => {
    fetchNotifications()
    startPolling()
    
    return () => {
      stopPolling()
    }
  }, [])

  // Refresh notifications when dropdown opens
  useEffect(() => {
    if (notificationsOpen) {
      fetchNotifications()
    }
  }, [notificationsOpen])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.notifications-dropdown') && !e.target.closest('.notifications-btn')) {
        setNotificationsOpen(false)
      }
      if (!e.target.closest('.user-menu-dropdown') && !e.target.closest('.user-menu-btn')) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  // Check if first time user and start tour
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('chaintrack-tour-completed')
    if (!hasSeenTour && location.pathname === '/dashboard') {
      // Small delay to let the page render
      setTimeout(() => startTour(), 500)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {TourComponent}
      
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300
        lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b dark:border-gray-700">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">ChainTrack</span>
            </Link>
            <button 
              className="lg:hidden text-gray-500 dark:text-gray-400"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={24} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2" id="tour-sidebar">
            {getNavigation(user?.role).map((item) => {
              const isActive = location.pathname === item.href || 
                              (item.href !== '/dashboard' && location.pathname.startsWith(item.href))
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' 
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    }
                  `}
                >
                  <item.icon size={20} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Quick Actions - Only manufacturers can register products */}
          {user?.role === 'manufacturer' && (
            <div className="px-4 py-4 border-t dark:border-gray-700">
              <Link
                to="/products/new"
                className="flex items-center justify-center space-x-2 w-full bg-primary-600 text-white px-4 py-3 rounded-lg hover:bg-primary-700 transition"
                id="tour-register-product"
              >
                <Plus size={20} />
                <span>Register Product</span>
              </Link>
            </div>
          )}

          {/* User Info */}
          <div className="px-4 py-4 border-t dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center">
                <User size={20} className="text-primary-600 dark:text-primary-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {user?.role}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 shadow-sm transition-colors duration-300">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            {/* Mobile menu button */}
            <button
              className="lg:hidden text-gray-600 dark:text-gray-400"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>

            {/* Page Title */}
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white hidden sm:block">
              {getNavigation(user?.role).find(n => 
                location.pathname === n.href || 
                (n.href !== '/dashboard' && location.pathname.startsWith(n.href))
              )?.name || 'Dashboard'}
            </h1>

            {/* Right side actions */}
            <div className="flex items-center space-x-4">
              {/* Wallet Connect */}
              <WalletConnect className="hidden sm:flex" />

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Notifications */}
              <div className="relative notifications-dropdown">
                <button 
                  onClick={() => {
                    setNotificationsOpen(!notificationsOpen)
                    setUserMenuOpen(false)
                  }}
                  className="notifications-btn relative text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                <AnimatePresence>
                  {notificationsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="fixed sm:absolute inset-x-4 sm:inset-x-auto sm:right-0 top-16 sm:top-auto sm:mt-2 w-auto sm:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
                    >
                      {/* Header */}
                      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                          {notificationsLoading && (
                            <RefreshCw size={14} className="animate-spin text-gray-400" />
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllNotificationsAsRead}
                            className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      {/* Notifications List */}
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center">
                            <Bell size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                            <p className="text-gray-500 dark:text-gray-400 text-sm">No notifications</p>
                            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">You're all caught up!</p>
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={`group px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition cursor-pointer ${
                                !notification.is_read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                              }`}
                              onClick={() => {
                                if (!notification.is_read) {
                                  markNotificationAsRead(notification.id)
                                }
                                // Navigate to action_url if present
                                if (notification.action_url) {
                                  setNotificationsOpen(false)
                                  navigate(notification.action_url)
                                }
                              }}
                            >
                              <div className="flex items-start gap-3">
                                {/* Icon based on type */}
                                <div className={`p-2 rounded-full flex-shrink-0 ${
                                  notification.type === 'success' ? 'bg-green-100 dark:bg-green-900/30' :
                                  notification.type === 'warning' ? 'bg-amber-100 dark:bg-amber-900/30' :
                                  notification.type === 'error' ? 'bg-red-100 dark:bg-red-900/30' :
                                  'bg-blue-100 dark:bg-blue-900/30'
                                }`}>
                                  {notification.type === 'success' && <CheckCircle size={16} className="text-green-600 dark:text-green-400" />}
                                  {notification.type === 'warning' && <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400" />}
                                  {notification.type === 'error' && <X size={16} className="text-red-600 dark:text-red-400" />}
                                  {notification.type === 'info' && <Info size={16} className="text-blue-600 dark:text-blue-400" />}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <p className={`text-sm font-medium ${!notification.is_read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                      {notification.title}
                                    </p>
                                    {!notification.is_read && (
                                      <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 ml-2" />
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                    {notification.time}
                                  </p>
                                </div>

                                {/* Delete button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    removeNotification(notification.id)
                                  }}
                                  className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Footer */}
                      {notifications.length > 0 && (
                        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 flex justify-between">
                          <button
                            onClick={() => clearNotifications(true)}
                            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                          >
                            Clear read
                          </button>
                          <button
                            onClick={() => clearNotifications(false)}
                            className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                          >
                            Clear all
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User Menu */}
              <div className="relative user-menu-dropdown">
                <button
                  onClick={() => {
                    setUserMenuOpen(!userMenuOpen)
                    setNotificationsOpen(false)
                  }}
                  className="user-menu-btn flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center">
                    <User size={16} className="text-primary-600 dark:text-primary-400" />
                  </div>
                  <ChevronDown size={16} />
                </button>

                <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 z-50 border dark:border-gray-700"
                  >
                    <Link
                      to="/settings"
                      className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                    >
                      <LogOut size={16} />
                      <span>Log Out</span>
                    </button>
                  </motion.div>
                )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
