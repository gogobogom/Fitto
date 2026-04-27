'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  rum,
  type RUMEvent,
  type SessionData,
  type WebVitalMetric,
  getPerformanceScore,
  aggregateSessionMetrics,
} from '@/lib/realUserMonitoring';

export interface UseRUMReturn {
  session: SessionData | null;
  events: RUMEvent[];
  webVitals: Record<string, WebVitalMetric>;
  performanceScore: number;
  isInitialized: boolean;
  trackInteraction: (name: string, data?: Record<string, unknown>) => void;
  trackError: (error: Error, context?: Record<string, unknown>) => void;
  trackCustom: (name: string, data?: Record<string, unknown>) => void;
  clearEvents: () => void;
}

export function useRUM(options?: { userId?: string; autoInit?: boolean }): UseRUMReturn {
  const [session, setSession] = useState<SessionData | null>(null);
  const [events, setEvents] = useState<RUMEvent[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const initRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (initRef.current) return;
    if (options?.autoInit === false) return;
    
    initRef.current = true;
    
    // Initialize RUM
    rum.init({ userId: options?.userId });
    setIsInitialized(true);
    
    // Get initial session
    setSession(rum.getSession());
    setEvents(rum.getStoredEvents());
    
    // Update session periodically
    const interval = setInterval(() => {
      setSession(rum.getSession());
      setEvents(rum.getStoredEvents());
    }, 5000);
    
    return () => {
      clearInterval(interval);
    };
  }, [options?.userId, options?.autoInit]);

  const trackInteraction = useCallback((name: string, data?: Record<string, unknown>) => {
    rum.trackInteraction(name, data);
  }, []);

  const trackError = useCallback((error: Error, context?: Record<string, unknown>) => {
    rum.trackError(error, context);
  }, []);

  const trackCustom = useCallback((name: string, data?: Record<string, unknown>) => {
    rum.trackCustom(name, data);
  }, []);

  const clearEvents = useCallback(() => {
    rum.clearStoredEvents();
    setEvents([]);
  }, []);

  const webVitals = session?.webVitals || {};
  const performanceScore = getPerformanceScore(webVitals);

  return {
    session,
    events,
    webVitals,
    performanceScore,
    isInitialized,
    trackInteraction,
    trackError,
    trackCustom,
    clearEvents,
  };
}

// Hook for tracking specific interactions
export function useInteractionTracking(interactionName: string) {
  const startTimeRef = useRef<number | null>(null);

  const startTracking = useCallback(() => {
    startTimeRef.current = performance.now();
  }, []);

  const endTracking = useCallback((additionalData?: Record<string, unknown>) => {
    if (startTimeRef.current === null) return;
    
    const duration = performance.now() - startTimeRef.current;
    rum.trackInteraction(interactionName, {
      duration,
      ...additionalData,
    });
    
    startTimeRef.current = null;
  }, [interactionName]);

  const trackOnce = useCallback((data?: Record<string, unknown>) => {
    rum.trackInteraction(interactionName, data);
  }, [interactionName]);

  return {
    startTracking,
    endTracking,
    trackOnce,
  };
}

// Hook for tracking page performance
export function usePagePerformance() {
  const [metrics, setMetrics] = useState<{
    loadTime: number | null;
    domContentLoaded: number | null;
    firstPaint: number | null;
    firstContentfulPaint: number | null;
    largestContentfulPaint: number | null;
    timeToInteractive: number | null;
  }>({
    loadTime: null,
    domContentLoaded: null,
    firstPaint: null,
    firstContentfulPaint: null,
    largestContentfulPaint: null,
    timeToInteractive: null,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const collectMetrics = () => {
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paintEntries = performance.getEntriesByType('paint');
      
      setMetrics(prev => ({
        ...prev,
        loadTime: navEntry?.loadEventEnd || null,
        domContentLoaded: navEntry?.domContentLoadedEventEnd || null,
        firstPaint: paintEntries.find(e => e.name === 'first-paint')?.startTime || null,
        firstContentfulPaint: paintEntries.find(e => e.name === 'first-contentful-paint')?.startTime || null,
        timeToInteractive: navEntry?.domInteractive || null,
      }));
    };

    if (document.readyState === 'complete') {
      collectMetrics();
    } else {
      window.addEventListener('load', collectMetrics);
      return () => window.removeEventListener('load', collectMetrics);
    }

    // LCP observer
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          setMetrics(prev => ({
            ...prev,
            largestContentfulPaint: lastEntry.startTime,
          }));
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      return () => lcpObserver.disconnect();
    } catch {
      // Observer not supported
    }
  }, []);

  return metrics;
}

