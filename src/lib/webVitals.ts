/**
 * Web Vitals Performance Monitoring
 * LCP, FID, CLS, TTFB, INP metriklerini izler
 */

export interface WebVitalsMetric {
  name: 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'INP' | 'FCP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
}

export interface PerformanceReport {
  metrics: WebVitalsMetric[];
  timestamp: number;
  url: string;
  userAgent: string;
  connectionType?: string;
  deviceMemory?: number;
}

// Metric thresholds (Google's recommendations)
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
  FCP: { good: 1800, poor: 3000 },
};

/**
 * Get rating based on metric value
 */
function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';
  
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Report Web Vitals to analytics or console
 */
export function reportWebVitals(metric: WebVitalsMetric): void {
  const rating = getRating(metric.name, metric.value);
  
  // Console logging for development
  if (process.env.NODE_ENV === 'development') {
    const color = rating === 'good' ? '#0cce6b' : rating === 'needs-improvement' ? '#ffa400' : '#ff4e42';
    console.log(
      `%c[Web Vitals] ${metric.name}: ${metric.value.toFixed(2)}ms (${rating})`,
      `color: ${color}; font-weight: bold;`
    );
  }
  
  // Store in localStorage for analysis
  try {
    const stored = localStorage.getItem('webVitals');
    const vitals: WebVitalsMetric[] = stored ? JSON.parse(stored) : [];
    vitals.push({ ...metric, rating });
    
    // Keep only last 50 entries
    if (vitals.length > 50) {
      vitals.shift();
    }
    
    localStorage.setItem('webVitals', JSON.stringify(vitals));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Get stored Web Vitals metrics
 */
export function getStoredVitals(): WebVitalsMetric[] {
  try {
    const stored = localStorage.getItem('webVitals');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Clear stored Web Vitals metrics
 */
export function clearStoredVitals(): void {
  try {
    localStorage.removeItem('webVitals');
  } catch {
    // Ignore storage errors
  }
}

/**
 * Get performance summary
 */
export function getPerformanceSummary(): Record<string, { avg: number; rating: string; count: number }> {
  const vitals = getStoredVitals();
  const summary: Record<string, { total: number; count: number }> = {};
  
  for (const metric of vitals) {
    if (!summary[metric.name]) {
      summary[metric.name] = { total: 0, count: 0 };
    }
    summary[metric.name].total += metric.value;
    summary[metric.name].count++;
  }
  
  const result: Record<string, { avg: number; rating: string; count: number }> = {};
  
  for (const [name, data] of Object.entries(summary)) {
    const avg = data.total / data.count;
    result[name] = {
      avg: Math.round(avg * 100) / 100,
      rating: getRating(name, avg),
      count: data.count,
    };
  }
  
  return result;
}

/**
 * Measure custom performance mark
 */
export function measurePerformance(markName: string): void {
  if (typeof performance === 'undefined') return;
  
  performance.mark(`${markName}-end`);
  
  try {
    performance.measure(markName, `${markName}-start`, `${markName}-end`);
    const entries = performance.getEntriesByName(markName);
    
    if (entries.length > 0) {
      const duration = entries[entries.length - 1].duration;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${markName}: ${duration.toFixed(2)}ms`);
      }
    }
  } catch {
    // Marks might not exist
  }
}

/**
 * Start performance mark
 */
export function startMark(markName: string): void {
  if (typeof performance === 'undefined') return;
  performance.mark(`${markName}-start`);
}

/**
 * End performance mark and measure
 */
export function endMark(markName: string): number | null {
  if (typeof performance === 'undefined') return null;
  
  performance.mark(`${markName}-end`);
  
  try {
    performance.measure(markName, `${markName}-start`, `${markName}-end`);
    const entries = performance.getEntriesByName(markName);
    
    if (entries.length > 0) {
      return entries[entries.length - 1].duration;
    }
  } catch {
    // Marks might not exist
  }
  
  return null;
}

/**
 * Get connection info
 */
export function getConnectionInfo(): { type?: string; downlink?: number; rtt?: number } {
  if (typeof navigator === 'undefined') return {};
  
  const connection = (navigator as Navigator & { 
    connection?: { effectiveType?: string; downlink?: number; rtt?: number } 
  }).connection;
  
  if (!connection) return {};
  
  return {
    type: connection.effectiveType,
    downlink: connection.downlink,
    rtt: connection.rtt,
  };
}

/**
 * Get device memory (if available)
 */
export function getDeviceMemory(): number | undefined {
  if (typeof navigator === 'undefined') return undefined;
  
  return (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
}

/**
 * Create full performance report
 */
export function createPerformanceReport(): PerformanceReport {
  const connectionInfo = getConnectionInfo();
  
  return {
    metrics: getStoredVitals(),
    timestamp: Date.now(),
    url: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    connectionType: connectionInfo.type,
    deviceMemory: getDeviceMemory(),
  };
}

/**
 * Initialize Web Vitals monitoring
 */
export async function initWebVitals(): Promise<void> {
  if (typeof window === 'undefined') return;
  
  try {
    const { onLCP, onFID, onCLS, onTTFB, onINP, onFCP } = await import('web-vitals');
    
    const handleMetric = (metric: { name: string; value: number; delta: number; id: string; navigationType: string }) => {
      reportWebVitals({
        name: metric.name as WebVitalsMetric['name'],
        value: metric.value,
        rating: getRating(metric.name, metric.value),
        delta: metric.delta,
        id: metric.id,
        navigationType: metric.navigationType,
      });
    };
    
    onLCP(handleMetric);
    onFID(handleMetric);
    onCLS(handleMetric);
    onTTFB(handleMetric);
    onINP(handleMetric);
    onFCP(handleMetric);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Web Vitals] Monitoring initialized');
    }
  } catch (error) {
    console.warn('[Web Vitals] Failed to initialize:', error);
  }
}
