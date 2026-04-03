'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { MapPin, Package, Truck, Check, Clock, Navigation } from 'lucide-react';

interface Order {
  id: string;
  status: string;
  deliveryAddress: string;
  driverLocation?: { lat: number; lng: number; updatedAt: string };
}

export default function DeliveryTrackingPage() {
  const params = useParams();
  const orderId = params?.id as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId || !db) return;

    // Real-time listener for order updates
    const unsubscribe = onSnapshot(doc(db, 'orders', orderId), (doc) => {
      if (doc.exists()) {
        setOrder({ id: doc.id, ...doc.data() } as Order);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [orderId]);

  const getStatusSteps = () => [
    { key: 'pending', label: '已下單' },
    { key: 'confirmed', label: '商戶確認中' },
    { key: 'preparing', label: '準備送貨' },
    { key: 'delivering', label: '送貨中' },
    { key: 'completed', label: '已送達' },
  ];

  const getCurrentStep = () => getStatusSteps().findIndex(s => s.key === order?.status);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!order) {
    return <div className="text-center py-12">訂單不存在</div>;
  }

  const currentStep = getCurrentStep();

  return (
    <div className="max-w-md mx-auto p-4">
      {/* Header */}
      <div className="bg-purple-600 text-white p-6 rounded-2xl mb-6">
        <h1 className="text-xl font-bold mb-2">送貨追蹤</h1>
        <p className="text-purple-200">訂單 #{order.id?.slice(0, 8)}</p>
      </div>

      {/* Status Steps */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        {getStatusSteps().map((step, index) => (
          <div key={step.key} className="flex items-center gap-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              index < currentStep ? 'bg-green-500 text-white' : 
              index === currentStep ? 'bg-purple-600 text-white' : 'bg-gray-200'
            }`}>
              {index < currentStep ? <Check className="w-4 h-4" /> : index === currentStep ? <Truck className="w-4 h-4" /> : index + 1}
            </div>
            <div className="flex-1 py-3">
              <p className={index <= currentStep ? 'font-medium' : 'text-gray-400'}>
                {step.label}
              </p>
            </div>
            {index < currentStep && (
              <Check className="w-5 h-5 text-green-500" />
            )}
          </div>
        ))}
      </div>

      {/* Driver Location */}
      {order.driverLocation && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Navigation className="w-5 h-5 text-purple-600" />
            <h2 className="font-semibold">送貨員位置</h2>
          </div>
          <p className="text-sm text-gray-500">
            最後更新: {new Date(order.driverLocation.updatedAt).toLocaleString('zh-HK')}
          </p>
          <p className="text-lg font-medium">
            {order.driverLocation.lat.toFixed(5)}, {order.driverLocation.lng.toFixed(5)}
          </p>
        </div>
      )}

      {/* Delivery Address */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-3">
          <MapPin className="w-5 h-5 text-purple-600" />
          <h2 className="font-semibold">送貨地址</h2>
        </div>
        <p>{order.deliveryAddress}</p>
      </div>
    </div>
  );
}