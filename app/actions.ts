'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { getUserProfile } from '@/utils/auth'

type CartItem = {
  id: number;
  qty: number;
  price: number;
};

export async function createOrder(
  tableId: number, 
  cartItems: CartItem[], 
  total: number
) {
  const supabase = await createClient()

  // 0. Check if table exists, create it if it doesn't
  const { data: existingTable } = await supabase
    .from('restaurant_tables')
    .select('id, status, current_order_id')
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
  } else {
    // 4. Table occupancy check: Prevent ordering for occupied tables
    // (unless it's the same device/session - handled by device fingerprint)
    if (existingTable.status === 'occupied' && existingTable.current_order_id) {
      // Check if there's an active order
      const { data: activeOrder } = await supabase
        .from('orders')
        .select('id, status')
        .eq('id', existingTable.current_order_id)
        .in('status', ['pending', 'cooking', 'ready', 'served', 'waiting_payment'])
        .single()

      if (activeOrder) {
        console.log(`[createOrder] Table ${tableId} is occupied with order ${activeOrder.id}, status: ${activeOrder.status}`);
        // Table is occupied - only allow if it's the same device (validationData would have matching fingerprint)
        // For now, we'll reject to prevent abuse
        return { 
          success: false, 
          error: `Table ${tableId} is currently occupied. Please wait or contact staff.`
        };
      } else {
        console.log(`[createOrder] Table ${tableId} marked as occupied but no active order found, allowing new order`);
      }
    }
  }

  // Get current user for tracking
  const profile = await getUserProfile()
  const headersList = await headers()
  const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
  const userAgent = headersList.get('user-agent') || 'unknown'

  // 1. Create the Order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      table_id: tableId,
      total_price: total,
      status: 'pending',
      created_by: profile?.id || null,
      order_started_at: new Date().toISOString()
    })
    .select()
    .single()

  if (orderError) {
    console.error('Order Error:', orderError)
    return { success: false, error: orderError.message, redirectToTable: null }
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

  // 4. Log audit event
  if (profile) {
    await supabase.rpc('log_audit_event', {
      p_actor_id: profile.id,
      p_action: `Created Order #${order.id.slice(0, 8)} for Table ${tableId}`,
      p_entity_type: 'order',
      p_entity_id: order.id,
      p_changes: JSON.stringify({ order_id: order.id, table_id: tableId, total_price: total }),
      p_ip_address: ipAddress,
      p_user_agent: userAgent
    })
  }

  // 5. Refresh Data
  revalidatePath('/cashier')
  
  return { success: true, orderId: order.id }
}

