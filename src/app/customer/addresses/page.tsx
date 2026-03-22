'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, MapPin, Home, Building } from 'lucide-react';

interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  address: string;
  district?: string;
  isDefault: boolean;
  createdAt: any;
}

export default function CustomerAddressesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [label, setLabel] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth!, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchAddresses(currentUser.uid);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchAddresses = async (userId: string) => {
    if (!db) return;
    const snapshot = await getDocs(collection(db, 'users', userId, 'addresses'));
    const addrList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Address));
    setAddresses(addrList.sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0)));
  };

  const resetForm = () => {
    setLabel('');
    setFullName('');
    setPhone('');
    setAddress('');
    setDistrict('');
    setIsDefault(false);
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;

    const addressData = {
      label,
      fullName,
      phone,
      address,
      district,
      isDefault,
      createdAt: serverTimestamp()
    };

    if (editingId) {
      await updateDoc(doc(db!, 'users', user.uid, 'addresses', editingId), addressData);
    } else {
      await addDoc(collection(db, 'users', user.uid, 'addresses'), addressData);
    }

    // If set as default, update other addresses
    if (isDefault && db) {
      const firestore = db;
      const updates = addresses
        .filter(a => a.id !== editingId)
        .map(a => updateDoc(doc(firestore, 'users', user.uid, 'addresses', a.id), { isDefault: false }));
      await Promise.all(updates);
    }

    fetchAddresses(user.uid);
    resetForm();
  };

  const handleEdit = (addr: Address) => {
    setLabel(addr.label);
    setFullName(addr.fullName);
    setPhone(addr.phone);
    setAddress(addr.address);
    setDistrict(addr.district || '');
    setIsDefault(addr.isDefault);
    setEditingId(addr.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!user || !confirm('確定要刪除呢個地址？')) return;
    await deleteDoc(doc(db!, 'users', user.uid, 'addresses', id));
    fetchAddresses(user.uid);
  };

  const handleSetDefault = async (id: string) => {
    if (!user) return;
    const updates = addresses.map(a => 
      updateDoc(doc(db!, 'users', user.uid, 'addresses', a.id), { isDefault: a.id === id })
    );
    await Promise.all(updates);
    fetchAddresses(user.uid);
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
        <h2 className="text-2xl font-bold">我的地址</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <Plus className="w-5 h-5" /> 新增地址
        </button>
      </div>

      {/* Address List */}
      {addresses.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>未有地址</p>
          <p className="text-sm">添加送貨地址以便快速結帳</p>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((addr) => (
            <div key={addr.id} className={`bg-white rounded-xl p-4 border-2 ${addr.isDefault ? 'border-purple-300' : 'border-gray-100'}`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {addr.label === '屋企' ? <Home className="w-4 h-4" /> : <Building className="w-4 h-4" />}
                    <span className="font-semibold">{addr.label}</span>
                    {addr.isDefault && <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded">預設</span>}
                  </div>
                  <p className="font-medium">{addr.fullName}</p>
                  <p className="text-gray-600">{addr.phone}</p>
                  <p className="text-gray-600">{addr.address}</p>
                  {addr.district && <p className="text-gray-500 text-sm">{addr.district}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(addr)} className="p-2 text-gray-400 hover:text-purple-600">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(addr.id)} className="p-2 text-gray-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {!addr.isDefault && (
                <button
                  onClick={() => handleSetDefault(addr.id)}
                  className="mt-3 text-sm text-purple-600 hover:underline"
                >
                  設為預設地址
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">{editingId ? '編輯地址' : '新增地址'}</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">地址標籤</label>
                <div className="flex gap-2">
                  {['屋企', '公司', '其他'].map((l) => (
                    <button
                      type="button"
                      key={l}
                      onClick={() => setLabel(l)}
                      className={`px-4 py-2 rounded-lg border ${label === l ? 'bg-purple-100 border-purple-300' : 'border-gray-200'}`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">收件人姓名 *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">電話號碼 *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">詳細地址 *</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={2}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">地區</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="例如：灣仔區"
                />
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm">設為預設地址</span>
              </label>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-3 border rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  儲存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
