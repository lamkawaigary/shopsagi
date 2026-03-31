'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit, doc, getDoc } from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileText, Settings, Shield } from 'lucide-react';

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  totalProducts: number;
  todayRevenue: number;
}

interface UserProfile {
  shopName?: string;
  email?: string;
  role?: string;
}

type MerchantOrderDoc = {
  id: string;
  status?: string;
  total?: number;
  createdAt?: { toDate?: () => Date } | string | Date;
  orderNumber?: string;
  customerName?: string;
  items?: unknown[];
  merchantId?: string | null;
  merchantIds?: string[];
};

function extractItemMerchantIds(items?: unknown[]) {
  if (!Array.isArray(items)) return [];
  const ids = new Set<string>();
  items.forEach((item) => {
    if (item && typeof item === 'object') {
      const merchantId = (item as { merchantId?: unknown }).merchantId;
      if (typeof merchantId === 'string' && merchantId) {
        ids.add(merchantId);
      }
    }
  });
  return Array.from(ids);
}

type DisplayOrder = {
  id: string;
  orderNumber?: string;
  customerName?: string;
  items?: unknown[];
  total?: number;
  status?: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    todayRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<DisplayOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(() => !auth);

  const fetchDashboardData = async (userId: string) => {
    if (!db) return;

    try {
      // Fetch orders for this merchant. Avoid composite index dependency
      // by sorting client-side after query.
      const normalizedOrdersQuery = query(
        collection(db, 'orders'),
        where('merchantId', '==', userId),
        limit(50)
      );
      const byMerchantIdsQuery = query(
        collection(db, 'orders'),
        where('merchantIds', 'array-contains', userId),
        limit(50)
      );
      // Backward compatibility for older test documents if present.
      const legacyByItemsMerchantIdsQuery = query(
        collection(db, 'orders'),
        where('itemsMerchantIds', 'array-contains', userId),
        limit(50)
      );

      const [normalizedSnapshot, byMerchantIdsSnapshot, legacySnapshot] = await Promise.all([
        getDocs(normalizedOrdersQuery),
        getDocs(byMerchantIdsQuery),
        getDocs(legacyByItemsMerchantIdsQuery),
      ]);

      const merged = new Map<string, MerchantOrderDoc>();
      [normalizedSnapshot, byMerchantIdsSnapshot, legacySnapshot].forEach((snapshot) => {
        snapshot.docs.forEach((docSnap) => {
          merged.set(docSnap.id, {
            id: docSnap.id,
            ...(docSnap.data() as Omit<MerchantOrderDoc, 'id'>),
          });
        });
      });

      const mergedOrders = Array.from(merged.values());
      const filteredOrders = mergedOrders.filter((order) => {
        if (order.merchantId === userId) return true;
        if (Array.isArray(order.merchantIds) && order.merchantIds.includes(userId)) return true;
        return extractItemMerchantIds(order.items).includes(userId);
      });
      const sortedOrders = [...filteredOrders].sort((a, b) => {
        const dateA = a.createdAt && typeof a.createdAt === 'object' && 'toDate' in a.createdAt
          ? a.createdAt.toDate?.() || new Date(0)
          : new Date((a.createdAt as string | Date | undefined) || 0);
        const dateB = b.createdAt && typeof b.createdAt === 'object' && 'toDate' in b.createdAt
          ? b.createdAt.toDate?.() || new Date(0)
          : new Date((b.createdAt as string | Date | undefined) || 0);
        return dateB.getTime() - dateA.getTime();
      });
      setRecentOrders(sortedOrders.slice(0, 5));

      // Calculate stats based on merchant-filtered records (not just recent 5)
      const totalOrders = filteredOrders.length;
      const pendingOrders = filteredOrders.filter((o) => o.status === 'pending').length;
      const todayRevenue = filteredOrders
        .filter((o) => {
          const orderDate =
            o.createdAt && typeof o.createdAt === 'object' && 'toDate' in o.createdAt
              ? o.createdAt.toDate?.() || new Date(0)
              : new Date((o.createdAt as string | Date | undefined) || 0);
          const today = new Date();
          return orderDate.toDateString() === today.toDateString();
        })
        .reduce((sum, o) => sum + (typeof o.total === 'number' ? o.total : 0), 0);

      // Fetch products count
      const productsQuery = query(
        collection(db, 'products'),
        where('merchantId', '==', userId)
      );
      const productsSnapshot = await getDocs(productsQuery);

      setStats({
        totalOrders,
        pendingOrders,
        totalProducts: productsSnapshot.size,
        todayRevenue,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Show demo data if no data in database yet
      setStats({
        totalOrders: 0,
        pendingOrders: 0,
        totalProducts: 0,
        todayRevenue: 0,
      });
    }
  };

  useEffect(() => {
    if (!auth) return;
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch user profile from Firestore
        if (db) {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            setProfile(userDoc.data() as UserProfile);
          }
        }
        await fetchDashboardData(currentUser.uid);
      } else {
        // Not logged in, redirect to login
        router.push('/register');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'preparing':
        return 'bg-purple-100 text-purple-800';
      case 'delivering':
        return 'bg-orange-100 text-orange-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  return (
    <div>
      {/* Welcome Header with Shop Name */}
      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-xl md:text-2xl font-bold">
              {profile?.shopName ? `商戶: ${profile.shopName}` : '商戶控制台'}
            </h2>
            <p className="text-gray-600 text-sm mt-1">{profile?.email || user?.email}</p>
          </div>
          <Link
            href="/merchant/shop"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
          >
            設定
          </Link>
        </div>
      </div>

      <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">控制台</h2>

      {/* Stats Grid - 2x2 on mobile */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
          <div className="text-sm text-gray-600 mb-1">總訂單</div>
          <div className="text-2xl md:text-3xl font-bold text-gray-900">{stats.totalOrders}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
          <div className="text-sm text-gray-600 mb-1">待處理</div>
          <div className="text-2xl md:text-3xl font-bold text-yellow-600">{stats.pendingOrders}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
          <div className="text-sm text-gray-600 mb-1">商品</div>
          <div className="text-2xl md:text-3xl font-bold text-blue-600">{stats.totalProducts}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
          <div className="text-sm text-gray-600 mb-1">今日營收</div>
          <div className="text-2xl md:text-3xl font-bold text-green-600">HK${stats.todayRevenue}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 md:grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-8">
        <Link
          href="/merchant/products/new"
          className="bg-blue-600 text-white rounded-xl p-3 md:p-6 hover:bg-blue-700 transition text-center"
        >
          <div className="text-xl md:text-2xl mb-1 md:mb-2">➕</div>
          <div className="font-semibold text-sm md:text-base">新增商品</div>
        </Link>
        <Link
          href="/merchant/orders"
          className="bg-white border rounded-xl p-3 md:p-6 hover:bg-gray-50 transition text-center"
        >
          <div className="text-xl md:text-2xl mb-1 md:mb-2"><FileText className="w-6 h-6 mx-auto text-blue-600" /></div>
          <div className="font-semibold text-gray-900 text-sm md:text-base">查看訂單</div>
        </Link>
        <Link
          href="/merchant/kyc"
          className="bg-white border rounded-xl p-3 md:p-6 hover:bg-gray-50 transition text-center"
        >
          <div className="text-xl md:text-2xl mb-1 md:mb-2"><Shield className="w-6 h-6 mx-auto text-purple-600" /></div>
          <div className="font-semibold text-gray-900 text-sm md:text-base">認證</div>
        </Link>
        <Link
          href="/merchant/shop"
          className="bg-white border rounded-xl p-3 md:p-6 hover:bg-gray-50 transition text-center"
        >
          <div className="text-xl md:text-2xl mb-1 md:mb-2"><Settings className="w-6 h-6 mx-auto text-gray-600" /></div>
          <div className="font-semibold text-gray-900 text-sm md:text-base">店鋪設定</div>
        </Link>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 md:p-6 border-b">
          <h3 className="text-base md:text-lg font-semibold">最近訂單</h3>
        </div>
        {recentOrders.length === 0 ? (
          <div className="p-6 md:p-6 text-center text-gray-500">
            <p>暫時未有訂單</p>
            <p className="text-sm mt-2">當客戶下單後，訂單會顯示呢度</p>
          </div>
        ) : (
          <div className="divide-y">
            {recentOrders.map((order) => (
              <div key={order.id} className="p-3 md:p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{order.orderNumber || order.id}</div>
                  <div className="text-sm text-gray-500">
                    {order.customerName || '客戶'} • {order.items?.length || 0} 件
                  </div>
                </div>
                <div className="text-right ml-3">
                  <div className="font-semibold">HK${order.total || 0}</div>
                  <span className={`text-xs px-2 py-0.5 md:py-1 rounded-full ${getStatusColor(order.status || 'pending')}`}>
                    {getStatusText(order.status || 'pending')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
