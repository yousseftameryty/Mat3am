'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { motion } from 'framer-motion'
import { Plus, Minus, ShoppingBag, AlertTriangle } from 'lucide-react'

interface MenuItem {
  id: number
  name: string
  price: string
  category: string
}

interface OrderItem {
  id: number
  quantity: number
  price_at_time: number
  menu_items: {
    name: string
    category: string
  }
}

interface Order {
  id: string
  status: string
  total_price: number
  order_items: OrderItem[]
}

interface WaiterOrderClientProps {
  tableId: number
  menuItems: MenuItem[]
  currentOrder: Order | null
}

export default function WaiterOrderClient({
  tableId,
  menuItems,
  currentOrder,
}: WaiterOrderClientProps) {
  const router = useRouter()
  const [cart, setCart] = useState<Array<{ id: number; name: string; price: number; qty: number }>>([])
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [hasAllergies, setHasAllergies] = useState(false)
  const [loading, setLoading] = useState(false)

  const categories = Array.from(new Set(menuItems.map(item => item.category)))
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const filteredItems = menuItems.filter(item =>
    selectedCategory === 'all' || item.category === selectedCategory
  )

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i)
      }
      return [...prev, { id: item.id, name: item.name, price: Number(item.price), qty: 1 }]
    })
  }

  const updateQty = (id: number, delta: number) => {
    setCart(prev =>
      prev.map(item => {
        if (item.id === id) {
          return { ...item, qty: Math.max(0, item.qty + delta) }
        }
        return item
      }).filter(i => i.qty > 0)
    )
  }

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0)
  const tax = subtotal * 0.1
  const total = subtotal + tax

  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      alert('Cart is empty!')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          table_id: tableId,
          total_price: total,
          status: 'pending',
          notes: specialInstructions || (hasAllergies ? '⚠️ ALLERGY ALERT - Please notify kitchen' : null)
        })
        .select()
        .single()

      if (orderError) {
        alert('Failed to create order: ' + orderError.message)
        setLoading(false)
        return
      }

      // Create order items
      const itemsToInsert = cart.map(item => ({
        order_id: order.id,
        menu_item_id: item.id,
        quantity: item.qty,
        price_at_time: item.price,
        modifiers: {}
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(itemsToInsert)

      if (itemsError) {
        alert('Failed to add items: ' + itemsError.message)
        setLoading(false)
        return
      }

      // If allergies, notify kitchen
      if (hasAllergies) {
        // Could add a notification system here
        console.log('⚠️ ALLERGY ALERT for order', order.id)
      }

      router.push('/waiter')
      router.refresh()
    } catch (error: any) {
      alert('Failed to submit order: ' + error.message)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
            selectedCategory === 'all'
              ? 'bg-green-600 text-white'
              : 'bg-white text-gray-600 border border-gray-200'
          }`}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap capitalize ${
              selectedCategory === cat
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Menu Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredItems.map((item) => (
              <motion.button
                key={item.id}
                onClick={() => addToCart(item)}
                className="bg-white border-2 border-gray-200 rounded-xl p-4 text-left hover:border-green-400 hover:shadow-md transition-all"
              >
                <div className="font-bold text-gray-900 mb-1">{item.name}</div>
                <div className="text-sm text-gray-600 capitalize mb-2">{item.category}</div>
                <div className="font-bold text-green-600">${Number(item.price).toFixed(2)}</div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Cart */}
        <div className="lg:col-span-1 bg-white rounded-2xl border-2 border-gray-200 p-4 space-y-4">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <ShoppingBag size={20} />
            Order
          </h2>

          {cart.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Cart is empty</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.name}</div>
                    <div className="text-xs text-gray-500">${item.price.toFixed(2)} each</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQty(item.id, -1)}
                      className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center font-bold">{item.qty}</span>
                    <button
                      onClick={() => updateQty(item.id, 1)}
                      className="w-6 h-6 bg-green-600 text-white rounded flex items-center justify-center"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Special Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Special Instructions
            </label>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              placeholder="Add any special requests..."
            />
          </div>

          {/* Allergy Alert */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={hasAllergies}
              onChange={(e) => setHasAllergies(e.target.checked)}
              className="w-4 h-4"
            />
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <span className="font-medium">Allergy Alert</span>
            </div>
          </label>

          {/* Total */}
          <div className="border-t border-gray-200 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax (10%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
              <span>Total</span>
              <span className="text-green-600">${total.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handleSubmitOrder}
            disabled={cart.length === 0 || loading}
            className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit Order'}
          </button>
        </div>
      </div>
    </div>
  )
}