export async function getOrderByTable(tableId: number) {
  const supabase = await createClient()

  // First, ensure table exists
  const { data: table } = await supabase
    .from('restaurant_tables')
    .select('id')
    .eq('id', tableId)
    .single()

  if (!table) {
    // Create table if it doesn't exist
    await supabase
      .from('restaurant_tables')
      .insert({
        id: tableId,
        status: 'empty',
        current_order_id: null
      })
  }

  // Try to fetch order - first try simple query to ensure we get the order
  const { data: simpleOrder, error: simpleError } = await supabase
    .from('orders')
    .select('*')
    .eq('table_id', tableId)
    .in('status', ['pending', 'cooking', 'ready', 'served', 'waiting_payment'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (simpleError) {
    console.error('[getOrderByTable] Error fetching order:', simpleError);
    return { success: false, error: simpleError.message, data: null }
  }

  if (!simpleOrder) {
    console.log(`[getOrderByTable] No active order found for table ${tableId}`);
    return { success: false, error: 'No active order found', data: null }
  }

  console.log(`[getOrderByTable] Found order ${simpleOrder.id}, fetching items...`);

  // Now try to fetch order_items separately
  const { data: orderItems, error: itemsError } = await supabase
    .from('order_items')
    .select(`
      *,
      menu_items (
        name,
        category
      )
    `)
    .eq('order_id', simpleOrder.id)

  if (itemsError) {
    console.error('[getOrderByTable] Error fetching order items:', itemsError);
    // Return order even if items query fails (items might be empty or still being created)
    return { 
      success: true, 
      data: { 
        ...simpleOrder, 
        order_items: [] 
      } 
    }
  }

  console.log(`[getOrderByTable] Successfully fetched order with ${orderItems?.length || 0} items`);

  // Return order with items
  return { 
    success: true, 
    data: { 
      ...simpleOrder, 
      order_items: orderItems || [] 
    } 
  }
}

export async function updateOrderStatus(orderId: string, status: string) {
  const supabase = await createClient()
  const profile = await getUserProfile()
  const headersList = await headers()
  const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
  const userAgent = headersList.get('user-agent') || 'unknown'
  const now = new Date().toISOString()

  // Get current order to track status changes
  const { data: currentOrder } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()

  // Prepare update data with timestamps
  const updateData: any = {
    status,
    updated_at: now
  }

  // Update timestamps based on status
  if (status === 'cooking' && !currentOrder?.kitchen_received_at) {
    updateData.kitchen_received_at = now
  } else if (status === 'ready' && !currentOrder?.ready_at) {
    updateData.ready_at = now
  } else if (status === 'served' && !currentOrder?.served_at) {
    updateData.served_at = now
  } else if (status === 'paid') {
    updateData.paid_at = now
    updateData.completed_at = now
    updateData.paid_by = profile?.id || null
  }

  // Update order status
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .update(updateData)
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

  // Log audit event
  if (profile) {
    await supabase.rpc('log_audit_event', {
      p_actor_id: profile.id,
      p_action: `Updated Order #${orderId.slice(0, 8)} status to ${status}`,
      p_entity_type: 'order',
      p_entity_id: orderId,
      p_changes: JSON.stringify({ old_status: currentOrder?.status, new_status: status }),
      p_ip_address: ipAddress,
      p_user_agent: userAgent
    })
  }

  revalidatePath(`/table/${orderId}`)
  revalidatePath('/cashier')
  revalidatePath('/cashier/tables')
  revalidatePath('/cashier/orders')
  
  return { success: true }
}

export async function voidOrderItem(itemId: number, reason: string) {
  const supabase = await createClient()
  const profile = await getUserProfile()
  const headersList = await headers()
  const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
  const userAgent = headersList.get('user-agent') || 'unknown'

  if (!profile) {
    return { success: false, error: 'Not authenticated' }
  }

  // Get the order item and check if order is in a state that allows voiding
  const { data: orderItem, error: itemError } = await supabase
    .from('order_items')
    .select(`
      *,
      orders!inner (
        id,
        status
      )
    `)
    .eq('id', itemId)
    .single()

  if (itemError || !orderItem) {
    return { success: false, error: 'Order item not found' }
  }

  // Check if order status allows voiding (cashiers can't void after cooking)
  const orderStatus = (orderItem as any).orders.status
  if (profile.role === 'cashier' && ['cooking', 'ready', 'served', 'paid'].includes(orderStatus)) {
    return { success: false, error: 'Cannot void items after order is cooking' }
  }

  // Void the item
  const { error: updateError } = await supabase
    .from('order_items')
    .update({
      voided_at: new Date().toISOString(),
      voided_by: profile.id,
      void_reason: reason
    })
    .eq('id', itemId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  // Log audit event
  await supabase.rpc('log_audit_event', {
    p_actor_id: profile.id,
    p_action: `Voided Order Item #${itemId}`,
    p_entity_type: 'order_item',
    p_entity_id: itemId.toString(),
    p_changes: JSON.stringify({ reason }),
    p_ip_address: ipAddress,
    p_user_agent: userAgent
  })

  revalidatePath('/cashier')
  revalidatePath('/cashier/orders')
  
  return { success: true }
}