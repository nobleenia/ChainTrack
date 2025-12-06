/**
 * Shipment API Service
 * Handles all P2P delivery/courier tracking operations
 */

import api from './api'

const SHIPMENTS_BASE = '/shipments/'

export const shipmentApi = {
  /**
   * Create a new shipment
   * @param {Object} shipmentData - Shipment details
   * @returns {Promise} Created shipment
   */
  createShipment: async (shipmentData) => {
    const response = await api.post(SHIPMENTS_BASE, shipmentData)
    return response.data
  },

  /**
   * Get all shipments for current user
   * @param {Object} params - Query parameters (page, per_page, status, role)
   * @returns {Promise} Paginated shipments
   */
  getShipments: async (params = {}) => {
    const response = await api.get(SHIPMENTS_BASE, { params })
    return response.data
  },

  /**
   * Get shipment by ID
   * @param {number} id - Shipment ID
   * @returns {Promise} Shipment details
   */
  getShipment: async (id) => {
    const response = await api.get(`${SHIPMENTS_BASE}/${id}`)
    return response.data
  },

  /**
   * Get QR code data for shipment
   * @param {number} id - Shipment ID
   * @returns {Promise} QR code data
   */
  getShipmentQR: async (id) => {
    const response = await api.get(`${SHIPMENTS_BASE}/${id}/qr`)
    return response.data
  },

  /**
   * Add checkpoint to shipment
   * @param {number} id - Shipment ID
   * @param {Object} checkpointData - Checkpoint details
   * @returns {Promise} Added checkpoint
   */
  addCheckpoint: async (id, checkpointData) => {
    const response = await api.post(`${SHIPMENTS_BASE}/${id}/checkpoint`, checkpointData)
    return response.data
  },

  /**
   * Mark shipment as delivered
   * @param {number} id - Shipment ID
   * @param {Object} deliveryData - Delivery proof data
   * @returns {Promise} Updated shipment
   */
  markDelivered: async (id, deliveryData) => {
    const response = await api.post(`${SHIPMENTS_BASE}/${id}/deliver`, deliveryData)
    return response.data
  },

  /**
   * Confirm delivery (receiver)
   * @param {number} id - Shipment ID
   * @param {Object} confirmationData - Confirmation details
   * @returns {Promise} Confirmed shipment
   */
  confirmDelivery: async (id, confirmationData) => {
    const response = await api.post(`${SHIPMENTS_BASE}/${id}/confirm`, confirmationData)
    return response.data
  },

  /**
   * Track shipment publicly (no auth required)
   * @param {string} shipmentId - Shipment ID (SHP-XXXXXX format)
   * @param {string} pin - Tracking PIN
   * @returns {Promise} Shipment tracking info
   */
  trackShipment: async (shipmentId, pin) => {
    const response = await api.get(`${SHIPMENTS_BASE}/track/${shipmentId}`, {
      params: { pin }
    })
    return response.data
  },

  /**
   * Cancel shipment
   * @param {number} id - Shipment ID
   * @returns {Promise} Cancelled shipment
   */
  cancelShipment: async (id) => {
    const response = await api.post(`${SHIPMENTS_BASE}/${id}/cancel`)
    return response.data
  },

  /**
   * Get active shipments for a product
   * @param {string} productId - Product ID (e.g., PRD-XXXXXX)
   * @returns {Promise} Active shipment info
   */
  getProductShipments: async (productId) => {
    const response = await api.get(`${SHIPMENTS_BASE}/product/${productId}`)
    return response.data
  },

  /**
   * Claim a shipment for tracking (add to user's tracked shipments)
   * @param {string} shipmentId - Shipment ID (SHP-XXXXXX format)
   * @param {string} pin - Tracking PIN
   * @returns {Promise} Tracking record
   */
  claimForTracking: async (shipmentId, pin) => {
    const response = await api.post(`${SHIPMENTS_BASE}/claim-tracking`, {
      shipment_id: shipmentId,
      pin
    })
    return response.data
  },

  /**
   * Upload photo to IPFS
   * @param {File} file - Photo file
   * @returns {Promise} IPFS hash
   */
  uploadPhoto: async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post(`${SHIPMENTS_BASE}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  }
}

export default shipmentApi
