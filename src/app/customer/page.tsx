'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useCart } from '@/lib/cart';
import { useToast } from '@/components/Toast';
import { Search, Scan, MapPin, Star, Crown, ChevronRight, ShoppingBag } from 'lucide-react';
import dynamic from 'next/dynamic';

const BarcodeScanner = dynamic(() => import('@/components/BarcodeScanner'), { ssr: false });

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  merchantId: string;
  stock?: number;
}

interface Merchant {
  id: string;
  shopName: string;
  description: string;
  logoUrl?: string;
  address?: string;
  plan?: 'free' | 'pro';
  rating?: number;
}

const CATEGORIES = [
  { id: 'all', label: '全部', emoji: '✨' },
  { id: '食品', label: '食品', emoji: '🍞' },
  { id: '飲品', label: '飲品', emoji: '☕' },
  { id: '生活用品', label: '生活', emoji: '🛍️' },
  { id: '服裝', label: '服裝', emoji: '👕' },
  { id: '美妝', label: '美妝', emoji: '💄' },
  { id: '電子產品', label: '電子', emoji: '📱' },
  { id: '運動', label: '運動', emoji: '⚽' },
  { id: '家居', label: '家居', emoji: '🏠' },
];

export default function CustomerHomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const { addItem } = useCart();
  const { showToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!db) {
      setLoading(false);
      return;
    }
    
    try {
      const productsQuery = query(
        collection(db, 'products'),
        where('status', '==', 'active')
      );
      const productsSnapshot = await getDocs(productsQuery);
      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setProducts(productsData);

      const merchantsQuery = query(
        collection(db, 'merchants'),
        where('status', '==', 'active')
      );
      const merchantsSnapshot = await getDocs(merchantsQuery);
      const merchantsData = merchantsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Merchant[];
      setMerchants(merchantsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchSearch = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p as any).barcode?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleBarcodeScan = (barcode: string) => {
    setShowScanner(false);
    setSearchQuery(barcode);
  };

  const handleAddToCart = (product: Product, merchant: Merchant) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      merchantId: product.merchantId,
      merchantName: merchant?.shopName || '商戶',
      imageUrl: product.imageUrl,
    });
    showToast(`已加入購物車：${product.name}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      {/* Header */}
      <div className="gradient-bg px-4 pt-6 pb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-2xl">🛒</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">ShopSagi</h1>
            <p className="text-sm text-gray-500">舖記</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-lg p-2 flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜尋商店或商品..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl focus:ring-2 focus:ring-purple-100 outline-none text-base"
            />
          </div>
          <button
            onClick={() => setShowScanner(true)}
            className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl shadow-md hover:opacity-90 transition"
          >
            <Scan className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 -mt-4">
        {/* Categories */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="mr-1.5">{cat.emoji}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Merchants Section */}
        {merchants.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">熱門商戶</h2>
              <Link href="/customer/merchants" className="text-purple-600 text-sm font-medium flex items-center gap-1">
                查看全部 <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {merchants.map((merchant) => (
                <Link
                  key={merchant.id}
                  href={`/customer/shop/${merchant.id}`}
                  className="flex-shrink-0 w-36 bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition group"
                >
                  <div className="h-28 bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center relative">
                    {merchant.logoUrl ? (
                      <img src={merchant.logoUrl} alt={merchant.shopName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl opacity-50">商</span>
                    )}
                    {merchant.plan === 'pro' && (
                      <div className="absolute top-2 right-2">
                        <span className="badge badge-pro text-xs">
                          <Crown className="w-3 h-3" /> PRO
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="font-semibold text-gray-900 truncate text-sm">{merchant.shopName}</div>
                    {merchant.address && (
                      <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{merchant.address}</span>
                      </div>
                    )}
                    {merchant.rating && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="text-xs text-gray-600">{merchant.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Products Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              {selectedCategory === 'all' ? '所有商品' : CATEGORIES.find(c => c.id === selectedCategory)?.label}
            </h2>
            <span className="text-sm text-gray-400">{filteredProducts.length} 件商品</span>
          </div>
          
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Search className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="font-semibold text-lg mb-2">暫時未有商品</h3>
              <p className="text-gray-500 text-sm">
                {searchQuery ? '搜尋結果為空，試下其他關鍵字' : '請稍後再嚟'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => {
                const merchant = merchants.find(m => m.id === product.merchantId);
                return (
                  <div key={product.id} className="bg-white rounded-2xl shadow-sm overflow-hidden card-hover group">
                    <div className="h-36 bg-gray-100 flex items-center justify-center relative overflow-hidden">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <span className="text-4xl opacity-30">📦</span>
                      )}
                      {merchant?.plan === 'pro' && (
                        <div className="absolute top-2 left-2">
                          <span className="badge badge-pro text-xs">
                            <Crown className="w-3 h-3" />
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="font-semibold text-gray-900 line-clamp-2 text-sm mb-1 min-h-[2.5rem]">
                        {product.name}
                      </div>
                      <div className="text-xs text-gray-400 mb-2">
                        {merchant?.shopName || '商戶'}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-lg font-bold text-purple-600">
                          HK${product.price}
                        </div>
                        <button 
                          onClick={() => handleAddToCart(product, merchant!)}
                          className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl shadow-md hover:opacity-90 transition"
                        >
                          <ShoppingBag className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showScanner && (
        <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setShowScanner(false)} />
      )}
    </div>
  );
}
