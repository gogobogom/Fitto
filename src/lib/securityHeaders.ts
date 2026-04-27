/**
 * 🔒 SECURITY HEADERS CONFIGURATION
 * 
 * Production-ready security headers for the application
 */

export const SECURITY_HEADERS = [
  // Prevent clickjacking attacks
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  // Prevent MIME type sniffing
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // Enable XSS protection
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  // Referrer policy
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  // Permissions policy
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self)',
  },
  // Content Security Policy
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https: wss:",
      "media-src 'self' https:",
      "frame-src 'self'",
    ].join('; '),
  },
] as const;

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(headers: Headers): void {
  for (const header of SECURITY_HEADERS) {
    headers.set(header.key, header.value);
  }
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Rate limit check helper
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): { allowed: boolean; remaining: number } {
  // This is a simple in-memory implementation
  // For production, consider using Redis or a dedicated rate limiting service
  
  if (typeof window !== 'undefined') {
    // Client-side rate limiting
    const key = `rateLimit_${identifier}`;
    const now = Date.now();
    const stored = localStorage.getItem(key);
    
    if (!stored) {
      const data = { count: 1, resetTime: now + windowMs };
      localStorage.setItem(key, JSON.stringify(data));
      return { allowed: true, remaining: maxRequests - 1 };
    }
    
    const data = JSON.parse(stored) as { count: number; resetTime: number };
    
    if (now > data.resetTime) {
      const newData = { count: 1, resetTime: now + windowMs };
      localStorage.setItem(key, JSON.stringify(newData));
      return { allowed: true, remaining: maxRequests - 1 };
    }
    
    if (data.count >= maxRequests) {
      return { allowed: false, remaining: 0 };
    }
    
    data.count++;
    localStorage.setItem(key, JSON.stringify(data));
    return { allowed: true, remaining: maxRequests - data.count };
  }
  
  // Server-side should use proper rate limiting implementation
  return { allowed: true, remaining: maxRequests };
}
