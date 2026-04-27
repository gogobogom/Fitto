'use client';

import { useRef, useCallback, useMemo, useEffect, useState } from 'react';

/**
 * Debounce hook - delays execution until user stops triggering
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Debounced callback hook
 */
export function useDebouncedCallback<TArgs extends unknown[], TReturn>(
  callback: (...args: TArgs) => TReturn,
  delay: number
): (...args: TArgs) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback((...args: TArgs) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay]);
}

/**
 * Throttle hook - limits execution to once per interval
 */
export function useThrottledCallback<TArgs extends unknown[], TReturn>(
  callback: (...args: TArgs) => TReturn,
  limit: number
): (...args: TArgs) => void {
  const lastRun = useRef<number>(0);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback((...args: TArgs) => {
    const now = Date.now();
    if (now - lastRun.current >= limit) {
      lastRun.current = now;
      callbackRef.current(...args);
    }
  }, [limit]);
}

/**
 * Previous value hook - tracks previous value for comparison
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

/**
 * Deep comparison memo - prevents re-renders for deep equal objects
 */
export function useDeepMemo<T>(value: T): T {
  const ref = useRef<T>(value);

  const isEqual = useMemo(() => {
    return JSON.stringify(ref.current) === JSON.stringify(value);
  }, [value]);

  if (!isEqual) {
    ref.current = value;
  }

  return ref.current;
}

/**
 * Stable callback - callback that never changes reference
 */
export function useStableCallback<TArgs extends unknown[], TReturn>(
  callback: (...args: TArgs) => TReturn
): (...args: TArgs) => TReturn {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback((...args: TArgs) => {
    return callbackRef.current(...args);
  }, []);
}

/**
 * Render count hook - useful for debugging
 */
export function useRenderCount(componentName?: string): number {
  const renderCount = useRef(0);
  renderCount.current++;

  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && componentName) {
      console.log(`[Render] ${componentName}: ${renderCount.current}`);
    }
  });

  return renderCount.current;
}

/**
 * Why did you render - debug hook
 */
export function useWhyDidYouRender<T extends Record<string, unknown>>(
  componentName: string,
  props: T
): void {
  const previousProps = useRef<T>();

  useEffect(() => {
    if (previousProps.current && process.env.NODE_ENV === 'development') {
      const changedProps: string[] = [];

      Object.keys({ ...previousProps.current, ...props }).forEach((key) => {
        if (previousProps.current![key] !== props[key]) {
          changedProps.push(key);
        }
      });

      if (changedProps.length > 0) {
        console.log(`[WhyDidYouRender] ${componentName}:`, changedProps);
      }
    }
    previousProps.current = props;
  });
}

/**
 * Intersection observer hook - for lazy loading
 */
export function useIntersectionObserver(
  options?: IntersectionObserverInit
): {
  ref: (node: HTMLElement | null) => void;
  isIntersecting: boolean;
  entry: IntersectionObserverEntry | null;
} {
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const nodeRef = useRef<HTMLElement | null>(null);

  const ref = useCallback(
    (node: HTMLElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      if (node) {
        nodeRef.current = node;
        observerRef.current = new IntersectionObserver(([e]) => {
          setEntry(e);
          setIsIntersecting(e.isIntersecting);
        }, options);
        observerRef.current.observe(node);
      }
    },
    [options]
  );

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return { ref, isIntersecting, entry };
}

/**
 * Measure performance of a function
 */
export function usePerformanceMeasure(): {
  measure: <T>(name: string, fn: () => T) => T;
  asyncMeasure: <T>(name: string, fn: () => Promise<T>) => Promise<T>;
} {
  const measure = useCallback(<T>(name: string, fn: () => T): T => {
    if (process.env.NODE_ENV !== 'development') {
      return fn();
    }

    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
    return result;
  }, []);

  const asyncMeasure = useCallback(async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    if (process.env.NODE_ENV !== 'development') {
      return fn();
    }

    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
    return result;
  }, []);

  return { measure, asyncMeasure };
}

/**
 * Request Animation Frame hook
 */
export function useRAF(callback: (deltaTime: number) => void, isActive = true): void {
  const callbackRef = useRef(callback);
  const frameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!isActive) return;

    const animate = (time: number) => {
      const deltaTime = time - lastTimeRef.current;
      lastTimeRef.current = time;
      callbackRef.current(deltaTime);
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [isActive]);
}

export default {
  useDebounce,
  useDebouncedCallback,
  useThrottledCallback,
  usePrevious,
  useDeepMemo,
  useStableCallback,
  useRenderCount,
  useWhyDidYouRender,
  useIntersectionObserver,
  usePerformanceMeasure,
  useRAF,
};
