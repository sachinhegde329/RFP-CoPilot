
import { handleAuth, handleLogin } from '@auth0/nextjs-auth0';

// Check if Auth0 is properly configured
const isAuth0Configured = !!(process.env.AUTH0_SECRET && process.env.AUTH0_BASE_URL && 
                             process.env.AUTH0_ISSUER_BASE_URL && process.env.AUTH0_CLIENT_ID && 
                             process.env.AUTH0_CLIENT_SECRET);

export async function GET(request: Request, { params }: { params: { auth0: string[] } }) {
  const { auth0 } = params;
  
  if (!isAuth0Configured) {
    // If Auth0 is not configured, we cannot process auth requests.
    // Return a user-friendly error instead of a 500 server crash.
    const path = auth0.join('/');
    
    if (path.startsWith('login') || path.startsWith('signup') || path.startsWith('logout')) {
      return new Response(
        'Authentication service is not configured. Please set up Auth0 environment variables.', 
        { 
          status: 503, // Service Unavailable
          headers: { 'Content-Type': 'text/plain' }
        }
      );
    }
    
    // For other auth routes like /me, return a different response.
    return new Response(JSON.stringify({ 
      error: 'auth_not_configured', 
      message: 'Auth0 is not configured.' 
    }), { 
      status: 200, // Return 200 so client-side hooks don't throw an error for /me
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Auth0 is configured, use the standard handler
  const handler = handleAuth({
    login: handleLogin({
      returnTo: '/dashboard',
    }),
    signup: handleLogin({
      authorizationParams: {
        screen_hint: 'signup',
      },
      returnTo: '/dashboard',
    }),
  });

  // Since we are using a dynamic route, we need to manually construct the request
  // that the handleAuth function expects.
  return handler(request, { params: { auth0 } });
}

export const POST = GET;
