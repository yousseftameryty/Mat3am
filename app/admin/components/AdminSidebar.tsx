'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  UtensilsCrossed,
  BarChart3,
  FileText,
  Settings,
  QrCode,
} from 'lucide-react'
import { motion } from 'framer-motion'

const navItems = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { name: 'Menu', path: '/admin/menu', icon: UtensilsCrossed },
  { name: 'Staff', path: '/admin/staff', icon: Users },
  { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
  { name: 'Audit Logs', path: '/admin/audit', icon: FileText },
  { name: 'QR Codes', path: '/admin/qr-code', icon: QrCode },
  { name: 'Settings', path: '/admin/settings', icon: Settings },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
            <img src="/HKLOGO.png" alt="Hazara Kabab" className="w-7 h-7 object-contain" />
          </div>
          <div>
            <h1 className="font-black text-lg bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">
              Hazara Kabab
            </h1>
            <p className="text-xs text-gray-500">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== '/admin' && pathname.startsWith(item.path))
          const Icon = item.icon

          return (
            <Link key={item.path} href={item.path}>
              <motion.div
                whileHover={{ x: 4 }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30'
                    : 'text-gray-700 hover:bg-green-50 hover:text-green-600'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.name}</span>
              </motion.div>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
