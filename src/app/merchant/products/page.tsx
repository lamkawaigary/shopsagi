'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import Link from 'next/link';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  status: 'active' | 'inactive';
  createdAt: any;
}

export default function ProductsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchProducts(currentUser.uid);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">商品管理</h2>
        <Link
          href="/merchant/products/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" /> 新增商品
        </Link>
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

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-4xl mb-4">貨</div>
          <h3 className="text-lg font-semibold mb-2">暫時未有商品</h3>
          <p className="text-gray-500 mb-4">建立你既第一件商品開始銷售</p>
          <Link
            href="/merchant/products/new"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            新增商品
          </Link>
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
    </div>
  );
}
