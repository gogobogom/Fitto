// Performance Reporter - Unified Performance Monitoring

import { resourceAnalyzer, budgetChecker } from './bundleAnalyzer';
import { connectionManager } from './supabaseConnectionPool';
import { networkManager } from './networkAwareLoading';
import { workerManager } from './webWorkerManager';

export interface PerformanceReport {
  timestamp: number;
  duration: number; // Session duration in ms
  
  // Core Web Vitals
  webVitals: {
    lcp?: number;
    fid?: number;
    cls?: number;
    fcp?: number;
    ttfb?: number;
    inp?: number;
  };

  // Resource metrics
  resources: {
    totalSize: number;
    jsSize: number;
    cssSize: number;
    imageSize: number;
    fontSize: number;
    resourceCount: number;
  };

  // Network metrics
  network: {
    online: boolean;
    effectiveType: string;
    downlink: number;
    rtt: number;
    saveData: boolean;
  };

  // API metrics
  api: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
  };

  // Memory metrics
  memory: {
    usedJSHeapSize?: number;
    totalJSHeapSize?: number;
    jsHeapSizeLimit?: number;
    usagePercentage?: number;
  };

  // Budget compliance
  budget: {
    passed: boolean;
    violations: number;
    warnings: number;
  };

  // Worker status
  workers: {
    supported: boolean;
  };
}

export class PerformanceReporter {
  private static instance: PerformanceReporter;
  private sessionStartTime: number;
  private webVitals: PerformanceReport['webVitals'] = {};
  private observers: PerformanceObserver[] = [];

  private constructor() {
    this.sessionStartTime = Date.now();
    this.initWebVitalsCollection();
  }

  static getInstance(): PerformanceReporter {
    if (!PerformanceReporter.instance) {
      PerformanceReporter.instance = new PerformanceReporter();
    }
    return PerformanceReporter.instance;
  }

  private initWebVitalsCollection(): void {
    if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') return;

    // LCP Observer
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
        if (lastEntry) {
          this.webVitals.lcp = lastEntry.startTime;
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      this.observers.push(lcpObserver);
    } catch {
      // LCP not supported
    }

    // FID Observer
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const firstEntry = entries[0] as PerformanceEntry & { processingStart: number; startTime: number };
        if (firstEntry) {
          this.webVitals.fid = firstEntry.processingStart - firstEntry.startTime;
        }
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
      this.observers.push(fidObserver);
    } catch {
      // FID not supported
    }

