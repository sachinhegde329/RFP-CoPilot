import { NextRequest, NextResponse } from 'next/server';
import { getClientIP, apiRateLimiter } from './rate-limit';
import { validateInput, sanitizeString } from './validation';

// Security headers for API responses
export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Add CORS headers for API routes
  response.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  
  return response;
}

// Rate limiting middleware for API routes
export function withRateLimit(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    const clientIP = getClientIP(req);
    const identifier = `${clientIP}-${req.nextUrl.pathname}`;
    
    if (!apiRateLimiter.isAllowed(identifier)) {
      const response = NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
      
      response.headers.set('X-RateLimit-Limit', '100');
      response.headers.set('X-RateLimit-Remaining', '0');
      response.headers.set('X-RateLimit-Reset', apiRateLimiter.getResetTime(identifier).toString());
      
      return addSecurityHeaders(response);
    }
    
    const response = await handler(req);
    
    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', '100');
    response.headers.set('X-RateLimit-Remaining', apiRateLimiter.getRemaining(identifier).toString());
    response.headers.set('X-RateLimit-Reset', apiRateLimiter.getResetTime(identifier).toString());
    
    return addSecurityHeaders(response);
  };
}

// Authentication middleware for API routes
export function withAuth(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    // Check if Auth0 is configured
    const isAuth0Configured = !!(process.env.AUTH0_SECRET && process.env.AUTH0_BASE_URL && 
                                 process.env.AUTH0_ISSUER_BASE_URL && process.env.AUTH0_CLIENT_ID && 
                                 process.env.AUTH0_CLIENT_SECRET);
    
    if (!isAuth0Configured) {
      // For demo purposes, allow access without auth
      return handler(req);
    }
    
    // TODO: Implement proper Auth0 session validation
    // For now, we'll check for a session cookie
    const sessionCookie = req.cookies.get('appSession');
    
    if (!sessionCookie) {
      return addSecurityHeaders(
        NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      );
    }
    
    return handler(req);
  };
}

// Input validation middleware
export function withValidation<T>(
  schema: any,
  handler: (req: NextRequest, data: T) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      let data: unknown;
      
      if (req.method === 'GET') {
        data = Object.fromEntries(req.nextUrl.searchParams);
      } else {
        data = await req.json();
      }
      
      const validation = validateInput(schema, data);
      
      if (!validation.success) {
        return addSecurityHeaders(
          NextResponse.json({ error: validation.error }, { status: 400 })
        );
      }
      
      return handler(req, validation.data as T);
    } catch (error) {
      return addSecurityHeaders(
        NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
      );
    }
  };
}

// Combined security middleware
export function withSecurity<T>(
  schema?: any,
  handler?: (req: NextRequest, data?: T) => Promise<NextResponse>
) {
  return (req: NextRequest) => {
    let securedHandler = withRateLimit(async (req: NextRequest) => {
      if (schema && handler) {
        return withValidation(schema, handler)(req);
      } else if (handler) {
        return handler(req);
      } else {
        return NextResponse.json({ error: 'Handler not provided' }, { status: 500 });
      }
    });
    
    return withAuth(securedHandler)(req);
  };
}

// Sanitize request data
export function sanitizeRequestData(data: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeRequestData(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

// Log security events
export function logSecurityEvent(event: string, details: Record<string, any>) {
  console.log(`[SECURITY] ${event}:`, {
    timestamp: new Date().toISOString(),
    ...details
  });
} 