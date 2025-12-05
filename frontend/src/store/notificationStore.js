/**
 * Notification Store
 * Zustand store for managing in-app notifications state
 */

import { create } from 'zustand'
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications
} from '../services/notificationService'

// Polling interval for checking new notifications (30 seconds)
const POLLING_INTERVAL = 30000

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  lastFetched: null,
  pollingInterval: null,
  
  // Fetch notifications from API
  fetchNotifications: async (options = {}) => {
    set({ isLoading: true, error: null })
    try {
      const data = await getNotifications(options)
      set({
        notifications: data.notifications,
        unreadCount: data.unread_count,
        isLoading: false,
        lastFetched: new Date()
      })
      return data
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      set({ 
        isLoading: false, 
        error: error.response?.data?.error || 'Failed to fetch notifications' 
      })
      return null
    }
  },
  
  // Fetch only unread count (lightweight)
  fetchUnreadCount: async () => {
    try {
      const count = await getUnreadCount()
      set({ unreadCount: count })
      return count
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
      return get().unreadCount
    }
  },
  
  // Mark a single notification as read
  markNotificationAsRead: async (notificationId) => {
    try {
      await markAsRead(notificationId)
      set(state => ({
        notifications: state.notifications.map(n =>
          n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }))
      return true
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      return false
    }
  },
  
  // Mark all notifications as read
  markAllNotificationsAsRead: async () => {
    try {
      await markAllAsRead()
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() })),
        unreadCount: 0
      }))
      return true
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
      return false
    }
  },
  
  // Delete a notification
  removeNotification: async (notificationId) => {
    try {
      await deleteNotification(notificationId)
      set(state => {
        const notification = state.notifications.find(n => n.id === notificationId)
        return {
          notifications: state.notifications.filter(n => n.id !== notificationId),
          unreadCount: notification && !notification.is_read 
            ? Math.max(0, state.unreadCount - 1) 
            : state.unreadCount
        }
      })
      return true
    } catch (error) {
      console.error('Failed to delete notification:', error)
      return false
    }
  },
  
  // Clear all notifications
  clearNotifications: async (readOnly = false) => {
    try {
      const result = await clearAllNotifications(readOnly)
      if (readOnly) {
        // Only remove read notifications from state
        set(state => ({
          notifications: state.notifications.filter(n => !n.is_read)
        }))
      } else {
        // Clear all
        set({ notifications: [], unreadCount: 0 })
      }
      return result.deleted_count
    } catch (error) {
      console.error('Failed to clear notifications:', error)
      return 0
    }
  },
  
  // Add a notification to the local state (for optimistic updates or websocket)
  addNotification: (notification) => {
    set(state => ({
      notifications: [notification, ...state.notifications],
      unreadCount: notification.is_read ? state.unreadCount : state.unreadCount + 1
    }))
  },
  
  // Start polling for new notifications
  startPolling: () => {
    const { pollingInterval, fetchUnreadCount } = get()
    
    // Don't start if already polling
    if (pollingInterval) return
    
    // Initial fetch
    fetchUnreadCount()
    
    // Set up interval
    const interval = setInterval(() => {
      fetchUnreadCount()
    }, POLLING_INTERVAL)
    
    set({ pollingInterval: interval })
  },
  
  // Stop polling
  stopPolling: () => {
    const { pollingInterval } = get()
    if (pollingInterval) {
      clearInterval(pollingInterval)
      set({ pollingInterval: null })
    }
  },
  
  // Reset store (on logout)
  reset: () => {
    const { pollingInterval } = get()
    if (pollingInterval) {
      clearInterval(pollingInterval)
    }
    set({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      error: null,
      lastFetched: null,
      pollingInterval: null
    })
  }
}))

export default useNotificationStore
