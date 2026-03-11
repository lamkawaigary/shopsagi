'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, orderBy } from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

const STATUS_FLOW = ['pending', 'confirmed', 'preparing', 'delivering', 'completed'];

export default function OrdersPage() {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchOrders(currentUser.uid);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchOrders = async (userId: string) => {
    if (!db) return;
    
    try {
      const q = query(
        collection(db, 'orders'),
        where('merchantId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const orderList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(orderList);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    }
  };

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

  const filteredOrders = orders.filter(o => {
    if (filter === 'all') return true;
    return o.status === filter;
  });

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
          <div className="text-4xl mb-4">📋</div>
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
                    {order.createdAt?.toDate?.().toLocaleString('zh-HK') || ''}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
                  {getStatusText(order.status)}
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
                {order.items?.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between py-1">
                    <span>{item.name} x {item.quantity}</span>
                    <span>HK${item.price * item.quantity}</span>
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
                        const nextStatus = getNextStatus(order.status);
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
    </div>
  );
}
