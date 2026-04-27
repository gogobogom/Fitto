// Bundle Size Analyzer and Monitoring

export interface ChunkInfo {
  name: string;
  size: number;
  gzipSize?: number;
  modules?: string[];
}

export interface BundleStats {
  totalSize: number;
  totalGzipSize: number;
  chunks: ChunkInfo[];
  timestamp: number;
}

export interface PerformanceEntry {
  name: string;
  size: number;
  duration: number;
  type: 'script' | 'style' | 'image' | 'font' | 'other';
}

// Resource timing analyzer
export class ResourceAnalyzer {
  private static instance: ResourceAnalyzer;
  private entries: PerformanceEntry[] = [];
  private observer: PerformanceObserver | null = null;

  private constructor() {
    this.initObserver();
  }

  static getInstance(): ResourceAnalyzer {
    if (!ResourceAnalyzer.instance) {
      ResourceAnalyzer.instance = new ResourceAnalyzer();
    }
    return ResourceAnalyzer.instance;
  }

  private initObserver(): void {
    if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') return;

    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            this.addEntry(resourceEntry);
          }
        }
      });

      this.observer.observe({ entryTypes: ['resource'] });

      // Process existing entries
      const existingEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      existingEntries.forEach(entry => this.addEntry(entry));
    } catch (error) {
      console.warn('PerformanceObserver not supported:', error);
    }
  }

  private addEntry(entry: PerformanceResourceTiming): void {
    const type = this.getResourceType(entry.name);
    
    this.entries.push({
      name: entry.name,
      size: entry.transferSize || 0,
      duration: entry.duration,
      type,
    });

    // Keep only last 500 entries
    if (this.entries.length > 500) {
      this.entries = this.entries.slice(-500);
    }
  }

  private getResourceType(url: string): PerformanceEntry['type'] {
    const extension = url.split('?')[0].split('.').pop()?.toLowerCase();
    
    if (['js', 'mjs'].includes(extension || '')) return 'script';
    if (['css'].includes(extension || '')) return 'style';
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'avif', 'ico'].includes(extension || '')) return 'image';
    if (['woff', 'woff2', 'ttf', 'otf', 'eot'].includes(extension || '')) return 'font';
    return 'other';
  }

  getStats(): {
    totalSize: number;
    byType: Record<string, { count: number; size: number; avgDuration: number }>;
    slowestResources: PerformanceEntry[];
    largestResources: PerformanceEntry[];
  } {
    const byType: Record<string, { count: number; size: number; totalDuration: number }> = {};

    for (const entry of this.entries) {
      if (!byType[entry.type]) {
        byType[entry.type] = { count: 0, size: 0, totalDuration: 0 };
      }
      byType[entry.type].count++;
      byType[entry.type].size += entry.size;
      byType[entry.type].totalDuration += entry.duration;
    }

    const stats: Record<string, { count: number; size: number; avgDuration: number }> = {};
    for (const [type, data] of Object.entries(byType)) {
      stats[type] = {
        count: data.count,
        size: data.size,
        avgDuration: data.count > 0 ? data.totalDuration / data.count : 0,
      };
    }

    const totalSize = this.entries.reduce((sum, e) => sum + e.size, 0);

    return {
      totalSize,
      byType: stats,
      slowestResources: [...this.entries].sort((a, b) => b.duration - a.duration).slice(0, 10),
      largestResources: [...this.entries].sort((a, b) => b.size - a.size).slice(0, 10),
    };
  }

  getJSBundleSize(): number {
    return this.entries
      .filter(e => e.type === 'script')
      .reduce((sum, e) => sum + e.size, 0);
  }

  getCSSSize(): number {
    return this.entries
      .filter(e => e.type === 'style')
      .reduce((sum, e) => sum + e.size, 0);
  }

  getImageSize(): number {
    return this.entries
      .filter(e => e.type === 'image')
      .reduce((sum, e) => sum + e.size, 0);
  }

  clear(): void {
    this.entries = [];
  }

  disconnect(): void {
    this.observer?.disconnect();
    this.observer = null;
  }
}

// Bundle budget checker
export interface BudgetConfig {
  maxTotalSize?: number;
  maxJSSize?: number;
  maxCSSSize?: number;
  maxImageSize?: number;
  maxSingleChunkSize?: number;
}

export const defaultBudgets: BudgetConfig = {
  maxTotalSize: 2 * 1024 * 1024, // 2MB
  maxJSSize: 500 * 1024, // 500KB
  maxCSSSize: 100 * 1024, // 100KB
  maxImageSize: 1024 * 1024, // 1MB
  maxSingleChunkSize: 250 * 1024, // 250KB
};

