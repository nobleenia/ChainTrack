/**
 * Shipment Store
 * Zustand store for P2P delivery/courier tracking state management
 */

import { create } from 'zustand'
import { shipmentApi } from '../services/shipmentApi'

const useShipmentStore = create((set, get) => ({
  // State
  shipments: [],
  currentShipment: null,
  trackingResult: null,
  pagination: {
    page: 1,
    per_page: 10,
    total: 0,
    pages: 0
  },
  loading: false,
  error: null,

  // Actions
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  /**
   * Fetch shipments for current user
   */
  fetchShipments: async (params = {}) => {
    set({ loading: true, error: null })
    try {
      const response = await shipmentApi.getShipments(params)
      set({
        shipments: response.shipments,
        pagination: response.pagination,
        loading: false
      })
      return response
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to fetch shipments'
      set({ error: message, loading: false })
      throw error
    }
  },

  /**
   * Fetch single shipment by ID
   */
  fetchShipment: async (id) => {
    set({ loading: true, error: null })
    try {
      const response = await shipmentApi.getShipment(id)
      set({ currentShipment: response.shipment, loading: false })
      return response.shipment
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to fetch shipment'
      set({ error: message, loading: false })
      throw error
    }
  },

  /**
   * Create new shipment
   */
  createShipment: async (shipmentData) => {
    set({ loading: true, error: null })
    try {
      const response = await shipmentApi.createShipment(shipmentData)
      // Add to list
      set((state) => ({
        shipments: [response.shipment, ...state.shipments],
        currentShipment: response.shipment,
        loading: false
      }))
      return response
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to create shipment'
      set({ error: message, loading: false })
      throw error
    }
  },

  /**
   * Add checkpoint to shipment
   */
  addCheckpoint: async (id, checkpointData) => {
    set({ loading: true, error: null })
    try {
      const response = await shipmentApi.addCheckpoint(id, checkpointData)
      // Update current shipment if it matches
      if (get().currentShipment?.id === id) {
        set({ currentShipment: response.shipment })
      }
      // Update in list
      set((state) => ({
        shipments: state.shipments.map((s) =>
          s.id === id ? { ...s, ...response.shipment } : s
        ),
        loading: false
      }))
      return response
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to add checkpoint'
      set({ error: message, loading: false })
      throw error
    }
  },

  /**
   * Mark shipment as delivered
   */
  markDelivered: async (id, deliveryData) => {
    set({ loading: true, error: null })
    try {
      const response = await shipmentApi.markDelivered(id, deliveryData)
      // Update current shipment
      if (get().currentShipment?.id === id) {
        set({ currentShipment: response.shipment })
      }
      // Update in list
      set((state) => ({
        shipments: state.shipments.map((s) =>
          s.id === id ? { ...s, status: 'delivered' } : s
        ),
        loading: false
      }))
      return response
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to mark as delivered'
      set({ error: message, loading: false })
      throw error
    }
  },

  /**
   * Confirm delivery (receiver action)
   */
  confirmDelivery: async (id, confirmationData) => {
    set({ loading: true, error: null })
    try {
      const response = await shipmentApi.confirmDelivery(id, confirmationData)
      // Update current shipment
      if (get().currentShipment?.id === id) {
        set({ currentShipment: response.shipment })
      }
      // Update in list
      set((state) => ({
        shipments: state.shipments.map((s) =>
          s.id === id ? { ...s, status: 'confirmed' } : s
        ),
        loading: false
      }))
      return response
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to confirm delivery'
      set({ error: message, loading: false })
      throw error
    }
  },

  /**
   * Track shipment publicly
   */
  trackShipment: async (shipmentId, pin) => {
    set({ loading: true, error: null, trackingResult: null })
    try {
      const response = await shipmentApi.trackShipment(shipmentId, pin)
      set({ trackingResult: response.shipment, loading: false })
      return response.shipment
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to track shipment'
      set({ error: message, loading: false })
      throw error
    }
  },

  /**
   * Clear tracking result
   */
  clearTracking: () => set({ trackingResult: null, error: null }),

  /**
   * Cancel shipment
   */
  cancelShipment: async (id) => {
    set({ loading: true, error: null })
    try {
      const response = await shipmentApi.cancelShipment(id)
      // Update in list
      set((state) => ({
        shipments: state.shipments.map((s) =>
          s.id === id ? { ...s, status: 'cancelled' } : s
        ),
        loading: false
      }))
      return response
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to cancel shipment'
      set({ error: message, loading: false })
      throw error
    }
  },

  /**
   * Get QR code data for shipment
   */
  getShipmentQR: async (id) => {
    try {
      const response = await shipmentApi.getShipmentQR(id)
      return response
    } catch (error) {
      throw error
    }
  },

  /**
   * Clear current shipment
   */
  clearCurrentShipment: () => set({ currentShipment: null }),

  /**
   * Reset store
   */
  reset: () =>
    set({
      shipments: [],
      currentShipment: null,
      trackingResult: null,
      pagination: { page: 1, per_page: 10, total: 0, pages: 0 },
      loading: false,
      error: null
    })
}))

export default useShipmentStore
