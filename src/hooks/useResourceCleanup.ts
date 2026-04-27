'use client';

/**
 * Resource Cleanup Hook
 * Kaynak temizleme hook'u - bellek sızıntılarını önler
 */

import { useEffect, useRef, useCallback } from 'react';

type CleanupFn = () => void;

interface ResourceCleanupAPI {
  // Event listeners
  addEventListener: <K extends keyof WindowEventMap>(
    target: EventTarget,
    type: K,
    listener: (ev: WindowEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions
  ) => void;
  
  // Timers
  setTimeout: (callback: () => void, delay: number) => ReturnType<typeof setTimeout>;
  setInterval: (callback: () => void, delay: number) => ReturnType<typeof setInterval>;
  
  // Animation frames
  requestAnimationFrame: (callback: FrameRequestCallback) => number;
  
  // Subscriptions
  addSubscription: (subscription: { unsubscribe: () => void }) => void;
  
  // Custom cleanup
  addCleanup: (cleanup: CleanupFn) => void;
  
  // AbortController
  getAbortSignal: () => AbortSignal;
}

export function useResourceCleanup(): ResourceCleanupAPI {
  const eventListenersRef = useRef<Array<{
    target: EventTarget;
    type: string;
    listener: EventListenerOrEventListenerObject;
    options?: boolean | AddEventListenerOptions;
  }>>([]);
  
  const timeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const intervalsRef = useRef<Set<ReturnType<typeof setInterval>>>(new Set());
  const animationFramesRef = useRef<Set<number>>(new Set());
  const subscriptionsRef = useRef<Set<{ unsubscribe: () => void }>>(new Set());
  const customCleanupsRef = useRef<Set<CleanupFn>>(new Set());
  const abortControllerRef = useRef<AbortController | null>(null);

  // Add event listener with auto cleanup
  const addEventListener = useCallback(<K extends keyof WindowEventMap>(
    target: EventTarget,
    type: K,
    listener: (ev: WindowEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions
  ) => {
    target.addEventListener(type, listener as EventListener, options);
    eventListenersRef.current.push({
      target,
      type,
      listener: listener as EventListener,
      options,
    });
  }, []);

  // setTimeout with auto cleanup
  const setTimeoutSafe = useCallback((callback: () => void, delay: number) => {
    const id = setTimeout(() => {
      timeoutsRef.current.delete(id);
      callback();
    }, delay);
    timeoutsRef.current.add(id);
    return id;
  }, []);

  // setInterval with auto cleanup
  const setIntervalSafe = useCallback((callback: () => void, delay: number) => {
    const id = setInterval(callback, delay);
    intervalsRef.current.add(id);
    return id;
  }, []);

  // requestAnimationFrame with auto cleanup
  const requestAnimationFrameSafe = useCallback((callback: FrameRequestCallback) => {
    const id = requestAnimationFrame((time) => {
      animationFramesRef.current.delete(id);
      callback(time);
    });
    animationFramesRef.current.add(id);
    return id;
  }, []);

  // Add subscription with auto cleanup
  const addSubscription = useCallback((subscription: { unsubscribe: () => void }) => {
    subscriptionsRef.current.add(subscription);
  }, []);

  // Add custom cleanup function
  const addCleanup = useCallback((cleanup: CleanupFn) => {
    customCleanupsRef.current.add(cleanup);
  }, []);

  // Get abort signal for fetch requests
  const getAbortSignal = useCallback(() => {
    if (!abortControllerRef.current) {
      abortControllerRef.current = new AbortController();
    }
    return abortControllerRef.current.signal;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up event listeners
      eventListenersRef.current.forEach(({ target, type, listener, options }) => {
        target.removeEventListener(type, listener, options);
      });
      eventListenersRef.current = [];

      // Clean up timeouts
      timeoutsRef.current.forEach(id => clearTimeout(id));
      timeoutsRef.current.clear();

      // Clean up intervals
      intervalsRef.current.forEach(id => clearInterval(id));
      intervalsRef.current.clear();

      // Clean up animation frames
      animationFramesRef.current.forEach(id => cancelAnimationFrame(id));
      animationFramesRef.current.clear();

      // Clean up subscriptions
      subscriptionsRef.current.forEach(sub => {
        try {
          sub.unsubscribe();
        } catch (e) {
          console.warn('Subscription cleanup failed:', e);
        }
      });
      subscriptionsRef.current.clear();

      // Run custom cleanups
      customCleanupsRef.current.forEach(cleanup => {
        try {
          cleanup();
        } catch (e) {
          console.warn('Custom cleanup failed:', e);
        }
      });
      customCleanupsRef.current.clear();

      // Abort any pending fetch requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  return {
    addEventListener,
    setTimeout: setTimeoutSafe,
    setInterval: setIntervalSafe,
    requestAnimationFrame: requestAnimationFrameSafe,
    addSubscription,
    addCleanup,
    getAbortSignal,
  };
}

// Hook for safe fetch with auto-cancellation
export function useSafeFetch(): {
  fetch: (url: string, options?: RequestInit) => Promise<Response>;
  abort: () => void;
} {
  const abortControllerRef = useRef<AbortController | null>(null);

  const safeFetch = useCallback(async (url: string, options?: RequestInit) => {
    // Abort previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    return fetch(url, {
      ...options,
      signal: abortControllerRef.current.signal,
    });
  }, []);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return { fetch: safeFetch, abort };
}

// Hook for tracking mounted state
export function useMountedState(): () => boolean {
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return useCallback(() => mountedRef.current, []);
}

// Hook for safe async operations
export function useSafeAsync<T>(): {
  execute: (asyncFn: () => Promise<T>) => Promise<T | undefined>;
  isLoading: boolean;
  error: Error | null;
  data: T | null;
} {
  const isMounted = useMountedState();
  const [state, setState] = useRef({
    isLoading: false,
    error: null as Error | null,
    data: null as T | null,
  });

  const forceUpdate = useRef<() => void>(() => {});
  const [, setTick] = useState(0);
  forceUpdate.current = () => setTick(t => t + 1);

  const execute = useCallback(async (asyncFn: () => Promise<T>) => {
    state.current.isLoading = true;
    state.current.error = null;
    forceUpdate.current();

    try {
      const result = await asyncFn();
      
      if (isMounted()) {
        state.current.data = result;
        state.current.isLoading = false;
        forceUpdate.current();
        return result;
      }
    } catch (error) {
      if (isMounted()) {
        state.current.error = error as Error;
        state.current.isLoading = false;
        forceUpdate.current();
      }
    }
    
    return undefined;
  }, [isMounted]);

  return {
    execute,
    isLoading: state.current.isLoading,
    error: state.current.error,
    data: state.current.data,
  };
}

// Need to import useState
import { useState } from 'react';

// Hook for debounced cleanup
export function useDebouncedCleanup(
  cleanupFn: () => void,
  delay: number = 1000
): void {
  const cleanupRef = useRef(cleanupFn);
  cleanupRef.current = cleanupFn;

  useEffect(() => {
    const timer = setTimeout(() => {
      cleanupRef.current();
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [delay]);
}

// Hook for tracking DOM element references
export function useDOMRefs<T extends HTMLElement>(): {
  refs: Map<string, T>;
  setRef: (key: string) => (el: T | null) => void;
  getRef: (key: string) => T | undefined;
  removeRef: (key: string) => void;
  clearRefs: () => void;
} {
  const refsRef = useRef<Map<string, T>>(new Map());

  const setRef = useCallback((key: string) => (el: T | null) => {
    if (el) {
      refsRef.current.set(key, el);
    } else {
      refsRef.current.delete(key);
    }
  }, []);

  const getRef = useCallback((key: string) => {
    return refsRef.current.get(key);
  }, []);

  const removeRef = useCallback((key: string) => {
    refsRef.current.delete(key);
  }, []);

  const clearRefs = useCallback(() => {
    refsRef.current.clear();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      refsRef.current.clear();
    };
  }, []);

  return {
    refs: refsRef.current,
    setRef,
    getRef,
    removeRef,
    clearRefs,
  };
}