export class BudgetChecker {
  private config: BudgetConfig;
  private analyzer: ResourceAnalyzer;

  constructor(config: BudgetConfig = defaultBudgets) {
    this.config = { ...defaultBudgets, ...config };
    this.analyzer = ResourceAnalyzer.getInstance();
  }

  check(): {
    passed: boolean;
    violations: Array<{ type: string; actual: number; limit: number; message: string }>;
    warnings: Array<{ type: string; actual: number; limit: number; message: string }>;
  } {
    const violations: Array<{ type: string; actual: number; limit: number; message: string }> = [];
    const warnings: Array<{ type: string; actual: number; limit: number; message: string }> = [];

    const stats = this.analyzer.getStats();

    // Check total size
    if (this.config.maxTotalSize && stats.totalSize > this.config.maxTotalSize) {
      violations.push({
        type: 'total',
        actual: stats.totalSize,
        limit: this.config.maxTotalSize,
        message: `Total bundle size (${this.formatSize(stats.totalSize)}) exceeds limit (${this.formatSize(this.config.maxTotalSize)})`,
      });
    } else if (this.config.maxTotalSize && stats.totalSize > this.config.maxTotalSize * 0.8) {
      warnings.push({
        type: 'total',
        actual: stats.totalSize,
        limit: this.config.maxTotalSize,
        message: `Total bundle size (${this.formatSize(stats.totalSize)}) approaching limit (${this.formatSize(this.config.maxTotalSize)})`,
      });
    }

    // Check JS size
    const jsSize = this.analyzer.getJSBundleSize();
    if (this.config.maxJSSize && jsSize > this.config.maxJSSize) {
      violations.push({
        type: 'javascript',
        actual: jsSize,
        limit: this.config.maxJSSize,
        message: `JavaScript bundle size (${this.formatSize(jsSize)}) exceeds limit (${this.formatSize(this.config.maxJSSize)})`,
      });
    }

    // Check CSS size
    const cssSize = this.analyzer.getCSSSize();
    if (this.config.maxCSSSize && cssSize > this.config.maxCSSSize) {
      violations.push({
        type: 'css',
        actual: cssSize,
        limit: this.config.maxCSSSize,
        message: `CSS bundle size (${this.formatSize(cssSize)}) exceeds limit (${this.formatSize(this.config.maxCSSSize)})`,
      });
    }

    // Check image size
    const imageSize = this.analyzer.getImageSize();
    if (this.config.maxImageSize && imageSize > this.config.maxImageSize) {
      violations.push({
        type: 'images',
        actual: imageSize,
        limit: this.config.maxImageSize,
        message: `Image size (${this.formatSize(imageSize)}) exceeds limit (${this.formatSize(this.config.maxImageSize)})`,
      });
    }

    // Check individual chunks
    if (this.config.maxSingleChunkSize) {
      for (const resource of stats.largestResources) {
        if (resource.size > this.config.maxSingleChunkSize) {
          violations.push({
            type: 'chunk',
            actual: resource.size,
            limit: this.config.maxSingleChunkSize,
            message: `Resource "${resource.name}" (${this.formatSize(resource.size)}) exceeds chunk limit (${this.formatSize(this.config.maxSingleChunkSize)})`,
          });
        }
      }
    }

    return {
      passed: violations.length === 0,
      violations,
      warnings,
    };
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
}

// Export singleton instances
export const resourceAnalyzer = ResourceAnalyzer.getInstance();
export const budgetChecker = new BudgetChecker();

// Utility function to log bundle stats
export function logBundleStats(): void {
  const stats = resourceAnalyzer.getStats();
  const budgetResult = budgetChecker.check();

  console.group('📦 Bundle Statistics');
  console.log(`Total Size: ${formatBytes(stats.totalSize)}`);
  
  console.group('By Type:');
  for (const [type, data] of Object.entries(stats.byType)) {
    console.log(`${type}: ${data.count} files, ${formatBytes(data.size)}, avg ${data.avgDuration.toFixed(0)}ms`);
  }
  console.groupEnd();

  if (budgetResult.violations.length > 0) {
    console.group('❌ Budget Violations:');
    budgetResult.violations.forEach(v => console.warn(v.message));
    console.groupEnd();
  }

  if (budgetResult.warnings.length > 0) {
    console.group('⚠️ Budget Warnings:');
    budgetResult.warnings.forEach(w => console.log(w.message));
    console.groupEnd();
  }

  console.groupEnd();
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
