import { createClient } from '@/utils/supabase/server'
import { DollarSign, ShoppingBag, TrendingUp, Users, Clock, UtensilsCrossed } from 'lucide-react'
import { format } from 'date-fns'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const today = new Date()
  const startOfDay = new Date(today.setHours(0, 0, 0, 0))
  const endOfDay = new Date(today.setHours(23, 59, 59, 999))

  // Get today's revenue
  const { data: todayOrders } = await supabase
    .from('orders')
    .select('total_price, status, created_at')
    .gte('created_at', startOfDay.toISOString())
    .lte('created_at', endOfDay.toISOString())
    .eq('status', 'paid')

  const todayRevenue = todayOrders?.reduce((sum, order) => sum + Number(order.total_price || 0), 0) || 0

  // Get active orders count
  const { data: activeOrders } = await supabase
    .from('orders')
    .select('id')
    .in('status', ['pending', 'cooking', 'ready', 'served', 'waiting_payment'])

  // Get top-selling items today
  const { data: orderItems } = await supabase
    .from('order_items')
    .select(`
      quantity,
      menu_items (
        name,
        category
      ),
      orders!inner (
        created_at,
        status
      )
    `)
    .gte('orders.created_at', startOfDay.toISOString())
    .eq('orders.status', 'paid')

  const itemCounts: Record<string, { name: string; count: number }> = {}
  orderItems?.forEach((item: any) => {
    const itemName = item.menu_items?.name || 'Unknown'
    if (!itemCounts[itemName]) {
      itemCounts[itemName] = { name: itemName, count: 0 }
    }
    itemCounts[itemName].count += item.quantity || 0
  })

  const topItems = Object.values(itemCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Get table occupancy
  const { data: tables } = await supabase
    .from('restaurant_tables')
    .select('id, status')

  const occupiedTables = tables?.filter(t => t.status === 'occupied').length || 0
  const totalTables = tables?.length || 0

  // Get active employees
  const { data: activeEmployees } = await supabase
    .from('profiles')
    .select('id')
    .eq('is_active', true)

  // Get recent orders
  const { data: recentOrders } = await supabase
    .from('orders')
    .select(`
      id,
      table_id,
      status,
      total_price,
      created_at,
      profiles!orders_created_by_fkey (
        full_name
      )
    `)
    .order('created_at', { ascending: false })
    .limit(10)

  const stats = [
    {
      label: "Today's Revenue",
      value: `$${todayRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      label: "Active Orders",
      value: activeOrders?.length || 0,
      icon: ShoppingBag,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      label: "Table Occupancy",
      value: `${occupiedTables}/${totalTables}`,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      label: "Active Staff",
      value: activeEmployees?.length || 0,
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Overview of your restaurant operations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Items */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Top Selling Items Today
          </h2>
          {topItems.length > 0 ? (
            <div className="space-y-3">
              {topItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600 font-bold text-sm">
                      {index + 1}
                    </div>
                    <span className="font-medium text-gray-900">{item.name}</span>
                  </div>
                  <span className="font-bold text-green-600">{item.count}x</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No sales data for today</p>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Recent Orders
          </h2>
          {recentOrders && recentOrders.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recentOrders.map((order: any) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      Order #{order.id.slice(0, 8)} - Table {order.table_id}
                    </p>
                    <p className="text-sm text-gray-500">
                      {order.profiles?.full_name || 'System'} • {format(new Date(order.created_at), 'HH:mm')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">${Number(order.total_price || 0).toFixed(2)}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      order.status === 'paid' ? 'bg-green-100 text-green-700' :
                      order.status === 'cooking' ? 'bg-orange-100 text-orange-700' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No recent orders</p>
          )}
        </div>
      </div>
    </div>
  )
}
