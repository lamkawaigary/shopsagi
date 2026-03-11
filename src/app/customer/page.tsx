'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const DEMO_MERCHANTS = [
  { id: '1', shopName: '明記茶餐廳', description: '港式奶茶同多士' },
  { id: '2', shopName: '潮汕牛肉火鍋', description: '新鮮牛肉片' },
  { id: '3', shopName: '日本拉麵店', description: '濃郁湯底' },
  { id: '4', shopName: '泰式料理', description: '正宗泰國菜' },
];

const DEMO_PRODUCTS = [
  { id: '1', merchantId: '1', name: '港式奶茶', price: 28, category: '飲品' },
  { id: '2', merchantId: '1', name: '牛油多士', price: 18, category: '食品' },
  { id: '3', merchantId: '2', name: '肥牛火鍋套餐', price: 168, category: '食品' },
  { id: '4', merchantId: '3', name: '豚骨拉麵', price: 88, category: '食品' },
  { id: '5', merchantId: '4', name: '泰式青咖喱', price: 78, category: '食品' },
  { id: '6', merchantId: '1', name: '菠蘿包', price: 15, category: '食品' },
];

export default function CustomerHomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['all', '食品', '飲品', '生活用品', '電子產品', '服裝', '美妝', '運動', '家居', '其他'];

  const filteredProducts = DEMO_PRODUCTS.filter(p => {
    const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

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
      <div className="mb-6 md:mb-8">
        <h2 className="text-lg md:text-2xl font-bold mb-3 md:mb-4">熱門商戶</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {DEMO_MERCHANTS.map((merchant) => (
            <Link
              key={merchant.id}
              href={`/customer/shop/${merchant.id}`}
              className="bg-white rounded-xl shadow-sm p-3 md:p-4 hover:shadow-md transition"
            >
              <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-full mx-auto mb-2 md:mb-3 flex items-center justify-center">
                <span className="text-xl md:text-2xl">🏪</span>
              </div>
              <div className="text-center font-medium text-sm md:text-base">{merchant.shopName}</div>
              <div className="text-center text-xs md:text-sm text-gray-500 truncate">{merchant.description}</div>
            </Link>
          ))}
        </div>
      </div>

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
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition">
                <div className="h-24 md:h-32 bg-gray-100 flex items-center justify-center">
                  <span className="text-2xl md:text-3xl">📦</span>
                </div>
                <div className="p-2.5 md:p-3">
                  <div className="font-medium text-sm mb-1 line-clamp-2">{product.name}</div>
                  <div className="text-purple-600 font-bold">HK${product.price}</div>
                  <button className="w-full mt-2 bg-purple-600 text-white py-1.5 md:py-2 rounded-lg text-sm hover:bg-purple-700">
                    加入購物車
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
