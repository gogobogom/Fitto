'use client';

/**
 * Error Recovery Hook
 * Automatic error recovery and fallback handling
 */

import { useState, useCallback, useEffect, useRef } from 'react';

export interface ErrorRecoveryOptions {
  /** Maximum recovery attempts */
  maxAttempts?: number;
  /** Delay between attempts in ms */
  retryDelay?: number;
  /** Exponential backoff */
  exponentialBackoff?: boolean;
  /** Auto-recover on mount */
  autoRecover?: boolean;
  /** Recovery timeout */
  timeout?: number;
  /** Custom recovery function */
  onRecover?: () => Promise<void>;
  /** Custom error handler */
  onError?: (error: Error, attempt: number) => void;
  /** On recovery success */
  onSuccess?: () => void;
}

export interface ErrorRecoveryState {
  /** Current error */
  error: Error | null;
  /** Is recovering */
  isRecovering: boolean;
  /** Recovery attempt count */
  attempts: number;
  /** Last recovery time */
  lastRecoveryTime: number | null;
  /** Is recovered */
  isRecovered: boolean;
}

export interface ErrorRecoveryActions {
  /** Trigger recovery */
  recover: () => Promise<boolean>;
  /** Reset error state */
  reset: () => void;
  /** Set error manually */
  setError: (error: Error) => void;
  /** Wrap async function with error recovery */
  withRecovery: <T>(fn: () => Promise<T>) => Promise<T>;
}

const DEFAULT_OPTIONS: Required<Omit<ErrorRecoveryOptions, 'onRecover' | 'onError' | 'onSuccess'>> = {
  maxAttempts: 3,
  retryDelay: 1000,
  exponentialBackoff: true,
  autoRecover: false,
  timeout: 30000,
};

/**
 * Hook for error recovery with automatic retry
 */
export function useErrorRecovery(
  options: ErrorRecoveryOptions = {}
): ErrorRecoveryState & ErrorRecoveryActions {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  const [state, setState] = useState<ErrorRecoveryState>({
    error: null,
    isRecovering: false,
    attempts: 0,
    lastRecoveryTime: null,
    isRecovered: false,
  });
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate delay with optional exponential backoff
  const calculateDelay = useCallback((attempt: number): number => {
    if (!config.exponentialBackoff) {
      return config.retryDelay;
    }
    return config.retryDelay * Math.pow(2, attempt);
  }, [config.retryDelay, config.exponentialBackoff]);

  // Perform recovery
  const recover = useCallback(async (): Promise<boolean> => {
    if (state.isRecovering) {
      return false;
    }

    // Cancel any previous recovery attempt
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setState((prev) => ({
      ...prev,
      isRecovering: true,
      isRecovered: false,
    }));

    let currentAttempt = 0;

    while (currentAttempt < config.maxAttempts) {
      try {
        // Check if aborted
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error('Recovery aborted');
        }

        // Execute recovery function if provided
        if (options.onRecover) {
          await Promise.race([
            options.onRecover(),
            new Promise<never>((_, reject) => {
              timeoutRef.current = setTimeout(() => {
                reject(new Error('Recovery timeout'));
              }, config.timeout);
            }),
          ]);
        }

        // Clear timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Success
        setState({
          error: null,
          isRecovering: false,
          attempts: currentAttempt + 1,
          lastRecoveryTime: Date.now(),
          isRecovered: true,
        });

        options.onSuccess?.();
        return true;
      } catch (error) {
        currentAttempt++;
        const err = error instanceof Error ? error : new Error(String(error));
        
        options.onError?.(err, currentAttempt);

        if (currentAttempt >= config.maxAttempts) {
          setState((prev) => ({
            ...prev,
            error: err,
            isRecovering: false,
            attempts: currentAttempt,
            isRecovered: false,
          }));
          return false;
        }

        // Wait before next attempt
        const delay = calculateDelay(currentAttempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    return false;
  }, [
    state.isRecovering,
    config.maxAttempts,
    config.timeout,
    options,
    calculateDelay,
  ]);

  // Reset error state
  const reset = useCallback((): void => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setState({
      error: null,
      isRecovering: false,
      attempts: 0,
      lastRecoveryTime: null,
      isRecovered: false,
    });
  }, []);

  // Set error manually
  const setError = useCallback((error: Error): void => {
    setState((prev) => ({
      ...prev,
      error,
      isRecovered: false,
    }));

    if (config.autoRecover) {
      recover();
    }
  }, [config.autoRecover, recover]);

  // Wrap async function with error recovery
  const withRecovery = useCallback(async <T>(
    fn: () => Promise<T>
  ): Promise<T> => {
    try {
      return await fn();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setError(err);
      throw err;
    }
  }, [setError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    recover,
    reset,
    setError,
    withRecovery,
  };
}

/**
 * Hook for component-level error boundary
 */
export function useComponentError(): {
  error: Error | null;
  hasError: boolean;
  clearError: () => void;
  throwError: (error: Error) => never;
  captureError: (error: unknown) => void;
} {
  const [error, setError] = useState<Error | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const throwError = useCallback((error: Error): never => {
    throw error;
  }, []);

  const captureError = useCallback((error: unknown) => {
    if (error instanceof Error) {
      setError(error);
    } else {
      setError(new Error(String(error)));
    }
  }, []);

  return {
    error,
    hasError: error !== null,
    clearError,
    throwError,
    captureError,
  };
}

/**
 * Hook for async operation with error handling
 */
export function useAsyncWithError<T>(
  asyncFn: () => Promise<T>,
  deps: unknown[] = []
): {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  retry: () => void;
} {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const execute = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await asyncFn();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [asyncFn]);

  const retry = useCallback(() => {
    setRetryCount((prev) => prev + 1);
  }, []);

  useEffect(() => {
    execute();
  }, [...deps, retryCount, execute]);

  return { data, error, isLoading, retry };
}

/**
 * Hook for graceful degradation
 */
export function useGracefulDegradation<T>(
  primaryFn: () => Promise<T>,
  fallbackValue: T,
  options: {
    timeout?: number;
    retries?: number;
    onFallback?: () => void;
  } = {}
): {
  data: T;
  isUsingFallback: boolean;
  error: Error | null;
  retry: () => void;
} {
  const { timeout = 5000, retries = 2, onFallback } = options;
  
  const [data, setData] = useState<T>(fallbackValue);
  const [isUsingFallback, setIsUsingFallback] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const execute = useCallback(async () => {
    let attempts = 0;

    while (attempts <= retries) {
      try {
        const result = await Promise.race([
          primaryFn(),
          new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Timeout')), timeout);
          }),
        ]);

        setData(result);
        setIsUsingFallback(false);
        setError(null);
        return;
      } catch (err) {
        attempts++;
        if (attempts > retries) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsUsingFallback(true);
          onFallback?.();
        }
      }
    }
  }, [primaryFn, fallbackValue, timeout, retries, onFallback]);

  const retry = useCallback(() => {
    setRetryCount((prev) => prev + 1);
  }, []);

  useEffect(() => {
    execute();
  }, [execute, retryCount]);

  return { data, isUsingFallback, error, retry };
}

export default {
  useErrorRecovery,
  useComponentError,
  useAsyncWithError,
  useGracefulDegradation,
};
