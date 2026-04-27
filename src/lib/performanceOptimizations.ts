/**
 * Performance Optimizations Index
 * Central export for all performance optimization utilities
 */

// Critical CSS
export {
  criticalCSSRules,
  minifiedCriticalCSS,
  generateCriticalStyleTag,
  extractCriticalFromElement,
  generateCriticalCSSForViewport,
  preloadStylesheet,
  deferStylesheet,
  removeCriticalCSS,
  isCSSLoaded,
  fontDisplayCSS,
  loadingStateCSS,
  containmentCSS,
  getAllCriticalCSS,
} from './criticalCSS';

// Image Format Optimization
export {
  supportsWebP,
  supportsAVIF,
  getBestSupportedFormat,
  getOptimalImageUrl,
  generateResponsiveSrcSet,
  generatePictureSources,
  createOptimizedImage,
  qualityPresets,
  calculateOptimalDimensions,
  generateBlurPlaceholder,
  generateColorPlaceholder,
  loadProgressively,
  estimateFileSizeReduction,
  getImageFormat,
  isOptimizedFormat,
  analyzeImage,
  type PictureSource,
  type OptimizationReport,
  type ResponsiveSrcSet,
  type ImageFormatInfo,
} from './imageFormatOptimizer';

// SSR Performance
export {
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
  type PrefetchHint,
  type CacheConfig,
  type StreamableData,
} from './ssrPerformance';

/**
 * Initialize all performance optimizations
 */
export function initializePerformanceOptimizations(): void {
  if (typeof window === 'undefined') return;

  // Add performance mark
  performance.mark('perf-init-start');

  // Detect connection type and adjust loading strategy
  const connection = (navigator as Navigator & {
    connection?: {
      effectiveType?: string;
      saveData?: boolean;
    };
  }).connection;

  if (connection) {
    const isSlowConnection =
      connection.saveData || !['4g', '3g'].includes(connection.effectiveType || '4g');

    if (isSlowConnection) {
      // Disable animations on slow connections
      document.documentElement.classList.add('reduce-motion');
    }
  }

  // Add visibility change handler for resource management
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Page is hidden, pause non-critical operations
      document.documentElement.classList.add('page-hidden');
    } else {
      // Page is visible, resume operations
      document.documentElement.classList.remove('page-hidden');
    }
  });

  // Add preload hints for critical resources
  const preloadCriticalResources = () => {
    // Preload fonts
    const fonts = [
      '/fonts/GeistVF.woff',
      '/fonts/GeistMonoVF.woff',
    ];

    fonts.forEach((font) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = 'font/woff';
      link.href = font;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  };

  // Run preload on idle
  if ('requestIdleCallback' in window) {
    requestIdleCallback(preloadCriticalResources);
  } else {
    setTimeout(preloadCriticalResources, 100);
  }

  performance.mark('perf-init-end');
  performance.measure('perf-initialization', 'perf-init-start', 'perf-init-end');
}

/**
 * Performance configuration
 */
export const performanceConfig = {
  // Image optimization
  images: {
    formats: ['avif', 'webp', 'jpeg'],
    quality: {
      avif: 80,
      webp: 85,
      jpeg: 85,
    },
    sizes: [320, 640, 768, 1024, 1280, 1920],
    lazyLoadThreshold: 0.1,
    lazyLoadRootMargin: '200px',
  },

  // CSS optimization
  css: {
    criticalCSSEnabled: true,
    fontDisplaySwap: true,
    containmentEnabled: true,
  },

  // SSR optimization
  ssr: {
    defaultCacheTTL: 60,
    staticPagesTTL: 3600,
    dynamicPagesTTL: 30,
    enableStreaming: true,
    enablePrefetch: true,
  },

  // Resource hints
  hints: {
    preconnect: [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
    ],
    dnsPrefetch: [
      'https://www.google-analytics.com',
    ],
  },

  // Performance budgets
  budgets: {
    fcp: 1800, // First Contentful Paint (ms)
    lcp: 2500, // Largest Contentful Paint (ms)
    fid: 100, // First Input Delay (ms)
    cls: 0.1, // Cumulative Layout Shift
    tti: 3800, // Time to Interactive (ms)
    bundleSize: 200 * 1024, // 200KB
  },
};

/**
 * Check if performance budgets are met
 */
export function checkPerformanceBudgets(): {
  passed: boolean;
  results: Array<{
    metric: string;
    value: number;
    budget: number;
    passed: boolean;
  }>;
} {
  const results: Array<{
    metric: string;
    value: number;
    budget: number;
    passed: boolean;
  }> = [];

  // Get performance entries
  const paintEntries = performance.getEntriesByType('paint');
  const fcpEntry = paintEntries.find(
    (entry) => entry.name === 'first-contentful-paint'
  );

  if (fcpEntry) {
    results.push({
      metric: 'FCP',
      value: fcpEntry.startTime,
      budget: performanceConfig.budgets.fcp,
      passed: fcpEntry.startTime <= performanceConfig.budgets.fcp,
    });
  }

  // Check LCP if available
  if ('PerformanceObserver' in window) {
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    const lastLcp = lcpEntries[lcpEntries.length - 1];
    if (lastLcp) {
      results.push({
        metric: 'LCP',
        value: lastLcp.startTime,
        budget: performanceConfig.budgets.lcp,
        passed: lastLcp.startTime <= performanceConfig.budgets.lcp,
      });
    }
  }

  const allPassed = results.every((r) => r.passed);

  return {
    passed: allPassed,
    results,
  };
}

/**
 * Performance monitoring utilities
 */
export const performanceMonitor = {
  // Log performance mark
  mark: (name: string) => {
    performance.mark(name);
  },

  // Measure between two marks
  measure: (name: string, startMark: string, endMark: string) => {
    try {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name)[0];
      return measure?.duration || 0;
    } catch {
      return 0;
    }
  },

  // Get all measures
  getMeasures: () => {
    return performance.getEntriesByType('measure');
  },

  // Clear all marks and measures
  clear: () => {
    performance.clearMarks();
    performance.clearMeasures();
  },

  // Log current memory usage (if available)
  getMemoryUsage: () => {
    const memory = (performance as Performance & {
      memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      };
    }).memory;

    if (memory) {
      return {
        usedMB: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        totalMB: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        limitMB: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
      };
    }
    return null;
  },
};

export default {
  initializePerformanceOptimizations,
  performanceConfig,
  checkPerformanceBudgets,
  performanceMonitor,
};
