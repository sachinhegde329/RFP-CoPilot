import { type NextRequest, NextResponse } from 'next/server';

// Define public routes that do not require authentication
const publicRoutes = [
  '/',
  '/features',
  '/pricing',
  '/docs',
  '/api/webhooks/stripe',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/signup',
  '/api/auth/callback',
  '/api/auth/me', // Auth0 endpoints
];

// Helper to check if a route is public
function isPublicRoute(path: string): boolean {
    return publicRoutes.some(publicPath => {
        if (publicPath.endsWith('(.*)')) {
            return path.startsWith(publicPath.slice(0, -4));
        }
        return path === publicPath;
    });
}

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('x-forwarded-host') || req.headers.get('host')!;
  const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost');
  const hostWithoutPort = hostname.split(':')[0];
  const path = url.pathname;

  // For the demo tenant, all routes are public and just need rewriting
  if (hostWithoutPort === `megacorp.${rootDomain}`) {
    return NextResponse.rewrite(new URL(`/megacorp${path}`, req.url));
  }
  
  // Rewrite for app subdomains
  if (hostWithoutPort.endsWith(`.${rootDomain}`) && hostWithoutPort !== `www.${rootDomain}`) {
    const subdomain = hostWithoutPort.replace(`.${rootDomain}`, '');
    return NextResponse.rewrite(new URL(`/${subdomain}${path}`, req.url));
  }
  
  // All other routes on the root domain are public by design in this app
  return NextResponse.next();
}

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
