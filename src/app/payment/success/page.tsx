'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { CheckCircle, Home, ShoppingBag } from 'lucide-react';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams?.get('orderId') || '';
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const updateOrderStatus = async () => {
      if (!db) return;
      
      try {
        // Update order payment status to paid
        await updateDoc(doc(db, 'orders', orderId), {
          paymentStatus: 'paid',
          paidAt: new Date().toISOString()
        });
        console.log('Order marked as paid:', orderId);
      } catch (error) {
        console.error('Error updating order:', error);
      }
      
      setLoading(false);
    };

    updateOrderStatus();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            付款成功！
          </h1>
          <p className="text-gray-600 mb-6">
            多謝你既訂單！我哋會盡快處理。
          </p>
          
          {orderId && (
            <div className="bg-gray-50 rounded-lg p-3 mb-6">
              <p className="text-sm text-gray-500">訂單編號</p>
              <p className="font-medium">{orderId}</p>
            </div>
          )}
          
          <div className="space-y-3">
            <button
              onClick={() => router.push('/customer/orders')}
              className="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-5 h-5" />
              查看訂單
            </button>
            
            <button
              onClick={() => router.push('/customer')}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              返回商店
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
