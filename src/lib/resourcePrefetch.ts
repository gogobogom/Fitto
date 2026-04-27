/**
 * Resource Prefetch & Preload System
 * Optimizes resource loading for better performance
 */

// Critical resources that should be preloaded
const CRITICAL_RESOURCES = [
  '/api/health',
  '/manifest.json',
] as const;

// Resources to prefetch when idle
const PREFETCH_RESOURCES = [
  '/api/announcements',
] as const;

interface PrefetchOptions {
  priority?: 'high' | 'low';
  timeout?: number;
}

interface ResourceCacheEntry {
  data: unknown;
  timestamp: number;
  ttl: number;
}

// Simple in-memory cache for prefetched data
const resourceCache = new Map<string, ResourceCacheEntry>();

/**
 * Preload critical resources
 */
export async function preloadCriticalResources(): Promise<void> {
  if (typeof window === 'undefined') return;

  const preloadPromises = CRITICAL_RESOURCES.map(async (url) => {
    try {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = url;
      link.as = 'fetch';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    } catch {
      // Silently fail for individual resources
    }
  });

  await Promise.allSettled(preloadPromises);
}

/**
 * Prefetch a resource with caching
 */
export async function prefetchResource<T = unknown>(
  url: string,
  options: PrefetchOptions = {}
): Promise<T | null> {
  const { priority = 'low', timeout = 5000 } = options;

  // Check cache first
  const cached = resourceCache.get(url);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data as T;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: 'GET',
      priority: priority === 'high' ? 'high' : 'low',
      signal: controller.signal,
      headers: {
        'X-Prefetch': 'true',
      },
    } as RequestInit);

    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const contentType = response.headers.get('content-type');
    let data: T;

    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text() as T;
    }

    // Cache for 5 minutes
    resourceCache.set(url, {
      data,
      timestamp: Date.now(),
      ttl: 5 * 60 * 1000,
    });

    return data;
  } catch {
    return null;
  }
}

/**
 * Get cached resource if available
 */
export function getCachedResource<T = unknown>(url: string): T | null {
  const cached = resourceCache.get(url);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data as T;
  }
  return null;
}

/**
 * Clear resource cache
 */
export function clearResourceCache(): void {
  resourceCache.clear();
}

/**
 * Schedule prefetch when browser is idle
 */
export function schedulePrefetch(): void {
  if (typeof window === 'undefined') return;

  const prefetchWhenIdle = () => {
    PREFETCH_RESOURCES.forEach((url) => {
      // Use void to explicitly ignore the promise
      void prefetchResource(url, { priority: 'low' });
    });
  };

  // Use requestIdleCallback if available
  if ('requestIdleCallback' in window) {
    (window as Window & { requestIdleCallback: (cb: () => void) => void })
      .requestIdleCallback(prefetchWhenIdle);
  } else {
    // Fallback to setTimeout
    setTimeout(prefetchWhenIdle, 2000);
  }
}

/**
 * Preload an image
 */
export function preloadImage(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

/**
 * Preload multiple images
 */
export async function preloadImages(srcs: string[]): Promise<Map<string, boolean>> {
  const results = new Map<string, boolean>();
  
  await Promise.all(
    srcs.map(async (src) => {
      const success = await preloadImage(src);
      results.set(src, success);
    })
  );
  
  return results;
}

/**
 * DNS prefetch for external domains
 */
export function dnsPrefetch(domains: string[]): void {
  if (typeof document === 'undefined') return;

  domains.forEach((domain) => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = domain;
    document.head.appendChild(link);
  });
}

/**
 * Preconnect to critical origins
 */
export function preconnect(origins: string[]): void {
  if (typeof document === 'undefined') return;

  origins.forEach((origin) => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = origin;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}

/**
 * Initialize resource optimization
 */
export function initResourceOptimization(): void {
  if (typeof window === 'undefined') return;

  // Preconnect to Supabase
  preconnect([
    'https://wkpsimlalongfpjwovtx.supabase.co',
  ]);

  // DNS prefetch for analytics and CDNs
  dnsPrefetch([
    'https://vercel.com',
    'https://fonts.googleapis.com',
  ]);

  // Schedule prefetch when idle
  schedulePrefetch();

  // Preload critical resources after initial render
  if (document.readyState === 'complete') {
    void preloadCriticalResources();
  } else {
    window.addEventListener('load', () => {
      void preloadCriticalResources();
    }, { once: true });
  }
}
