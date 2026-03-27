'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { CheckCircle, CreditCard, Loader2, Plus } from 'lucide-react';

interface SavedCard {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

const PAYMENT_METHODS = [
  { id: 'card', name: '信用卡/扣账卡', icon: '💳', color: 'bg-blue-50 border-blue-200' },
  { id: 'alipay', name: 'AlipayHK', icon: '🔵', color: 'bg-green-50 border-green-200' },
  { id: 'wechat_pay', name: 'WeChat Pay HK', icon: '🟢', color: 'bg-emerald-50 border-emerald-200' },
];

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams?.get('orderId') || '';
  
  const [user, setUser] = useState<User | null>(null);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState<string>('card');
  const [processing, setProcessing] = useState(false);
  
  // Saved cards state
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) return;
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Get or create Stripe customer
        try {
          const customerRes = await fetch('/api/customer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: currentUser.uid,
              email: currentUser.email,
              name: currentUser.displayName || '',
            })
          });
          const customerData = await customerRes.json();
          if (customerData.customerId) {
            setCustomerId(customerData.customerId);
            
            // Get saved payment methods
            const pmRes = await fetch(`/api/payment-methods?customerId=${customerData.customerId}`);
            const pmData = await pmRes.json();
            if (pmData.paymentMethods && pmData.paymentMethods.length > 0) {
              setSavedCards(pmData.paymentMethods);
              setSelectedCardId(pmData.paymentMethods[0].id);
            }
          }
        } catch (err) {
          console.error('Error getting customer:', err);
        }
      }
    });
    
    return () => unsubscribe();
  }, []);

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
    if (!orderId) return;

    setProcessing(true);
    try {
      // Determine payment parameters
      const paymentParams: any = {
        amount: order?.total || 0,
        orderId,
        orderNumber: order?.orderNumber,
        customerEmail: order?.customerEmail || order?.email || user?.email,
      };

      // If we have a customer ID, include it
      if (customerId) {
        paymentParams.customerId = customerId;
      }

      // If using a saved card (only works with card type)
      if (selectedCardId && selectedMethod === 'card') {
        paymentParams.paymentMethodId = selectedCardId;
      }

      const response = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentParams)
      });

      const data = await response.json();
      
      if (data.success && data.paymentUrl) {
        // Redirect to Stripe Checkout
        window.location.href = data.paymentUrl;
      } else {
        throw new Error(data.error || 'Payment failed');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      const errorMessage = error.message || 'Unknown error';
      alert(`付款失敗: ${errorMessage}\n\n請截圖此錯誤聯繫客服`);
      setProcessing(false);
    }
  };

  const getCardBrandIcon = (brand: string) => {
    const brands: Record<string, string> = {
      visa: '💳',
      mastercard: '💳',
      amex: '💳',
      jcb: '💳',
    };
    return brands[brand] || '💳';
  };

  const getCardBrandName = (brand: string) => {
    const names: Record<string, string> = {
      visa: 'Visa',
      mastercard: 'Mastercard',
      amex: 'American Express',
      jcb: 'JCB',
    };
    return names[brand] || brand;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
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

        {/* Order Summary */}
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

        {/* Saved Cards Section */}
        {savedCards.length > 0 && selectedMethod === 'card' && (
          <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
            <h2 className="font-semibold mb-4">已保存的信用卡</h2>
            
            <div className="space-y-3">
              {savedCards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => setSelectedCardId(card.id)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition ${
                    selectedCardId === card.id 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{getCardBrandIcon(card.brand)}</div>
                      <div>
                        <div className="font-medium">
                          {getCardBrandName(card.brand)} •••• {card.last4}
                        </div>
                        <div className="text-sm text-gray-500">
                          有效期: {card.expMonth}/{card.expYear}
                        </div>
                      </div>
                    </div>
                    {selectedCardId === card.id && (
                      <CheckCircle className="w-5 h-5 text-purple-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Payment Methods */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-semibold mb-4">付款方式</h2>
          
          <div className="space-y-3">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method.id}
                onClick={() => {
                  setSelectedMethod(method.id);
                  if (method.id !== 'card') {
                    setSelectedCardId(null);
                  }
                }}
                className={`w-full p-4 rounded-xl border-2 text-left transition ${
                  selectedMethod === method.id 
                    ? 'border-purple-500 bg-purple-50' 
                    : `${method.color} border-transparent hover:border-gray-300`
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{method.icon}</div>
                    <div className="font-medium">{method.name}</div>
                  </div>
                  {selectedMethod === method.id && (
                    <CheckCircle className="w-5 h-5 text-purple-600" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Pay Button */}
        <button
          onClick={handlePayment}
          disabled={processing}
          className={`w-full py-4 rounded-xl font-bold text-lg mt-6 transition flex items-center justify-center gap-2 ${
            !processing
              ? 'bg-purple-600 text-white hover:bg-purple-700' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {processing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              跳轉到Stripe...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              確認付款 HK${order.total?.toFixed(2) || '0.00'}
            </>
          )}
        </button>

        <div className="flex items-center justify-center gap-2 mt-4 text-gray-500 text-sm">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
          </svg>
          <span>SSL加密保障</span>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
