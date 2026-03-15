'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default function SetupAdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState('');
  const [emailToAdmin, setEmailToAdmin] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const makeMeAdmin = async () => {
    if (!user || !db) {
      setResult('❌ Please login first');
      return;
    }

    try {
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        role: 'admin',
        createdAt: new Date(),
      }, { merge: true });
      setResult('✅ You are now an admin!');
    } catch (error) {
      setResult('❌ Error: ' + (error as Error).message);
    }
  };

  const makeEmailAdmin = async () => {
    if (!emailToAdmin || !db) {
      setResult('❌ Please enter an email');
      return;
    }

    try {
      // Find user by email - in a real app you'd query by email
      // For now, we'll just show the email to add manually
      setResult(`📧 Please provide the user ID for ${emailToAdmin} or login with that account first`);
    } catch (error) {
      setResult('❌ Error: ' + (error as Error).message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">🔐</div>
          <h1 className="text-xl font-bold mb-4">Please Login</h1>
          <p className="text-gray-600">Login with Google to set up admin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-2">⚙️ Admin Setup</h1>
        <p className="text-gray-600 mb-6">Current user: {user.email}</p>

        <button
          onClick={makeMeAdmin}
          className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 mb-4"
        >
          👑 Make Me Admin
        </button>

        {result && (
          <div className={`p-3 rounded-lg text-center mb-4 ${
            result.includes('✅') ? 'bg-green-100 text-green-700' :
            result.includes('❌') ? 'bg-red-100 text-red-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {result}
          </div>
        )}

        <hr className="my-6" />

        <h2 className="text-lg font-bold mb-4">Set Another User as Admin</h2>
        <p className="text-sm text-gray-500 mb-4">
          User must login first, then visit this page
        </p>
      </div>
    </div>
  );
}
