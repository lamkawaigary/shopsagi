'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  FileText, Settings, Crown, Plus, ShoppingBag, TrendingUp, 
  Clock, ChevronRight, ArrowUpRight, ArrowDownRight, Star
} from 'lucide-react';

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  totalProducts: number;
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
}

interface MerchantData {
  shopName?: string;
  email?: string;
  role?: string;
  plan?: 'free' | 'pro';
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  items: any[];
  total: number;
  status: string;
  createdAt: any;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [merchant, setMerchant] = useState<MerchantData | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    todayRevenue: 0,
    weekRevenue: 0,
    monthRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchMerchantData(currentUser.uid);
        await fetchDashboardData(currentUser.uid);
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const fetchMerchantData = async (userId: string) => {
    if (!db) return;
    try {
      const q = query(collection(db, 'merchants'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setMerchant(snapshot.docs[0].data() as MerchantData);
      }
    } catch (error) {
      console.error('Error fetching merchant data:', error);
    }
  };

  const fetchDashboardData = async (userId: string) => {
    if (!db) return;
    
    try {
      const ordersQuery = query(
        collection(db, 'orders'),
        where('merchantId', '==', userId)
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      const orders = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      const productsQuery = query(
        collection(db, 'products'),
        where('merchantId', '==', userId)
      );
      const productsSnapshot = await getDocs(productsQuery);

      // Calculate stats
      const totalOrders = ordersSnapshot.size;
      const pendingOrders = orders.filter((o: any) => o.status === 'pending').length;
      const totalProducts = productsSnapshot.size;
      
      // Today's revenue
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayRevenue = orders
        .filter((o: any) => {
          const orderDate = o.createdAt?.toDate?.() || new Date(o.createdAt || 0);
          return orderDate >= today;
        })
        .reduce((sum: number, o: any) => sum + (o.total || 0), 0);

      setStats({
        totalOrders,
        pendingOrders,
        totalProducts,
        todayRevenue,
        weekRevenue: todayRevenue * 7, // Simplified
        monthRevenue: todayRevenue * 30, // Simplified
      });

      // Recent orders (last 5)
      const sortedOrders = orders.sort((a: any, b: any) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      }).slice(0, 5);
      
      setRecentOrders(sortedOrders as RecentOrder[]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: '待確認', bg: 'bg-amber-100', text: 'text-amber-700' };
      case 'paid':
      case 'confirmed':
        return { label: '已確認', bg: 'bg-blue-100', text: 'text-blue-700' };
      case 'completed':
        return { label: '已完成', bg: 'bg-green-100', text: 'text-green-700' };
      case 'cancelled':
        return { label: '已取消', bg: 'bg-red-100', text: 'text-red-700' };
      default:
        return { label: status, bg: 'bg-gray-100', text: 'text-gray-700' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const isPro = merchant?.plan === 'pro';

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {merchant?.shopName || '我的店鋪'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">{merchant?.email || user?.email}</p>
        </div>
        <Link
          href="/merchant/shop"
          className="p-3 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
        >
          <Settings className="w-5 h-5" />
        </Link>
      </div>

      {/* Plan Banner */}
      {!isPro ? (
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <div className="font-semibold text-lg">免費版方案</div>
                <div className="text-sm text-white/80">
                  {stats.totalProducts} / 20 件商品
                </div>
              </div>
            </div>
            <Link
              href="/merchant/upgrade"
              className="bg-white text-purple-600 px-5 py-2.5 rounded-xl font-semibold hover:bg-purple-50 transition flex items-center gap-2"
            >
              <Crown className="w-4 h-4" /> 升級 Pro
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="font-semibold text-lg">Pro 方案</div>
              <div className="text-sm text-white/80">無限商品上架</div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-purple-100 rounded-xl">
              <ShoppingBag className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-xs text-gray-400">總計</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalOrders}</div>
          <div className="text-sm text-gray-500">總訂單</div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-amber-100 rounded-xl">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-xs text-gray-400">待處理</span>
          </div>
          <div className="text-2xl font-bold text-amber-600">{stats.pendingOrders}</div>
          <div className="text-sm text-gray-500">待處理訂單</div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs text-gray-400">商品</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalProducts}</div>
          <div className="text-sm text-gray-500">已上架商品</div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-green-100 rounded-xl">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-xs text-gray-400">今日</span>
          </div>
          <div className="text-2xl font-bold text-green-600">HK${stats.todayRevenue}</div>
          <div className="text-sm text-gray-500">今日營收</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          href="/merchant/products/new"
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl p-5 hover:opacity-90 transition"
        >
          <Plus className="w-6 h-6 mb-3" />
          <div className="font-semibold">新增商品</div>
          <div className="text-sm text-white/80">上架新貨品</div>
        </Link>
        
        <Link
          href="/merchant/orders"
          className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition"
        >
          <FileText className="w-6 h-6 mb-3 text-blue-600" />
          <div className="font-semibold text-gray-900">查看訂單</div>
          <div className="text-sm text-gray-500">管理訂單</div>
        </Link>
        
        <Link
          href="/merchant/shop"
          className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition"
        >
          <Settings className="w-6 h-6 mb-3 text-gray-600" />
          <div className="font-semibold text-gray-900">店鋪設定</div>
          <div className="text-sm text-gray-500">修改資料</div>
        </Link>
        
        <Link
          href="/merchant/upgrade"
          className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition"
        >
          <Crown className="w-6 h-6 mb-3 text-amber-500" />
          <div className="font-semibold text-gray-900">升級方案</div>
          <div className="text-sm text-gray-500">解鎖更多功能</div>
        </Link>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-lg">最近訂單</h2>
          <Link 
            href="/merchant/orders" 
            className="text-purple-600 text-sm font-medium flex items-center gap-1 hover:underline"
          >
            查看全部 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        
        {recentOrders.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-5xl mb-4">📋</div>
            <h3 className="font-semibold text-lg mb-2">暫時未有訂單</h3>
            <p className="text-gray-500">當客戶下單後，訂單會顯示呢度</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentOrders.map((order) => {
              const statusConfig = getStatusConfig(order.status);
              return (
                <div key={order.id} className="p-5 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-gray-900">
                          {order.orderNumber || order.id.slice(0, 8)}
                        </span>
                        <span className={`text-xs px-2.5 py-1 rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
                          {statusConfig.label}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {order.customerName || '客戶'} • {order.items?.length || 0} 件商品
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="font-semibold text-gray-900">HK${order.total || 0}</div>
                      <div className="text-xs text-gray-400">
                        {order.createdAt?.toDate?.()?.toLocaleTimeString('zh-HK') || ''}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
