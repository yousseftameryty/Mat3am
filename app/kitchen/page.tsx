import { createClient } from '@/utils/supabase/server'
import KitchenDisplayClient from './KitchenDisplayClient'

export default async function KitchenPage() {
  const supabase = await createClient()

  // Get pending and cooking orders
  const { data: orders } = await supabase
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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-4xl font-black mb-2">Kitchen Display</h1>
        <p className="text-gray-400">Order Queue</p>
      </div>
      <KitchenDisplayClient initialOrders={orders || []} />
    </div>
  )
}
