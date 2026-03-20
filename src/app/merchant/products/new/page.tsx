'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth } from '@/lib/firebase';
import { Save, Scan } from 'lucide-react';
import dynamic from 'next/dynamic';

const BarcodeScanner = dynamic(() => import('@/components/BarcodeScanner'), { ssr: false });

const CATEGORIES = [
  '食品',
  '飲品',
  '生活用品',
  '電子產品',
  '服裝',
  '書籍',
  '美妝',
  '運動',
  '家居',
  '其他',
];

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const handleBarcodeScan = (barcode: string) => {
    setShowScanner(false);
    setFormData({ ...formData, barcode });
  };

  const [formData, setFormData] = useState({
    barcode: '' ,
    name: '',
    description: '',
    price: '',
    category: CATEGORIES[0],
    image: null as File | null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth?.currentUser) return;

    setLoading(true);
    try {
      let imageUrl = '';

      // Upload image if exists
      if (formData.image) {
        if (!storage) return;
        setUploading(true);
        const storageRef = ref(storage, `products/${Date.now()}_${formData.image.name}`);
        await uploadBytes(storageRef, formData.image);
        imageUrl = await getDownloadURL(storageRef);
        setUploading(false);
      }

      // Add product to Firestore
      if (!db) return;
      await addDoc(collection(db, 'products'), {
        merchantId: auth.currentUser.uid,
        name: formData.name,
        description: formData.description,
        barcode: formData.barcode || null,
        price: parseFloat(formData.price),
        category: formData.category,
        imageUrl,
        status: 'active',
        createdAt: serverTimestamp(),
      });

      router.push('/merchant/products');
    } catch (error) {
      console.error('Error creating product:', error);
      alert('建立商品失敗，請再試過');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, image: e.target.files[0] });
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">新增商品</h2>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              商品圖片
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              {formData.image ? (
                <div className="relative">
                  <img
                    src={URL.createObjectURL(formData.image)}
                    alt="Preview"
                    className="max-h-48 mx-auto rounded"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, image: null })}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                  >
                    X
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <div className="text-gray-500">
                    <div className="text-3xl mb-2">📷</div>
                    <div>點擊上傳圖片</div>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              商品名稱 *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="例如：港式奶茶"
              required
            />
          </div>

          {/* Barcode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              條碼 / 商品編號
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="例如：4891234567890"
              />
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1"
              >
                <Scan className="w-5 h-5" /> 掃描
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              商品描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="描述你既商品..."
              rows={3}
            />
          </div>

          {/* Price & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                價格 (HK$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                分類
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 py-2 border rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading || uploading}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading || uploading ? '儲存中...' : (
                <>
                  <Save className="w-5 h-5 inline mr-1" />
                  儲存商品
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {showScanner && <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setShowScanner(false)} />}
    </div>
  );
}
