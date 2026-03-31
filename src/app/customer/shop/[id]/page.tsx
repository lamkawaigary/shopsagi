'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useCart } from '@/lib/cart';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import Link from 'next/link';
import { MapPin, Phone, Star, ShoppingBag, Plus, Minus } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  merchantId: string;
  barcode?: string;
  inStock: boolean;
}

interface Merchant {
  id: string;
  shopName: string;
  description?: string;
  logoUrl?: string;
  phone?: string;
  address?: string;
}

export default function CustomerShopPage() {
  const params = useParams();
  const merchantId = params?.id as string;
  const { addItem } = useCart();
  
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchData = async () => {
      if (!merchantId || !db) return;

      // Fetch merchant info
      const merchantDoc = await getDoc(doc(db, 'merchants', merchantId));
      if (merchantDoc.exists()) {
        setMerchant({ id: merchantDoc.id, ...merchantDoc.data() } as Merchant);
      }

      // Fetch products from this merchant
      const productsQuery = query(
        collection(db, 'products'),
        where('merchantId', '==', merchantId)
      );
      const productsSnapshot = await getDocs(productsQuery);
      const productsList = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Product));
      setProducts(productsList);

      // Initialize quantities
      const initialQuantities: Record<string, number> = {};
      productsList.forEach(p => {
        initialQuantities[p.id] = 1;
      });
      setQuantities(initialQuantities);

      setLoading(false);
    };

    fetchData();
  }, [merchantId]);

  const handleAddToCart = (product: Product) => {
    const qty = quantities[product.id] || 1;
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: qty,
      merchantId: product.merchantId,
      merchantName: merchant?.shopName || '商戶',
      imageUrl: product.imageUrl
    });
    alert(`已加入 ${product.name} x${qty} 到購物車`);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(1, (prev[productId] || 1) + delta)
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">商戶不存在</p>
        <Link href="/customer" className="text-purple-600 hover:underline">
          返回商店
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Merchant Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
            {merchant.logoUrl ? (
              <img src={merchant.logoUrl} alt={merchant.shopName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl">🏪</span>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{merchant.shopName}</h1>
            {merchant.description && (
              <p className="text-gray-600 mt-1">{merchant.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              {merchant.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> {merchant.address}
                </span>
              )}
              {merchant.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4" /> {merchant.phone}
                </span>
              )}
            </div>
          </div>
          <Link href="/customer/cart" className="p-3 bg-purple-100 rounded-full">
            <ShoppingBag className="w-6 h-6 text-purple-600" />
          </Link>
        </div>
      </div>

      {/* Products */}
      <h2 className="text-xl font-bold mb-4">商品列表</h2>
      
      {products.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>暫時未有商品</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="h-32 md:h-40 bg-gray-100 flex items-center justify-center">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl">📦</span>
                )}
              </div>
              <div className="p-4">
                <div className="font-medium mb-1">{product.name}</div>
                {product.description && (
                  <p className="text-sm text-gray-500 mb-2 line-clamp-2">{product.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <div className="text-purple-600 font-bold">HK${product.price}</div>
                  {!product.inStock && (
                    <span className="text-xs text-red-500">缺貨</span>
                  )}
                </div>
                
                {/* Quantity selector */}
                <div className="flex items-center justify-center gap-3 mt-3">
                  <button
                    onClick={() => updateQuantity(product.id, -1)}
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center">{quantities[product.id] || 1}</span>
                  <button
                    onClick={() => updateQuantity(product.id, 1)}
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                <button
                  onClick={() => handleAddToCart(product)}
                  disabled={!product.inStock}
                  className="w-full mt-3 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  加入購物車
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}