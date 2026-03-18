'use client';

import Link from "next/link";
import { useState } from "react";
import { 
  ShoppingCart, Menu, X, ShoppingBag, Store, Truck, 
  Clock, BadgePercent, Star, ChevronRight,
  Home, Leaf, Shirt, Sparkles, Package
} from "lucide-react";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Simple Nav */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-purple-600 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6" />
            ShopSagi 舖記
          </Link>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/#features" className="text-gray-800 hover:text-purple-600 transition">Features</Link>
            <Link href="/#pricing" className="text-gray-800 hover:text-purple-600 transition">Pricing</Link>
            <Link href="/#about" className="text-gray-800 hover:text-purple-600 transition">About</Link>
            <Link href="/#contact" className="text-gray-800 hover:text-purple-600 transition">Contact</Link>
          </nav>
          
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-white px-4 py-4 space-y-3">
            <Link 
              href="/customer" 
              className="flex items-center justify-center gap-2 py-3 px-4 bg-purple-600 text-white rounded-lg font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              <ShoppingBag className="w-5 h-5" />
              開始購物
            </Link>
            <div className="pt-3 border-t space-y-2">
              <p className="text-xs text-gray-800 font-medium px-2">商務合作</p>
              <Link 
                href="/login/merchant" 
                className="flex items-center gap-2 py-2 text-gray-800 text-sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Store className="w-4 h-4" />
                商戶登入
              </Link>
              <Link 
                href="/login/driver" 
                className="flex items-center gap-2 py-2 text-gray-800 text-sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Truck className="w-4 h-4" />
                司機登入
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero - Shopping Focus */}
      <main>
        <section className="py-8 md:py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
              想買嘢？搵舖記！
            </h1>
            <p className="text-gray-700 mb-6 md:mb-8 text-sm md:text-lg">
              香港人一站式購物平台<br />
              咁都有，咁都平，送到你家
            </p>
            
            {/* Main CTA - Go Shopping */}
            <Link
              href="/customer"
              className="inline-flex items-center gap-2 px-8 md:px-12 py-4 md:py-5 bg-purple-600 text-white rounded-full text-lg md:text-xl font-bold hover:bg-purple-700 transition shadow-lg"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>開始購物</span>
            </Link>
          </div>
        </section>

        {/* Category Quick Links */}
        <section className="py-8 md:py-12 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-center text-gray-900">熱門類別</h2>
            <div className="grid grid-cols-4 md:grid-cols-6 gap-3 md:gap-4">
              {[
                { icon: Soup, name: '美食', color: 'text-orange-500' },
                { icon: Sparkles, name: '飲品', color: 'text-pink-500' },
                { icon: Leaf, name: '生鮮', color: 'text-green-500' },
                { icon: Home, name: '家居', color: 'text-blue-500' },
                { icon: Shirt, name: '服裝', color: 'text-indigo-500' },
                { icon: Sparkles, name: '美妝', color: 'text-rose-500' },
              ].map((cat) => (
                <Link
                  key={cat.name}
                  href="/customer"
                  className="flex flex-col items-center p-3 md:p-4 rounded-xl hover:bg-gray-100 transition"
                >
                  <cat.icon className={`w-8 h-8 md:w-10 md:h-10 mb-1 md:mb-2 ${cat.color}`} />
                  <span className="text-sm md:text-sm text-gray-900 font-medium">{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products Preview */}
        <section className="py-8 md:py-12">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-gray-900">為你推薦</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition">
                  <div className="h-28 md:h-36 bg-gray-100 flex items-center justify-center">
                    <Package className="w-12 h-12 md:w-16 md:h-16 text-gray-400" />
                  </div>
                  <div className="p-2.5 md:p-3">
                    <div className="font-medium text-sm mb-1 line-clamp-2 text-gray-900">精選商品 {i}</div>
                    <div className="text-purple-600 font-bold">HK${28 + i * 10}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="text-center mt-6 md:mt-8">
              <Link
                href="/customer"
                className="inline-flex items-center gap-1 px-6 py-2.5 border-2 border-purple-600 text-purple-600 rounded-full font-medium hover:bg-purple-50 transition"
              >
                查看更多
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section id="features" className="py-8 md:py-12 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-center text-gray-900">點解選舖記？</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <div className="text-center p-4">
                <div className="inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full bg-purple-100 mb-3">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
                <div className="font-semibold mb-1 text-gray-900">快送到戶</div>
                <p className="text-sm text-gray-700">最快30分鐘送到</p>
              </div>
              <div className="text-center p-4">
                <div className="inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full bg-green-100 mb-3">
                  <BadgePercent className="w-6 h-6 text-green-600" />
                </div>
                <div className="font-semibold mb-1 text-gray-900">價錢實惠</div>
                <p className="text-sm text-gray-700">多家商戶比較</p>
              </div>
              <div className="text-center p-4">
                <div className="inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full bg-yellow-100 mb-3">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="font-semibold mb-1 text-gray-900">品質保証</div>
                <p className="text-sm text-gray-700">商戶評分可見</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section - Info only */}
        <section id="pricing" className="py-10 md:py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-xl md:text-2xl font-bold mb-6 text-center text-gray-900">定價</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Merchant Pricing */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-3">
                  <Store className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-gray-900">商戶</h3>
                <p className="text-gray-700 text-sm">免費開舖 • 訂單抽 10%</p>
              </div>
              
              {/* Driver Pricing */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-3">
                  <Truck className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-gray-900">司機</h3>
                <p className="text-gray-700 text-sm">免加盟費 • 每單 HK$20-30</p>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-10 md:py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-xl md:text-2xl font-bold mb-4 text-gray-900">關於舖記</h2>
            <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
              ShopSagi 舖記係香港人一站式購物平台，等你可以喺屋企都可以買到各地好嘢。
              我哋致力於為香港人提供最方便，最優惠既網上購物體驗。
            </p>
            <p className="text-sm text-gray-600">
              想了解更多？聯絡我們：hello@shopsagi.com
            </p>
          </div>
        </section>

      </main>

      {/* Simple Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8 md:py-10">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 text-white font-bold text-lg mb-2">
            <ShoppingCart className="w-5 h-5" />
            ShopSagi 舖記
          </div>
          <p className="text-sm mb-4">香港人既購物平台</p>
          <p className="text-xs text-gray-500">
            © 2026 ShopSagi 舖記. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
