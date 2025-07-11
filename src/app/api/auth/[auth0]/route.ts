import { handleAuth, handleLogin } from '@auth0/nextjs-auth0';

// Check if Auth0 is properly configured
const isAuth0Configured = !!(process.env.AUTH0_SECRET && process.env.AUTH0_BASE_URL && 
                             process.env.AUTH0_ISSUER_BASE_URL && process.env.AUTH0_CLIENT_ID && 
                             process.env.AUTH0_CLIENT_SECRET);

export const GET = isAuth0Configured ? handleAuth({
    login: handleLogin({
        returnTo: '/dashboard',
    }),
    signup: handleLogin({
        authorizationParams: {
            screen_hint: 'signup',
        },
        returnTo: '/dashboard',
    }),
}) : async (req: Request) => {
    // For demo purposes, return a mock response when Auth0 is not configured
    const url = new URL(req.url);
    const path = url.pathname;
    
    if (path.includes('/me')) {
        return new Response(JSON.stringify({ 
            user: null, 
            message: 'Auth0 not configured - using demo mode' 
        }), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    if (path.includes('/login')) {
        return new Response('Auth0 not configured - please complete setup', { 
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
    
    return new Response('Auth0 not configured', { status: 503 });
};
