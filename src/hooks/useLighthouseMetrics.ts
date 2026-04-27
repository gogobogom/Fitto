'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  type LighthouseMetrics,
  type LighthouseReport,
  type MetricName,
  calculateMetricScore,
  calculateOverallScore,
  generateLighthouseReport,
  runOptimizationChecks,
  runAccessibilityChecks,
  runSEOChecks,
  runBestPracticesChecks,
  type OptimizationCheck,
} from '@/lib/lighthouseOptimization';

export interface UseLighthouseMetricsReturn {
  metrics: LighthouseMetrics | null;
  report: LighthouseReport | null;
  isCollecting: boolean;
  error: string | null;
  collectMetrics: () => void;
  generateReport: () => LighthouseReport | null;
  getOptimizationChecks: () => {
    performance: OptimizationCheck[];
    accessibility: OptimizationCheck[];
    seo: OptimizationCheck[];
    bestPractices: OptimizationCheck[];
  };
}

export function useLighthouseMetrics(): UseLighthouseMetricsReturn {
  const [metrics, setMetrics] = useState<LighthouseMetrics | null>(null);
  const [report, setReport] = useState<LighthouseReport | null>(null);
  const [isCollecting, setIsCollecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const observersRef = useRef<PerformanceObserver[]>([]);
  const metricsRef = useRef<Partial<LighthouseMetrics>>({});

  const collectMetrics = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    setIsCollecting(true);
    setError(null);
    metricsRef.current = {};
    
    // Clean up previous observers
    observersRef.current.forEach(obs => obs.disconnect());
    observersRef.current = [];
    
    try {
      // TTFB from Navigation Timing
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navEntry) {
        metricsRef.current.TTFB = calculateMetricScore('TTFB', navEntry.responseStart);
      }
      
      // FCP
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        metricsRef.current.FCP = calculateMetricScore('FCP', fcpEntry.startTime);
      }
      
      // LCP
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) {
            metricsRef.current.LCP = calculateMetricScore('LCP', lastEntry.startTime);
            updateMetrics();
          }
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
        observersRef.current.push(lcpObserver);
      } catch (e) {
        console.warn('LCP observer not supported');
      }
      
      // FID
      try {
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const fidEntry = entry as PerformanceEntry & { processingStart: number };
            const fid = fidEntry.processingStart - entry.startTime;
            metricsRef.current.FID = calculateMetricScore('FID', fid);
            updateMetrics();
          }
        });
        fidObserver.observe({ type: 'first-input', buffered: true });
        observersRef.current.push(fidObserver);
      } catch (e) {
        console.warn('FID observer not supported');
      }
      
      // CLS
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const layoutShift = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
            if (!layoutShift.hadRecentInput && layoutShift.value) {
              clsValue += layoutShift.value;
            }
          }
          metricsRef.current.CLS = calculateMetricScore('CLS', clsValue);
          updateMetrics();
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });
        observersRef.current.push(clsObserver);
      } catch (e) {
        console.warn('CLS observer not supported');
      }
      
      // Calculate TBT (Total Blocking Time) - approximation
      try {
        let totalBlockingTime = 0;
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            // Long tasks are > 50ms, blocking time is duration - 50ms
            const blockingTime = Math.max(0, entry.duration - 50);
            totalBlockingTime += blockingTime;
          }
          metricsRef.current.TBT = calculateMetricScore('TBT', totalBlockingTime);
          updateMetrics();
        });
        longTaskObserver.observe({ type: 'longtask', buffered: true });
        observersRef.current.push(longTaskObserver);
      } catch (e) {
        console.warn('Long task observer not supported');
      }
      
      // Initial update
      updateMetrics();
      
      // Final update after a delay to capture late metrics
      setTimeout(() => {
        updateMetrics();
        setIsCollecting(false);
      }, 5000);
      
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to collect metrics');
      setIsCollecting(false);
    }
  }, []);

  const updateMetrics = useCallback(() => {
    const currentMetrics = metricsRef.current;
    
    const fullMetrics: LighthouseMetrics = {
      FCP: currentMetrics.FCP || null,
      LCP: currentMetrics.LCP || null,
      FID: currentMetrics.FID || null,
      CLS: currentMetrics.CLS || null,
      TTFB: currentMetrics.TTFB || null,
      TBT: currentMetrics.TBT || null,
      SI: currentMetrics.SI || null,
      TTI: currentMetrics.TTI || null,
      overallScore: calculateOverallScore(currentMetrics),
      timestamp: Date.now(),
    };
    
    setMetrics(fullMetrics);
  }, []);

  const generateReportCallback = useCallback((): LighthouseReport | null => {
    if (!metrics) return null;
    
    const newReport = generateLighthouseReport(metrics);
    setReport(newReport);
    return newReport;
  }, [metrics]);

  const getOptimizationChecks = useCallback(() => {
    return {
      performance: runOptimizationChecks(),
      accessibility: runAccessibilityChecks(),
      seo: runSEOChecks(),
      bestPractices: runBestPracticesChecks(),
    };
  }, []);

  // Auto-collect metrics on mount
  useEffect(() => {
    // Wait for page load
    if (document.readyState === 'complete') {
      collectMetrics();
    } else {
      window.addEventListener('load', collectMetrics);
      return () => window.removeEventListener('load', collectMetrics);
    }
    
    return () => {
      observersRef.current.forEach(obs => obs.disconnect());
    };
  }, [collectMetrics]);

  return {
    metrics,
    report,
    isCollecting,
    error,
    collectMetrics,
    generateReport: generateReportCallback,
    getOptimizationChecks,
  };
}

