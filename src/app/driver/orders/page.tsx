'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Search, Scan, Calendar, Package } from 'lucide-react';
import dynamic from 'next/dynamic';

const BarcodeScanner = dynamic(() => import('@/components/BarcodeScanner'), { ssr: false });

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
  deliveredAt?: any;
}

export default function DriverOrdersPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [showScanner, setShowScanner] = useState(false);

  // Stats
  const todayOrders = orders.filter(o => {
    const orderDate = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  });
  const todayEarnings = todayOrders.reduce((sum, o) => sum + (o.fee || 0), 0);

  // Filter by date
  const filterByDate = (orders: Order[]) => {
    if (dateFilter === 'all') return orders;
    const now = new Date();
    return orders.filter(o => {
      const orderDate = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
      if (dateFilter === 'today') {
        return orderDate.toDateString() === now.toDateString();
      }
      return true;
    });
  };

  const handleBarcodeScan = (barcode: string) => {
    setShowScanner(false);
    setSearchTerm(barcode);
  };

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
          if (userData.role !== 'driver') {
            router.push('/register?role=driver');
            return;
          }
        }
        await fetchOrders(currentUser.uid);
      } else {
        router.push('/driver/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const fetchOrders = async (userId: string) => {
    if (!db) return;
    
    try {
      const q = query(
        collection(db, 'orders'),
        where('driverId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const ordersData: Order[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          orderNumber: data.orderNumber || '',
          merchantName: data.merchantName || '',
          pickupAddress: data.pickupAddress || '',
          deliveryAddress: data.deliveryAddress || '',
          customerPhone: data.customerPhone || '',
          distance: data.distance || 0,
          fee: data.fee || 25,
          status: data.status || '',
          driverId: data.driverId || '',
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt || 0),
          deliveredAt: data.deliveredAt?.toDate?.() || new Date(data.deliveredAt || 0),
        };
      });
      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching orders:', error);
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

  let filtered = orders.filter(order => {
    if (filter === 'completed') return order.status === 'delivered';
    if (filter === 'cancelled') return order.status === 'cancelled';
    if (filter !== 'all') return order.status === filter;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchOrder = (order.orderNumber || order.id || '').toLowerCase().includes(search);
      const matchMerchant = (order.merchantName || '').toLowerCase().includes(search);
      if (!matchOrder && !matchMerchant) return false;
    }
    return true;
  });
  filtered = filterByDate(filtered);
  const filteredOrders = filtered;

  const completedOrders = orders.filter(o => o.status === 'delivered');
  const totalEarnings = completedOrders.reduce((sum, o) => sum + (o.fee || 25), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="pb-20 md:pb-8">
      {/* Stats Summary */}
      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-600">總訂單</div>
            <div className="text-2xl font-bold">{orders.length}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">已完成</div>
            <div className="text-2xl font-bold text-green-600">{completedOrders.length}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">今日收入</div>
            <div className="text-2xl font-bold text-green-600">HK${totalEarnings}</div>
          </div>
        </div>
      </div>

      {/* Search & Date Filter */}
      <div className="bg-white rounded-xl shadow-sm mb-4 p-4 flex flex-col md:flex-row gap-3">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            placeholder="搜尋訂單編號或商戶名..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => setShowScanner(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg"
          >
            <Scan className="w-5 h-5" />
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setDateFilter('all')}
            className={`px-3 py-2 rounded-lg text-sm ${dateFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
          >
            全部
          </button>
          <button
            onClick={() => setDateFilter('today')}
            className={`px-3 py-2 rounded-lg text-sm ${dateFilter === 'today' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
          >
            今日
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium ${
            filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border'
          }`}
        >
          全部 ({orders.length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-lg font-medium ${
            filter === 'completed' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 border'
          }`}
        >
          已完成 ({completedOrders.length})
        </button>
        <button
          onClick={() => setFilter('cancelled')}
          className={`px-4 py-2 rounded-lg font-medium ${
            filter === 'cancelled' ? 'bg-red-600 text-white' : 'bg-white text-gray-600 border'
          }`}
        >
          已取消
        </button>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="text-3xl mb-3">訂單</div>
          <h3 className="text-lg font-semibold mb-2">暫時未有訂單</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-bold">{order.orderNumber || order.id.slice(0, 8)}</div>
                  <div className="text-sm text-gray-600">{order.merchantName}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">HK${order.fee || 25}</div>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </div>
              </div>
              
              <div className="text-sm text-gray-500 mb-2">
                地點: {order.pickupAddress} →  {order.deliveryAddress}
              </div>
              
              <div className="text-xs text-gray-400">
                {formatDate(order.createdAt)}
                {order.status === 'delivered' && order.deliveredAt && (
                  <span> → 完成於 {formatDate(order.deliveredAt)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {showScanner && <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setShowScanner(false)} />}
    </div>
  );
}
