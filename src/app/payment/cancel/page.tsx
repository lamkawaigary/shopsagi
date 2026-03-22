'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Home, ShoppingBag } from 'lucide-react';

function CancelContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams?.get('orderId') || '';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">😕</span>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            付款已取消
          </h1>
          <p className="text-gray-600 mb-6">
            你既付款已經被取消。你可以隨時再嚟完成訂單。
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => router.push(`/payment/checkout?orderId=${orderId}`)}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-5 h-5" />
              繼續付款
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

export default function PaymentCancelPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
      </div>
    }>
      <CancelContent />
    </Suspense>
  );
}
