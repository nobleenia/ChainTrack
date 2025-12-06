/**
 * Token Service
 * API calls for CTK token operations
 */

import api from './api'

const TOKEN_BASE = '/tokens'

export const tokenService = {
  /**
   * Get general token information
   * @returns {Promise} Token info
   */
  getTokenInfo: async () => {
    const response = await api.get(`${TOKEN_BASE}/info`)
    return response.data
  },

  /**
   * Get token balance for a wallet address
   * @param {string} walletAddress - Ethereum wallet address
   * @returns {Promise} Balance info
   */
  getWalletBalance: async (walletAddress) => {
    const response = await api.get(`${TOKEN_BASE}/balance/${walletAddress}`)
    return response.data
  },

  /**
   * Get claimable tokens for current user
   * @returns {Promise} Claimable tokens info
   */
  getClaimable: async () => {
    const response = await api.get(`${TOKEN_BASE}/claimable`)
    return response.data
  },

  /**
   * Claim CTK tokens
   * @param {string} walletAddress - User's Ethereum wallet address
   * @returns {Promise} Claim result
   */
  claimTokens: async (walletAddress) => {
    const response = await api.post(`${TOKEN_BASE}/claim`, {
      wallet_address: walletAddress
    })
    return response.data
  },

  /**
   * Save wallet address for future claims
   * @param {string} walletAddress - User's Ethereum wallet address
   * @returns {Promise} Save result
   */
  saveWallet: async (walletAddress) => {
    const response = await api.post(`${TOKEN_BASE}/save-wallet`, {
      wallet_address: walletAddress
    })
    return response.data
  },

  /**
   * Get current user's saved wallet info
   * @returns {Promise} Wallet info
   */
  getMyWallet: async () => {
    const response = await api.get(`${TOKEN_BASE}/my-wallet`)
    return response.data
  }
}

export default tokenService
