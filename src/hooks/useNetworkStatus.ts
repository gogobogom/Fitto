'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  networkManager, 
  type NetworkInfo,
  getRecommendedQuality,
  getOptimalBatchSize,
  getOptimalTimeout,
  type QualityLevel
} from '@/lib/networkAwareLoading';

// Basic network status hook
export function useNetworkStatus(): NetworkInfo {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>(() => 
    networkManager.getInfo()
  );

  useEffect(() => {
    const unsubscribe = networkManager.subscribe(setNetworkInfo);
    return unsubscribe;
  }, []);

  return networkInfo;
}

// Hook for online/offline status
export function useOnlineStatus(): {
  isOnline: boolean;
  wasOffline: boolean;
  offlineSince: Date | null;
} {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const [offlineSince, setOfflineSince] = useState<Date | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setOfflineSince(null);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setOfflineSince(new Date());
    };

    // Set initial state
    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, wasOffline, offlineSince };
}

// Hook for adaptive quality
export function useAdaptiveQuality(): {
  quality: QualityLevel;
  setQuality: (quality: QualityLevel) => void;
  isAuto: boolean;
  setAuto: (auto: boolean) => void;
} {
  const [quality, setQualityState] = useState<QualityLevel>('auto');
  const [isAuto, setIsAuto] = useState(true);
  const networkInfo = useNetworkStatus();

  // Update quality when network changes (if auto)
  useEffect(() => {
    if (isAuto) {
      setQualityState(getRecommendedQuality());
    }
  }, [networkInfo, isAuto]);

  const setQuality = useCallback((newQuality: QualityLevel) => {
    if (newQuality === 'auto') {
      setIsAuto(true);
      setQualityState(getRecommendedQuality());
    } else {
      setIsAuto(false);
      setQualityState(newQuality);
    }
  }, []);

  const setAuto = useCallback((auto: boolean) => {
    setIsAuto(auto);
    if (auto) {
      setQualityState(getRecommendedQuality());
    }
  }, []);

  return { quality, setQuality, isAuto, setAuto };
}

// Hook for network-aware batch loading
export function useBatchLoader<T>(
  fetchFn: (offset: number, limit: number) => Promise<T[]>,
  options: {
    defaultBatchSize?: number;
    autoLoad?: boolean;
  } = {}
): {
  items: T[];
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  reset: () => void;
  batchSize: number;
} {
  const { defaultBatchSize = 20, autoLoad = false } = options;
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  
  const networkInfo = useNetworkStatus();
  const batchSize = getOptimalBatchSize(defaultBatchSize);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setError(null);

    try {
      const newItems = await fetchFn(offset, batchSize);
      
      if (newItems.length < batchSize) {
        setHasMore(false);
      }

      setItems(prev => [...prev, ...newItems]);
      setOffset(prev => prev + newItems.length);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn, offset, batchSize, isLoading, hasMore]);

  const reset = useCallback(() => {
    setItems([]);
    setOffset(0);
    setHasMore(true);
    setError(null);
  }, []);

  // Auto load on mount if enabled
  useEffect(() => {
    if (autoLoad && items.length === 0 && !isLoading) {
      loadMore();
    }
  }, [autoLoad]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    items,
    isLoading,
    error,
    hasMore,
    loadMore,
    reset,
    batchSize,
  };
}

// Hook for network-aware timeouts
export function useNetworkTimeout(baseTimeout = 10000): number {
  const networkInfo = useNetworkStatus();
  return getOptimalTimeout(baseTimeout);
}

// Hook for data saver mode
export function useDataSaver(): {
  isDataSaverEnabled: boolean;
  shouldReduceData: boolean;
} {
  const networkInfo = useNetworkStatus();

  return {
    isDataSaverEnabled: networkInfo.saveData,
    shouldReduceData: networkInfo.saveData || 
      ['slow-2g', '2g'].includes(networkInfo.effectiveType),
  };
}

// Hook for connection quality indicator
export function useConnectionQuality(): {
  quality: 'excellent' | 'good' | 'fair' | 'poor' | 'offline';
  label: string;
  color: string;
} {
  const networkInfo = useNetworkStatus();

  if (!networkInfo.online) {
    return { quality: 'offline', label: 'Çevrimdışı', color: 'text-gray-500' };
  }

  if (networkInfo.effectiveType === '4g' && networkInfo.downlink > 5) {
    return { quality: 'excellent', label: 'Mükemmel', color: 'text-green-500' };
  }

  if (networkInfo.effectiveType === '4g' || 
      (networkInfo.effectiveType === '3g' && networkInfo.downlink > 2)) {
    return { quality: 'good', label: 'İyi', color: 'text-green-400' };
  }

  if (networkInfo.effectiveType === '3g') {
    return { quality: 'fair', label: 'Orta', color: 'text-yellow-500' };
  }

  return { quality: 'poor', label: 'Zayıf', color: 'text-red-500' };
}

// Hook for retry with network awareness
export function useNetworkAwareRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    retryOnOffline?: boolean;
  } = {}
): {
  execute: () => Promise<T>;
  isLoading: boolean;
  error: Error | null;
  retryCount: number;
  reset: () => void;
} {
  const { maxRetries = 3, baseDelay = 1000, retryOnOffline = true } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { isOnline } = useOnlineStatus();

  const execute = useCallback(async (): Promise<T> => {
    // Wait for online if offline and retryOnOffline is true
    if (!isOnline && retryOnOffline) {
      return new Promise((resolve, reject) => {
        const handleOnline = async () => {
          window.removeEventListener('online', handleOnline);
          try {
            const result = await fn();
            resolve(result);
          } catch (err) {
            reject(err);
          }
        };
        window.addEventListener('online', handleOnline);
      });
    }

    setIsLoading(true);
    setError(null);
    setRetryCount(0);

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await fn();
        setIsLoading(false);
        return result;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        setRetryCount(attempt + 1);

        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = baseDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    setIsLoading(false);
    setError(lastError);
    throw lastError;
  }, [fn, maxRetries, baseDelay, isOnline, retryOnOffline]);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setRetryCount(0);
  }, []);

  return { execute, isLoading, error, retryCount, reset };
}
