/**
 * Notification Service
 * Frontend API service for in-app notifications
 */

import api from './api'

/**
 * Get user's notifications
 * @param {Object} options - Query options
 * @param {boolean} options.unreadOnly - Only return unread notifications
 * @param {string} options.category - Filter by category
 * @param {number} options.limit - Number of notifications to return
 * @param {number} options.offset - Pagination offset
 * @returns {Promise<Object>} Notifications data
 */
export const getNotifications = async (options = {}) => {
  const params = new URLSearchParams()
  
  if (options.unreadOnly) params.append('unread_only', 'true')
  if (options.category) params.append('category', options.category)
  if (options.limit) params.append('limit', options.limit)
  if (options.offset) params.append('offset', options.offset)
  
  const response = await api.get(`/notifications/?${params.toString()}`)
  return response.data
}

/**
 * Get unread notification count (lightweight)
 * @returns {Promise<number>} Unread count
 */
export const getUnreadCount = async () => {
  const response = await api.get('/notifications/unread-count')
  return response.data.unread_count
}

/**
 * Get a single notification by ID
 * @param {number} notificationId - Notification ID
 * @returns {Promise<Object>} Notification data
 */
export const getNotification = async (notificationId) => {
  const response = await api.get(`/notifications/${notificationId}`)
  return response.data
}

/**
 * Mark a notification as read
 * @param {number} notificationId - Notification ID
 * @returns {Promise<Object>} Updated notification
 */
export const markAsRead = async (notificationId) => {
  const response = await api.post(`/notifications/${notificationId}/read`)
  return response.data
}

/**
 * Mark all notifications as read
 * @returns {Promise<Object>} Success response
 */
export const markAllAsRead = async () => {
  const response = await api.post('/notifications/mark-all-read')
  return response.data
}

/**
 * Delete a notification
 * @param {number} notificationId - Notification ID
 * @returns {Promise<Object>} Success response
 */
export const deleteNotification = async (notificationId) => {
  const response = await api.delete(`/notifications/${notificationId}`)
  return response.data
}

/**
 * Clear all notifications
 * @param {boolean} readOnly - Only clear read notifications
 * @returns {Promise<Object>} Success response with deleted count
 */
export const clearAllNotifications = async (readOnly = false) => {
  const params = readOnly ? '?read_only=true' : ''
  const response = await api.delete(`/notifications/clear-all${params}`)
  return response.data
}

/**
 * Send a notification (for testing or admin use)
 * @param {Object} notification - Notification data
 * @param {string} notification.title - Notification title
 * @param {string} notification.message - Notification message
 * @param {string} notification.type - Notification type (info, success, warning, error)
 * @param {string} notification.category - Notification category
 * @returns {Promise<Object>} Created notification
 */
export const sendNotification = async (notification) => {
  const response = await api.post('/notifications/send', notification)
  return response.data
}

// Notification types and categories for reference
export const NotificationTypes = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error'
}

export const NotificationCategories = {
  SYSTEM: 'system',
  SHIPMENT: 'shipment',
  PRODUCT: 'product',
  TRANSFER: 'transfer',
  SECURITY: 'security',
  REWARDS: 'rewards',
  COURIER: 'courier'
}

export default {
  getNotifications,
  getUnreadCount,
  getNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  sendNotification,
  NotificationTypes,
  NotificationCategories
}
