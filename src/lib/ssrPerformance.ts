/**
 * SSR Performance Optimizations
 * Server-Side Rendering performance utilities for Next.js
 */

import { cache } from 'react';

/**
 * Server-side data cache with TTL
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const serverCache = new Map<string, CacheEntry<unknown>>();

/**
 * Cache server data with TTL (Time To Live)
 */
export function cacheServerData<T>(
  key: string,
  data: T,
  ttlSeconds: number = 60
): T {
  serverCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: ttlSeconds * 1000,
  });
  return data;
}

/**
 * Get cached server data
 */
export function getCachedServerData<T>(key: string): T | null {
  const entry = serverCache.get(key) as CacheEntry<T> | undefined;
  
  if (!entry) return null;
  
  const isExpired = Date.now() - entry.timestamp > entry.ttl;
  if (isExpired) {
    serverCache.delete(key);
    return null;
  }
  
  return entry.data;
}

/**
 * Clear server cache
 */
export function clearServerCache(key?: string): void {
  if (key) {
    serverCache.delete(key);
  } else {
    serverCache.clear();
  }
}

/**
 * React cache wrapper for expensive computations
 */
export const cachedComputation = cache(
  <T>(fn: () => T): T => fn()
);

/**
 * Memoize async server function
 */
export function memoizeServerFn<T, Args extends unknown[]>(
  fn: (...args: Args) => Promise<T>,
  keyGenerator: (...args: Args) => string,
  ttlSeconds: number = 60
): (...args: Args) => Promise<T> {
  return async (...args: Args): Promise<T> => {
    const key = keyGenerator(...args);
    
    const cached = getCachedServerData<T>(key);
    if (cached !== null) {
      return cached;
    }
    
    const result = await fn(...args);
    cacheServerData(key, result, ttlSeconds);
    return result;
  };
}

/**
 * Streaming-friendly data preparation
 */
export interface StreamableData<T> {
  data: T;
  isPartial: boolean;
  nextChunk?: () => Promise<StreamableData<T>>;
}

export function createStreamableData<T>(
  initialData: T,
  fetchMore?: () => Promise<T>
): StreamableData<T> {
  return {
    data: initialData,
    isPartial: !!fetchMore,
    nextChunk: fetchMore
      ? async () => createStreamableData(await fetchMore())
      : undefined,
  };
}

/**
 * Prefetch hints for client
 */
export interface PrefetchHint {
  type: 'dns-prefetch' | 'preconnect' | 'prefetch' | 'prerender' | 'preload';
  href: string;
  as?: 'script' | 'style' | 'image' | 'font' | 'document';
  crossorigin?: 'anonymous' | 'use-credentials';
}

export function generatePrefetchHints(urls: string[]): PrefetchHint[] {
  const hints: PrefetchHint[] = [];
  const domains = new Set<string>();
  
  urls.forEach((url) => {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.origin;
      
      // DNS prefetch for external domains
      if (!domains.has(domain)) {
        domains.add(domain);
        hints.push({
          type: 'dns-prefetch',
          href: domain,
        });
        hints.push({
          type: 'preconnect',
          href: domain,
          crossorigin: 'anonymous',
        });
      }
      
      // Determine resource type
      const ext = url.split('.').pop()?.toLowerCase();
      if (ext === 'js') {
        hints.push({ type: 'prefetch', href: url, as: 'script' });
      } else if (ext === 'css') {
        hints.push({ type: 'prefetch', href: url, as: 'style' });
      } else if (['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif'].includes(ext || '')) {
        hints.push({ type: 'prefetch', href: url, as: 'image' });
      }
    } catch {
      // Invalid URL, skip
    }
  });
  
  return hints;
}

/**
 * Generate link headers for resource hints
 */
export function generateLinkHeaders(hints: PrefetchHint[]): string {
  return hints
    .map((hint) => {
      let header = `<${hint.href}>; rel=${hint.type}`;
      if (hint.as) header += `; as=${hint.as}`;
      if (hint.crossorigin) header += `; crossorigin=${hint.crossorigin}`;
      return header;
    })
    .join(', ');
}

