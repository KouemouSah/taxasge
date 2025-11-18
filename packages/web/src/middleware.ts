/**
 * Next.js Middleware
 * Note: Middleware does not run with output: 'export' (static export)
 * This file is kept for future use when switching to dynamic rendering
 *
 * @module middleware
 * @author Claude Code
 * @date 2025-11-18
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(_request: NextRequest) {
  // With output: 'export', middleware doesn't run during static generation
  // Auth protection should be handled client-side instead
  return NextResponse.next();
}

// Disable middleware for static export
// When you switch to dynamic rendering, uncomment and configure this
export const config = {
  matcher: [],
  // matcher: [
  //   '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  // ],
};
