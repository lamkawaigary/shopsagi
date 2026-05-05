'use client';

import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingCart, Store, Truck, ChevronRight, Eye, EyeOff, Loader2, ArrowRight, CheckCircle, CreditCard, Headset } from 'lucide-react';

type Role = 'customer' | 'merchant' | 'driver';

interface RoleConfig {
  id: Role;
  title: string;
  titleEn: string;
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
    titleEn: 'Customer',
    subtitle: '瀏覽商店・訂購商品',
    icon: <ShoppingCart className="w-6 h-6" />,
    color: 'text-primary',
    bgColor: 'bg-surface-container',
    hoverBg: 'hover:bg-surface-container-high',
    iconBg: 'bg-primary-fixed-dim',
    redirect: '/customer'
  },
  {
    id: 'merchant',
    title: '商戶',
    titleEn: 'Merchant',
    subtitle: '管理商品・處理訂單',
    icon: <Store className="w-6 h-6" />,
    color: 'text-primary',
    bgColor: 'bg-surface-container',
    hoverBg: 'hover:bg-surface-container-high',
    iconBg: 'bg-primary-fixed-dim',
    redirect: '/merchant/dashboard'
  },
  {
    id: 'driver',
    title: '司機',
    titleEn: 'Driver',
    subtitle: '接單配送・賺取收入',
    icon: <Truck className="w-6 h-6" />,
    color: 'text-primary',
    bgColor: 'bg-surface-container',
    hoverBg: 'hover:bg-surface-container-high',
    iconBg: 'bg-primary-fixed-dim',
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

  const selectedRoleConfig = ROLES.find(r => r.id === selectedRole);

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-surface)' }}>
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

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
            為香港中小企<br />打造的專業電商平台
          </h2>
          <p className="text-white/70 text-lg mb-8 max-w-md">
            簡化您的網店運營，提升銷售效率，讓您專注於業務發展
          </p>
          
          {/* Feature Highlights */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-white/80">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-white/90" />
              </div>
              <span className="text-sm">Stripe 安全支付</span>
            </div>
            <div className="flex items-center gap-3 text-white/80">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-white/90" />
              </div>
              <span className="text-sm">實時數據分析</span>
            </div>
            <div className="flex items-center gap-3 text-white/80">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <Headset className="w-4 h-4 text-white/90" />
              </div>
              <span className="text-sm">24/7 客戶支援</span>
            </div>
          </div>
        </div>

        {/* Footer Quote */}
        <div className="relative z-10">
          <p className="text-white/40 text-sm">
            「 OpenShops 讓我的網店運營變得前所未有的簡單 」
          </p>
          <p className="text-white/60 text-xs mt-2">— 香港中小企店主</p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4">
              <Store className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-primary">OpenShops</h1>
            <p className="text-on-surface-variant text-sm mt-1">專業電商平台</p>
          </div>

          {/* Form Card */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-8 shadow-lg">
            {!selectedRole ? (
              /* Role Selection */
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="font-h1 text-primary mb-2">歡迎回來</h2>
                  <p className="text-on-surface-variant text-sm">選擇你的角色以繼續登入</p>
                </div>
                
                <div className="space-y-3">
                  {ROLES.map((role) => (
                    <button
                      key={role.id}
                      onClick={() => setSelectedRole(role.id)}
                      className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${role.bgColor} ${role.hoverBg} border-transparent hover:border-primary`}
                    >
                      <div className={`w-12 h-12 rounded-xl ${role.iconBg} flex items-center justify-center`}>
                        <div className={role.color}>{role.icon}</div>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-label-md text-primary">{role.title}</div>
                        <div className="text-sm text-on-surface-variant">{role.subtitle}</div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-on-surface-variant" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Login Form */
              <div className="space-y-6">
                {/* Selected Role Badge */}
                <button 
                  onClick={handleBack}
                  className={`w-full p-4 rounded-xl ${selectedRoleConfig?.bgColor} border-2 border-transparent hover:border-primary transition-all flex items-center gap-4`}
                >
                  <div className={`w-12 h-12 rounded-xl ${selectedRoleConfig?.iconBg} flex items-center justify-center`}>
                    <div className={selectedRoleConfig?.color}>{selectedRoleConfig?.icon}</div>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-label-md text-primary">{selectedRoleConfig?.title}</div>
                    <div className="text-sm text-on-surface-variant">{selectedRoleConfig?.subtitle}</div>
                  </div>
                  <span className="text-primary text-sm font-medium">更改</span>
                </button>

                {/* Divider */}
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-outline-variant"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-4 bg-surface-container-lowest text-sm text-on-surface-variant">會員登入</span>
                  </div>
                </div>

                {/* Email Input */}
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
                  />
                </div>

                {/* Password Input */}
                <div>
                  <label className="block font-label-sm text-primary mb-2">
                    密碼
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input pr-12"
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

                {/* Error Message */}
                {error && (
                  <div className="p-3 rounded-xl bg-error-container text-error text-sm flex items-center gap-2">
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                {/* Login Button */}
                <button
                  onClick={handleEmailLogin}
                  disabled={loading}
                  className="btn btn-primary w-full py-3 text-base"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      登入
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                {/* Google Login */}
                <button
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
                      使用 Google 登入
                    </>
                  )}
                </button>

                {/* Register Link */}
                <p className="text-center text-sm text-on-surface-variant">
                  還沒有帳戶？{' '}
                  <Link href="/register" className="text-primary font-medium hover:underline">
                    立即註冊
                  </Link>
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-on-surface-variant mt-6">
            登入即表示你同意我們的{' '}
            <a href="#" className="underline">服務條款</a> 和{' '}
            <a href="#" className="underline">私隱政策</a>
          </p>
        </div>
      </div>
    </div>
  );
}
