'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { XCircle, Home, RefreshCw, ArrowLeft } from 'lucide-react';

function FailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams?.get('orderId') || '';
  const errorCode = searchParams?.get('errorCode') || '';
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const updateOrderStatus = async () => {
      if (!db) return;
      
      try {
        await updateDoc(doc(db, 'orders', orderId), {
          paymentStatus: 'failed',
          paymentError: errorCode || 'Payment failed'
        });
      } catch (error) {
        console.error('Error updating order:', error);
      }
      
      setLoading(false);
    };

    updateOrderStatus();
  }, [orderId, errorCode]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            付款失敗
          </h1>
          <p className="text-gray-600 mb-6">
            很抱歉，你既付款未能成功處理。請再試一次。
          </p>
          
          {errorCode && (
            <div className="bg-red-50 rounded-lg p-3 mb-6">
              <p className="text-sm text-red-600">錯誤碼: {errorCode}</p>
            </div>
          )}
          
          <div className="space-y-3">
            <button
              onClick={() => router.push(`/payment/checkout?orderId=${orderId}`)}
              className="w-full py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              重新付款
            </button>
            
            <button
              onClick={() => router.push('/customer')}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              返回商店
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    }>
      <FailContent />
    </Suspense>
  );
}
