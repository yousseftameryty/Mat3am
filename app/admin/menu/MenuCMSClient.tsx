'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Plus, Edit, Trash2, Image as ImageIcon, Search, ToggleLeft, ToggleRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface MenuItem {
  id: number
  name: string
  description: string | null
  price: string
  category: string
  image_url: string | null
  is_available: boolean
}

interface MenuCMSClientProps {
  initialMenuItems: MenuItem[]
}

export default function MenuCMSClient({ initialMenuItems }: MenuCMSClientProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [loading, setLoading] = useState(false)

  const categories = ['all', ...Array.from(new Set(menuItems.map(item => item.category)))]

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleToggleAvailability = async (itemId: number, currentStatus: boolean) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('menu_items')
      .update({ is_available: !currentStatus })
      .eq('id', itemId)

    if (!error) {
      setMenuItems(menuItems.map(item => 
        item.id === itemId ? { ...item, is_available: !currentStatus } : item
      ))
    } else {
      alert('Failed to update availability')
    }
  }

  const handleSaveItem = async (formData: FormData) => {
    setLoading(true)
    try {
      const supabase = createClient()
      const id = editingItem?.id
      const data = {
        name: formData.get('name') as string,
        description: formData.get('description') as string || null,
        price: formData.get('price') as string,
        category: formData.get('category') as string,
        is_available: formData.get('is_available') === 'true',
      }

      if (id) {
        // Update existing
        const { error } = await supabase
          .from('menu_items')
          .update(data)
          .eq('id', id)

        if (!error) {
          setMenuItems(menuItems.map(item => item.id === id ? { ...item, ...data } : item))
          setEditingItem(null)
        } else {
          alert('Failed to update menu item')
        }
      } else {
        // Create new
        const { data: newItem, error } = await supabase
          .from('menu_items')
          .insert(data)
          .select()
          .single()

        if (!error && newItem) {
          setMenuItems([...menuItems, newItem])
          setShowCreateModal(false)
        } else {
          alert('Failed to create menu item')
        }
      }
    } catch (error: any) {
      alert(error.message || 'Failed to save menu item')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div className="flex gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>
            ))}
          </select>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-xl shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all"
          >
            <Plus size={20} />
            Add Item
          </button>
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="aspect-video bg-gray-100 flex items-center justify-center relative">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-12 h-12 text-gray-400" />
              )}
              <button
                onClick={() => handleToggleAvailability(item.id, item.is_available)}
                className="absolute top-3 right-3"
              >
                {item.is_available ? (
                  <ToggleRight className="w-8 h-8 text-green-600" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-gray-400" />
                )}
              </button>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-gray-900">{item.name}</h3>
                <span className="font-bold text-green-600">${Number(item.price).toFixed(2)}</span>
              </div>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description || 'No description'}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full capitalize">
                  {item.category}
                </span>
                <button
                  onClick={() => setEditingItem(item)}
                  className="text-blue-600 hover:text-blue-900"
                >
                  <Edit size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {(showCreateModal || editingItem) && (
          <MenuItemModal
            item={editingItem}
            onClose={() => {
              setShowCreateModal(false)
              setEditingItem(null)
            }}
            onSave={handleSaveItem}
            loading={loading}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function MenuItemModal({
  item,
  onClose,
  onSave,
  loading,
}: {
  item: MenuItem | null
  onClose: () => void
  onSave: (formData: FormData) => void
  loading: boolean
}) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-2xl font-bold mb-4">
          {item ? 'Edit Menu Item' : 'Create Menu Item'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              name="name"
              defaultValue={item?.name || ''}
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              defaultValue={item?.description || ''}
              rows={3}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price
              </label>
              <input
                type="number"
                step="0.01"
                name="price"
                defaultValue={item?.price || ''}
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <input
                type="text"
                name="category"
                defaultValue={item?.category || ''}
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_available"
                value="true"
                defaultChecked={item?.is_available !== false}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-700">Available</span>
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-xl shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : item ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
