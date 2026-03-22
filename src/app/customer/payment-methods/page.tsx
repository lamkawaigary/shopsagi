'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, doc, getDocs, addDoc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { CreditCard, Plus, Trash2, Shield, Lock } from 'lucide-react';

interface PaymentMethod {
  id: string;
  type: 'card';
  cardType: string;
  last4: string;
  expiryMonth: string;
  expiryYear: string;
  isDefault: boolean;
  createdAt: any;
}

export default function CustomerPaymentMethodsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth!, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchPaymentMethods(currentUser.uid);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchPaymentMethods = async (userId: string) => {
    if (!db) return;
    const snapshot = await getDocs(collection(db, 'users', userId, 'paymentMethods'));
    const methods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentMethod));
    setPaymentMethods(methods.sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0)));
  };

  const handleDelete = async (id: string) => {
    if (!user || !confirm('確定要刪除呢個付款方式？')) return;
    await deleteDoc(doc(db!, 'users', user.uid, 'paymentMethods', id));
    fetchPaymentMethods(user.uid);
  };

  const handleSetDefault = async (id: string) => {
    if (!user || !db) return;
    const firestore = db;
    const updates = paymentMethods.map(pm => 
      updateDoc(doc(firestore, 'users', user.uid, 'paymentMethods', pm.id), { isDefault: pm.id === id })
    );
    await Promise.all(updates);
    fetchPaymentMethods(user.uid);
  };

  const getCardIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'VISA': return '💳';
      case 'MASTER': return '💳';
      case 'AMEX': return '💳';
      default: return '💳';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">付款方式</h2>
        <a
          href="/payment/checkout"
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <Plus className="w-5 h-5" /> 新增信用卡
        </a>
      </div>

      {/* Security Note */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
        <Shield className="w-6 h-6 text-green-600" />
        <div>
          <p className="font-medium text-green-800">安全加密</p>
          <p className="text-sm text-green-600">所有付款資料均經SSL加密處理，保障你既私隱</p>
        </div>
      </div>

      {/* Payment Methods List */}
      {paymentMethods.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>未有付款方式</p>
          <p className="text-sm">新增信用卡以便快速結帳</p>
        </div>
      ) : (
        <div className="space-y-4">
          {paymentMethods.map((pm) => (
            <div key={pm.id} className={`bg-white rounded-xl p-4 border-2 flex items-center justify-between ${pm.isDefault ? 'border-purple-300' : 'border-gray-100'}`}>
              <div className="flex items-center gap-4">
                <div className="text-3xl">{getCardIcon(pm.cardType)}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{pm.cardType}</span>
                    <span className="text-gray-500">•••• {pm.last4}</span>
                    {pm.isDefault && <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded">預設</span>}
                  </div>
                  <p className="text-sm text-gray-500">到期：{pm.expiryMonth}/{pm.expiryYear}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!pm.isDefault && (
                  <button
                    onClick={() => handleSetDefault(pm.id)}
                    className="text-sm text-purple-600 hover:underline"
                  >
                    設為預設
                  </button>
                )}
                <button onClick={() => handleDelete(pm.id)} className="p-2 text-gray-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 p-4 bg-gray-50 rounded-xl">
        <div className="flex items-center gap-2 text-gray-600 mb-2">
          <Lock className="w-4 h-4" />
          <span className="font-medium">關於付款方式</span>
        </div>
        <ul className="text-sm text-gray-500 space-y-1">
          <li>• 你既信用卡資料會安全咁儲存係我地既系統度</li>
          <li>• 我地支援 Visa、Mastercard、American Express</li>
          <li>• 你可以隨時新增或刪除付款方式</li>
        </ul>
      </div>
    </div>
  );
}
