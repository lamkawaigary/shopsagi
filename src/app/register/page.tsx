'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, getRedirectResult, onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { ShoppingCart, ShoppingBag, Store, Truck, Eye, EyeOff, Loader2, ArrowRight, Check } from 'lucide-react';

type Role = 'customer' | 'merchant' | 'driver';

interface RoleConfig {
  id: Role;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  hoverBg: string;
  iconBg: string;
  redirect: string;
}

const ROLES: RoleConfig[] = [
  {
    id: 'customer',
    title: '顧客',
    subtitle: '瀏覽商店・訂購商品',
    icon: <ShoppingBag className="w-7 h-7" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    hoverBg: 'hover:bg-purple-100',
    iconBg: 'bg-purple-100',
    redirect: '/customer'
  },
  {
    id: 'merchant',
    title: '商戶',
    subtitle: '管理商品・處理訂單',
    icon: <Store className="w-7 h-7" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    hoverBg: 'hover:bg-blue-100',
    iconBg: 'bg-blue-100',
    redirect: '/merchant/dashboard'
  },
  {
    id: 'driver',
    title: '司機',
    subtitle: '接單配送・賺取收入',
    icon: <Truck className="w-7 h-7" />,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    hoverBg: 'hover:bg-emerald-100',
    iconBg: 'bg-emerald-100',
    redirect: '/driver/dashboard'
  }
];

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [shopName, setShopName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    let unsubscribe: () => void;

    const checkExistingSession = async () => {
      if (!auth || !db) {
        setLoading(false);
        return;
      }

      unsubscribe = onAuthStateChanged(auth!, async (user) => {
        setCurrentUser(user);
        
        if (user && db) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.role === 'customer') {
              router.replace('/customer');
              return;
            } else if (userData.role === 'merchant') {
              router.replace('/merchant/dashboard');
              return;
            } else if (userData.role === 'driver') {
              router.replace('/driver/dashboard');
              return;
            }
          }
        }
        
        setLoading(false);
      });
    };

    checkExistingSession();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!auth) {
      setError('系統暫時不可用，請稍後再試');
      return;
    }

    if (!currentUser) {
      if (password !== confirmPassword) {
        setError('密碼唔匹配');
        return;
      }

      if (password.length < 6) {
        setError('密碼至少要6個字');
        return;
      }

      if (role === 'merchant' && !shopName.trim()) {
        setError('請輸入店鋪名稱');
        return;
      }

      setLoading(true);
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        await setDoc(doc(db!, 'users', userCredential.user.uid), {
          email: userCredential.user.email,
          role,
          shopName: role === 'merchant' ? shopName : null,
          name: userCredential.user.displayName || null,
          createdAt: new Date().toISOString(),
        });

        if (role === 'merchant') {
          await setDoc(doc(db!, 'merchants', userCredential.user.uid), {
            email: userCredential.user.email,
            shopName: shopName,
            plan: 'free',
            status: 'active',
            createdAt: new Date().toISOString(),
          });
        }

        if (role === 'driver') {
          await setDoc(doc(db!, 'drivers', userCredential.user.uid), {
            email: userCredential.user.email,
            name: userCredential.user.displayName || '',
            todayEarnings: 0,
            todayCompleted: 0,
            weekEarnings: 0,
            totalEarnings: 0,
            rating: 5.0,
            createdAt: new Date().toISOString(),
          });
        }

        if (role === 'customer') {
          router.replace('/customer');
        } else if (role === 'merchant') {
          router.replace('/merchant/dashboard');
        } else {
          router.replace('/driver/dashboard');
        }
      } catch (err: any) {
        console.error('Register error:', err);
        if (err.code === 'auth/email-already-in-use') {
          setError('呢個email已經註冊咗');
        } else {
          setError(err.message || '註冊失敗');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGoogleLogin = async () => {
    if (!auth || !db) {
      setError('系統暫時不可用，請稍後再試');
      return;
    }
    
    setError('');
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role === 'customer') {
          router.replace('/customer');
        } else if (userData.role === 'merchant') {
          router.replace('/merchant/dashboard');
        } else if (userData.role === 'driver') {
          router.replace('/driver/dashboard');
        }
      } else {
        await setDoc(doc(db, 'users', result.user.uid), {
          email: result.user.email,
          role,
          shopName: role === 'merchant' ? shopName : null,
          name: result.user.displayName || null,
          createdAt: new Date().toISOString(),
        });

        if (role === 'merchant') {
          await setDoc(doc(db, 'merchants', result.user.uid), {
            email: result.user.email,
            shopName: shopName,
            plan: 'free',
            status: 'active',
            createdAt: new Date().toISOString(),
          });
        }

        if (role === 'driver') {
          await setDoc(doc(db, 'drivers', result.user.uid), {
            email: result.user.email,
            name: result.user.displayName || '',
            todayEarnings: 0,
            todayCompleted: 0,
            weekEarnings: 0,
            totalEarnings: 0,
            rating: 5.0,
            createdAt: new Date().toISOString(),
          });
        }

        if (role === 'customer') {
          router.replace('/customer');
        } else if (role === 'merchant') {
          router.replace('/merchant/dashboard');
        } else {
          router.replace('/driver/dashboard');
        }
      }
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Google登入失敗');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
      </div>
    );
  }

  const selectedRoleConfig = ROLES.find(r => r.id === role);

  return (
    <div className="min-h-screen gradient-bg p-4">
      <div className="max-w-md mx-auto pt-8">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl mb-4 shadow-xl">
            <span className="text-4xl">🛒</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            ShopSagi 舖記
          </h1>
          <p className="text-gray-500 mt-2">建立新帳戶</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          {/* Role Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              選擇你的身份
            </label>
            <div className="grid grid-cols-3 gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={`p-3 rounded-2xl border-2 text-center transition-all ${
                    role === r.id
                      ? `border-2 ${r.color.replace('text-', 'border-')} ${r.bgColor}`
                      : 'border-transparent bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className={`mx-auto w-10 h-10 rounded-xl ${role === r.id ? r.iconBg : 'bg-gray-100'} ${role === r.id ? r.color : 'text-gray-400'} flex items-center justify-center mb-1`}>
                    {r.icon}
                  </div>
                  <div className={`text-sm font-medium ${role === r.id ? 'text-gray-900' : 'text-gray-500'}`}>
                    {r.title}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Shop name for merchants */}
          {role === 'merchant' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                店鋪名稱 *
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="輸入你嘅店鋪名稱"
                className="input"
                required
              />
            </div>
          )}

          {/* Form */}
          {!currentUser && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  電子郵件
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="input"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  密碼
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="至少6個字"
                    className="input pr-12"
                    required
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  確認密碼
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再輸入一次密碼"
                  className="input"
                  required
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full py-3 text-base"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    建立帳戶 <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="relative py-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-white text-sm text-gray-400">或</span>
            </div>
          </div>

          {/* Google Login */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="btn btn-outline w-full py-3 text-base"
          >
            {googleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                使用 Google 帳戶登入
              </>
            )}
          </button>
        </div>

        {/* Login Link */}
        <div className="text-center mt-6">
          <p className="text-gray-500">
            已經有帳戶？{' '}
            <Link 
              href="/login" 
              className="text-purple-600 font-medium hover:underline"
            >
              登入 →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
