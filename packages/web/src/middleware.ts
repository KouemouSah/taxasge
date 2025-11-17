/**
 * Next.js Middleware
 * Protects routes and handles authentication/authorization
 *
 * @module middleware
 * @author Claude Code
 * @date 2025-11-18
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // TODO: Get user session from cookies/tokens
  // For now, we'll allow access (you need to implement actual auth check)
  // const session = getSessionFromRequest(request);

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard')) {
    // TODO: Check if user is authenticated
    // if (!session) {
    //   return NextResponse.redirect(new URL('/auth/login', request.url));
    // }

    // Protect admin routes specifically
    if (pathname.startsWith('/dashboard/admin')) {
      // TODO: Check if user has admin role
      // if (session.user.role?.code !== 'ADMIN') {
      //   return NextResponse.redirect(new URL('/dashboard', request.url));
      // }
    }
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
