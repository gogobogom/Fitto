/**
 * 🛡️ API SECURITY UTILITIES
 * 
 * Centralized security functions for API routes
 * - Input validation
 * - Error sanitization
 * - Request size limits
 * - Security headers
 */

import { NextRequest, NextResponse } from 'next/server';
import rateLimiter, { getClientIdentifier, RATE_LIMITS } from './rateLimit';

// ============================================================================
// REQUEST SIZE LIMITS
// ============================================================================

export const REQUEST_SIZE_LIMITS = {
  JSON: 1024 * 1024, // 1MB for JSON
  FORM_DATA: 10 * 1024 * 1024, // 10MB for file uploads
  TEXT: 100 * 1024, // 100KB for text
} as const;

/**
 * Check if request size is within acceptable limits
 */
export async function validateRequestSize(
  request: NextRequest,
  maxSize: number = REQUEST_SIZE_LIMITS.JSON
): Promise<{ valid: boolean; error?: string }> {
  try {
    const contentLength = request.headers.get('content-length');
    
    if (!contentLength) {
      return { valid: true }; // Allow requests without content-length
    }

    const size = parseInt(contentLength, 10);

    if (isNaN(size) || size < 0) {
      return { valid: false, error: 'Invalid content length' };
    }

    if (size > maxSize) {
      return {
        valid: false,
        error: `Request too large. Maximum ${Math.round(maxSize / 1024)}KB allowed`,
      };
    }

    return { valid: true };
  } catch (error: unknown) {
    return { valid: false, error: 'Failed to validate request size' };
  }
}

// ============================================================================
// RATE LIMITING HELPERS
// ============================================================================

export type RateLimitType = keyof typeof RATE_LIMITS;

/**
 * Apply rate limiting to API route
 */
export function checkRateLimit(
  request: NextRequest,
  limitType: RateLimitType = 'API_STANDARD'
): { allowed: boolean; response?: NextResponse } {
  const identifier = getClientIdentifier(request);
  const limit = RATE_LIMITS[limitType];
  
  const result = rateLimiter.check(
    identifier,
    limit.maxRequests,
    limit.windowMs
  );

  if (!result.allowed) {
    const resetDate = new Date(result.resetTime);
    const waitSeconds = Math.ceil((result.resetTime - Date.now()) / 1000);

    return {
      allowed: false,
      response: NextResponse.json(
        {
          error: 'Too many requests',
          message: `Please wait ${waitSeconds} seconds before trying again`,
          retryAfter: waitSeconds,
        },
        {
          status: 429,
          headers: {
            'Retry-After': waitSeconds.toString(),
            'X-RateLimit-Limit': limit.maxRequests.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': resetDate.toISOString(),
          },
        }
      ),
    };
  }

  return { allowed: true };
}

// ============================================================================
// ERROR SANITIZATION
// ============================================================================

/**
 * Sanitize error messages for production
 * Never expose internal details to users
 */
export function sanitizeError(error: unknown): {
  message: string;
  statusCode: number;
} {
  // In development, show actual errors
  if (process.env.NODE_ENV === 'development') {
    if (error instanceof Error) {
      return {
        message: error.message,
        statusCode: 500,
      };
    }
    return {
      message: String(error),
      statusCode: 500,
    };
  }

  // In production, show generic messages
  if (error instanceof Error) {
    // Known error types
    if (error.message.includes('timeout')) {
      return {
        message: 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.',
        statusCode: 504,
      };
    }

    if (error.message.includes('network')) {
      return {
        message: 'Ağ hatası oluştu. İnternet bağlantınızı kontrol edin.',
        statusCode: 503,
      };
    }

    if (error.message.includes('unauthorized') || error.message.includes('auth')) {
      return {
        message: 'Yetkilendirme hatası. Lütfen tekrar giriş yapın.',
        statusCode: 401,
      };
    }
  }

  // Generic error for everything else
  return {
    message: 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
    statusCode: 500,
  };
}

/**
 * Create error response with sanitized message
 */
