'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { motion } from 'framer-motion'
import { Plus, Bell, CheckCircle } from 'lucide-react'

interface AvailableTable {
  id: number
  status: string
  current_order_id: string | null
  has_pending_order: boolean
  order_created_at: string | null
}

interface AvailableTablesProps {
  waiterId: string
  onAssign: () => void
}

export default function AvailableTables({ waiterId, onAssign }: AvailableTablesProps) {
  const [availableTables, setAvailableTables] = useState<AvailableTable[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    
    // Fetch tables with pending orders that aren't assigned
    const fetchAvailableTables = async () => {
      const { data: tables } = await supabase
        .from('restaurant_tables')
        .select(`
          id,
          status,
          current_order_id,
          orders!restaurant_tables_current_order_id_fkey (
            id,
            status,
            created_at
          )
        `)
        .eq('status', 'occupied')
        .not('current_order_id', 'is', null)

      if (tables) {
        // Get all assigned tables
        const { data: assignments } = await supabase
          .from('waiter_assignments')
          .select('table_id')
          .is('unassigned_at', null)

        const assignedTableIds = new Set(assignments?.map(a => a.table_id) || [])

        // Filter: tables with pending orders that aren't assigned
        const available = tables
          .filter(table => {
            const order = Array.isArray(table.orders) ? table.orders[0] : table.orders
            return (
              order &&
              ['pending', 'cooking', 'ready'].includes(order.status) &&
              !assignedTableIds.has(table.id)
            )
          })
          .map(table => {
            const order = Array.isArray(table.orders) ? table.orders[0] : table.orders
            return {
              id: table.id,
              status: table.status,
              current_order_id: table.current_order_id,
              has_pending_order: true,
              order_created_at: order?.created_at || null
            }
          })

        setAvailableTables(available)
      }
    }

    fetchAvailableTables()
    
    // Subscribe to changes
    const channel = supabase
      .channel('available-tables')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        () => {
          fetchAvailableTables()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'waiter_assignments'
        },
        () => {
          fetchAvailableTables()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleAssignTable = async (tableId: number) => {
    setLoading(true)
    try {
      const supabase = createClient()
      
      // Check if table is still available
      const { data: existingAssignment } = await supabase
        .from('waiter_assignments')
        .select('id')
        .eq('table_id', tableId)
        .is('unassigned_at', null)
        .single()

      if (existingAssignment) {
        alert('This table was just assigned to another waiter')
        setLoading(false)
        return
      }

      // Assign table to waiter
      const { error } = await supabase
        .from('waiter_assignments')
        .insert({
          waiter_id: waiterId,
          table_id: tableId,
          assigned_at: new Date().toISOString()
        })

      if (error) {
        if (error.code === '23505') {
          alert('This table was just assigned to another waiter')
        } else {
          alert('Failed to assign table: ' + error.message)
        }
      } else {
        onAssign()
      }
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (availableTables.length === 0) {
    return null
  }

  return (
    <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <Bell className="w-6 h-6 text-yellow-600" />
        <h2 className="text-xl font-bold text-gray-900">New Table Requests</h2>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Tables with pending orders need a waiter. Click to assign yourself.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {availableTables.map((table) => (
          <motion.button
            key={table.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => handleAssignTable(table.id)}
            disabled={loading}
            className="relative bg-white border-2 border-yellow-400 rounded-xl p-4 hover:border-yellow-500 hover:shadow-lg transition-all disabled:opacity-50"
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl font-bold text-yellow-600">{table.id}</span>
              </div>
              <div className="text-sm font-medium text-gray-900">Table {table.id}</div>
              <div className="text-xs text-yellow-600 mt-1">Click to claim</div>
            </div>
            {table.has_pending_order && (
              <div className="absolute top-2 right-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              </div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
