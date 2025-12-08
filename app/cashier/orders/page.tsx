"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ShoppingBag, Clock, CheckCircle2, Utensils, 
  Receipt, X, Filter, Search, ChefHat
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { updateOrderStatus } from "@/app/actions";
import { useRouter } from "next/navigation";

type Order = {
  id: string;
  table_id: number;
  status: string;
  total_price: number;
  created_at: string;
  updated_at: string;
  order_items: Array<{
    quantity: number;
    menu_items: {
      name: string;
    };
  }>;
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchOrders();
    
    // Real-time subscription
    const supabase = createClient();
    const channel = supabase
      .channel('orders-updates')
      .on('postgres_changes' as any, {
        event: '*',
        schema: 'public',
        table: 'orders'
      }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchOrders() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          quantity,
          menu_items (name)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setOrders(data as Order[]);
    }
    setLoading(false);
  }

  async function handleStatusUpdate(orderId: string, newStatus: string) {
    const result = await updateOrderStatus(orderId, newStatus);
    if (result.success) {
      fetchOrders();
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesFilter = filter === "all" || order.status === filter;
    const matchesSearch = searchQuery === "" || 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.table_id.toString().includes(searchQuery);
    return matchesFilter && matchesSearch;
  });

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
    cooking: "bg-orange-500/20 text-orange-400 border-orange-500/50",
    ready: "bg-blue-500/20 text-blue-400 border-blue-500/50",
    served: "bg-green-500/20 text-green-400 border-green-500/50",
    paid: "bg-purple-500/20 text-purple-400 border-purple-500/50",
    cancelled: "bg-red-500/20 text-red-400 border-red-500/50",
  };

  const statusIcons: Record<string, any> = {
    pending: Clock,
    cooking: ChefHat,
    ready: CheckCircle2,
    served: Utensils,
    paid: Receipt,
    cancelled: X,
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-500">
              Orders
            </h1>
            <p className="text-gray-500">Manage and track all orders</p>
          </div>
          <button
            onClick={() => router.push('/cashier')}
            className="bg-neutral-800 hover:bg-neutral-700 px-4 py-2 rounded-xl transition-colors"
          >
            Back to POS
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-900 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-orange-500/50"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'pending', 'cooking', 'ready', 'served', 'paid'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-xl font-medium transition-all capitalize ${
                  filter === status
                    ? 'bg-orange-500 text-white'
                    : 'bg-neutral-900 text-gray-400 hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.map((order) => {
              const StatusIcon = statusIcons[order.status] || Clock;
              const itemCount = order.order_items?.reduce((acc, item) => acc + item.quantity, 0) || 0;
              
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6 hover:border-orange-500/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs text-gray-500 font-mono mb-1">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-2xl font-bold">Table {order.table_id}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full border text-xs font-bold flex items-center gap-1.5 ${statusColors[order.status] || statusColors.pending}`}>
                      <StatusIcon size={12} />
                      {order.status}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Items</span>
                      <span className="font-medium">{itemCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Total</span>
                      <span className="font-bold text-orange-400">
                        ${parseFloat(order.total_price.toString()).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{new Date(order.created_at).toLocaleTimeString()}</span>
                      <span>{new Date(order.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Status Actions */}
                  <div className="flex gap-2 flex-wrap">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, 'cooking')}
                        className="flex-1 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                      >
                        Start Cooking
                      </button>
                    )}
                    {order.status === 'cooking' && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, 'ready')}
                        className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                      >
                        Mark Ready
                      </button>
                    )}
                    {order.status === 'ready' && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, 'served')}
                        className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                      >
                        Mark Served
                      </button>
                    )}
                    {order.status === 'served' && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, 'paid')}
                        className="flex-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                      >
                        Mark Paid
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {!loading && filteredOrders.length === 0 && (
          <div className="text-center py-16">
            <ShoppingBag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500">No orders found</p>
          </div>
        )}
      </div>
    </div>
  );
}

