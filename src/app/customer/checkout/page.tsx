'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/lib/cart';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';
import { MapPin, Plus } from 'lucide-react';

interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  address: string;
  district?: string;
  isDefault: boolean;
}

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    deliveryAddress: '',
    notes: '',
  });

  const fetchAddresses = async (userId: string) => {
    if (!db) return;
    const snapshot = await getDocs(collection(db!, 'users', userId, 'addresses'));
    const addrList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Address));
    addrList.sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
    setAddresses(addrList);
    
    const defaultAddr = addrList.find(a => a.isDefault);
    if (defaultAddr) {
      setSelectedAddressId(defaultAddr.id);
      setFormData({
        customerName: defaultAddr.fullName,
        customerPhone: defaultAddr.phone,
        deliveryAddress: defaultAddr.address + (defaultAddr.district ? `, ${defaultAddr.district}` : ''),
        notes: ''
      });
    }
  };

  const handleAddressSelect = (addr: Address) => {
    setSelectedAddressId(addr.id);
    setFormData({
      customerName: addr.fullName,
      customerPhone: addr.phone,
      deliveryAddress: addr.address + (addr.district ? `, ${addr.district}` : ''),
      notes: ''
    });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth!, async (currentUser) => {
      if (currentUser) {
        await fetchAddresses(currentUser.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth?.currentUser) {
      alert('請先登入');
      router.push('/customer/login');
      return;
    }

    if (!formData.customerName || !formData.customerPhone || !formData.deliveryAddress) {
      alert('請填寫完整送貨資料');
      return;
    }

    setLoading(true);

    try {
      const merchantIds = Array.from(
        new Set(
          items
            .map((item) => item.merchantId)
            .filter((id): id is string => Boolean(id))
        )
      );
      const merchantNames = Array.from(
        new Set(
          items
            .map((item) => item.merchantName)
            .filter((name): name is string => Boolean(name))
        )
      );
      const orderNumber = `SG${Date.now().toString().slice(-8)}`;

      // Create order
      const orderData = {
        userId: auth.currentUser.uid,
        customerId: auth.currentUser.uid,
        orderNumber,
        items: items.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          merchantId: item.merchantId,
          merchantName: item.merchantName,
        })),
        merchantIds,
        // Backward-compat for legacy merchant query field name.
        itemsMerchantIds: merchantIds,
        merchantId: merchantIds.length === 1 ? merchantIds[0] : null,
        merchantName: merchantNames.length === 1 ? merchantNames[0] : merchantNames.join(' / '),
        total,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        deliveryAddress: formData.deliveryAddress,
        notes: formData.notes,
        status: 'pending',
        paymentStatus: 'pending',
        createdAt: serverTimestamp(),
      };

      const orderRef = await addDoc(collection(db!, 'orders'), orderData);
      
      // Redirect to payment
      clearCart();
      router.push('/payment/checkout?orderId=' + orderRef.id);
    } catch (error) {
      console.error('Order error:', error);
      alert('建立訂單失敗，請重試');
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">購物車係空既</p>
          <Link href="/customer" className="text-purple-600 hover:underline">
            去購物
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">結帳</h1>

      <form onSubmit={handleSubmit}>
        {/* Saved Addresses */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">送貨地址</h3>
            <Link href="/customer/addresses" className="text-sm text-purple-600 hover:underline flex items-center gap-1">
              <Plus className="w-4 h-4" /> 管理地址
            </Link>
          </div>

          {addresses.length > 0 ? (
            <div className="space-y-2">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  onClick={() => handleAddressSelect(addr)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition ${
                    selectedAddressId === addr.id 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{addr.label}</span>
                    {addr.isDefault && <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded">預設</span>}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{addr.fullName} - {addr.phone}</p>
                  <p className="text-sm text-gray-500">{addr.address}{addr.district ? `, ${addr.district}` : ''}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <p>未有儲存地址</p>
              <Link href="/customer/addresses" className="text-purple-600 hover:underline text-sm">
                新增地址
              </Link>
            </div>
          )}
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <h3 className="font-semibold mb-3">訂單詳情</h3>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.name} x {item.quantity}</span>
                <span>HK${item.price * item.quantity}</span>
              </div>
            ))}
          </div>
          <div className="border-t mt-3 pt-3 flex justify-between font-bold text-lg">
            <span>總計</span>
            <span className="text-purple-600">HK${total}</span>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !selectedAddressId}
          className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold text-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? '處理緊...' : `確認訂單 - HK$${total}`}
        </button>
      </form>
    </div>
  );
}
