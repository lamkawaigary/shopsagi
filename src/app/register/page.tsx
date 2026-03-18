'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createUserWithEmailAndPassword, signInWithPopup, signInWithRedirect, GoogleAuthProvider, getRedirectResult, onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState<'customer' | 'merchant' | 'driver'>('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [shopName, setShopName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Check if user is already logged in and has a role
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
          // Check if user already has a role in database
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            // User already has a role - redirect to appropriate dashboard
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
          // User is logged in but no role - stay on register page
          // They need to select a role
        }
        
        setLoading(false);
      });
    };

    checkExistingSession();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [router, db]);

  // Handle redirect result on page load (for Google redirect login)
  useEffect(() => {
    const handleRedirectResult = async () => {
      if (!auth || !db || !currentUser) return;
      
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          // Process the result - user just came from Google redirect
          await processGoogleUser(result.user);
        }
      } catch (err: any) {
        console.error('Redirect result error:', err);
        if (err.code !== 'auth/no-auth-event') {
          setError('登入失敗，請重試');
        }
      }
    };

    handleRedirectResult();
  }, [currentUser]);

  // Process Google user - create or update their role in database
  const processGoogleUser = async (user: User) => {
    if (!db) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        // Already has a role
        if (userData.role === 'customer') {
          router.replace('/customer');
        } else if (userData.role === 'merchant') {
          router.replace('/merchant/dashboard');
        } else if (userData.role === 'driver') {
          router.replace('/driver/dashboard');
        }
      } else {
        // New user - save role to database
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          role,
          shopName: role === 'merchant' ? shopName : null,
          name: user.displayName || null,
          createdAt: new Date().toISOString(),
        });

        // Create driver-specific document if driver
        if (role === 'driver') {
          await setDoc(doc(db, 'drivers', user.uid), {
            email: user.email,
            name: user.displayName || '',
            todayEarnings: 0,
            todayCompleted: 0,
            weekEarnings: 0,
            totalEarnings: 0,
            rating: 5.0,
            createdAt: new Date().toISOString(),
          });
        }

        // Redirect based on role
        if (role === 'customer') {
          router.replace('/customer');
        } else if (role === 'merchant') {
          router.replace('/merchant/dashboard');
        } else {
          router.replace('/driver/dashboard');
        }
      }
    } catch (err) {
      console.error('Error processing Google user:', err);
      setError('處理登入時出錯，請再試過');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!auth) {
      setError('系統暫時不可用，請稍後再試');
      return;
    }

    if (!currentUser) {
      // Email/password registration
      if (password !== confirmPassword) {
        setError('密碼唔匹配');
        return;
      }

      if (password.length < 6) {
        setError('密碼至少要6個字');
        return;
      }

      setLoading(true);
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Save role to Firestore
        await setDoc(doc(db!, 'users', userCredential.user.uid), {
          email: userCredential.user.email,
          role,
          shopName: role === 'merchant' ? shopName : null,
          name: userCredential.user.displayName || null,
          createdAt: new Date().toISOString(),
        });

        // Create driver-specific document if driver
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

        // Redirect based on role
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

  // Check if browser is Safari
  const isSafari = typeof window !== 'undefined' && 
    /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  const handleGoogleLogin = async () => {
    if (!auth || !db) {
      setError('系統暫時不可用，請稍後再試');
      return;
    }
    
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ 
        prompt: 'select_account' 
      });
      
      if (isSafari) {
        await signInWithRedirect(auth, provider);
        return;
      }
      
      try {
        const result = await signInWithPopup(auth, provider);
        await processGoogleUser(result.user);
      } catch (popupErr: any) {
        if (popupErr.code === 'auth/popup-blocked' || popupErr.code === 'auth/cancelled-popup-request') {
          await signInWithRedirect(auth, provider);
        } else {
          throw popupErr;
        }
      }
    } catch (err: any) {
      console.error('Google login error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('登入視窗被關閉，請重試');
      } else {
        setError(err.message || 'Google登入失敗');
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-800">載入緊...</p>
        </div>
      </div>
    );
  }

  // Get colors based on selected role
  const getRoleColor = () => {
    switch (role) {
      case 'customer': return 'purple';
      case 'merchant': return 'blue';
      case 'driver': return 'green';
    }
  };
  const roleColor = getRoleColor();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/" className={`text-2xl font-bold text-${roleColor}-600`}>
            🛒 ShopSagi 舖記
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">建立帳戶</h1>
          <p className="text-gray-800 mb-6">
            {currentUser 
              ? `以 ${currentUser.email} 建立帳戶` 
              : '選擇你的身份開始'}
          </p>

          {/* Role Selection */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            <button
              type="button"
              onClick={() => setRole('customer')}
              className={`p-3 rounded-lg border-2 text-center transition ${
                role === 'customer' 
                  ? 'border-purple-500 bg-purple-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-1">🛒</div>
              <div className={`text-sm font-medium ${role === 'customer' ? 'text-purple-600' : 'text-gray-800'}`}>
                顧客
              </div>
            </button>
            <button
              type="button"
              onClick={() => setRole('merchant')}
              className={`p-3 rounded-lg border-2 text-center transition ${
                role === 'merchant' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-1">🏪</div>
              <div className={`text-sm font-medium ${role === 'merchant' ? 'text-blue-600' : 'text-gray-800'}`}>
                商戶
              </div>
            </button>
            <button
              type="button"
              onClick={() => setRole('driver')}
              className={`p-3 rounded-lg border-2 text-center transition ${
                role === 'driver' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-1">🚚</div>
              <div className={`text-sm font-medium ${role === 'driver' ? 'text-green-600' : 'text-gray-800'}`}>
                司機
              </div>
            </button>
          </div>

          {/* Shop name for merchants */}
          {role === 'merchant' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                店鋪名稱 *
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="輸入你嘅店鋪名稱"
                required
              />
            </div>
          )}

          {/* Only show email/password form if NOT logged in with Google */}
          {!currentUser && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="your@email.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  密碼
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="至少6個字"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  確認密碼
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="再輸入一次密碼"
                  required
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 ${
                  role === 'customer' ? 'bg-purple-600' : role === 'merchant' ? 'bg-blue-600' : 'bg-green-600'
                }`}
              >
                {loading ? '處理緊...' : '建立帳戶'}
              </button>
            </form>
          )}

          {/* If user is already logged in via Google, show simplified registration */}
          {currentUser && (
            <div className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={() => processGoogleUser(currentUser)}
                disabled={loading}
                className={`w-full py-3 text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 ${
                  role === 'customer' ? 'bg-purple-600' : role === 'merchant' ? 'bg-blue-600' : 'bg-green-600'
                }`}
              >
                {loading ? '處理緊...' : `以 ${role === 'customer' ? '顧客' : role === 'merchant' ? '商戶' : '司機'} 身份繼續`}
              </button>
            </div>
          )}

          {/* Divider - only show if not logged in */}
          {!currentUser && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-700">或</span>
                </div>
              </div>

              {/* Google Login */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google 帳戶登入
              </button>
            </>
          )}
        </div>

        {/* Login Links */}
        <div className="text-center mt-6 space-y-2">
          <p className="text-gray-800">
            已經有帳戶？{' '}
            <Link 
              href={role === 'customer' ? '/login/customer' : role === 'merchant' ? '/login/merchant' : '/login/driver'} 
              className={`font-medium hover:underline ${
                role === 'customer' ? 'text-purple-600' : role === 'merchant' ? 'text-blue-600' : 'text-green-600'
              }`}
            >
              登入 →
            </Link>
          </p>
          <div className="text-sm text-gray-700 pt-2 border-t">
            <span className="mr-2">其他身份：</span>
            {role !== 'customer' && <Link href="/login/customer" className="text-purple-600 hover:underline mr-3">顧客登入</Link>}
            {role !== 'merchant' && <Link href="/login/merchant" className="text-blue-600 hover:underline mr-3">商戶登入</Link>}
            {role !== 'driver' && <Link href="/login/driver" className="text-green-600 hover:underline">司機登入</Link>}
          </div>
        </div>
      </div>
    </div>
  );
}
