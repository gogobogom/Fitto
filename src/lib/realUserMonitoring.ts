/**
 * Real User Monitoring (RUM) System
 * Tracks actual user performance metrics and behaviors
 */

// RUM Event Types
export type RUMEventType = 
  | 'page_view'
  | 'navigation'
  | 'interaction'
  | 'error'
  | 'resource'
  | 'web_vital'
  | 'custom'
  | 'session_start'
  | 'session_end'
  | 'rage_click'
  | 'dead_click'
  | 'long_task';

export interface RUMEvent {
  id: string;
  type: RUMEventType;
  timestamp: number;
  sessionId: string;
  userId?: string;
  url: string;
  data: Record<string, unknown>;
  context: RUMContext;
}

export interface RUMContext {
  userAgent: string;
  language: string;
  screenWidth: number;
  screenHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  devicePixelRatio: number;
  connectionType?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  referrer: string;
  pathname: string;
  isTouch: boolean;
}

export interface WebVitalMetric {
  name: 'FCP' | 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  entries: PerformanceEntry[];
}

export interface SessionData {
  id: string;
  startTime: number;
  lastActivity: number;
  pageViews: number;
  interactions: number;
  errors: number;
  webVitals: Record<string, WebVitalMetric>;
  duration: number;
}

// Generate unique IDs
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// Get or create session
function getSession(): SessionData {
  if (typeof window === 'undefined') {
    return createNewSession();
  }
  
  const stored = sessionStorage.getItem('rum_session');
  if (stored) {
    try {
      const session = JSON.parse(stored) as SessionData;
      // Check if session is still valid (30 min timeout)
      if (Date.now() - session.lastActivity < 30 * 60 * 1000) {
        session.lastActivity = Date.now();
        session.duration = Date.now() - session.startTime;
        sessionStorage.setItem('rum_session', JSON.stringify(session));
        return session;
      }
    } catch {
      // Invalid session data
    }
  }
  
  return createNewSession();
}

function createNewSession(): SessionData {
  const session: SessionData = {
    id: generateId(),
    startTime: Date.now(),
    lastActivity: Date.now(),
    pageViews: 0,
    interactions: 0,
    errors: 0,
    webVitals: {},
    duration: 0,
  };
  
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('rum_session', JSON.stringify(session));
  }
  
  return session;
}

function updateSession(updates: Partial<SessionData>): SessionData {
  const session = getSession();
  Object.assign(session, updates, { lastActivity: Date.now(), duration: Date.now() - session.startTime });
  
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('rum_session', JSON.stringify(session));
  }
  
  return session;
}

// Get context
function getContext(): RUMContext {
  if (typeof window === 'undefined') {
    return {
      userAgent: '',
      language: 'en',
      screenWidth: 0,
      screenHeight: 0,
      viewportWidth: 0,
      viewportHeight: 0,
      devicePixelRatio: 1,
      referrer: '',
      pathname: '/',
      isTouch: false,
    };
  }
  
  const nav = navigator as Navigator & {
    connection?: {
      type?: string;
      effectiveType?: string;
      downlink?: number;
      rtt?: number;
    };
  };
  
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    screenWidth: screen.width,
    screenHeight: screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio,
    connectionType: nav.connection?.type,
    effectiveType: nav.connection?.effectiveType,
    downlink: nav.connection?.downlink,
    rtt: nav.connection?.rtt,
    referrer: document.referrer,
    pathname: location.pathname,
    isTouch: 'ontouchstart' in window,
  };
}

// Event buffer and transport
class RUMTransport {
  private buffer: RUMEvent[] = [];
  private flushInterval: ReturnType<typeof setInterval> | null = null;
  private endpoint: string = '/api/rum';
  private batchSize: number = 10;
  private flushDelay: number = 5000;
  
  constructor(options?: { endpoint?: string; batchSize?: number; flushDelay?: number }) {
    if (options?.endpoint) this.endpoint = options.endpoint;
    if (options?.batchSize) this.batchSize = options.batchSize;
    if (options?.flushDelay) this.flushDelay = options.flushDelay;
    
    this.startAutoFlush();
    this.setupBeforeUnload();
  }
  
  addEvent(event: RUMEvent): void {
    this.buffer.push(event);
    
    if (this.buffer.length >= this.batchSize) {
      this.flush();
    }
  }
  
