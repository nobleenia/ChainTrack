/**
 * Courier Store
 * Zustand store for managing courier authentication and state
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import courierPortalApi from '../services/courierPortalApi'

export const useCourierStore = create(
  persist(
    (set, get) => ({
      // State
      profile: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      // Shipments state
      shipments: [],
      currentShipment: null,
      
      // Stats
      stats: null,
      activities: [],

      // ============================================================
      // Authentication Actions
      // ============================================================

      /**
       * Request OTP for login/registration
       */
      requestOtp: async (phone, displayName = null) => {
        set({ isLoading: true, error: null })
        try {
          const result = await courierPortalApi.requestOtp(phone, displayName)
          set({ isLoading: false })
          return result
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error.response?.data?.error || 'Failed to send OTP' 
          })
          throw error
        }
      },

      /**
       * Verify OTP and complete login
       */
      verifyOtp: async (phone, otp) => {
        set({ isLoading: true, error: null })
        try {
          const result = await courierPortalApi.verifyOtp(phone, otp)
          set({ 
            isLoading: false,
            isAuthenticated: true,
            profile: result.profile
          })
          return result
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error.response?.data?.error || 'Invalid OTP' 
          })
          throw error
        }
      },

      /**
       * Logout
       */
      logout: async () => {
        try {
          await courierPortalApi.logout()
        } finally {
          set({
            profile: null,
            isAuthenticated: false,
            shipments: [],
            currentShipment: null,
            stats: null,
            activities: []
          })
        }
      },

      /**
       * Initialize auth from stored token
       */
      initializeAuth: async () => {
        if (courierPortalApi.isLoggedIn()) {
          try {
            const result = await courierPortalApi.verifySession()
            set({
              isAuthenticated: true,
              profile: result.profile
            })
            return true
          } catch {
            // Token invalid, clear state
            set({
              isAuthenticated: false,
              profile: null
            })
            return false
          }
        }
        return false
      },

      // ============================================================
      // Profile Actions
      // ============================================================

      /**
       * Fetch profile from server
       */
      fetchProfile: async () => {
        set({ isLoading: true })
        try {
          const profile = await courierPortalApi.getProfile()
          set({ isLoading: false, profile })
          return profile
        } catch (error) {
          set({ isLoading: false, error: error.response?.data?.error })
          throw error
        }
      },

      /**
       * Update profile
       */
      updateProfile: async (data) => {
        set({ isLoading: true })
        try {
          const profile = await courierPortalApi.updateProfile(data)
          set({ isLoading: false, profile })
          return profile
        } catch (error) {
          set({ isLoading: false, error: error.response?.data?.error })
          throw error
        }
      },

      // ============================================================
      // Shipment Actions
      // ============================================================

      /**
       * Fetch assigned shipments
       */
      fetchShipments: async (status = null) => {
        set({ isLoading: true })
        try {
          const result = await courierPortalApi.getAssignedShipments(status)
          set({ isLoading: false, shipments: result.shipments })
          return result.shipments
        } catch (error) {
          set({ isLoading: false, error: error.response?.data?.error })
          throw error
        }
      },

      /**
       * Fetch shipment details
       */
      fetchShipmentDetails: async (shipmentId, authCode = null) => {
        set({ isLoading: true })
        try {
          const result = await courierPortalApi.getShipmentDetails(shipmentId, authCode)
          set({ isLoading: false, currentShipment: result })
          return result
        } catch (error) {
          set({ isLoading: false, error: error.response?.data?.error })
          throw error
        }
      },

      /**
       * Record checkpoint
       */
      recordCheckpoint: async (shipmentId, data) => {
        set({ isLoading: true })
        try {
          const result = await courierPortalApi.recordCheckpoint(shipmentId, data)
          set({ isLoading: false })
          
          // Refresh shipment if viewing
          if (get().currentShipment?.shipment?.shipment_id === shipmentId) {
            get().fetchShipmentDetails(shipmentId)
          }
          
          return result
        } catch (error) {
          set({ isLoading: false, error: error.response?.data?.error })
          throw error
        }
      },

      // ============================================================
      // Stats & Activities
      // ============================================================

      /**
       * Fetch courier stats
       */
      fetchStats: async () => {
        try {
          const stats = await courierPortalApi.getStats()
          set({ stats })
          return stats
        } catch (error) {
          set({ error: error.response?.data?.error })
          throw error
        }
      },

      /**
       * Fetch activities
       */
      fetchActivities: async (limit = 50, offset = 0) => {
        try {
          const result = await courierPortalApi.getActivities(limit, offset)
          set({ activities: result.activities })
          return result.activities
        } catch (error) {
          set({ error: error.response?.data?.error })
          throw error
        }
      },

      // ============================================================
      // Authorization Linking
      // ============================================================

      /**
       * Link auth code to profile
       */
      linkAuthCode: async (authCode) => {
        set({ isLoading: true })
        try {
          const result = await courierPortalApi.linkAuthorization(authCode)
          set({ isLoading: false })
          
          // Refresh shipments
          get().fetchShipments()
          
          return result
        } catch (error) {
          set({ isLoading: false, error: error.response?.data?.error })
          throw error
        }
      },

      // ============================================================
      // Utility
      // ============================================================

      clearError: () => set({ error: null }),
      
      clearCurrentShipment: () => set({ currentShipment: null })
    }),
    {
      name: 'courier-storage',
      partialize: (state) => ({
        profile: state.profile,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)

export default useCourierStore
