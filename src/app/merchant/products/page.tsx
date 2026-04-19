'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Scan, Crown, Lock } from 'lucide-react';
import dynamic from 'next/dynamic';

const BarcodeScanner = dynamic(() => import('@/components/BarcodeScanner'), { ssr: false });

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  barcode?: string;
  status: 'active' | 'inactive';
  createdAt: any;
}

interface MerchantData {
  plan: 'free' | 'pro';
  shopName: string;
}

const FREE_PLAN_LIMIT = 20;

export default function ProductsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [merchant, setMerchant] = useState<MerchantData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showScanner, setShowScanner] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const isPro = merchant?.plan === 'pro';
  const productCount = allProducts.length;
  const isAtLimit = !isPro && productCount >= FREE_PLAN_LIMIT;

  const searchProducts = (term: string) => {
    if (!term) {
      setProducts(allProducts);
      return;
    }
    const filtered = allProducts.filter(p => 
      p.name.toLowerCase().includes(term.toLowerCase()) ||
      (p.barcode && p.barcode.includes(term))
    );
    setProducts(filtered);
  };

  const handleBarcodeScan = (barcode: string) => {
    setShowScanner(false);
    searchProducts(barcode);
  };

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchMerchantData(currentUser.uid);
        await fetchProducts(currentUser.uid);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchMerchantData = async (userId: string) => {
    if (!db) return;
    try {
      const q = query(collection(db, 'merchants'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const merchantData = snapshot.docs[0].data() as MerchantData;
        setMerchant(merchantData);
      }
    } catch (error) {
      console.error('Error fetching merchant data:', error);
    }
  };

  const fetchProducts = async (userId: string) => {
    if (!db) return;
    
    try {
      const q = query(
        collection(db, 'products'),
        where('merchantId', '==', userId)
      );
      const snapshot = await getDocs(q);
      const productList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setProducts(productList);
      setAllProducts(productList);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    }
  };

  const handleToggleStatus = async (product: Product) => {
    if (!db) return;
    const newStatus = product.status === 'active' ? 'inactive' : 'active';
    await updateDoc(doc(db, 'products', product.id), { status: newStatus });
    setProducts(products.map(p => 
      p.id === product.id ? { ...p, status: newStatus } : p
    ));
  };

  const handleDelete = async (productId: string) => {
    if (!db) return;
    if (confirm('確定要刪除呢件商品嗎？')) {
      await deleteDoc(doc(db, 'products', productId));
      setProducts(products.filter(p => p.id !== productId));
    }
  };

  const filteredProducts = products.filter(p => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Plan Banner */}
      {!isPro && (
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-4 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown className="w-6 h-6" />
              <div>
                <div className="font-semibold">免費版方案</div>
                <div className="text-sm opacity-90">
                  {productCount} / {FREE_PLAN_LIMIT} 件商品 • 
                  {isAtLimit ? ' 已達上限' : ` 尚餘 ${FREE_PLAN_LIMIT - productCount} 件`}
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold hover:bg-purple-50 flex items-center gap-2"
            >
              <Crown className="w-4 h-4" /> 升級 Pro
            </button>
          </div>
        </div>
      )}

      {isPro && (
        <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl p-4 mb-6 text-white">
          <div className="flex items-center gap-3">
            <Crown className="w-6 h-6" />
            <div className="font-semibold">Pro 方案</div>
            <div className="text-sm opacity-90">無限商品上架</div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">商品管理</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowScanner(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-1"
          >
            <Scan className="w-5 h-5" /> 掃描
          </button>
          {isAtLimit ? (
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-1 cursor-not-allowed"
              disabled
            >
              <Lock className="w-5 h-5" /> 已達上限
            </button>
          ) : (
            <Link
              href="/merchant/products/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-1"
            >
              <Plus className="w-5 h-5" /> 新增商品
            </Link>
          )}
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl shadow-sm mb-6 p-4">
        <div className="flex gap-2">
          {(['all', 'active', 'inactive'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'all' ? '全部' : f === 'active' ? '上架中' : '已下架'}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm mb-4 p-4 flex gap-2">
        <input
          type="text"
          placeholder="搜尋商品名稱或條碼..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && searchProducts(searchTerm)}
          className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => searchProducts(searchTerm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          搜尋
        </button>
        {searchTerm && (
          <button
            onClick={() => { setSearchTerm(''); setProducts(allProducts); }}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg"
          >
            清除
          </button>
        )}
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-4xl mb-4">📦</div>
          <h3 className="text-lg font-semibold mb-2">暫時未有商品</h3>
          <p className="text-gray-500 mb-4">
            {isAtLimit 
              ? '你已達到免費版商品上限，升級 Pro 解鎖無限商品上架' 
              : '建立你既第一件商品開始銷售'}
          </p>
          {isAtLimit ? (
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="inline-block bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
            >
              升級 Pro
            </button>
          ) : (
            <Link
              href="/merchant/products/new"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              新增商品
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="h-40 bg-gray-100 flex items-center justify-center">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl">🖼️</span>
                )}
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{product.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {product.status === 'active' ? '上架中' : '已下架'}
                  </span>
                </div>
                <p className="text-gray-500 text-sm mb-2 line-clamp-2">{product.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-blue-600">HK${product.price}</span>
                  <span className="text-sm text-gray-500">{product.category}</span>
                </div>
                <div className="flex gap-2 mt-4">
                  <Link
                    href={`/merchant/products/${product.id}`}
                    className="flex-1 text-center bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 text-sm flex items-center justify-center gap-1"
                  >
                    <Pencil className="w-4 h-4" /> 編輯
                  </Link>
                  <button
                    onClick={() => handleToggleStatus(product)}
                    className="flex-1 text-center bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 text-sm"
                  >
                    {product.status === 'active' ? '下架' : '上架'}
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="flex-1 text-center bg-red-50 text-red-600 py-2 rounded-lg hover:bg-red-100 text-sm flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" /> 刪除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {showScanner && <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setShowScanner(false)} />}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">升級到 Pro</h3>
              <p className="text-gray-500">解鎖更多功能，擴展你的業務</p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="text-3xl font-bold text-center mb-2">
                HK$168-328<span className="text-sm font-normal text-gray-500">/月</span>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> 無限商品上架
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> 網上結算功能
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> 庫存追蹤系統
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> 優先客戶支援
                </li>
              </ul>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200"
              >
                稍後再說
              </button>
              <Link
                href="/merchant/upgrade"
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:opacity-90 text-center"
              >
                選擇方案
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
