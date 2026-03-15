'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface OrderData {
  orderId: string;
  orderNumber: string;
  merchantName: string;
  items: any[];
  total: number;
  customerName: string;
  deliveryAddress: string;
  createdAt: string;
}

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get order data from sessionStorage (set during checkout)
    const orderData = sessionStorage.getItem('lastOrder');
    if (orderData) {
      try {
        setOrder(JSON.parse(orderData));
      } catch (e) {
        console.error('Failed to parse order data', e);
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">🤔</div>
        <h2 className="text-xl font-bold mb-2">搵唔到訂單</h2>
        <p className="text-gray-500 mb-6">似乎未有訂單記錄</p>
        <Link
          href="/customer"
          className="inline-block px-6 py-3 bg-purple-600 text-white rounded-full hover:bg-purple-700"
        >
          去shopping
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-green-600 mb-2">訂單已確認！</h1>
        <p className="text-gray-600">多謝你既訂單，我哋會盡快安排配送</p>
      </div>

      {/* Order Info Card */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center pb-4 border-b mb-4">
          <div>
            <div className="text-sm text-gray-500">訂單編號</div>
            <div className="text-xl font-bold">{order.orderNumber}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">總金額</div>
            <div className="text-2xl font-bold text-purple-600">HK${order.total}</div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">商戶</span>
            <span className="font-medium">{order.merchantName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">送貨地址</span>
            <span className="font-medium text-right">{order.deliveryAddress}</span>
          </div>
        </div>

        {/* Order Items */}
        <div className="mt-6 pt-4 border-t">
          <div className="font-semibold mb-3">訂單內容</div>
          <div className="space-y-2">
            {order.items?.map((item: any, index: number) => (
              <div key={index} className="flex justify-between text-sm">
                <span>{item.name} x {item.quantity}</span>
                <span>HK${item.price * item.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="font-semibold mb-4">訂單狀態</div>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <div className="flex-1">
              <div className="font-medium">訂單已確認</div>
              <div className="text-sm text-gray-500">{order.createdAt}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <div className="flex-1">
              <div className="text-gray-400">商戶準備中</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <div className="flex-1">
              <div className="text-gray-400">配送中</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <div className="flex-1">
              <div className="text-gray-400">已送達</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Link
          href="/customer/orders"
          className="flex-1 text-center py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700"
        >
          查看訂單
        </Link>
        <Link
          href="/customer"
          className="flex-1 text-center py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200"
        >
          繼續購物
        </Link>
      </div>
    </div>
  );
}
