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
    // Allow if timestamp is 0 or very recent (within last 10 minutes)
    const timeSinceAccess = now - validationData.tableAccessTimestamp;
    
    // Only check time if we have a valid timestamp (not 0 or negative)
    // If timestamp is recent (set to Date.now() as fallback), it will be 0 or very small
    if (validationData.tableAccessTimestamp > 0 && timeSinceAccess > TEN_MINUTES && timeSinceAccess < (24 * 60 * 60 * 1000)) {
      // Only reject if timestamp is old AND not from today (to avoid rejecting fresh fallback timestamps)
      console.log('Security check: Table access expired', { timeSinceAccess, TEN_MINUTES });
      return { 
        success: false, 
        error: 'Table access expired. Please scan the QR code again.',
        redirectToTable: validationData.originalTableId || null
      };
    }

    // 2. Silent redirect: If customer already placed an order for a different table, redirect to that table
    // Only enforce this AFTER they've placed their first order (originalTableId exists)
    if (validationData.originalTableId && validationData.originalTableId !== tableId) {
      console.log('Security check: Redirecting to original table', { originalTableId: validationData.originalTableId, requestedTableId: tableId });
      return { 
        success: false, 
        error: null, // No error message - silent redirect
        redirectToTable: validationData.originalTableId
      };
    }

    console.log('Security check: Passed', { tableId, timeSinceAccess, originalTableId: validationData.originalTableId });
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
        .in('status', ['pending', 'cooking', 'ready', 'served', 'waiting_payment'])
        .single()

      if (activeOrder) {
        console.log(`[createOrder] Table ${tableId} is occupied with order ${activeOrder.id}, status: ${activeOrder.status}`);
        // Table is occupied - only allow if it's the same device (validationData would have matching fingerprint)
        // For now, we'll reject to prevent abuse
        return { 
          success: false, 
          error: `Table ${tableId} is currently occupied. Please wait or contact staff.`,
          redirectToTable: validationData?.originalTableId || null
        };
      } else {
        console.log(`[createOrder] Table ${tableId} marked as occupied but no active order found, allowing new order`);
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

  // Try to fetch order with order_items
  const { data: order, error: orderError } = await supabase
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

  if (orderError) {
    console.error('Error fetching order with items:', orderError);
    // Try without order_items if that fails
    const { data: simpleOrder, error: simpleError } = await supabase
      .from('orders')
      .select('*')
      .eq('table_id', tableId)
      .in('status', ['pending', 'cooking', 'ready', 'served', 'waiting_payment'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    
    if (simpleError) {
      return { success: false, error: simpleError.message, data: null }
    }
    
    if (!simpleOrder) {
      return { success: false, error: 'No active order found', data: null }
    }
    
    // Return order without items if items query failed
    return { success: true, data: { ...simpleOrder, order_items: [] } }
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