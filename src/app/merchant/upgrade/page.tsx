'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Crown, Check, ArrowLeft, CreditCard } from 'lucide-react';

const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: 168,
    description: '適合小型商戶開始網上業務',
    features: [
      '商品上架 (20件上限)',
      '接收預購訂單',
      '到店自取模式',
      '店內付費',
      '基本訂單管理',
    ],
    notIncluded: [
      '網上結算',
      '庫存追蹤',
      '優惠券功能',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 328,
    description: '適合發展中商戶，完整電商功能',
    features: [
      '無限商品上架',
      '網上結算功能',
      '付款確認預留貨物',
      '庫存追蹤系統',
      '優惠券功能',
      '高級數據分析',
      '優先客戶支援',
    ],
    notIncluded: [],
    popular: true,
  },
];

export default function UpgradePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleSelectPlan = async (planId: string) => {
    setSelectedPlan(planId);
    setLoading(true);
    
    // Simulate payment processing
    // In production, this would redirect to Stripe Checkout
    setTimeout(() => {
      alert(`你選擇了 ${planId === 'basic' ? 'Basic' : 'Pro'} 方案！\n\n在正式版本中，你會被引導到 Stripe 付款頁面。`);
      setLoading(false);
      router.push('/merchant/dashboard');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link 
            href="/merchant/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" /> 返回
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl mb-4">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">選擇你的方案</h1>
          <p className="text-gray-500">升級以解鎖更多功能</p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {PLANS.map((plan) => (
            <div 
              key={plan.id}
              className={`bg-white rounded-2xl shadow-sm overflow-hidden ${
                plan.popular 
                  ? 'ring-2 ring-purple-600' 
                  : ''
              }`}
            >
              {plan.popular && (
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-center py-2 text-sm font-semibold">
                  最受歡迎
                </div>
              )}
              
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="text-gray-500 text-sm">{plan.description}</p>
                </div>
                
                <div className="mb-6">
                  <span className="text-4xl font-bold">HK${plan.price}</span>
                  <span className="text-gray-500">/月</span>
                </div>
                
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                  {plan.notIncluded.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-400">
                      <span className="w-5 h-5 flex-shrink-0">✗</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                
                {plan.id === 'free' ? (
                  <div className="text-center py-3 bg-gray-100 text-gray-500 rounded-xl">
                    現正使用免費方案
                  </div>
                ) : (
                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={loading}
                    className={`w-full py-3 rounded-xl font-semibold transition ${
                      plan.popular
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    } disabled:opacity-50`}
                  >
                    {loading && selectedPlan === plan.id ? (
                      <span className="animate-pulse">處理中...</span>
                    ) : (
                      '選擇方案'
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Commission Info */}
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <p className="text-blue-800 text-sm">
            <strong>Pro 方案附加說明：</strong> 平台會收取每筆成功交易額的 5% 作為佣金
          </p>
        </div>

        {/* Payment Methods */}
        <div className="mt-6 flex items-center justify-center gap-4 text-gray-400">
          <CreditCard className="w-5 h-5" />
          <span className="text-sm">支援 Visa, Mastercard, FPS</span>
        </div>
      </div>
    </div>
  );
}
