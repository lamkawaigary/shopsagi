'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User, updateProfile } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function DriverProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  // Editable fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth!, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDoc = await getDoc(doc(db!, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setProfile(userData);
          setName(userData.name || '');
          setPhone(userData.phone || '');
          setVehicleType(userData.vehicleType || '');
          setVehicleNumber(userData.vehicleNumber || '');
          
          if (userData.role !== 'driver') {
            router.push('/register?role=driver');
            return;
          }
        }
      } else {
        router.push('/driver/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleSave = async () => {
    if (!auth?.currentUser || !db) return;
    
    setSaving(true);
    setMessage('');
    
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        name,
        phone,
        vehicleType,
        vehicleNumber,
        updatedAt: new Date().toISOString(),
      });
      
      // Also update in drivers collection
      await updateDoc(doc(db, 'drivers', auth.currentUser.uid), {
        name,
        phone,
        vehicleType,
        vehicleNumber,
        updatedAt: new Date().toISOString(),
      });
      
      setMessage('✅ 資料已更新');
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('❌ 更新失敗，請再試過');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="pb-20 md:pb-8">
      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
            🚚
          </div>
          <div>
            <h2 className="text-xl font-bold">{name || '司機'}</h2>
            <p className="text-gray-600 text-sm">{user?.email}</p>
            <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full mt-1">
              已驗證司機
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{profile?.totalOrders || 0}</div>
          <div className="text-xs text-gray-600">總訂單</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{profile?.rating?.toFixed(1) || '5.0'}</div>
          <div className="text-xs text-gray-600">評分</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{profile?.totalEarnings || 0}</div>
          <div className="text-xs text-gray-600">總收入</div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-bold text-lg mb-4">個人資料</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">顯示名稱</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="你的名稱"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-600 mb-1">手機號碼</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="5xxxxxxxx"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-600 mb-1">車輛類型</label>
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">選擇車輛類型</option>
              <option value="電單車">電單車 🏍️</option>
              <option value="單車">單車 🚲</option>
              <option value="貨車">貨車 🚛</option>
              <option value="私家車">私家車 🚗</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-gray-600 mb-1">車牌號碼</label>
            <input
              type="text"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="AB-1234"
            />
          </div>

          {message && (
            <div className={`p-3 rounded-lg ${message.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? '儲存中...' : '儲存更改'}
          </button>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
        <h3 className="font-bold text-lg mb-4">設定</h3>
        
        <div className="space-y-3">
          <button
            onClick={() => alert('通知設定即將推出！')}
            className="w-full flex justify-between items-center py-3 border-b hover:bg-gray-50"
          >
            <span>🔔 通知設定</span>
            <span className="text-gray-400">→</span>
          </button>
          
          <button
            onClick={() => alert('幫助中心即將推出！')}
            className="w-full flex justify-between items-center py-3 border-b hover:bg-gray-50"
          >
            <span>❓ 幫助中心</span>
            <span className="text-gray-400">→</span>
          </button>
          
          <button
            onClick={() => alert('版本：1.0.0')}
            className="w-full flex justify-between items-center py-3 hover:bg-gray-50"
          >
            <span>ℹ️ 關於</span>
            <span className="text-gray-400">v1.0.0</span>
          </button>
        </div>
      </div>
    </div>
  );
}
