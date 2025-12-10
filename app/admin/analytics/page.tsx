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

  // Get revenue by hour for today
  const today = new Date()
  const startOfDay = new Date(today.setHours(0, 0, 0, 0))
  const { data: todayOrders } = await supabase
    .from('orders')
    .select('total_price, created_at, status')
    .gte('created_at', startOfDay.toISOString())
    .eq('status', 'paid')

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
      />
    </div>
  )
}
