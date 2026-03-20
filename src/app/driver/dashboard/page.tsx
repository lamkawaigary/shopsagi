'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit, doc, updateDoc, getDoc } from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Truck, Star, Rocket, FileText, Home, MapPin, Phone, Check, Package, Zap, Shield } from 'lucide-react';

interface Order {
  id: string;
  orderNumber: string;
  merchantName: string;
  pickupAddress: string;
  deliveryAddress: string;
  customerPhone?: string;
  distance: number;
  fee: number;
  status: string;
  driverId?: string;
  createdAt?: any;
}

interface DriverStats {
  todayEarnings: number;
  todayCompleted: number;
  weekEarnings: number;
  rating: number;
}

export default function DriverDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<DriverStats>({ todayEarnings: 0, todayCompleted: 0, weekEarnings: 0, rating: 5.0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'available' | 'my'>('available');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth!, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Check if user is driver
        const userDoc = await getDoc(doc(db!, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setProfile(userData);
          if (userData.role !== 'driver') {
            // Not a driver, redirect to register
            router.push('/register?role=driver');
            return;
          }
        }
        await fetchOrders(currentUser.uid);
        await fetchStats(currentUser.uid);
      } else {
        // Not logged in, redirect to login
        router.push('/driver/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const fetchOrders = async (userId: string) => {
    if (!db) return;
    
    try {
      // Fetch available orders (ready_for_pickup and no driver assigned) - simplified
      const availableQuery = query(
        collection(db, 'orders'),
        where('status', '==', 'ready_for_pickup'),
        limit(20)
      );
      const availableSnapshot = await getDocs(availableQuery);
      let available = availableSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((order: any) => !order.driverId) as Order[];
      // Sort locally
      available = available.sort((a: any, b: any) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
      setAvailableOrders(available);

      // Fetch my orders (accepted by this driver) - simplified
      const myQuery = query(
        collection(db, 'orders'),
        where('driverId', '==', userId),
        limit(20)
      );
      const mySnapshot = await getDocs(myQuery);
      let my = mySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
      // Sort locally
      my = my.sort((a: any, b: any) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
      setMyOrders(my);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchStats = async (userId: string) => {
    if (!db) return;
    
    try {
      // Get driver earnings from user document
      const driverDoc = await getDoc(doc(db, 'drivers', userId));
      if (driverDoc.exists()) {
        const data = driverDoc.data();
        setStats({
          todayEarnings: data.todayEarnings || 0,
          todayCompleted: data.todayCompleted || 0,
          weekEarnings: data.weekEarnings || 0,
          rating: data.rating || 5.0,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const acceptOrder = async (orderId: string) => {
    if (!auth?.currentUser || !db) return;
    
    setActionLoading(orderId);
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        driverId: auth.currentUser.uid,
        status: 'picking_up',
        acceptedAt: new Date().toISOString(),
      });
      
      // Refresh orders
      await fetchOrders(auth.currentUser.uid);
      alert('接單成功！');
    } catch (error) {
      console.error('Error accepting order:', error);
      alert('接單失敗，請再試過');
    } finally {
      setActionLoading(null);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    if (!auth?.currentUser || !db) return;
    
    setActionLoading(orderId);
    try {
      const orderDoc = await getDoc(doc(db, 'orders', orderId));
      const orderData = orderDoc.data();
      const fee = orderData?.fee || 25;
      
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });

      // Update driver earnings
      if (newStatus === 'delivered') {
        const driverDoc = await getDoc(doc(db, 'drivers', auth.currentUser.uid));
        const currentData = driverDoc.exists() ? driverDoc.data() : {};
        
        await updateDoc(doc(db, 'drivers', auth.currentUser.uid), {
          todayEarnings: (currentData.todayEarnings || 0) + fee,
          todayCompleted: (currentData.todayCompleted || 0) + 1,
          weekEarnings: (currentData.weekEarnings || 0) + fee,
        });
      }
      
      // Refresh orders and stats
      await fetchOrders(auth.currentUser.uid);
      await fetchStats(auth.currentUser.uid);
    } catch (error) {
      console.error('Error updating order:', error);
      alert('更新失敗，請再試過');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '待確認';
      case 'confirmed': return '已確認';
      case 'preparing': return '準備中';
      case 'ready_for_pickup': return '待取餐';
      case 'picking_up': return '取餐中';
      case 'delivering': return '配送中';
      case 'delivered': return '已完成';
      case 'cancelled': return '已取消';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-purple-100 text-purple-800';
      case 'ready_for_pickup': return 'bg-green-100 text-green-800';
      case 'picking_up': return 'bg-orange-100 text-orange-800';
      case 'delivering': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
      {/* Welcome Header */}
      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-xl md:text-2xl font-bold">
              司機控制台
            </h2>
            <p className="text-gray-600 text-sm mt-1">{profile?.email || user?.email}</p>
          </div>
          <div className="text-sm text-gray-500">
            已登入為司機
          </div>
        </div>
      </div>

      {/* KYC Button */}
      <Link
        href="/driver/kyc"
        className="block w-full bg-purple-600 text-white py-3 px-4 rounded-xl font-medium text-center hover:bg-purple-700 mb-6"
      >
        認證資料
      </Link>

      {/* Stats - 2x2 on mobile */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
          <div className="text-sm text-gray-600 mb-1">今日收入</div>
          <div className="text-xl md:text-3xl font-bold text-green-600">HK${stats.todayEarnings}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
          <div className="text-sm text-gray-600 mb-1">今日完成</div>
          <div className="text-xl md:text-3xl font-bold text-blue-600">{stats.todayCompleted}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
          <div className="text-sm text-gray-600 mb-1">本週收入</div>
          <div className="text-xl md:text-3xl font-bold text-green-600">HK${stats.weekEarnings}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
          <div className="text-sm text-gray-600 mb-1">評分</div>
          <div className="text-xl md:text-3xl font-bold text-yellow-600">{stats.rating.toFixed(1)}</div>
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
          可搶訂單 ({availableOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('my')}
          className={`flex-1 px-3 md:px-6 py-2.5 md:py-3 rounded-lg font-medium text-sm md:text-base ${
            activeTab === 'my' 
              ? 'bg-blue-600 text-white' 
              : 'bg-white text-gray-600 hover:bg-gray-50 border'
          }`}
        >
          我的訂單 ({myOrders.length})
        </button>
      </div>

      {/* Orders List */}
      {activeTab === 'available' ? (
        availableOrders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 md:p-12 text-center">
            <div className="text-3xl md:text-4xl mb-3 md:mb-4">EMPTY</div>
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
                    <div className="text-xl md:text-2xl font-bold text-green-600">HK${order.fee || 25}</div>
                    <div className="text-sm text-gray-500">{order.distance || 2}km</div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3 md:p-4 mb-3 md:mb-4">
                  <div className="flex items-start gap-2 md:gap-3">
                    <div className="text-green-600 mt-0.5">地</div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs md:text-sm text-gray-500">取餐地點</div>
                      <div className="text-sm md:text-base truncate">{order.pickupAddress}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 md:gap-3 mt-2 md:mt-3">
                    <Home className="w-4 h-4 text-red-600"/>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs md:text-sm text-gray-500">送餐地址</div>
                      <div className="text-sm md:text-base truncate">{order.deliveryAddress}</div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => acceptOrder(order.id)}
                  disabled={actionLoading === order.id}
                  className="w-full bg-green-600 text-white py-2.5 md:py-3 rounded-lg hover:bg-green-700 font-medium text-sm md:text-base disabled:opacity-50"
                >
                  {actionLoading === order.id ? '處理中...' : '搶單'}
                </button>
              </div>
            ))}
          </div>
        )
      ) : (
        myOrders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 md:p-12 text-center">
            <FileText className="w-10 h-10"/>
            <h3 className="text-base md:text-lg font-semibold mb-2">暫時未有進行中既訂單</h3>
            <p className="text-gray-500 text-sm md:text-base">搶單後會顯示呢度</p>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {myOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl shadow-sm p-4 md:p-6">
                <div className="flex justify-between items-start mb-3 md:mb-4">
                  <div>
                    <div className="font-bold text-base md:text-lg">{order.orderNumber || order.id}</div>
                    <div className="text-gray-600 text-sm md:text-base">{order.merchantName}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl md:text-2xl font-bold text-green-600">HK${order.fee || 25}</div>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3 md:p-4 mb-3 md:mb-4">
                  <div className="flex items-start gap-2 md:gap-3">
                    <div className="text-green-600 mt-0.5">地</div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs md:text-sm text-gray-500">取餐地點</div>
                      <div className="text-sm md:text-base truncate">{order.pickupAddress}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 md:gap-3 mt-2 md:mt-3">
                    <Home className="w-4 h-4 text-red-600"/>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs md:text-sm text-gray-500">送餐地址</div>
                      <div className="text-sm md:text-base truncate">{order.deliveryAddress}</div>
                    </div>
                  </div>
                  {order.customerPhone && (
                    <div className="mt-2 text-sm">
                      電話: {order.customerPhone}
                    </div>
                  )}
                </div>

                {/* Action buttons based on status */}
                <div className="flex gap-2">
                  {order.status === 'picking_up' && (
                    <button 
                      onClick={() => updateOrderStatus(order.id, 'delivering')}
                      disabled={actionLoading === order.id}
                      className="flex-1 bg-blue-600 text-white py-2.5 md:py-3 rounded-lg hover:bg-blue-700 font-medium text-sm md:text-base disabled:opacity-50"
                    >
                      {actionLoading === order.id ? '處理中...' : '開始配送'}
                    </button>
                  )}
                  {order.status === 'delivering' && (
                    <button 
                      onClick={() => updateOrderStatus(order.id, 'delivered')}
                      disabled={actionLoading === order.id}
                      className="flex-1 bg-green-600 text-white py-2.5 md:py-3 rounded-lg hover:bg-green-700 font-medium text-sm md:text-base disabled:opacity-50"
                    >
                      {actionLoading === order.id ? '處理中...' : '完成配送 ✓'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
