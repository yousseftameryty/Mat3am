"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChefHat, CheckCircle2, Receipt, 
  Utensils, CreditCard, MessageSquare, Loader2
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { getOrderByTable } from "@/app/actions";
import MenuView from "./MenuView";

type OrderItem = {
  id: number;
  quantity: number;
  price_at_time: number;
  menu_items: {
    name: string;
    category: string;
  };
};

type Order = {
  id: string;
  status: string;
  total_price: number;
  created_at: string;
  order_items: OrderItem[];
};

export default function CustomerTablePage() {
  const params = useParams();
  const tableId = parseInt(params?.id as string) || 1;
  const [mounted, setMounted] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getOrderByTable(tableId);
      
      if (result.success && result.data) {
        setOrder(result.data as Order);
        setError(null);
      } else {
        setError(result.error || "No active order found for this table");
        setOrder(null);
      }
    } catch (err) {
      console.error('Error fetching order:', err);
      setError("Failed to load order");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [tableId]);

  useEffect(() => {
    setMounted(true);
    fetchOrder();
    
      // Set up real-time subscription
      const supabase = createClient();
      const channel = supabase
        .channel(`table-${tableId}`)
        .on(
          'postgres_changes' as any,
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `table_id=eq.${tableId}`,
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (_payload: unknown) => {
            fetchOrder();
          }
        )
        .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableId, fetchOrder]);

  const status = order?.status || "pending";
  const orderItems = order?.order_items || [];
  const total = orderItems.reduce((acc, item) => acc + (parseFloat(item.price_at_time.toString()) * item.quantity), 0);
  const serviceCharge = total * 0.10;
  const finalTotal = total + serviceCharge;

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-[#ededed] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          <p className="text-gray-500">Loading your order...</p>
        </div>
      </div>
    );
  }

  // Show menu if no order exists
  if (error || !order) {
    return <MenuView tableId={tableId} onOrderCreated={fetchOrder} />;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#ededed] font-sans pb-32 overflow-x-hidden">
      
      {/* --- TOP NAV --- */}
      <div className="p-6 flex justify-between items-center z-50 relative">
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs font-mono uppercase tracking-widest text-gray-500">Live Connection</span>
        </div>
        <div className="bg-white/5 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-full text-sm font-bold shadow-lg">
            Table #{tableId}
        </div>
      </div>

      {/* --- STATUS INDICATOR (Animated) --- */}
      <div className="px-6 mb-8 flex flex-col items-center">
        <AnimatePresence mode="wait">
            {(status === 'pending' || status === 'cooking') && (
                <motion.div 
                    key="cooking"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="flex flex-col items-center"
                >
                    <div className="relative">
                        <div className="absolute -inset-4 bg-orange-500/20 rounded-full blur-xl animate-pulse"></div>
                        <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center shadow-2xl shadow-orange-500/20 relative z-10">
                            <ChefHat className="text-white w-10 h-10 animate-bounce" />
                        </div>
                    </div>
                    <h2 className="mt-6 text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-500">
                        {status === 'pending' ? 'Order Received' : 'Kitchen is Cooking'}
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Estimated time: 12 mins</p>
                </motion.div>
            )}

            {status === 'ready' && (
                <motion.div 
                    key="ready"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center"
                >
                    <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/20">
                        <CheckCircle2 className="text-white w-10 h-10" />
                    </div>
                    <h2 className="mt-6 text-2xl font-bold text-white">Order Ready</h2>
                    <p className="text-gray-500 text-sm mt-1">Your order is ready!</p>
                </motion.div>
            )}

            {status === 'served' && (
                 <motion.div 
                    key="served"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center"
                >
                    <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-2xl shadow-green-500/20">
                        <Utensils className="text-white w-10 h-10" />
                    </div>
                    <h2 className="mt-6 text-2xl font-bold text-white">Order Served</h2>
                    <p className="text-gray-500 text-sm mt-1">Enjoy your meal!</p>
                </motion.div>
            )}

            {status === 'paid' && (
                 <motion.div 
                    key="paid"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center"
                >
                    <div className="w-20 h-20 bg-purple-500 rounded-full flex items-center justify-center shadow-2xl shadow-purple-500/20">
                        <Receipt className="text-white w-10 h-10" />
                    </div>
                    <h2 className="mt-6 text-2xl font-bold text-white">Payment Complete</h2>
                    <p className="text-gray-500 text-sm mt-1">Thank you for dining with us!</p>
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      {/* --- THE RECEIPT (Unfolding Animation) --- */}
      <div className="px-4 relative perspective-1000">
        {/* Receipt Top Edge (Jagged) */}
        <div className="mx-auto max-w-sm h-4 bg-white w-[95%] relative z-20 rounded-t-lg"></div>
        
        <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            transition={{ duration: 1.2, ease: [0.04, 0.62, 0.23, 0.98], delay: 0.2 }} // Paper printing effect
            className="mx-auto max-w-sm bg-white text-black w-[95%] relative z-10 overflow-hidden shadow-2xl origin-top"
        >
            <div className="p-6 pb-10 flex flex-col items-center">
                {/* Logo */}
                <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mb-4">
                    <span className="text-white font-bold text-xl">M</span>
                </div>
                <h3 className="text-2xl font-black tracking-tighter uppercase mb-1">The Restaurant</h3>
                <p className="text-xs text-gray-500 font-mono mb-6">Order ID: #{order.id.slice(0, 8).toUpperCase()} • {new Date(order.created_at).toLocaleTimeString()}</p>

                <div className="w-full border-b-2 border-dashed border-gray-300 mb-6"></div>

                {/* Items List */}
                <div className="w-full space-y-3 font-mono text-sm">
                    {orderItems.map((item, i) => (
                        <motion.div 
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1 + (i * 0.1) }} // Staggered list
                            className="flex justify-between items-start"
                        >
                            <div className="flex gap-3">
                                <span className="font-bold">{item.quantity}x</span>
                                <span className="uppercase">{item.menu_items.name}</span>
                            </div>
                            <span>${(parseFloat(item.price_at_time.toString()) * item.quantity).toFixed(2)}</span>
                        </motion.div>
                    ))}
                </div>

                <div className="w-full border-b-2 border-dashed border-gray-300 my-6"></div>

                {/* Totals */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="w-full space-y-2"
                >
                    <div className="flex justify-between text-gray-500 text-sm">
                        <span>Subtotal</span>
                        <span>${total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-500 text-sm">
                        <span>Service (10%)</span>
                        <span>${serviceCharge.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-black mt-4">
                        <span>TOTAL</span>
                        <span>${finalTotal.toFixed(2)}</span>
                    </div>
                </motion.div>

                {/* Fake Barcode */}
                <div className="mt-8 opacity-50 flex flex-col items-center gap-1">
                    <div className="flex gap-1 h-8">
                        {[...Array(20)].map((_, i) => (
                            <div key={i} className={`bg-black ${Math.random() > 0.5 ? 'w-1' : 'w-0.5'}`}></div>
                        ))}
                    </div>
                    <span className="text-[10px] tracking-[0.5em] font-mono">THANK YOU</span>
                </div>
            </div>
        </motion.div>

        {/* Receipt Bottom Edge (Jagged) */}
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mx-auto max-w-sm h-4 bg-white w-[95%] relative z-20 rounded-b-lg -mt-1"
            style={{ 
                clipPath: "polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)"
            }}
        />
      </div>

      {/* --- ACTION BUTTONS (Floating) --- */}
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 2, type: 'spring' }}
        className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black via-black/90 to-transparent z-40"
      >
        <div className="flex gap-3 max-w-md mx-auto">
            <button className="flex-1 bg-neutral-800 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform">
                <MessageSquare size={18} /> Call Waiter
            </button>
            <button className="flex-[2] bg-white text-black py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-white/10 active:scale-95 transition-transform">
                <CreditCard size={18} /> Pay ${finalTotal.toFixed(2)}
            </button>
        </div>
      </motion.div>

    </div>
  );
}