    // CLS Observer
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShift = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
          if (!layoutShift.hadRecentInput) {
            clsValue += layoutShift.value;
          }
        }
        this.webVitals.cls = clsValue;
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
      this.observers.push(clsObserver);
    } catch {
      // CLS not supported
    }

    // FCP from paint timing
    try {
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.webVitals.fcp = entry.startTime;
          }
        }
      });
      paintObserver.observe({ type: 'paint', buffered: true });
      this.observers.push(paintObserver);
    } catch {
      // Paint timing not supported
    }

    // TTFB from navigation timing
    try {
      const navigationEntries = performance.getEntriesByType('navigation');
      if (navigationEntries.length > 0) {
        const navEntry = navigationEntries[0] as PerformanceNavigationTiming;
        this.webVitals.ttfb = navEntry.responseStart - navEntry.requestStart;
      }
    } catch {
      // Navigation timing not supported
    }
  }

  // Generate comprehensive report
  generateReport(): PerformanceReport {
    const resourceStats = resourceAnalyzer.getStats();
    const networkInfo = networkManager.getInfo();
    const apiMetrics = connectionManager.getMetrics();
    const budgetResult = budgetChecker.check();

    // Memory info (if available)
    const memory: PerformanceReport['memory'] = {};
    if (typeof performance !== 'undefined') {
      const perfWithMemory = performance as Performance & {
        memory?: {
          usedJSHeapSize: number;
          totalJSHeapSize: number;
          jsHeapSizeLimit: number;
        };
      };
      if (perfWithMemory.memory) {
        memory.usedJSHeapSize = perfWithMemory.memory.usedJSHeapSize;
        memory.totalJSHeapSize = perfWithMemory.memory.totalJSHeapSize;
        memory.jsHeapSizeLimit = perfWithMemory.memory.jsHeapSizeLimit;
        memory.usagePercentage = 
          (perfWithMemory.memory.usedJSHeapSize / perfWithMemory.memory.jsHeapSizeLimit) * 100;
      }
    }

    return {
      timestamp: Date.now(),
      duration: Date.now() - this.sessionStartTime,
      webVitals: { ...this.webVitals },
      resources: {
        totalSize: resourceStats.totalSize,
        jsSize: resourceAnalyzer.getJSBundleSize(),
        cssSize: resourceAnalyzer.getCSSSize(),
        imageSize: resourceAnalyzer.getImageSize(),
        fontSize: resourceStats.byType['font']?.size || 0,
        resourceCount: Object.values(resourceStats.byType).reduce((sum, t) => sum + t.count, 0),
      },
      network: {
        online: networkInfo.online,
        effectiveType: networkInfo.effectiveType,
        downlink: networkInfo.downlink,
        rtt: networkInfo.rtt,
        saveData: networkInfo.saveData,
      },
      api: {
        totalRequests: apiMetrics.totalRequests,
        successfulRequests: apiMetrics.successfulRequests,
        failedRequests: apiMetrics.failedRequests,
        averageResponseTime: apiMetrics.averageResponseTime,
      },
      memory,
      budget: {
        passed: budgetResult.passed,
        violations: budgetResult.violations.length,
        warnings: budgetResult.warnings.length,
      },
      workers: {
        supported: workerManager.supported,
      },
    };
  }

  // Get web vitals score
  getWebVitalsScore(): {
    score: 'good' | 'needs-improvement' | 'poor';
    details: Record<string, 'good' | 'needs-improvement' | 'poor'>;
  } {
    const details: Record<string, 'good' | 'needs-improvement' | 'poor'> = {};

    // LCP thresholds
    if (this.webVitals.lcp !== undefined) {
      if (this.webVitals.lcp <= 2500) details.lcp = 'good';
      else if (this.webVitals.lcp <= 4000) details.lcp = 'needs-improvement';
      else details.lcp = 'poor';
    }

    // FID thresholds
    if (this.webVitals.fid !== undefined) {
      if (this.webVitals.fid <= 100) details.fid = 'good';
      else if (this.webVitals.fid <= 300) details.fid = 'needs-improvement';
      else details.fid = 'poor';
    }

    // CLS thresholds
    if (this.webVitals.cls !== undefined) {
      if (this.webVitals.cls <= 0.1) details.cls = 'good';
      else if (this.webVitals.cls <= 0.25) details.cls = 'needs-improvement';
      else details.cls = 'poor';
    }

    // FCP thresholds
    if (this.webVitals.fcp !== undefined) {
      if (this.webVitals.fcp <= 1800) details.fcp = 'good';
      else if (this.webVitals.fcp <= 3000) details.fcp = 'needs-improvement';
      else details.fcp = 'poor';
    }

    // TTFB thresholds
    if (this.webVitals.ttfb !== undefined) {
      if (this.webVitals.ttfb <= 800) details.ttfb = 'good';
      else if (this.webVitals.ttfb <= 1800) details.ttfb = 'needs-improvement';
      else details.ttfb = 'poor';
    }

    // Calculate overall score
    const scores = Object.values(details);
    const poorCount = scores.filter(s => s === 'poor').length;
    const needsImprovementCount = scores.filter(s => s === 'needs-improvement').length;

    let score: 'good' | 'needs-improvement' | 'poor';
    if (poorCount > 0) score = 'poor';
    else if (needsImprovementCount > 0) score = 'needs-improvement';
    else score = 'good';

    return { score, details };
  }

  // Log report to console
  logReport(): void {
    const report = this.generateReport();
    const vitalsScore = this.getWebVitalsScore();

    console.group('📊 Performance Report');
    
    console.group('🌐 Web Vitals');
    console.log(`Overall Score: ${vitalsScore.score}`);
    console.log(`LCP: ${report.webVitals.lcp?.toFixed(0) || 'N/A'}ms (${vitalsScore.details.lcp || 'N/A'})`);
    console.log(`FID: ${report.webVitals.fid?.toFixed(0) || 'N/A'}ms (${vitalsScore.details.fid || 'N/A'})`);
    console.log(`CLS: ${report.webVitals.cls?.toFixed(3) || 'N/A'} (${vitalsScore.details.cls || 'N/A'})`);
    console.log(`FCP: ${report.webVitals.fcp?.toFixed(0) || 'N/A'}ms (${vitalsScore.details.fcp || 'N/A'})`);
    console.log(`TTFB: ${report.webVitals.ttfb?.toFixed(0) || 'N/A'}ms (${vitalsScore.details.ttfb || 'N/A'})`);
    console.groupEnd();

    console.group('📦 Resources');
    console.log(`Total: ${this.formatBytes(report.resources.totalSize)}`);
    console.log(`JavaScript: ${this.formatBytes(report.resources.jsSize)}`);
    console.log(`CSS: ${this.formatBytes(report.resources.cssSize)}`);
    console.log(`Images: ${this.formatBytes(report.resources.imageSize)}`);
    console.log(`Resource Count: ${report.resources.resourceCount}`);
    console.groupEnd();

    console.group('🔌 Network');
    console.log(`Status: ${report.network.online ? 'Online' : 'Offline'}`);
    console.log(`Type: ${report.network.effectiveType}`);
    console.log(`Downlink: ${report.network.downlink} Mbps`);
    console.log(`RTT: ${report.network.rtt}ms`);
    console.log(`Save Data: ${report.network.saveData ? 'Yes' : 'No'}`);
    console.groupEnd();

    console.group('📡 API');
    console.log(`Total Requests: ${report.api.totalRequests}`);
    console.log(`Success Rate: ${
      report.api.totalRequests > 0 
        ? ((report.api.successfulRequests / report.api.totalRequests) * 100).toFixed(1) 
        : 0
    }%`);
    console.log(`Avg Response Time: ${report.api.averageResponseTime.toFixed(0)}ms`);
    console.groupEnd();

    if (report.memory.usedJSHeapSize) {
      console.group('💾 Memory');
      console.log(`Used: ${this.formatBytes(report.memory.usedJSHeapSize)}`);
      console.log(`Total: ${this.formatBytes(report.memory.totalJSHeapSize!)}`);
      console.log(`Usage: ${report.memory.usagePercentage?.toFixed(1)}%`);
      console.groupEnd();
    }

    console.group('📏 Budget');
    console.log(`Status: ${report.budget.passed ? '✅ Passed' : '❌ Failed'}`);
    console.log(`Violations: ${report.budget.violations}`);
    console.log(`Warnings: ${report.budget.warnings}`);
    console.groupEnd();

    console.groupEnd();
  }

  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  // Cleanup
  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Export singleton
export const performanceReporter = PerformanceReporter.getInstance();

// Convenience function to get quick summary
export function getPerformanceSummary(): {
  score: 'good' | 'needs-improvement' | 'poor';
  lcp: number | undefined;
  fid: number | undefined;
  cls: number | undefined;
  totalSize: string;
  apiSuccessRate: string;
} {
  const report = performanceReporter.generateReport();
  const vitalsScore = performanceReporter.getWebVitalsScore();

  return {
    score: vitalsScore.score,
    lcp: report.webVitals.lcp,
    fid: report.webVitals.fid,
    cls: report.webVitals.cls,
    totalSize: `${(report.resources.totalSize / 1024 / 1024).toFixed(2)} MB`,
    apiSuccessRate: report.api.totalRequests > 0
      ? `${((report.api.successfulRequests / report.api.totalRequests) * 100).toFixed(1)}%`
      : 'N/A',
  };
}
