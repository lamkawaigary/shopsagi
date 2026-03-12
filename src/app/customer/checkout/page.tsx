'use client';

import { useState } from 'react';
import { useCart } from '@/lib/cart';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    deliveryAddress: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth?.currentUser) {
      alert('請先登入');
      router.push('/customer/login');
      return;
    }

    setLoading(true);
    try {
      // Group items by merchant
      const ordersByMerchant = items.reduce((acc, item) => {
        if (!acc[item.merchantId]) {
          acc[item.merchantId] = {
            merchantId: item.merchantId,
            merchantName: item.merchantName,
            items: [],
            total: 0,
          };
        }
        acc[item.merchantId].items.push(item);
        acc[item.merchantId].total += item.price * item.quantity;
        return acc;
      }, {} as Record<string, any>);

      // Create an order for each merchant
      for (const merchantId of Object.keys(ordersByMerchant)) {
        const order = ordersByMerchant[merchantId];
        await addDoc(collection(db!, 'orders'), {
          orderNumber: `ORD${Date.now()}`,
          customerId: auth.currentUser.uid,
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          deliveryAddress: formData.deliveryAddress,
          notes: formData.notes,
          merchantId: order.merchantId,
          merchantName: order.merchantName,
          items: order.items,
          total: order.total,
          status: 'pending',
          createdAt: serverTimestamp(),
        });
      }

      clearCart();
      alert('訂單已送出！');
      router.push('/customer/orders');
    } catch (error) {
      console.error('Error creating order:', error);
      alert('訂單建立失敗，請再試過');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">🛒</div>
        <h2 className="text-xl font-bold mb-2">購物車係咁</h2>
        <Link href="/customer" className="text-purple-600 hover:underline">
          去shopping
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">結帳</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold mb-4">送貨資料</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                姓名 *
              </label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                電話 *
              </label>
              <input
                type="tel"
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="+852 1234 5678"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                送貨地址 *
              </label>
              <input
                type="text"
                value={formData.deliveryAddress}
                onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="香港中環..."
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                備註
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="例如：送到大堂..."
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold mb-4">訂單內容</h3>
          <div className="space-y-2 text-sm">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span>{item.name} x {item.quantity}</span>
                <span>HK${item.price * item.quantity}</span>
              </div>
            ))}
          </div>
          <div className="border-t mt-4 pt-4 flex justify-between font-bold text-lg">
            <span>總金額：</span>
            <span className="text-purple-600">HK${total}</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold text-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? '處理中...' : '確認訂單'}
        </button>
      </form>
    </div>
  );
}