// Hook for individual metric tracking
export function useWebVitalMetric(metricName: MetricName): {
  value: number | null;
  score: 'good' | 'needs-improvement' | 'poor' | null;
  isLoading: boolean;
} {
  const [value, setValue] = useState<number | null>(null);
  const [score, setScore] = useState<'good' | 'needs-improvement' | 'poor' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const observerCallbacks: Record<MetricName, () => void> = {
      FCP: () => {
        const entries = performance.getEntriesByType('paint');
        const fcp = entries.find(e => e.name === 'first-contentful-paint');
        if (fcp) {
          const result = calculateMetricScore('FCP', fcp.startTime);
          setValue(result.value);
          setScore(result.score);
          setIsLoading(false);
        }
      },
      LCP: () => {
        try {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            if (lastEntry) {
              const result = calculateMetricScore('LCP', lastEntry.startTime);
              setValue(result.value);
              setScore(result.score);
              setIsLoading(false);
            }
          });
          observer.observe({ type: 'largest-contentful-paint', buffered: true });
          return () => observer.disconnect();
        } catch {
          setIsLoading(false);
        }
      },
      FID: () => {
        try {
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              const fidEntry = entry as PerformanceEntry & { processingStart: number };
              const fid = fidEntry.processingStart - entry.startTime;
              const result = calculateMetricScore('FID', fid);
              setValue(result.value);
              setScore(result.score);
              setIsLoading(false);
            }
          });
          observer.observe({ type: 'first-input', buffered: true });
          return () => observer.disconnect();
        } catch {
          setIsLoading(false);
        }
      },
      CLS: () => {
        try {
          let clsValue = 0;
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              const layoutShift = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
              if (!layoutShift.hadRecentInput && layoutShift.value) {
                clsValue += layoutShift.value;
              }
            }
            const result = calculateMetricScore('CLS', clsValue);
            setValue(result.value);
            setScore(result.score);
            setIsLoading(false);
          });
          observer.observe({ type: 'layout-shift', buffered: true });
          return () => observer.disconnect();
        } catch {
          setIsLoading(false);
        }
      },
      TTFB: () => {
        const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navEntry) {
          const result = calculateMetricScore('TTFB', navEntry.responseStart);
          setValue(result.value);
          setScore(result.score);
        }
        setIsLoading(false);
      },
      TBT: () => {
        try {
          let totalBlockingTime = 0;
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              const blockingTime = Math.max(0, entry.duration - 50);
              totalBlockingTime += blockingTime;
            }
            const result = calculateMetricScore('TBT', totalBlockingTime);
            setValue(result.value);
            setScore(result.score);
            setIsLoading(false);
          });
          observer.observe({ type: 'longtask', buffered: true });
          return () => observer.disconnect();
        } catch {
          setIsLoading(false);
        }
      },
      SI: () => {
        // Speed Index requires visual progress tracking - not directly available
        setIsLoading(false);
      },
      TTI: () => {
        // Time to Interactive requires complex calculation - approximate with load event
        if (document.readyState === 'complete') {
          const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          if (navEntry) {
            const result = calculateMetricScore('TTI', navEntry.domInteractive);
            setValue(result.value);
            setScore(result.score);
          }
        }
        setIsLoading(false);
      },
    };

    const cleanup = observerCallbacks[metricName]?.();
    
    return () => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [metricName]);

  return { value, score, isLoading };
}
