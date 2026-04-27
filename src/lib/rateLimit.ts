/**
 * 🔒 RATE LIMITING UTILITY
 * 
 * Protects API endpoints from abuse
 * Simple in-memory rate limiter for production
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitRecord> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup old entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, record] of this.limits.entries()) {
        if (now > record.resetTime) {
          this.limits.delete(key);
        }
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Check if request is allowed
   * @param identifier - Unique identifier (IP, user ID, etc.)
   * @param maxRequests - Maximum requests allowed
   * @param windowMs - Time window in milliseconds
   * @returns { allowed: boolean, remaining: number, resetTime: number }
   */
  check(
    identifier: string,
    maxRequests: number = 10,
    windowMs: number = 60000 // 1 minute default
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const record = this.limits.get(identifier);

    if (!record || now > record.resetTime) {
      // New window or expired
      const resetTime = now + windowMs;
      this.limits.set(identifier, { count: 1, resetTime });
      return { allowed: true, remaining: maxRequests - 1, resetTime };
    }

    // Within window
    if (record.count >= maxRequests) {
      return { allowed: false, remaining: 0, resetTime: record.resetTime };
    }

    // Increment count
    record.count++;
    this.limits.set(identifier, record);
    return {
      allowed: true,
      remaining: maxRequests - record.count,
      resetTime: record.resetTime,
    };
  }

  /**
   * Reset rate limit for an identifier
   */
  reset(identifier: string): void {
    this.limits.delete(identifier);
  }

  /**
   * Get current status for an identifier
   */
  getStatus(identifier: string): {
    count: number;
    resetTime: number;
  } | null {
    const record = this.limits.get(identifier);
    if (!record) return null;

    const now = Date.now();
    if (now > record.resetTime) {
      this.limits.delete(identifier);
      return null;
    }

    return {
      count: record.count,
      resetTime: record.resetTime,
    };
  }

  /**
   * Cleanup and destroy rate limiter
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.limits.clear();
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

export default rateLimiter;

/**
 * Helper function to get client identifier
 */
export function getClientIdentifier(request: Request): string {
  // Try to get IP from headers
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
  
  // You can also combine with user identity for more accurate limiting
  return ip;
}

/**
 * Rate limit presets for different endpoints
 */
export const RATE_LIMITS = {
  // AI endpoints (expensive)
  AI_COACH: { maxRequests: 20, windowMs: 60000 }, // 20 per minute
  AI_ANALYSIS: { maxRequests: 10, windowMs: 60000 }, // 10 per minute
  AI_GENERATOR: { maxRequests: 5, windowMs: 60000 }, // 5 per minute
  
  // Standard endpoints
  API_STANDARD: { maxRequests: 100, windowMs: 60000 }, // 100 per minute
  API_HEAVY: { maxRequests: 30, windowMs: 60000 }, // 30 per minute
  
  // Authentication
  AUTH: { maxRequests: 5, windowMs: 300000 }, // 5 per 5 minutes
} as const;
