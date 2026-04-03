'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { MapPin, Package, Truck, Check, Clock } from 'lucide-react';

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  lat?: number;
  lng?: number;
  status: string;
  items: any[];
}

const STATUS_STEPS = [
  { key: 'pending', label: '已下單', icon: Package },
  { key: 'confirmed', label: '已確認', icon: Check },
  { key: 'preparing', label: '準備中', icon: Package },
  { key: 'delivering', label: '送貨中', icon: Truck },
  { key: 'completed', label: '已完成', icon: Check },
];

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth!, async (currentUser) => {
      setUser(currentUser);
      if (currentUser && orderId) {
        await fetchOrder(orderId);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [orderId]);

  const fetchOrder = async (id: string) => {
    if (!db) return;
    const orderDoc = await getDoc(doc(db, 'orders', id));
    if (orderDoc.exists()) {
      setOrder({ id: orderDoc.id, ...orderDoc.data() } as Order);
    }
  };

  const getStatusIndex = (status: string) => {
    return STATUS_STEPS.findIndex(s => s.key === status);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">訂單唔存在</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">訂單追蹤</h1>
      
      {/* Status Timeline */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="font-semibold mb-4">訂單狀態</h2>
        
        <div className="flex items-center justify-between">
          {STATUS_STEPS.map((step, index) => {
            const currentIndex = getStatusIndex(order.status);
            const isCompleted = index <= currentIndex;
            const isCurrent = index === currentIndex;
            const Icon = step.icon;
            
            return (
              <div key={step.key} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
                } ${isCurrent ? 'ring-4 ring-purple-100' : ''}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-xs mt-1 ${isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
        
        {/* Progress Line */}
        <div className="relative h-1 bg-gray-200 mt-2 mb-6">
          <div 
            className="absolute h-full bg-green-500 transition-all"
            style={{ 
              width: `${(getStatusIndex(order.status) / (STATUS_STEPS.length - 1)) * 100}%` 
            }}
          />
        </div>
      </div>

      {/* Order Details */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="font-semibold mb-4">訂單詳情</h2>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-500">訂單編號</span>
            <span className="font-medium">{order.id.slice(0, 8)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-500">客戶名</span>
            <span>{order.customerName}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-500">電話</span>
            <span>{order.customerPhone}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-500">送貨地址</span>
            <span>{order.deliveryAddress}</span>
          </div>
          
          {order.lat && order.lng && (
            <div className="flex items-center gap-2 text-green-600">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">座標: {order.lat.toFixed(4)}, {order.lng.toFixed(4)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-semibold mb-4">商品列表</h2>
        
        <div className="space-y-2">
          {order.items?.map((item, index) => (
            <div key={index} className="flex justify-between">
              <span>{item.name} x {item.quantity}</span>
              <span>HK${item.price * item.quantity}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}