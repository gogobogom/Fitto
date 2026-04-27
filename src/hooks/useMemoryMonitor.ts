'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface MemoryInfo {
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
  jsHeapSizeLimit?: number;
  usagePercent?: number;
}

interface MemoryWarning {
  level: 'normal' | 'warning' | 'critical';
  message: string;
  timestamp: number;
}

interface UseMemoryMonitorOptions {
  /** Interval for memory checks in ms. Default: 10000 (10s) */
  interval?: number;
  /** Warning threshold (0-1). Default: 0.7 */
  warningThreshold?: number;
  /** Critical threshold (0-1). Default: 0.9 */
  criticalThreshold?: number;
  /** Auto cleanup on critical. Default: true */
  autoCleanup?: boolean;
}

interface UseMemoryMonitorResult {
  memory: MemoryInfo;
  warning: MemoryWarning | null;
  isSupported: boolean;
  triggerGC: () => void;
  clearCaches: () => void;
  getMemoryTrend: () => 'increasing' | 'stable' | 'decreasing';
}

// Memory history for trend analysis
const memoryHistory: number[] = [];
const MAX_HISTORY = 10;

/**
 * Hook for monitoring memory usage
 */
export function useMemoryMonitor(
  options: UseMemoryMonitorOptions = {}
): UseMemoryMonitorResult {
  const {
    interval = 10000,
    warningThreshold = 0.7,
    criticalThreshold = 0.9,
    autoCleanup = true,
  } = options;

  const [memory, setMemory] = useState<MemoryInfo>({});
  const [warning, setWarning] = useState<MemoryWarning | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const cleanupTriggeredRef = useRef(false);

  // Check if Performance.memory is supported
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const perf = performance as Performance & {
        memory?: {
          usedJSHeapSize: number;
          totalJSHeapSize: number;
          jsHeapSizeLimit: number;
        };
      };
      setIsSupported(!!perf.memory);
    }
  }, []);

  // Get memory info
  const getMemoryInfo = useCallback((): MemoryInfo => {
    if (typeof window === 'undefined') return {};

    const perf = performance as Performance & {
      memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      };
    };

    if (!perf.memory) return {};

    const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = perf.memory;
    const usagePercent = usedJSHeapSize / jsHeapSizeLimit;

    return {
      usedJSHeapSize,
      totalJSHeapSize,
      jsHeapSizeLimit,
      usagePercent,
    };
  }, []);

  // Clear various caches
  const clearCaches = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Clear localStorage cache items (not critical data)
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('cache_') || key.startsWith('prefetch_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch {
      // Ignore storage errors
    }

    // Clear sessionStorage cache
    try {
      sessionStorage.clear();
    } catch {
      // Ignore storage errors
    }

    // Clear performance entries
    if (performance.clearResourceTimings) {
      performance.clearResourceTimings();
    }

    console.log('[Memory Monitor] Caches cleared');
  }, []);

  // Attempt to trigger garbage collection (limited browser support)
  const triggerGC = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Clear caches first
    clearCaches();

    // Some browsers expose gc() in dev mode
    const globalObj = window as Window & { gc?: () => void };
    if (typeof globalObj.gc === 'function') {
      globalObj.gc();
      console.log('[Memory Monitor] GC triggered');
    }
  }, [clearCaches]);

  // Get memory trend
  const getMemoryTrend = useCallback((): 'increasing' | 'stable' | 'decreasing' => {
    if (memoryHistory.length < 3) return 'stable';

    const recent = memoryHistory.slice(-5);
    const first = recent[0];
    const last = recent[recent.length - 1];
    const diff = (last - first) / first;

    if (diff > 0.1) return 'increasing';
    if (diff < -0.1) return 'decreasing';
    return 'stable';
  }, []);

  // Monitor memory
  useEffect(() => {
    if (!isSupported) return;

    const checkMemory = () => {
      const info = getMemoryInfo();
      setMemory(info);

      // Track history
      if (info.usagePercent !== undefined) {
        memoryHistory.push(info.usagePercent);
        if (memoryHistory.length > MAX_HISTORY) {
          memoryHistory.shift();
        }
      }

      // Check thresholds
      if (info.usagePercent !== undefined) {
        if (info.usagePercent >= criticalThreshold) {
          setWarning({
            level: 'critical',
            message: `Kritik bellek kullanımı: ${(info.usagePercent * 100).toFixed(1)}%`,
            timestamp: Date.now(),
          });

          // Auto cleanup on critical
          if (autoCleanup && !cleanupTriggeredRef.current) {
            cleanupTriggeredRef.current = true;
            triggerGC();
            // Reset after 30 seconds
            setTimeout(() => {
              cleanupTriggeredRef.current = false;
            }, 30000);
          }
        } else if (info.usagePercent >= warningThreshold) {
          setWarning({
            level: 'warning',
            message: `Yüksek bellek kullanımı: ${(info.usagePercent * 100).toFixed(1)}%`,
            timestamp: Date.now(),
          });
        } else {
          setWarning(null);
        }
      }
    };

    // Initial check
    checkMemory();

    // Set up interval
    const intervalId = setInterval(checkMemory, interval);

    return () => {
      clearInterval(intervalId);
    };
  }, [
    isSupported,
    interval,
    warningThreshold,
    criticalThreshold,
    autoCleanup,
    getMemoryInfo,
    triggerGC,
  ]);

  return {
    memory,
    warning,
    isSupported,
    triggerGC,
    clearCaches,
    getMemoryTrend,
  };
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export default useMemoryMonitor;
