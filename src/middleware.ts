import { type NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0/edge';

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

// Define API routes that should be protected
const protectedApiRoutes = [
  '/api/'
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

// Check if a path matches any of the protected API routes
function isProtectedApiRoute(path: string): boolean {
  return protectedApiRoutes.some(route => path.startsWith(route));
}

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('x-forwarded-host') || req.headers.get('host')!;
  const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost');
  const hostWithoutPort = hostname.split(':')[0];
  const path = url.pathname;

  // Check if Auth0 is properly configured
  const isAuth0Configured = !!(process.env.AUTH0_SECRET && process.env.AUTH0_BASE_URL && 
                               process.env.AUTH0_ISSUER_BASE_URL && process.env.AUTH0_CLIENT_ID && 
                               process.env.AUTH0_CLIENT_SECRET);
  
  // Check if the route is a protected API route that requires authentication
  if (isProtectedApiRoute(path) && !isPublicRoute(path)) {
    if (!isAuth0Configured) {
      return NextResponse.json(
        { error: 'Authentication required but not configured' },
        { status: 500 }
      );
    }
    
    try {
      const session = await getSession();
      if (!session?.user) {
        return NextResponse.json(
          { error: 'Unauthorized - Authentication required' },
          { status: 401 }
        );
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      return NextResponse.json(
        { error: 'Error checking authentication' },
        { status: 500 }
      );
    }
  }

  // For the demo tenant, all routes are public and just need rewriting
  if (hostWithoutPort === `megacorp.${rootDomain}`) {
    return NextResponse.rewrite(new URL(`/megacorp${path}`, req.url));
  }
  
  // Rewrite for app subdomains
  if (hostWithoutPort.endsWith(`.${rootDomain}`) && hostWithoutPort !== `www.${rootDomain}`) {
    const subdomain = hostWithoutPort.replace(`.${rootDomain}`, '');
    
    // Security check: Only allow access if Auth0 is configured or it's the demo tenant
    if (!isAuth0Configured && subdomain !== 'megacorp') {
      return NextResponse.redirect(new URL('/auth/error?error=configuration', req.url));
    }
    
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
