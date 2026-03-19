'use client';

import { useCart } from '@/lib/cart';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, total } = useCart();
  const router = useRouter();

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">購物車</div>
        <h2 className="text-xl font-bold mb-2">購物車係咁</h2>
        <p className="text-gray-500 mb-6">去shopping啦</p>
        <Link
          href="/customer"
          className="inline-block px-6 py-3 bg-purple-600 text-white rounded-full hover:bg-purple-700"
        >
          去shopping
        </Link>
      </div>
    );
  }

  // Group items by merchant
  const itemsByMerchant = items.reduce((acc, item) => {
    if (!acc[item.merchantName]) {
      acc[item.merchantName] = [];
    }
    acc[item.merchantName].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">購物車</h2>
        <button
          onClick={clearCart}
          className="text-sm text-red-600 hover:underline"
        >
          清空購物車
        </button>
      </div>

      <div className="space-y-6">
        {Object.entries(itemsByMerchant).map(([merchantName, merchantItems]) => (
          <div key={merchantName} className="bg-white rounded-xl shadow-sm p-4">
            <div className="font-semibold mb-3 pb-2 border-b">
              商戶: {merchantName}
            </div>
            <div className="space-y-3">
              {merchantItems.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <span className="text-2xl">📦</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-purple-600 font-bold">HK${item.price}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200"
                    >
                      -
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="bg-white rounded-xl shadow-sm p-4 mt-6">
        <div className="flex justify-between items-center text-xl font-bold">
          <span>總金額：</span>
          <span className="text-purple-600">HK${total}</span>
        </div>
      </div>

      {/* Checkout Button */}
      <button
        onClick={() => router.push('/customer/checkout')}
        className="w-full mt-6 py-4 bg-purple-600 text-white rounded-xl font-bold text-lg hover:bg-purple-700"
      >
        去結帳
      </button>
    </div>
  );
}
