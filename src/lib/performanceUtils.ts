/**
 * Performance Utilities
 * Helper functions for optimizing app performance
 */

/**
 * Debounce function - delays execution
 */
export function debounce<TArgs extends unknown[]>(
  func: (...args: TArgs) => void,
  wait: number
): (...args: TArgs) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: TArgs) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Throttle function - limits execution rate
 */
export function throttle<TArgs extends unknown[]>(
  func: (...args: TArgs) => void,
  limit: number
): (...args: TArgs) => void {
  let inThrottle = false;

  return (...args: TArgs) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Memoize function - caches results
 */
export function memoize<TArgs extends unknown[], TReturn>(
  func: (...args: TArgs) => TReturn,
  keyResolver?: (...args: TArgs) => string
): (...args: TArgs) => TReturn {
  const cache = new Map<string, TReturn>();

  return (...args: TArgs): TReturn => {
    const key = keyResolver ? keyResolver(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = func(...args);
    cache.set(key, result);
    return result;
  };
}

/**
 * Batch updates - groups multiple updates
 */
export function batchUpdates<T>(
  updates: Array<() => T>,
  callback: (results: T[]) => void
): void {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    (window as Window & { requestIdleCallback: (cb: () => void) => void })
      .requestIdleCallback(() => {
        const results = updates.map((update) => update());
        callback(results);
      });
  } else {
    setTimeout(() => {
      const results = updates.map((update) => update());
      callback(results);
    }, 0);
  }
}

/**
 * Chunk array - splits array for batch processing
 */
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Process in chunks with delay
 */
export async function processInChunks<T, R>(
  items: T[],
  processor: (item: T) => R | Promise<R>,
  chunkSize = 10,
  delayMs = 0
): Promise<R[]> {
  const results: R[] = [];
  const chunks = chunkArray(items, chunkSize);

  for (const chunk of chunks) {
    const chunkResults = await Promise.all(chunk.map(processor));
    results.push(...chunkResults);
    
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

/**
 * Lazy initialization - creates value only when needed
 */
export function lazy<T>(initializer: () => T): () => T {
  let value: T | undefined;
  let initialized = false;

  return () => {
    if (!initialized) {
      value = initializer();
      initialized = true;
    }
    return value as T;
  };
}

/**
 * Rate limiter - limits function calls per time window
 */
export function rateLimiter(
  limit: number,
  windowMs: number
): <T>(fn: () => T) => T | null {
  const calls: number[] = [];

  return <T>(fn: () => T): T | null => {
    const now = Date.now();
    
    // Remove expired calls
    while (calls.length > 0 && calls[0] < now - windowMs) {
      calls.shift();
    }

    if (calls.length >= limit) {
      return null;
    }

    calls.push(now);
    return fn();
  };
}

/**
 * Image optimization utilities
 */
export const imageUtils = {
  /**
   * Generate srcSet for responsive images
   */
  generateSrcSet(baseUrl: string, widths: number[]): string {
    return widths
      .map((w) => `${baseUrl}?w=${w} ${w}w`)
      .join(', ');
  },

  /**
   * Get optimal image size based on viewport
   */
  getOptimalSize(containerWidth: number, pixelRatio = 1): number {
    const sizes = [320, 640, 768, 1024, 1280, 1536, 1920];
    const targetWidth = containerWidth * pixelRatio;
    
    return sizes.find((s) => s >= targetWidth) || sizes[sizes.length - 1];
  },

  /**
   * Create blur placeholder data URL
   */
  createBlurPlaceholder(width = 10, height = 10): string {
    if (typeof window === 'undefined') return '';
    
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, width, height);
    }
    
    return canvas.toDataURL('image/png');
  },

  /**
   * Check if image format is supported
   */
  isFormatSupported(format: 'webp' | 'avif'): boolean {
    if (typeof document === 'undefined') return false;
    
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    return canvas.toDataURL(`image/${format}`).startsWith(`data:image/${format}`);
  },
};

/**
 * Bundle size tracking (development only)
 */
export const bundleTracker = {
  /**
   * Log component load
   */
  logComponentLoad(name: string): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Bundle] Component loaded: ${name}`);
    }
  },

  /**
   * Track dynamic import
   */
  trackDynamicImport<T>(
    importFn: () => Promise<T>,
    moduleName: string
  ): () => Promise<T> {
    return async () => {
      if (process.env.NODE_ENV === 'development') {
        const start = performance.now();
        const result = await importFn();
        const end = performance.now();
        console.log(`[Bundle] Dynamic import "${moduleName}": ${(end - start).toFixed(2)}ms`);
        return result;
      }
      return importFn();
    };
  },
};

/**
 * DOM utilities for performance
 */
export const domUtils = {
  /**
   * Batch DOM reads to prevent layout thrashing
   */
  batchRead<T>(readFns: Array<() => T>): T[] {
    return readFns.map((fn) => fn());
  },

  /**
   * Batch DOM writes
   */
  batchWrite(writeFns: Array<() => void>): void {
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(() => {
        writeFns.forEach((fn) => fn());
      });
    } else {
      writeFns.forEach((fn) => fn());
    }
  },

  /**
   * Force reflow (use sparingly)
   */
  forceReflow(element: HTMLElement): void {
    // Reading offsetHeight forces a reflow
    void element.offsetHeight;
  },

  /**
   * Check if element is in viewport
   */
  isInViewport(element: HTMLElement, threshold = 0): boolean {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= -threshold &&
      rect.left >= -threshold &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + threshold &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth) + threshold
    );
  },
};

/**
 * Memory utilities
 */
export const memoryUtils = {
  /**
   * Cleanup object references
   */
  cleanup<T extends object>(obj: T): void {
    Object.keys(obj).forEach((key) => {
      delete (obj as Record<string, unknown>)[key];
    });
  },

  /**
   * Create weak reference wrapper
   */
  createWeakRef<T extends object>(obj: T): WeakRef<T> | null {
    if (typeof WeakRef !== 'undefined') {
      return new WeakRef(obj);
    }
    return null;
  },

  /**
   * Get approximate object size in bytes
   */
  getObjectSize(obj: unknown): number {
    const seen = new WeakSet();
    
    const sizeOf = (value: unknown): number => {
      if (value === null || value === undefined) return 0;
      
      switch (typeof value) {
        case 'boolean': return 4;
        case 'number': return 8;
        case 'string': return (value as string).length * 2;
        case 'object': {
          if (seen.has(value as object)) return 0;
          seen.add(value as object);
          
          if (Array.isArray(value)) {
            return value.reduce((acc, item) => acc + sizeOf(item), 0);
          }
          
          return Object.entries(value as object).reduce(
            (acc, [key, val]) => acc + sizeOf(key) + sizeOf(val),
            0
          );
        }
        default: return 0;
      }
    };
    
    return sizeOf(obj);
  },
};

export default {
  debounce,
  throttle,
  memoize,
  batchUpdates,
  chunkArray,
  processInChunks,
  lazy,
  rateLimiter,
  imageUtils,
  bundleTracker,
  domUtils,
  memoryUtils,
};
