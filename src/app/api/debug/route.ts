import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    firebase: {
      apiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      appId: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    },
    stripe: {
      hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
    }
  });
}
