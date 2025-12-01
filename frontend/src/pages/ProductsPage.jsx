/**
 * ProductsPage
 * 
 * Displays list of products with filtering, search, and pagination.
 * Users can view their products or all products based on role.
 */

import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Filter, 
  Package,
  Grid,
  List,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { productService } from '../services/productService'
import { useAuthStore } from '../store/authStore'
import ProductCard, { ProductCardSkeleton } from '../components/products/ProductCard'
import { Button, LoadingSpinner } from '../components/common'

// Status filter options
const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'recalled', label: 'Recalled' },
]

// Category filter options
const categoryOptions = [
  { value: '', label: 'All Categories' },
  { value: 'food', label: 'Food & Beverage' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'pharmaceutical', label: 'Pharmaceutical' },
  { value: 'clothing', label: 'Clothing & Apparel' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'other', label: 'Other' },
]

export default function ProductsPage() {
  // State
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)

  const { user } = useAuthStore()
  const isManufacturer = user?.role === 'manufacturer'

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const params = {
        page,
        per_page: 12,
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(categoryFilter && { category: categoryFilter }),
      }
      
      const data = await productService.getProducts(params)
      setProducts(data.products || [])
      setTotalPages(data.pages || 1)
      setTotalProducts(data.total || 0)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load products')
      setProducts([])
    } finally {
      setIsLoading(false)
    }
  }, [page, search, statusFilter, categoryFilter])

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, categoryFilter])

  // Handle search with debounce
  const handleSearchChange = (e) => {
    setSearch(e.target.value)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 mt-1">
            {totalProducts} product{totalProducts !== 1 ? 's' : ''} registered
          </p>
        </div>

        {/* Add Product Button - Only for manufacturers */}
        {isManufacturer && (
          <Link to="/products/register">
            <Button leftIcon={<Plus size={20} />}>
              Register Product
            </Button>
          </Link>
        )}
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search products by name or ID..."
              value={search}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 appearance-none bg-white min-w-[150px]"
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 appearance-none bg-white min-w-[180px]"
            >
              {categoryOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* View Toggle & Refresh */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 rounded-lg transition ${
                viewMode === 'grid' 
                  ? 'bg-primary-100 text-primary-600' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              title="Grid view"
            >
              <Grid size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 rounded-lg transition ${
                viewMode === 'list' 
                  ? 'bg-primary-100 text-primary-600' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              title="List view"
            >
              <List size={20} />
            </button>
            <button
              onClick={fetchProducts}
              disabled={isLoading}
              className="p-2.5 text-gray-400 hover:text-gray-600 rounded-lg transition disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg"
        >
          {error}
        </motion.div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className={`grid gap-4 ${viewMode === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <ProductCardSkeleton key={i} compact={viewMode === 'list'} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && products.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 bg-white rounded-xl border border-gray-200"
        >
          <Package size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-500 mb-6">
            {search || statusFilter || categoryFilter
              ? 'Try adjusting your filters'
              : 'Get started by registering your first product'}
          </p>
          {isManufacturer && !search && !statusFilter && !categoryFilter && (
            <Link to="/products/register">
              <Button leftIcon={<Plus size={20} />}>
                Register Product
              </Button>
            </Link>
          )}
        </motion.div>
      )}

      {/* Products Grid/List */}
      {!isLoading && products.length > 0 && (
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`grid gap-4 ${
              viewMode === 'grid' 
                ? 'sm:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1'
            }`}
          >
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ProductCard 
                  product={product} 
                  compact={viewMode === 'list'}
                />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
