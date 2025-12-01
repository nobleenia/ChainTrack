import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    // Token is managed by authStore
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If 401 and not already retrying, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      // Import dynamically to avoid circular dependency
      const { useAuthStore } = await import('../store/authStore')
      const refreshed = await useAuthStore.getState().refreshAccessToken()

      if (refreshed) {
        return api(originalRequest)
      }
    }

    return Promise.reject(error)
  }
)

export default api