  private startAutoFlush(): void {
    if (typeof window === 'undefined') return;
    
    this.flushInterval = setInterval(() => {
      this.flush();
    }, this.flushDelay);
  }
  
  private setupBeforeUnload(): void {
    if (typeof window === 'undefined') return;
    
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush(true);
      }
    });
    
    window.addEventListener('pagehide', () => {
      this.flush(true);
    });
  }
  
  flush(useBeacon: boolean = false): void {
    if (this.buffer.length === 0) return;
    
    const events = [...this.buffer];
    this.buffer = [];
    
    const payload = JSON.stringify({ events, timestamp: Date.now() });
    
    if (useBeacon && navigator.sendBeacon) {
      navigator.sendBeacon(this.endpoint, payload);
    } else {
      // Store locally if no endpoint configured
      this.storeLocally(events);
    }
  }
  
  private storeLocally(events: RUMEvent[]): void {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem('rum_events') || '[]';
      const existing = JSON.parse(stored) as RUMEvent[];
      const combined = [...existing, ...events].slice(-1000); // Keep last 1000 events
      localStorage.setItem('rum_events', JSON.stringify(combined));
    } catch {
      // Storage full or unavailable
    }
  }
  
  getStoredEvents(): RUMEvent[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem('rum_events') || '[]';
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  
  clearStoredEvents(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('rum_events');
  }
  
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush(true);
  }
}

// Main RUM class
class RealUserMonitor {
  private transport: RUMTransport;
  private observers: Map<string, PerformanceObserver> = new Map();
  private clickTracker: ClickTracker | null = null;
  private isInitialized: boolean = false;
  
  constructor() {
    this.transport = new RUMTransport();
  }
  
  init(options?: { userId?: string }): void {
    if (typeof window === 'undefined' || this.isInitialized) return;
    
    this.isInitialized = true;
    
    // Track session start
    this.trackEvent('session_start', {});
    
    // Setup observers
    this.observeWebVitals();
    this.observeLongTasks();
    this.observeResources();
    
    // Setup click tracking
    this.clickTracker = new ClickTracker((event) => {
      this.trackEvent(event.type as RUMEventType, event.data);
    });
    
    // Track initial page view
    this.trackPageView();
    
    // Setup navigation tracking
    this.setupNavigationTracking();
    
    // Setup error tracking
    this.setupErrorTracking();
  }
  
  trackEvent(type: RUMEventType, data: Record<string, unknown>): void {
    const session = getSession();
    
    const event: RUMEvent = {
      id: generateId(),
      type,
      timestamp: Date.now(),
      sessionId: session.id,
      url: typeof window !== 'undefined' ? location.href : '',
      data,
      context: getContext(),
    };
    
    this.transport.addEvent(event);
    
    // Update session stats
    if (type === 'page_view') {
      updateSession({ pageViews: session.pageViews + 1 });
    } else if (type === 'interaction') {
      updateSession({ interactions: session.interactions + 1 });
    } else if (type === 'error') {
      updateSession({ errors: session.errors + 1 });
    }
  }
  
  trackPageView(data?: Record<string, unknown>): void {
    this.trackEvent('page_view', {
      title: typeof document !== 'undefined' ? document.title : '',
      loadTime: performance.now(),
      ...data,
    });
  }
  
  trackInteraction(name: string, data?: Record<string, unknown>): void {
    this.trackEvent('interaction', {
      name,
      ...data,
    });
  }
  
