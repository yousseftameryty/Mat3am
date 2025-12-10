"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  User, CheckCircle2, Clock, X, 
  Utensils, Receipt, ArrowLeft, RefreshCw
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/utils/currency";

type Table = {
  id: number;
  status: string;
  current_order_id: string | null;
  order?: {
    id: string;
    total_price: number;
    created_at: string;
    status: string;
  };
};

export default function TablesPage() {
  const router = useRouter();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTables();
    
    // Real-time subscription
    const supabase = createClient();
    const channel = supabase
      .channel('tables-updates')
      .on('postgres_changes' as any, {
        event: '*',
        schema: 'public',
        table: 'restaurant_tables'
      }, () => {
        fetchTables();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchTables() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('restaurant_tables')
      .select(`
        *,
        orders!restaurant_tables_current_order_id_fkey (
          id,
          total_price,
          created_at,
          status
        )
      `)
      .order('id');

    if (!error && data) {
      setTables(data as Table[]);
    }
    setLoading(false);
  }

  const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
    empty: { color: "bg-green-500/20 text-green-400 border-green-500/50", icon: CheckCircle2, label: "Empty" },
    occupied: { color: "bg-orange-500/20 text-orange-400 border-orange-500/50", icon: Clock, label: "Occupied" },
    needs_assistance: { color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50", icon: User, label: "Needs Help" },
    needs_bill: { color: "bg-blue-500/20 text-blue-400 border-blue-500/50", icon: Receipt, label: "Needs Bill" },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-green-50/30 to-white text-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">
              Tables
            </h1>
            <p className="text-gray-600">Monitor table status and orders</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchTables}
              className="bg-white border border-green-200 hover:bg-green-50 hover:border-green-400 px-4 py-2 rounded-xl transition-colors flex items-center gap-2 shadow-sm text-gray-700"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
            <button
              onClick={() => router.push('/cashier')}
              className="bg-white border border-green-200 hover:bg-green-50 hover:border-green-400 px-4 py-2 rounded-xl transition-colors flex items-center gap-2 shadow-sm text-gray-700"
            >
              <ArrowLeft size={18} />
              Back to POS
            </button>
          </div>
        </div>

        {/* Tables Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {tables.map((table) => {
              const config = statusConfig[table.status] || statusConfig.empty;
              const StatusIcon = config.icon;
              const order = Array.isArray(table.order) ? table.order[0] : table.order;

              return (
                <motion.div
                  key={table.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => order && router.push(`/table/${table.id}`)}
                  className={`bg-white border rounded-2xl p-6 cursor-pointer hover:border-green-400 hover:shadow-lg hover:shadow-green-500/10 transition-all shadow-sm ${
                    order ? 'border-green-300' : 'border-green-200'
                  }`}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${config.color.replace('border', 'bg').replace('/50', '/20')}`}>
                      <StatusIcon size={24} />
                    </div>
                    <h3 className="text-2xl font-bold mb-1 text-gray-900">Table {table.id}</h3>
                    <p className={`text-xs px-3 py-1 rounded-full border ${config.color} mb-3`}>
                      {config.label}
                    </p>
                    
                    {order && (
                      <div className="w-full mt-3 pt-3 border-t border-green-200 space-y-1">
                        <p className="text-xs text-gray-500">Order #{order.id.slice(0, 6)}</p>
                        <p className="text-sm font-bold text-green-600">
                          {formatCurrency(order.total_price)}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">{order.status}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}



