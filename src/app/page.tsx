'use client';

import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Simple Nav */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-purple-600">
            🛒 ShopSagi 舖記
          </Link>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/#features" className="text-gray-600 hover:text-purple-600 transition">Features</Link>
            <Link href="/#pricing" className="text-gray-600 hover:text-purple-600 transition">Pricing</Link>
            <Link href="/#about" className="text-gray-600 hover:text-purple-600 transition">About</Link>
            <Link href="/#contact" className="text-gray-600 hover:text-purple-600 transition">Contact</Link>
          </nav>
          
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="text-2xl">{mobileMenuOpen ? '✕' : '☰'}</span>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-white px-4 py-4 space-y-3">
            <Link 
              href="/customer" 
              className="block py-3 px-4 bg-purple-600 text-white rounded-lg text-center font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              🛍️ 開始購物
            </Link>
            <div className="pt-3 border-t space-y-2">
              <p className="text-xs text-gray-500 px-2">商務合作</p>
              <Link 
                href="/auth/merchant" 
                className="block py-2 text-gray-600 text-sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                🏪 商戶登入
              </Link>
              <Link 
                href="/auth/driver" 
                className="block py-2 text-gray-600 text-sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                🚚 司機登入
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
            <p className="text-gray-600 mb-6 md:mb-8 text-sm md:text-lg">
              香港人一站式購物平台<br />
              咩都有，咩都平，送到你家
            </p>
            
            {/* Main CTA - Go Shopping */}
            <Link
              href="/customer"
              className="inline-flex items-center gap-2 px-8 md:px-12 py-4 md:py-5 bg-purple-600 text-white rounded-full text-lg md:text-xl font-bold hover:bg-purple-700 transition shadow-lg"
            >
              <span>🛍️</span>
              <span>開始購物</span>
            </Link>
            
            {/* Secondary CTA - Merchant */}
            <Link
              href="/auth/merchant"
              className="inline-flex items-center gap-2 px-8 md:px-12 py-4 md:py-5 bg-purple-600 text-white rounded-full text-lg md:text-xl font-bold hover:bg-purple-700 transition shadow-lg"
            >
              <span>🏪</span>
              <span>商戶入駐</span>
            </Link>
          </div>
        </section>

        {/* Category Quick Links */}
        <section className="py-8 md:py-12 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-center">熱門類別</h2>
            <div className="grid grid-cols-4 md:grid-cols-6 gap-3 md:gap-4">
              {[
                { icon: '🍜', name: '美食' },
                { icon: '🧋', name: '飲品' },
                { icon: '🥦', name: '生鮮' },
                { icon: '🏠', name: '家居' },
                { icon: '👕', name: '服裝' },
                { icon: '💄', name: '美妝' },
              ].map((cat) => (
                <Link
                  key={cat.name}
                  href="/customer"
                  className="flex flex-col items-center p-3 md:p-4 rounded-xl hover:bg-gray-50 transition"
                >
                  <span className="text-2xl md:text-3xl mb-1 md:mb-2">{cat.icon}</span>
                  <span className="text-xs md:text-sm text-gray-700">{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products Preview */}
        <section className="py-8 md:py-12">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6">為你推薦</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition">
                  <div className="h-28 md:h-36 bg-gray-100 flex items-center justify-center">
                    <span className="text-3xl md:text-4xl">📦</span>
                  </div>
                  <div className="p-2.5 md:p-3">
                    <div className="font-medium text-sm mb-1 line-clamp-2">精選商品 {i}</div>
                    <div className="text-purple-600 font-bold">HK${28 + i * 10}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="text-center mt-6 md:mt-8">
              <Link
                href="/customer"
                className="inline-block px-6 py-2.5 border-2 border-purple-600 text-purple-600 rounded-full font-medium hover:bg-purple-50 transition"
              >
                查看更多 →
              </Link>
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section id="features" className="py-8 md:py-12 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-center">點解選舖記？</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <div className="text-center p-4">
                <div className="text-2xl md:text-3xl mb-2">🚀</div>
                <div className="font-medium mb-1">快送到戶</div>
                <p className="text-sm text-gray-600">最快30分鐘送到</p>
              </div>
              <div className="text-center p-4">
                <div className="text-2xl md:text-3xl mb-2">💰</div>
                <div className="font-medium mb-1">價錢實惠</div>
                <p className="text-sm text-gray-600">多家商戶比較</p>
              </div>
              <div className="text-center p-4">
                <div className="text-2xl md:text-3xl mb-2">⭐</div>
                <div className="font-medium mb-1">品質保証</div>
                <p className="text-sm text-gray-600">商戶評分可見</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-10 md:py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-xl md:text-2xl font-bold mb-6 text-center">定價</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Merchant Pricing */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="text-2xl mb-3">🏪</div>
                <h3 className="font-bold text-lg mb-2">商戶入駐</h3>
                <p className="text-gray-600 text-sm mb-4">免費開舖，立即上架</p>
                <div className="text-2xl font-bold text-purple-600 mb-4">
                  訂單抽 10%
                </div>
                <Link
                  href="/auth/merchant"
                  className="block w-full py-3 bg-purple-600 text-white rounded-full text-center font-medium hover:bg-purple-700 transition"
                >
                  商戶入駐
                </Link>
              </div>
              
              {/* Driver Pricing */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="text-2xl mb-3">🚚</div>
                <h3 className="font-bold text-lg mb-2">司機加入</h3>
                <p className="text-gray-600 text-sm mb-4">免加盟費，自由接單</p>
                <div className="text-2xl font-bold text-purple-600 mb-4">
                  每單賺 HK$20-30
                </div>
                <Link
                  href="/auth/driver"
                  className="block w-full py-3 bg-purple-600 text-white rounded-full text-center font-medium hover:bg-purple-700 transition"
                >
                  加入司機
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-10 md:py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-xl md:text-2xl font-bold mb-4">關於舖記</h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              ShopSagi 舖記係香港人一站式購物平台，等你可以喺屋企都可以買到各地好嘢。
              我哋致力於為香港人提供最方便、最優惠既網上購物體驗。
            </p>
            <p className="text-sm text-gray-500">
              想了解更多？聯絡我們：hello@shopsagi.com
            </p>
          </div>
        </section>

        {/* CTA Section */}
        <section id="contact" className="py-10 md:py-16 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-center px-4">
          <h2 className="text-xl md:text-2xl font-bold mb-3">想開舖？想做司機？</h2>
          <p className="text-purple-100 mb-5 text-sm md:text-base">加入舖記，一齊賺錢</p>
          <div className="flex flex-col md:flex-row justify-center gap-3 md:gap-4">
            <Link
              href="/auth/merchant"
              className="px-5 py-2.5 bg-white text-purple-600 rounded-full font-medium hover:bg-purple-50 text-sm md:text-base"
            >
              🏪 商戶入駐
            </Link>
            <Link
              href="/auth/driver"
              className="px-5 py-2.5 bg-white text-blue-600 rounded-full font-medium hover:bg-blue-50 text-sm md:text-base"
            >
              🚚 加入司機
            </Link>
          </div>
        </section>
      </main>

      {/* Footer - Business Links Here */}
      <footer className="bg-gray-900 text-gray-400 py-8 md:py-10">
        <div className="max-w-6xl mx-auto px-4">
          
          {/* Explicit Login Section */}
          <div className="bg-gray-800 rounded-xl p-6 md:p-8 mb-8">
            <h3 className="text-white font-bold text-lg mb-4 text-center">商戶 / 司機登入</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <Link 
                href="/register" 
                className="flex items-center justify-center gap-3 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
              >
                <span className="text-xl">🏪</span>
                <span>商戶入駐 / 登入</span>
              </Link>
              <Link 
                href="/register?role=driver" 
                className="flex items-center justify-center gap-3 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                <span className="text-xl">🚚</span>
                <span>司機入駐 / 登入</span>
              </Link>
            </div>
            <p className="text-gray-500 text-sm text-center mt-4">
              顧客登入請點擊右上角「開始購物」
            </p>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-8">
            <div className="text-center md:text-left">
              <div className="text-white font-bold text-lg mb-2">🛒 ShopSagi 舖記</div>
              <p className="text-sm">香港人既購物平台</p>
            </div>
            
            {/* Business Links - Subtle */}
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
              <span className="text-xs text-gray-500">商務合作：</span>
              <div className="flex gap-4 text-sm">
                <Link href="/auth/merchant" className="hover:text-white transition">
                  商戶登入
                </Link>
                <Link href="/auth/driver" className="hover:text-white transition">
                  司機登入
                </Link>
                <Link href="/register" className="hover:text-white transition">
                  註冊
                </Link>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-6 pt-6 text-center text-xs text-gray-500">
            © 2026 ShopSagi 舖記. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
