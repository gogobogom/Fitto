/**
 * API Performance Monitoring
 * Track and analyze API call performance
 */

export interface APIMetric {
  url: string;
  method: string;
  startTime: number;
  endTime: number;
  duration: number;
  status: number;
  success: boolean;
  size?: number;
  cached?: boolean;
}

export interface APIPerformanceStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  slowestRequest: APIMetric | null;
  fastestRequest: APIMetric | null;
  requestsByEndpoint: Map<string, number>;
  errorsByEndpoint: Map<string, number>;
}

class APIPerformanceMonitor {
  private metrics: APIMetric[] = [];
  private readonly maxMetrics = 500;
  private listeners: Array<(metric: APIMetric) => void> = [];

  /**
   * Record a new API metric
   */
  recordMetric(metric: Omit<APIMetric, 'duration'>): void {
    const fullMetric: APIMetric = {
      ...metric,
      duration: metric.endTime - metric.startTime,
    };

    this.metrics.push(fullMetric);

    // Trim if too many metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Notify listeners
    this.listeners.forEach((listener) => listener(fullMetric));

    // Log slow requests in development
    if (process.env.NODE_ENV === 'development' && fullMetric.duration > 1000) {
      console.warn(`[API Performance] Slow request: ${fullMetric.url} took ${fullMetric.duration}ms`);
    }
  }

  /**
   * Subscribe to new metrics
   */
  subscribe(listener: (metric: APIMetric) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Get performance statistics
   */
  getStats(): APIPerformanceStats {
    const successful = this.metrics.filter((m) => m.success);
    const failed = this.metrics.filter((m) => !m.success);

    const requestsByEndpoint = new Map<string, number>();
    const errorsByEndpoint = new Map<string, number>();

    this.metrics.forEach((m) => {
      const endpoint = this.normalizeEndpoint(m.url);
      requestsByEndpoint.set(endpoint, (requestsByEndpoint.get(endpoint) || 0) + 1);
      if (!m.success) {
        errorsByEndpoint.set(endpoint, (errorsByEndpoint.get(endpoint) || 0) + 1);
      }
    });

    const sortedByDuration = [...this.metrics].sort((a, b) => b.duration - a.duration);

    return {
      totalRequests: this.metrics.length,
      successfulRequests: successful.length,
      failedRequests: failed.length,
      averageResponseTime: this.metrics.length > 0
        ? this.metrics.reduce((sum, m) => sum + m.duration, 0) / this.metrics.length
        : 0,
      slowestRequest: sortedByDuration[0] || null,
      fastestRequest: sortedByDuration[sortedByDuration.length - 1] || null,
      requestsByEndpoint,
      errorsByEndpoint,
    };
  }

  /**
   * Get metrics for specific endpoint
   */
  getMetricsForEndpoint(endpoint: string): APIMetric[] {
    return this.metrics.filter((m) => 
      this.normalizeEndpoint(m.url) === this.normalizeEndpoint(endpoint)
    );
  }

  /**
   * Get percentile response time
   */
  getPercentile(percentile: number): number {
    if (this.metrics.length === 0) return 0;

    const sorted = [...this.metrics].sort((a, b) => a.duration - b.duration);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)].duration;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Export metrics as JSON
   */
  export(): string {
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      metrics: this.metrics,
      stats: {
        ...this.getStats(),
        requestsByEndpoint: Object.fromEntries(this.getStats().requestsByEndpoint),
        errorsByEndpoint: Object.fromEntries(this.getStats().errorsByEndpoint),
      },
    }, null, 2);
  }

  private normalizeEndpoint(url: string): string {
    try {
      const parsed = new URL(url, window.location.origin);
      // Remove query params and normalize path
      return `${parsed.pathname}`;
    } catch {
      return url;
    }
  }
}

// Global instance
export const apiPerformanceMonitor = new APIPerformanceMonitor();

/**
 * Fetch wrapper with automatic performance tracking
 */
export async function trackedFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  const method = init?.method || 'GET';
  const startTime = performance.now();

  try {
    const response = await fetch(input, init);
    const endTime = performance.now();

    apiPerformanceMonitor.recordMetric({
      url,
      method,
      startTime,
      endTime,
      status: response.status,
      success: response.ok,
    });

    return response;
  } catch (error) {
    const endTime = performance.now();

    apiPerformanceMonitor.recordMetric({
      url,
      method,
      startTime,
      endTime,
      status: 0,
      success: false,
    });

    throw error;
  }
}

/**
 * Create a timed fetch with timeout
 */
export function createTimedFetch(timeoutMs: number): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await trackedFetch(input, {
        ...init,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  };
}

/**
 * Retry wrapper for fetch
 */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  options?: {
    retries?: number;
    retryDelay?: number;
    shouldRetry?: (response: Response) => boolean;
  }
): Promise<Response> {
  const { 
    retries = 3, 
    retryDelay = 1000,
    shouldRetry = (r) => r.status >= 500 
  } = options || {};

  let lastError: Error | null = null;
  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await trackedFetch(input, init);
      
      if (response.ok || !shouldRetry(response)) {
        return response;
      }
      
      lastResponse = response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
    }

    // Wait before retry (with exponential backoff)
    if (attempt < retries) {
      await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)));
    }
  }

  if (lastResponse) {
    return lastResponse;
  }

  throw lastError || new Error('Fetch failed after retries');
}

/**
 * Performance report generator
 */
export function generatePerformanceReport(): string {
  const stats = apiPerformanceMonitor.getStats();
  const p50 = apiPerformanceMonitor.getPercentile(50);
  const p95 = apiPerformanceMonitor.getPercentile(95);
  const p99 = apiPerformanceMonitor.getPercentile(99);

  return `
# API Performance Report
Generated: ${new Date().toLocaleString()}

## Summary
- Total Requests: ${stats.totalRequests}
- Successful: ${stats.successfulRequests} (${((stats.successfulRequests / stats.totalRequests) * 100).toFixed(1)}%)
- Failed: ${stats.failedRequests} (${((stats.failedRequests / stats.totalRequests) * 100).toFixed(1)}%)

## Response Times
- Average: ${stats.averageResponseTime.toFixed(2)}ms
- P50 (Median): ${p50.toFixed(2)}ms
- P95: ${p95.toFixed(2)}ms
- P99: ${p99.toFixed(2)}ms

## Slowest Request
${stats.slowestRequest ? `- ${stats.slowestRequest.url}: ${stats.slowestRequest.duration.toFixed(2)}ms` : 'N/A'}

## Fastest Request
${stats.fastestRequest ? `- ${stats.fastestRequest.url}: ${stats.fastestRequest.duration.toFixed(2)}ms` : 'N/A'}

## Requests by Endpoint
${Array.from(stats.requestsByEndpoint.entries())
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .map(([endpoint, count]) => `- ${endpoint}: ${count}`)
  .join('\n')}

## Errors by Endpoint
${Array.from(stats.errorsByEndpoint.entries())
  .sort((a, b) => b[1] - a[1])
  .map(([endpoint, count]) => `- ${endpoint}: ${count}`)
  .join('\n') || 'No errors recorded'}
  `.trim();
}

export default {
  apiPerformanceMonitor,
  trackedFetch,
  createTimedFetch,
  fetchWithRetry,
  generatePerformanceReport,
};
