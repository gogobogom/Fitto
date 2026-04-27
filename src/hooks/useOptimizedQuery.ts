'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { LRUCache, offlineStorage } from '@/lib/cacheStrategies';

export interface QueryOptions<T> {
  /** Enable caching */
  cache?: boolean;
  /** Cache time in milliseconds */
  cacheTime?: number;
  /** Stale time in milliseconds */
  staleTime?: number;
  /** Retry count on failure */
  retryCount?: number;
  /** Retry delay in milliseconds */
  retryDelay?: number;
  /** Enable offline support */
  offlineSupport?: boolean;
  /** Initial data */
  initialData?: T;
  /** Dependencies that trigger refetch */
  dependencies?: unknown[];
  /** Transform response data */
  transform?: (data: unknown) => T;
  /** Callback on success */
  onSuccess?: (data: T) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

export interface QueryResult<T> {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isStale: boolean;
  refetch: () => Promise<void>;
  invalidate: () => void;
}

// Global cache instance
const queryCache = new LRUCache<{ data: unknown; timestamp: number }>(100, 10 * 60 * 1000);

/**
 * Optimized query hook with caching and offline support
 */
export function useOptimizedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: QueryOptions<T> = {}
): QueryResult<T> {
  const {
    cache = true,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    staleTime = 30 * 1000, // 30 seconds
    retryCount = 3,
    retryDelay = 1000,
    offlineSupport = false,
    initialData,
    dependencies = [],
    transform,
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState<T | null>(initialData ?? null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState(false);

  const fetcherRef = useRef(fetcher);
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryCountRef = useRef(0);

  // Update fetcher ref
  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  // Check cache and fetch
  const fetchData = useCallback(async (forceRefetch = false) => {
    // Check cache first
    if (cache && !forceRefetch) {
      const cached = queryCache.get(key);
      if (cached) {
        const age = Date.now() - cached.timestamp;
        const cachedData = transform ? transform(cached.data) : (cached.data as T);
        
        setData(cachedData);
        setIsStale(age > staleTime);
        
        // If not stale, don't refetch
        if (age <= staleTime) {
          setIsLoading(false);
          return;
        }
      }
    }

    // Check offline storage
    if (offlineSupport && !navigator.onLine) {
      const offlineData = offlineStorage.load<T>(key, cacheTime);
      if (offlineData) {
        setData(offlineData);
        setIsLoading(false);
        setIsStale(true);
        return;
      }
    }

    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setIsError(false);
    setError(null);

    try {
      const result = await fetcherRef.current();
      const transformedData = transform ? transform(result) : result;

      // Cache the result
      if (cache) {
        queryCache.set(key, { data: result, timestamp: Date.now() });
      }

      // Save for offline
      if (offlineSupport) {
        void offlineStorage.save(key, result);
      }

      setData(transformedData);
      setIsStale(false);
      retryCountRef.current = 0;
      onSuccess?.(transformedData);
    } catch (err) {
      const fetchError = err instanceof Error ? err : new Error('Unknown error');
      
      // Retry logic
      if (retryCountRef.current < retryCount) {
        retryCountRef.current++;
        setTimeout(() => {
          void fetchData(forceRefetch);
        }, retryDelay * retryCountRef.current);
        return;
      }

      setIsError(true);
      setError(fetchError);
      onError?.(fetchError);
    } finally {
      setIsLoading(false);
    }
  }, [key, cache, cacheTime, staleTime, retryCount, retryDelay, offlineSupport, transform, onSuccess, onError]);

  // Initial fetch
  useEffect(() => {
    void fetchData();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ...dependencies]);

  // Refetch function
  const refetch = useCallback(async () => {
    retryCountRef.current = 0;
    await fetchData(true);
  }, [fetchData]);

  // Invalidate cache
  const invalidate = useCallback(() => {
    queryCache.delete(key);
    setIsStale(true);
  }, [key]);

  return {
    data,
    isLoading,
    isError,
    error,
    isStale,
    refetch,
    invalidate,
  };
}

/**
 * Mutation hook for create/update/delete operations
 */
export interface MutationOptions<TData, TVariables> {
  /** Callback on success */
  onSuccess?: (data: TData, variables: TVariables) => void;
  /** Callback on error */
  onError?: (error: Error, variables: TVariables) => void;
  /** Keys to invalidate on success */
  invalidateKeys?: string[];
  /** Optimistic update function */
  optimisticUpdate?: (variables: TVariables) => void;
  /** Rollback function on error */
  rollback?: (variables: TVariables) => void;
}

export interface MutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData | undefined>;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  data: TData | null;
  reset: () => void;
}

export function useMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: MutationOptions<TData, TVariables> = {}
): MutationResult<TData, TVariables> {
  const { onSuccess, onError, invalidateKeys, optimisticUpdate, rollback } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<TData | null>(null);

  const mutate = useCallback(async (variables: TVariables): Promise<TData | undefined> => {
    setIsLoading(true);
    setIsError(false);
    setError(null);

    // Apply optimistic update
    optimisticUpdate?.(variables);

    try {
      const result = await mutationFn(variables);
      setData(result);

      // Invalidate related queries
      invalidateKeys?.forEach((key) => {
        queryCache.delete(key);
      });

      onSuccess?.(result, variables);
      return result;
    } catch (err) {
      const mutationError = err instanceof Error ? err : new Error('Unknown error');
      setIsError(true);
      setError(mutationError);

      // Rollback optimistic update
      rollback?.(variables);

      onError?.(mutationError, variables);
      return undefined;
    } finally {
      setIsLoading(false);
    }
  }, [mutationFn, onSuccess, onError, invalidateKeys, optimisticUpdate, rollback]);

  const reset = useCallback(() => {
    setIsLoading(false);
    setIsError(false);
    setError(null);
    setData(null);
  }, []);

  return {
    mutate,
    isLoading,
    isError,
    error,
    data,
    reset,
  };
}

