'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function CustomerProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Check if user is customer
        const userDoc = await getDoc(doc(db!, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setProfile(userData);
          if (userData.role !== 'customer') {
            router.push('/');
            return;
          }
        }
      } else {
        router.push('/login/customer');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
    }
    router.push('/login/customer');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="pb-20 md:pb-8">
      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-2xl">
            <div className="text-4xl">用戶</div>
          </div>
          <div>
            <h2 className="text-xl font-bold">{profile?.name || '顧客'}</h2>
            <p className="text-gray-600 text-sm">{user?.email}</p>
            <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full mt-1">
              顧客帳戶
            </span>
          </div>
        </div>
      </div>

      {/* Menu Options */}
      <div className="bg-white rounded-xl shadow-sm divide-y">
        <button
          onClick={() => router.push('/customer/orders')}
          className="w-full flex justify-between items-center p-4 hover:bg-gray-50"
        >
          <span className="flex items-center gap-3">
            <span>訂單</span>
            <span>我的訂單</span>
          </span>
          <span className="text-gray-400">→</span>
        </button>
        
        <button
          onClick={() => router.push('/customer/addresses')}
          className="w-full flex justify-between items-center p-4 hover:bg-gray-50"
        >
          <span className="flex items-center gap-3">
            <span>地址</span>
            <span>我的地址</span>
          </span>
          <span className="text-gray-400">→</span>
        </button>
        
        <button
          onClick={() => alert('Payment methods coming soon!')}
          className="w-full flex justify-between items-center p-4 hover:bg-gray-50"
        >
          <span className="flex items-center gap-3">
            <span>支付</span>
            <span>付款方式</span>
          </span>
          <span className="text-gray-400">→</span>
        </button>
        
        <button
          onClick={() => alert('Support coming soon!')}
          className="w-full flex justify-between items-center p-4 hover:bg-gray-50"
        >
          <span className="flex items-center gap-3">
            <span>❓</span>
            <span>幫助中心</span>
          </span>
          <span className="text-gray-400">→</span>
        </button>
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="w-full mt-6 bg-red-50 text-red-600 py-3 rounded-xl font-medium hover:bg-red-100"
      >
        登出
      </button>
    </div>
  );
}
