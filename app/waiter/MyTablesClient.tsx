'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { UtensilsCrossed, Plus, Clock } from 'lucide-react'

interface TableAssignment {
  table_id: number
  restaurant_tables: {
    id: number
    status: string
    current_order_id: string | null
    orders: {
      id: string
      status: string
      total_price: number
      created_at: string
    } | null
  }
}

interface MyTablesClientProps {
  assignments: TableAssignment[]
}

export default function MyTablesClient({ assignments }: MyTablesClientProps) {
  const router = useRouter()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'occupied':
        return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'empty':
        return 'bg-green-100 text-green-700 border-green-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700'
      case 'cooking':
        return 'bg-orange-100 text-orange-700'
      case 'ready':
        return 'bg-blue-100 text-blue-700'
      case 'served':
        return 'bg-purple-100 text-purple-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {assignments.map((assignment) => {
        const table = assignment.restaurant_tables
        const order = table.orders

        return (
          <motion.div
            key={table.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => router.push(`/waiter/order/${table.id}`)}
            className="bg-white rounded-2xl border-2 border-gray-200 p-4 cursor-pointer hover:border-green-400 hover:shadow-lg transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-green-500/30">
                  {table.id}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Table {table.id}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(table.status)}`}>
                    {table.status}
                  </span>
                </div>
              </div>
            </div>

            {order ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Order #{order.id.slice(0, 8)}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${getOrderStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total</span>
                  <span className="font-bold text-green-600">${Number(order.total_price).toFixed(2)}</span>
                </div>
                <button className="w-full mt-3 py-2 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors">
                  View Order
                </button>
              </div>
            ) : (
              <button className="w-full mt-3 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-xl shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all flex items-center justify-center gap-2">
                <Plus size={18} />
                Create Order
              </button>
            )}
          </motion.div>
        )
      })}

      {assignments.length === 0 && (
        <div className="col-span-full text-center py-12">
          <UtensilsCrossed className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No tables assigned</p>
          <p className="text-sm text-gray-500 mt-1">Contact administrator to assign tables</p>
        </div>
      )}
    </div>
  )
}
