'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function SeedPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const seedData = async () => {
    if (!db) {
      setResult('Firebase not initialized');
      return;
    }

    setLoading(true);
    setResult('Seeding...');

    try {
      // Create merchant 1
      const merchant1Ref = await addDoc(collection(db, 'merchants'), {
        userId: 'merchant_1',
        shopName: '港式奶茶舖',
        description: '正宗港式奶茶，茶味濃郁',
        address: '香港中環荷李活道123號',
        phone: '+852 1234 5678',
        categories: ['食品', '飲品'],
        commissionRate: 0.10,
        status: 'active',
        createdAt: serverTimestamp(),
      });
      setResult('Created: 港式奶茶舖');

      // Products for merchant 1
      const products1 = [
        { name: '港式奶茶', description: '正宗港式奶茶', price: 28, category: '飲品' },
        { name: '港式檸檬茶', description: '新鮮檸檬製作', price: 25, category: '飲品' },
        { name: '港式咖啡', description: '即磨咖啡', price: 22, category: '飲品' },
        { name: '奶油多士', description: '香脆多士配牛油', price: 18, category: '食品' },
        { name: '蛋治', description: '火腿蛋三文治', price: 25, category: '食品' },
      ];

      for (const p of products1) {
        await addDoc(collection(db, 'products'), {
          merchantId: merchant1Ref.id,
          merchantName: '港式奶茶舖',
          ...p,
          status: 'active',
          createdAt: serverTimestamp(),
        });
      }
      setResult('Created: 5 products for 港式奶茶舖');

      // Create merchant 2
      const merchant2Ref = await addDoc(collection(db, 'merchants'), {
        userId: 'merchant_2',
        shopName: '泰式美食',
        description: '正宗泰國菜',
        address: '香港九龍旺角彌敦道456號',
        phone: '+852 9876 5432',
        categories: ['食品'],
        commissionRate: 0.10,
        status: 'active',
        createdAt: serverTimestamp(),
      });

      const products2 = [
        { name: '泰式咖喱飯', description: '濃郁咖喱配白飯', price: 48, category: '食品' },
        { name: '泰式炒河', description: '傳統泰式炒河', price: 42, category: '食品' },
        { name: '冬蔭功湯', description: '酸辣海鮮湯', price: 38, category: '食品' },
      ];

      for (const p of products2) {
        await addDoc(collection(db, 'products'), {
          merchantId: merchant2Ref.id,
          merchantName: '泰式美食',
          ...p,
          status: 'active',
          createdAt: serverTimestamp(),
        });
      }
      setResult('Created: 3 products for 泰式美食 + 2 merchants');

      // Create driver
      await addDoc(collection(db, 'drivers'), {
        userId: 'driver_1',
        name: '陳大文',
        phone: '+852 5555 1234',
        vehicleType: '電單車',
        licensePlate: 'AB 1234',
        status: 'active',
        rating: 4.8,
        totalDeliveries: 156,
        walletBalance: 2340,
        createdAt: serverTimestamp(),
      });
      setResult('Created: driver 陳大文');

      setResult('OK Seed completed! 2 merchants, 8 products, 1 driver');
    } catch (error) {
      console.error('Seed error:', error);
      setResult('ERR Error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">🌱 Seed Data</h1>
        
        <p className="text-gray-600 mb-6">
          Click the button below to add sample data to Firebase:
        </p>

        <ul className="text-sm text-gray-500 mb-6 space-y-1">
          <li>• 2 商戶 (港式奶茶舖, 泰式美食)</li>
          <li>• 8 商品</li>
          <li>• 1 司機 (陳大文)</li>
        </ul>

        <button
          onClick={seedData}
          disabled={loading}
          className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? 'Seeding...' : '🌱 Add Sample Data'}
        </button>

        {result && (
          <div className={`mt-4 p-3 rounded-lg text-center ${
            result.includes('OK') ? 'bg-green-100 text-green-700' :
            result.includes('ERR') ? 'bg-red-100 text-red-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {result}
          </div>
        )}
      </div>
    </div>
  );
}
