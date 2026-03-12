'use client';

import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signInWithRedirect, GoogleAuthProvider, getRedirectResult } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Check if browser is Safari
  const isSafari = typeof window !== 'undefined' && 
    /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      setError('系統暫時不可用，請稍後再試');
      return;
    }
    setError('');
    setLoading(true);
    
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Save to Firestore
        await setDoc(doc(db!, 'users', userCredential.user.uid), {
          email: userCredential.user.email,
          role: 'merchant',
          shopName: null,
          createdAt: new Date().toISOString(),
        });
      }
      router.push('/merchant/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
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
      
      // For Safari, use redirect instead of popup
      if (isSafari) {
        await signInWithRedirect(auth, provider);
        return;
      }
      
      // For other browsers, try popup first
      try {
        const result = await signInWithPopup(auth, provider);
        await handleGoogleLoginSuccess(result);
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
      } else if (err.message?.includes('state')) {
        setError('瀏覽器設定導致登入失敗，請嘗試使用 email 及密碼登入');
      } else {
        setError(err.message || 'Google login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginSuccess = async (result: any) => {
    const userDoc = await getDoc(doc(db!, 'users', result.user.uid));
    if (!userDoc.exists()) {
      await setDoc(doc(db!, 'users', result.user.uid), {
        email: result.user.email,
        role: 'merchant',
        shopName: null,
        createdAt: new Date().toISOString(),
      });
    }
    router.push('/merchant/dashboard');
  };

  // Check for redirect result on mount
  useEffect(() => {
    const checkRedirectResult = async () => {
      if (!auth || !db) return;
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          await handleGoogleLoginSuccess(result);
        }
      } catch (err: any) {
        console.error('Redirect result error:', err);
        if (err.message?.includes('state')) {
          setError('瀏覽器設定導致登入失敗，請嘗試使用 email 及密碼登入');
        }
      }
    };
    checkRedirectResult();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 md:p-8">
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">ShopSagi 商戶端</h1>
          <p className="text-gray-600 mt-2 text-sm md:text-base">
            {isLogin ? '登入你的商戶帳戶' : '建立商戶帳戶'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              電子郵件
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '處理中...' : isLogin ? '登入' : '註冊'}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">或</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full border border-gray-300 bg-white text-gray-700 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          使用 Google 登入
        </button>

        <p className="text-center mt-6 text-gray-600">
          {isLogin ? '未有帳戶？' : '已有帳戶？'}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 hover:underline ml-1"
          >
            {isLogin ? '註冊' : '登入'}
          </button>
        </p>
      </div>
    </div>
  );
}
