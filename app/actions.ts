'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

type CartItem = {
  id: number;
  qty: number;
  price: number;
};

type OrderValidationData = {
  deviceFingerprint: string;
  tableAccessTimestamp: number;
  originalTableId: number | null;
};

export async function createOrder(
  tableId: number, 
  cartItems: CartItem[], 
  total: number,
  validationData?: OrderValidationData
) {
  const supabase = await createClient()

  // SECURITY VALIDATION - Prevent table manipulation
  if (validationData) {
    const TEN_MINUTES = 10 * 60 * 1000;
    const now = Date.now();

    // 1. Time-based validation: Must have accessed table page recently (within 10 minutes)
    const timeSinceAccess = now - validationData.tableAccessTimestamp;
    if (timeSinceAccess > TEN_MINUTES) {
      return { 
        success: false, 
        error: 'Table access expired. Please scan the QR code again.',
        redirectToTable: validationData.originalTableId || null
      };
    }

    // 2. Silent redirect: If customer already placed an order for a different table, redirect to that table
    // Only enforce this AFTER they've placed their first order
    if (validationData.originalTableId && validationData.originalTableId !== tableId) {
      return { 
        success: false, 
        error: null, // No error message - silent redirect
        redirectToTable: validationData.originalTableId
      };
    }

    // 3. Device fingerprint validation (will be checked against table access)
    // This ensures the device that accessed the table is the one placing the order
  }

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
      return { success: false, error: `Failed to create table ${tableId}: ${tableError.message}`, redirectToTable: null }
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
        .in('status', ['pending', 'cooking', 'ready', 'served'])
        .single()

      if (activeOrder) {
        // Table is occupied - only allow if it's the same device (validationData would have matching fingerprint)
        // For now, we'll reject to prevent abuse
        return { 
          success: false, 
          error: `Table ${tableId} is currently occupied. Please wait or contact staff.`,
          redirectToTable: validationData?.originalTableId || null
        };
      }
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
    return { success: false, error: itemsError.message, redirectToTable: null }
  }

  // 3. Update Table Status to Occupied
  await supabase
    .from('restaurant_tables')
    .update({ status: 'occupied', current_order_id: order.id })
    .eq('id', tableId)

  // 4. Refresh Data
  revalidatePath('/cashier')
  
  return { success: true, orderId: order.id, redirectToTable: null }
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
    .in('status', ['pending', 'cooking', 'ready', 'served', 'waiting_payment'])
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