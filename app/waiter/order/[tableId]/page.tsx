import { createClient } from '@/utils/supabase/server'
import { getUserProfile } from '@/utils/auth'
import { redirect } from 'next/navigation'
import WaiterOrderClient from './WaiterOrderClient'

export default async function WaiterOrderPage({
  params,
}: {
  params: { tableId: string }
}) {
  const supabase = await createClient()
  const profile = await getUserProfile()
  const tableId = parseInt(params.tableId)

  if (!profile) {
    redirect('/login')
  }

  // Verify waiter is assigned to this table
  const { data: assignment } = await supabase
    .from('waiter_assignments')
    .select('*')
    .eq('waiter_id', profile.id)
    .eq('table_id', tableId)
    .is('unassigned_at', null)
    .single()

  if (!assignment && profile.role !== 'admin') {
    redirect('/waiter')
  }

  // Get menu items
  const { data: menuItems } = await supabase
    .from('menu_items')
    .select('*')
    .eq('is_available', true)
    .order('name')

  // Get current order if exists
  const { data: currentOrder } = await supabase
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
      )
    `)
    .eq('table_id', tableId)
    .in('status', ['pending', 'cooking', 'ready', 'served', 'waiting_payment'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 mb-1">Table {tableId}</h1>
        <p className="text-gray-600 text-sm">Take order</p>
      </div>
      <WaiterOrderClient
        tableId={tableId}
        menuItems={menuItems || []}
        currentOrder={currentOrder}
      />
    </div>
  )
}
