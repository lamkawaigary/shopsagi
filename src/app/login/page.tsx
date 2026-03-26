'use client';

import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Store, Truck, Eye, EyeOff, Loader2 } from 'lucide-react';

type Role = 'customer' | 'merchant' | 'driver';

interface RoleConfig {
  id: Role;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  redirect: string;
}

const ROLES: RoleConfig[] = [
  {
    id: 'customer',
    title: '顧客',
    subtitle: '瀏覽商店・訂購商品',
    icon: <ShoppingCart className="w-8 h-8" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
    redirect: '/customer'
  },
  {
    id: 'merchant',
    title: '商戶',
    subtitle: '管理商品・處理訂單',
    icon: <Store className="w-8 h-8" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    redirect: '/merchant/dashboard'
  },
  {
    id: 'driver',
    title: '司機',
    subtitle: '接單配送・賺取收入',
    icon: <Truck className="w-8 h-8" />,
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200 hover:bg-green-100',
    redirect: '/driver/dashboard'
  }
];

export default function UnifiedLoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    if (!auth) {
      setCheckingAuth(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db!, 'users', user.uid));
        if (userDoc.exists()) {
          const role = userDoc.data().role;
          const redirectPath = ROLES.find(r => r.id === role)?.redirect || '/';
          router.replace(redirectPath);
          return;
        }
      }
      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole || !email || !password) {
      setError('請填寫所有欄位');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await signInWithEmailAndPassword(auth!, email, password);
      const userDoc = await getDoc(doc(db!, 'users', result.user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role === selectedRole) {
          router.push(ROLES.find(r => r.id === selectedRole)!.redirect);
        } else {
          setError(`此帳戶不是${ROLES.find(r => r.id === selectedRole)?.title}帳戶`);
          await auth!.signOut();
        }
      } else {
        setError('用戶不存在，請先註冊');
        await auth!.signOut();
      }
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError('帳戶不存在，請先註冊');
      } else if (err.code === 'auth/wrong-password') {
        setError('密碼錯誤');
      } else if (err.code === 'auth/invalid-email') {
        setError('無效的電子郵件');
      } else {
        setError('登入失敗，請稍後再試');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!selectedRole) {
      setError('請先選擇角色');
      return;
    }

    setError('');
    setGoogleLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth!, provider);
      const userDoc = await getDoc(doc(db!, 'users', result.user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role === selectedRole) {
          router.push(ROLES.find(r => r.id === selectedRole)!.redirect);
        } else {
          setError(`此 Google 帳戶是${ROLES.find(r => r.id === userData.role)?.title}帳戶，請選擇正確角色`);
          await auth!.signOut();
        }
      } else {
        setError('請先註冊一個帳戶');
        await auth!.signOut();
      }
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Google 登入失敗，請稍後再試');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedRole(null);
    setEmail('');
    setPassword('');
    setError('');
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-2xl mb-4 shadow-lg">
            <span className="text-2xl">🛒</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">ShopSagi 舖記</h1>
          <p className="text-gray-500 mt-1">登入以繼續</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          {!selectedRole ? (
            /* Role Selection */
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-6 text-center">
                選擇你的角色
              </h2>
              
              {ROLES.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${role.bgColor}`}
                >
                  <div className={`p-3 rounded-xl bg-white shadow-sm ${role.color}`}>
                    {role.icon}
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-semibold text-gray-900">{role.title}</div>
                    <div className="text-sm text-gray-500">{role.subtitle}</div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          ) : (
            /* Login Form */
            <div className="space-y-6">
              {/* Selected Role Badge */}
              <div className={`flex items-center gap-3 p-3 rounded-xl ${ROLES.find(r => r.id === selectedRole)?.bgColor}`}>
                <div className={`p-2 rounded-lg bg-white shadow-sm ${ROLES.find(r => r.id === selectedRole)?.color}`}>
                  {ROLES.find(r => r.id === selectedRole)?.icon}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">
                    {ROLES.find(r => r.id === selectedRole)?.title}
                  </div>
                  <div className="text-sm text-gray-500">
                    {ROLES.find(r => r.id === selectedRole)?.subtitle}
                  </div>
                </div>
                <button 
                  onClick={handleBack}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  更改
                </button>
              </div>

              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  電子郵件
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition"
                />
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  密碼
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                  {error}
                </div>
              )}

              {/* Login Button */}
              <button
                onClick={handleEmailLogin}
                disabled={loading}
                className="w-full py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  '登入'
                )}
              </button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">或</span>
                </div>
              </div>

              {/* Google Login */}
              <button
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="w-full py-3 bg-white border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {googleLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                使用 Google 登入
              </button>

              {/* Register Link */}
              <p className="text-center text-sm text-gray-500">
                還沒有帳戶？{' '}
                <a href="/register" className="text-purple-600 font-medium hover:underline">
                  立即註冊
                </a>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          登入即表示你同意我們的{' '}
          <a href="#" className="underline">服務條款</a> 和{' '}
          <a href="#" className="underline">私隱政策</a>
        </p>
      </div>
    </div>
  );
}
