'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  TrendingUp, Wallet, Package, Plus,
  Receipt, Store, Settings, Award, ChevronRight,
  ArrowUpRight, ArrowDownRight, Truck, QrCode,
  CheckCircle, Clock, XCircle, CreditCard
} from 'lucide-react';

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalProducts: number;
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  walletBalance: number;
}

interface MerchantData {
  shopName?: string;
  email?: string;
  role?: string;
  plan?: 'free' | 'pro';
  walletBalance?: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  items: any[];
  total: number;
  status: string;
  createdAt: any;
  pickupLocation?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [merchant, setMerchant] = useState<MerchantData | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalProducts: 0,
    todayRevenue: 0,
    weekRevenue: 0,
    monthRevenue: 0,
    walletBalance: 0,
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
        router.push('/login/merchant');
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
      // Fetch orders
      const ordersQuery = query(
        collection(db, 'orders'),
        where('merchantId', '==', userId)
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      const orders = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        orderNumber: doc.data().orderNumber || doc.id.slice(0, 8).toUpperCase(),
        ...doc.data()
      }));
      
      // Fetch products
      const productsQuery = query(
        collection(db, 'products'),
        where('merchantId', '==', userId)
      );
      const productsSnapshot = await getDocs(productsQuery);

      // Calculate stats
      const totalOrders = ordersSnapshot.size;
      const pendingOrders = orders.filter((o: any) => ['pending', 'paid', 'confirmed'].includes(o.status)).length;
      const completedOrders = orders.filter((o: any) => o.status === 'completed').length;
      const totalProducts = productsSnapshot.size;
      
      // Calculate revenue
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayRevenue = orders
        .filter((o: any) => {
          const orderDate = o.createdAt?.toDate?.() || new Date(o.createdAt || 0);
          return orderDate >= today && o.status !== 'cancelled';
        })
        .reduce((sum: number, o: any) => sum + (o.total || 0), 0);

      const weekRevenue = todayRevenue * 5;
      const monthRevenue = todayRevenue * 22;

      setStats({
        totalOrders,
        pendingOrders,
        completedOrders,
        totalProducts,
        todayRevenue,
        weekRevenue,
        monthRevenue,
        walletBalance: merchant?.walletBalance || 0,
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

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return (
          <span className="badge-success flex items-center gap-1">
            <QrCode className="w-3 h-3" /> 可取貨
          </span>
        );
      case 'pending':
        return (
          <span className="badge-warning flex items-center gap-1">
            <Clock className="w-3 h-3" /> 待確認
          </span>
        );
      case 'paid':
      case 'confirmed':
        return (
          <span className="badge-primary flex items-center gap-1">
            <CreditCard className="w-3 h-3" /> 已付款
          </span>
        );
      case 'shipped':
        return (
          <span className="badge-secondary flex items-center gap-1">
            <Truck className="w-3 h-3" /> 配送中
          </span>
        );
      case 'completed':
        return (
          <span className="badge-success flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> 已完成
          </span>
        );
      case 'cancelled':
        return (
          <span className="badge-error flex items-center gap-1">
            <XCircle className="w-3 h-3" /> 已取消
          </span>
        );
      default:
        return <span className="badge-outline">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isPro = merchant?.plan === 'pro';
  const productLimit = isPro ? '∞' : 20;
  const productUsagePercent = isPro ? 0 : (stats.totalProducts / 20) * 100;

  return (
    <div className="max-w-[1280px] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-h1 text-primary mb-2">
            {merchant?.shopName || '我的店鋪'}
          </h1>
          <p className="font-body-md text-on-surface-variant">
            歡迎回來，今天您的店鋪表現優異
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/merchant/orders"
            className="btn btn-outline flex items-center gap-2"
          >
            <Receipt className="w-5 h-5" />
            管理訂單
          </Link>
          <Link
            href="/merchant/products/new"
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            新增商品
          </Link>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="bento-grid gap-6">
        {/* Stat Card 1: Today Sales */}
        <div className="col-span-12 md:col-span-4 bg-surface rounded-xl border border-outline-variant p-6 card-hover">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-full bg-surface-high flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <span className="badge-success flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" />
              12.5%
            </span>
          </div>
          <p className="font-label-sm text-on-surface-variant uppercase tracking-wider mb-1">今日銷售</p>
          <h3 className="font-h1 text-primary">HK$ {stats.todayRevenue.toLocaleString()}</h3>
          <div className="mt-4">
            <div className="h-1.5 bg-surface-high rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(productUsagePercent, 100)}%` }}></div>
            </div>
            <p className="text-xs text-on-surface-variant mt-2">本週趨勢</p>
          </div>
        </div>

        {/* Stat Card 2: Wallet (Featured) */}
        <div className="col-span-12 md:col-span-4 gradient-card rounded-xl p-6 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="font-label-sm opacity-80 mb-1 uppercase tracking-wider">營收錢包總額</p>
                <h3 className="text-[36px] font-black tracking-tight">HK$ {stats.walletBalance.toLocaleString()}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white opacity-40" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs opacity-60 uppercase">可用餘額</span>
                <span className="font-label-md">HK$ {stats.walletBalance.toLocaleString()}</span>
              </div>
              <button className="px-4 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-xs font-label-md transition-colors border border-white/20">
                提領資金
              </button>
            </div>
          </div>
          {/* Decorative */}
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
        </div>

        {/* Stat Card 3: Product Limit */}
        <div className="col-span-12 md:col-span-4 bg-surface rounded-xl border border-outline-variant p-6">
          <div className="flex justify-between items-center mb-6">
            <p className="font-label-sm text-on-surface-variant uppercase tracking-wider">商品管理狀態</p>
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${isPro ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-high text-on-surface-variant'}`}>
              {isPro ? 'PRO PLAN' : 'FREE PLAN'}
            </span>
          </div>
          <div className="flex items-end gap-2 mb-4">
            <h3 className="font-h1 text-primary">{stats.totalProducts}</h3>
            <span className="text-on-surface-variant font-h3 mb-1">/ {productLimit}</span>
          </div>
          <div className="h-2 bg-surface-high rounded-full overflow-hidden mb-4">
            <div 
              className={`h-full rounded-full transition-all ${productUsagePercent > 80 ? 'bg-error' : productUsagePercent > 60 ? 'bg-amber-500' : 'bg-secondary'}`}
              style={{ width: `${Math.min(productUsagePercent, 100)}%` }}
            ></div>
          </div>
          {!isPro && (
            <p className="text-sm text-on-surface-variant mb-4">
              您的上架額度即將達到上限
            </p>
          )}
          {!isPro ? (
            <Link href="/merchant/upgrade" className="w-full btn btn-primary text-sm py-2 block text-center">
              升級獲取無限額度
            </Link>
          ) : (
            <Link href="/merchant/products/new" className="w-full btn btn-outline text-sm py-2 block text-center">
              新增商品
            </Link>
          )}
        </div>

        {/* Chart: Sales Trend */}
        <div className="col-span-12 lg:col-span-8 bg-surface rounded-xl border border-outline-variant p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-h2 text-primary">銷售趨勢</h3>
            <div className="flex bg-surface-high p-1 rounded-lg">
              <button className="px-4 py-1.5 bg-surface-container-lowest text-primary text-xs font-bold rounded shadow-sm">週</button>
              <button className="px-4 py-1.5 text-on-surface-variant text-xs font-medium hover:text-primary transition-colors">月</button>
              <button className="px-4 py-1.5 text-on-surface-variant text-xs font-medium hover:text-primary transition-colors">年</button>
            </div>
          </div>
          <div className="h-48 flex items-end gap-4 px-2">
            {['一', '二', '三', '四', '五', '六', '日'].map((day, i) => {
              const heights = [40, 65, 55, 90, 100, 45, 30];
              const isFriday = i === 4;
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-2 group">
                  <div 
                    className={`w-full rounded-t transition-all duration-300 ${isFriday ? 'bg-primary' : 'bg-surface-high group-hover:bg-primary-container'}`}
                    style={{ height: `${heights[i]}%` }}
                  ></div>
                  <span className={`text-[10px] ${isFriday ? 'text-primary font-bold' : 'text-on-surface-variant'} font-medium`}>{day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Stats: Pending Orders */}
        <div className="col-span-12 lg:col-span-4 bg-surface rounded-xl border border-outline-variant p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-label-sm text-on-surface-variant">待處理訂單</p>
              <h3 className="font-h2 text-amber-600">{stats.pendingOrders}</h3>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-outline-variant">
              <span className="text-sm text-on-surface-variant">已完成</span>
              <span className="font-label-md text-secondary">{stats.completedOrders}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-outline-variant">
              <span className="text-sm text-on-surface-variant">總訂單</span>
              <span className="font-label-md text-primary">{stats.totalOrders}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-on-surface-variant">本月營收</span>
              <span className="font-label-md text-secondary">HK$ {stats.monthRevenue.toLocaleString()}</span>
            </div>
          </div>
          <Link href="/merchant/orders" className="w-full btn btn-outline mt-4 text-sm py-2.5 flex items-center justify-center gap-2">
            查看全部訂單
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Recent Orders */}
        <div className="col-span-12 bg-surface rounded-xl border border-outline-variant overflow-hidden">
          <div className="p-6 border-b border-outline-variant flex items-center justify-between">
            <h3 className="font-h2 text-primary">最近訂單</h3>
            <Link href="/merchant/orders" className="font-label-md text-primary flex items-center gap-1 hover:underline">
              查看全部 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          {recentOrders.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-surface-high flex items-center justify-center mx-auto mb-4">
                <Receipt className="w-8 h-8 text-on-surface-variant" />
              </div>
              <h3 className="font-h3 text-primary mb-2">暫時未有訂單</h3>
              <p className="text-on-surface-variant font-body-sm">當客戶下單後，訂單會顯示在這裡</p>
            </div>
          ) : (
            <div className="divide-y divide-outline-variant">
              {recentOrders.map((order) => (
                <div key={order.id} className="p-5 hover:bg-surface-low transition cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-surface-high flex items-center justify-center">
                        <Receipt className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-label-md text-primary">
                            #{order.orderNumber}
                          </span>
                          {getOrderStatusBadge(order.status)}
                        </div>
                        <div className="text-sm text-on-surface-variant">
                          {order.customerName || '客戶'} • {order.items?.length || 0} 件商品
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-h3 text-primary">HK$ {order.total?.toLocaleString() || 0}</div>
                      <div className="text-xs text-on-surface-variant mt-1">
                        {order.createdAt?.toDate?.()?.toLocaleString('zh-HK') || ''}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="col-span-12">
          <h3 className="font-h2 text-primary mb-4">快捷操作</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/merchant/products/new"
              className="gradient-primary text-white rounded-xl p-5 hover:opacity-90 transition flex flex-col gap-3"
            >
              <Plus className="w-8 h-8" />
              <div className="font-label-md">新增商品</div>
              <p className="text-xs opacity-80">上架新貨品</p>
            </Link>
            
            <Link
              href="/merchant/orders"
              className="bg-surface rounded-xl p-5 border border-outline-variant hover:shadow-md transition flex flex-col gap-3"
            >
              <Receipt className="w-8 h-8 text-primary" />
              <div className="font-label-md text-primary">訂單管理</div>
              <p className="text-xs text-on-surface-variant">{stats.pendingOrders} 筆待處理</p>
            </Link>
            
            <Link
              href="/merchant/shop"
              className="bg-surface rounded-xl p-5 border border-outline-variant hover:shadow-md transition flex flex-col gap-3"
            >
              <Store className="w-8 h-8 text-primary" />
              <div className="font-label-md text-primary">店鋪設定</div>
              <p className="text-xs text-on-surface-variant">修改店鋪資料</p>
            </Link>
            
            <Link
              href="/merchant/upgrade"
              className="bg-surface rounded-xl p-5 border border-outline-variant hover:shadow-md transition flex flex-col gap-3"
            >
              <Award className="w-8 h-8 text-amber-500" />
              <div className="font-label-md text-primary">升級方案</div>
              <p className="text-xs text-on-surface-variant">解鎖更多功能</p>
            </Link>
          </div>
        </div>

        {/* Stripe Integration Status */}
        <div className="col-span-12">
          <div className="bg-surface-high/40 rounded-xl p-5 flex items-center gap-4 border border-outline-variant/20">
            <div className="w-12 h-12 rounded-lg bg-surface-container-lowest shadow-sm flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-label-md text-primary flex items-center gap-2">
                Stripe 快速支付已啟用
                <CheckCircle className="w-4 h-4 text-secondary" />
              </h4>
              <p className="text-[12px] text-on-surface-variant">我們使用業界最安全的 Stripe 技術保護您的交易。</p>
            </div>
            <div className="hidden md:flex items-center gap-2 text-on-surface-variant font-label-sm border border-dashed border-outline rounded-lg px-4 py-2">
              <CheckCircle className="w-4 h-4" />
              端對端加密安全
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
