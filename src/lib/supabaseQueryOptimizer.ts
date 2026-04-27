/**
 * Supabase Query Optimizer
 * Advanced query caching, batching, and optimization utilities
 */

import { supabase } from '@/lib/supabase/client';
import { LRUCache } from '@/lib/cacheStrategies';

// Query cache with 5 minute TTL
const queryCache = new LRUCache<unknown>(200, 5 * 60 * 1000);

// Pending queries for deduplication
const pendingQueries = new Map<string, Promise<unknown>>();

export interface QueryOptions {
  /** Cache key override */
  cacheKey?: string;
  /** Skip cache and fetch fresh */
  skipCache?: boolean;
  /** Cache TTL in milliseconds */
  cacheTTL?: number;
  /** Enable query deduplication */
  dedupe?: boolean;
}

export interface BatchQueryConfig<T> {
  table: string;
  column: string;
  values: (string | number)[];
  select?: string;
  transform?: (data: T[]) => Map<string | number, T>;
}

/**
 * Generate cache key from query parameters
 */
function generateCacheKey(
  table: string,
  query: Record<string, unknown>
): string {
  return `${table}:${JSON.stringify(query)}`;
}

/**
 * Execute cached query
 */
export async function cachedQuery<T>(
  table: string,
  queryBuilder: (query: ReturnType<typeof supabase.from>) => Promise<{ data: T | null; error: unknown }>,
  options: QueryOptions = {}
): Promise<T | null> {
  const cacheKey = options.cacheKey || `query:${table}:${Date.now()}`;

  // Check cache first
  if (!options.skipCache) {
    const cached = queryCache.get(cacheKey);
    if (cached !== null) {
      return cached as T;
    }
  }

  // Deduplicate identical in-flight requests
  if (options.dedupe !== false) {
    const pending = pendingQueries.get(cacheKey);
    if (pending) {
      return pending as Promise<T | null>;
    }
  }

  // Execute query
  const queryPromise = (async (): Promise<T | null> => {
    try {
      const { data, error } = await queryBuilder(supabase.from(table));
      
      if (error) {
        console.error(`Query error for ${table}:`, error);
        return null;
      }

      // Cache successful results
      if (data !== null) {
        queryCache.set(cacheKey, data);
      }

      return data;
    } finally {
      pendingQueries.delete(cacheKey);
    }
  })();

  pendingQueries.set(cacheKey, queryPromise);
  return queryPromise;
}

/**
 * Batch multiple queries into single request
 */
export async function batchQuery<T extends Record<string, unknown>>(
  config: BatchQueryConfig<T>
): Promise<Map<string | number, T>> {
  const { table, column, values, select = '*' } = config;

  if (values.length === 0) {
    return new Map();
  }

  // Split into chunks of 100 for Supabase limits
  const chunkSize = 100;
  const chunks: (string | number)[][] = [];
  
  for (let i = 0; i < values.length; i += chunkSize) {
    chunks.push(values.slice(i, i + chunkSize));
  }

  // Execute all chunks in parallel
  const results = await Promise.all(
    chunks.map(async (chunk) => {
      const { data, error } = await supabase
        .from(table)
        .select(select)
        .in(column, chunk);

      if (error) {
        console.error(`Batch query error for ${table}:`, error);
        return [];
      }

      return (data || []) as T[];
    })
  );

  // Combine results
  const allData = results.flat();

  // Transform to Map
  if (config.transform) {
    return config.transform(allData);
  }

  const resultMap = new Map<string | number, T>();
  allData.forEach((item) => {
    const key = item[column] as string | number;
    resultMap.set(key, item);
  });

  return resultMap;
}

/**
 * Prefetch queries for anticipated user actions
 */
export async function prefetchQueries(
  queries: Array<{
    table: string;
    cacheKey: string;
    query: (q: ReturnType<typeof supabase.from>) => Promise<{ data: unknown; error: unknown }>;
  }>
): Promise<void> {
  // Use requestIdleCallback if available
  const scheduleTask = typeof requestIdleCallback !== 'undefined'
    ? requestIdleCallback
    : (fn: () => void) => setTimeout(fn, 1);

  scheduleTask(() => {
    queries.forEach(({ table, cacheKey, query }) => {
      // Only prefetch if not already cached
      if (!queryCache.has(cacheKey)) {
        cachedQuery(table, query, { cacheKey, dedupe: true }).catch(() => {
          // Silently ignore prefetch errors
        });
      }
    });
  });
}

/**
 * Invalidate cache entries
 */
export function invalidateCache(pattern?: string): void {
  if (!pattern) {
    queryCache.clear();
    return;
  }

  const keys = queryCache.keys();
  keys.forEach((key) => {
    if (key.includes(pattern)) {
      queryCache.delete(key);
    }
  });
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  size: number;
  keys: string[];
} {
  return {
    size: queryCache.size,
    keys: queryCache.keys(),
  };
}

/**
 * Optimized select with automatic caching
 */
export async function optimizedSelect<T>(
  table: string,
  options: {
    select?: string;
    eq?: Record<string, unknown>;
    in?: { column: string; values: unknown[] };
    order?: { column: string; ascending?: boolean };
    limit?: number;
    single?: boolean;
  } = {}
): Promise<T | T[] | null> {
  const cacheKey = generateCacheKey(table, options);

  // Check cache
  const cached = queryCache.get(cacheKey);
  if (cached !== null) {
    return cached as T | T[];
  }

  // Build query
  let query = supabase.from(table).select(options.select || '*');

  // Apply filters
  if (options.eq) {
    Object.entries(options.eq).forEach(([column, value]) => {
      query = query.eq(column, value);
    });
  }

  if (options.in) {
    query = query.in(options.in.column, options.in.values);
  }

  if (options.order) {
    query = query.order(options.order.column, { ascending: options.order.ascending ?? true });
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  // Execute
  const result = options.single
    ? await query.single()
    : await query;

  if (result.error) {
    console.error(`Query error for ${table}:`, result.error);
    return null;
  }

  // Cache result
  if (result.data !== null) {
    queryCache.set(cacheKey, result.data);
  }

  return result.data as T | T[];
}

/**
 * Upsert with cache invalidation
 */
export async function optimizedUpsert<T extends Record<string, unknown>>(
  table: string,
  data: T | T[],
  options: {
    onConflict?: string;
    invalidatePattern?: string;
  } = {}
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from(table)
    .upsert(data, { onConflict: options.onConflict });

  if (error) {
    return { success: false, error: error.message };
  }

  // Invalidate related cache
  invalidateCache(options.invalidatePattern || table);

  return { success: true };
}

/**
 * Delete with cache invalidation
 */
export async function optimizedDelete(
  table: string,
  filters: Record<string, unknown>,
  options: {
    invalidatePattern?: string;
  } = {}
): Promise<{ success: boolean; error?: string }> {
  let query = supabase.from(table).delete();

  Object.entries(filters).forEach(([column, value]) => {
    query = query.eq(column, value);
  });

  const { error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  // Invalidate related cache
  invalidateCache(options.invalidatePattern || table);

  return { success: true };
}

/**
 * Real-time subscription with automatic cache updates
 */
export function subscribeWithCache(
  table: string,
  userId: string,
  onUpdate: (data: unknown) => void
): () => void {
  const channel = supabase
    .channel(`${table}_${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: table,
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        // Invalidate cache on any change
        invalidateCache(table);
        onUpdate(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export default {
  cachedQuery,
  batchQuery,
  prefetchQueries,
  invalidateCache,
  getCacheStats,
  optimizedSelect,
  optimizedUpsert,
  optimizedDelete,
  subscribeWithCache,
};
