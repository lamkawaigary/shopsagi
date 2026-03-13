'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, doc, getDoc, limit } from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';

interface Transaction {
  id: string;
  amount: number;
  type: 'earning' | 'withdrawal' | 'bonus';
  description: string;
  createdAt: any;
  orderId?: string;
}

interface DriverWallet {
  balance: number;
  totalEarnings: number;
  totalWithdrawn: number;
  todayEarnings: number;
  todayCompleted: number;
  weekEarnings: number;
  monthEarnings: number;
  rating: number;
  totalOrders: number;
}

export default function DriverWalletPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<DriverWallet>({
    balance: 0,
    totalEarnings: 0,
    totalWithdrawn: 0,
    todayEarnings: 0,
    todayCompleted: 0,
    weekEarnings: 0,
    monthEarnings: 0,
    rating: 5.0,
    totalOrders: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDoc = await getDoc(doc(db!, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.role !== 'driver') {
            router.push('/register?role=driver');
            return;
          }
        }
        await fetchWalletData(currentUser.uid);
      } else {
        router.push('/driver/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const fetchWalletData = async (userId: string) => {
    if (!db) return;
    
    try {
      // Get driver wallet data
      const driverDoc = await getDoc(doc(db, 'drivers', userId));
      if (driverDoc.exists()) {
        const data = driverDoc.data();
        setWallet({
          balance: data.balance || 0,
          totalEarnings: data.totalEarnings || 0,
          totalWithdrawn: data.totalWithdrawn || 0,
          todayEarnings: data.todayEarnings || 0,
          todayCompleted: data.todayCompleted || 0,
          weekEarnings: data.weekEarnings || 0,
          monthEarnings: data.monthEarnings || 0,
          rating: data.rating || 5.0,
          totalOrders: data.totalOrders || 0,
        });
      }

      // Get transactions
      const txQuery = query(
        collection(db, 'transactions'),
        where('driverId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      const txSnapshot = await getDocs(txQuery);
      const txData: Transaction[] = txSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          amount: data.amount || 0,
          type: data.type || 'earning',
          description: data.description || '',
          createdAt: data.createdAt,
          orderId: data.orderId || '',
        };
      });
      setTransactions(txData);
    } catch (error) {
      console.error('Error fetching wallet:', error);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return '-';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleString('zh-HK', { 
      month: 'numeric', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'earning': return 'text-green-600';
      case 'withdrawal': return 'text-red-600';
      case 'bonus': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earning': return '💰';
      case 'withdrawal': return '🏦';
      case 'bonus': return '🎁';
      default: return '💳';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="pb-20 md:pb-8">
      {/* Balance Card */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-lg p-6 text-white mb-6">
        <div className="text-sm opacity-80 mb-1">可提現餘額</div>
        <div className="text-4xl font-bold mb-4">HK${wallet.balance}</div>
        <button 
          className="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-blue-50"
          onClick={() => alert('提現功能即將推出！')}
        >
          💳 申請提現
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-sm text-gray-600 mb-1">今日收入</div>
          <div className="text-2xl font-bold text-green-600">HK${wallet.todayEarnings}</div>
          <div className="text-xs text-gray-500">{wallet.todayCompleted} 單</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-sm text-gray-600 mb-1">本週收入</div>
          <div className="text-2xl font-bold text-green-600">HK${wallet.weekEarnings}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-sm text-gray-600 mb-1">本月收入</div>
          <div className="text-2xl font-bold text-green-600">HK${wallet.monthEarnings}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-sm text-gray-600 mb-1">總收入</div>
          <div className="text-2xl font-bold text-green-600">HK${wallet.totalEarnings}</div>
          <div className="text-xs text-gray-500">{wallet.totalOrders} 單</div>
        </div>
      </div>

      {/* Rating */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="text-gray-600">客戶評分</div>
          <div className="text-2xl font-bold text-yellow-600">{wallet.rating.toFixed(1)} ⭐</div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="font-bold text-lg mb-4">最近交易</h3>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-3xl mb-2">📊</div>
            暫時未有交易記錄
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex justify-between items-center py-2 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{getTransactionIcon(tx.type)}</span>
                  <div>
                    <div className="font-medium">{tx.description}</div>
                    <div className="text-xs text-gray-500">{formatDate(tx.createdAt)}</div>
                  </div>
                </div>
                <div className={`font-bold ${getTransactionColor(tx.type)}`}>
                  {tx.type === 'withdrawal' ? '-' : '+'}HK${tx.amount}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
