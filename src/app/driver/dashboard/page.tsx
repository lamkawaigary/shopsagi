'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

interface Order {
  id: string;
  orderNumber: string;
  merchantName: string;
  pickupAddress: string;
  deliveryAddress: string;
  distance: number;
  fee: number;
  status: string;
}

export default function DriverDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'available' | 'my'>('available');

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchOrders();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchOrders = async () => {
    if (!db) return;
    
    try {
      // Fetch available orders (pending delivery)
      const availableQuery = query(
        collection(db, 'orders'),
        where('status', '==', 'ready_for_pickup'),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      const availableSnapshot = await getDocs(availableQuery);
      const available = availableSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setAvailableOrders(available);

      // Fetch my orders (where driver is current user)
      // In real app, you'd query by driverId
    } catch (error) {
      console.error('Error fetching orders:', error);
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
      <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">搶單專區</h2>

      {/* Stats - 2x2 on mobile */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
          <div className="text-sm text-gray-600 mb-1">今日收入</div>
          <div className="text-xl md:text-3xl font-bold text-green-600">HK$0</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
          <div className="text-sm text-gray-600 mb-1">今日完成</div>
          <div className="text-xl md:text-3xl font-bold text-blue-600">0</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
          <div className="text-sm text-gray-600 mb-1">本週收入</div>
          <div className="text-xl md:text-3xl font-bold text-green-600">HK$0</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
          <div className="text-sm text-gray-600 mb-1">評分</div>
          <div className="text-xl md:text-3xl font-bold text-yellow-600">5.0 ⭐</div>
        </div>
      </div>

      {/* Tabs - full width on mobile */}
      <div className="flex gap-2 md:gap-4 mb-4 md:mb-6">
        <button
          onClick={() => setActiveTab('available')}
          className={`flex-1 px-3 md:px-6 py-2.5 md:py-3 rounded-lg font-medium text-sm md:text-base ${
            activeTab === 'available' 
              ? 'bg-blue-600 text-white' 
              : 'bg-white text-gray-600 hover:bg-gray-50 border'
          }`}
        >
          🚀 可搶訂單 ({availableOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('my')}
          className={`flex-1 px-3 md:px-6 py-2.5 md:py-3 rounded-lg font-medium text-sm md:text-base ${
            activeTab === 'my' 
              ? 'bg-blue-600 text-white' 
              : 'bg-white text-gray-600 hover:bg-gray-50 border'
          }`}
        >
          📋 我的訂單
        </button>
      </div>

      {/* Orders List */}
      {activeTab === 'available' ? (
        availableOrders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 md:p-12 text-center">
            <div className="text-3xl md:text-4xl mb-3 md:mb-4">📭</div>
            <h3 className="text-base md:text-lg font-semibold mb-2">暫時未有可搶既訂單</h3>
            <p className="text-gray-500 text-sm md:text-base">有單既話會顯示呢度</p>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {availableOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl shadow-sm p-4 md:p-6">
                <div className="flex justify-between items-start mb-3 md:mb-4">
                  <div>
                    <div className="font-bold text-base md:text-lg">{order.orderNumber || order.id}</div>
                    <div className="text-gray-600 text-sm md:text-base">{order.merchantName}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl md:text-2xl font-bold text-green-600">HK${order.fee}</div>
                    <div className="text-sm text-gray-500">{order.distance}km</div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3 md:p-4 mb-3 md:mb-4">
                  <div className="flex items-start gap-2 md:gap-3">
                    <div className="text-green-600 mt-0.5">📍</div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs md:text-sm text-gray-500">取餐地點</div>
                      <div className="text-sm md:text-base truncate">{order.pickupAddress}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 md:gap-3 mt-2 md:mt-3">
                    <div className="text-red-600 mt-0.5">🏠</div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs md:text-sm text-gray-500">送餐地址</div>
                      <div className="text-sm md:text-base truncate">{order.deliveryAddress}</div>
                    </div>
                  </div>
                </div>

                <button className="w-full bg-green-600 text-white py-2.5 md:py-3 rounded-lg hover:bg-green-700 font-medium text-sm md:text-base">
                  🚀 搶單
                </button>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-8 md:p-12 text-center">
          <div className="text-3xl md:text-4xl mb-3 md:mb-4">📋</div>
          <h3 className="text-base md:text-lg font-semibold mb-2">暫時未有進行中既訂單</h3>
          <p className="text-gray-500 text-sm md:text-base">搶單後會顯示呢度</p>
        </div>
      )}
    </div>
  );
}
