'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in (mock for now)
    const userData = localStorage.getItem('shopsagi_admin');
    if (!userData) {
      router.push('/admin/login');
      return;
    }
    setUser(JSON.parse(userData));
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('shopsagi_admin');
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const stats = [
    { label: '總商戶', value: '24', icon: '🏪', color: 'bg-blue-500' },
    { label: '總顧客', value: '1,234', icon: '🛒', color: 'bg-green-500' },
    { label: '總司機', value: '56', icon: '🚚', color: 'bg-orange-500' },
    { label: '總訂單', value: '3,891', icon: '📦', color: 'bg-purple-500' },
  ];

  const recentOrders = [
    { id: 'ORD001', customer: 'John Doe', merchant: '港式奶茶舖', status: 'completed', total: 68 },
    { id: 'ORD002', customer: 'Jane Smith', merchant: '泰式美食', status: 'processing', total: 125 },
    { id: 'ORD003', customer: 'Bob Lee', merchant: '港式奶茶舖', status: 'pending', total: 45 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚙️</span>
            <h1 className="text-xl font-bold">ShopSagi 管理后台</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{user?.email || 'Admin'}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 hover:text-red-700"
            >
              登出
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center text-2xl`}>
                  {stat.icon}
                </div>
                <div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/admin/merchants"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition border-2 border-transparent hover:border-blue-500"
          >
            <div className="text-3xl mb-3">🏪</div>
            <h3 className="font-semibold text-lg mb-1">商戶管理</h3>
            <p className="text-gray-500 text-sm">查看、管理入駐商戶</p>
          </Link>
          <Link
            href="/admin/drivers"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition border-2 border-transparent hover:border-orange-500"
          >
            <div className="text-3xl mb-3">🚚</div>
            <h3 className="font-semibold text-lg mb-1">司機管理</h3>
            <p className="text-gray-500 text-sm">查看、管理配送司機</p>
          </Link>
          <Link
            href="/admin/orders"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition border-2 border-transparent hover:border-purple-500"
          >
            <div className="text-3xl mb-3">📦</div>
            <h3 className="font-semibold text-lg mb-1">訂單管理</h3>
            <p className="text-gray-500 text-sm">查看所有平台訂單</p>
          </Link>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b">
            <h2 className="font-semibold text-lg">最近訂單</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">訂單編號</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">顧客</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">商戶</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">狀態</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">金額</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{order.id}</td>
                    <td className="px-6 py-4">{order.customer}</td>
                    <td className="px-6 py-4">{order.merchant}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        order.status === 'completed' ? 'bg-green-100 text-green-700' :
                        order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {order.status === 'completed' ? '已完成' :
                         order.status === 'processing' ? '處理中' : '待處理'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">HK${order.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
