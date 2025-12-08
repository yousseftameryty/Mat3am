"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Minus, ShoppingCart, AlertCircle, CheckCircle,
  UtensilsCrossed, Coffee, Pizza, Beer, Grid3X3, X
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { createOrder } from "@/app/actions";
import { getDeviceFingerprint, getTableAccess, getOriginalTable, recordTableAccess } from "@/utils/deviceFingerprint";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  { id: "all", name: "All Items", icon: Grid3X3 },
  { id: "burger", name: "Burgers", icon: UtensilsCrossed },
  { id: "pizza", name: "Pizzas", icon: Pizza },
  { id: "drink", name: "Drinks", icon: Coffee },
  { id: "alcohol", name: "Bar", icon: Beer },
];

const EMOJI_MAP: Record<string, string> = {
  burger: "🍔",
  pizza: "🍕",
  drink: "🥤",
  alcohol: "🍹",
};

const BG_COLORS = [
  "bg-orange-500/20",
  "bg-yellow-500/20",
  "bg-red-500/20",
  "bg-blue-500/20",
  "bg-green-500/20",
  "bg-rose-500/20",
  "bg-amber-500/20",
  "bg-yellow-600/20",
  "bg-pink-500/20",
];

type MenuItem = {
  id: number;
  name: string;
  price: number;
  category: string;
  emoji?: string;
  bg?: string;
};

type CartItem = {
  id: number;
  name: string;
  price: number;
  qty: number;
};

type MenuViewProps = {
  tableId: number;
  onOrderCreated: () => void;
};