  trackError(error: Error, context?: Record<string, unknown>): void {
    this.trackEvent('error', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...context,
    });
  }
  
  trackCustom(name: string, data?: Record<string, unknown>): void {
    this.trackEvent('custom', {
      name,
      ...data,
    });
  }
  
  private observeWebVitals(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;
    
    // FCP
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.reportWebVital('FCP', entry.startTime);
          }
        }
      });
      fcpObserver.observe({ type: 'paint', buffered: true });
      this.observers.set('fcp', fcpObserver);
    } catch {
      // Observer not supported
    }
    
    // LCP
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          this.reportWebVital('LCP', lastEntry.startTime);
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      this.observers.set('lcp', lcpObserver);
    } catch {
      // Observer not supported
    }
    
    // FID
    try {
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fidEntry = entry as PerformanceEventTiming;
          this.reportWebVital('FID', fidEntry.processingStart - fidEntry.startTime);
        }
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
      this.observers.set('fid', fidObserver);
    } catch {
      // Observer not supported
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
        this.reportWebVital('CLS', clsValue);
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
      this.observers.set('cls', clsObserver);
    } catch {
      // Observer not supported
    }
    
    // INP (Interaction to Next Paint)
    try {
      let maxINP = 0;
      const inpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const eventEntry = entry as PerformanceEventTiming;
          const duration = eventEntry.duration;
          if (duration > maxINP) {
            maxINP = duration;
            this.reportWebVital('INP', maxINP);
          }
        }
      });
      inpObserver.observe({ type: 'event', buffered: true });
      this.observers.set('inp', inpObserver);
    } catch {
      // Observer not supported
    }
  }
  
  private reportWebVital(name: WebVitalMetric['name'], value: number): void {
    const thresholds: Record<string, { good: number; poor: number }> = {
      FCP: { good: 1800, poor: 3000 },
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      INP: { good: 200, poor: 500 },
      TTFB: { good: 800, poor: 1800 },
    };
    
    const threshold = thresholds[name];
    let rating: WebVitalMetric['rating'] = 'good';
    
    if (threshold) {
      if (value > threshold.poor) {
        rating = 'poor';
      } else if (value > threshold.good) {
        rating = 'needs-improvement';
      }
    }
    
    this.trackEvent('web_vital', {
      name,
      value,
      rating,
    });
    
    // Update session
    const session = getSession();
    session.webVitals[name] = {
      name,
      value,
      rating,
      delta: value,
      entries: [],
    };
    updateSession({ webVitals: session.webVitals });
  }
  
  private observeLongTasks(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;
    
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.trackEvent('long_task', {
            duration: entry.duration,
            startTime: entry.startTime,
            name: entry.name,
          });
        }
      });
      longTaskObserver.observe({ type: 'longtask', buffered: true });
      this.observers.set('longtask', longTaskObserver);
    } catch {
      // Observer not supported
    }
  }
  
  private observeResources(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;
    
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resource = entry as PerformanceResourceTiming;
          
          // Only track slow resources (> 1s)
          if (resource.duration > 1000) {
            this.trackEvent('resource', {
              name: resource.name,
              type: resource.initiatorType,
              duration: resource.duration,
              transferSize: resource.transferSize,
              encodedBodySize: resource.encodedBodySize,
              decodedBodySize: resource.decodedBodySize,
            });
          }
        }
      });
      resourceObserver.observe({ type: 'resource', buffered: true });
      this.observers.set('resource', resourceObserver);
    } catch {
      // Observer not supported
    }
  }
  
  private setupNavigationTracking(): void {
    if (typeof window === 'undefined') return;
    
    // Track SPA navigations
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      this.trackPageView({ navigationType: 'pushState' });
    };
    
    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args);
      this.trackPageView({ navigationType: 'replaceState' });
    };
    
    window.addEventListener('popstate', () => {
      this.trackPageView({ navigationType: 'popstate' });
    });
  }
  
  private setupErrorTracking(): void {
    if (typeof window === 'undefined') return;
    
    window.addEventListener('error', (event) => {
      this.trackError(new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason));
      this.trackError(error, { type: 'unhandledrejection' });
    });
  }
  
  getSession(): SessionData {
    return getSession();
  }
  
  getStoredEvents(): RUMEvent[] {
    return this.transport.getStoredEvents();
  }
  
  clearStoredEvents(): void {
    this.transport.clearStoredEvents();
  }
  
  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.clickTracker?.destroy();
    this.transport.destroy();
    this.isInitialized = false;
  }
}

// Click tracking for rage clicks and dead clicks
class ClickTracker {
  private clicks: Array<{ x: number; y: number; time: number; target: string }> = [];
  private callback: (event: { type: string; data: Record<string, unknown> }) => void;
  private readonly RAGE_CLICK_THRESHOLD = 3;
  private readonly RAGE_CLICK_WINDOW = 1000;
  private readonly DEAD_CLICK_TIMEOUT = 1000;
  
