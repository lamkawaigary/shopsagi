'use client';

import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';

export default function DriverLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in and redirect if needed
  useEffect(() => {
    if (!auth || !db) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth!, async (user) => {
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

    return () => unsubscribe();
  }, [router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) {
      setError('系統暫時不可用，請稍後再試');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role === 'driver') {
          window.location.href = '/driver/dashboard';
        } else if (userData.role === 'customer') {
          await auth.signOut();
          setError('呢個帳戶唔係司機帳戶，請用顧客帳戶登入');
          setLoading(false);
        } else if (userData.role === 'merchant') {
          await auth.signOut();
          setError('呢個帳戶唔係司機帳戶，請用商戶帳戶登入');
          setLoading(false);
        } else {
          await auth.signOut();
          setError('帳戶未設定角色，請重新註冊');
          setLoading(false);
        }
      } else {
        await auth.signOut();
        setError('呢個帳戶未註冊，請先註冊');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/invalid-credential') {
        setError('Email或密碼錯誤');
      } else {
        setError(err.message || '登入失敗');
      }
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!auth || !db) {
      setError('系統暫時不可用，請稍後再試');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await handleGoogleSuccess(result);
    } catch (err: any) {
      console.error('Google login error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('登入視窗被關閉，請重試');
      } else {
        setError(err.message || 'Google登入失敗');
      }
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (result: any) => {
    const user = result.user;
    const userDoc = await getDoc(doc(db!, 'users', user.uid));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (userData.role === 'driver') {
        window.location.href = '/driver/dashboard';
      } else if (userData.role === 'customer') {
        window.location.href = '/customer';
      } else if (userData.role === 'merchant') {
        window.location.href = '/merchant/dashboard';
      } else {
        window.location.href = '/register';
      }
    } else {
      window.location.href = '/register';
    }
  };

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-800">載入緊...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-6">
          <Link href="/" className="text-2xl font-bold text-green-600">🚚 ShopSagi 司機</Link>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">司機登入</h1>
          <p className="text-gray-800 mb-6">接單送貨賺錢</p>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="your@email.com"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">密碼</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="輸入密碼"
                required
              />
            </div>

            {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? '登入緊...' : '登入'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-700">或</span>
            </div>
          </div>

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
            Google 登入
          </button>
        </div>

        <div className="text-center mt-6 space-y-2">
          <p className="text-gray-800">
            未有司機帳戶？<Link href="/register" className="text-green-600 hover:underline font-medium">註冊成為司機 →</Link>
          </p>
          <div className="text-sm text-gray-700 pt-2 border-t">
            <span className="mr-2">用其他身份登入：</span>
            <Link href="/login/customer" className="text-purple-600 hover:underline mr-3">顧客</Link>
            <Link href="/login/merchant" className="text-blue-600 hover:underline">商戶</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
