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
  const hostname = req.headers.get('host')!;

  const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:9002').replace(/https?:\/\//, '');

  const path = url.pathname;
  
  // Prevent redirect loops on the login page
  if (path === '/login') {
    return NextResponse.next();
  }

  // Get the subdomain from the hostname
  const subdomain = hostname.replace(`.${rootDomain}`, '');

  // If the hostname is the root domain, rewrite to the login page
  if (hostname === rootDomain || hostname === `www.${rootDomain}`) {
    return NextResponse.rewrite(new URL('/login', req.url));
  }
  
  // If we have a subdomain, rewrite the URL to be /<subdomain>/...
  return NextResponse.rewrite(new URL(`/${subdomain}${path}`, req.url));
}
