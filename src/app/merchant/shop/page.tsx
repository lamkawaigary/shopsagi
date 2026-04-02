'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, storage } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, setDoc, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

const DEFAULT_BUSINESS_HOURS = [
  { day: '星期一', open: '09:00', close: '22:00', closed: false },
  { day: '星期二', open: '09:00', close: '22:00', closed: false },
  { day: '星期三', open: '09:00', close: '22:00', closed: false },
  { day: '星期四', open: '09:00', close: '22:00', closed: false },
  { day: '星期五', open: '09:00', close: '22:00', closed: false },
  { day: '星期六', open: '09:00', close: '22:00', closed: false },
  { day: '星期日', open: '09:00', close: '22:00', closed: false },
];

export default function ShopSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shopData, setShopData] = useState({
    shopName: '',
    description: '',
    phone: '',
    address: '',
    lat: null as number | null,
    lng: null as number | null,
    logo: null as File | null,
    logoUrl: '',
    businessHours: DEFAULT_BUSINESS_HOURS,
  });

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchShopData(currentUser.uid);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchShopData = async (userId: string) => {
    if (!db) return;
    try {
      const shopDoc = await getDoc(doc(db, 'merchants', userId));
      if (shopDoc.exists()) {
        const data = shopDoc.data();
        setShopData(prev => ({
          ...prev,
          shopName: data.shopName || '',
          description: data.description || '',
          phone: data.phone || '',
          address: data.address || '',
          lat: data.lat || null,
          lng: data.lng || null,
          logoUrl: data.logoUrl || '',
          businessHours: data.businessHours || DEFAULT_BUSINESS_HOURS,
        }));
      }
    } catch (error) {
      console.error('Error fetching shop data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;

    setSaving(true);
    try {
      let logoUrl = shopData.logoUrl;

      // Upload logo if new one selected
      if (shopData.logo && storage) {
        const storageRef = ref(storage, `merchants/${user.uid}/logo`);
        await uploadBytes(storageRef, shopData.logo);
        logoUrl = await getDownloadURL(storageRef);
      }

      // Save to Firestore
      await setDoc(doc(db, 'merchants', user.uid), {
        userId: user.uid,
        shopName: shopData.shopName,
        description: shopData.description,
        phone: shopData.phone,
        address: shopData.address,
        lat: shopData.lat,
        lng: shopData.lng,
        logoUrl,
        businessHours: shopData.businessHours,
        updatedAt: new Date(),
      }, { merge: true });

      alert('店鋪設定已儲存！');
    } catch (error) {
      console.error('Error saving shop data:', error);
      alert('儲存失敗，請再試過');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setShopData({ ...shopData, logo: e.target.files[0] });
    }
  };

  const updateBusinessHours = (index: number, field: string, value: any) => {
    const newHours = [...shopData.businessHours];
    (newHours[index] as any)[field] = value;
    setShopData({ ...shopData, businessHours: newHours });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <h2 className="text-2xl font-bold mb-6">店鋪設定</h2>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {/* Logo */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">店鋪標誌</h3>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
              {shopData.logo ? (
                <img
                  src={URL.createObjectURL(shopData.logo)}
                  alt="Logo Preview"
                  className="w-full h-full object-cover"
                />
              ) : shopData.logoUrl ? (
                <img src={shopData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl">商</span>
              )}
            </div>
            <label className="cursor-pointer">
              <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
              <span className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                上傳標誌
              </span>
            </label>
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">基本資料</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                店鋪名稱 *
              </label>
              <input
                type="text"
                value={shopData.shopName}
                onChange={(e) => setShopData({ ...shopData, shopName: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="例如：明記茶餐廳"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                店鋪描述
              </label>
              <textarea
                value={shopData.description}
                onChange={(e) => setShopData({ ...shopData, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="介紹你既店鋪..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  電話 *
                </label>
                <input
                  type="tel"
                  value={shopData.phone}
                  onChange={(e) => setShopData({ ...shopData, phone: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="+852 1234 5678"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  地址
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shopData.address}
                    onChange={(e) => setShopData({ ...shopData, address: e.target.value })}
                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="香港中環..."
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!shopData.address) {
                        alert('請輸入地址');
                        return;
                      }
                      try {
                        // Use OpenStreetMap Nominatim for geocoding (free, no API key needed)
                        const response = await fetch(
                          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(shopData.address + ', Hong Kong')}`
                        );
                        const data = await response.json();
                        
                        if (data && data.length > 0) {
                          setShopData({
                            ...shopData,
                            lat: parseFloat(data[0].lat),
                            lng: parseFloat(data[0].lon)
                          });
                          alert(`✓ 座標已取得: ${data[0].lat}, ${data[0].lon}`);
                        } else {
                          alert('搵唔到位置，請嘗試更具體既地址');
                        }
                      } catch (err) {
                        console.error('Geocoding error:', err);
                        alert('取得座標失敗');
                      }
                    }}
                    className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm"
                  >
                    📍 定位
                  </button>
                </div>
                {shopData.lat && shopData.lng && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ 座標: {shopData.lat}, {shopData.lng}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Business Hours */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">營業時間</h3>
          <div className="space-y-3">
            {shopData.businessHours.map((hours, index) => (
              <div key={hours.day} className="flex items-center gap-4">
                <div className="w-20 font-medium">{hours.day}</div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!hours.closed}
                    onChange={(e) => updateBusinessHours(index, 'closed', !e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-600">營業</span>
                </label>
                {!hours.closed && (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={hours.open}
                      onChange={(e) => updateBusinessHours(index, 'open', e.target.value)}
                      className="px-2 py-1 border rounded"
                    />
                    <span>至</span>
                    <input
                      type="time"
                      value={hours.close}
                      onChange={(e) => updateBusinessHours(index, 'close', e.target.value)}
                      className="px-2 py-1 border rounded"
                    />
                  </div>
                )}
                {hours.closed && (
                  <span className="text-gray-500">休息</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? '儲存中...' : '儲存設定'}
        </button>
      </form>
    </div>
  );
}