export function createErrorResponse(
  error: unknown,
  fallbackMessage?: string
): NextResponse {
  const { message, statusCode } = sanitizeError(error);

  // Log the actual error server-side
  console.error('[API Security] Error:', error);

  return NextResponse.json(
    {
      error: fallbackMessage || message,
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  );
}

// ============================================================================
// INPUT VALIDATION
// ============================================================================

/**
 * Validate required fields in request body
 */
export function validateRequiredFields(
  body: Record<string, unknown>,
  requiredFields: string[]
): { valid: boolean; missing?: string[] } {
  const missing: string[] = [];

  for (const field of requiredFields) {
    if (!(field in body) || body[field] === null || body[field] === undefined) {
      missing.push(field);
    }
  }

  if (missing.length > 0) {
    return { valid: false, missing };
  }

  return { valid: true };
}

/**
 * Validate and sanitize string input
 */
export function validateString(
  value: unknown,
  options: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    fieldName?: string;
  } = {}
): { valid: boolean; sanitized: string; error?: string } {
  const {
    minLength = 0,
    maxLength = 10000,
    pattern,
    fieldName = 'Field',
  } = options;

  // Type check
  if (typeof value !== 'string') {
    return {
      valid: false,
      sanitized: '',
      error: `${fieldName} must be a string`,
    };
  }

  // Basic XSS protection - remove script tags
  const sanitized = value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();

  // Length validation
  if (sanitized.length < minLength) {
    return {
      valid: false,
      sanitized,
      error: `${fieldName} must be at least ${minLength} characters`,
    };
  }

  if (sanitized.length > maxLength) {
    return {
      valid: false,
      sanitized: '',
      error: `${fieldName} must be at most ${maxLength} characters`,
    };
  }

  // Pattern validation
  if (pattern && !pattern.test(sanitized)) {
    return {
      valid: false,
      sanitized,
      error: `${fieldName} has invalid format`,
    };
  }

  return { valid: true, sanitized };
}

/**
 * Validate and sanitize number input
 */
export function validateNumber(
  value: unknown,
  options: {
    min?: number;
    max?: number;
    integer?: boolean;
    fieldName?: string;
  } = {}
): { valid: boolean; sanitized: number; error?: string } {
  const {
    min = -Infinity,
    max = Infinity,
    integer = false,
    fieldName = 'Field',
  } = options;

  // Type check
  const num = Number(value);

  if (isNaN(num) || !isFinite(num)) {
    return {
      valid: false,
      sanitized: 0,
      error: `${fieldName} must be a valid number`,
    };
  }

  // Integer check
  if (integer && !Number.isInteger(num)) {
    return {
      valid: false,
      sanitized: 0,
      error: `${fieldName} must be an integer`,
    };
  }

  // Range validation
  if (num < min) {
    return {
      valid: false,
      sanitized: 0,
      error: `${fieldName} must be at least ${min}`,
    };
  }

  if (num > max) {
    return {
      valid: false,
      sanitized: 0,
      error: `${fieldName} must be at most ${max}`,
    };
  }

  return { valid: true, sanitized: num };
}

// ============================================================================
// SECURITY HEADERS
// ============================================================================

/**
 * Add security headers to response
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy (basic)
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  );

  return response;
}

// ============================================================================
// COMBINED SECURITY MIDDLEWARE
// ============================================================================

/**
 * All-in-one security check for API routes
 */
export async function secureApiRoute(
  request: NextRequest,
  options: {
    rateLimitType?: RateLimitType;
    maxSize?: number;
    requiredFields?: string[];
  } = {}
): Promise<{ allowed: boolean; response?: NextResponse; body?: unknown }> {
  const {
    rateLimitType = 'API_STANDARD',
    maxSize = REQUEST_SIZE_LIMITS.JSON,
    requiredFields = [],
  } = options;

  // 1. Check rate limit
  const rateLimitResult = checkRateLimit(request, rateLimitType);
  if (!rateLimitResult.allowed) {
    return { allowed: false, response: rateLimitResult.response };
  }

  // 2. Check request size
  const sizeValidation = await validateRequestSize(request, maxSize);
  if (!sizeValidation.valid) {
    return {
      allowed: false,
      response: NextResponse.json(
        { error: sizeValidation.error },
        { status: 413 }
      ),
    };
  }

  // 3. Parse and validate body (if applicable)
  if (request.method !== 'GET' && requiredFields.length > 0) {
    try {
      const body = await request.json();

      const fieldsValidation = validateRequiredFields(body, requiredFields);
      if (!fieldsValidation.valid) {
        return {
          allowed: false,
          response: NextResponse.json(
            {
              error: 'Missing required fields',
              missing: fieldsValidation.missing,
            },
            { status: 400 }
          ),
        };
      }

      return { allowed: true, body };
    } catch (error: unknown) {
      return {
        allowed: false,
        response: NextResponse.json(
          { error: 'Invalid JSON body' },
          { status: 400 }
        ),
      };
    }
  }

  return { allowed: true };
}
