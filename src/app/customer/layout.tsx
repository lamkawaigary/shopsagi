'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { CartProvider, useCart } from '@/lib/cart';
import { ToastProvider, useToast } from '@/components/Toast';
import { ShoppingCart, ShoppingBag, User as UserIcon } from 'lucide-react';

function CartIcon() {
  const { itemCount } = useCart();
  return (
    <Link
      href="/customer/cart"
      className="flex flex-col items-center justify-center flex-1 py-2"
    >
      <span className="text-xl relative">
        🛒
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
            {itemCount > 9 ? '9+' : itemCount}
          </span>
        )}
      </span>
      <span className="text-xs mt-1">購物車</span>
    </Link>
  );
}

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
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
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login/customer');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const navItems = [
    { href: '/customer', label: '首頁', icon: '🏠' },
    { href: '/customer/cart', label: '購物車', icon: '🛒', component: CartIcon },
    { href: '/customer/orders', label: '訂單', icon: '📋' },
    { href: '/customer/profile', label: '我的', icon: '👤' },
  ];

  return (
    <CartProvider>
      <ToastProvider>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
            <Link href="/customer" className="text-xl font-bold text-purple-600">
              <ShoppingCart className="w-6 h-6"/> ShopSagi
            </Link>
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <span className="text-sm text-gray-600 hidden md:inline">{user.email}</span>
                  <button onClick={handleLogout} className="text-sm text-gray-600 hover:text-red-600">
                    登出
                  </button>
                </>
              ) : (
                <div className="flex gap-3">
                  <Link href="/login/customer" className="text-sm text-gray-600 hover:text-purple-600">
                    登入
                  </Link>
                  <Link href="/register" className="text-sm text-purple-600 hover:underline">
                    註冊
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-6 pb-20 md:pb-8">
          {children}
        </main>

        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg md:hidden z-50">
          <div className="flex justify-around items-center h-16">
            {navItems.map((item) => {
              if (item.component) {
                return <item.component key={item.href} />;
              }
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center flex-1 py-2 ${
                    isActive ? 'text-purple-600' : 'text-gray-500'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-xs mt-1">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
      </ToastProvider>
    </CartProvider>
  );
}
