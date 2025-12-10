import { createClient } from '@/utils/supabase/server'
import AnalyticsClient from './AnalyticsClient'

export default async function AnalyticsPage() {
  const supabase = await createClient()

  // Get order analytics
  const { data: orderAnalytics } = await supabase
    .from('order_analytics')
    .select('*')
    .order('order_started_at', { ascending: false })
    .limit(1000)

  // Get employee performance
  const { data: employeePerformance } = await supabase
    .from('employee_performance')
    .select('*')

  // Get table analytics
  const { data: tableAnalytics } = await supabase
    .from('table_analytics')
    .select('*')

  // Get comprehensive analytics data
  const today = new Date()
  const startOfDay = new Date(today.setHours(0, 0, 0, 0))
  const startOfWeek = new Date(today.setDate(today.getDate() - 7))
  const startOfMonth = new Date(today.setMonth(today.getMonth() - 1))

  // Today's orders (all statuses for comprehensive tracking)
  const { data: todayOrders } = await supabase
    .from('orders')
    .select('total_price, created_at, status, table_id, paid_at, paid_by')
    .gte('created_at', startOfDay.toISOString())

  // Menu item performance
  const { data: menuItemPerformance } = await supabase
    .from('order_items')
    .select(`
      quantity,
      price_at_time,
      menu_items (
        id,
        name,
        category,
        price
      ),
      orders!inner (
        created_at,
        status,
        total_price
      )
    `)
    .gte('orders.created_at', startOfWeek.toISOString())
    .eq('orders.status', 'paid')

  // Category performance
  const { data: categoryPerformance } = await supabase
    .from('order_items')
    .select(`
      quantity,
      price_at_time,
      menu_items!inner (
        category
      ),
      orders!inner (
        created_at,
        status
      )
    `)
    .gte('orders.created_at', startOfWeek.toISOString())
    .eq('orders.status', 'paid')

  // All orders for comprehensive analytics
  const { data: allOrders } = await supabase
    .from('orders')
    .select('*')
    .gte('created_at', startOfMonth.toISOString())
    .order('created_at', { ascending: false })
    .limit(5000)

  // Employee activity
  const { data: employeeActivity } = await supabase
    .from('audit_logs')
    .select(`
      actor_id,
      action,
      timestamp,
      profiles!inner (
        full_name,
        role
      )
    `)
    .gte('timestamp', startOfDay.toISOString())
    .order('timestamp', { ascending: false })
    .limit(1000)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900 mb-2">Analytics & Reports</h1>
        <p className="text-gray-600">Comprehensive performance metrics and insights</p>
      </div>
      <AnalyticsClient
        orderAnalytics={orderAnalytics || []}
        employeePerformance={employeePerformance || []}
        tableAnalytics={tableAnalytics || []}
        todayOrders={todayOrders || []}
        menuItemPerformance={menuItemPerformance || []}
        categoryPerformance={categoryPerformance || []}
        allOrders={allOrders || []}
        employeeActivity={employeeActivity || []}
      />
    </div>
  )
}
