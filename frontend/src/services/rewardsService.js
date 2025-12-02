/**
 * Rewards Service
 * 
 * API calls for rewards, points, and token management
 */

import api from './api'

export const rewardsService = {
  /**
   * Get current user's rewards balance and stats
   */
  async getBalance() {
    const response = await api.get('/rewards/balance')
    return response.data.rewards
  },

  /**
   * Get rewards summary for dashboard display
   * Returns formatted data for quick overview
   */
  async getRewardsSummary() {
    const response = await api.get('/rewards/balance')
    const rewards = response.data.rewards
    
    return {
      points_balance: rewards.current_points,
      tokens_balance: rewards.ctk_tokens,
      tier: rewards.tier.toUpperCase(),
      total_verifications: rewards.stats?.total_verifications || 0,
      next_tier: rewards.next_tier_progress?.next_tier?.toUpperCase(),
      progress_to_next: rewards.next_tier_progress?.progress || 0,
      points_to_next_tier: rewards.next_tier_progress?.points_needed || 0
    }
  },

  /**
   * Claim daily login bonus
   */
  async claimDailyBonus() {
    const response = await api.post('/rewards/daily-bonus')
    return response.data
  },

  /**
   * Convert points to CTK tokens
   * @param {number} points - Number of points to convert (optional, converts all if not provided)
   */
  async convertToTokens(points = null) {
    const response = await api.post('/rewards/convert', { points })
    return response.data
  },

  /**
   * Get point transaction history
   * @param {number} limit - Number of transactions to retrieve
   */
  async getHistory(limit = 50) {
    const response = await api.get('/rewards/history', { params: { limit } })
    return response.data
  },

  /**
   * Get user's referral code
   */
  async getReferralCode() {
    const response = await api.get('/rewards/referral-code')
    return response.data
  },

  /**
   * Get public leaderboard
   * @param {number} limit - Number of entries to retrieve
   */
  async getLeaderboard(limit = 10) {
    const response = await api.get('/rewards/leaderboard', { params: { limit } })
    return response.data.leaderboard
  },

  /**
   * Get reward tiers information (public)
   */
  async getTiersInfo() {
    const response = await api.get('/rewards/tiers')
    return response.data
  },

  /**
   * Get detailed rewards statistics
   */
  async getStats() {
    const response = await api.get('/rewards/stats')
    return response.data
  }
}

export default rewardsService
