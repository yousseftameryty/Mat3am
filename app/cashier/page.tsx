"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import { 
  Search, ShoppingBag, UtensilsCrossed, Coffee, 
  Pizza, Beer, Plus, Minus, 
  CreditCard, User, Grid3X3, ChefHat, CheckCircle
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { createOrder } from "../actions";
import { formatCurrency } from "@/utils/currency";

// --- CATEGORIES ---
const CATEGORIES = [
  { id: "all", name: "All Items", icon: Grid3X3 },
  { id: "burger", name: "Burgers", icon: UtensilsCrossed },
  { id: "pizza", name: "Pizzas", icon: Pizza },
  { id: "drink", name: "Drinks", icon: Coffee },
  { id: "alcohol", name: "Bar", icon: Beer },
];

// Emoji mapping for menu items
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

// --- TYPES ---
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

// --- COMPONENT ---
export default function CashierDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tables, setTables] = useState<number[]>([]);

  const navItems = [
    { name: 'POS', path: '/cashier', icon: Grid3X3 },
    { name: 'Orders', path: '/cashier/orders', icon: ShoppingBag },
    { name: 'Tables', path: '/cashier/tables', icon: User },
    { name: 'Settings', path: '/cashier/settings', icon: CreditCard },
  ];

  // Fetch menu items from Supabase
  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      
      // Fetch menu items
      const { data: items, error: itemsError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_available', true)
        .order('name');

      if (itemsError) {
        console.error('Error fetching menu items:', itemsError);
      } else {
        const itemsWithEmoji = items.map((item: { id: number; name: string; price: string; category: string; image_url?: string | null }, idx: number) => ({
          ...item,
          price: parseFloat(item.price),
          emoji: EMOJI_MAP[item.category] || "🍽️",
          bg: BG_COLORS[idx % BG_COLORS.length],
          image_url: item.image_url || null,
        }));
        setMenuItems(itemsWithEmoji);
      }

      // Fetch tables
      const { data: tablesData, error: tablesError } = await supabase
        .from('restaurant_tables')
        .select('id')
        .order('id');

      if (tablesError) {
        console.error('Error fetching tables:', tablesError);
      } else {
        setTables(tablesData.map((t: { id: number }) => t.id));
      }

      setLoading(false);
    }

    fetchData();
  }, []);

  // --- LOGIC ---
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory = activeCategory === "all" || item.category === activeCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery, menuItems]);

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

  const handleCheckout = async () => {
    if (!selectedTable) {
        alert("⚠️ Please select a table first!");
        return;
    }
    if (cart.length === 0) {
        alert("⚠️ Cart is empty!");
        return;
    }
    
    setIsProcessing(true);
    
    try {
      // Cashier orders don't need validation (they're staff)
      // Pass undefined for validationData to skip security checks
      const result = await createOrder(selectedTable, cart, total, undefined);
      
      if (result.success) {
        setCart([]);
        setSelectedTable(null);
        alert(`✅ Order #${result.orderId?.slice(0, 8)} sent to kitchen!`);
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert("❌ Failed to create order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-gradient-to-br from-white via-green-50/30 to-white text-gray-900 overflow-hidden selection:bg-green-500 selection:text-white">
      
      {/* --- LEFT SIDEBAR (Navigation) --- */}
      <nav className="w-20 flex flex-col items-center py-8 border-r border-green-200/50 bg-white/80 backdrop-blur-md z-20 shadow-sm">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-xl mb-10 shadow-lg shadow-green-500/30">
            <img src="/HKLOGO.png" alt="Hazara Kabab" className="w-7 h-7 object-contain" />
        </div>
        
        <div className="flex flex-col gap-6 w-full px-4">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                onClick={() => router.push(item.path)}
                className={`p-3 rounded-xl transition-all duration-300 group relative flex justify-center ${
                  isActive 
                    ? 'bg-green-500/10 text-green-600 shadow-sm' 
                    : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
                }`}
              >
                <Icon size={20} />
                {/* Tooltip */}
                <span className="absolute left-14 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-green-500/20 pointer-events-none z-50 shadow-lg">
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* --- MIDDLE AREA (Menu Grid) --- */}
      <main className="flex-1 flex flex-col relative z-10">
        {/* Header */}
        <header className="px-8 py-6 flex justify-between items-center bg-transparent">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">Cashier</span>
            </h1>
            <p className="text-gray-600 text-sm mt-1">Ready to take orders</p>
          </div>

          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <div className="relative flex items-center bg-white rounded-full px-4 py-2.5 w-80 border border-green-200 shadow-sm">
              <Search className="text-gray-400 w-5 h-5 mr-3" />
              <input 
                type="text" 
                placeholder="Search menu..." 
                className="bg-transparent border-none outline-none text-sm w-full placeholder-gray-400 text-gray-900"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </header>

        {/* Categories */}
        <div className="px-8 mb-6">
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium border transition-all duration-300 whitespace-nowrap shadow-sm
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
        <div className="flex-1 overflow-y-auto px-8 pb-8">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-500">Loading menu...</div>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                <AnimatePresence>
                    {filteredItems.map((item) => (
                        <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => addToCart(item)}
                            className="group relative bg-white border border-green-100 rounded-3xl p-4 cursor-pointer hover:border-green-400 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 shadow-sm"
                        >
                            <div className={`aspect-square w-full rounded-2xl mb-4 ${item.bg} flex items-center justify-center overflow-hidden shadow-inner group-hover:scale-105 transition-transform duration-300 relative`}>
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
                                                parent.innerHTML = `<span class="text-5xl">${item.emoji}</span>`;
                                            }
                                        }}
                                    />
                                ) : (
                                    <span className="text-5xl">{item.emoji}</span>
                                )}
                            </div>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">{item.name}</h3>
                                    <p className="text-xs text-gray-500 capitalize">{item.category}</p>
                                </div>
                                <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg text-sm border border-green-200">
                                    {formatCurrency(item.price)}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
              </div>
            )}
        </div>
      </main>

      {/* --- RIGHT SIDEBAR (The Ticket) --- */}
      <aside className="w-[450px] bg-white border-l border-green-200 flex flex-col shadow-2xl relative z-30">
        
        {/* Table Selector */}
        <div className="p-6 border-b border-green-200 bg-gradient-to-b from-green-50/50 to-white">
            <h2 className="text-sm uppercase tracking-wider text-gray-600 mb-3 font-semibold">Select Table</h2>
            <p className="text-xs text-gray-500 mb-2">Cart data preserved when changing tables</p>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {loading ? (
                  <div className="text-gray-500 text-sm">Loading tables...</div>
                ) : (
                  tables.map((num) => (
                    <button
                        key={num}
                        onClick={() => setSelectedTable(num)}
                        className={`min-w-[45px] h-[45px] rounded-xl flex items-center justify-center text-sm font-bold border transition-all duration-200 shadow-sm
                        ${selectedTable === num 
                            ? "bg-gradient-to-br from-green-500 to-emerald-600 border-green-500 text-white shadow-lg shadow-green-500/40 scale-105" 
                            : "bg-white border-green-200 text-gray-600 hover:bg-green-50 hover:border-green-400"}`}
                    >
                        {num}
                    </button>
                  ))
                )}
            </div>
        </div>

        {/* Order List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white">
            {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                    <ShoppingBag size={48} strokeWidth={1} className="mb-4 text-green-300" />
                    <p className="text-lg">Cart is empty</p>
                    <p className="text-sm">Select items to begin</p>
                </div>
            ) : (
                <AnimatePresence>
                    {cart.map((item) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                            className="flex items-center gap-4 bg-green-50/50 p-3 rounded-2xl border border-green-100 group hover:border-green-300 hover:bg-green-50 transition-colors shadow-sm"
                        >
                            <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold shadow-sm">
                                {item.qty}x
                            </div>
                            <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{item.name}</h4>
                                <div className="text-xs text-gray-500">{formatCurrency(item.price)} / unit</div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="font-bold text-green-600">{formatCurrency(item.price * item.qty)}</span>
                                
                                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => updateQty(item.id, 1)} className="text-gray-400 hover:text-green-600">
                                        <Plus size={14} />
                                    </button>
                                    <button onClick={() => updateQty(item.id, -1)} className="text-gray-400 hover:text-red-500">
                                        <Minus size={14} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            )}
        </div>

        {/* Footer / Checkout */}
        <div className="p-6 bg-gradient-to-b from-white to-green-50/30 border-t border-green-200 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-40">
            <div className="space-y-2 mb-6">
                                <div className="flex justify-between text-gray-600 text-sm">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600 text-sm">
                    <span>Tax (10%)</span>
                    <span>{formatCurrency(tax)}</span>
                </div>
                <div className="flex justify-between text-gray-900 text-xl font-bold pt-2 border-t border-green-200 mt-2">
                    <span>Total</span>
                    <span className="text-green-600">{formatCurrency(total)}</span>
                </div>
            </div>

            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCheckout}
                disabled={cart.length === 0 || isProcessing}
                className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg transition-all duration-300
                ${cart.length === 0 
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed" 
                    : "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-green-500/30 hover:shadow-green-500/50"}`}
            >
                {isProcessing ? (
                     <motion.div 
                        animate={{ rotate: 360 }} 
                        transition={{ repeat: Infinity, duration: 1 }}
                     >
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full" />
                     </motion.div>
                ) : (
                    <>
                       {selectedTable ? `Send to Table ${selectedTable}` : 'Select Table First'}
                       <CheckCircle size={20} />
                    </>
                )}
            </motion.button>
        </div>
      </aside>
    </div>
  );
}