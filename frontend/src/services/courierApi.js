/**
 * Courier API Service
 * Handles courier authorization and chain verification
 */

import api from './api'

const COURIERS_BASE = '/couriers'

export const courierApi = {
  /**
   * Authorize a courier for a shipment
   * @param {string} shipmentId - Shipment ID
   * @param {Object} data - Authorization data
   * @returns {Promise} Authorization with auth_code
   */
  authorizeCourier: async (shipmentId, data) => {
    const response = await api.post(`${COURIERS_BASE}/shipments/${shipmentId}/authorize`, data)
    return response.data
  },

  /**
   * List all authorizations for a shipment
   * @param {string} shipmentId - Shipment ID
   * @returns {Promise} List of authorizations
   */
  getAuthorizations: async (shipmentId) => {
    const response = await api.get(`${COURIERS_BASE}/shipments/${shipmentId}/authorizations`)
    return response.data
  },

  /**
   * Revoke a courier authorization
   * @param {number} authId - Authorization ID
   * @returns {Promise} Success message
   */
  revokeAuthorization: async (authId) => {
    const response = await api.post(`${COURIERS_BASE}/authorizations/${authId}/revoke`)
    return response.data
  },

  /**
   * Verify if authorization is valid for an action
   * @param {Object} data - { shipment_id, action, auth_code }
   * @returns {Promise} Verification result
   */
  verifyAuthorization: async (data) => {
    const response = await api.post(`${COURIERS_BASE}/verify-auth`, data)
    return response.data
  },

  /**
   * Get tamper-proof checkpoint chain
   * @param {string} shipmentId - Shipment ID
   * @returns {Promise} Chain data
   */
  getCheckpointChain: async (shipmentId) => {
    const response = await api.get(`${COURIERS_BASE}/shipments/${shipmentId}/chain`)
    return response.data
  },

  /**
   * Verify chain integrity
   * @param {string} shipmentId - Shipment ID
   * @returns {Promise} Verification results
   */
  verifyChainIntegrity: async (shipmentId) => {
    const response = await api.get(`${COURIERS_BASE}/shipments/${shipmentId}/verify-integrity`)
    return response.data
  }
}

export default courierApi
