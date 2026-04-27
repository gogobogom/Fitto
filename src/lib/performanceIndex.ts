/**
 * Performance Module Index
 * Performans modülleri merkezi export dosyası
 */

// ==========================================
// LIB MODULES
// ==========================================

// Edge Caching
export {
  generateCacheControl,
  CacheStrategies,
  generateETag,
  handleConditionalRequest,
  generateVaryHeader,
  VaryFields,
  SurrogateKeyManager,
  CacheTags,
  buildEdgeHeaders,
  warmCache,
  isStale,
  InvalidationPatterns,
  type CacheControlOptions,
  type ConditionalRequestResult,
  type EdgeResponseHeaders,
} from './edgeCaching';

// Request Batching
export {
  RequestDeduplicator,
  BatchProcessor,
  PriorityRequestQueue,
  RequestCoalescer,
  getDeduplicator,
  getPriorityQueue,
  RequestPriority,
  batchFetch,
  createDebouncedBatch,
} from './requestBatching';

// Memory Leak Prevention
export {
  WeakCache,
  AutoCleanupMap,
  EventListenerTracker,
  TimerTracker,
  SubscriptionTracker,
  DOMReferenceTracker,
  ResourceCleanupManager,
  getCleanupManager,
  detectClosureLeak,
  detectMemoryPressure,
} from './memoryLeakPrevention';

// Touch Optimization
export {
  createFastClick,
  createSwipeDetector,
  createPinchDetector,
  createLongPressDetector,
  createTouchRipple,
  createMomentumScroll,
  preventPullToRefresh,
  addTouchFeedback,
  isTouchDevice,
  getTouchSupport,
  type TouchPoint,
  type SwipeGesture,
  type PinchGesture,
  type TouchHandlerOptions,
} from './touchOptimization';

// Form Performance
export {
  createDebouncedInput,
  createThrottledInput,
  createFormState,
  validateField,
  validateForm,
  ValidationRules,
  createInputMask,
  InputMasks,
  autoResizeTextarea,
  createAutosave,
  createFocusManager,
  createOptimizedOnChange,
  type FormField,
  type FormState,
  type ValidationRule,
  type ValidationSchema,
  type MaskOptions,
} from './formPerformance';

// Animation Scheduler
export {
  AnimationScheduler,
  FrameRateMonitor,
  AnimatedValue,
  DOMBatcher,
  getScheduler,
  getFPSMonitor,
  getDOMBatcher,
  lerp,
  easeInOut,
  easeOut,
  easeIn,
  spring,
  throttledRAF,
  timeSlice,
} from './animationScheduler';

// Intersection Utils
export {
  observe,
  lazyLoadImage,
  lazyLoadComponent,
  infiniteScroll,
  scrollSpy,
  animateOnScroll,
  trackVisibility,
  autoPauseVideo,
  preloadOnApproach,
  batchVisibilityObserver,
  detectSticky,
  IntersectionObserverManager,
  type IntersectionOptions,
  type IntersectionCallback,
} from './intersectionUtils';

// Preload Manager
export {
  PreloadManager,
  PreloadStrategies,
  getPreloadManager,
  preload,
  prefetch,
  preconnect,
  dnsPrefetch,
  type ResourceType,
  type PreloadStatus,
  type PreloadOptions,
} from './preloadManager';

// Critical CSS
export {
  CriticalCSSGenerator,
  getCriticalCSSGenerator,
  injectCriticalCSS,
  deferStylesheet,
  generateFontDisplay,
  CriticalCSSPresets,
  CSSContainment,
  type CriticalCSSOptions,
} from './criticalCSS';

// Image Format Optimizer
export {
  ImageFormatOptimizer,
  getImageOptimizer,
  getSupportedFormats,
  getOptimalFormat,
  generateSrcSet,
  generateBlurPlaceholder,
  calculateDimensions,
  type ImageFormat,
  type ImageDimensions,
  type SrcSetOptions,
} from './imageFormatOptimizer';

// SSR Performance
export {
  ServerCache,
  getServerCache,
  memoizeServerFunction,
  generatePrefetchHints,
  generateServerTimingHeader,
  generateCacheHeaders,
  deduplicateRequest,
  parallelFetch,
  type CacheEntry,
  type ServerCacheOptions,
  type PrefetchHint,
} from './ssrPerformance';

// Service Worker Strategies
export {
  ServiceWorkerStrategies,
  OfflineStorage,
  BackgroundSyncManager,
  type CacheStrategy,
  type OfflineRequest,
} from './serviceWorkerStrategies';

// Web Worker Manager
export {
  WorkerManager,
  getWorkerManager,
  WorkerTasks,
} from './webWorkerManager';

// Bundle Analyzer
export {
  BundleAnalyzer,
  getBundleAnalyzer,
  ResourceBudgets,
  type ResourceMetrics,
  type BudgetConfig,
} from './bundleAnalyzer';

