import Link from "next/link";
import { ChefHat, QrCode, ShoppingBag } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050505] via-[#0a0a0a] to-[#050505] text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo/Header */}
          <div className="mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl mb-6 shadow-lg shadow-orange-500/20">
              <ChefHat className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-500">
              Mat3am
            </h1>
            <p className="text-xl text-gray-400">Restaurant Billing System</p>
          </div>

          {/* Description */}
          <p className="text-lg text-gray-300 mb-12 max-w-2xl mx-auto">
            A modern, real-time restaurant billing system with QR code table access.
            Manage orders, track status, and provide customers with instant bill access.
          </p>

          {/* Quick Links */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Link
              href="/cashier"
              className="group bg-neutral-900/50 border border-white/10 rounded-2xl p-6 hover:border-orange-500/50 hover:bg-neutral-800/80 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-500/30 transition-colors">
                <ShoppingBag className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Cashier</h3>
              <p className="text-sm text-gray-400">Take orders and manage tables</p>
            </Link>

            <Link
              href="/admin/qr-code"
              className="group bg-neutral-900/50 border border-white/10 rounded-2xl p-6 hover:border-orange-500/50 hover:bg-neutral-800/80 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-500/30 transition-colors">
                <QrCode className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">QR Codes</h3>
              <p className="text-sm text-gray-400">Generate table QR codes</p>
            </Link>

            <Link
              href="/table/1"
              className="group bg-neutral-900/50 border border-white/10 rounded-2xl p-6 hover:border-orange-500/50 hover:bg-neutral-800/80 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-500/30 transition-colors">
                <ChefHat className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Table View</h3>
              <p className="text-sm text-gray-400">Customer order view (demo)</p>
            </Link>
          </div>

          {/* Features */}
          <div className="bg-neutral-900/30 border border-white/10 rounded-2xl p-8 text-left">
            <h2 className="text-2xl font-bold mb-6 text-center">Features</h2>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-500 mt-2"></div>
                <div>
                  <strong>Real-time Updates</strong>
                  <p className="text-gray-400">Live order status tracking</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-500 mt-2"></div>
                <div>
                  <strong>QR Code Access</strong>
                  <p className="text-gray-400">Customers scan to view bills</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-500 mt-2"></div>
                <div>
                  <strong>Beautiful UI</strong>
                  <p className="text-gray-400">Modern, animated interface</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-500 mt-2"></div>
                <div>
                  <strong>Order Management</strong>
                  <p className="text-gray-400">Complete billing system</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