// Hook for error boundary integration
export function useErrorTracking() {
  const trackError = useCallback((error: Error, errorInfo?: { componentStack?: string }) => {
    rum.trackError(error, {
      componentStack: errorInfo?.componentStack,
      timestamp: Date.now(),
    });
  }, []);

  return { trackError };
}

// Hook for analytics dashboard data
export function useRUMAnalytics() {
  const [analytics, setAnalytics] = useState<{
    totalSessions: number;
    totalPageViews: number;
    totalInteractions: number;
    totalErrors: number;
    avgSessionDuration: number;
    avgPerformanceScore: number;
    topErrors: Array<{ message: string; count: number }>;
    topInteractions: Array<{ name: string; count: number }>;
  }>({
    totalSessions: 0,
    totalPageViews: 0,
    totalInteractions: 0,
    totalErrors: 0,
    avgSessionDuration: 0,
    avgPerformanceScore: 0,
    topErrors: [],
    topInteractions: [],
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const events = rum.getStoredEvents();
    
    // Calculate analytics
    const sessions = new Map<string, SessionData>();
    const errorCounts = new Map<string, number>();
    const interactionCounts = new Map<string, number>();
    
    events.forEach(event => {
      if (event.type === 'error') {
        const message = (event.data.message as string) || 'Unknown error';
        errorCounts.set(message, (errorCounts.get(message) || 0) + 1);
      }
      
      if (event.type === 'interaction') {
        const name = (event.data.name as string) || 'Unknown';
        interactionCounts.set(name, (interactionCounts.get(name) || 0) + 1);
      }
    });
    
    const session = rum.getSession();
    if (session) {
      sessions.set(session.id, session);
    }
    
    const sessionArray = Array.from(sessions.values());
    const aggregated = aggregateSessionMetrics(sessionArray);
    
    const topErrors = Array.from(errorCounts.entries())
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    const topInteractions = Array.from(interactionCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    setAnalytics({
      totalSessions: sessionArray.length,
      totalPageViews: sessionArray.reduce((sum, s) => sum + s.pageViews, 0),
      totalInteractions: sessionArray.reduce((sum, s) => sum + s.interactions, 0),
      totalErrors: sessionArray.reduce((sum, s) => sum + s.errors, 0),
      avgSessionDuration: aggregated.avgDuration,
      avgPerformanceScore: aggregated.avgPerformanceScore,
      topErrors,
      topInteractions,
    });
  }, []);

  return analytics;
}

// Component performance tracking hook
export function useComponentPerformance(componentName: string) {
  const mountTimeRef = useRef<number>(0);
  const renderCountRef = useRef(0);

  useEffect(() => {
    mountTimeRef.current = performance.now();
    
    return () => {
      const unmountTime = performance.now();
      const lifetimeDuration = unmountTime - mountTimeRef.current;
      
      rum.trackCustom('component_lifecycle', {
        component: componentName,
        lifetime: lifetimeDuration,
        renderCount: renderCountRef.current,
      });
    };
  }, [componentName]);

  useEffect(() => {
    renderCountRef.current += 1;
  });

  const trackRender = useCallback((renderTime: number) => {
    rum.trackCustom('component_render', {
      component: componentName,
      renderTime,
      renderCount: renderCountRef.current,
    });
  }, [componentName]);

  return { trackRender };
}