// DOM Performance
export {
  OptimizedScrollHandler,
  OptimizedResizeHandler,
  DOMBatchMutations,
  FocusTrap,
  VisibilityManager,
  getOptimizedScrollHandler,
  getOptimizedResizeHandler,
  getDOMBatchMutations,
  createFocusTrap,
} from './domPerformance';

// Code Splitting
export {
  ModulePreloader,
  RouteBasedPreloader,
  FeatureLoader,
  getModulePreloader,
  getRoutePreloader,
  getFeatureLoader,
} from './codeSplitting';

// Network Aware Loading
export {
  NetworkAwareLoader,
  getNetworkAwareLoader,
  ConnectionTypes,
  type NetworkInfo,
  type LoadingStrategy,
} from './networkAwareLoading';

// Supabase Connection Pool
export {
  SupabaseConnectionPool,
  getConnectionPool,
  type PoolConfig,
  type PoolMetrics,
} from './supabaseConnectionPool';

// Performance Reporter
export {
  PerformanceReporter,
  getPerformanceReporter,
  type PerformanceReport,
  type WebVitalsMetrics,
} from './performanceReporter';

// Supabase Query Optimizer
export {
  SupabaseQueryOptimizer,
  getQueryOptimizer,
} from './supabaseQueryOptimizer';

// Component Loader
export {
  ComponentLoader,
  getComponentLoader,
  RoutePreloader,
  getRoutePreloader as getComponentRoutePreloader,
} from './componentLoader';

// Animation Performance
export {
  GPUAnimations,
  AnimationEasing,
  DOMAnimationBatcher,
  ReducedMotionManager,
} from './animationPerformance';

// Network Retry
export {
  RetryConfig,
  exponentialBackoff,
  CircuitBreaker,
  RateLimitedQueue,
  TimeoutManager,
  type RetryOptions,
} from './networkRetry';

// State Persistence
export {
  SessionStateManager,
  FormStatePersistence,
  UserPreferences,
  StateMigration,
} from './statePersistence';

// Image Preloader
export {
  ImagePreloader,
  getImagePreloader,
  LQIPGenerator,
  ResponsiveImageSelector,
} from './imagePreloader';

// Lighthouse Optimization
export {
  LIGHTHOUSE_CATEGORIES,
  PERFORMANCE_THRESHOLDS,
  calculateMetricScore,
  calculateOverallScore,
  runOptimizationChecks,
  runAccessibilityChecks,
  runSEOChecks,
  runBestPracticesChecks,
  generateLighthouseReport,
  exportReportAsJSON,
  getScoreColor,
  getScoreLabel,
  type MetricName,
  type MetricScore,
  type LighthouseMetrics,
  type OptimizationCheck,
  type LighthouseReport,
} from './lighthouseOptimization';

// Real User Monitoring
export {
  rum,
  getPerformanceScore,
  aggregateSessionMetrics,
  type RUMEventType,
  type RUMEvent,
  type RUMContext,
  type WebVitalMetric,
  type SessionData,
} from './realUserMonitoring';

// ==========================================
// QUICK SETUP
// ==========================================

/**
 * Initialize all performance optimizations
 * Tüm performans optimizasyonlarını başlat
 */
export async function initializePerformanceOptimizations(): Promise<void> {
  if (typeof window === 'undefined') return;

  // Preconnect to important origins
  preconnect('https://fonts.googleapis.com');
  preconnect('https://fonts.gstatic.com', true);
  
  // Initialize FPS monitor in development
  if (process.env.NODE_ENV === 'development') {
    const fpsMonitor = getFPSMonitor();
    fpsMonitor.start();
    fpsMonitor.onFPSUpdate((fps) => {
      if (fps < 50) {
        console.warn(`Low FPS detected: ${fps}`);
      }
    });
  }

  // Initialize bundle analyzer
  const bundleAnalyzer = getBundleAnalyzer();
  bundleAnalyzer.startTracking();

  // Check memory pressure periodically
  setInterval(() => {
    const { isUnderPressure, usedHeapRatio } = detectMemoryPressure();
    if (isUnderPressure) {
      console.warn(`High memory usage: ${(usedHeapRatio * 100).toFixed(1)}%`);
      // Trigger cleanup
      getCleanupManager().cleanup();
    }
  }, 30000);
}

/**
 * Get performance summary
 * Performans özeti al
 */
export function getPerformanceSummary(): {
  fps: number;
  memoryUsage: number;
  bundleSize: number;
  cacheHitRate: number;
} {
  const fpsMonitor = getFPSMonitor();
  const { usedHeapRatio } = detectMemoryPressure();
  const bundleAnalyzer = getBundleAnalyzer();
  const queryOptimizer = getQueryOptimizer();

  return {
    fps: fpsMonitor.getFPS(),
    memoryUsage: usedHeapRatio,
    bundleSize: bundleAnalyzer.getTotalSize(),
    cacheHitRate: queryOptimizer.getCacheStats().hitRate,
  };
}
