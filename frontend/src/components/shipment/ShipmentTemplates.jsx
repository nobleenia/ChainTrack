import { useState, useEffect } from 'react'
import {
  DocumentDuplicateIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CubeIcon,
  TruckIcon,
  ClockIcon,
  DocumentTextIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'

const LOCAL_STORAGE_KEY = 'chaintrack_shipment_templates'

function ShipmentTemplates({ onSelect, selectedId = null }) {
  const [templates, setTemplates] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    package_type: 'standard',
    weight: '',
    dimensions: '',
    declared_value: '',
    special_instructions: '',
    is_fragile: false,
    requires_signature: true,
    priority: 'standard'
  })

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = () => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (saved) {
        setTemplates(JSON.parse(saved))
      } else {
        // Initialize with default templates
        const defaults = [
          {
            id: 'default-1',
            name: 'Standard Package',
            description: 'Regular delivery package',
            package_type: 'standard',
            weight: '',
            dimensions: '',
            declared_value: '',
            special_instructions: '',
            is_fragile: false,
            requires_signature: true,
            priority: 'standard',
            isDefault: true
          },
          {
            id: 'default-2',
            name: 'Fragile Items',
            description: 'Handle with care - fragile contents',
            package_type: 'fragile',
            weight: '',
            dimensions: '',
            declared_value: '',
            special_instructions: 'FRAGILE - Handle with extreme care. Do not stack.',
            is_fragile: true,
            requires_signature: true,
            priority: 'standard',
            isDefault: true
          },
          {
            id: 'default-3',
            name: 'Express Delivery',
            description: 'Priority shipping for urgent items',
            package_type: 'express',
            weight: '',
            dimensions: '',
            declared_value: '',
            special_instructions: 'URGENT - Priority delivery required.',
            is_fragile: false,
            requires_signature: true,
            priority: 'express',
            isDefault: true
          }
        ]
        setTemplates(defaults)
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaults))
      }
    } catch (e) {
      console.error('Failed to load templates:', e)
    }
  }

  const saveTemplates = (newTemplates) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newTemplates))
      setTemplates(newTemplates)
    } catch (e) {
      console.error('Failed to save templates:', e)
    }
  }

  const handleAddTemplate = () => {
    if (!formData.name) return

    const newTemplate = {
      id: Date.now().toString(),
      ...formData,
      createdAt: new Date().toISOString()
    }

    saveTemplates([...templates, newTemplate])
    resetForm()
    setShowModal(false)
  }

  const handleEditTemplate = () => {
    if (!formData.name || !editingTemplate) return

    const updatedTemplates = templates.map(tmpl =>
      tmpl.id === editingTemplate.id
        ? { ...tmpl, ...formData, updatedAt: new Date().toISOString() }
        : tmpl
    )

    saveTemplates(updatedTemplates)
    resetForm()
    setEditingTemplate(null)
  }

  const handleDeleteTemplate = (id) => {
    const template = templates.find(t => t.id === id)
    if (template?.isDefault) {
      alert('Cannot delete default templates')
      return
    }
    if (!confirm('Are you sure you want to delete this template?')) return
    const updatedTemplates = templates.filter(tmpl => tmpl.id !== id)
    saveTemplates(updatedTemplates)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      package_type: 'standard',
      weight: '',
      dimensions: '',
      declared_value: '',
      special_instructions: '',
      is_fragile: false,
      requires_signature: true,
      priority: 'standard'
    })
  }

  const openEditModal = (template) => {
    if (template.isDefault) {
      alert('Cannot edit default templates. Create a new one instead.')
      return
    }
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      description: template.description || '',
      package_type: template.package_type || 'standard',
      weight: template.weight || '',
      dimensions: template.dimensions || '',
      declared_value: template.declared_value || '',
      special_instructions: template.special_instructions || '',
      is_fragile: template.is_fragile || false,
      requires_signature: template.requires_signature !== false,
      priority: template.priority || 'standard'
    })
  }

  const getPackageTypeIcon = (type) => {
    switch (type) {
      case 'fragile':
        return '🔶'
      case 'express':
        return '⚡'
      case 'bulk':
        return '📦'
      default:
        return '📦'
    }
  }

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'express':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'priority':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DocumentDuplicateIcon className="w-5 h-5 text-primary-600" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Shipment Templates</h3>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          New Template
        </button>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {templates.map((template) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 border rounded-xl cursor-pointer transition-all ${
              selectedId === template.id
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-500'
                : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 bg-white dark:bg-gray-800'
            }`}
            onClick={() => onSelect?.(template)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{getPackageTypeIcon(template.package_type)}</span>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    {template.name}
                    {selectedId === template.id && (
                      <CheckIcon className="w-4 h-4 text-primary-600" />
                    )}
                  </h4>
                  {template.isDefault && (
                    <span className="text-xs text-gray-400">Default</span>
                  )}
                </div>
              </div>
              <span className={`px-2 py-0.5 text-xs rounded-full capitalize ${getPriorityBadge(template.priority)}`}>
                {template.priority}
              </span>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
              {template.description || 'No description'}
            </p>

            <div className="flex flex-wrap gap-2 mb-3">
              {template.is_fragile && (
                <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded-full">
                  Fragile
                </span>
              )}
              {template.requires_signature && (
                <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                  Signature Required
                </span>
              )}
              {template.weight && (
                <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-full">
                  {template.weight}
                </span>
              )}
            </div>

            {!template.isDefault && (
              <div className="flex items-center justify-end gap-1 pt-2 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    openEditModal(template)
                  }}
                  className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteTemplate(template.id)
                  }}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {(showModal || editingTemplate) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => {
              setShowModal(false)
              setEditingTemplate(null)
              resetForm()
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingTemplate ? 'Edit Template' : 'Create New Template'}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setEditingTemplate(null)
                    resetForm()
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Electronics Shipment"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of what this template is for"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Package Type
                    </label>
                    <select
                      value={formData.package_type}
                      onChange={(e) => setFormData({ ...formData, package_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="standard">Standard</option>
                      <option value="fragile">Fragile</option>
                      <option value="express">Express</option>
                      <option value="bulk">Bulk</option>
                      <option value="documents">Documents</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="standard">Standard</option>
                      <option value="priority">Priority</option>
                      <option value="express">Express</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Default Weight
                    </label>
                    <input
                      type="text"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      placeholder="e.g., 2kg"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Default Dimensions
                    </label>
                    <input
                      type="text"
                      value={formData.dimensions}
                      onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                      placeholder="e.g., 30x20x15cm"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Declared Value
                  </label>
                  <input
                    type="text"
                    value={formData.declared_value}
                    onChange={(e) => setFormData({ ...formData, declared_value: e.target.value })}
                    placeholder="e.g., ₦50,000"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Special Instructions
                  </label>
                  <textarea
                    value={formData.special_instructions}
                    onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
                    placeholder="Any special handling instructions"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_fragile}
                      onChange={(e) => setFormData({ ...formData, is_fragile: e.target.checked })}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300">Mark as Fragile</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.requires_signature}
                      onChange={(e) => setFormData({ ...formData, requires_signature: e.target.checked })}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300">Require Signature on Delivery</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setShowModal(false)
                    setEditingTemplate(null)
                    resetForm()
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={editingTemplate ? handleEditTemplate : handleAddTemplate}
                  disabled={!formData.name}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {editingTemplate ? 'Save Changes' : 'Create Template'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ShipmentTemplates
