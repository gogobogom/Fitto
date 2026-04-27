'use client';

/**
 * Intersection Observer Hooks
 * Görünürlük gözlem hook'ları
 */

import { useEffect, useRef, useState, useCallback } from 'react';

// Basic intersection observer hook
export function useIntersection(
  options: IntersectionObserverInit = {}
): [React.RefObject<HTMLElement | null>, boolean, IntersectionObserverEntry | null] {
  const ref = useRef<HTMLElement | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
      setEntry(entry);
    }, options);

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [options.root, options.rootMargin, options.threshold]);

  return [ref, isIntersecting, entry];
}

// Hook for lazy loading
export function useLazyLoad(
  rootMargin: string = '100px'
): [React.RefObject<HTMLElement | null>, boolean] {
  const [ref, isIntersecting] = useIntersection({
    rootMargin,
    threshold: 0,
  });
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (isIntersecting && !hasLoaded) {
      setHasLoaded(true);
    }
  }, [isIntersecting, hasLoaded]);

  return [ref, hasLoaded];
}

// Hook for infinite scroll
export function useInfiniteScroll(
  onLoadMore: () => Promise<void>,
  options: {
    rootMargin?: string;
    enabled?: boolean;
  } = {}
): [React.RefObject<HTMLElement | null>, boolean] {
  const { rootMargin = '200px', enabled = true } = options;
  const [ref, isIntersecting] = useIntersection({ rootMargin });
  const [isLoading, setIsLoading] = useState(false);
  const loadingRef = useRef(false);

  useEffect(() => {
    if (!isIntersecting || !enabled || loadingRef.current) return;

    loadingRef.current = true;
    setIsLoading(true);

    onLoadMore()
      .finally(() => {
        loadingRef.current = false;
        setIsLoading(false);
      });
  }, [isIntersecting, enabled, onLoadMore]);

  return [ref, isLoading];
}

// Hook for scroll spy
export function useScrollSpy(
  sectionIds: string[],
  options: {
    rootMargin?: string;
    threshold?: number;
  } = {}
): string | null {
  const { rootMargin = '-50% 0px -50% 0px', threshold = 0 } = options;
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const elements = sectionIds
      .map(id => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin, threshold }
    );

    elements.forEach(el => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, [sectionIds, rootMargin, threshold]);

  return activeId;
}

// Hook for visibility tracking
export function useVisibilityTracking(
  onVisible: (visibilityRatio: number) => void,
  options: {
    threshold?: number[];
  } = {}
): React.RefObject<HTMLElement | null> {
  const { threshold = [0, 0.25, 0.5, 0.75, 1] } = options;
  const ref = useRef<HTMLElement | null>(null);
  const onVisibleRef = useRef(onVisible);
  onVisibleRef.current = onVisible;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onVisibleRef.current(entry.intersectionRatio);
        }
      },
      { threshold }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold]);

  return ref;
}

// Hook for animate on scroll
export function useAnimateOnScroll(
  animationClass: string,
  options: {
    rootMargin?: string;
    threshold?: number;
    once?: boolean;
  } = {}
): [React.RefObject<HTMLElement | null>, boolean] {
  const { rootMargin = '0px', threshold = 0.1, once = true } = options;
  const ref = useRef<HTMLElement | null>(null);
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.classList.add(animationClass);
          setIsAnimated(true);
          if (once) {
            observer.unobserve(element);
          }
        } else if (!once) {
          element.classList.remove(animationClass);
          setIsAnimated(false);
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [animationClass, rootMargin, threshold, once]);

  return [ref, isAnimated];
}

// Hook for preload on approach
export function usePreloadOnApproach(
  preloadFn: () => void,
  rootMargin: string = '500px'
): React.RefObject<HTMLElement | null> {
  const ref = useRef<HTMLElement | null>(null);
  const hasPreloadedRef = useRef(false);
  const preloadFnRef = useRef(preloadFn);
  preloadFnRef.current = preloadFn;

  useEffect(() => {
    const element = ref.current;
    if (!element || hasPreloadedRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasPreloadedRef.current) {
          hasPreloadedRef.current = true;
          preloadFnRef.current();
          observer.unobserve(element);
        }
      },
      { rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [rootMargin]);

  return ref;
}

// Hook for element in viewport percentage
export function useViewportPercentage(
  threshold: number[] = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]
): [React.RefObject<HTMLElement | null>, number] {
  const ref = useRef<HTMLElement | null>(null);
  const [percentage, setPercentage] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setPercentage(Math.round(entry.intersectionRatio * 100));
      },
      { threshold }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold]);

  return [ref, percentage];
}

// Hook for sticky detection
export function useSticky(): [React.RefObject<HTMLElement | null>, boolean] {
  const ref = useRef<HTMLElement | null>(null);
  const [isSticky, setIsSticky] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Create sentinel element
    const sentinel = document.createElement('div');
    sentinel.style.cssText = 'position: absolute; top: -1px; height: 1px; width: 100%; pointer-events: none;';
    sentinelRef.current = sentinel;

    const parent = element.parentElement;
    if (parent) {
      const originalPosition = parent.style.position;
      parent.style.position = 'relative';
      parent.insertBefore(sentinel, element);

      const observer = new IntersectionObserver(
        ([entry]) => {
          setIsSticky(!entry.isIntersecting);
        },
        { threshold: [1] }
      );

      observer.observe(sentinel);

      return () => {
        observer.disconnect();
        sentinel.remove();
        parent.style.position = originalPosition;
      };
    }
  }, []);

  return [ref, isSticky];
}

// Hook for multiple elements observation
export function useMultipleIntersection(
  count: number,
  options: IntersectionObserverInit = {}
): [React.RefObject<(HTMLElement | null)[]>, boolean[]] {
  const refs = useRef<(HTMLElement | null)[]>(Array(count).fill(null));
  const [intersecting, setIntersecting] = useState<boolean[]>(Array(count).fill(false));

  const setRef = useCallback((index: number) => (el: HTMLElement | null) => {
    refs.current[index] = el;
  }, []);

  useEffect(() => {
    const elements = refs.current.filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        setIntersecting(prev => {
          const next = [...prev];
          entries.forEach(entry => {
            const index = refs.current.indexOf(entry.target as HTMLElement);
            if (index !== -1) {
              next[index] = entry.isIntersecting;
            }
          });
          return next;
        });
      },
      options
    );

    elements.forEach(el => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, [count, options.root, options.rootMargin, options.threshold]);

  return [refs, intersecting];
}
