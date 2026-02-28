import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userAgent = request.headers.get('user-agent') || '';

  // 1. ANTI-BYPASS SECURITY
  // Prevents attackers from skipping middleware using internal Next.js headers
  if (request.headers.has('x-middleware-subrequest')) {
    return new NextResponse('Security Access Denied', { status: 403 });
  }

  // 2. ALLOW LIST (Performance & PWA)
  if (
    pathname === '/' || 
    pathname.includes('favicon.ico') || 
    pathname.includes('manifest.json') ||
    pathname.startsWith('/icons/') || 
    pathname.startsWith('/_next/static') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.svg')
  ) {
    const response = NextResponse.next();
    if (pathname !== '/') {
      response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    }
    return applySecurityHeaders(response);
  }

  // 3. DEFENSIVE SHIELD (Bot & Exploit Blocking)
  const isSuspiciousBot = /python|requests|axios|curl|go-http-client|php|scrapy/i.test(userAgent);

  const blockedPrefixes = [
    '/wp-', '/wordpress', '/sito', '/cms', '/test', '/shop', '/news',
    '/api/action', '/apps', '/_next/data', '/.env', '/.git', '/.vscode',
    '/phpmyadmin', '/pma', '/adminer'
  ];

  const isBlocked = 
    blockedPrefixes.some(prefix => pathname.toLowerCase().startsWith(prefix)) || 
    pathname.includes('wp-includes') || 
    pathname.endsWith('.php') ||
    pathname.endsWith('.aspx') ||
    pathname.includes('wlwmanifest.xml');

  // Block the request if it's a known bad path OR a script-bot hitting non-API routes
  if (isBlocked || (isSuspiciousBot && !pathname.startsWith('/api/'))) {
    return new NextResponse(null, { status: 410 });
  }

  // 4. STANDARD FLOW
  const response = NextResponse.next();
  return applySecurityHeaders(response);
}

/**
 * Injects critical security headers to prevent phishing and clickjacking
 */
function applySecurityHeaders(response: NextResponse) {
  const headers = response.headers;

  // PHISHING PROTECTION: Prevents zipp.sg from being embedded in <iframe> on other sites
  headers.set('X-Frame-Options', 'DENY');

  // MIME PROTECTION: Prevents the browser from "guessing" content types (prevents script injection)
  headers.set('X-Content-Type-Options', 'nosniff');

  // PRIVACY: Controls how much referrer info is leaked to other sites
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // HTTPS ENFORCEMENT: Tells browsers to ONLY use HTTPS for the next year
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // PERMISSIONS: Disable unneeded browser features to reduce attack surface
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self), interest-cohort=()');

  return response;
}

export const config = {
  matcher: ['/((?!api/auth|_next/image).*)'],
};
