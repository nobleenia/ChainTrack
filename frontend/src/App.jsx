import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

// Layouts
import MainLayout from './components/layout/MainLayout'
import DashboardLayout from './components/layout/DashboardLayout'

// Pages
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ProductsPage from './pages/ProductsPage'
import ProductDetailPage from './pages/ProductDetailPage'
import RegisterProductPage from './pages/RegisterProductPage'
import TransfersPage from './pages/TransfersPage'
import VerifyPage from './pages/VerifyPage'
import RewardsPage from './pages/RewardsPage'
import SettingsPage from './pages/SettingsPage'
import NotFoundPage from './pages/NotFoundPage'
import TrackPage from './pages/TrackPage'
import ShipmentsPage from './pages/dashboard/ShipmentsPage'
import CreateShipmentPage from './pages/dashboard/CreateShipmentPage'
import ShipmentDetailPage from './pages/dashboard/ShipmentDetailPage'
import ConfirmDeliveryPage from './pages/dashboard/ConfirmDeliveryPage'
import ShipmentAnalyticsPage from './pages/dashboard/ShipmentAnalyticsPage'
import CourierCheckpointPage from './pages/CourierCheckpointPage'
import ReceiverTrackingPage from './pages/ReceiverTrackingPage'

// Courier Portal Pages
import CourierLandingPage from './pages/courier/CourierLandingPage'
import CourierDashboard from './pages/courier/CourierDashboard'
import CourierShipmentsPage from './pages/courier/CourierShipmentsPage'
import CourierShipmentDetailsPage from './pages/courier/CourierShipmentDetailsPage'
import CourierRegistrationPage from './pages/courier/CourierRegistrationPage'

// Legal Pages
import TermsOfServicePage from './pages/TermsOfServicePage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import ContactPage from './pages/ContactPage'
import DocumentationPage from './pages/DocumentationPage'

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

// Public Route (redirect to dashboard if authenticated)
function PublicRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }
  
  return children
}

function App() {
  return (
    <>
      {/* WCAG 2.1 AA - Live region for screen reader announcements */}
      <div 
        id="aria-live-region" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      />
      
      <Routes>
        {/* Public Routes */}
        <Route element={<MainLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        } />
        <Route path="/verify/:productId?" element={<VerifyPage />} />
        <Route path="/track" element={<TrackPage />} />
        <Route path="/track/:trackingCode" element={<ReceiverTrackingPage />} />
        <Route path="/courier/checkpoint" element={<CourierCheckpointPage />} />
        
        {/* Courier Portal Routes */}
        <Route path="/courier" element={<CourierLandingPage />} />
        <Route path="/courier/register" element={<CourierRegistrationPage />} />
        <Route path="/courier/dashboard" element={<CourierDashboard />} />
        <Route path="/courier/shipments" element={<CourierShipmentsPage />} />
        <Route path="/courier/shipments/:shipmentId" element={<CourierShipmentDetailsPage />} />
        
        {/* Legal Pages */}
        <Route path="/terms" element={<TermsOfServicePage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/docs" element={<DocumentationPage />} />
      </Route>

      {/* Protected Dashboard Routes */}
      <Route element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/new" element={<RegisterProductPage />} />
        <Route path="/products/:productId" element={<ProductDetailPage />} />
        <Route path="/transfers" element={<TransfersPage />} />
        <Route path="/dashboard/shipments" element={<ShipmentsPage />} />
        <Route path="/dashboard/shipments/create" element={<CreateShipmentPage />} />
        <Route path="/dashboard/shipments/:id" element={<ShipmentDetailPage />} />
        <Route path="/dashboard/shipments/analytics" element={<ShipmentAnalyticsPage />} />
        <Route path="/dashboard/confirm-delivery" element={<ConfirmDeliveryPage />} />
        <Route path="/dashboard/confirm-delivery/:shipmentId" element={<ConfirmDeliveryPage />} />
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="/rewards" element={<RewardsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </>
  )
}

export default App
