/**
 * Cache Strategies
 * Advanced caching utilities for better performance
 */

export type CacheStrategy = 
  | 'cache-first'
  | 'network-first'
  | 'stale-while-revalidate'
  | 'network-only'
  | 'cache-only';

export interface CacheConfig {
  /** Cache name */
  name: string;
  /** Maximum age in milliseconds */
  maxAge?: number;
  /** Maximum number of entries */
  maxEntries?: number;
  /** Strategy to use */
  strategy: CacheStrategy;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  etag?: string;
}

/**
 * In-memory cache with LRU eviction
 */
export class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly maxEntries: number;
  private readonly maxAge: number;

  constructor(maxEntries = 100, maxAge = 5 * 60 * 1000) {
    this.maxEntries = maxEntries;
    this.maxAge = maxAge;
  }

  /**
   * Get item from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    
    return entry.data;
  }

  /**
   * Set item in cache
   */
  set(key: string, data: T, etag?: string): void {
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      etag,
    });
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Delete item from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Prune expired entries
   */
  prune(): number {
    const now = Date.now();
    let pruned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.maxAge) {
        this.cache.delete(key);
        pruned++;
      }
    }
    
    return pruned;
  }
}

/**
 * Fetch with cache strategy
 */
export async function fetchWithStrategy<T>(
  url: string,
  strategy: CacheStrategy,
  cache: LRUCache<T>,
  fetchOptions?: RequestInit
): Promise<T> {
  const cacheKey = url;

  switch (strategy) {
    case 'cache-first': {
      const cached = cache.get(cacheKey);
      if (cached) return cached;
      
      const response = await fetch(url, fetchOptions);
      const data = await response.json() as T;
      cache.set(cacheKey, data);
      return data;
    }

    case 'network-first': {
      try {
        const response = await fetch(url, fetchOptions);
        const data = await response.json() as T;
        cache.set(cacheKey, data);
        return data;
      } catch {
        const cached = cache.get(cacheKey);
        if (cached) return cached;
        throw new Error('Network error and no cache available');
      }
    }

    case 'stale-while-revalidate': {
      const cached = cache.get(cacheKey);
      
      // Revalidate in background
      fetch(url, fetchOptions)
        .then((res) => res.json())
        .then((data) => cache.set(cacheKey, data as T))
        .catch(() => {/* ignore */});
      
      if (cached) return cached;
      
      const response = await fetch(url, fetchOptions);
      const data = await response.json() as T;
      cache.set(cacheKey, data);
      return data;
    }

    case 'network-only': {
      const response = await fetch(url, fetchOptions);
      return await response.json() as T;
    }

    case 'cache-only': {
      const cached = cache.get(cacheKey);
      if (cached) return cached;
      throw new Error('No cache available');
    }

    default:
      throw new Error(`Unknown strategy: ${strategy}`);
  }
}

/**
 * Request deduplication
 */
class RequestDeduplicator<T> {
  private pending = new Map<string, Promise<T>>();

  async dedupe(key: string, request: () => Promise<T>): Promise<T> {
    const existing = this.pending.get(key);
    if (existing) {
      return existing;
    }

    const promise = request().finally(() => {
      this.pending.delete(key);
    });

    this.pending.set(key, promise);
    return promise;
  }
}

export const requestDeduplicator = new RequestDeduplicator<unknown>();

/**
 * Batch requests together
 */
export class RequestBatcher<TKey, TResult> {
  private batch: TKey[] = [];
  private timer: NodeJS.Timeout | null = null;
  private resolver: ((results: Map<TKey, TResult>) => void) | null = null;
  private promise: Promise<Map<TKey, TResult>> | null = null;

  constructor(
    private readonly batchFn: (keys: TKey[]) => Promise<Map<TKey, TResult>>,
    private readonly delay = 10,
    private readonly maxBatchSize = 100
  ) {}

  async load(key: TKey): Promise<TResult | undefined> {
    this.batch.push(key);

    if (!this.promise) {
      this.promise = new Promise((resolve) => {
        this.resolver = resolve;
      });
    }

    if (this.batch.length >= this.maxBatchSize) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.delay);
    }

    const results = await this.promise;
    return results?.get(key);
  }

  private async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    const batch = this.batch;
    const resolver = this.resolver;

    this.batch = [];
    this.promise = null;
    this.resolver = null;

    if (batch.length === 0 || !resolver) return;

    try {
      const results = await this.batchFn(batch);
      resolver(results);
    } catch {
      resolver(new Map());
    }
  }
}

/**
 * Offline storage wrapper
 */
export const offlineStorage = {
  /**
   * Save data for offline use
   */
  async save(key: string, data: unknown): Promise<void> {
    if (typeof localStorage === 'undefined') return;
    
    try {
      localStorage.setItem(
        `offline_${key}`,
        JSON.stringify({
          data,
          timestamp: Date.now(),
        })
      );
    } catch {
      // Storage quota exceeded, clear old items
      this.pruneOldItems();
    }
  },

  /**
   * Load offline data
   */
  load<T>(key: string, maxAge = 24 * 60 * 60 * 1000): T | null {
    if (typeof localStorage === 'undefined') return null;
    
    const item = localStorage.getItem(`offline_${key}`);
    if (!item) return null;

    try {
      const { data, timestamp } = JSON.parse(item) as { data: T; timestamp: number };
      
      if (Date.now() - timestamp > maxAge) {
        localStorage.removeItem(`offline_${key}`);
        return null;
      }

      return data;
    } catch {
      return null;
    }
  },

  /**
   * Remove offline data
   */
  remove(key: string): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(`offline_${key}`);
  },

  /**
   * Prune old offline items
   */
  pruneOldItems(maxAge = 7 * 24 * 60 * 60 * 1000): void {
    if (typeof localStorage === 'undefined') return;

    const now = Date.now();
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('offline_')) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const { timestamp } = JSON.parse(item) as { timestamp: number };
            if (now - timestamp > maxAge) {
              keysToRemove.push(key);
            }
          }
        } catch {
          keysToRemove.push(key!);
        }
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
  },
};

/**
 * Create a typed cache for specific data
 */
export function createTypedCache<T>(options: {
  maxEntries?: number;
  maxAge?: number;
}): LRUCache<T> {
  return new LRUCache<T>(options.maxEntries, options.maxAge);
}

export default {
  LRUCache,
  fetchWithStrategy,
  requestDeduplicator,
  RequestBatcher,
  offlineStorage,
  createTypedCache,
};
