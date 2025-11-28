/**
 * Next.js Middleware for TaxasGE Cloud Run Deployment
 * Handles i18n, authentication, authorization, and security headers
 *
 * @module middleware
 */

import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { routing } from './i18n/routing';
import { locales, defaultLocale } from './i18n/config';

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
const ADMIN_ROUTES = ['/admin', '/dashboard/admin', '/agents', '/assignment', '/permissions'];

/**
 * Public routes (accessible without auth)
 */
const PUBLIC_ROUTES = ['/', '/search', '/categories', '/guide', '/calculator', '/auth', '/services', '/ministries'];

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
  const userRole = request.cookies.get('taxasge_user_role');
  return userRole?.value || null;
}

/**
 * Check if user has admin/supervisor permissions
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
 * Extract locale from pathname (e.g., /es/services -> es)
 */
function getLocaleFromPathname(pathname: string): string | null {
  const segments = pathname.split('/');
  const potentialLocale = segments[1];
  return locales.includes(potentialLocale as (typeof locales)[number]) ? potentialLocale : null;
}

/**
 * Remove locale prefix from pathname
 */
function removeLocalePrefix(pathname: string): string {
  const locale = getLocaleFromPathname(pathname);
  if (!locale) return pathname;
  return pathname.replace(`/${locale}`, '') || '/';
}

/**
 * Check if route requires authentication
 */
function isProtectedRoute(pathname: string): boolean {
  const pathnameWithoutLocale = removeLocalePrefix(pathname);
  return PROTECTED_ROUTES.some((route) => pathnameWithoutLocale.startsWith(route));
}

/**
 * Check if route requires admin access
 */
function isAdminRoute(pathname: string): boolean {
  const pathnameWithoutLocale = removeLocalePrefix(pathname);
  return ADMIN_ROUTES.some((route) => pathnameWithoutLocale.startsWith(route));
}

/**
 * Check if route is public
 */
function _isPublicRoute(pathname: string): boolean {
  const pathnameWithoutLocale = removeLocalePrefix(pathname);
  return PUBLIC_ROUTES.some((route) =>
    pathnameWithoutLocale === route || pathnameWithoutLocale.startsWith(`${route}/`)
  );
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

  // 1. Handle i18n (locale detection and routing)
  const intlMiddleware = createMiddleware(routing);

  // Apply i18n middleware first
  const intlResponse = intlMiddleware(request);

  // Get the response URL after i18n processing
  const responsePathname = intlResponse.headers.get('x-middleware-request-x-matched-path') || pathname;

  const authenticated = isAuthenticated(request);
  const userRole = getUserRole(request);

  // 2. Protect authenticated routes
  if (isProtectedRoute(responsePathname)) {
    if (!authenticated) {
      // Redirect to login with return URL
      const locale = getLocaleFromPathname(responsePathname) || defaultLocale;
      const loginUrl = new URL(`/${locale}/auth`, request.url);
      loginUrl.searchParams.set('redirect', responsePathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. Protect admin routes
  if (isAdminRoute(responsePathname)) {
    if (!authenticated) {
      const locale = getLocaleFromPathname(responsePathname) || defaultLocale;
      const loginUrl = new URL(`/${locale}/auth`, request.url);
      loginUrl.searchParams.set('redirect', responsePathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!hasAdminPermissions(userRole)) {
      const locale = getLocaleFromPathname(responsePathname) || defaultLocale;
      return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
    }

    // Check write permissions for specific routes
    const writeOnlyRoutes = ['/admin/users/create', '/agents/assign'];
    const pathnameWithoutLocale = removeLocalePrefix(responsePathname);
    const isWriteOnlyRoute = writeOnlyRoutes.some((route) => pathnameWithoutLocale.startsWith(route));

    if (isWriteOnlyRoute && !hasWritePermissions(userRole)) {
      const locale = getLocaleFromPathname(responsePathname) || defaultLocale;
      return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
    }
  }

  // 4. Redirect authenticated users away from auth pages
  const pathnameWithoutLocale = removeLocalePrefix(responsePathname);
  if (pathnameWithoutLocale.startsWith('/auth') && authenticated) {
    const locale = getLocaleFromPathname(responsePathname) || defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
  }

  // 5. Add security headers
  const response = intlResponse || NextResponse.next();

  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // CSP: Allow API calls to Cloud Run backend services
  const apiOrigins = [
    'https://taxasge-backend-staging-xrlbgdr5eq-uc.a.run.app',  // Cloud Run staging
    'https://taxasge-backend-staging-392159428433.us-central1.run.app',  // Cloud Run staging alt
    'https://taxasge-backend-dev.run.app',  // Legacy dev
    'https://taxasge-backend-prod.run.app',  // Legacy prod
  ].join(' ');

  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      `connect-src 'self' ${apiOrigins}`,
      "frame-ancestors 'none'",
    ].join('; ')
  );

  return response;
}

/**
 * Middleware configuration
 */
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
