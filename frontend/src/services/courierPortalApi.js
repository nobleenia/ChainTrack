/**
 * Courier Portal API Service
 * Handles courier authentication, profile management, and shipment access
 */

import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const COURIER_PORTAL_BASE = `${API_BASE}/courier-portal`

// Create axios instance for courier portal
const courierAxios = axios.create({
  baseURL: COURIER_PORTAL_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Token storage key
const COURIER_TOKEN_KEY = 'chaintrack_courier_token'
const COURIER_PROFILE_KEY = 'chaintrack_courier_profile'

// Add auth header interceptor
courierAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem(COURIER_TOKEN_KEY)
  if (token) {
    config.headers['X-Courier-Token'] = token
  }
  return config
})

// Handle auth errors
courierAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear stored credentials on auth failure
      localStorage.removeItem(COURIER_TOKEN_KEY)
      localStorage.removeItem(COURIER_PROFILE_KEY)
    }
    return Promise.reject(error)
  }
)

export const courierPortalApi = {
  // ============================================================
  // Authentication
  // ============================================================

  /**
   * Request OTP for courier login/registration
   * @param {string} phone - Phone number
   * @param {string} displayName - Name (required for new users)
   * @returns {Promise} Success message
   */
  requestOtp: async (phone, displayName = null) => {
    const response = await courierAxios.post('/auth/request-otp', {
      phone,
      display_name: displayName
    })
    return response.data
  },

  /**
   * Verify OTP and login
   * @param {string} phone - Phone number
   * @param {string} otp - 6-digit OTP
   * @returns {Promise} Session data with token and profile
   */
  verifyOtp: async (phone, otp) => {
    const response = await courierAxios.post('/auth/verify-otp', {
      phone,
      otp
    })
    
    // Store token and profile
    if (response.data.token) {
      localStorage.setItem(COURIER_TOKEN_KEY, response.data.token)
      localStorage.setItem(COURIER_PROFILE_KEY, JSON.stringify(response.data.profile))
    }
    
    return response.data
  },

  /**
   * Verify OTP and register new courier
   * @param {Object} data - Registration data
   * @param {string} data.phone - Phone number
   * @param {string} data.otp - 6-digit OTP
   * @param {string} data.display_name - Full name
   * @param {string} [data.company_name] - Company name (optional)
   * @param {string} [data.email] - Email (optional)
   * @param {string} [data.vehicle_type] - Vehicle type (optional)
   * @param {string} [data.vehicle_plate] - Vehicle plate (optional)
   * @returns {Promise} Session data with token and profile
   */
  verifyOtpAndRegister: async (data) => {
    const response = await courierAxios.post('/auth/register', data)
    
    // Store token and profile
    if (response.data.token) {
      localStorage.setItem(COURIER_TOKEN_KEY, response.data.token)
      localStorage.setItem(COURIER_PROFILE_KEY, JSON.stringify(response.data.profile))
    }
    
    return response.data
  },

  /**
   * Logout and invalidate session
   */
  logout: async () => {
    try {
      await courierAxios.post('/auth/logout')
    } finally {
      localStorage.removeItem(COURIER_TOKEN_KEY)
      localStorage.removeItem(COURIER_PROFILE_KEY)
    }
  },

  /**
   * Verify current session is valid
   * @returns {Promise} Validity and profile
   */
  verifySession: async () => {
    const response = await courierAxios.get('/auth/verify-session')
    return response.data
  },

  /**
   * Check if courier is logged in (local check)
   * @returns {boolean}
   */
  isLoggedIn: () => {
    return !!localStorage.getItem(COURIER_TOKEN_KEY)
  },

  /**
   * Get stored profile (local)
   * @returns {Object|null}
   */
  getStoredProfile: () => {
    const profile = localStorage.getItem(COURIER_PROFILE_KEY)
    return profile ? JSON.parse(profile) : null
  },

  /**
   * Get stored token
   * @returns {string|null}
   */
  getToken: () => {
    return localStorage.getItem(COURIER_TOKEN_KEY)
  },

  // ============================================================
  // Profile
  // ============================================================

  /**
   * Get current courier profile
   * @returns {Promise} Profile data with stats
   */
  getProfile: async () => {
    const response = await courierAxios.get('/profile')
    // Update stored profile
    localStorage.setItem(COURIER_PROFILE_KEY, JSON.stringify(response.data))
    return response.data
  },

  /**
   * Update courier profile
   * @param {Object} data - Profile fields to update
   * @returns {Promise} Updated profile
   */
  updateProfile: async (data) => {
    const response = await courierAxios.put('/profile', data)
    localStorage.setItem(COURIER_PROFILE_KEY, JSON.stringify(response.data))
    return response.data
  },

  /**
   * Get courier statistics
   * @returns {Promise} Stats and recent activity
   */
  getStats: async () => {
    const response = await courierAxios.get('/profile/stats')
    return response.data
  },

  // ============================================================
  // Shipments
  // ============================================================

  /**
   * Get assigned shipments
   * @param {string} status - Optional status filter
   * @returns {Promise} List of shipments
   */
  getAssignedShipments: async (status = null) => {
    const params = status ? { status } : {}
    const response = await courierAxios.get('/shipments', { params })
    return response.data
  },

  /**
   * Get shipment details
   * @param {string} shipmentId - Shipment ID
   * @param {string} authCode - Auth code (if not logged in)
   * @returns {Promise} Shipment details
   */
  getShipmentDetails: async (shipmentId, authCode = null) => {
    const params = authCode ? { auth_code: authCode } : {}
    const response = await courierAxios.get(`/shipments/${shipmentId}`, { params })
    return response.data
  },

  // ============================================================
  // Checkpoints
  // ============================================================

  /**
   * Record a checkpoint
   * @param {string} shipmentId - Shipment ID
   * @param {Object} data - Checkpoint data
   * @returns {Promise} Checkpoint result with blockchain info
   */
  recordCheckpoint: async (shipmentId, data) => {
    const response = await courierAxios.post(`/shipments/${shipmentId}/checkpoint`, data)
    return response.data
  },

  // ============================================================
  // Activities
  // ============================================================

  /**
   * Get courier activity history
   * @param {number} limit - Max results
   * @param {number} offset - Skip count
   * @returns {Promise} Activities list
   */
  getActivities: async (limit = 50, offset = 0) => {
    const response = await courierAxios.get('/activities', {
      params: { limit, offset }
    })
    return response.data
  },

  // ============================================================
  // Authorization Linking
  // ============================================================

  /**
   * Link an authorization code to the logged-in profile
   * @param {string} authCode - Authorization code
   * @returns {Promise} Link result
   */
  linkAuthorization: async (authCode) => {
    const response = await courierAxios.post('/link-authorization', {
      auth_code: authCode
    })
    return response.data
  },

  // ============================================================
  // Public Verification
  // ============================================================

  /**
   * Verify shipment chain integrity (public)
   * @param {string} shipmentId - Shipment ID
   * @returns {Promise} Verification result
   */
  verifyShipmentChain: async (shipmentId) => {
    const response = await courierAxios.get(`/verify/${shipmentId}`)
    return response.data
  }
}

export default courierPortalApi
