'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, limit } from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Scan, Calendar, Package } from 'lucide-react';
import dynamic from 'next/dynamic';

const BarcodeScanner = dynamic(() => import('@/components/BarcodeScanner'), { ssr: false });

const STATUS_FLOW = ['pending', 'confirmed', 'preparing', 'delivering', 'completed'];

type MerchantOrderItem = {
  name?: string;
  quantity?: number;
  price?: number;
  merchantId?: string;
};

type MerchantOrderRecord = {
  id: string;
  orderNumber?: string;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  status?: string;
  total?: number;
  createdAt?: { toDate?: () => Date } | string | Date;
  items?: MerchantOrderItem[];
};

type LegacyOrderItem = {
  merchantId?: string;
};

function normalizeMerchantOrderDate(value?: MerchantOrderRecord['createdAt']) {
  if (!value) return new Date(0);
  if (value instanceof Date) return value;
  if (typeof value === 'string') return new Date(value);
  if (typeof value === 'object' && 'toDate' in value) {
    return value.toDate?.() || new Date(0);
  }
  return new Date(0);
}

export default function OrdersPage() {
  const [, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<MerchantOrderRecord[]>([]);
  const [loading, setLoading] = useState(() => Boolean(auth));
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [showScanner, setShowScanner] = useState(false);

  const fetchOrders = async (userId: string) => {
    if (!db) return;
    
    try {
      const byMerchantIdQuery = query(
        collection(db, 'orders'),
        where('merchantId', '==', userId),
        limit(200)
      );
      const byMerchantIdsQuery = query(
        collection(db, 'orders'),
        where('merchantIds', 'array-contains', userId),
        limit(200)
      );
      const [byMerchantIdSnapshot, byMerchantIdsSnapshot, allOrdersSnapshot] = await Promise.all([
        getDocs(byMerchantIdQuery),
        getDocs(byMerchantIdsQuery),
        // Legacy compatibility: old docs may only keep merchant linkage in items[].merchantId.
        getDocs(query(collection(db, 'orders'), limit(400))),
      ]);
      const merged = new Map<string, MerchantOrderRecord>();
      [...byMerchantIdSnapshot.docs, ...byMerchantIdsSnapshot.docs].forEach((docSnap) => {
        merged.set(docSnap.id, { id: docSnap.id, ...(docSnap.data() as Omit<MerchantOrderRecord, 'id'>) });
      });
      allOrdersSnapshot.docs.forEach((docSnap) => {
        if (merged.has(docSnap.id)) return;
        const data = docSnap.data() as Omit<MerchantOrderRecord, 'id'> & { items?: LegacyOrderItem[] };
        const belongsToMerchant = Array.isArray(data.items)
          && data.items.some((item) => item?.merchantId === userId);
        if (belongsToMerchant) {
          merged.set(docSnap.id, { id: docSnap.id, ...(data as Omit<MerchantOrderRecord, 'id'>) });
        }
      });
      const orderList = Array.from(merged.values())
        .sort((a, b) => {
          const aDate = (a as { createdAt?: { toDate?: () => Date } }).createdAt?.toDate?.() || new Date(0);
          const bDate = (b as { createdAt?: { toDate?: () => Date } }).createdAt?.toDate?.() || new Date(0);
          return bDate.getTime() - aDate.getTime();
        });
      setOrders(orderList);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    }
  };

  // Stats
  const todayOrders = orders.filter(o => {
    const orderDate = normalizeMerchantOrderDate(o.createdAt);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  });
  const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const weekOrders = orders.filter(o => {
    const orderDate = normalizeMerchantOrderDate(o.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return orderDate >= weekAgo;
  });
  const weekRevenue = weekOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  // Filter by search term
  const searchOrders = (term: string) => {
    setSearchTerm(term);
  };

  // Filter by date
  const filterByDate = (ordersToFilter: MerchantOrderRecord[]) => {
    if (dateFilter === 'all') return ordersToFilter;
    const now = new Date();
    return ordersToFilter.filter((o) => {
      const orderDate = normalizeMerchantOrderDate(o.createdAt);
      if (dateFilter === 'today') {
        return orderDate.toDateString() === now.toDateString();
      } else if (dateFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return orderDate >= weekAgo;
      }
      return true;
    });
  };

  // Handle barcode scan
  const handleBarcodeScan = (barcode: string) => {
    setShowScanner(false);
    setSearchTerm(barcode);
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

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    if (!db) return;
    await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
    setOrders(orders.map(o => 
      o.id === orderId ? { ...o, status: newStatus } : o
    ));
  };

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

  const getNextStatus = (currentStatus: string) => {
    const currentIndex = STATUS_FLOW.indexOf(currentStatus);
    if (currentIndex === -1 || currentIndex === STATUS_FLOW.length - 1) return null;
    return STATUS_FLOW[currentIndex + 1];
  };

  let filtered = orders.filter(o => {
    if (filter !== 'all' && o.status !== filter) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchOrder = (o.orderNumber || o.id || '').toLowerCase().includes(search);
      const matchCustomer = (o.customerName || '').toLowerCase().includes(search);
      if (!matchOrder && !matchCustomer) return false;
    }
    return true;
  });
  filtered = filterByDate(filtered);
  const filteredOrders = filtered;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">訂單管理</h2>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Calendar className="w-4 h-4" /> 今日訂單
          </div>
          <div className="text-2xl font-bold">{todayOrders.length}</div>
          <div className="text-sm text-green-600">HK${todayRevenue.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Package className="w-4 h-4" /> 7日訂單
          </div>
          <div className="text-2xl font-bold">{weekOrders.length}</div>
          <div className="text-sm text-green-600">HK${weekRevenue.toFixed(2)}</div>
        </div>
      </div>

      {/* Search & Date Filter */}
      <div className="bg-white rounded-xl shadow-sm mb-4 p-4 flex flex-col md:flex-row gap-3">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            placeholder="搜尋訂單編號或客戶名稱..."
            value={searchTerm}
            onChange={(e) => searchOrders(e.target.value)}
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
          <button
            onClick={() => setDateFilter('week')}
            className={`px-3 py-2 rounded-lg text-sm ${dateFilter === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
          >
            7日內
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl shadow-sm mb-6 p-4">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm ${
              filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            全部
          </button>
          {STATUS_FLOW.map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm ${
                filter === status ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {getStatusText(status)}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-4xl mb-4">訂</div>
          <h3 className="text-lg font-semibold mb-2">暫時未有訂單</h3>
          <p className="text-gray-500">當客戶落單後會顯示呢度</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl shadow-sm p-6">
              {/* Order Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="font-bold text-lg">{order.orderNumber || order.id}</div>
                  <div className="text-sm text-gray-500">
                    {normalizeMerchantOrderDate(order.createdAt).toLocaleString('zh-HK')}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(order.status || '')}`}>
                  {getStatusText(order.status || '')}
                </span>
              </div>

              {/* Customer Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">客戶姓名：</span>
                    <span className="font-medium">{order.customerName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">電話：</span>
                    <span className="font-medium">{order.customerPhone || 'N/A'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">送餐地址：</span>
                    <span className="font-medium">{order.deliveryAddress || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="border-t border-b py-4 mb-4">
                <div className="text-sm text-gray-500 mb-2">訂單內容：</div>
                {order.items?.map((item, index: number) => (
                  <div key={index} className="flex justify-between py-1">
                    <span>{item.name} x {item.quantity}</span>
                    <span>HK${(item.price || 0) * (item.quantity || 0)}</span>
                  </div>
                ))}
              </div>

              {/* Total & Actions */}
              <div className="flex justify-between items-center">
                <div className="text-xl font-bold">
                  總金額：<span className="text-green-600">HK${order.total || 0}</span>
                </div>
                <div className="flex gap-2">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'cancelled')}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                    >
                      拒絕訂單
                    </button>
                  )}
                  {order.status !== 'cancelled' && order.status !== 'completed' && (
                    <button
                      onClick={() => {
                        const nextStatus = getNextStatus(order.status || 'pending');
                        if (nextStatus) updateOrderStatus(order.id, nextStatus);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      {order.status === 'pending' && '確認訂單'}
                      {order.status === 'confirmed' && '開始準備'}
                      {order.status === 'preparing' && '準備完成'}
                      {order.status === 'delivering' && '確認送達'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {showScanner && <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setShowScanner(false)} />}
    </div>
  );
}
