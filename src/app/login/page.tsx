'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<'merchant' | 'customer'>('customer');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 md:p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">ShopSagi 舖記</h1>
        <p className="text-gray-600 mb-6 md:mb-8">選擇你的身份</p>

        <div className="space-y-3 md:space-y-4">
          <Link
            href="/merchant/login"
            className="block w-full p-4 md:p-6 border-2 border-blue-500 bg-blue-50 rounded-xl hover:bg-blue-100 transition"
          >
            <div className="text-3xl md:text-4xl mb-2">🏪</div>
            <div className="font-semibold text-lg">商戶登入</div>
            <div className="text-sm text-gray-600">管理店鋪同訂單</div>
          </Link>

          <Link
            href="/driver-signin"
            className="block w-full p-4 md:p-6 border-2 border-green-500 bg-green-50 rounded-xl hover:bg-green-100 transition"
          >
            <div className="text-3xl md:text-4xl mb-2">🚚</div>
            <div className="font-semibold text-lg">司機登入</div>
            <div className="text-sm text-gray-600">接單送貨賺錢</div>
          </Link>

          <Link
            href="/"
            className="block w-full p-4 md:p-6 border-2 border-purple-500 bg-purple-50 rounded-xl hover:bg-purple-100 transition"
          >
            <div className="text-3xl md:text-4xl mb-2">🛒</div>
            <div className="font-semibold text-lg">客戶購物</div>
            <div className="text-sm text-gray-600"> browse商戶同落單</div>
          </Link>
        </div>

        <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t">
          <Link href="/register" className="text-blue-600 hover:underline text-sm md:text-base">
            註冊新帳戶 →
          </Link>
        </div>
      </div>
    </div>
  );
}
