/**
 * 🔐 ENVIRONMENT VARIABLES MANAGER
 * 
 * Type-safe environment variable access with:
 * - Runtime validation
 * - Default values
 * - Type checking
 * - Security best practices
 * 
 * @author Fitto Security Team
 * @version 1.0.0
 */

// ============================================================================
// ENVIRONMENT VARIABLE SCHEMA
// ============================================================================

interface EnvironmentVariables {
  // API Keys (Server-side only)
  USDA_API_KEY: string;
  GEMINI_API_KEY: string;
  
  // Supabase (configured separately)
  
  // App Config
  NODE_ENV: 'development' | 'production' | 'test';
  
  // Optional Features
  ENABLE_RATE_LIMITING?: boolean;
  ENABLE_CACHING?: boolean;
  LOG_LEVEL?: 'debug' | 'info' | 'warn' | 'error';
}

// ============================================================================
// DEFAULT VALUES (YAGNI Principle)
// ============================================================================

// 🔐 SECURITY BEST PRACTICE:
// Production apps SHOULD set USDA_API_KEY in environment variables
// Get your FREE API key at: https://fdc.nal.usda.gov/api-key-signup.html
// Set it in Vercel: https://vercel.com/docs/projects/environment-variables
//
// 🚨 WARNING: This fallback key is for demo/development purposes ONLY
// It has rate limits and should NOT be used in production
const DEFAULTS: Partial<EnvironmentVariables> = {
  // Fallback API key (public demo key with rate limits)
  // 👉 RECOMMENDED: Set your own key as USDA_API_KEY environment variable
  USDA_API_KEY: 'rfgHdwn8LVcUlhkRenJoK6uJ1aelV4QFpXWYxuwE',
  // Gemini API key - Will be added later
  GEMINI_API_KEY: '',

  NODE_ENV: 'development',
  ENABLE_RATE_LIMITING: true,
  ENABLE_CACHING: true,
  LOG_LEVEL: 'info',
};

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validates that a required environment variable exists
 */
function getRequiredEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  
  if (!value) {
    const error = `Missing required environment variable: ${key}`;
    console.error(`[ENV] ${error}`);
    throw new Error(error);
  }
  
  return value;
}

/**
 * Gets optional environment variable with default
 */
function getOptionalEnv<T>(
  key: string,
  defaultValue: T,
  parser?: (value: string) => T
): T {
  const value = process.env[key];
  
  if (!value) {
    return defaultValue;
  }
  
  if (parser) {
    try {
      return parser(value);
    } catch (error) {
      console.warn(`[ENV] Failed to parse ${key}, using default:`, error);
      return defaultValue;
    }
  }
  
  return value as T;
}

/**
 * Parse boolean from string
 */
function parseBoolean(value: string): boolean {
  return value.toLowerCase() === 'true' || value === '1';
}

// ============================================================================
// ENVIRONMENT OBJECT (Single Source of Truth)
// ============================================================================

/**
 * Type-safe environment variables
 * Access via: env.USDA_API_KEY, env.NODE_ENV, etc.
 */
export const env = {
  // API Keys
  USDA_API_KEY: getRequiredEnv('USDA_API_KEY', DEFAULTS.USDA_API_KEY),
  GEMINI_API_KEY: getOptionalEnv('GEMINI_API_KEY', DEFAULTS.GEMINI_API_KEY || ''),
  

  
  // App Config
  NODE_ENV: getOptionalEnv('NODE_ENV', DEFAULTS.NODE_ENV!) as EnvironmentVariables['NODE_ENV'],
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  
  // Feature Flags
  ENABLE_RATE_LIMITING: getOptionalEnv(
    'ENABLE_RATE_LIMITING',
    DEFAULTS.ENABLE_RATE_LIMITING!,
    parseBoolean
  ),
  ENABLE_CACHING: getOptionalEnv(
    'ENABLE_CACHING',
    DEFAULTS.ENABLE_CACHING!,
    parseBoolean
  ),
  
  // Logging
  LOG_LEVEL: getOptionalEnv('LOG_LEVEL', DEFAULTS.LOG_LEVEL!),
} as const;

// ============================================================================
// EXPORTED CONSTANTS FOR API ROUTES
// ============================================================================

/**
 * Gemini API Configuration (Google AI)
 * Will be integrated later - currently using scenario-based AI coach
 */
export const GEMINI_API_KEY = env.GEMINI_API_KEY;
export const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta';

// ============================================================================
// VALIDATION ON STARTUP
// ============================================================================

/**
 * Validates all environment variables on app startup
 * Throws error if critical variables are missing
 */
export function validateEnvironment(): void {
  const required: Array<keyof typeof env> = [
    'USDA_API_KEY',
  ];
  
  const missing: string[] = [];
  
  for (const key of required) {
    if (!env[key]) {
      missing.push(key);
    }
  }
  
  if (missing.length > 0) {
    const error = `Missing required environment variables: ${missing.join(', ')}`;
    console.error(`[ENV] ${error}`);
    throw new Error(error);
  }
  
  console.log('[ENV] ✅ All environment variables validated');
}

// ============================================================================
// SECURITY HELPERS
// ============================================================================

/**
 * Mask sensitive values for logging
 * Example: "sk_12345...789" instead of full API key
 */
export function maskSensitiveValue(value: string, visibleChars: number = 6): string {
  if (!value || value.length <= visibleChars) {
    return '***';
  }
  
  const start = value.slice(0, visibleChars / 2);
  const end = value.slice(-visibleChars / 2);
  
  return `${start}...${end}`;
}

/**
 * Get safe environment summary for logging
 * Never exposes sensitive values
 */
export function getEnvironmentSummary(): Record<string, string> {
  return {
    NODE_ENV: env.NODE_ENV,
    USDA_API_KEY: maskSensitiveValue(env.USDA_API_KEY),

    RATE_LIMITING: env.ENABLE_RATE_LIMITING ? 'enabled' : 'disabled',
    CACHING: env.ENABLE_CACHING ? 'enabled' : 'disabled',
    LOG_LEVEL: env.LOG_LEVEL,
  };
}

// Run validation on module load (skip during build and SSR)
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
  try {
    validateEnvironment();
    if (env.IS_DEVELOPMENT) {
      console.log('[ENV] Configuration:', getEnvironmentSummary());
    }
  } catch (error) {
    // Log warning but don't crash - allow app to start with defaults
    console.error('[ENV] Validation failed, using defaults:', error);
  }
} else if (typeof window === 'undefined') {
  // Server-side: Just log that we're using env variables
  if (process.env.NODE_ENV === 'development') {
    console.log('[ENV] Server-side environment configured');
  }
}
