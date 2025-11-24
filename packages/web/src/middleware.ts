/**
 * Next.js Middleware for TaxasGE Cloud Run Deployment
 * Handles authentication, authorization, i18n, and security headers
 *
 * @module middleware
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Protected routes that require authentication
 */
const PROTECTED_ROUTES = [
  '/dashboard',
  '/profile',
  '/declarations',
  '/payments',
  '/documents',
  '/companies',
];

/**
 * Admin-only routes
 */
const ADMIN_ROUTES = ['/admin', '/agents', '/assignment', '/permissions'];

/**
 * Public routes (accessible without auth)
 */
const PUBLIC_ROUTES = ['/', '/search', '/categories', '/guide', '/calculator', '/auth'];

/**
 * Check if user is authenticated by verifying JWT token in cookies
 */
function isAuthenticated(request: NextRequest): boolean {
  const authToken = request.cookies.get('taxasge_auth_token');
  return !!authToken?.value;
}

/**
 * Get user role from auth token (simplified version)
 * In production, decode and verify JWT properly
 */
function getUserRole(request: NextRequest): string | null {
  // TODO: Implement proper JWT decoding
  // For now, check if admin cookie exists (set by client after login)
  const userRole = request.cookies.get('taxasge_user_role');
  return userRole?.value || null;
}

/**
 * Check if user has admin/supervisor permissions
 * Includes all DGI supervisors, ministry agents, and admins
 */
function hasAdminPermissions(role: string | null): boolean {
  if (!role) return false;

  const adminRoles = [
    'admin',
    'dgi_agent',
    'supervisor_junior_dgi',
    'supervisor_dgi',
    'supervisor_senior',
    'supervisor_readonly',
    'ministry_agent',
  ];

  return adminRoles.includes(role);
}

/**
 * Check if user has write permissions (excludes readonly supervisors)
 */
function hasWritePermissions(role: string | null): boolean {
  if (!role) return false;

  const writeRoles = [
    'admin',
    'dgi_agent',
    'supervisor_junior_dgi',
    'supervisor_dgi',
    'supervisor_senior',
    'ministry_agent',
  ];

  return writeRoles.includes(role);
}

/**
 * Check if route requires authentication
 */
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Check if route requires admin access
 */
function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Check if route is public
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // Static files (.svg, .png, etc.)
  ) {
    return NextResponse.next();
  }

  const authenticated = isAuthenticated(request);
  const userRole = getUserRole(request);

  // 1. Protect authenticated routes
  if (isProtectedRoute(pathname)) {
    if (!authenticated) {
      // Redirect to login with return URL
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Protect admin routes (requires admin/supervisor/ministry permissions)
  if (isAdminRoute(pathname)) {
    if (!authenticated) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check if user has admin/supervisor/ministry permissions
    if (!hasAdminPermissions(userRole)) {
      // Redirect non-privileged users to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Additional check: some routes may require write permissions
    // (supervisor_readonly would be blocked from certain actions)
    const writeOnlyRoutes = ['/admin/users/create', '/agents/assign'];
    const isWriteOnlyRoute = writeOnlyRoutes.some((route) => pathname.startsWith(route));

    if (isWriteOnlyRoute && !hasWritePermissions(userRole)) {
      // Redirect readonly supervisors to view-only page
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // 3. Redirect authenticated users away from auth pages
  if (pathname.startsWith('/auth') && authenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 4. Add security headers
  const response = NextResponse.next();

  // Security headers for all responses
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content Security Policy (adjust based on your needs)
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-inline
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://taxasge-backend-dev.run.app https://taxasge-backend-prod.run.app",
      "frame-ancestors 'none'",
    ].join('; ')
  );

  // 5. Language detection and redirection (optional)
  // const locale = request.cookies.get('NEXT_LOCALE')?.value || 'es';
  // response.headers.set('X-User-Locale', locale);

  return response;
}

/**
 * Middleware configuration
 * Runs on all routes except static files and API routes
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     * - API routes
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
