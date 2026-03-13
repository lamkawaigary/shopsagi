'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword, signInWithPopup, signInWithRedirect, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';

export default function CustomerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isSafari = typeof window !== 'undefined' && 
    /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      setError('系統暫時不可用，請稍後再試');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      // Verify user is customer
      const userDoc = await getDoc(doc(db!, 'users', result.user.uid));
      if (userDoc.exists() && userDoc.data().role === 'customer') {
        router.push('/customer');
      } else {
        // Role mismatch - sign out and show error
        await auth.signOut();
        setError('呢個帳戶唔係顧客帳戶，請用其他登入方式');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/invalid-email') {
        setError('Invalid email格式');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Email或密碼錯誤');
      } else if (err.code === 'auth/user-not-found') {
        setError('呢個帳戶唔存在');
      } else if (err.code === 'auth/wrong-password') {
        setError('密碼錯誤');
      } else {
        setError(err.message || '登入失敗');
      }
    } finally {
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
      
      if (isSafari) {
        // Store intended role in sessionStorage for redirect handling
        sessionStorage.setItem('loginRole', 'customer');
        await signInWithRedirect(auth, provider);
        return;
      }
      
      try {
        const result = await signInWithPopup(auth, provider);
        await handleGoogleSuccess(result);
      } catch (popupErr: any) {
        if (popupErr.code === 'auth/popup-blocked' || popupErr.code === 'auth/cancelled-popup-request') {
          sessionStorage.setItem('loginRole', 'customer');
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

  const handleGoogleSuccess = async (result: any) => {
    const user = result.user;
    const userDoc = await getDoc(doc(db!, 'users', user.uid));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (userData.role === 'customer') {
        router.push('/customer');
      } else if (userData.role === 'merchant') {
        router.push('/merchant/dashboard');
      } else if (userData.role === 'driver') {
        router.push('/driver/dashboard');
      } else {
        // Unknown role, redirect to register to set role
        router.push('/register');
      }
    } else {
      // New user - go to register to choose role
      router.push('/register');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/" className="text-2xl font-bold text-purple-600">
            🛒 ShopSagi 舖記
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">顧客登入</h1>
          <p className="text-gray-600 mb-6">用呢個email同密碼登入</p>

          <form onSubmit={handleEmailLogin} className="space-y-4">
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
                placeholder="輸入密碼"
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
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? '登入緊...' : '登入'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">或</span>
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
            Google 登入
          </button>
        </div>

        {/* Register Link */}
        <div className="text-center mt-6">
          <p className="text-gray-600">
            未有帳戶？{' '}
            <Link href="/register" className="text-purple-600 hover:underline font-medium">
              註冊 →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
