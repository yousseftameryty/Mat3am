import Link from "next/link";
import { ChefHat, QrCode, ShoppingBag } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-green-50/50 to-white text-gray-900">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo/Header */}
          <div className="mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-6 shadow-lg shadow-green-500/30 p-3">
              <img src="/HKLOGO.png" alt="Hazara Kabab" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-5xl md:text-6xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">
              Hazara Kabab
            </h1>
            <p className="text-xl text-gray-600">Restaurant Billing System</p>
          </div>

          {/* Description */}
          <p className="text-lg text-gray-700 mb-12 max-w-2xl mx-auto">
            A modern, real-time restaurant billing system with QR code table access.
            Manage orders, track status, and provide customers with instant bill access.
          </p>

          {/* Quick Links */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Link
              href="/cashier"
              className="group bg-white border border-green-200 rounded-2xl p-6 hover:border-green-400 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 shadow-sm"
            >
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-500/20 transition-colors">
                <ShoppingBag className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Cashier</h3>
              <p className="text-sm text-gray-600">Take orders and manage tables</p>
            </Link>

            <Link
              href="/admin/qr-code"
              className="group bg-white border border-green-200 rounded-2xl p-6 hover:border-green-400 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 shadow-sm"
            >
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-500/20 transition-colors">
                <QrCode className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">QR Codes</h3>
              <p className="text-sm text-gray-600">Generate table QR codes</p>
            </Link>

            <Link
              href="/table/1"
              className="group bg-white border border-green-200 rounded-2xl p-6 hover:border-green-400 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 shadow-sm"
            >
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-500/20 transition-colors">
                <ChefHat className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Table View</h3>
              <p className="text-sm text-gray-600">Customer order view (demo)</p>
            </Link>
          </div>

          {/* Features */}
          <div className="bg-white border border-green-200 rounded-2xl p-8 text-left shadow-sm">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">Features</h2>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                <div>
                  <strong className="text-gray-900">Real-time Updates</strong>
                  <p className="text-gray-600">Live order status tracking</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                <div>
                  <strong className="text-gray-900">QR Code Access</strong>
                  <p className="text-gray-600">Customers scan to view bills</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                <div>
                  <strong className="text-gray-900">Beautiful UI</strong>
                  <p className="text-gray-600">Modern, animated interface</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                <div>
                  <strong className="text-gray-900">Order Management</strong>
                  <p className="text-gray-600">Complete billing system</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
