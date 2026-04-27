'use client';

import { useEffect, useRef, useState, useCallback, type RefObject } from 'react';

interface UseLazyLoadOptions {
  /** Root element for intersection observer */
  root?: Element | null;
  /** Root margin for intersection observer */
  rootMargin?: string;
  /** Threshold for intersection observer */
  threshold?: number | number[];
  /** Whether to unobserve after first intersection */
  triggerOnce?: boolean;
  /** Delay before triggering (ms) */
  delay?: number;
}

interface UseLazyLoadResult<T extends Element> {
  ref: RefObject<T | null>;
  isVisible: boolean;
  hasTriggered: boolean;
}

/**
 * Hook for lazy loading based on intersection observer
 */
export function useLazyLoad<T extends Element = HTMLDivElement>(
  options: UseLazyLoadOptions = {}
): UseLazyLoadResult<T> {
  const {
    root = null,
    rootMargin = '100px',
    threshold = 0,
    triggerOnce = true,
    delay = 0,
  } = options;
  
  const ref = useRef<T | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        
        if (entry.isIntersecting) {
          if (delay > 0) {
            setTimeout(() => {
              setIsVisible(true);
              setHasTriggered(true);
            }, delay);
          } else {
            setIsVisible(true);
            setHasTriggered(true);
          }
          
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { root, rootMargin, threshold }
    );
    
    observer.observe(element);
    
    return () => {
      observer.unobserve(element);
    };
  }, [root, rootMargin, threshold, triggerOnce, delay]);
  
  return { ref, isVisible, hasTriggered };
}

/**
 * Hook for lazy loading images
 */
export function useLazyImage(src: string, options: UseLazyLoadOptions = {}) {
  const { ref, isVisible } = useLazyLoad<HTMLImageElement>(options);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    if (!isVisible || !src) return;
    
    const img = new Image();
    
    img.onload = () => {
      setIsLoaded(true);
      setError(null);
    };
    
    img.onerror = () => {
      setError(new Error(`Failed to load image: ${src}`));
      setIsLoaded(false);
    };
    
    img.src = src;
    
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [isVisible, src]);
  
  return {
    ref,
    isVisible,
    isLoaded,
    error,
    src: isVisible ? src : undefined,
  };
}

/**
 * Hook for lazy loading components with preloading support
 */
export function useLazyComponent<T>(
  importFn: () => Promise<{ default: T }>,
  options: UseLazyLoadOptions & { preload?: boolean } = {}
) {
  const { preload = false, ...lazyOptions } = options;
  const { ref, isVisible, hasTriggered } = useLazyLoad(lazyOptions);
  const [Component, setComponent] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Preload on mount if enabled
  useEffect(() => {
    if (preload) {
      importFn()
        .then((module) => {
          setComponent(() => module.default);
        })
        .catch(() => {
          // Ignore preload errors
        });
    }
  }, [preload, importFn]);
  
  // Load when visible
  useEffect(() => {
    if (!isVisible || Component) return;
    
    setIsLoading(true);
    
    importFn()
      .then((module) => {
        setComponent(() => module.default);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err : new Error('Failed to load component'));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isVisible, Component, importFn]);
  
  return {
    ref,
    Component,
    isLoading,
    error,
    isVisible,
    hasTriggered,
  };
}

/**
 * Hook for infinite scroll
 */
export function useInfiniteScroll(
  loadMore: () => void | Promise<void>,
  options: {
    threshold?: number;
    rootMargin?: string;
    enabled?: boolean;
    loading?: boolean;
  } = {}
) {
  const {
    threshold = 0.1,
    rootMargin = '200px',
    enabled = true,
    loading = false,
  } = options;
  
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  useEffect(() => {
    const element = loaderRef.current;
    if (!element || !enabled || loading || isLoadingMore) return;
    
    const observer = new IntersectionObserver(
      async (entries) => {
        const [entry] = entries;
        
        if (entry.isIntersecting && !isLoadingMore) {
          setIsLoadingMore(true);
          
          try {
            await loadMore();
          } finally {
            setIsLoadingMore(false);
          }
        }
      },
      { threshold, rootMargin }
    );
    
    observer.observe(element);
    
    return () => {
      observer.unobserve(element);
    };
  }, [loadMore, threshold, rootMargin, enabled, loading, isLoadingMore]);
  
  return {
    loaderRef,
    isLoadingMore,
  };
}

/**
 * Hook for virtual scrolling (simple implementation)
 */
export function useVirtualScroll<T>(
  items: T[],
  options: {
    itemHeight: number;
    containerHeight: number;
    overscan?: number;
  }
) {
  const { itemHeight, containerHeight, overscan = 3 } = options;
  const [scrollTop, setScrollTop] = useState(0);
  
  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / itemHeight) + 2 * overscan;
  const endIndex = Math.min(items.length, startIndex + visibleCount);
  
  const visibleItems = items.slice(startIndex, endIndex).map((item, index) => ({
    item,
    index: startIndex + index,
    style: {
      position: 'absolute' as const,
      top: (startIndex + index) * itemHeight,
      height: itemHeight,
      width: '100%',
    },
  }));
  
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);
  
  return {
    visibleItems,
    totalHeight,
    handleScroll,
    containerStyle: {
      height: containerHeight,
      overflow: 'auto' as const,
      position: 'relative' as const,
    },
    innerStyle: {
      height: totalHeight,
      position: 'relative' as const,
    },
  };
}

/**
 * Hook for prefetching data
 */
export function usePrefetch<T>(
  fetchFn: () => Promise<T>,
  options: {
    enabled?: boolean;
    delay?: number;
    cacheKey?: string;
  } = {}
) {
  const { enabled = true, delay = 100, cacheKey } = options;
  const [data, setData] = useState<T | null>(null);
  const [isPrefetching, setIsPrefetching] = useState(false);
  const hasPrefetched = useRef(false);
  
  // Simple in-memory cache
  const cache = useRef<Map<string, T>>(new Map());
  
  const prefetch = useCallback(async () => {
    if (hasPrefetched.current) return;
    
    // Check cache first
    if (cacheKey && cache.current.has(cacheKey)) {
      setData(cache.current.get(cacheKey)!);
      return;
    }
    
    setIsPrefetching(true);
    hasPrefetched.current = true;
    
    try {
      const result = await fetchFn();
      setData(result);
      
      if (cacheKey) {
        cache.current.set(cacheKey, result);
      }
    } finally {
      setIsPrefetching(false);
    }
  }, [fetchFn, cacheKey]);
  
  // Auto-prefetch with delay
  useEffect(() => {
    if (!enabled) return;
    
    const timer = setTimeout(prefetch, delay);
    return () => clearTimeout(timer);
  }, [enabled, delay, prefetch]);
  
  return {
    data,
    isPrefetching,
    prefetch,
    hasPrefetched: hasPrefetched.current,
  };
}
