'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { ShoppingCart, Store, Truck, ChevronRight, Eye, EyeOff, Loader2, ArrowRight, CheckCircle, Gift, CreditCard, Headset } from 'lucide-react';

type Role = 'customer' | 'merchant' | 'driver';

interface RoleConfig {
  id: Role;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  bgColor: string;
  iconBg: string;
  redirect: string;
}

const ROLES: RoleConfig[] = [
  {
    id: 'customer',
    title: '顧客',
    subtitle: '瀏覽商店・訂購商品',
    icon: <ShoppingCart className="w-6 h-6" />,
    bgColor: 'bg-surface-container',
    iconBg: 'bg-primary-fixed-dim',
    redirect: '/customer'
  },
  {
    id: 'merchant',
    title: '商戶',
    subtitle: '管理商品・處理訂單',
    icon: <Store className="w-6 h-6" />,
    bgColor: 'bg-surface-container',
    iconBg: 'bg-primary-fixed-dim',
    redirect: '/merchant/dashboard'
  },
  {
    id: 'driver',
    title: '司機',
    subtitle: '接單配送・賺取收入',
    icon: <Truck className="w-6 h-6" />,
    bgColor: 'bg-surface-container',
    iconBg: 'bg-primary-fixed-dim',
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
            userId: userCredential.user.uid,
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
            userId: userCredential.user.uid,
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
            userId: result.user.uid,
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
            userId: result.user.uid,
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

  if (loading && !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-surface)' }}>
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const selectedRoleConfig = ROLES.find(r => r.id === role);

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-surface)' }}>
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-white/5 rounded-full blur-3xl"></div>
        
        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
              <Store className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">OpenShops</h1>
          </div>
          <p className="text-white/60 text-sm ml-1">專業電商平台</p>
        </div>

        {/* Main Content */}
        <div className="relative z-10">
          <h2 className="text-white text-4xl font-bold mb-4 leading-tight">
            開始您的<br />電商之旅
          </h2>
          <p className="text-white/70 text-lg mb-8 max-w-md">
            免費註冊，立即享用專業電商工具，讓您的生意做大做強
          </p>
          
          {/* Benefits */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-white/80">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-secondary-fixed" />
              </div>
              <span className="text-sm">免費開店，無隱藏費用</span>
            </div>
            <div className="flex items-center gap-3 text-white/80">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-secondary-fixed" />
              </div>
              <span className="text-sm">專業數據分析工具</span>
            </div>
            <div className="flex items-center gap-3 text-white/80">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <Gift className="w-4 h-4 text-secondary-fixed" />
              </div>
              <span className="text-sm">Stripe 安全支付整合</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-white/40 text-sm">
            已有超過 1,000+ 商戶加入 OpenShops
          </p>
        </div>
      </div>

      {/* Right Panel - Registration Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4">
              <Store className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-primary">OpenShops</h1>
            <p className="text-on-surface-variant text-sm mt-1">建立新帳戶</p>
          </div>

          {/* Form Card */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-8 shadow-lg">
            <div className="text-center mb-8">
              <h2 className="font-h1 text-primary mb-2">建立帳戶</h2>
              <p className="text-on-surface-variant text-sm">選擇你的身份開始</p>
            </div>

            {/* Role Selection */}
            <div className="mb-6">
              <label className="block font-label-sm text-primary mb-3">
                選擇你的身份
              </label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id)}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      role === r.id
                        ? `border-primary ${r.bgColor}`
                        : 'border-transparent bg-surface-high hover:bg-surface-container'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center ${
                      role === r.id ? r.iconBg : 'bg-surface-container-high'
                    }`}>
                      <div className={role === r.id ? 'text-primary' : 'text-on-surface-variant'}>{r.icon}</div>
                    </div>
                    <div className={`text-sm font-label-md ${role === r.id ? 'text-primary' : 'text-on-surface-variant'}`}>
                      {r.title}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Shop name for merchants */}
            {role === 'merchant' && (
              <div className="mb-4">
                <label className="block font-label-sm text-primary mb-2">
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
                  <label className="block font-label-sm text-primary mb-2">
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
                  <label className="block font-label-sm text-primary mb-2">
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition p-1"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block font-label-sm text-primary mb-2">
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
                  <div className="p-3 rounded-xl bg-error-container text-error text-sm flex items-center gap-2">
                    <span className="text-sm">{error}</span>
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
                      建立帳戶
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Divider */}
            <div className="relative py-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-surface-container-lowest text-sm text-on-surface-variant">或</span>
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
            <p className="text-on-surface-variant">
              已經有帳戶？{' '}
              <Link href="/login" className="text-primary font-medium hover:underline">
                登入 →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
