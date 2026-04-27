/**
 * 🚀 TRANSLATION CACHE SERVICE
 * 
 * Performance optimization for translation operations:
 * - In-memory LRU cache
 * - Prevents redundant translations
 * - Configurable TTL and size limits
 * 
 * @author Fitto Performance Team
 * @version 1.0.0
 */

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

const CACHE_CONFIG = {
  MAX_SIZE: 1000,              // Maximum number of entries
  TTL_MS: 60 * 60 * 1000,     // 1 hour TTL
  CLEANUP_INTERVAL_MS: 10 * 60 * 1000, // Cleanup every 10 minutes
} as const;

// ============================================================================
// CACHE ENTRY INTERFACE
// ============================================================================

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  hits: number;
}

// ============================================================================
// LRU CACHE IMPLEMENTATION
// ============================================================================

/**
 * Generic LRU (Least Recently Used) Cache
 * Automatically evicts old entries when full
 */
class LRUCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private readonly maxSize: number;
  private readonly ttlMs: number;

  constructor(maxSize: number = CACHE_CONFIG.MAX_SIZE, ttlMs: number = CACHE_CONFIG.TTL_MS) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
  }

  /**
   * Get value from cache
   * Returns null if not found or expired
   */
  public get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return null;
    }

    // Update hits for LRU tracking
    entry.hits++;
    
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  /**
   * Set value in cache
   * Evicts least recently used if cache is full
   */
  public set(key: string, value: T): void {
    // If cache is full, evict least recently used
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    // Add new entry
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      hits: 0,
    });
  }

  /**
   * Check if key exists and is not expired
   */
  public has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Clear specific key
   */
  public delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  public clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  public getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
  } {
    let totalHits = 0;
    let totalEntries = 0;

    for (const entry of this.cache.values()) {
      totalHits += entry.hits;
      totalEntries++;
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: totalEntries > 0 ? totalHits / totalEntries : 0,
    };
  }

  /**
   * Remove expired entries
   */
  public cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttlMs) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));

    if (keysToDelete.length > 0) {
      console.log(`[Cache Cleanup] Removed ${keysToDelete.length} expired entries`);
    }
  }
}

// ============================================================================
// TRANSLATION CACHE INSTANCES
// ============================================================================

/**
 * Cache for Turkish to English translations
 */
export const turkishToEnglishCache = new LRUCache<string>(
  CACHE_CONFIG.MAX_SIZE,
  CACHE_CONFIG.TTL_MS
);

/**
 * Cache for English to Turkish translations (recipe translations)
 */
export const englishToTurkishCache = new LRUCache<string>(
  CACHE_CONFIG.MAX_SIZE,
  CACHE_CONFIG.TTL_MS
);

/**
 * Cache for full recipe translations
 */
interface RecipeData {
  meals: Array<Record<string, unknown>>;
}

export const recipeCache = new LRUCache<RecipeData>(
  500, // Smaller cache for full recipes
  CACHE_CONFIG.TTL_MS
);

// ============================================================================
// CACHE HELPERS
// ============================================================================

/**
 * Generate cache key from multiple parameters
 */
export function generateCacheKey(...parts: string[]): string {
  return parts.join(':').toLowerCase().trim();
}

/**
 * Cached translation wrapper
 * Automatically caches and retrieves translations
 */
export function cachedTranslation<T>(
  cache: LRUCache<T>,
  key: string,
  translationFn: () => T
): T {
  // Check cache first
  const cached = cache.get(key);
  if (cached !== null) {
    return cached;
  }

  // Compute translation
  const result = translationFn();

  // Store in cache
  cache.set(key, result);

  return result;
}

// ============================================================================
// CLEANUP SCHEDULER
// ============================================================================

/**
 * Periodically cleanup expired entries
 * Prevents memory leaks
 */
let cleanupInterval: NodeJS.Timeout | null = null;

// Only set cleanup interval in server environment (not in browser)
if (typeof setInterval !== 'undefined' && typeof window === 'undefined') {
  cleanupInterval = setInterval(() => {
    try {
      turkishToEnglishCache.cleanup();
      englishToTurkishCache.cleanup();
      recipeCache.cleanup();
    } catch (error: unknown) {
      console.error('[Cache] Cleanup error:', error);
    }
  }, CACHE_CONFIG.CLEANUP_INTERVAL_MS);
  
  // Prevent interval from keeping Node.js process alive
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }
}

/**
 * Stop cleanup interval (for cleanup on unmount)
 */
export function stopCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

// ============================================================================
// STATISTICS API
// ============================================================================

/**
 * Get all cache statistics
 */
export function getCacheStats() {
  return {
    turkishToEnglish: turkishToEnglishCache.getStats(),
    englishToTurkish: englishToTurkishCache.getStats(),
    recipes: recipeCache.getStats(),
  };
}

/**
 * Clear all caches
 */
export function clearAllCaches(): void {
  turkishToEnglishCache.clear();
  englishToTurkishCache.clear();
  recipeCache.clear();
  console.log('[Cache] All caches cleared');
}
