'use client'

import { useState } from 'react'
import { BarChart3, TrendingUp, Clock, Users, DollarSign } from 'lucide-react'
import { formatCurrency } from '@/utils/currency'

interface OrderAnalytics {
  id: string
  table_id: number
  status: string
  total_price: number
  order_started_at: string
  kitchen_received_at: string | null
  ready_at: string | null
  served_at: string | null
  paid_at: string | null
  order_to_kitchen_seconds: number | null
  kitchen_prep_seconds: number | null
  ready_to_served_seconds: number | null
  served_to_paid_seconds: number | null
  total_order_seconds: number | null
}

interface EmployeePerformance {
  employee_id: string
  full_name: string
  role: string
  orders_handled: number
  revenue_generated: number
  average_service_time_seconds: number
  orders_per_hour: number
  revenue_per_hour: number
}

interface TableAnalytics {
  table_id: number
  total_orders: number
  total_revenue: number
  average_order_value: number
  average_turnover_seconds: number
  orders_last_24h: number
}

interface AnalyticsClientProps {
  orderAnalytics: OrderAnalytics[]
  employeePerformance: EmployeePerformance[]
  tableAnalytics: TableAnalytics[]
  todayOrders: any[]
}

export default function AnalyticsClient({
  orderAnalytics,
  employeePerformance,
  tableAnalytics,
  todayOrders,
}: AnalyticsClientProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'employees' | 'tables' | 'revenue'>('orders')

  // Calculate average order times
  const avgOrderToKitchen = orderAnalytics
    .filter(o => o.order_to_kitchen_seconds !== null)
    .reduce((sum, o) => sum + (o.order_to_kitchen_seconds || 0), 0) / 
    orderAnalytics.filter(o => o.order_to_kitchen_seconds !== null).length || 0

  const avgKitchenPrep = orderAnalytics
    .filter(o => o.kitchen_prep_seconds !== null)
    .reduce((sum, o) => sum + (o.kitchen_prep_seconds || 0), 0) / 
    orderAnalytics.filter(o => o.kitchen_prep_seconds !== null).length || 0

  const avgTotalOrder = orderAnalytics
    .filter(o => o.total_order_seconds !== null)
    .reduce((sum, o) => sum + (o.total_order_seconds || 0), 0) / 
    orderAnalytics.filter(o => o.total_order_seconds !== null).length || 0

  // Revenue by hour
  const revenueByHour: Record<number, number> = {}
  todayOrders.forEach(order => {
    const hour = new Date(order.created_at).getHours()
    revenueByHour[hour] = (revenueByHour[hour] || 0) + Number(order.total_price || 0)
  })

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { id: 'orders', label: 'Order Analytics', icon: Clock },
          { id: 'employees', label: 'Employee Performance', icon: Users },
          { id: 'tables', label: 'Table Analytics', icon: BarChart3 },
          { id: 'revenue', label: 'Revenue Trends', icon: DollarSign },
        ].map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-green-500 text-green-600 font-medium'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Order Analytics */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-sm text-gray-600 mb-2">Avg Order to Kitchen</h3>
              <p className="text-2xl font-bold text-gray-900">
                {formatTime(avgOrderToKitchen || 0)}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-sm text-gray-600 mb-2">Avg Kitchen Prep Time</h3>
              <p className="text-2xl font-bold text-gray-900">
                {formatTime(avgKitchenPrep || 0)}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-sm text-gray-600 mb-2">Avg Total Order Time</h3>
              <p className="text-2xl font-bold text-gray-900">
                {formatTime(avgTotalOrder || 0)}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold mb-4">Recent Order Metrics</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-sm font-medium text-gray-600">Order ID</th>
                    <th className="text-left py-2 text-sm font-medium text-gray-600">Table</th>
                    <th className="text-right py-2 text-sm font-medium text-gray-600">Order→Kitchen</th>
                    <th className="text-right py-2 text-sm font-medium text-gray-600">Kitchen Prep</th>
                    <th className="text-right py-2 text-sm font-medium text-gray-600">Total Time</th>
                  </tr>
                </thead>
                <tbody>
                  {orderAnalytics.slice(0, 20).map(order => (
                    <tr key={order.id} className="border-b border-gray-100">
                      <td className="py-2 text-sm text-gray-900">#{order.id.slice(0, 8)}</td>
                      <td className="py-2 text-sm text-gray-600">Table {order.table_id}</td>
                      <td className="py-2 text-sm text-right text-gray-600">
                        {order.order_to_kitchen_seconds ? formatTime(order.order_to_kitchen_seconds) : '—'}
                      </td>
                      <td className="py-2 text-sm text-right text-gray-600">
                        {order.kitchen_prep_seconds ? formatTime(order.kitchen_prep_seconds) : '—'}
                      </td>
                      <td className="py-2 text-sm text-right font-medium text-gray-900">
                        {order.total_order_seconds ? formatTime(order.total_order_seconds) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Employee Performance */}
      {activeTab === 'employees' && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold mb-4">Employee Performance Metrics</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-sm font-medium text-gray-600">Employee</th>
                  <th className="text-left py-2 text-sm font-medium text-gray-600">Role</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">Orders</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">Revenue</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">Orders/Hour</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">Revenue/Hour</th>
                </tr>
              </thead>
              <tbody>
                {employeePerformance.map(emp => (
                  <tr key={emp.employee_id} className="border-b border-gray-100">
                    <td className="py-2 text-sm font-medium text-gray-900">{emp.full_name}</td>
                    <td className="py-2 text-sm text-gray-600 capitalize">{emp.role}</td>
                    <td className="py-2 text-sm text-right text-gray-900">{emp.orders_handled}</td>
                    <td className="py-2 text-sm text-right text-gray-900">{formatCurrency(emp.revenue_generated)}</td>
                    <td className="py-2 text-sm text-right text-gray-600">{Number(emp.orders_per_hour).toFixed(1)}</td>
                    <td className="py-2 text-sm text-right font-medium text-green-600">{formatCurrency(emp.revenue_per_hour)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Table Analytics */}
      {activeTab === 'tables' && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold mb-4">Table Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-sm font-medium text-gray-600">Table</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">Total Orders</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">Total Revenue</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">Avg Order Value</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">Avg Turnover</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">Orders (24h)</th>
                </tr>
              </thead>
              <tbody>
                {tableAnalytics.map(table => (
                  <tr key={table.table_id} className="border-b border-gray-100">
                    <td className="py-2 text-sm font-medium text-gray-900">Table {table.table_id}</td>
                    <td className="py-2 text-sm text-right text-gray-900">{table.total_orders}</td>
                    <td className="py-2 text-sm text-right text-gray-900">{formatCurrency(table.total_revenue)}</td>
                    <td className="py-2 text-sm text-right text-gray-600">{formatCurrency(table.average_order_value)}</td>
                    <td className="py-2 text-sm text-right text-gray-600">
                      {formatTime(Number(table.average_turnover_seconds))}
                    </td>
                    <td className="py-2 text-sm text-right font-medium text-green-600">{table.orders_last_24h}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Revenue Trends */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold mb-4">Revenue by Hour (Today)</h3>
            <div className="space-y-3">
              {Array.from({ length: 24 }, (_, i) => i).map(hour => {
                const revenue = revenueByHour[hour] || 0
                const maxRevenue = Math.max(...Object.values(revenueByHour), 1)
                const percentage = (revenue / maxRevenue) * 100

                return (
                  <div key={hour} className="flex items-center gap-4">
                    <div className="w-16 text-sm text-gray-600 font-medium">
                      {hour.toString().padStart(2, '0')}:00
                    </div>
                    <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-green-500 to-emerald-600 h-full rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-900">
                        {formatCurrency(revenue)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
