"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Settings, ArrowLeft, Save, Bell, 
  CreditCard, Database, Palette, Shield, CheckCircle2
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState({
    taxRate: 10,
    serviceCharge: 10,
    currency: "USD",
    notifications: true,
    soundEnabled: true,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // Save settings to localStorage or Supabase
    localStorage.setItem('restaurant-settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  useEffect(() => {
    const saved = localStorage.getItem('restaurant-settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-500">
              Settings
            </h1>
            <p className="text-gray-500">Configure your restaurant system</p>
          </div>
          <button
            onClick={() => router.push('/cashier')}
            className="bg-neutral-800 hover:bg-neutral-700 px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            Back to POS
          </button>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Billing Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
                <CreditCard className="text-orange-400" size={20} />
              </div>
              <h2 className="text-xl font-bold">Billing Settings</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Tax Rate (%)</label>
                <input
                  type="number"
                  value={settings.taxRate}
                  onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-neutral-800 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500/50"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Service Charge (%)</label>
                <input
                  type="number"
                  value={settings.serviceCharge}
                  onChange={(e) => setSettings({ ...settings, serviceCharge: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-neutral-800 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500/50"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Currency</label>
                <select
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  className="w-full bg-neutral-800 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500/50"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Notification Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Bell className="text-blue-400" size={20} />
              </div>
              <h2 className="text-xl font-bold">Notifications</h2>
            </div>
            
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm">Enable Notifications</span>
                <input
                  type="checkbox"
                  checked={settings.notifications}
                  onChange={(e) => setSettings({ ...settings, notifications: e.target.checked })}
                  className="w-12 h-6 bg-neutral-800 rounded-full appearance-none relative cursor-pointer checked:bg-orange-500 transition-colors"
                  style={{
                    background: settings.notifications ? '#f97316' : '#262626',
                  }}
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm">Sound Effects</span>
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) => setSettings({ ...settings, soundEnabled: e.target.checked })}
                  className="w-12 h-6 bg-neutral-800 rounded-full appearance-none relative cursor-pointer checked:bg-orange-500 transition-colors"
                  style={{
                    background: settings.soundEnabled ? '#f97316' : '#262626',
                  }}
                />
              </label>
            </div>
          </motion.div>

          {/* Save Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={handleSave}
            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
              saved
                ? 'bg-green-500 text-white'
                : 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700'
            }`}
          >
            {saved ? (
              <>
                <CheckCircle2 size={20} />
                Settings Saved!
              </>
            ) : (
              <>
                <Save size={20} />
                Save Settings
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

