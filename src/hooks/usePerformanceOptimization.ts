'use client';

/**
 * Performance Optimization Hooks
 * Collection of hooks for optimizing React component performance
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';

/**
 * Stable callback that doesn't cause re-renders
 */
export function useStableCallback<T extends (...args: unknown[]) => unknown>(
  callback: T
): T {
  const callbackRef = useRef<T>(callback);
  
  // Update ref on every render
  useEffect(() => {
    callbackRef.current = callback;
  });

  // Return stable function that calls current ref
  return useCallback(
    ((...args: Parameters<T>) => callbackRef.current(...args)) as T,
    []
  );
}

/**
 * Previous value hook
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  
  useEffect(() => {
    ref.current = value;
  }, [value]);
  
  return ref.current;
}

/**
 * Deep comparison for dependencies
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  
  if (typeof a !== typeof b) return false;
  
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }
  
  if (typeof a === 'object' && a !== null && b !== null) {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b as object);
    
    if (aKeys.length !== bKeys.length) return false;
    
    return aKeys.every((key) => 
      deepEqual(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key]
      )
    );
  }
  
  return false;
}

/**
 * Deep memo hook
 */
export function useDeepMemo<T>(value: T): T {
  const ref = useRef<T>(value);
  
  if (!deepEqual(ref.current, value)) {
    ref.current = value;
  }
  
  return ref.current;
}

/**
 * Deep effect hook
 */
export function useDeepEffect(
  effect: () => void | (() => void),
  deps: unknown[]
): void {
  const ref = useRef<unknown[]>(deps);
  
  if (!deepEqual(ref.current, deps)) {
    ref.current = deps;
  }
  
  useEffect(effect, [ref.current, effect]);
}

/**
 * Update only when specific conditions are met
 */
export function useConditionalUpdate<T>(
  value: T,
  shouldUpdate: (prev: T, next: T) => boolean
): T {
  const ref = useRef<T>(value);
  
  if (shouldUpdate(ref.current, value)) {
    ref.current = value;
  }
  
  return ref.current;
}

/**
 * Batched state updates
 */
export function useBatchedState<T extends Record<string, unknown>>(
  initialState: T
): [T, (updates: Partial<T>) => void] {
  const [state, setState] = useState<T>(initialState);
  const pendingUpdates = useRef<Partial<T>>({});
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const batchedSetState = useCallback((updates: Partial<T>) => {
    pendingUpdates.current = { ...pendingUpdates.current, ...updates };
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setState((prev) => ({ ...prev, ...pendingUpdates.current }));
      pendingUpdates.current = {};
    }, 0);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [state, batchedSetState];
}

/**
 * Lazy initialization hook
 */
export function useLazyInit<T>(
  initializer: () => T
): T {
  const ref = useRef<{ value: T; initialized: boolean }>({
    value: undefined as T,
    initialized: false,
  });
  
  if (!ref.current.initialized) {
    ref.current.value = initializer();
    ref.current.initialized = true;
  }
  
  return ref.current.value;
}

/**
 * Computed value with memoization
 */
export function useComputed<T, D extends readonly unknown[]>(
  compute: (...deps: D) => T,
  deps: D
): T {
  return useMemo(() => compute(...deps), deps);
}

/**
 * Async state with loading and error handling
 */
export interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  isSuccess: boolean;
  isError: boolean;
}

export function useAsyncState<T>(
  initialData: T | null = null
): [AsyncState<T>, {
  setData: (data: T) => void;
  setLoading: () => void;
  setError: (error: Error) => void;
  reset: () => void;
}] {
  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    isLoading: false,
    error: null,
    isSuccess: false,
    isError: false,
  });

  const actions = useMemo(() => ({
    setData: (data: T) => setState({
      data,
      isLoading: false,
      error: null,
      isSuccess: true,
      isError: false,
    }),
    setLoading: () => setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    })),
    setError: (error: Error) => setState((prev) => ({
      ...prev,
      isLoading: false,
      error,
      isSuccess: false,
      isError: true,
    })),
    reset: () => setState({
      data: initialData,
      isLoading: false,
      error: null,
      isSuccess: false,
      isError: false,
    }),
  }), [initialData]);

  return [state, actions];
}

/**
 * Render count tracking (for debugging)
 */
export function useRenderCount(componentName?: string): number {
  const count = useRef(0);
  count.current++;
  
  if (process.env.NODE_ENV === 'development' && componentName) {
    console.log(`[${componentName}] Render count: ${count.current}`);
  }
  
  return count.current;
}

/**
 * Why did you update (for debugging)
 */
export function useWhyDidYouUpdate<T extends Record<string, unknown>>(
  name: string,
  props: T
): void {
  const previousProps = useRef<T | undefined>(undefined);

  useEffect(() => {
    if (previousProps.current && process.env.NODE_ENV === 'development') {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps: Record<string, { from: unknown; to: unknown }> = {};

      allKeys.forEach((key) => {
        if (previousProps.current![key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current![key],
            to: props[key],
          };
        }
      });

      if (Object.keys(changedProps).length > 0) {
        console.log(`[${name}] Changed props:`, changedProps);
      }
    }

    previousProps.current = props;
  });
}

/**
 * Force update hook
 */
export function useForceUpdate(): () => void {
  const [, setTick] = useState(0);
  return useCallback(() => setTick((tick) => tick + 1), []);
}

/**
 * Mounted state hook
 */
export function useIsMounted(): () => boolean {
  const isMountedRef = useRef(false);
  
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  return useCallback(() => isMountedRef.current, []);
}

/**
 * Safe state update that checks if component is mounted
 */
export function useSafeState<T>(
  initialState: T | (() => T)
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(initialState);
  const isMounted = useIsMounted();

  const safeSetState = useCallback(
    (value: T | ((prev: T) => T)) => {
      if (isMounted()) {
        setState(value);
      }
    },
    [isMounted]
  );

  return [state, safeSetState];
}

/**
 * Event listener with cleanup
 */
export function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  element: Window | HTMLElement | null = typeof window !== 'undefined' ? window : null,
  options?: AddEventListenerOptions
): void {
  const savedHandler = useRef(handler);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!element) return;

    const eventListener = (event: Event) => {
      savedHandler.current(event as WindowEventMap[K]);
    };

    element.addEventListener(eventName, eventListener, options);

    return () => {
      element.removeEventListener(eventName, eventListener, options);
    };
  }, [eventName, element, options]);
}

/**
 * Intersection observer hook
 */
export function useInView(
  options: IntersectionObserverInit = {}
): [React.RefObject<HTMLDivElement | null>, boolean] {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsInView(entry.isIntersecting);
    }, options);

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [options]);

  return [ref, isInView];
}

export default {
  useStableCallback,
  usePrevious,
  useDeepMemo,
  useDeepEffect,
  useConditionalUpdate,
  useBatchedState,
  useLazyInit,
  useComputed,
  useAsyncState,
  useRenderCount,
  useWhyDidYouUpdate,
  useForceUpdate,
  useIsMounted,
  useSafeState,
  useEventListener,
  useInView,
};
