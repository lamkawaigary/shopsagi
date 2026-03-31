'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { CheckCircle, Home, ShoppingBag, Loader2, AlertTriangle } from 'lucide-react';

type PaymentSessionResponse = {
  paymentStatus?: string;
  amountTotal?: number | null;
  orderId?: string | null;
  sessionId?: string;
};

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams?.get('orderId') || '';
  const sessionId = searchParams?.get('session_id') || '';
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!sessionId) {
      setError('缺少付款 Session，無法確認付款狀態');
      setLoading(false);
      return;
    }

    const updateOrderStatus = async () => {
      console.log('updateOrderStatus called', { orderId, sessionId, dbExists: !!db });
      
      if (!db) {
        setError('Firebase 未初始化，暫時未能更新訂單狀態');
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`/api/payment?sessionId=${sessionId}`);
        const data = (await response.json()) as PaymentSessionResponse;

        if (!response.ok) {
          throw new Error('無法向 Stripe 驗證付款結果');
        }

        if (data.paymentStatus !== 'paid') {
          setError('付款尚未完成或驗證失敗，請稍後於訂單頁面再確認');
          setLoading(false);
          return;
        }

        const verifiedOrderId = data.orderId || orderId;
        if (!verifiedOrderId) {
          setError('找不到對應訂單，無法更新付款狀態');
          setLoading(false);
          return;
        }

        await updateDoc(doc(db, 'orders', verifiedOrderId), {
          paymentStatus: 'paid',
          stripeSessionId: data.sessionId || sessionId,
          paidAt: new Date().toISOString(),
          paymentAmount: data.amountTotal ?? null,
          paidVia: 'checkout_return_verified'
        });
      } catch (err) {
        console.error('Error updating order:', err);
        setError('更新訂單狀態時發生錯誤，請到訂單頁面重整確認');
      }
      
      setLoading(false);
    };

    updateOrderStatus();
  }, [orderId, sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">正在確認付款...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-yellow-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              更新訂單時發生錯誤
            </h1>
            <p className="text-gray-600 mb-6">
              {error}
            </p>
            
            <button
              onClick={() => router.push('/customer/orders')}
              className="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-5 h-5" />
              查看訂單
            </button>
          </div>
        </div>
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
        <Loader2 className="w-12 h-12 animate-spin text-green-600" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
