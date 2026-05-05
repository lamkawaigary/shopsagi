'use client';

import { useEffect, useState } from 'react';
import { 
  LayoutDashboard, Package, FileText, Store, Wallet, 
  Settings, LogOut, Menu, X, ChevronLeft, ChevronRight, Bell
} from 'lucide-react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/merchant/dashboard', label: '商戶儀表板', icon: <LayoutDashboard className="w-5 h-5" /> },
  { href: '/merchant/products', label: '商品管理', icon: <Package className="w-5 h-5" /> },
  { href: '/merchant/orders', label: '訂單管理', icon: <FileText className="w-5 h-5" /> },
  { href: '/merchant/shop', label: '店鋪設定', icon: <Store className="w-5 h-5" /> },
  { href: '/merchant/upgrade', label: '升級方案', icon: <Wallet className="w-5 h-5" /> },
];

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (!currentUser) {
        router.push('/login/merchant');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
    }
    router.push('/login/merchant');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-surface)' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-on-surface-variant font-body-sm">載入中...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const sidebarContent = (
    <>
      {/* Sidebar Header */}
      <div className="p-6 border-b border-outline-variant flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center">
          <Store className="w-5 h-5 text-white" />
        </div>
        {!sidebarCollapsed && (
          <div>
            <h1 className="font-h3 text-primary text-sm">OpenShops</h1>
            <p className="text-label-sm text-on-surface-variant">商戶平台</p>
          </div>
        )}
      </div>

      {/* User Info */}
      <div className="p-4 mx-4 my-4 rounded-xl bg-surface-container">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-white font-bold text-xs">
            {user.email?.[0]?.toUpperCase() || 'M'}
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="font-label-md text-primary truncate">{user.email?.split('@')[0]}</p>
              <p className="text-label-sm text-on-surface-variant truncate">{user.email}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              {item.icon}
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-outline-variant">
        <button
          onClick={handleLogout}
          className="sidebar-nav-item text-error hover:bg-error-container hover:text-error w-full"
        >
          <LogOut className="w-5 h-5" />
          {!sidebarCollapsed && <span>登出系統</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-surface)' }}>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-[55] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {sidebarContent}
      </aside>

      {/* Desktop Collapsed Sidebar Toggle */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="hidden lg:flex fixed top-1/2 -translate-y-1/2 z-40 w-6 h-12 items-center justify-center rounded-r-lg shadow-md transition-all hover:scale-105"
        style={{ 
          left: sidebarCollapsed ? '0' : 'var(--sidebar-width)',
          background: 'var(--color-surface-container-lowest)',
          border: '1px solid var(--color-outline-variant)'
        }}
      >
        {sidebarCollapsed ? (
          <ChevronRight className="w-4 h-4 text-on-surface-variant" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-on-surface-variant" />
        )}
      </button>

      {/* Main Content */}
      <main className={sidebarCollapsed ? 'main-content-collapsed' : 'main-content'}>
        {/* Mobile Header */}
        <header className="lg:hidden topbar mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 rounded-lg hover:bg-surface-container transition"
            >
              <Menu className="w-5 h-5 text-on-surface" />
            </button>
            <div className="flex items-center gap-2">
              <Store className="w-6 h-6 text-primary" />
              <h1 className="font-h3 text-primary">OpenShops</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/merchant/shop" className="p-2 rounded-lg hover:bg-surface-container transition">
              <Bell className="w-5 h-5 text-on-surface-variant" />
            </Link>
            <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-white font-bold text-xs">
              {user.email?.[0]?.toUpperCase() || 'M'}
            </div>
          </div>
        </header>

        {/* Desktop Header Spacer */}
        <div className="hidden lg:block h-0" />

        {/* Page Content */}
        <div className="container mx-auto">
          {children}
        </div>
      </main>

      <style jsx global>{`
        .main-content-collapsed {
          margin-left: 0;
          padding: 32px;
          min-height: 100vh;
          background: var(--color-surface);
        }
      `}</style>
    </div>
  );
}
