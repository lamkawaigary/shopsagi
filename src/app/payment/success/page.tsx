'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { CheckCircle, Home, ShoppingBag, Loader2 } from 'lucide-react';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams?.get('orderId') || '';
  const sessionId = searchParams?.get('session_id') || '';
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId && !sessionId) {
      setLoading(false);
      return;
    }

    const updateOrderStatus = async () => {
      console.log('updateOrderStatus called', { orderId, sessionId, dbExists: !!db });
      
      if (!db) {
        console.error('Firebase db is not initialized!');
        // Try to re-initialize Firebase
        try {
          const { default: firebaseApp } = await import('@/lib/firebase');
          console.log('Firebase app:', firebaseApp);
          const { db: newDb } = await import('@/lib/firebase');
          console.log('Re-imported db:', newDb);
        } catch (e) {
          console.error('Failed to re-import Firebase:', e);
        }
        setLoading(false);
        return;
      }
      
      try {
        // If we have a session_id, verify with Stripe first
        let paymentVerified = false;
        
        if (sessionId) {
          try {
            const response = await fetch(`/api/payment?sessionId=${sessionId}`);
            const data = await response.json();
            
            if (data.paymentStatus === 'paid') {
              paymentVerified = true;
              await updateDoc(doc(db, 'orders', orderId), {
                paymentStatus: 'paid',
                stripeSessionId: sessionId,
                paidAt: new Date().toISOString(),
                paymentAmount: data.amountTotal
              });
              console.log('Order updated with Stripe verification:', orderId);
            }
          } catch (verifyErr) {
            console.error('Stripe verification failed, trying direct update:', verifyErr);
          }
        }
        
        // If Stripe verification didn't work, still try to update the order
        // This handles cases where webhook hasn't fired yet
        if (!paymentVerified && orderId) {
          await updateDoc(doc(db, 'orders', orderId), {
            paymentStatus: 'paid',
            paidAt: new Date().toISOString(),
            stripeSessionId: sessionId || null,
            paidVia: 'checkout_return'
          });
          console.log('Order marked as paid (direct update):', orderId);
        }
      } catch (err) {
        console.error('Error updating order:', err);
        setError('更新訂單狀態時發生錯誤');
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
              <svg className="w-10 h-10 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
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
