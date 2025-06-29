import { type NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. all root files inside /public (e.g. /favicon.ico)
     */
    '/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)',
  ],
};

export default function middleware(req: NextRequest) {
  const url = req.nextUrl;
  
  // Use `x-forwarded-host` if present, otherwise use `host`
  const hostname = req.headers.get('x-forwarded-host') || req.headers.get('host')!;

  // For local dev, rootDomain is 'localhost'. In production, set NEXT_PUBLIC_ROOT_DOMAIN.
  // It should not contain the protocol or port.
  const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost');

  // Remove port from the current host
  const hostWithoutPort = hostname.split(':')[0];

  const path = url.pathname;

  // Prevent redirect loops
  if (path === '/login') {
    return NextResponse.next();
  }
  
  // If we're on the root domain, rewrite to the login page
  if (hostWithoutPort === rootDomain || hostWithoutPort === `www.${rootDomain}`) {
    return NextResponse.rewrite(new URL('/login', req.url));
  }

  // Extract subdomain
  const subdomain = hostWithoutPort.replace(`.${rootDomain}`, '');
  
  // Rewrite the path to include the subdomain
  return NextResponse.rewrite(new URL(`/${subdomain}${path}`, req.url));
}
