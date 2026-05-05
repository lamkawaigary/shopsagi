'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useCart } from '@/lib/cart';
import { useToast } from '@/components/Toast';
import Link from 'next/link';
import { 
  MapPin, Phone, Star, ShoppingBag, Plus, Minus, 
  ArrowLeft, Crown, Package, CheckCircle
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  merchantId: string;
  barcode?: string;
  stock?: number;
  status?: string;
  category?: string;
}

interface Merchant {
  id: string;
  shopName: string;
  description?: string;
  logoUrl?: string;
  phone?: string;
  address?: string;
  plan?: 'free' | 'pro';
  rating?: number;
}

export default function CustomerShopPage() {
  const params = useParams();
  const merchantId = params?.id as string;
  const { addItem } = useCart();
  const { showToast } = useToast();
  
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!merchantId || !db) return;

      try {
        // Fetch merchant info
        const merchantDoc = await getDoc(doc(db, 'merchants', merchantId));
        if (merchantDoc.exists()) {
          setMerchant({ id: merchantDoc.id, ...merchantDoc.data() } as Merchant);
        }

        // Fetch products from this merchant
        const productsQuery = query(
          collection(db, 'products'),
          where('merchantId', '==', merchantId),
          where('status', '==', 'active')
        );
        const productsSnapshot = await getDocs(productsQuery);
        const productsList = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Product));
        setProducts(productsList);
        setFilteredProducts(productsList);

        // Extract categories
        const cats = [...new Set(productsList.map(p => p.category).filter(Boolean))];
        setCategories(cats as string[]);

        // Initialize quantities
        const initialQuantities: Record<string, number> = {};
        productsList.forEach(p => {
          initialQuantities[p.id] = 1;
        });
        setQuantities(initialQuantities);
      } catch (error) {
        console.error('Error fetching data:', error);
      }

      setLoading(false);
    };

    fetchData();
  }, [merchantId]);

  // Filter by category
  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter(p => p.category === selectedCategory));
    }
  }, [selectedCategory, products]);

  const handleAddToCart = (product: Product) => {
    const qty = quantities[product.id] || 1;
    const stock = product.stock ?? 999;
    
    if (qty > stock) {
      showToast('庫存不足', 'error');
      return;
    }
    
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: qty,
      merchantId: product.merchantId,
      merchantName: merchant?.shopName || '商戶',
      imageUrl: product.imageUrl,
    });
    showToast(`已加入購物車：${product.name} x${qty}`);
  };

  const updateQuantity = (productId: string, delta: number, maxStock: number) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(1, Math.min(maxStock, (prev[productId] || 1) + delta))
    }));
  };

  const getStockStatus = (stock?: number) => {
    if (stock === undefined || stock >= 10) return { text: '有現貨', color: 'text-green-600', bg: 'bg-green-100' };
    if (stock > 0) return { text: `僅剩 ${stock} 件`, color: 'text-amber-600', bg: 'bg-amber-100' };
    return { text: '缺貨', color: 'text-red-600', bg: 'bg-red-100' };
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-xl font-bold mb-2">商戶不存在</h2>
          <Link href="/customer" className="btn btn-primary mt-4">
            返回商店
          </Link>
        </div>
      </div>
    );
  }

  const stockStatus = getStockStatus();

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="gradient-bg px-4 pt-6 pb-8">
        <div className="flex items-center gap-4 mb-6">
          <Link 
            href="/customer"
            className="p-3 bg-white/80 rounded-2xl shadow-md hover:bg-white transition"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{merchant.shopName}</h1>
              {merchant.plan === 'pro' && (
                <span className="badge badge-pro">
                  <Crown className="w-3 h-3" /> PRO
                </span>
              )}
            </div>
            {merchant.address && (
              <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                <MapPin className="w-4 h-4" />
                <span>{merchant.address}</span>
              </div>
            )}
          </div>
          <Link 
            href="/customer/cart"
            className="p-3 bg-white/80 rounded-2xl shadow-md hover:bg-white transition relative"
          >
            <ShoppingBag className="w-5 h-5 text-purple-600" />
          </Link>
        </div>

        {/* Merchant Info Card */}
        <div className="bg-white rounded-2xl shadow-lg p-4 flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center overflow-hidden">
            {merchant.logoUrl ? (
              <img src={merchant.logoUrl} alt={merchant.shopName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl">商</span>
            )}
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900">{merchant.shopName}</div>
            {merchant.description && (
              <div className="text-sm text-gray-500 line-clamp-2 mt-1">{merchant.description}</div>
            )}
            {merchant.rating && (
              <div className="flex items-center gap-1 mt-2">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-sm font-medium">{merchant.rating.toFixed(1)}</span>
                <span className="text-sm text-gray-400">評分</span>
              </div>
            )}
          </div>
          {merchant.phone && (
            <a 
              href={`tel:${merchant.phone}`}
              className="p-3 bg-purple-100 rounded-2xl"
            >
              <Phone className="w-5 h-5 text-purple-600" />
            </a>
          )}
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="px-4 -mt-4 mb-4">
          <div className="bg-white rounded-2xl shadow-lg p-3 flex gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedCategory === 'all'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              全部
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Products */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">
            商品列表
          </h2>
          <span className="text-sm text-gray-400">{filteredProducts.length} 件</span>
        </div>
        
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <Package className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="font-semibold text-lg mb-2">暫時未有商品</h3>
            <p className="text-gray-500 text-sm">商戶尚未上架任何商品</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => {
              const stock = product.stock ?? 999;
              const inStock = stock > 0;
              const status = getStockStatus(stock);
              const qty = quantities[product.id] || 1;
              
              return (
                <div key={product.id} className="bg-white rounded-2xl shadow-sm overflow-hidden card-hover">
                  {/* Image */}
                  <div className="h-36 bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center relative overflow-hidden">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                    ) : (
                      <span className="text-4xl opacity-30">📦</span>
                    )}
                    {!inStock && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">缺貨</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="p-4">
                    <div className="font-semibold text-gray-900 line-clamp-2 text-sm mb-1 min-h-[2.5rem]">
                      {product.name}
                    </div>
                    
                    {/* Price */}
                    <div className="text-lg font-bold text-purple-600 mb-2">
                      HK${product.price}
                    </div>
                    
                    {/* Stock Status */}
                    <div className={`text-xs px-2 py-1 rounded-full inline-flex items-center gap-1 ${status.bg} ${status.color}`}>
                      {inStock ? <CheckCircle className="w-3 h-3" /> : null}
                      {status.text}
                    </div>
                    
                    {/* Quantity Selector */}
                    {inStock && (
                      <div className="flex items-center justify-center gap-3 mt-3">
                        <button
                          onClick={() => updateQuantity(product.id, -1, stock)}
                          disabled={qty <= 1}
                          className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition disabled:opacity-50"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-medium">{qty}</span>
                        <button
                          onClick={() => updateQuantity(product.id, 1, stock)}
                          disabled={qty >= stock}
                          className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition disabled:opacity-50"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    
                    {/* Add to Cart */}
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={!inStock}
                      className="w-full mt-3 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium shadow-md hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      {inStock ? '加入購物車' : '缺貨'}
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
