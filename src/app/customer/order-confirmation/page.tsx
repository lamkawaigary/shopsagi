'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, MapPin, Phone, Clock, QrCode, Copy, ChevronRight, Package } from 'lucide-react';

interface OrderData {
  orderId: string;
  orderNumber: string;
  pickupCode: string;
  merchantName: string;
  merchantAddress: string;
  merchantPhone: string;
  items: any[];
  subtotal: number;
  total: number;
  customerName: string;
  customerPhone: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
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

  const handleCopyCode = () => {
    if (order?.pickupCode) {
      navigator.clipboard.writeText(order.pickupCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center max-w-sm mx-auto">
          <div className="text-6xl mb-4">🤔</div>
          <h2 className="text-xl font-bold mb-2">搵唔到訂單</h2>
          <p className="text-gray-500 mb-6">似乎未有訂單記錄</p>
          <Link
            href="/customer"
            className="btn btn-primary w-full"
          >
            去購物
          </Link>
        </div>
      </div>
    );
  }

  const isPaid = order.paymentStatus === 'paid';

  return (
    <div className="min-h-screen gradient-bg">
      {/* Success Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 pt-8 pb-12">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold mb-2">
            {isPaid ? '付款成功！' : '訂單已確認！'}
          </h1>
          <p className="text-white/80">
            {isPaid ? '請保留取貨二維碼，到店出示領取商品' : '請到店出示取貨編碼，完成付款後取貨'}
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-6">
        {/* QR Code Card */}
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <QrCode className="w-10 h-10 text-gray-400" />
            </div>
            <div className="text-sm text-gray-500 mb-1">取貨編碼</div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl font-bold tracking-wider text-purple-600">
                {order.pickupCode || order.orderNumber?.slice(-6) || '------'}
              </span>
              <button 
                onClick={handleCopyCode}
                className="p-2 text-gray-400 hover:text-purple-600 transition"
              >
                {copied ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Status */}
          <div className={`text-center py-3 rounded-xl ${isPaid ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
            <div className="font-semibold">
              {isPaid ? '✓ 貨物已預留' : '⏳ 等待到店付款'}
            </div>
          </div>
        </div>

        {/* Pickup Info */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-6">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5 text-purple-600" />
              取貨地點
            </h2>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <div className="font-semibold text-lg">{order.merchantName || '商戶'}</div>
              {order.merchantAddress && (
                <div className="text-gray-500 text-sm mt-1 flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {order.merchantAddress}
                </div>
              )}
            </div>
            {order.merchantPhone && (
              <a 
                href={`tel:${order.merchantPhone}`}
                className="flex items-center gap-2 text-purple-600 font-medium"
              >
                <Phone className="w-4 h-4" />
                聯絡商戶
              </a>
            )}
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-6">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-600" />
              訂單詳情
            </h2>
          </div>
          <div className="p-5">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-500">訂單編號</span>
              <span className="font-medium">{order.orderNumber || order.orderId?.slice(0, 8)}</span>
            </div>
            
            {/* Items */}
            <div className="space-y-3 py-4 border-t border-gray-100">
              {order.items?.map((item: any, index: number) => (
                <div key={index} className="flex justify-between text-sm">
                  <div className="flex-1">
                    <span className="text-gray-700">{item.name}</span>
                    <span className="text-gray-400"> x {item.quantity}</span>
                  </div>
                  <span className="font-medium">HK${(item.price * item.quantity).toFixed(0)}</span>
                </div>
              ))}
            </div>
            
            {/* Total */}
            <div className="flex justify-between pt-4 border-t border-gray-100">
              <span className="font-semibold text-lg">總計</span>
              <span className="font-bold text-2xl text-purple-600">HK${order.total}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-8">
          <Link
            href="/customer/orders"
            className="btn btn-primary flex-1 py-4"
          >
            查看訂單 <ChevronRight className="w-5 h-5" />
          </Link>
          <Link
            href="/customer"
            className="btn btn-outline flex-1 py-4"
          >
            繼續購物
          </Link>
        </div>
      </div>
    </div>
  );
}
