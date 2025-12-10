import Link from "next/link";
import { QrCode, ChefHat, UtensilsCrossed, Clock, CheckCircle } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-green-50/30 to-emerald-50/50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo/Header */}
          <div className="mb-12">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl mb-6 shadow-2xl shadow-green-500/30 p-4">
              <img src="/HKLOGO.png" alt="Hazara Kabab" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-6xl md:text-7xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">
              Hazara Kabab
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 font-medium">Authentic Afghan Cuisine</p>
          </div>

          {/* Main CTA */}
          <div className="bg-white/80 backdrop-blur-sm border border-green-200 rounded-3xl p-8 md:p-12 mb-12 shadow-xl">
            <div className="flex flex-col items-center gap-6">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
                <QrCode className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Scan QR Code at Your Table</h2>
              <p className="text-lg text-gray-600 max-w-2xl">
                View our menu, place your order, and track it in real-time. 
                No app download required - just scan and enjoy!
              </p>
              <div className="flex flex-wrap gap-4 justify-center mt-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-xl">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Instant Menu Access</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-xl">
                  <Clock className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Real-time Order Tracking</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-xl">
                  <UtensilsCrossed className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Fresh & Authentic</span>
                </div>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-white border border-green-200 rounded-3xl p-8 md:p-12 shadow-lg">
            <h2 className="text-3xl font-bold mb-8 text-gray-900">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8 text-left">
              <div className="flex flex-col items-start">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-green-600">1</span>
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900">Scan QR Code</h3>
                <p className="text-gray-600">Find the QR code on your table and scan it with your phone camera</p>
              </div>
              <div className="flex flex-col items-start">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-green-600">2</span>
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900">Browse & Order</h3>
                <p className="text-gray-600">Browse our delicious menu, add items to your cart, and place your order</p>
              </div>
              <div className="flex flex-col items-start">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-green-600">3</span>
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900">Track & Enjoy</h3>
                <p className="text-gray-600">Watch your order status in real-time and pay when ready</p>
              </div>
            </div>
          </div>

          {/* Demo Link (for testing) */}
          <div className="mt-12 text-center">
            <p className="text-sm text-gray-500 mb-4">Want to see how it works?</p>
            <Link
              href="/table/1"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-xl shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all"
            >
              <ChefHat className="w-5 h-5" />
              View Demo Table
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}