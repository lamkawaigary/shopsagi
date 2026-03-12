'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
      // Don't redirect if already on login page
      if (!currentUser && pathname !== '/driver/login') {
        router.push('/driver/login');
      }
    });

    return () => unsubscribe();
  }, [router, pathname]);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
    }
    router.push('/driver/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) return null;

  const navItems = [
    { href: '/driver/dashboard', label: '接單', icon: '🚀' },
    { href: '/driver/orders', label: '訂單', icon: '📋' },
    { href: '/driver/wallet', label: '收入', icon: '💰' },
    { href: '/driver/profile', label: '設定', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50 md:hidden">
        <div className="px-4 py-3 flex justify-between items-center">
          <h1 className="text-lg font-bold text-blue-600">ShopSagi 司機</h1>
          <button 
            className="p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="text-xl">{mobileMenuOpen ? '✕' : '☰'}</span>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t bg-white px-4 py-3 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block py-2 px-3 rounded-lg ${
                  pathname === item.href 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.icon} {item.label}
              </Link>
            ))}
            <button
              onClick={() => {
                handleLogout();
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 px-3 text-red-600 hover:bg-red-50 rounded-lg"
            >
              🚪 登出
            </button>
          </div>
        )}
      </header>

      {/* Desktop Header */}
      <header className="bg-white shadow-sm hidden md:block">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold text-blue-600">ShopSagi 司機端</h1>
            <nav className="flex gap-6">
              <Link href="/driver/dashboard" className="text-gray-600 hover:text-blue-600">
                接單
              </Link>
              <Link href="/driver/orders" className="text-gray-600 hover:text-blue-600">
                我的訂單
              </Link>
              <Link href="/driver/wallet" className="text-gray-600 hover:text-blue-600">
                收入
              </Link>
              <Link href="/driver/profile" className="text-gray-600 hover:text-blue-600">
                設定
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 truncate max-w-[150px]">{user.email}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-red-600"
            >
              登出
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-8">
        {children}
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg md:hidden safe-area-bottom z-50">
        <div className="flex justify-around items-center h-14">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 py-2 ${
                  isActive ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-xs mt-0.5">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
