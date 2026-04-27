/**
 * Network Retry Logic
 * Automatic retry mechanism with exponential backoff
 */

export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Initial delay in milliseconds */
  initialDelay?: number;
  /** Maximum delay in milliseconds */
  maxDelay?: number;
  /** Backoff multiplier */
  backoffMultiplier?: number;
  /** Jitter factor (0-1) to add randomness */
  jitter?: number;
  /** Retry only on specific status codes */
  retryableStatusCodes?: number[];
  /** Custom retry condition */
  shouldRetry?: (error: Error, attempt: number) => boolean;
  /** Callback on retry */
  onRetry?: (error: Error, attempt: number, delay: number) => void;
  /** Abort signal */
  signal?: AbortSignal;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'shouldRetry' | 'onRetry' | 'signal'>> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  jitter: 0.1,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  backoffMultiplier: number,
  jitter: number
): number {
  // Exponential backoff
  let delay = initialDelay * Math.pow(backoffMultiplier, attempt);
  
  // Apply max delay cap
  delay = Math.min(delay, maxDelay);
  
  // Add jitter
  if (jitter > 0) {
    const jitterAmount = delay * jitter;
    delay = delay + (Math.random() * 2 - 1) * jitterAmount;
  }
  
  return Math.round(delay);
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: Error, statusCodes: number[]): boolean {
  // Network errors
  if (error.name === 'TypeError' || error.message.includes('Failed to fetch')) {
    return true;
  }
  
  // Timeout errors
  if (error.name === 'AbortError' || error.message.includes('timeout')) {
    return true;
  }
  
  // Check status code if present
  const statusCode = (error as Error & { status?: number }).status;
  if (statusCode && statusCodes.includes(statusCode)) {
    return true;
  }
  
  return false;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(resolve, ms);
    
    if (signal) {
      signal.addEventListener('abort', () => {
        clearTimeout(timeout);
        reject(new DOMException('Aborted', 'AbortError'));
      });
    }
  });
}

/**
 * Execute function with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  let lastError: Error = new Error('Unknown error');
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      // Check if aborted
      if (config.signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }
      
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if we should retry
      const shouldRetry = config.shouldRetry
        ? config.shouldRetry(lastError, attempt)
        : isRetryableError(lastError, config.retryableStatusCodes);
      
      // Don't retry if it's the last attempt or shouldn't retry
      if (attempt >= config.maxRetries || !shouldRetry) {
        throw lastError;
      }
      
      // Calculate delay
      const delay = calculateDelay(
        attempt,
        config.initialDelay,
        config.maxDelay,
        config.backoffMultiplier,
        config.jitter
      );
      
      // Call retry callback
      if (config.onRetry) {
        config.onRetry(lastError, attempt + 1, delay);
      }
      
      // Wait before retrying
      await sleep(delay, config.signal);
    }
  }
  
  throw lastError;
}

/**
 * Fetch with retry
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit & RetryOptions = {}
): Promise<Response> {
  const {
    maxRetries,
    initialDelay,
    maxDelay,
    backoffMultiplier,
    jitter,
    retryableStatusCodes,
    shouldRetry,
    onRetry,
    signal,
    ...fetchOptions
  } = options;
  
  return withRetry(
    async () => {
      const response = await fetch(url, { ...fetchOptions, signal });
      
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`) as Error & { status: number };
        error.status = response.status;
        throw error;
      }
      
      return response;
    },
    {
      maxRetries,
      initialDelay,
      maxDelay,
      backoffMultiplier,
      jitter,
      retryableStatusCodes,
      shouldRetry,
      onRetry,
      signal,
    }
  );
}

/**
 * Create a retry wrapper for a specific function
 */
export function createRetryWrapper<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  defaultOptions: RetryOptions = {}
): (...args: TArgs) => Promise<TResult> {
  return (...args: TArgs) => withRetry(() => fn(...args), defaultOptions);
}

/**
 * Circuit breaker pattern
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailure: number | null = null;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private readonly threshold: number = 5,
    private readonly timeout: number = 30000
  ) {}

  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      // Check if timeout has passed
      if (this.lastFailure && Date.now() - this.lastFailure > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }
    
    try {
      const result = await fn();
      
      // Reset on success
      if (this.state === 'half-open') {
        this.state = 'closed';
      }
      this.failures = 0;
      
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailure = Date.now();
      
      if (this.failures >= this.threshold) {
        this.state = 'open';
      }
      
      throw error;
    }
  }

  /**
   * Get current state
   */
  getState(): 'closed' | 'open' | 'half-open' {
    return this.state;
  }

  /**
   * Reset the circuit breaker
   */
  reset(): void {
    this.failures = 0;
    this.lastFailure = null;
    this.state = 'closed';
  }
}

/**
 * Timeout wrapper
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message = 'Operation timed out'
): Promise<T> {
  const controller = new AbortController();
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    const timeout = setTimeout(() => {
      controller.abort();
      reject(new Error(message));
    }, timeoutMs);
    
    // Clean up timeout if promise resolves first
    promise.finally(() => clearTimeout(timeout));
  });
  
  return Promise.race([promise, timeoutPromise]);
}

/**
 * Retry with timeout
 */
export async function retryWithTimeout<T>(
  fn: () => Promise<T>,
  options: RetryOptions & { timeout?: number } = {}
): Promise<T> {
  const { timeout = 30000, ...retryOptions } = options;
  
  return withRetry(
    () => withTimeout(fn(), timeout),
    retryOptions
  );
}

/**
 * Queue for rate-limited operations
 */
export class RateLimitedQueue {
  private queue: Array<{
    fn: () => Promise<unknown>;
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
  }> = [];
  private processing = false;
  private lastRequest = 0;
  
  constructor(
    private readonly minInterval: number = 100,
    private readonly maxConcurrent: number = 1
  ) {}

  /**
   * Add operation to queue
   */
  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        fn: fn as () => Promise<unknown>,
        resolve: resolve as (value: unknown) => void,
        reject,
      });
      
      if (!this.processing) {
        this.process();
      }
    });
  }

  /**
   * Process queue
   */
  private async process(): Promise<void> {
    this.processing = true;
    
    while (this.queue.length > 0) {
      const item = this.queue.shift();
      if (!item) continue;
      
      // Wait for minimum interval
      const elapsed = Date.now() - this.lastRequest;
      if (elapsed < this.minInterval) {
        await sleep(this.minInterval - elapsed);
      }
      
      this.lastRequest = Date.now();
      
      try {
        const result = await item.fn();
        item.resolve(result);
      } catch (error) {
        item.reject(error instanceof Error ? error : new Error(String(error)));
      }
    }
    
    this.processing = false;
  }

  /**
   * Clear queue
   */
  clear(): void {
    this.queue.forEach(({ reject }) => {
      reject(new Error('Queue cleared'));
    });
    this.queue = [];
  }

  /**
   * Get queue length
   */
  get length(): number {
    return this.queue.length;
  }
}

export default {
  withRetry,
  fetchWithRetry,
  createRetryWrapper,
  CircuitBreaker,
  withTimeout,
  retryWithTimeout,
  RateLimitedQueue,
};
