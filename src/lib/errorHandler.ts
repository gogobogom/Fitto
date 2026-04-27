/**
 * 🚨 CENTRALIZED ERROR HANDLER
 * 
 * Production-ready error handling with:
 * - Type-safe error classification
 * - Structured logging
 * - User-friendly messages
 * - Security-focused (no internal leaks)
 * 
 * @author Fitto Engineering Team
 * @version 1.0.0
 */

import { NextResponse } from 'next/server';

// ============================================================================
// ERROR TYPES (Type Safety)
// ============================================================================

export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT = 'RATE_LIMIT_ERROR',
  EXTERNAL_API = 'EXTERNAL_API_ERROR',
  DATABASE = 'DATABASE_ERROR',
  INTERNAL = 'INTERNAL_ERROR',
}

export interface AppError {
  type: ErrorType;
  message: string;
  statusCode: number;
  details?: unknown;
  timestamp: string;
}

// ============================================================================
// ERROR FACTORY (DRY Principle)
// ============================================================================

/**
 * Creates a standardized error object
 */
export function createError(
  type: ErrorType,
  message: string,
  statusCode: number = 500,
  details?: unknown
): AppError {
  return {
    type,
    message,
    statusCode,
    details: process.env.NODE_ENV === 'development' ? details : undefined,
    timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// PREDEFINED ERRORS (KISS Principle)
// ============================================================================

export const ERRORS = {
  VALIDATION: {
    INVALID_QUERY: () =>
      createError(
        ErrorType.VALIDATION,
        'Arama sorgusu geçersiz. Lütfen geçerli bir kelime girin.',
        400
      ),
    MISSING_PARAMETER: (param: string) =>
      createError(
        ErrorType.VALIDATION,
        `Gerekli parametre eksik: ${param}`,
        400
      ),
    INVALID_FORMAT: (field: string) =>
      createError(
        ErrorType.VALIDATION,
        `${field} format hatası`,
        400
      ),
  },
  
  RATE_LIMIT: {
    EXCEEDED: () =>
      createError(
        ErrorType.RATE_LIMIT,
        'Çok fazla istek gönderdiniz. Lütfen biraz bekleyin.',
        429
      ),
  },

  EXTERNAL_API: {
    TIMEOUT: (apiName: string) =>
      createError(
        ErrorType.EXTERNAL_API,
        `${apiName} API zaman aşımına uğradı.`,
        504
      ),
    FAILED: (apiName: string, status?: number) =>
      createError(
        ErrorType.EXTERNAL_API,
        `${apiName} API hatası`,
        status || 502
      ),
    NO_RESULTS: () =>
      createError(
        ErrorType.NOT_FOUND,
        'Sonuç bulunamadı.',
        404
      ),
  },

  DATABASE: {
    CONNECTION_FAILED: () =>
      createError(
        ErrorType.DATABASE,
        'Veritabanı bağlantısı kurulamadı.',
        503
      ),
    QUERY_FAILED: () =>
      createError(
        ErrorType.DATABASE,
        'Veritabanı sorgusu başarısız.',
        500
      ),
  },

  INTERNAL: {
    UNKNOWN: () =>
      createError(
        ErrorType.INTERNAL,
        'Beklenmeyen bir hata oluştu.',
        500
      ),
  },
} as const;

// ============================================================================
// ERROR RESPONSE BUILDER
// ============================================================================

/**
 * Converts AppError to NextResponse with proper logging
 * 
 * @param error - AppError object
 * @returns NextResponse with error details
 */
export function errorToResponse(error: AppError): NextResponse {
  // Log error (in production, send to monitoring service)
  logError(error);

  // Return user-friendly response
  return NextResponse.json(
    {
      error: true,
      type: error.type,
      message: error.message,
      timestamp: error.timestamp,
      // Only include details in development
      ...(process.env.NODE_ENV === 'development' && error.details
        ? { details: error.details }
        : {}),
    },
    { status: error.statusCode }
  );
}

/**
 * Handles unknown errors and converts to AppError
 */
export function handleUnknownError(error: unknown): NextResponse {
  console.error('[Error Handler] Unknown error:', error);

  // Convert to AppError
  const appError = error instanceof Error
    ? createError(
        ErrorType.INTERNAL,
        process.env.NODE_ENV === 'development' 
          ? error.message 
          : 'Bir hata oluştu',
        500,
        error.stack
      )
    : ERRORS.INTERNAL.UNKNOWN();

  return errorToResponse(appError);
}

// ============================================================================
// LOGGING (Structured Logging)
// ============================================================================

interface ErrorLogEntry {
  level: 'error' | 'warn' | 'info';
  type: ErrorType;
  message: string;
  statusCode: number;
  timestamp: string;
  details?: unknown;
  environment: string;
}

/**
 * Logs error with structured format
 * In production, this would send to monitoring service (e.g., Sentry, DataDog)
 */
function logError(error: AppError): void {
  const logEntry: ErrorLogEntry = {
    level: error.statusCode >= 500 ? 'error' : 'warn',
    type: error.type,
    message: error.message,
    statusCode: error.statusCode,
    timestamp: error.timestamp,
    details: error.details,
    environment: process.env.NODE_ENV || 'development',
  };

  // Console log with colors in development
  if (process.env.NODE_ENV === 'development') {
    const color = logEntry.level === 'error' ? '\x1b[31m' : '\x1b[33m';
    const reset = '\x1b[0m';
    console.log(`${color}[${logEntry.level.toUpperCase()}]${reset}`, logEntry);
  } else {
    // In production, send to monitoring service
    console.error(JSON.stringify(logEntry));
    
    // TODO: Send to external monitoring service
    // Example: Sentry.captureException(error);
  }
}

// ============================================================================
// API RESPONSE HELPERS (Consistent Format)
// ============================================================================

/**
 * Success response builder
 */
export function successResponse<T>(
  data: T,
  message?: string,
  statusCode: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  );
}

/**
 * Empty response (204 No Content)
 */
export function emptyResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}