/**
 * Server timing metrics
 */
interface ServerTiming {
  name: string;
  duration: number;
  description?: string;
}

const serverTimings: ServerTiming[] = [];

export function startServerTiming(name: string): () => void {
  const start = performance.now();
  
  return () => {
    const duration = performance.now() - start;
    serverTimings.push({ name, duration });
  };
}

export function addServerTiming(
  name: string,
  duration: number,
  description?: string
): void {
  serverTimings.push({ name, duration, description });
}

export function getServerTimingHeader(): string {
  const header = serverTimings
    .map((t) => {
      let entry = `${t.name};dur=${t.duration.toFixed(2)}`;
      if (t.description) entry += `;desc="${t.description}"`;
      return entry;
    })
    .join(', ');
  
  serverTimings.length = 0; // Clear after generating
  return header;
}

/**
 * Component-level caching hints
 */
export interface CacheConfig {
  revalidate: number | false;
  tags?: string[];
}

export function getCacheConfig(componentName: string): CacheConfig {
  const configs: Record<string, CacheConfig> = {
    // Static components - rarely change
    Footer: { revalidate: 86400, tags: ['static'] }, // 24 hours
    Header: { revalidate: 3600, tags: ['static'] }, // 1 hour
    
    // Dynamic components - change frequently
    Dashboard: { revalidate: 60, tags: ['user-data'] }, // 1 minute
    MealList: { revalidate: 30, tags: ['meals'] }, // 30 seconds
    
    // User-specific - no caching
    Profile: { revalidate: false },
    Settings: { revalidate: false },
  };
  
  return configs[componentName] || { revalidate: 60 };
}

/**
 * Conditional rendering based on user agent
 */
export function parseUserAgent(userAgent: string): {
  isMobile: boolean;
  isBot: boolean;
  browser: string;
  os: string;
} {
  const ua = userAgent.toLowerCase();
  
  return {
    isMobile: /mobile|android|iphone|ipad|ipod/i.test(ua),
    isBot: /bot|crawler|spider|googlebot|bingbot|slurp/i.test(ua),
    browser: ua.includes('chrome')
      ? 'chrome'
      : ua.includes('firefox')
      ? 'firefox'
      : ua.includes('safari')
      ? 'safari'
      : ua.includes('edge')
      ? 'edge'
      : 'other',
    os: ua.includes('windows')
      ? 'windows'
      : ua.includes('mac')
      ? 'macos'
      : ua.includes('linux')
      ? 'linux'
      : ua.includes('android')
      ? 'android'
      : ua.includes('ios')
      ? 'ios'
      : 'other',
  };
}

/**
 * Edge-optimized response headers
 */
export function getOptimalCacheHeaders(options: {
  isStatic?: boolean;
  isPrivate?: boolean;
  maxAge?: number;
  staleWhileRevalidate?: number;
}): Record<string, string> {
  const {
    isStatic = false,
    isPrivate = false,
    maxAge = 60,
    staleWhileRevalidate = 86400,
  } = options;

  const headers: Record<string, string> = {};

  if (isStatic) {
    headers['Cache-Control'] = `public, max-age=${maxAge}, s-maxage=${maxAge * 10}, stale-while-revalidate=${staleWhileRevalidate}`;
  } else if (isPrivate) {
    headers['Cache-Control'] = 'private, no-store, must-revalidate';
  } else {
    headers['Cache-Control'] = `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`;
  }

  // Add Vary header for proper caching
  headers['Vary'] = 'Accept-Encoding, Accept';

  return headers;
}

/**
 * Static generation helpers
 */
export function generateStaticParams<T extends Record<string, string>>(
  items: T[],
  paramKey: keyof T
): Array<{ [K in keyof T]: string }> {
  return items.map((item) => ({
    [paramKey]: String(item[paramKey]),
  })) as Array<{ [K in keyof T]: string }>;
}

