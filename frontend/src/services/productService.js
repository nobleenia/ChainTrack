import api from './api'

export const productService = {
  // Get all products with optional filters
  getProducts: async (params = {}) => {
    const response = await api.get('/products', { params })
    return response.data
  },

  // Get a single product by ID
  getProduct: async (productId) => {
    const response = await api.get(`/products/${productId}`)
    return response.data
  },

  // Register a new product
  registerProduct: async (productData) => {
    const response = await api.post('/products', productData)
    return response.data
  },

  // Update product details
  updateProduct: async (productId, productData) => {
    const response = await api.put(`/products/${productId}`, productData)
    return response.data
  },

  // Get product statistics
  getStats: async () => {
    const response = await api.get('/products/stats')
    return response.data
  },

  // Verify a product (public endpoint)
  verifyProduct: async (productId) => {
    const response = await api.get(`/verify/${productId}`)
    return response.data
  },

  // Check if product exists
  checkProduct: async (productId) => {
    const response = await api.post('/verify/check', { product_id: productId })
    return response.data
  },
}

export const transferService = {
  // Get all transfers
  getTransfers: async (params = {}) => {
    const response = await api.get('/transfers', { params })
    return response.data
  },

  // Create a new transfer
  createTransfer: async (transferData) => {
    const response = await api.post('/transfers', transferData)
    return response.data
  },

  // Confirm a transfer
  confirmTransfer: async (transferId) => {
    const response = await api.post(`/transfers/${transferId}/confirm`)
    return response.data
  },

  // Get transfers for a specific product
  getProductTransfers: async (productId) => {
    const response = await api.get(`/transfers/product/${productId}`)
    return response.data
  },
}

export const authService = {
  // Get current user
  getCurrentUser: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },

  // Update profile
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/me', profileData)
    return response.data
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    const response = await api.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    })
    return response.data
  },
}
