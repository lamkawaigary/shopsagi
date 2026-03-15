'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useCart } from '@/lib/cart';
import { useToast } from '@/components/Toast';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  merchantId: string;
}

interface Merchant {
  id: string;
  shopName: string;
  description: string;
  logoUrl?: string;
}

export default function CustomerHomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
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
      // Fetch active products
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

      // Fetch merchants
      const merchantsQuery = collection(db, 'merchants');
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

  const categories = ['all', '食品', '飲品', '生活用品', '電子產品', '服裝', '美妝', '運動', '家居', '其他'];

  const filteredProducts = products.filter(p => {
    const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="pb-20 md:pb-8">
      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm p-3 md:p-4 mb-4 md:mb-6">
        <div className="flex gap-3 md:gap-4">
          <input
            type="text"
            placeholder="搜尋商品..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-3 md:px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 text-base"
          />
        </div>
        
        {/* Categories - horizontal scroll on mobile */}
        <div className="flex gap-2 mt-3 md:mt-4 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-sm whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat === 'all' ? '全部' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Merchants Section */}
      {merchants.length > 0 && (
        <div className="mb-6 md:mb-8">
          <h2 className="text-lg md:text-2xl font-bold mb-3 md:mb-4">熱門商戶</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {merchants.map((merchant) => (
              <Link
                key={merchant.id}
                href={`/customer/shop/${merchant.id}`}
                className="bg-white rounded-xl shadow-sm p-3 md:p-4 hover:shadow-md transition"
              >
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-full mx-auto mb-2 md:mb-3 flex items-center justify-center">
                  {merchant.logoUrl ? (
                    <img src={merchant.logoUrl} alt={merchant.shopName} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <span className="text-xl md:text-2xl">🏪</span>
                  )}
                </div>
                <div className="text-center font-medium text-sm md:text-base">{merchant.shopName}</div>
                <div className="text-center text-xs md:text-sm text-gray-500 truncate">{merchant.description}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Products Section */}
      <div>
        <h2 className="text-lg md:text-2xl font-bold mb-3 md:mb-4">
          {selectedCategory === 'all' ? '所有商品' : selectedCategory}
        </h2>
        
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 md:p-12 text-center">
            <div className="text-3xl md:text-4xl mb-3 md:mb-4">🔍</div>
            <h3 className="text-base md:text-lg font-semibold mb-2">暫時未有商品</h3>
            <p className="text-gray-500 text-sm md:text-base">
              {searchQuery ? '搜尋結果為空，試下其他關鍵字' : '請稍後再嚟'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {filteredProducts.map((product) => {
              const merchant = merchants.find(m => m.id === product.merchantId);
              return (
                <div key={product.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition">
                  <div className="h-24 md:h-32 bg-gray-100 flex items-center justify-center">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl md:text-3xl">📦</span>
                    )}
                  </div>
                  <div className="p-2.5 md:p-3">
                    <div className="font-medium text-sm mb-1 line-clamp-2">{product.name}</div>
                    <div className="text-purple-600 font-bold">HK${product.price}</div>
                    <button 
                      onClick={() => handleAddToCart(product, merchant!)}
                      className="w-full mt-2 bg-purple-600 text-white py-1.5 md:py-2 rounded-lg text-sm hover:bg-purple-700"
                    >
                      加入購物車
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
