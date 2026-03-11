import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // For now, we'll handle auth on client side
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/merchant/:path*',
  ],
};
