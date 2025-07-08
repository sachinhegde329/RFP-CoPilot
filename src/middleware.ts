import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';

// Define public routes that do not require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/features',
  '/pricing',
  '/docs',
  '/login(.*)',
  '/signup(.*)',
  '/api/webhooks/stripe'
]);

export default clerkMiddleware((auth, req: NextRequest) => {
  const url = req.nextUrl;
  
  // Get hostname of request (e.g. demo.vercel.pub, localhost:3000)
  const hostname = req.headers.get('x-forwarded-host') || req.headers.get('host')!;

  const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost');
  const hostWithoutPort = hostname.split(':')[0];
  const path = url.pathname;

  // For the demo tenant, all routes are public
  if (hostWithoutPort.startsWith('megacorp.')) {
     if (hostWithoutPort.endsWith(`.${rootDomain}`)) {
        const subdomain = hostWithoutPort.replace(`.${rootDomain}`, '');
        if (subdomain !== 'www') {
            return NextResponse.rewrite(new URL(`/${subdomain}${path}`, req.url));
        }
    }
    return NextResponse.next();
  }

  // Protect all other routes
  if (!isPublicRoute(req)) {
    auth().protect();
  }

  // Rewrite for app subdomains
  if (hostWithoutPort.endsWith(`.${rootDomain}`)) {
    const subdomain = hostWithoutPort.replace(`.${rootDomain}`, '');
    if (subdomain !== 'www') {
        return NextResponse.rewrite(new URL(`/${subdomain}${path}`, req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - `_next/static` (static files)
     * - `_next/image` (image optimization files)
     * - `favicon.ico` (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
