'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { CreditCard, Smartphone, Wallet, Check } from 'lucide-react';

const PAYMENT_METHODS = [
  { id: 'VISA', name: 'Visa', icon: '💳', color: 'bg-blue-100 border-blue-300' },
  { id: 'MASTER', name: 'Mastercard', icon: '💳', color: 'bg-orange-100 border-orange-300' },
  { id: 'ALIPAYHK', name: 'AlipayHK', icon: '🟢', color: 'bg-green-100 border-green-300' },
  { id: 'WECHATPAYHK', name: 'WeChat Pay HK', icon: '🟣', color: 'bg-purple-100 border-purple-300' },
  { id: 'PAYME', name: 'PayMe', icon: '🟦', color: 'bg-blue-100 border-blue-300' },
  { id: 'OCTOPUS', name: 'Octopus', icon: '🐙', color: 'bg-red-100 border-red-300' },
];

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams?.get('orderId') || '';
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      if (!db) return;
      const orderDoc = await getDoc(doc(db, 'orders', orderId));
      if (orderDoc.exists()) {
        setOrder({ id: orderDoc.id, ...orderDoc.data() });
      }
      setLoading(false);
    };

    fetchOrder();
  }, [orderId]);

  const handlePayment = async () => {
    if (!selectedMethod || !orderId) return;

    setProcessing(true);
    try {
      const response = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: order?.total || 0,
          orderId,
          orderNumber: order?.orderNumber,
          paymentMethod: selectedMethod
        })
      });

      const data = await response.json();
      
      if (data.success) {
        if (data.paymentUrl) {
          // Redirect to BBMSL payment page
          window.location.href = data.paymentUrl;
        } else {
          // Mock mode - show success
          alert('付款成功！正在跳轉...');
          router.push(`/customer/order-confirmation?orderId=${orderId}`);
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('付款失敗，請重試');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">找不到訂單</p>
          <button onClick={() => router.push('/customer')} className="text-purple-600 hover:underline">
            返回購物
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-center mb-6">選擇付款方式</h1>

        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">訂單編號</span>
            <span className="font-medium">{order.orderNumber || orderId}</span>
          </div>
          <div className="flex justify-between items-center text-lg font-bold">
            <span>總金額</span>
            <span className="text-purple-600">HK${order.total?.toFixed(2) || '0.00'}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-semibold mb-4">付款方式</h2>
          
          <div className="grid grid-cols-2 gap-3">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={`p-4 rounded-xl border-2 text-left transition ${
                  selectedMethod === method.id 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl mb-1">{method.icon}</div>
                    <div className="font-medium text-sm">{method.name}</div>
                  </div>
                  {selectedMethod === method.id && (
                    <Check className="w-5 h-5 text-purple-600" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handlePayment}
          disabled={!selectedMethod || processing}
          className={`w-full py-4 rounded-xl font-bold text-lg mt-6 transition ${
            selectedMethod 
              ? 'bg-purple-600 text-white hover:bg-purple-700' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {processing ? '處理緊...' : `確認付款 HK$${order.total?.toFixed(2) || '0.00'}`}
        </button>

        <p className="text-center text-gray-500 text-sm mt-4">
          🔒 SSL加密保障
        </p>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