/**
 * Paginated query hook
 */
export interface PaginatedQueryOptions<T> extends Omit<QueryOptions<T[]>, 'transform'> {
  pageSize?: number;
}

export interface PaginatedQueryResult<T> {
  data: T[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  page: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  fetchNextPage: () => Promise<void>;
  fetchPrevPage: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function usePaginatedQuery<T>(
  key: string,
  fetcher: (page: number, pageSize: number) => Promise<{ data: T[]; hasMore: boolean }>,
  options: PaginatedQueryOptions<T> = {}
): PaginatedQueryResult<T> {
  const { pageSize = 20, ...queryOptions } = options;

  const [page, setPage] = useState(1);
  const [data, setData] = useState<T[]>([]);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchPage = useCallback(async (pageNum: number) => {
    const cacheKey = `${key}_page_${pageNum}`;
    
    // Check cache
    const cached = queryCache.get(cacheKey);
    if (cached) {
      const cachedData = cached.data as { data: T[]; hasMore: boolean };
      return cachedData;
    }

    const result = await fetcher(pageNum, pageSize);
    queryCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  }, [key, fetcher, pageSize]);

  const loadPage = useCallback(async (pageNum: number) => {
    setIsLoading(true);
    setIsError(false);
    setError(null);

    try {
      const result = await fetchPage(pageNum);
      setData(result.data);
      setHasNextPage(result.hasMore);
      setPage(pageNum);
      queryOptions.onSuccess?.(result.data);
    } catch (err) {
      const fetchError = err instanceof Error ? err : new Error('Unknown error');
      setIsError(true);
      setError(fetchError);
      queryOptions.onError?.(fetchError);
    } finally {
      setIsLoading(false);
    }
  }, [fetchPage, queryOptions]);

  // Initial load
  useEffect(() => {
    void loadPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const fetchNextPage = useCallback(async () => {
    if (hasNextPage && !isLoading) {
      await loadPage(page + 1);
    }
  }, [hasNextPage, isLoading, page, loadPage]);

  const fetchPrevPage = useCallback(async () => {
    if (page > 1 && !isLoading) {
      await loadPage(page - 1);
    }
  }, [page, isLoading, loadPage]);

  const refetch = useCallback(async () => {
    // Clear cache for this query
    for (const cacheKey of queryCache.keys()) {
      if (cacheKey.startsWith(`${key}_page_`)) {
        queryCache.delete(cacheKey);
      }
    }
    await loadPage(1);
  }, [key, loadPage]);

  return {
    data,
    isLoading,
    isError,
    error,
    page,
    hasNextPage,
    hasPrevPage: page > 1,
    fetchNextPage,
    fetchPrevPage,
    refetch,
  };
}

/**
 * Invalidate queries by key prefix
 */
export function invalidateQueries(keyPrefix: string): void {
  for (const key of queryCache.keys()) {
    if (key.startsWith(keyPrefix)) {
      queryCache.delete(key);
    }
  }
}

/**
 * Clear all query cache
 */
export function clearQueryCache(): void {
  queryCache.clear();
}

export default {
  useOptimizedQuery,
  useMutation,
  usePaginatedQuery,
  invalidateQueries,
  clearQueryCache,
};