  constructor(callback: (event: { type: string; data: Record<string, unknown> }) => void) {
    this.callback = callback;
    this.setupListeners();
  }
  
  private setupListeners(): void {
    if (typeof window === 'undefined') return;
    
    document.addEventListener('click', this.handleClick.bind(this), true);
  }
  
  private handleClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const now = Date.now();
    
    const click = {
      x: event.clientX,
      y: event.clientY,
      time: now,
      target: this.getTargetSelector(target),
    };
    
    this.clicks.push(click);
    
    // Clean old clicks
    this.clicks = this.clicks.filter(c => now - c.time < this.RAGE_CLICK_WINDOW);
    
    // Check for rage clicks
    const nearbyClicks = this.clicks.filter(c => 
      Math.abs(c.x - click.x) < 50 && Math.abs(c.y - click.y) < 50
    );
    
    if (nearbyClicks.length >= this.RAGE_CLICK_THRESHOLD) {
      this.callback({
        type: 'rage_click',
        data: {
          clickCount: nearbyClicks.length,
          target: click.target,
          x: click.x,
          y: click.y,
        },
      });
      this.clicks = [];
    }
    
    // Check for dead clicks (clicks that don't trigger navigation or visible change)
    const isInteractive = target.tagName === 'A' || 
                          target.tagName === 'BUTTON' || 
                          target.closest('a') || 
                          target.closest('button') ||
                          target.getAttribute('role') === 'button' ||
                          target.onclick !== null;
    
    if (!isInteractive) {
      setTimeout(() => {
        // If we're still on the same page and no visible change happened
        this.callback({
          type: 'dead_click',
          data: {
            target: click.target,
            x: click.x,
            y: click.y,
          },
        });
      }, this.DEAD_CLICK_TIMEOUT);
    }
  }
  
  private getTargetSelector(element: HTMLElement): string {
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ').join('.')}`;
    return element.tagName.toLowerCase();
  }
  
  destroy(): void {
    if (typeof window === 'undefined') return;
    document.removeEventListener('click', this.handleClick.bind(this), true);
  }
}

// Singleton instance
export const rum = new RealUserMonitor();

// Analytics helpers
export function getPerformanceScore(webVitals: Record<string, WebVitalMetric>): number {
  const weights: Record<string, number> = {
    LCP: 0.25,
    FID: 0.25,
    CLS: 0.25,
    FCP: 0.15,
    INP: 0.10,
  };
  
  let totalWeight = 0;
  let weightedScore = 0;
  
  for (const [name, weight] of Object.entries(weights)) {
    const metric = webVitals[name];
    if (metric) {
      const score = metric.rating === 'good' ? 100 : metric.rating === 'needs-improvement' ? 50 : 0;
      weightedScore += score * weight;
      totalWeight += weight;
    }
  }
  
  return totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0;
}

export function aggregateSessionMetrics(sessions: SessionData[]): {
  avgPageViews: number;
  avgDuration: number;
  avgInteractions: number;
  errorRate: number;
  avgPerformanceScore: number;
} {
  if (sessions.length === 0) {
    return {
      avgPageViews: 0,
      avgDuration: 0,
      avgInteractions: 0,
      errorRate: 0,
      avgPerformanceScore: 0,
    };
  }
  
  const totalPageViews = sessions.reduce((sum, s) => sum + s.pageViews, 0);
  const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);
  const totalInteractions = sessions.reduce((sum, s) => sum + s.interactions, 0);
  const totalErrors = sessions.reduce((sum, s) => sum + s.errors, 0);
  const totalActions = totalPageViews + totalInteractions;
  
  const performanceScores = sessions
    .map(s => getPerformanceScore(s.webVitals))
    .filter(score => score > 0);
  
  return {
    avgPageViews: totalPageViews / sessions.length,
    avgDuration: totalDuration / sessions.length,
    avgInteractions: totalInteractions / sessions.length,
    errorRate: totalActions > 0 ? totalErrors / totalActions : 0,
    avgPerformanceScore: performanceScores.length > 0 
      ? performanceScores.reduce((a, b) => a + b, 0) / performanceScores.length 
      : 0,
  };
}

// Type for event timing
interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number;
  processingEnd: number;
  duration: number;
  cancelable: boolean;
  target?: Node;
}
