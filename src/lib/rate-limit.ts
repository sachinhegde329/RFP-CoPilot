interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const record = this.store[identifier];

    // Clean up expired records
    if (record && now > record.resetTime) {
      delete this.store[identifier];
    }

    if (!this.store[identifier]) {
      // First request
      this.store[identifier] = {
        count: 1,
        resetTime: now + this.config.windowMs,
      };
      return true;
    }

    if (this.store[identifier].count >= this.config.maxRequests) {
      return false;
    }

    this.store[identifier].count++;
    return true;
  }

  getRemaining(identifier: string): number {
    const record = this.store[identifier];
    if (!record) {
      return this.config.maxRequests;
    }
    return Math.max(0, this.config.maxRequests - record.count);
  }

  getResetTime(identifier: string): number {
    const record = this.store[identifier];
    return record ? record.resetTime : Date.now() + this.config.windowMs;
  }
}

// Create rate limiters for different endpoints
export const apiRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per window
});

export const authRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 auth attempts per window
});

export const uploadRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10, // 10 uploads per hour
});

export function getClientIP(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  const cfConnectingIP = req.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  return 'unknown';
} 