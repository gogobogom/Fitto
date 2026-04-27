'use client';

/**
 * SSR Performance Hook
 * Client-side utilities for SSR optimization
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook to detect hydration status
 */
export function useHydration(): boolean {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return isHydrated;
}

/**
 * Hook for client-only rendering
 */
export function useClientOnly<T>(
  serverValue: T,
  clientValue: T
): T {
  const isHydrated = useHydration();
  return isHydrated ? clientValue : serverValue;
}

/**
 * Hook for deferred content loading
 */
export function useDeferredContent(delay: number = 0): boolean {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (delay === 0) {
      // Use requestIdleCallback for zero delay
      if ('requestIdleCallback' in window) {
        const id = requestIdleCallback(() => setShouldRender(true));
        return () => cancelIdleCallback(id);
      } else {
        setShouldRender(true);
      }
    } else {
      const timer = setTimeout(() => setShouldRender(true), delay);
      return () => clearTimeout(timer);
    }
  }, [delay]);

  return shouldRender;
}

/**
 * Hook for streaming-friendly component loading
 */
export function useStreamingReady(): {
  isReady: boolean;
  markReady: () => void;
} {
  const [isReady, setIsReady] = useState(false);

  const markReady = useCallback(() => {
    setIsReady(true);
  }, []);

  return { isReady, markReady };
}

/**
 * Hook for measuring component render time
 */
export function useRenderTime(componentName: string): {
  renderTime: number | null;
  measureStart: () => void;
  measureEnd: () => void;
} {
  const [renderTime, setRenderTime] = useState<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const measureStart = useCallback(() => {
    startTimeRef.current = performance.now();
  }, []);

  const measureEnd = useCallback(() => {
    if (startTimeRef.current !== null) {
      const endTime = performance.now();
      const duration = endTime - startTimeRef.current;
      setRenderTime(duration);

      // Log for debugging in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Render Time] ${componentName}: ${duration.toFixed(2)}ms`);
      }

      startTimeRef.current = null;
    }
  }, [componentName]);

  return { renderTime, measureStart, measureEnd };
}

/**
 * Hook for prefetching data on hover
 */
export function usePrefetchOnHover<T>(
  fetcher: () => Promise<T>
): {
  prefetch: () => void;
  data: T | null;
  isLoading: boolean;
  error: Error | null;
} {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const hasFetched = useRef(false);

  const prefetch = useCallback(async () => {
    if (hasFetched.current || isLoading) return;

    hasFetched.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Prefetch failed'));
    } finally {
      setIsLoading(false);
    }
  }, [fetcher, isLoading]);

  return { prefetch, data, isLoading, error };
}

/**
 * Hook for intersection-based component activation
 */
export function useIntersectionActivation(
  options: IntersectionObserverInit = {}
): {
  ref: (node: HTMLElement | null) => void;
  isActive: boolean;
} {
  const [isActive, setIsActive] = useState(false);
  const [element, setElement] = useState<HTMLElement | null>(null);

  const ref = useCallback((node: HTMLElement | null) => {
    setElement(node);
  }, []);

  useEffect(() => {
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsActive(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [element, options]);

  return { ref, isActive };
}

/**
 * Hook for route-based prefetching
 */
export function useRoutePrefetch(routes: string[]): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Use requestIdleCallback for prefetching
    const prefetchRoutes = () => {
      routes.forEach((route) => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = route;
        link.as = 'document';
        document.head.appendChild(link);
      });
    };

    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(prefetchRoutes);
      return () => cancelIdleCallback(id);
    } else {
      const timer = setTimeout(prefetchRoutes, 2000);
      return () => clearTimeout(timer);
    }
  }, [routes]);
}

/**
 * Hook for connection-aware loading
 */
export function useConnectionAwareLoading(): {
  effectiveType: string;
  saveData: boolean;
  shouldLoadHeavyAssets: boolean;
} {
  const [connectionInfo, setConnectionInfo] = useState({
    effectiveType: '4g',
    saveData: false,
    shouldLoadHeavyAssets: true,
  });

  useEffect(() => {
    if (typeof navigator === 'undefined') return;

    const connection = (navigator as Navigator & {
      connection?: {
        effectiveType?: string;
        saveData?: boolean;
      };
    }).connection;

    if (connection) {
      const updateConnectionInfo = () => {
        const effectiveType = connection.effectiveType || '4g';
        const saveData = connection.saveData || false;
        
        // Determine if we should load heavy assets
        const shouldLoadHeavyAssets =
          !saveData &&
          ['4g', '3g'].includes(effectiveType);

        setConnectionInfo({
          effectiveType,
          saveData,
          shouldLoadHeavyAssets,
        });
      };

      updateConnectionInfo();

      connection.addEventListener?.('change', updateConnectionInfo);
      return () => {
        connection.removeEventListener?.('change', updateConnectionInfo);
      };
    }
  }, []);

  return connectionInfo;
}

/**
 * Hook for time-to-interactive measurement
 */
export function useTTI(): {
  tti: number | null;
  isInteractive: boolean;
} {
  const [tti, setTTI] = useState<number | null>(null);
  const [isInteractive, setIsInteractive] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const measureTTI = () => {
      // Wait for all resources to load
      if (document.readyState === 'complete') {
        // Use PerformanceObserver for Long Tasks
        if ('PerformanceObserver' in window) {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            if (entries.length === 0) {
              // No long tasks, we're interactive
              const navigationStart = performance.timing?.navigationStart || 0;
              const interactiveTime = performance.now();
              setTTI(navigationStart ? interactiveTime : null);
              setIsInteractive(true);
              observer.disconnect();
            }
          });

          try {
            observer.observe({ entryTypes: ['longtask'] });
          } catch {
            // longtask not supported
            setIsInteractive(true);
          }

          // Timeout fallback
          setTimeout(() => {
            setIsInteractive(true);
            observer.disconnect();
          }, 5000);
        } else {
          setIsInteractive(true);
        }
      } else {
        window.addEventListener('load', measureTTI);
        return () => window.removeEventListener('load', measureTTI);
      }
    };

    measureTTI();
  }, []);

  return { tti, isInteractive };
}

/**
 * Hook for first contentful paint measurement
 */
export function useFCP(): number | null {
  const [fcp, setFCP] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntriesByName('first-contentful-paint');
      if (entries.length > 0) {
        setFCP(entries[0].startTime);
        observer.disconnect();
      }
    });

    try {
      observer.observe({ type: 'paint', buffered: true });
    } catch {
      // paint type not supported
    }

    return () => observer.disconnect();
  }, []);

  return fcp;
}

/**
 * Hook for largest contentful paint measurement
 */
export function useLCP(): number | null {
  const [lcp, setLCP] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        setLCP(lastEntry.startTime);
      }
    });

    try {
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {
      // LCP not supported
    }

    return () => observer.disconnect();
  }, []);

  return lcp;
}

export default {
  useHydration,
  useClientOnly,
  useDeferredContent,
  useStreamingReady,
  useRenderTime,
  usePrefetchOnHover,
  useIntersectionActivation,
  useRoutePrefetch,
  useConnectionAwareLoading,
  useTTI,
  useFCP,
  useLCP,
};
