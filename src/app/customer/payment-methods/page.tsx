'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, doc, getDocs, addDoc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { CreditCard, Plus, Trash2, Shield, Lock, Smartphone } from 'lucide-react';

interface PaymentMethod {
  id: string;
  type: 'card' | 'wallet';
  cardType?: string;
  last4?: string;
  expiryMonth?: string;
  expiryYear?: string;
  walletType?: string;
  isDefault: boolean;
  createdAt: any;
}

const WALLET_OPTIONS = [
  { type: 'ALIPAYHK', name: 'AlipayHK', icon: '🟢', color: 'bg-green-100 border-green-300' },
  { type: 'WECHATPAYHK', name: 'WeChat Pay', icon: '🟣', color: 'bg-purple-100 border-purple-300' },
  { type: 'PAYME', name: 'PayMe', icon: '🟦', color: 'bg-blue-100 border-blue-300' },
];

const CARD_TYPES = [
  { type: 'VISA', name: 'Visa', icon: '💳' },
  { type: 'MASTER', name: 'Mastercard', icon: '💳' },
  { type: 'AMEX', name: 'American Express', icon: '💳' },
];

export default function CustomerPaymentMethodsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addType, setAddType] = useState<'card' | 'wallet'>('wallet');

  // Card form
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');

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
    const snapshot = await getDocs(collection(db!, 'users', userId, 'paymentMethods'));
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
    const updates = paymentMethods.map(pm => 
      updateDoc(doc(db!, 'users', user.uid, 'paymentMethods', pm.id), { isDefault: pm.id === id })
    );
    await Promise.all(updates);
    fetchPaymentMethods(user.uid);
  };

  const handleAddWallet = async (walletType: string) => {
    if (!user || !db) return;
    
    await addDoc(collection(db!, 'users', user.uid, 'paymentMethods'), {
      type: 'wallet',
      walletType,
      isDefault: paymentMethods.length === 0,
      createdAt: serverTimestamp()
    });
    
    setShowAddForm(false);
    fetchPaymentMethods(user.uid);
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;

    const last4 = cardNumber.slice(-4);
    const [month, year] = cardExpiry.split('/');
    
    await addDoc(collection(db!, 'users', user.uid, 'paymentMethods'), {
      type: 'card',
      cardType: 'VISA', // Simplified - would need real detection
      last4,
      expiryMonth: month,
      expiryYear: year,
      cardName,
      isDefault: paymentMethods.length === 0,
      createdAt: serverTimestamp()
    });

    setShowAddForm(false);
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setCardName('');
    fetchPaymentMethods(user.uid);
  };

  const getCardIcon = (type: string) => {
    const card = CARD_TYPES.find(c => c.type === type);
    return card?.icon || '💳';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Separate cards and wallets
  const cards = paymentMethods.filter(pm => pm.type === 'card');
  const wallets = paymentMethods.filter(pm => pm.type === 'wallet');

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">付款方式</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <Plus className="w-5 h-5" /> 新增
        </button>
      </div>

      {/* Security Note */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
        <Shield className="w-6 h-6 text-green-600" />
        <div>
          <p className="font-medium text-green-800">安全加密</p>
          <p className="text-sm text-green-600">所有付款資料均經SSL加密處理</p>
        </div>
      </div>

      {/* E-Wallets */}
      {wallets.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Smartphone className="w-5 h-5" /> 電子銀包
          </h3>
          <div className="space-y-3">
            {wallets.map((pm) => {
              const wallet = WALLET_OPTIONS.find(w => w.type === pm.walletType);
              return (
                <div key={pm.id} className={`bg-white rounded-xl p-4 border-2 flex items-center justify-between ${pm.isDefault ? 'border-purple-300' : 'border-gray-100'}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{wallet?.icon || '💳'}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{pm.walletType}</span>
                        {pm.isDefault && <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded">預設</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!pm.isDefault && (
                      <button onClick={() => handleSetDefault(pm.id)} className="text-sm text-purple-600 hover:underline">
                        設為預設
                      </button>
                    )}
                    <button onClick={() => handleDelete(pm.id)} className="p-2 text-gray-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Credit Cards */}
      {cards.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <CreditCard className="w-5 h-5" /> 信用卡
          </h3>
          <div className="space-y-3">
            {cards.map((pm) => (
              <div key={pm.id} className={`bg-white rounded-xl p-4 border-2 flex items-center justify-between ${pm.isDefault ? 'border-purple-300' : 'border-gray-100'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getCardIcon(pm.cardType || '')}</span>
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
                    <button onClick={() => handleSetDefault(pm.id)} className="text-sm text-purple-600 hover:underline">
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
        </div>
      )}

      {/* Empty State */}
      {paymentMethods.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>未有付款方式</p>
          <p className="text-sm">新增付款方式以便快速結帳</p>
        </div>
      )}

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">新增付款方式</h3>
            
            {/* Type Selection */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setAddType('wallet')}
                className={`flex-1 py-3 rounded-lg border-2 ${addType === 'wallet' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}
              >
                <Smartphone className="w-6 h-6 mx-auto mb-1" />
                <span className="text-sm">電子銀包</span>
              </button>
              <button
                onClick={() => setAddType('card')}
                className={`flex-1 py-3 rounded-lg border-2 ${addType === 'card' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}
              >
                <CreditCard className="w-6 h-6 mx-auto mb-1" />
                <span className="text-sm">信用卡</span>
              </button>
            </div>

            {/* Wallet Options */}
            {addType === 'wallet' && (
              <div className="space-y-2">
                {WALLET_OPTIONS.map((wallet) => (
                  <button
                    key={wallet.type}
                    onClick={() => handleAddWallet(wallet.type)}
                    className={`w-full p-4 rounded-xl border-2 flex items-center gap-3 ${wallet.color} hover:opacity-80`}
                  >
                    <span className="text-2xl">{wallet.icon}</span>
                    <span className="font-medium">{wallet.name}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Card Form */}
            {addType === 'card' && (
              <form onSubmit={handleAddCard} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">持卡人姓名</label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">卡號</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="1234 5678 9012 3456"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">到期日</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg"
                      placeholder="MM/YY"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">CVV</label>
                    <input
                      type="text"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="w-full px-4 py-2 border rounded-lg"
                      placeholder="123"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  新增信用卡
                </button>
              </form>
            )}

            <button
              onClick={() => setShowAddForm(false)}
              className="w-full mt-4 py-3 border rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
