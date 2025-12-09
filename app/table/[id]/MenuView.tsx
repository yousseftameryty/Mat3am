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
  "bg-green-100",
  "bg-emerald-100",
  "bg-green-50",
  "bg-emerald-50",
  "bg-lime-100",
  "bg-teal-100",
  "bg-green-200/50",
  "bg-emerald-200/50",
  "bg-lime-50",
];

type MenuItem = {
  id: number;
  name: string;
  price: number;
  category: string;
  image_url?: string | null;
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
          image_url: item.image_url || null,
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
      
      console.log('[MenuView] Creating order with validation data:', {
        tableId,
        accessTimestamp,
        originalTable,
        timeSinceAccess: Date.now() - accessTimestamp,
        cartItems: cart.length
      });

      const result = await createOrder(tableId, cart, total, validationData);
      
      console.log('[MenuView] Order creation result:', result);
      
      // Silent redirect if trying to order for different table
      if (!result.success && result.redirectToTable && result.redirectToTable !== tableId) {
        console.log(`[MenuView] Redirecting to table ${result.redirectToTable}`);
        router.push(`/table/${result.redirectToTable}`);
        return;
      }
      
      if (result.success) {
        console.log(`[MenuView] Order created successfully: ${result.orderId}`);
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
      <div className="min-h-screen bg-gradient-to-br from-white via-green-50/30 to-white text-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-green-50/30 to-white text-gray-900 pb-32">
      {/* Header */}
      <div className="p-6 border-b border-green-200 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">
              Table {tableId} Menu
            </h1>
            <p className="text-gray-600 text-sm mt-1">Browse and order items</p>
          </div>
          {cart.length > 0 && (
            <div className="bg-green-100 border border-green-300 rounded-full px-4 py-2 flex items-center gap-2 shadow-sm">
              <ShoppingCart size={20} className="text-green-600" />
              <span className="font-bold text-green-700">{cart.length} items</span>
            </div>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="px-6 py-4 overflow-x-auto bg-white/50">
        <div className="flex gap-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all whitespace-nowrap shadow-sm
                ${activeCategory === cat.id
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white border-green-500 shadow-lg shadow-green-500/30"
                  : "bg-white text-gray-600 border-green-200 hover:border-green-400 hover:text-green-600 hover:bg-green-50"}`}
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
              className="group bg-white border border-green-200 rounded-2xl p-4 cursor-pointer hover:border-green-400 hover:shadow-lg hover:shadow-green-500/10 transition-all shadow-sm"
            >
              <div className={`aspect-square w-full rounded-xl mb-3 ${item.bg} flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform relative`}>
                {item.image_url ? (
                    <img 
                        src={item.image_url} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            // Fallback to emoji if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                                parent.innerHTML = `<span class="text-4xl">${item.emoji}</span>`;
                            }
                        }}
                    />
                ) : (
                    <span className="text-4xl">{item.emoji}</span>
                )}
              </div>
              <h3 className="font-semibold text-sm mb-1 group-hover:text-green-600 transition-colors text-gray-900">{item.name}</h3>
              <p className="text-xs text-gray-500 mb-2 capitalize">{item.category}</p>
              <div className="flex items-center justify-between">
                <span className="font-bold text-green-600">${item.price.toFixed(2)}</span>
                <button className="bg-green-100 hover:bg-green-200 p-1.5 rounded-lg transition-colors text-green-600">
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
          className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-green-50/95 to-transparent p-6 z-50 shadow-2xl"
        >
          <div className="max-w-md mx-auto">
            <div className="bg-white/95 backdrop-blur-md border border-green-200 rounded-2xl p-4 mb-4 max-h-48 overflow-y-auto shadow-lg">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-green-100 last:border-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-600">${item.price.toFixed(2)} each</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => updateQty(item.id, -1)} className="p-1 hover:bg-green-100 rounded text-gray-600 hover:text-green-600">
                      <Minus size={14} />
                    </button>
                    <span className="font-bold w-8 text-center text-gray-900">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="p-1 hover:bg-green-100 rounded text-gray-600 hover:text-green-600">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mb-4 text-sm text-gray-700">
              <span>Subtotal</span>
              <span className="font-bold">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between mb-4 text-sm text-gray-700">
              <span>Tax (10%)</span>
              <span className="font-bold">${tax.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-green-200">
              <span className="text-lg font-bold text-gray-900">Total</span>
              <span className="text-xl font-black text-green-600">${total.toFixed(2)}</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleOrder}
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all"
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
            className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowConfirm1(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white border border-green-200 rounded-2xl p-6 max-w-md w-full shadow-xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="text-green-600" size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Confirm Your Order</h3>
              </div>
              <p className="text-gray-600 mb-6">
                You're about to place an order for <strong className="text-green-600">${total.toFixed(2)}</strong>.
                Please review your items before confirming.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm1(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors border border-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmOrder}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 transition-colors shadow-sm"
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
            className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowConfirm2(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white border border-green-200 rounded-2xl p-6 max-w-md w-full shadow-xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="text-green-600" size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Final Confirmation</h3>
              </div>
              <p className="text-gray-600 mb-4">
                <strong className="text-green-600">Last step!</strong> Are you sure you want to place this order?
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
                <p className="text-sm text-gray-700 mb-2 font-medium">Order Summary:</p>
                <div className="space-y-1">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between text-xs">
                      <span className="text-gray-600">{item.qty}x {item.name}</span>
                      <span className="text-gray-900 font-medium">${(item.price * item.qty).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-3 pt-3 border-t border-green-200">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-black text-green-600">${total.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm2(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors border border-gray-200"
                >
                  Go Back
                </button>
                <button
                  onClick={finalConfirm}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 transition-colors shadow-sm"
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
            className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white border border-green-300 rounded-2xl p-8 max-w-md w-full text-center shadow-xl"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-green-600" size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-2 text-gray-900">Order Placed!</h3>
              <p className="text-gray-600">Your order has been sent to the kitchen.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

