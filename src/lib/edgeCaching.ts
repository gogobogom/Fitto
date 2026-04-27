/**
 * Edge Caching Strategies
 * CDN ve edge düzeyinde önbellekleme stratejileri
 */

// Cache control headers
export interface CacheControlOptions {
  maxAge?: number;
  sMaxAge?: number;
  staleWhileRevalidate?: number;
  staleIfError?: number;
  public?: boolean;
  private?: boolean;
  noCache?: boolean;
  noStore?: boolean;
  mustRevalidate?: boolean;
  immutable?: boolean;
}

// Generate cache control header string
export function generateCacheControl(options: CacheControlOptions): string {
  const directives: string[] = [];

  if (options.public) directives.push('public');
  if (options.private) directives.push('private');
  if (options.noCache) directives.push('no-cache');
  if (options.noStore) directives.push('no-store');
  if (options.mustRevalidate) directives.push('must-revalidate');
  if (options.immutable) directives.push('immutable');

  if (options.maxAge !== undefined) {
    directives.push(`max-age=${options.maxAge}`);
  }
  if (options.sMaxAge !== undefined) {
    directives.push(`s-maxage=${options.sMaxAge}`);
  }
  if (options.staleWhileRevalidate !== undefined) {
    directives.push(`stale-while-revalidate=${options.staleWhileRevalidate}`);
  }
  if (options.staleIfError !== undefined) {
    directives.push(`stale-if-error=${options.staleIfError}`);
  }

  return directives.join(', ');
}

// Preset cache strategies
export const CacheStrategies = {
  // Static assets (fonts, images, etc.) - 1 year
  staticAssets: (): string => generateCacheControl({
    public: true,
    maxAge: 31536000,
    immutable: true,
  }),

  // API responses - short cache with revalidation
  apiResponse: (maxAge: number = 60): string => generateCacheControl({
    public: true,
    maxAge: 0,
    sMaxAge: maxAge,
    staleWhileRevalidate: maxAge * 2,
    staleIfError: 86400,
  }),

  // User-specific data - private cache
  privateData: (maxAge: number = 300): string => generateCacheControl({
    private: true,
    maxAge,
    mustRevalidate: true,
  }),

  // No cache - for real-time data
  noCache: (): string => generateCacheControl({
    noCache: true,
    noStore: true,
    mustRevalidate: true,
  }),

  // HTML pages - short cache
  htmlPage: (): string => generateCacheControl({
    public: true,
    maxAge: 0,
    sMaxAge: 300,
    staleWhileRevalidate: 600,
  }),

  // Dynamic content with ISR
  isr: (revalidateSeconds: number = 60): string => generateCacheControl({
    public: true,
    maxAge: 0,
    sMaxAge: revalidateSeconds,
    staleWhileRevalidate: revalidateSeconds * 10,
  }),
};

// ETag generation
export function generateETag(content: string | object): string {
  const data = typeof content === 'string' ? content : JSON.stringify(content);
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `"${Math.abs(hash).toString(16)}"`;
}

// Conditional request handling
export interface ConditionalRequestResult {
  shouldReturn304: boolean;
  etag: string;
}

export function handleConditionalRequest(
  content: string | object,
  ifNoneMatch?: string | null
): ConditionalRequestResult {
  const etag = generateETag(content);
  const shouldReturn304 = ifNoneMatch === etag;
  return { shouldReturn304, etag };
}

// Vary header management
export function generateVaryHeader(fields: string[]): string {
  return fields.join(', ');
}

export const VaryFields = {
  acceptEncoding: 'Accept-Encoding',
  acceptLanguage: 'Accept-Language',
  authorization: 'Authorization',
  cookie: 'Cookie',
  userAgent: 'User-Agent',
  origin: 'Origin',
};

// Surrogate key management (for CDN purging)
export class SurrogateKeyManager {
  private keys: Set<string> = new Set();

  addKey(key: string): void {
    this.keys.add(key);
  }

  addKeys(keys: string[]): void {
    keys.forEach(key => this.keys.add(key));
  }

  getHeader(): string {
    return Array.from(this.keys).join(' ');
  }

  clear(): void {
    this.keys.clear();
  }

  // Generate key from resource type and ID
  static generateKey(resourceType: string, resourceId?: string): string {
    if (resourceId) {
      return `${resourceType}-${resourceId}`;
    }
    return resourceType;
  }
}

// Cache tag utilities
export const CacheTags = {
  user: (userId: string) => `user-${userId}`,
  meal: (mealId: string) => `meal-${mealId}`,
  exercise: (exerciseId: string) => `exercise-${exerciseId}`,
  recipe: (recipeId: string) => `recipe-${recipeId}`,
  userMeals: (userId: string) => `user-meals-${userId}`,
  userExercises: (userId: string) => `user-exercises-${userId}`,
  dailyStats: (userId: string, date: string) => `daily-${userId}-${date}`,
  globalConfig: () => 'global-config',
  foodDatabase: () => 'food-database',
};

// Response headers helper
export interface EdgeResponseHeaders {
  'Cache-Control': string;
  'CDN-Cache-Control'?: string;
  'Surrogate-Control'?: string;
  'Surrogate-Key'?: string;
  'ETag'?: string;
  'Vary'?: string;
  'X-Cache-Status'?: string;
}

export function buildEdgeHeaders(options: {
  cacheStrategy: string;
  etag?: string;
  surrogateKeys?: string[];
  vary?: string[];
  cdnMaxAge?: number;
}): EdgeResponseHeaders {
  const headers: EdgeResponseHeaders = {
    'Cache-Control': options.cacheStrategy,
  };

  if (options.cdnMaxAge !== undefined) {
    headers['CDN-Cache-Control'] = `max-age=${options.cdnMaxAge}`;
    headers['Surrogate-Control'] = `max-age=${options.cdnMaxAge}`;
  }

  if (options.surrogateKeys && options.surrogateKeys.length > 0) {
    headers['Surrogate-Key'] = options.surrogateKeys.join(' ');
  }

  if (options.etag) {
    headers['ETag'] = options.etag;
  }

  if (options.vary && options.vary.length > 0) {
    headers['Vary'] = options.vary.join(', ');
  }

  return headers;
}

// Client-side cache warming
export async function warmCache(urls: string[]): Promise<void> {
  if (typeof window === 'undefined') return;

  const warmUrl = async (url: string): Promise<void> => {
    try {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      link.as = url.endsWith('.js') ? 'script' : 
                url.endsWith('.css') ? 'style' : 
                url.match(/\.(png|jpg|jpeg|webp|avif|gif|svg)$/i) ? 'image' : 
                'fetch';
      document.head.appendChild(link);
    } catch (error) {
      console.warn(`Failed to warm cache for ${url}:`, error);
    }
  };

  // Warm in batches
  const batchSize = 3;
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    await Promise.all(batch.map(warmUrl));
  }
}

// Stale content detection
export function isStale(cachedAt: number, maxAge: number): boolean {
  return Date.now() - cachedAt > maxAge * 1000;
}

// Cache invalidation patterns
export const InvalidationPatterns = {
  // Invalidate user's all cached data
  userAll: (userId: string) => [`user-${userId}*`],
  
  // Invalidate specific meal
  meal: (mealId: string) => [`meal-${mealId}`],
  
  // Invalidate user's daily data
  userDaily: (userId: string, date: string) => [
    `daily-${userId}-${date}`,
    `user-meals-${userId}`,
  ],
  
  // Invalidate global configs
  global: () => ['global-*', 'food-database'],
};
