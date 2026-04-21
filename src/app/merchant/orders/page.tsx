'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, orderBy } from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import Link from 'next/link';
import { 
  Search, Scan, Calendar, Package, ChevronRight, 
  Clock, CheckCircle, XCircle, ArrowRight, Filter
} from 'lucide-react';
import dynamic from 'next/dynamic';

const BarcodeScanner = dynamic(() => import('@/components/BarcodeScanner'), { ssr: false });

interface Order {
  id: string;
  orderNumber: string;
  pickupCode?: string;
  customerName: string;
  customerPhone: string;
  items: any[];
  subtotal: number;
  platformFee: number;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: any;
  notes?: string;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: any }> = {
  pending: { label: '待確認', bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
  confirmed: { label: '已確認', bg: 'bg-blue-100', text: 'text-blue-700', icon: CheckCircle },
  completed: { label: '已完成', bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
  cancelled: { label: '已取消', bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
};

const NEXT_STATUS: Record<string, { next: string; label: string }> = {
  pending: { next: 'confirmed', label: '確認訂單' },
  confirmed: { next: 'completed', label: '完成訂單' },
};

export default function OrdersPage() {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [showScanner, setShowScanner] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Stats
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    today: orders.filter(o => {
      const d = o.createdAt?.toDate?.() || new Date(o.createdAt);
      return d.toDateString() === new Date().toDateString();
    }).length,
    todayRevenue: orders
      .filter(o => {
        const d = o.createdAt?.toDate?.() || new Date(o.createdAt);
        return d.toDateString() === new Date().toDateString();
      })
      .reduce((sum, o) => sum + (o.total || 0), 0),
  };

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
      })) as Order[];
      
      setOrders(orderList);
      setFilteredOrders(orderList);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    }
  };

  // Filter orders
  useEffect(() => {
    let result = [...orders];
    
    // Status filter
    if (filter !== 'all') {
      result = result.filter(o => o.status === filter);
    }
    
    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      result = result.filter(o => {
        const d = o.createdAt?.toDate?.() || new Date(o.createdAt);
        if (dateFilter === 'today') return d.toDateString() === now.toDateString();
        if (dateFilter === 'week') {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return d >= weekAgo;
        }
        return true;
      });
    }
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(o => 
        (o.orderNumber || '').toLowerCase().includes(term) ||
        (o.pickupCode || '').toLowerCase().includes(term) ||
        (o.customerName || '').toLowerCase().includes(term)
      );
    }
    
    setFilteredOrders(result);
  }, [orders, filter, dateFilter, searchTerm]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    if (!db) return;
    
    try {
      await updateDoc(doc(db, 'orders', orderId), { 
        status: newStatus,
        updatedAt: new Date()
      });
      setOrders(orders.map(o => 
        o.id === orderId ? { ...o, status: newStatus } : o
      ));
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const handleBarcodeScan = (barcode: string) => {
    setShowScanner(false);
    setSearchTerm(barcode);
  };

  const formatTime = (date: any) => {
    if (!date) return '';
    const d = date.toDate?.() || new Date(date);
    return d.toLocaleString('zh-HK', { 
      month: 'numeric', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">訂單管理</h1>
          <p className="text-sm text-gray-500 mt-1">{stats.total} 筆訂單</p>
        </div>
        <button
          onClick={() => setShowScanner(true)}
          className="p-3 bg-purple-600 text-white rounded-2xl shadow-lg hover:bg-purple-700 transition"
        >
          <Scan className="w-5 h-5" />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-xl">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">總訂單</div>
        </div>
        
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-100 rounded-xl">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
          <div className="text-sm text-gray-500">待處理</div>
        </div>
        
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.today}</div>
          <div className="text-sm text-gray-500">今日訂單</div>
        </div>
        
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-xl">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-green-600">HK${stats.todayRevenue}</div>
          <div className="text-sm text-gray-500">今日營收</div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm p-3 flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜尋訂單編號、取貨碼或客戶名稱..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-purple-100 text-base"
          />
        </div>
      </div>

      {/* Date Filter */}
      <div className="flex gap-2">
        {[
          { id: 'all', label: '全部' },
          { id: 'today', label: '今日' },
          { id: 'week', label: '7日內' },
        ].map((d) => (
          <button
            key={d.id}
            onClick={() => setDateFilter(d.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              dateFilter === d.id
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white text-gray-600 shadow-sm hover:bg-gray-50'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setFilter('all')}
          className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            filter === 'all'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-white text-gray-600 shadow-sm'
          }`}
        >
          全部
        </button>
        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === key
                ? `${config.bg} ${config.text} shadow-md`
                : 'bg-white text-gray-600 shadow-sm'
            }`}
          >
            {config.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <Package className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="font-semibold text-lg mb-2">暫時未有訂單</h3>
          <p className="text-gray-500 text-sm">當客戶下單後會顯示呢度</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const StatusIcon = statusConfig.icon;
            const nextAction = NEXT_STATUS[order.status];
            
            return (
              <div 
                key={order.id} 
                className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition cursor-pointer"
                onClick={() => setSelectedOrder(order)}
              >
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{order.orderNumber || order.id.slice(0, 8)}</span>
                        {order.pickupCode && (
                          <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-mono">
                            #{order.pickupCode}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {formatTime(order.createdAt)}
                      </div>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                      <StatusIcon className="w-4 h-4 inline mr-1" />
                      {statusConfig.label}
                    </span>
                  </div>

                  {/* Customer */}
                  <div className="bg-gray-50 rounded-xl p-3 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{order.customerName || '客戶'}</div>
                        {order.customerPhone && (
                          <div className="text-sm text-gray-500">{order.customerPhone}</div>
                        )}
                      </div>
                      {order.paymentStatus === 'paid' && (
                        <span className="badge badge-success">已付款</span>
                      )}
                    </div>
                  </div>

                  {/* Items Preview */}
                  <div className="space-y-2 mb-4">
                    {order.items?.slice(0, 2).map((item: any, i: number) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-gray-600">{item.name} x {item.quantity}</span>
                        <span className="font-medium">HK${item.price * item.quantity}</span>
                      </div>
                    ))}
                    {order.items?.length > 2 && (
                      <div className="text-sm text-gray-400">
                        +{order.items.length - 2} 件商品
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="text-xl font-bold text-gray-900">
                      HK${order.total}
                    </div>
                    {nextAction && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateOrderStatus(order.id, nextAction.next);
                        }}
                        className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-purple-700 transition"
                      >
                        {nextAction.label}
                      </button>
                    )}
                    {!nextAction && (
                      <span className="text-gray-400 text-sm flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" /> 已完成
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-t-3xl md:rounded-3xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">訂單詳情</h2>
                  <p className="text-sm text-gray-500">{selectedOrder.orderNumber}</p>
                </div>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Pickup Code */}
              {selectedOrder.pickupCode && (
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-4 text-white text-center mb-6">
                  <div className="text-sm opacity-80 mb-1">取貨編碼</div>
                  <div className="text-3xl font-bold tracking-wider">{selectedOrder.pickupCode}</div>
                </div>
              )}

              {/* Status */}
              <div className="flex items-center justify-between mb-6">
                <span className="text-gray-500">狀態</span>
                <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                  STATUS_CONFIG[selectedOrder.status]?.bg || 'bg-gray-100'
                } ${STATUS_CONFIG[selectedOrder.status]?.text || 'text-gray-700'}`}>
                  {STATUS_CONFIG[selectedOrder.status]?.label || selectedOrder.status}
                </span>
              </div>

              {/* Customer */}
              <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                <div className="font-semibold mb-2">客戶資料</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">姓名</span>
                    <span className="font-medium">{selectedOrder.customerName || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">電話</span>
                    <span className="font-medium">{selectedOrder.customerPhone || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="mb-6">
                <div className="font-semibold mb-3">訂單內容</div>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm">
                      <div>
                        <span className="text-gray-700">{item.name}</span>
                        <span className="text-gray-400"> x {item.quantity}</span>
                      </div>
                      <span className="font-medium">HK${(item.price * item.quantity).toFixed(0)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-3 mt-3 flex justify-between font-semibold">
                  <span>總計</span>
                  <span className="text-xl text-purple-600">HK${selectedOrder.total}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                {NEXT_STATUS[selectedOrder.status] && (
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, NEXT_STATUS[selectedOrder.status].next)}
                    className="flex-1 py-3 bg-purple-600 text-white rounded-2xl font-semibold hover:bg-purple-700 transition"
                  >
                    {NEXT_STATUS[selectedOrder.status].label}
                  </button>
                )}
                {selectedOrder.status === 'pending' && (
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled')}
                    className="py-3 px-6 bg-red-100 text-red-700 rounded-2xl font-semibold hover:bg-red-200 transition"
                  >
                    取消訂單
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showScanner && (
        <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setShowScanner(false)} />
      )}
    </div>
  );
}
