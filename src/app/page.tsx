'use client';

import Link from "next/link";
import { useState } from 'react';
import { 
  ShoppingCart, Menu, Search, Bell,
  ChevronRight, Truck, ShieldCheck, CreditCard,
  ChevronLeft, Laptop, Shirt, ShoppingBag, Home, BookOpen, Dumbbell, User
} from 'lucide-react';

const CATEGORIES = [
  { icon: Laptop, name: '3C電子', color: 'text-blue-600', bg: 'bg-blue-50' },
  { icon: Shirt, name: '時尚服飾', color: 'text-purple-600', bg: 'bg-purple-50' },
  { icon: ShoppingBag, name: '生鮮雜貨', color: 'text-green-600', bg: 'bg-green-50' },
  { icon: Home, name: '居家生活', color: 'text-orange-600', bg: 'bg-orange-50' },
  { icon: BookOpen, name: '圖書文具', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { icon: Dumbbell, name: '運動健身', color: 'text-teal-600', bg: 'bg-teal-50' },
  { icon: User, name: '美妝保養', color: 'text-pink-600', bg: 'bg-pink-50' },
  { icon: Menu, name: '更多', color: 'text-gray-600', bg: 'bg-gray-50' },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-surface)' }}>
      {/* Top Navigation */}
      <header className="topbar">
        <div className="flex items-center gap-4">
          <button 
            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-surface-container transition"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="material-symbols-outlined text-on-surface-variant">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
          <Link href="/" className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">storefront</span>
            <h1 className="font-h3 text-primary hidden sm:block">OpenShops</h1>
          </Link>
        </div>

        {/* Desktop Search */}
        <div className="hidden md:flex flex-1 max-w-xl mx-8">
          <div className="relative w-full group">
            <input 
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3 pl-12 pr-28 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              placeholder="搜索商品、品牌或店家"
              type="text"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">
              search
            </span>
            <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-white px-4 py-1.5 rounded-lg text-sm font-label-md hover:bg-primary-container transition-colors">
              搜索
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg hover:bg-surface-container transition relative">
            <Bell className="w-5 h-5 text-on-surface-variant" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
          </button>
          <Link href="/login" className="btn btn-primary text-sm py-2 px-4 hidden sm:flex">
            登入
          </Link>
          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-white font-bold text-xs">
            G
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40" style={{ top: '64px' }}>
          <div className="bg-surface-container-lowest border-b border-outline-variant p-4 space-y-3">
            <Link 
              href="/customer" 
              className="flex items-center justify-center gap-2 py-3 px-4 bg-primary text-white rounded-xl font-label-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              <ShoppingBag className="w-5 h-5" />
              開始購物
            </Link>
            <div className="pt-3 border-t border-outline-variant space-y-2">
              <p className="text-xs text-on-surface-variant font-label-md px-2">商務合作</p>
              <Link 
                href="/login/merchant" 
                className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-surface-container"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="material-symbols-outlined text-primary">storefront</span>
                <span className="font-label-md text-primary">商戶登入</span>
              </Link>
              <Link 
                href="/login/driver" 
                className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-surface-container"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Truck className="w-5 h-5 text-primary" />
                <span className="font-label-md text-primary">司機登入</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="pt-4 pb-16">
        {/* Search Bar (Mobile) */}
        <div className="md:hidden px-4 mb-6">
          <div className="relative">
            <input 
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-primary transition-all"
              placeholder="搜索商品..."
              type="text"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
          </div>
        </div>

        {/* Hero Banner */}
        <section className="px-4 md:px-8 mb-8">
          <div className="max-w-[1280px] mx-auto">
            <div className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden shadow-lg">
              <img 
                className="w-full h-full object-cover"
                alt="Summer Sale"
                src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&h=500&fit=crop"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/70 to-transparent flex flex-col justify-center px-8 md:px-12 text-white">
                <span className="badge-success w-fit mb-3">
                  <span className="material-symbols-outlined text-xs">local_offer</span>
                  期間限定優惠
                </span>
                <h1 className="font-h1 text-white mb-2">夏季數位盛典</h1>
                <p className="font-body-lg text-white/90 mb-4 max-w-md">
                  全站電子產品 85 折起，滿額再享免運優惠
                </p>
                <Link
                  href="/customer"
                  className="btn btn-secondary w-fit"
                >
                  立即搶購
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="px-4 md:px-8 mb-8">
          <div className="max-w-[1280px] mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-h2 text-primary">熱門分類</h2>
              <Link href="/customer" className="font-label-md text-primary flex items-center gap-1 hover:underline">
                查看全部
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              {CATEGORIES.map((cat, i) => (
                <Link
                  key={i}
                  href="/customer"
                  className="flex flex-col items-center gap-2 group cursor-pointer p-3 rounded-xl hover:bg-surface-container transition-all"
                >
                  <div className="w-14 h-14 rounded-2xl bg-surface-high flex items-center justify-center group-hover:bg-primary-container group-hover:text-white transition-all">
                    <cat.icon className={`text-2xl ${cat.color}`} />
                  </div>
                  <span className="font-label-sm text-on-surface text-center">{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="px-4 md:px-8 mb-8">
          <div className="max-w-[1280px] mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-h2 text-primary">為你推薦</h2>
              <div className="flex gap-2">
                <button className="p-2 rounded-full border border-outline-variant hover:bg-surface-container transition">
                  <ChevronLeft className="w-4 h-4 text-on-surface-variant" />
                </button>
                <button className="p-2 rounded-full border border-outline-variant hover:bg-surface-container transition">
                  <ChevronRight className="w-4 h-4 text-on-surface-variant" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Link
                  key={i}
                  href="/customer"
                  className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden group hover:shadow-lg transition-all flex flex-col"
                >
                  <div className="aspect-square bg-surface-high flex items-center justify-center overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-surface-container to-surface-container-high flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-surface-variant text-4xl">package</span>
                    </div>
                  </div>
                  <div className="p-3 flex flex-col flex-1">
                    <div className="font-label-md text-primary line-clamp-2 mb-2 flex-1">精選商品 {i}</div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="font-h3 text-primary">HK$ {128 + i * 20}</span>
                      <span className="text-xs text-on-surface-variant line-through">HK$ {180 + i * 20}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-on-surface-variant">
                      <span className="text-amber-500">★</span>
                      <span>4.{i}</span>
                      <span className="ml-auto">已售 100+</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="px-4 md:px-8 mb-8" id="features">
          <div className="max-w-[1280px] mx-auto">
            <h2 className="font-h2 text-primary text-center mb-6">為什麼選擇 OpenShops？</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant text-center hover:shadow-md transition">
                <div className="w-14 h-14 rounded-2xl bg-secondary-container mx-auto mb-4 flex items-center justify-center">
                  <Truck className="w-6 h-6 text-on-secondary-container" />
                </div>
                <h3 className="font-h3 text-primary mb-2">快速配送</h3>
                <p className="text-on-surface-variant text-sm">多種配送選擇，最快30分鐘送到</p>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant text-center hover:shadow-md transition">
                <div className="w-14 h-14 rounded-2xl bg-primary-fixed mx-auto mb-4 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-on-primary-fixed" />
                </div>
                <h3 className="font-h3 text-primary mb-2">安全支付</h3>
                <p className="text-on-surface-variant text-sm">Stripe 專業支付技術，保障交易安全</p>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant text-center hover:shadow-md transition">
                <div className="w-14 h-14 rounded-2xl bg-secondary-container mx-auto mb-4 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-on-secondary-container" />
                </div>
                <h3 className="font-h3 text-primary mb-2">品質保証</h3>
                <p className="text-on-surface-variant text-sm">商戶實名認證，商品品質有保証</p>
              </div>
            </div>
          </div>
        </section>

        {/* Merchant CTA */}
        <section className="px-4 md:px-8 mb-8">
          <div className="max-w-[1280px] mx-auto">
            <div className="gradient-primary rounded-2xl p-8 md:p-12 text-white text-center relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
              <div className="relative z-10">
                <h2 className="font-h1 text-white mb-3">想開網店？</h2>
                <p className="font-body-lg text-white/80 mb-6 max-w-lg mx-auto">
                  加入 OpenShops，免費開店，專業工具助您生意做大做強
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/register" className="btn bg-white text-primary">
                    立即免費開店
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                  <Link href="/login/merchant" className="btn bg-white/10 text-white border border-white/20 hover:bg-white/20">
                    商戶登入
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Preview */}
        <section className="px-4 md:px-8 mb-8" id="pricing">
          <div className="max-w-[1280px] mx-auto">
            <h2 className="font-h2 text-primary text-center mb-6">定價方案</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* Free Plan */}
              <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant">
                <div className="mb-4">
                  <h3 className="font-h3 text-primary mb-2">基礎版</h3>
                  <p className="text-on-surface-variant text-sm">適合剛起步的個人賣家</p>
                </div>
                <div className="mb-6">
                  <span className="font-h1 text-primary">免費</span>
                  <span className="text-on-surface-variant text-sm ml-1">/ 永久</span>
                </div>
                <ul className="space-y-3 mb-6">
                  {[
                    '最多 20 個商品上架',
                    '標準訂單管理系統',
                    '基礎數據分析',
                    'Email 客戶支援',
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <span className="material-symbols-outlined text-secondary text-sm">check_circle</span>
                      <span className="text-on-surface">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/register" className="btn btn-outline w-full">
                  立即開始
                </Link>
              </div>

              {/* Pro Plan */}
              <div className="gradient-card rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-4 right-4 bg-secondary-container text-on-secondary-container text-[10px] font-bold px-2 py-1 rounded">
                  最受歡迎
                </div>
                <div className="mb-4">
                  <h3 className="font-h3 text-white mb-2">升級 Pro 版</h3>
                  <p className="text-white/70 text-sm">為專業賣家打造</p>
                </div>
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="font-h1 text-white">HK$ 168</span>
                    <span className="text-white/60 text-sm">/ 月起</span>
                  </div>
                  <p className="text-secondary-fixed text-xs mt-1">年度訂閱平均每月只需 HK$138</p>
                </div>
                <ul className="space-y-3 mb-6">
                  {[
                    '無限量商品上架',
                    'AI 自動化行銷助理',
                    '實時銷售深度數據分析',
                    '24/7 專屬客戶顧問',
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-white">
                      <span className="material-symbols-outlined text-secondary-fixed text-sm">check_circle</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/register" className="btn w-full" style={{ background: 'var(--color-secondary-container)', color: 'var(--color-on-secondary-container)' }}>
                  升級 Pro 版
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* About */}
        <section className="px-4 md:px-8" id="about">
          <div className="max-w-[1280px] mx-auto text-center">
            <h2 className="font-h2 text-primary mb-4">關於 OpenShops</h2>
            <p className="text-on-surface-variant max-w-2xl mx-auto mb-4">
              OpenShops 是香港專業電商平台，致力於為中小企提供最方便、最實惠的網上購物體驗。
              我們相信科技能夠幫助您專注於最重要的事——您的事業。
            </p>
            <p className="text-sm text-on-surface-variant">
              想了解更多？聯絡我們：hello@openshops.hk
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-primary text-white py-12">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-2xl">storefront</span>
                <span className="font-h3">OpenShops</span>
              </div>
              <p className="text-white/60 text-sm">
                香港專業電商平台<br />
                為中小企打造
              </p>
            </div>
            <div>
              <h4 className="font-label-md mb-3">平台</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><Link href="/customer" className="hover:text-white transition">顧客端</Link></li>
                <li><Link href="/merchant/dashboard" className="hover:text-white transition">商戶端</Link></li>
                <li><Link href="/driver/dashboard" className="hover:text-white transition">司機端</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-label-md mb-3">支援</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><a href="#" className="hover:text-white transition">幫助中心</a></li>
                <li><a href="#" className="hover:text-white transition">聯絡我們</a></li>
                <li><a href="#" className="hover:text-white transition">常見問題</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-label-md mb-3">法律</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><a href="#" className="hover:text-white transition">服務條款</a></li>
                <li><a href="#" className="hover:text-white transition">私隱政策</a></li>
                <li><a href="#" className="hover:text-white transition">Cookie 政策</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 text-center text-white/40 text-sm">
            <p>© 2026 OpenShops. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
