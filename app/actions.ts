'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

type CartItem = {
  id: number;
  qty: number;
  price: number;
};

export async function createOrder(tableId: number, cartItems: CartItem[], total: number) {
  const supabase = await createClient()

  // 0. Check if table exists, create it if it doesn't
  const { data: existingTable } = await supabase
    .from('restaurant_tables')
    .select('id')
    .eq('id', tableId)
    .single()

  if (!existingTable) {
    // Create the table if it doesn't exist
    const { error: tableError } = await supabase
      .from('restaurant_tables')
      .insert({
        id: tableId,
        status: 'empty',
        current_order_id: null
      })

    if (tableError) {
      console.error('Table Creation Error:', tableError)
      return { success: false, error: `Failed to create table ${tableId}: ${tableError.message}` }
    }
  }

  // 1. Create the Order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      table_id: tableId,
      total_price: total,
      status: 'pending'
    })
    .select()
    .single()

  if (orderError) {
    console.error('Order Error:', orderError)
    return { success: false, error: orderError.message }
  }

  // 2. Create Order Items
  const itemsToInsert = cartItems.map((item) => ({
    order_id: order.id,
    menu_item_id: item.id,
    quantity: item.qty,
    price_at_time: item.price,
    modifiers: {} // Add modifiers logic later
  }))

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(itemsToInsert)

  if (itemsError) {
    console.error('Items Error:', itemsError)
    return { success: false, error: itemsError.message }
  }

  // 3. Update Table Status to Occupied
  await supabase
    .from('restaurant_tables')
    .update({ status: 'occupied', current_order_id: order.id })
    .eq('id', tableId)

  // 4. Refresh Data
  revalidatePath('/cashier')
  
  return { success: true, orderId: order.id }
}

export async function getOrderByTable(tableId: number) {
  const supabase = await createClient()

  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        menu_items (
          name,
          category
        )
      )
    `)
    .eq('table_id', tableId)
    .in('status', ['pending', 'cooking', 'ready', 'served'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    return { success: false, error: error.message, data: null }
  }

  if (!order) {
    return { success: false, error: 'No active order found', data: null }
  }

  return { success: true, data: order }
}

export async function updateOrderStatus(orderId: string, status: string) {
  const supabase = await createClient()

  // Update order status
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .select('table_id')
    .single()

  if (orderError) {
    return { success: false, error: orderError.message }
  }

  // If marking as paid, reset the table to empty
  if (status === 'paid' && order?.table_id) {
    await supabase
      .from('restaurant_tables')
      .update({ 
        status: 'empty', 
        current_order_id: null 
      })
      .eq('id', order.table_id)
  }

  revalidatePath(`/table/${orderId}`)
  revalidatePath('/cashier')
  revalidatePath('/cashier/tables')
  revalidatePath('/cashier/orders')
  
  return { success: true }
}