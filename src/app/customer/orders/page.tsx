'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import Link from 'next/link';

type OrderItem = {
  name?: string;
  quantity?: number;
  price?: number;
};

type OrderRecord = {
  id: string;
  orderNumber?: string;
  createdAt?: { toDate?: () => Date } | string | Date;
  merchantName?: string;
  status?: string;
  items?: OrderItem[];
  total?: number;
};

function normalizeDate(value?: { toDate?: () => Date } | string | Date) {
  if (!value) return new Date(0);
  if (value instanceof Date) return value;
  if (typeof value === 'object' && 'toDate' in value) {
    return value.toDate?.() || new Date(0);
  }
  return new Date(typeof value === 'string' ? value : 0);
}

export default function CustomerOrdersPage() {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(Boolean(auth));

  const fetchOrders = async (userId: string) => {
    if (!db) return;
    
    try {
      const byUserIdQuery = query(
        collection(db, 'orders'),
        where('userId', '==', userId)
      );
      const byCustomerIdQuery = query(
        collection(db, 'orders'),
        where('customerId', '==', userId)
      );
      const [byUserIdSnapshot, byCustomerIdSnapshot] = await Promise.all([
        getDocs(byUserIdQuery),
        getDocs(byCustomerIdQuery),
      ]);
      const merged = new Map<string, OrderRecord>();
      [...byUserIdSnapshot.docs, ...byCustomerIdSnapshot.docs].forEach((docSnap) => {
        merged.set(docSnap.id, {
          id: docSnap.id,
          ...(docSnap.data() as Omit<OrderRecord, 'id'>),
        });
      });
      const orderList = Array.from(merged.values());
      orderList.sort((a, b) => normalizeDate(b.createdAt).getTime() - normalizeDate(a.createdAt).getTime());
      setOrders(orderList);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    }
  };

  useEffect(() => {
    if (!auth) return;
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchOrders(currentUser.uid);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-purple-100 text-purple-800';
      case 'delivering': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '待確認';
      case 'confirmed': return '已確認';
      case 'preparing': return '準備中';
      case 'delivering': return '配送中';
      case 'completed': return '已完成';
      case 'cancelled': return '已取消';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-bold mb-2">請先登入</h2>
        <Link href="/customer/login" className="text-purple-600 hover:underline">
          登入 / 註冊
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">我的訂單</h2>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-3xl mb-4">訂單</div>
          <h3 className="text-lg font-semibold mb-2">暫時未有訂單</h3>
          <p className="text-gray-500 mb-4">去shopping啦</p>
          <Link
            href="/customer"
            className="inline-block px-6 py-3 bg-purple-600 text-white rounded-full hover:bg-purple-700"
          >
            去shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex justify-between items-start mb-3 pb-3 border-b">
                <div>
                  <div className="font-bold">{order.orderNumber || order.id}</div>
                  <div className="text-sm text-gray-500">
                    {normalizeDate(order.createdAt).toLocaleString('zh-HK')}
                  </div>
                  <div className="text-sm text-gray-500">商戶: {order.merchantName}</div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(order.status || '')}`}>
                  {getStatusText(order.status || '')}
                </span>
              </div>

              <div className="space-y-1 text-sm">
                {order.items?.map((item, index: number) => (
                  <div key={index} className="flex justify-between">
                    <span>{item.name} x {item.quantity}</span>
                    <span>HK${(item.price || 0) * (item.quantity || 0)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center mt-3 pt-3 border-t">
                <div className="font-bold">總金額：</div>
                <div className="font-bold text-purple-600">HK${order.total}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
