'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, CheckCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

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
  table_id: number
  total_price: number
  created_at: string
  kitchen_received_at: string | null
  order_items: OrderItem[]
  restaurant_tables: {
    id: number
  }
}

interface KitchenDisplayClientProps {
  initialOrders: Order[]
}

export default function KitchenDisplayClient({ initialOrders }: KitchenDisplayClientProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [lastOrderCount, setLastOrderCount] = useState(initialOrders.length)

  useEffect(() => {
    const supabase = createClient()

    // Subscribe to order changes
    const channel = supabase
      .channel('kitchen-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `status=in.(pending,cooking)`,
        },
        (payload) => {
          // Refetch orders
          supabase
            .from('orders')
            .select(`
              *,
              order_items (
                id,
                quantity,
                price_at_time,
                menu_items (
                  name,
                  category
                )
              ),
              restaurant_tables (
                id
              )
            `)
            .in('status', ['pending', 'cooking'])
            .order('created_at', { ascending: true })
            .then(({ data }) => {
              if (data) {
                // Play sound if new order added
                if (soundEnabled && data.length > lastOrderCount) {
                  playNotificationSound()
                }
                setOrders(data)
                setLastOrderCount(data.length)
              }
            })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [soundEnabled, lastOrderCount])

  const playNotificationSound = () => {
    const audio = new Audio('/notification.mp3')
    audio.play().catch(() => {
      // Fallback: use Web Audio API
      const context = new AudioContext()
      const oscillator = context.createOscillator()
      const gainNode = context.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(context.destination)
      oscillator.frequency.value = 800
      gainNode.gain.value = 0.3
      oscillator.start()
      oscillator.stop(context.currentTime + 0.2)
    })
  }

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    const supabase = createClient()
    await supabase
      .from('orders')
      .update({ 
        status: newStatus,
        ...(newStatus === 'cooking' && { kitchen_received_at: new Date().toISOString() })
      })
      .eq('id', orderId)

    setOrders(orders.map(order => 
      order.id === orderId 
        ? { ...order, status: newStatus, kitchen_received_at: newStatus === 'cooking' ? new Date().toISOString() : order.kitchen_received_at }
        : order
    ))
  }

  const getOrderAge = (createdAt: string) => {
    return formatDistanceToNow(new Date(createdAt), { addSuffix: false })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="text-2xl font-bold">
          {orders.length} {orders.length === 1 ? 'Order' : 'Orders'} in Queue
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={soundEnabled}
            onChange={(e) => setSoundEnabled(e.target.checked)}
            className="w-5 h-5"
          />
          <span>Sound Alerts</span>
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {orders.map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`bg-white rounded-2xl p-6 shadow-2xl border-4 ${
                order.status === 'pending' ? 'border-yellow-500' : 'border-orange-500'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b-2 border-gray-200">
                <div>
                  <div className="text-3xl font-black text-gray-900">Table {order.table_id}</div>
                  <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                    <Clock size={14} />
                    {getOrderAge(order.created_at)} ago
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-green-600">
                    ${Number(order.total_price).toFixed(2)}
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full mt-1 ${
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {order.status.toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-3 mb-4">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-600 text-white rounded-lg flex items-center justify-center font-bold">
                        {item.quantity}x
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{item.menu_items.name}</div>
                        <div className="text-xs text-gray-500 capitalize">{item.menu_items.category}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              {order.status === 'pending' ? (
                <button
                  onClick={() => handleStatusUpdate(order.id, 'cooking')}
                  className="w-full py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                >
                  Start Cooking
                </button>
              ) : (
                <button
                  onClick={() => handleStatusUpdate(order.id, 'ready')}
                  className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle size={20} />
                  Mark Ready
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {orders.length === 0 && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🍽️</div>
          <div className="text-2xl font-bold text-gray-400">No orders in queue</div>
          <div className="text-gray-500 mt-2">Waiting for new orders...</div>
        </div>
      )}
    </div>
  )
}