/**
 * ISR (Incremental Static Regeneration) helper
 */
export function getISRConfig(route: string): {
  revalidate: number;
  dynamicParams: boolean;
} {
  const configs: Record<string, { revalidate: number; dynamicParams: boolean }> = {
    '/': { revalidate: 3600, dynamicParams: false },
    '/tarifler': { revalidate: 1800, dynamicParams: true },
    '/nutrition': { revalidate: 300, dynamicParams: true },
  };

  return configs[route] || { revalidate: 60, dynamicParams: true };
}

/**
 * Server component data fetching with timeout
 */
export async function fetchWithTimeout<T>(
  fetcher: () => Promise<T>,
  timeoutMs: number = 5000,
  fallback: T
): Promise<T> {
  const timeoutPromise = new Promise<T>((_, reject) => {
    setTimeout(() => reject(new Error('Fetch timeout')), timeoutMs);
  });

  try {
    return await Promise.race([fetcher(), timeoutPromise]);
  } catch {
    return fallback;
  }
}

/**
 * Parallel data fetching with error isolation
 */
export async function parallelFetch<T extends Record<string, () => Promise<unknown>>>(
  fetchers: T
): Promise<{ [K in keyof T]: Awaited<ReturnType<T[K]>> | null }> {
  const keys = Object.keys(fetchers) as Array<keyof T>;
  const promises = keys.map(async (key) => {
    try {
      return { key, data: await fetchers[key]() };
    } catch {
      return { key, data: null };
    }
  });

  const results = await Promise.all(promises);
  
  return results.reduce(
    (acc, { key, data }) => {
      acc[key] = data as Awaited<ReturnType<T[typeof key]>> | null;
      return acc;
    },
    {} as { [K in keyof T]: Awaited<ReturnType<T[K]>> | null }
  );
}

/**
 * Request deduplication for server components
 */
const pendingRequests = new Map<string, Promise<unknown>>();

export function deduplicatedFetch<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  const existing = pendingRequests.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = fetcher().finally(() => {
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, promise);
  return promise;
}

/**
 * Precompute heavy data on server
 */
export function precomputeData<T, R>(
  data: T,
  computations: Array<{
    key: string;
    compute: (data: T) => R;
  }>
): T & Record<string, R> {
  const result = { ...data } as T & Record<string, R>;
  
  computations.forEach(({ key, compute }) => {
    result[key as keyof typeof result] = compute(data) as (T & Record<string, R>)[keyof T & Record<string, R>];
  });
  
  return result;
}

/**
 * Server-side HTML minification hints
 */
export const htmlOptimizationHints = {
  removeComments: true,
  collapseWhitespace: true,
  removeAttributeQuotes: true,
  removeRedundantAttributes: true,
  useShortDoctype: true,
  removeEmptyAttributes: true,
  minifyJS: true,
  minifyCSS: true,
};

/**
 * Generate efficient JSON response
 */
export function createEfficientJSON<T>(data: T): string {
  // Remove null/undefined values to reduce payload
  const cleaned = JSON.parse(JSON.stringify(data, (_, value) => {
    if (value === null || value === undefined) return undefined;
    return value;
  }));
  
  return JSON.stringify(cleaned);
}

export default {
  cacheServerData,
  getCachedServerData,
  clearServerCache,
  cachedComputation,
  memoizeServerFn,
  createStreamableData,
  generatePrefetchHints,
  generateLinkHeaders,
  startServerTiming,
  addServerTiming,
  getServerTimingHeader,
  getCacheConfig,
  parseUserAgent,
  getOptimalCacheHeaders,
  generateStaticParams,
  getISRConfig,
  fetchWithTimeout,
  parallelFetch,
  deduplicatedFetch,
  precomputeData,
  htmlOptimizationHints,
  createEfficientJSON,
};