export default function MenuView({ tableId, onOrderCreated }: MenuViewProps) {
  const router = useRouter();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirm1, setShowConfirm1] = useState(false);
  const [showConfirm2, setShowConfirm2] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Record table access when menu is viewed
    recordTableAccess(tableId);
    
    async function fetchMenu() {
      const supabase = createClient();
      const { data: items, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_available', true)
        .order('name');

      if (!error && items) {
        const itemsWithEmoji = items.map((item: any, idx: number) => ({
          ...item,
          price: parseFloat(item.price),
          emoji: EMOJI_MAP[item.category] || "🍽️",
          bg: BG_COLORS[idx % BG_COLORS.length],
        }));
        setMenuItems(itemsWithEmoji);
      }
      setLoading(false);
    }
    fetchMenu();
  }, [tableId]);

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      return activeCategory === "all" || item.category === activeCategory;
    });
  }, [activeCategory, menuItems]);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const updateQty = (id: number, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, qty: Math.max(0, item.qty + delta) };
        }
        return item;
      }).filter((i) => i.qty > 0)
    );
  };

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const handleOrder = async () => {
    if (cart.length === 0) return;
    setShowConfirm1(true);
  };

  const confirmOrder = async () => {
    setShowConfirm1(false);
    setShowConfirm2(true);
  };

  const finalConfirm = async () => {
    setIsProcessing(true);
    setShowConfirm2(false);
    
    try {
      // Gather validation data for security
      const fingerprint = getDeviceFingerprint();
      const tableAccess = getTableAccess(tableId);
      const originalTable = getOriginalTable();

      // Ensure we have a valid timestamp (use current time if not found)
      const accessTimestamp = tableAccess?.timestamp || Date.now();

      const validationData = {
        deviceFingerprint: fingerprint,
        tableAccessTimestamp: accessTimestamp,
        originalTableId: originalTable,
      };
      
      console.log('Validation data:', {
        tableId,
        accessTimestamp,
        originalTable,
        timeSinceAccess: Date.now() - accessTimestamp
      });

      const result = await createOrder(tableId, cart, total, validationData);
      
      // Silent redirect if trying to order for different table
      if (!result.success && result.redirectToTable && result.redirectToTable !== tableId) {
        router.push(`/table/${result.redirectToTable}`);
        return;
      }
      
      if (result.success) {
        // Lock customer to this table ONLY after successful order
        // Store as original table for future orders
        const fingerprint = getDeviceFingerprint();
        const accessLog = JSON.parse(localStorage.getItem('order_access_log') || '[]');
        
        // Check if this is the first order (no original table set yet)
        const hasOriginalTable = accessLog.length > 0 && accessLog[0]?.fingerprint === fingerprint;
        
        if (!hasOriginalTable) {
          // Set this as the original table (prepend to log)
          accessLog.unshift({
            tableId,
            fingerprint,
            timestamp: Date.now(),
          });
          // Keep only last 10 entries
          if (accessLog.length > 10) {
            accessLog.pop();
          }
          localStorage.setItem('order_access_log', JSON.stringify(accessLog));
        }
        
        // Record successful order attempt
        recordTableAccess(tableId);
        
        // Clear cart immediately
        setCart([]);
        
        setShowSuccess(true);
        // Wait for order to be committed, then fetch with retry logic
        setTimeout(() => {
          setShowSuccess(false);
          
          // Retry fetching order if it doesn't appear immediately
          let retries = 0;
          const maxRetries = 10; // Increased retries
          const retryInterval = setInterval(() => {
            retries++;
            console.log(`Retrying order fetch... attempt ${retries}/${maxRetries}`);
            onOrderCreated();
            if (retries >= maxRetries) {
              clearInterval(retryInterval);
              console.log('Max retries reached, stopping retry');
            }
          }, 800); // Check every 800ms
          
          // Also call immediately
          onOrderCreated();
        }, 500); // Reduced initial delay
      } else if (result.error) {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Order error:', error);
      alert("❌ Failed to create order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-32">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-500">
              Table {tableId} Menu
            </h1>
            <p className="text-gray-500 text-sm mt-1">Browse and order items</p>
          </div>
          {cart.length > 0 && (
            <div className="bg-orange-500/20 border border-orange-500/50 rounded-full px-4 py-2 flex items-center gap-2">
              <ShoppingCart size={20} />
              <span className="font-bold">{cart.length} items</span>
            </div>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="px-6 py-4 overflow-x-auto">
        <div className="flex gap-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all whitespace-nowrap
                ${activeCategory === cat.id
                  ? "bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/25"
                  : "bg-neutral-900/50 text-gray-400 border-white/5 hover:border-white/20 hover:text-white"}`}
            >
              <cat.icon size={16} /> {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Grid */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => addToCart(item)}
              className="group bg-neutral-900/40 border border-white/5 rounded-2xl p-4 cursor-pointer hover:border-orange-500/50 hover:bg-neutral-800/80 transition-all"
            >
              <div className={`h-24 w-full rounded-xl mb-3 ${item.bg} flex items-center justify-center text-4xl group-hover:scale-105 transition-transform`}>
                {item.emoji}
              </div>
              <h3 className="font-semibold text-sm mb-1 group-hover:text-orange-400 transition-colors">{item.name}</h3>
              <p className="text-xs text-gray-500 mb-2 capitalize">{item.category}</p>
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">${item.price.toFixed(2)}</span>
                <button className="bg-orange-500/20 hover:bg-orange-500/30 p-1.5 rounded-lg transition-colors">
                  <Plus size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Cart Sidebar */}
      {cart.length > 0 && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/95 to-transparent p-6 z-50"
        >
          <div className="max-w-md mx-auto">
            <div className="bg-neutral-900/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 mb-4 max-h-48 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-gray-500">${item.price.toFixed(2)} each</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => updateQty(item.id, -1)} className="p-1 hover:bg-white/10 rounded">
                      <Minus size={14} />
                    </button>
                    <span className="font-bold w-8 text-center">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="p-1 hover:bg-white/10 rounded">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mb-4 text-sm">
              <span className="text-gray-400">Subtotal</span>
              <span className="font-bold">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between mb-4 text-sm">
              <span className="text-gray-400">Tax (10%)</span>
              <span className="font-bold">${tax.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
              <span className="text-lg font-bold">Total</span>
              <span className="text-xl font-black text-orange-400">${total.toFixed(2)}</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleOrder}
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all"
            >
              {isProcessing ? "Processing..." : `Place Order - $${total.toFixed(2)}`}
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Confirmation Dialogs */}
      <AnimatePresence>
        {showConfirm1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowConfirm1(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-neutral-900 border border-white/10 rounded-2xl p-6 max-w-md w-full"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
                  <AlertCircle className="text-orange-400" size={24} />
                </div>
                <h3 className="text-xl font-bold">Confirm Your Order</h3>
              </div>
              <p className="text-gray-400 mb-6">
                You're about to place an order for <strong className="text-white">${total.toFixed(2)}</strong>.
                Please review your items before confirming.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm1(false)}
                  className="flex-1 bg-neutral-800 text-white py-3 rounded-xl font-medium hover:bg-neutral-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmOrder}
                  className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-medium hover:bg-orange-600 transition-colors"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showConfirm2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowConfirm2(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-neutral-900 border border-white/10 rounded-2xl p-6 max-w-md w-full"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
                  <AlertCircle className="text-orange-400" size={24} />
                </div>
                <h3 className="text-xl font-bold">Final Confirmation</h3>
              </div>
              <p className="text-gray-400 mb-4">
                <strong className="text-white">Last step!</strong> Are you sure you want to place this order?
              </p>
              <div className="bg-neutral-800/50 rounded-lg p-3 mb-6">
                <p className="text-sm text-gray-300 mb-2">Order Summary:</p>
                <div className="space-y-1">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between text-xs">
                      <span className="text-gray-400">{item.qty}x {item.name}</span>
                      <span className="text-white">${(item.price * item.qty).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-3 pt-3 border-t border-white/10">
                  <span className="font-bold">Total</span>
                  <span className="font-black text-orange-400">${total.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm2(false)}
                  className="flex-1 bg-neutral-800 text-white py-3 rounded-xl font-medium hover:bg-neutral-700 transition-colors"
                >
                  Go Back
                </button>
                <button
                  onClick={finalConfirm}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 rounded-xl font-medium hover:from-orange-600 hover:to-red-700 transition-colors"
                >
                  Confirm Order
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-neutral-900 border border-green-500/50 rounded-2xl p-8 max-w-md w-full text-center"
            >
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-green-400" size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-2">Order Placed!</h3>
              <p className="text-gray-400">Your order has been sent to the kitchen.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

