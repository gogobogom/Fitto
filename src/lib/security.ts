// Security utilities for Fitto application

/**
 * Sanitize HTML to prevent XSS attacks
 */
export function sanitizeHTML(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate and sanitize email addresses
 */
export function validateEmail(email: string): { valid: boolean; sanitized: string; error?: string } {
  if (!email || typeof email !== 'string') {
    return { valid: false, sanitized: '', error: 'Email is required' };
  }

  const trimmed = email.trim().toLowerCase();

  if (trimmed.length === 0) {
    return { valid: false, sanitized: '', error: 'Email cannot be empty' };
  }

  if (trimmed.length > 254) {
    return { valid: false, sanitized: '', error: 'Email is too long' };
  }

  // Basic email regex (RFC 5322 simplified)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(trimmed)) {
    return { valid: false, sanitized: '', error: 'Invalid email format' };
  }

  return { valid: true, sanitized: trimmed };
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { valid: boolean; error?: string; strength: 'weak' | 'medium' | 'strong' } {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required', strength: 'weak' };
  }

  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters', strength: 'weak' };
  }

  if (password.length > 128) {
    return { valid: false, error: 'Password is too long (max 128 characters)', strength: 'weak' };
  }

  // Check for common patterns
  const commonPasswords = ['password', '12345678', 'qwerty', 'abc123', 'password123'];
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    return { valid: false, error: 'Password is too common', strength: 'weak' };
  }

  // Calculate strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const criteriaCount = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;

  if (password.length >= 12 && criteriaCount >= 3) {
    strength = 'strong';
  } else if (password.length >= 8 && criteriaCount >= 2) {
    strength = 'medium';
  }

  return { valid: true, strength };
}

/**
 * Validate numeric input with bounds
 */
export function validateNumber(
  value: unknown,
  options: {
    min?: number;
    max?: number;
    allowFloat?: boolean;
    fieldName?: string;
  } = {}
): { valid: boolean; sanitized: number; error?: string } {
  const { min, max, allowFloat = true, fieldName = 'Value' } = options;

  if (value === null || value === undefined || value === '') {
    return { valid: false, sanitized: 0, error: `${fieldName} is required` };
  }

  const num = Number(value);

  if (isNaN(num)) {
    return { valid: false, sanitized: 0, error: `${fieldName} must be a number` };
  }

  if (!isFinite(num)) {
    return { valid: false, sanitized: 0, error: `${fieldName} must be finite` };
  }

  if (!allowFloat && !Number.isInteger(num)) {
    return { valid: false, sanitized: 0, error: `${fieldName} must be an integer` };
  }

  if (min !== undefined && num < min) {
    return { valid: false, sanitized: 0, error: `${fieldName} must be at least ${min}` };
  }

  if (max !== undefined && num > max) {
    return { valid: false, sanitized: 0, error: `${fieldName} must be at most ${max}` };
  }

  return { valid: true, sanitized: num };
}

/**
 * Validate string input with length constraints
 */
export function validateString(
  value: unknown,
  options: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    fieldName?: string;
    allowEmpty?: boolean;
  } = {}
): { valid: boolean; sanitized: string; error?: string } {
  const { minLength, maxLength, pattern, fieldName = 'Value', allowEmpty = false } = options;

  if (value === null || value === undefined) {
    return { valid: false, sanitized: '', error: `${fieldName} is required` };
  }

  if (typeof value !== 'string') {
    return { valid: false, sanitized: '', error: `${fieldName} must be a string` };
  }

  const trimmed = value.trim();

  if (!allowEmpty && trimmed.length === 0) {
    return { valid: false, sanitized: '', error: `${fieldName} cannot be empty` };
  }

  if (minLength !== undefined && trimmed.length < minLength) {
    return { valid: false, sanitized: '', error: `${fieldName} must be at least ${minLength} characters` };
  }

  if (maxLength !== undefined && trimmed.length > maxLength) {
    return { valid: false, sanitized: '', error: `${fieldName} must be at most ${maxLength} characters` };
  }

  if (pattern && !pattern.test(trimmed)) {
    return { valid: false, sanitized: '', error: `${fieldName} has invalid format` };
  }

  return { valid: true, sanitized: trimmed };
}

/**
 * Validate date input
 */
export function validateDate(
  value: unknown,
  options: {
    minDate?: Date;
    maxDate?: Date;
    fieldName?: string;
  } = {}
): { valid: boolean; sanitized: Date; error?: string } {
  const { minDate, maxDate, fieldName = 'Date' } = options;

  if (value === null || value === undefined || value === '') {
    return { valid: false, sanitized: new Date(), error: `${fieldName} is required` };
  }

  let date: Date;

  if (value instanceof Date) {
    date = value;
  } else if (typeof value === 'string' || typeof value === 'number') {
    date = new Date(value);
  } else {
    return { valid: false, sanitized: new Date(), error: `${fieldName} has invalid format` };
  }

  if (isNaN(date.getTime())) {
    return { valid: false, sanitized: new Date(), error: `${fieldName} is invalid` };
  }

  if (minDate && date < minDate) {
    return { valid: false, sanitized: new Date(), error: `${fieldName} must be after ${minDate.toLocaleDateString()}` };
  }

  if (maxDate && date > maxDate) {
    return { valid: false, sanitized: new Date(), error: `${fieldName} must be before ${maxDate.toLocaleDateString()}` };
  }

  return { valid: true, sanitized: date };
}

/**
 * Rate limiting helper
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  constructor(
    private readonly maxRequests: number,
    private readonly windowMs: number
  ) {}

  check(key: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get existing requests for this key
    const existingRequests = this.requests.get(key) || [];

    // Remove requests outside the current window
    const validRequests = existingRequests.filter(timestamp => timestamp > windowStart);

    // Check if limit exceeded
    if (validRequests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...validRequests);
      return {
        allowed: false,
        remaining: 0,
        resetTime: oldestRequest + this.windowMs
      };
    }

    // Add new request
    validRequests.push(now);
    this.requests.set(key, validRequests);

    return {
      allowed: true,
      remaining: this.maxRequests - validRequests.length,
      resetTime: now + this.windowMs
    };
  }

  reset(key: string): void {
    this.requests.delete(key);
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, timestamps] of this.requests.entries()) {
      const validTimestamps = timestamps.filter(t => t > now - this.windowMs);
      if (validTimestamps.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validTimestamps);
      }
    }
  }
}
