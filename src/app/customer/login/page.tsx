'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CustomerLoginPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to new login path
    router.replace('/login/customer');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
    </div>
  );
}
