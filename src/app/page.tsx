'use client';

import Link from "next/link";
import { useState, useEffect, useRef } from 'react';
import { 
  ShoppingCart, Menu, X, Bell,
  Store, Truck, ShieldCheck, CreditCard,
  User, Package, Settings, LogOut, ShoppingBag,
  Laptop, Shirt, Home, BookOpen, Dumbbell, Spa, MoreHorizontal
} from 'lucide-react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-surface)' }}>
      {/* Top Navigation */}
      <header className="topbar" style={{ 
        background: 'var(--color-surface-container-lowest)', 
        borderBottom: '1px solid var(--color-outline-variant)',
        height: '64px',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50
      }}>
        <div className="flex items-center justify-between h-full px-4">
          {/* Left: Hamburger Menu + Logo */}
          <div className="flex items-center gap-3">
            {/* Hamburger Menu Button */}
            <button 
              className="p-2 rounded-lg hover:bg-surface-container transition"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-primary" />
              ) : (
                <Menu className="w-6 h-6 text-primary" />
              )}
            </button>
            
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-h3 text-primary leading-tight">Open Shops</h1>
                <p className="text-xs text-on-surface-variant">專業電商平台</p>
              </div>
            </Link>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Search Icon (Mobile) */}
            <button className="p-2 rounded-lg hover:bg-surface-container transition">
              <span className="material-symbols-outlined text-on-surface-variant">search</span>
            </button>
            
            {/* Notifications */}
            <button className="p-2 rounded-lg hover:bg-surface-container transition relative">
              <Bell className="w-5 h-5 text-on-surface-variant" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full"></span>
            </button>
            
            {/* User Avatar with Dropdown */}
            <div className="relative" ref={menuRef}>
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold"
              >
                G
              </button>
              
              {/* Dropdown Menu */}
              {showUserMenu && (
                <div 
                  className="absolute right-0 top-full mt-2 w-56 rounded-xl shadow-lg overflow-hidden z-50"
                  style={{ 
                    background: 'var(--color-surface-container-lowest)',
                    border: '1px solid var(--color-outline-variant)'
                  }}
                >
                  {/* User Info Header */}
                  <div className="px-4 py-3" style={{ background: 'var(--color-primary)' }}>
                    <p className="text-white font-medium">Gary</p>
                    <p className="text-white/70 text-sm">gary@email.com</p>
                  </div>
                  
                  {/* Menu Items */}
                  <div className="py-2">
                    <Link 
                      href="/customer" 
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container transition"
                    >
                      <ShoppingBag className="w-5 h-5 text-primary" />
                      <span className="text-primary font-label-md">我的購物</span>
                    </Link>
                    <Link 
                      href="/customer/orders" 
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container transition"
                    >
                      <Package className="w-5 h-5 text-primary" />
                      <span className="text-primary font-label-md">訂單記錄</span>
                    </Link>
                    <Link 
                      href="/customer/profile" 
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container transition"
                    >
                      <User className="w-5 h-5 text-primary" />
                      <span className="text-primary font-label-md">個人資料</span>
                    </Link>
                    <div className="border-t border-outline-variant my-1"></div>
                    <Link 
                      href="/settings" 
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container transition"
                    >
                      <Settings className="w-5 h-5 text-on-surface-variant" />
                      <span className="text-on-surface-variant font-label-md">設定</span>
                    </Link>
                    <button className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container transition text-error">
                      <LogOut className="w-5 h-5" />
                      <span className="font-label-md">登出</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Menu Drawer */}
          <div 
            className="fixed top-16 left-0 bottom-0 w-72 z-50 overflow-y-auto lg:hidden"
            style={{ background: 'var(--color-surface-container-lowest)' }}
          >
            {/* Menu Header */}
            <div className="px-4 py-4" style={{ background: 'var(--color-primary)' }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <Store className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium">Open Shops</p>
                  <p className="text-white/70 text-sm">專業電商平台</p>
                </div>
              </div>
            </div>
            
            {/* Menu Items */}
            <nav className="py-4">
              <Link 
                href="/customer" 
                className="flex items-center gap-3 px-4 py-3 hover:bg-surface-container transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                <ShoppingBag className="w-5 h-5 text-primary" />
                <span className="text-primary font-label-md">開始購物</span>
              </Link>
              <Link 
                href="/login/merchant" 
                className="flex items-center gap-3 px-4 py-3 hover:bg-surface-container transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Store className="w-5 h-5 text-on-surface-variant" />
                <span className="text-on-surface-variant font-label-md">商戶登入</span>
              </Link>
              <Link 
                href="/login/driver" 
                className="flex items-center gap-3 px-4 py-3 hover:bg-surface-container transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Truck className="w-5 h-5 text-on-surface-variant" />
                <span className="text-on-surface-variant font-label-md">司機登入</span>
              </Link>
              
              <div className="border-t border-outline-variant my-3 mx-4"></div>
              
              <Link 
                href="/register" 
                className="flex items-center gap-3 px-4 py-3 hover:bg-surface-container transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                <User className="w-5 h-5 text-on-surface-variant" />
                <span className="text-on-surface-variant font-label-md">註冊帳戶</span>
              </Link>
            </nav>
          </div>
        </>
      )}

      {/* Main Content */}
      <main className="pt-16">
        {/* Hero Section */}
        <section 
          className="relative overflow-hidden"
          style={{ 
            background: 'linear-gradient(135deg, var(--color-primary) 0%, #003060 100%)',
            minHeight: '400px'
          }}
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-white/20 blur-2xl"></div>
            <div className="absolute bottom-20 right-20 w-60 h-60 rounded-full bg-white/10 blur-3xl"></div>
          </div>
          
          <div className="relative max-w-7xl mx-auto px-6 py-16 md:py-24">
            <div className="max-w-2xl">
              <h2 className="text-white text-4xl md:text-5xl font-bold mb-4 leading-tight">
                為香港中小企<br />打造的專業電商平台
              </h2>
              <p className="text-white/80 text-lg mb-8">
                簡化您的網店運營，提升銷售效率，讓您專注於業務發展
              </p>
              <div className="flex flex-wrap gap-4">
                <Link 
                  href="/customer" 
                  className="inline-flex items-center gap-2 bg-white text-primary px-6 py-3 rounded-xl font-label-md hover:bg-white/90 transition"
                >
                  <ShoppingBag className="w-5 h-5" />
                  開始購物
                </Link>
                <Link 
                  href="/register" 
                  className="inline-flex items-center gap-2 bg-white/10 text-white px-6 py-3 rounded-xl font-label-md hover:bg-white/20 transition border border-white/30"
                >
                  <Store className="w-5 h-5" />
                  申請開店
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Grid */}
        <section className="max-w-7xl mx-auto px-6 py-12">
          <h3 className="font-h2 text-primary mb-6">瀏覽類別</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <Laptop className="w-8 h-8" style={{ color: '#1e40af' }} />, name: '3C電子', color: '#1e40af' },
              { icon: <Shirt className="w-8 h-8" style={{ color: '#7c3aed' }} />, name: '時尚服飾', color: '#7c3aed' },
              { icon: <ShoppingCart className="w-8 h-8" style={{ color: '#059669' }} />, name: '生鮮雜貨', color: '#059669' },
              { icon: <Home className="w-8 h-8" style={{ color: '#ea580c' }} />, name: '居家生活', color: '#ea580c' },
              { icon: <BookOpen className="w-8 h-8" style={{ color: '#4f46e5' }} />, name: '圖書文具', color: '#4f46e5' },
              { icon: <Dumbbell className="w-8 h-8" style={{ color: '#0d9488' }} />, name: '運動健身', color: '#0d9488' },
              { icon: <Spa className="w-8 h-8" style={{ color: '#db2777' }} />, name: '美妝保養', color: '#db2777' },
              { icon: <MoreHorizontal className="w-8 h-8" style={{ color: '#6b7280' }} />, name: '更多', color: '#6b7280' },
            ].map((cat, i) => (
              <button 
                key={i}
                className="p-6 rounded-2xl border border-outline-variant hover:border-primary hover:bg-surface-container transition text-center"
              >
                <span className="mb-3">{cat.icon}</span>
                <p className="font-label-md text-primary">{cat.name}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="max-w-7xl mx-auto px-6 py-12">
          <h3 className="font-h2 text-primary mb-6">為什麼選擇 Open Shops？</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-surface-container">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-label-lg text-primary mb-2">Stripe 安全支付</h4>
              <p className="text-sm text-on-surface-variant">支援多種支付方式，交易安全有保障</p>
            </div>
            <div className="p-6 rounded-2xl bg-surface-container">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Truck className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-label-lg text-primary mb-2">便捷配送</h4>
              <p className="text-sm text-on-surface-variant">整合司機配送網絡，快速送達</p>
            </div>
            <div className="p-6 rounded-2xl bg-surface-container">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-label-lg text-primary mb-2">商家保障</h4>
              <p className="text-sm text-on-surface-variant">專業客服支援，助您事業成長</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-6" style={{ background: 'var(--color-surface-container)' }}>
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Store className="w-4 h-4 text-white" />
                </div>
                <span className="font-label-lg text-primary">Open Shops</span>
              </div>
              <p className="text-sm text-on-surface-variant">
                © 2026 Open Shops. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}