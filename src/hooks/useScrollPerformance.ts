'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { scrollOptimizer, resizeOptimizer, visibilityManager } from '@/lib/domPerformance';

// Hook for optimized scroll handling
export function useScrollPosition(): {
  scrollY: number;
  direction: 'up' | 'down' | null;
  isScrolling: boolean;
} {
  const [scrollY, setScrollY] = useState(0);
  const [direction, setDirection] = useState<'up' | 'down' | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const unsubscribe = scrollOptimizer.subscribe((newScrollY, newDirection) => {
      setScrollY(newScrollY);
      setDirection(newDirection);
      setIsScrolling(true);

      // Clear previous timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Set scrolling to false after 150ms of no scroll
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    });

    return () => {
      unsubscribe();
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return { scrollY, direction, isScrolling };
}

// Hook for scroll-based header visibility
export function useScrollHeader(threshold = 50): {
  isVisible: boolean;
  isAtTop: boolean;
} {
  const [isVisible, setIsVisible] = useState(true);
  const [isAtTop, setIsAtTop] = useState(true);
  const lastScrollRef = useRef(0);

  useEffect(() => {
    const unsubscribe = scrollOptimizer.subscribe((scrollY, direction) => {
      setIsAtTop(scrollY < 10);

      // Only hide after passing threshold
      if (scrollY < threshold) {
        setIsVisible(true);
        return;
      }

      // Show header when scrolling up, hide when scrolling down
      if (direction === 'up') {
        setIsVisible(true);
      } else if (direction === 'down' && scrollY - lastScrollRef.current > 10) {
        setIsVisible(false);
      }

      lastScrollRef.current = scrollY;
    });

    return unsubscribe;
  }, [threshold]);

  return { isVisible, isAtTop };
}

// Hook for infinite scroll
export function useInfiniteScroll(
  onLoadMore: () => void,
  options: {
    threshold?: number;
    disabled?: boolean;
    hasMore?: boolean;
  } = {}
): {
  sentinelRef: (node: HTMLElement | null) => void;
  isLoading: boolean;
} {
  const { threshold = 200, disabled = false, hasMore = true } = options;
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef(onLoadMore);

  // Update ref when callback changes
  useEffect(() => {
    loadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  const sentinelRef = useCallback(
    (node: HTMLElement | null) => {
      if (disabled || !hasMore || isLoading) return;

      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      if (!node) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !isLoading) {
            setIsLoading(true);
            Promise.resolve(loadMoreRef.current()).finally(() => {
              setIsLoading(false);
            });
          }
        },
        { rootMargin: `${threshold}px` }
      );

      observerRef.current.observe(node);
    },
    [disabled, hasMore, isLoading, threshold]
  );

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return { sentinelRef, isLoading };
}

// Hook for responsive window size
export function useWindowSize(): {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
} {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const unsubscribe = resizeOptimizer.subscribe((width, height) => {
      setSize({ width, height });
    });

    return unsubscribe;
  }, []);

  return {
    ...size,
    isMobile: size.width < 768,
    isTablet: size.width >= 768 && size.width < 1024,
    isDesktop: size.width >= 1024,
  };
}

// Hook for element in viewport
export function useInView(
  options: IntersectionObserverInit = {}
): {
  ref: (node: HTMLElement | null) => void;
  isInView: boolean;
  entry: IntersectionObserverEntry | null;
} {
  const [isInView, setIsInView] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const ref = useCallback(
    (node: HTMLElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      if (!node) return;

      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          setIsInView(entry.isIntersecting);
          setEntry(entry);
        },
        { threshold: 0.1, ...options }
      );

      observerRef.current.observe(node);
    },
    [options]
  );

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return { ref, isInView, entry };
}

// Hook for page visibility
export function usePageVisibility(): boolean {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    setIsVisible(visibilityManager.isVisible());
    const unsubscribe = visibilityManager.subscribe(setIsVisible);
    return unsubscribe;
  }, []);

  return isVisible;
}

// Hook for scroll to element
export function useScrollTo(): {
  scrollToElement: (element: HTMLElement | string, options?: ScrollToOptions) => void;
  scrollToTop: (options?: ScrollToOptions) => void;
  scrollToBottom: (options?: ScrollToOptions) => void;
} {
  const scrollToElement = useCallback(
    (element: HTMLElement | string, options: ScrollToOptions = {}) => {
      const target = typeof element === 'string'
        ? document.querySelector(element)
        : element;

      if (!target) return;

      const { behavior = 'smooth', ...rest } = options;

      target.scrollIntoView({
        behavior,
        block: 'start',
        ...rest,
      });
    },
    []
  );

  const scrollToTop = useCallback((options: ScrollToOptions = {}) => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
      ...options,
    });
  }, []);

  const scrollToBottom = useCallback((options: ScrollToOptions = {}) => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth',
      ...options,
    });
  }, []);

  return { scrollToElement, scrollToTop, scrollToBottom };
}

// Hook for parallax effect
export function useParallax(speed = 0.5): {
  ref: (node: HTMLElement | null) => void;
  style: { transform: string };
} {
  const [offset, setOffset] = useState(0);
  const elementRef = useRef<HTMLElement | null>(null);
  const elementTopRef = useRef(0);

  useEffect(() => {
    const unsubscribe = scrollOptimizer.subscribe((scrollY) => {
      if (!elementRef.current) return;

      const rect = elementRef.current.getBoundingClientRect();
      const elementTop = rect.top + scrollY;
      
      if (elementTopRef.current !== elementTop) {
        elementTopRef.current = elementTop;
      }

      const windowHeight = window.innerHeight;
      const relativeScroll = scrollY - elementTopRef.current + windowHeight;
      
      if (relativeScroll > 0) {
        setOffset(relativeScroll * speed);
      }
    });

    return unsubscribe;
  }, [speed]);

  const ref = useCallback((node: HTMLElement | null) => {
    elementRef.current = node;
  }, []);

  return {
    ref,
    style: {
      transform: `translateY(${offset}px)`,
    },
  };
}
