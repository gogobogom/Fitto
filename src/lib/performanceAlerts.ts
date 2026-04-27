// Performance Alerts System
// Custom thresholds, notifications, and alert history

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  metric: MetricType;
  condition: AlertCondition;
  threshold: number;
  duration: number; // ms - how long condition must be true
  cooldown: number; // ms - minimum time between alerts
  severity: AlertSeverity;
  channels: NotificationChannel[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type MetricType = 
  | 'fcp' // First Contentful Paint
  | 'lcp' // Largest Contentful Paint
  | 'fid' // First Input Delay
  | 'cls' // Cumulative Layout Shift
  | 'ttfb' // Time to First Byte
  | 'tti' // Time to Interactive
  | 'tbt' // Total Blocking Time
  | 'memory' // Memory usage (MB)
  | 'cpu' // CPU usage (%)
  | 'fps' // Frames per second
  | 'errorRate' // Errors per minute
  | 'apiLatency' // API response time (ms)
  | 'networkLatency' // Network latency (ms)
  | 'pageLoadTime' // Full page load (ms)
  | 'resourceSize' // Resource size (KB)
  | 'longTask' // Long task duration (ms)
  | 'custom';

export type AlertCondition = 
  | 'greaterThan'
  | 'lessThan'
  | 'equals'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual'
  | 'between'
  | 'outside';

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

export type NotificationChannel = 
  | 'inApp'
  | 'console'
  | 'toast'
  | 'webhook'
  | 'email'
  | 'slack';

export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  metric: MetricType;
  value: number;
  threshold: number;
  severity: AlertSeverity;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolved: boolean;
  resolvedAt?: Date;
  metadata: Record<string, unknown>;
}

export interface AlertStats {
  total: number;
  bySeverity: Record<AlertSeverity, number>;
  byMetric: Record<string, number>;
  acknowledged: number;
  resolved: number;
  avgResponseTime: number; // ms to acknowledge
}

export interface MetricReading {
  metric: MetricType;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
}

// Default alert thresholds based on Web Vitals
const DEFAULT_THRESHOLDS: Record<MetricType, { good: number; poor: number }> = {
  fcp: { good: 1800, poor: 3000 },
  lcp: { good: 2500, poor: 4000 },
  fid: { good: 100, poor: 300 },
  cls: { good: 0.1, poor: 0.25 },
  ttfb: { good: 800, poor: 1800 },
  tti: { good: 3800, poor: 7300 },
  tbt: { good: 200, poor: 600 },
  memory: { good: 50, poor: 100 }, // MB
  cpu: { good: 50, poor: 80 }, // %
  fps: { good: 50, poor: 30 }, // frames
  errorRate: { good: 1, poor: 5 }, // per minute
  apiLatency: { good: 200, poor: 1000 }, // ms
  networkLatency: { good: 100, poor: 500 }, // ms
  pageLoadTime: { good: 3000, poor: 6000 }, // ms
  resourceSize: { good: 500, poor: 2000 }, // KB
  longTask: { good: 50, poor: 100 }, // ms
  custom: { good: 0, poor: 100 },
};

// Storage keys
const STORAGE_KEYS = {
  RULES: 'perf_alert_rules',
  ALERTS: 'perf_alerts',
  METRICS: 'perf_metrics_buffer',
} as const;

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Performance Alerts Manager
class PerformanceAlertsManager {
  private rules: Map<string, AlertRule> = new Map();
  private alerts: Alert[] = [];
  private metricsBuffer: Map<MetricType, MetricReading[]> = new Map();
  private lastAlertTime: Map<string, number> = new Map();
  private listeners: Set<(alert: Alert) => void> = new Set();
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  private webhookUrl: string | null = null;
  
  constructor() {
    if (typeof window !== 'undefined') {
      this.loadFromStorage();
      this.startMonitoring();
      this.setupDefaultRules();
    }
  }
  
  // Load rules and alerts from storage
  private loadFromStorage(): void {
    try {
      const rulesJson = localStorage.getItem(STORAGE_KEYS.RULES);
      if (rulesJson) {
        const rules = JSON.parse(rulesJson);
        rules.forEach((rule: AlertRule) => {
          this.rules.set(rule.id, {
            ...rule,
            createdAt: new Date(rule.createdAt),
            updatedAt: new Date(rule.updatedAt),
          });
        });
      }
      
      const alertsJson = localStorage.getItem(STORAGE_KEYS.ALERTS);
      if (alertsJson) {
        this.alerts = JSON.parse(alertsJson).map((alert: Alert) => ({
          ...alert,
          timestamp: new Date(alert.timestamp),
          acknowledgedAt: alert.acknowledgedAt ? new Date(alert.acknowledgedAt) : undefined,
          resolvedAt: alert.resolvedAt ? new Date(alert.resolvedAt) : undefined,
        }));
      }
    } catch {
      // Ignore storage errors
    }
  }
  
  // Save to storage
  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(
        STORAGE_KEYS.RULES,
        JSON.stringify(Array.from(this.rules.values()))
      );
      localStorage.setItem(
        STORAGE_KEYS.ALERTS,
        JSON.stringify(this.alerts.slice(-100)) // Keep last 100 alerts
      );
    } catch {
      // Ignore storage errors
    }
  }
  
  // Setup default monitoring rules
  private setupDefaultRules(): void {
    const defaultRules: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'LCP Uyarısı',
        description: 'Largest Contentful Paint çok yüksek',
        enabled: true,
        metric: 'lcp',
        condition: 'greaterThan',
        threshold: 2500,
        duration: 0,
        cooldown: 60000,
        severity: 'warning',
        channels: ['inApp', 'console'],
        tags: ['web-vitals', 'performance'],
      },
      {
        name: 'LCP Kritik',
        description: 'Largest Contentful Paint kritik seviyede',
        enabled: true,
        metric: 'lcp',
        condition: 'greaterThan',
        threshold: 4000,
        duration: 0,
        cooldown: 60000,
        severity: 'critical',
        channels: ['inApp', 'console', 'toast'],
        tags: ['web-vitals', 'performance'],
      },
      {
        name: 'CLS Uyarısı',
        description: 'Cumulative Layout Shift yüksek',
        enabled: true,
        metric: 'cls',
        condition: 'greaterThan',
        threshold: 0.1,
        duration: 0,
        cooldown: 60000,
        severity: 'warning',
        channels: ['inApp', 'console'],
        tags: ['web-vitals', 'ux'],
      },
      {
        name: 'Bellek Uyarısı',
        description: 'Bellek kullanımı yüksek',
        enabled: true,
        metric: 'memory',
        condition: 'greaterThan',
        threshold: 100,
        duration: 5000,
        cooldown: 120000,
        severity: 'warning',
        channels: ['inApp', 'console'],
        tags: ['memory', 'performance'],
      },
      {
        name: 'API Yavaşlık',
        description: 'API yanıt süresi çok yüksek',
        enabled: true,
        metric: 'apiLatency',
        condition: 'greaterThan',
        threshold: 1000,
        duration: 0,
        cooldown: 30000,
        severity: 'warning',
        channels: ['inApp', 'console'],
        tags: ['api', 'latency'],
      },
      {
        name: 'Hata Oranı Yüksek',
        description: 'Dakika başına hata sayısı yüksek',
        enabled: true,
        metric: 'errorRate',
        condition: 'greaterThan',
        threshold: 5,
        duration: 60000,
        cooldown: 300000,
        severity: 'error',
        channels: ['inApp', 'console', 'toast'],
        tags: ['errors', 'stability'],
      },
      {
        name: 'FPS Düşük',
        description: 'Frame rate düşük, animasyonlar akıcı değil',
        enabled: true,
        metric: 'fps',
        condition: 'lessThan',
        threshold: 30,
        duration: 3000,
        cooldown: 60000,
        severity: 'warning',
        channels: ['console'],
        tags: ['animation', 'performance'],
      },
    ];
    
    // Add default rules if not already present
    defaultRules.forEach(rule => {
      const exists = Array.from(this.rules.values()).some(r => r.name === rule.name);
      if (!exists) {
        this.addRule(rule);
      }
    });
  }
  
  // Start monitoring
  private startMonitoring(): void {
    this.checkInterval = setInterval(() => {
      this.checkRules();
    }, 1000);
    
    // Setup performance observers
    this.setupPerformanceObservers();
  }
  
  // Setup performance observers
  private setupPerformanceObservers(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;
    
    // LCP Observer
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          this.recordMetric('lcp', lastEntry.startTime);
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {
      // Observer not supported
    }
    
    // FID Observer
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          const fidEntry = entry as PerformanceEventTiming;
          this.recordMetric('fid', fidEntry.processingStart - fidEntry.startTime);
        });
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
    } catch {
      // Observer not supported
    }
    
    // Long Task Observer
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          this.recordMetric('longTask', entry.duration);
        });
      });
      longTaskObserver.observe({ type: 'longtask', buffered: true });
    } catch {
      // Observer not supported
    }
    
    // Resource timing
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          const resourceEntry = entry as PerformanceResourceTiming;
          if (resourceEntry.initiatorType === 'fetch' || resourceEntry.initiatorType === 'xmlhttprequest') {
            this.recordMetric('apiLatency', resourceEntry.duration);
          }
          if (resourceEntry.transferSize) {
            this.recordMetric('resourceSize', resourceEntry.transferSize / 1024);
          }
        });
      });
      resourceObserver.observe({ type: 'resource', buffered: true });
    } catch {
      // Observer not supported
    }
    
    // Memory monitoring (Chrome only)
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as unknown as { memory: { usedJSHeapSize: number } }).memory;
        if (memory) {
          this.recordMetric('memory', memory.usedJSHeapSize / (1024 * 1024));
        }
      }, 5000);
    }
    
    // FPS monitoring
    let lastTime = performance.now();
    let frameCount = 0;
    
    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        this.recordMetric('fps', frameCount);
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    requestAnimationFrame(measureFPS);
  }
  
  // Record a metric reading
  recordMetric(metric: MetricType, value: number, tags?: Record<string, string>): void {
    const reading: MetricReading = {
      metric,
      value,
      timestamp: new Date(),
      tags,
    };
    
    if (!this.metricsBuffer.has(metric)) {
      this.metricsBuffer.set(metric, []);
    }
    
    const buffer = this.metricsBuffer.get(metric)!;
    buffer.push(reading);
    
    // Keep only last 100 readings per metric
    if (buffer.length > 100) {
      buffer.shift();
    }
    
    // Immediate check for this metric
    this.checkMetricRules(metric, value);
  }
  
  // Check all rules
  private checkRules(): void {
    this.rules.forEach(rule => {
      if (!rule.enabled) return;
      
      const readings = this.metricsBuffer.get(rule.metric) || [];
      if (readings.length === 0) return;
      
      const latestReading = readings[readings.length - 1];
      this.evaluateRule(rule, latestReading.value);
    });
  }
  
  // Check rules for specific metric
  private checkMetricRules(metric: MetricType, value: number): void {
    this.rules.forEach(rule => {
      if (!rule.enabled || rule.metric !== metric) return;
      this.evaluateRule(rule, value);
    });
  }
  
  // Evaluate a rule against a value
  private evaluateRule(rule: AlertRule, value: number): void {
    const conditionMet = this.checkCondition(rule.condition, value, rule.threshold);
    
    if (!conditionMet) return;
    
    // Check cooldown
    const lastAlert = this.lastAlertTime.get(rule.id) || 0;
    if (Date.now() - lastAlert < rule.cooldown) return;
    
    // Check duration requirement
    if (rule.duration > 0) {
      const readings = this.metricsBuffer.get(rule.metric) || [];
      const relevantReadings = readings.filter(
        r => Date.now() - r.timestamp.getTime() <= rule.duration
      );
      
      const allMeetCondition = relevantReadings.every(
        r => this.checkCondition(rule.condition, r.value, rule.threshold)
      );
      
      if (!allMeetCondition || relevantReadings.length === 0) return;
    }
    
    // Create alert
    this.createAlert(rule, value);
  }
  
  // Check condition
  private checkCondition(condition: AlertCondition, value: number, threshold: number): boolean {
    switch (condition) {
      case 'greaterThan':
        return value > threshold;
      case 'lessThan':
        return value < threshold;
      case 'equals':
        return value === threshold;
      case 'greaterThanOrEqual':
        return value >= threshold;
      case 'lessThanOrEqual':
        return value <= threshold;
      default:
        return false;
    }
  }
  
  // Create alert
  private createAlert(rule: AlertRule, value: number): void {
    const alert: Alert = {
      id: generateId(),
      ruleId: rule.id,
      ruleName: rule.name,
      metric: rule.metric,
      value,
      threshold: rule.threshold,
      severity: rule.severity,
      message: this.formatAlertMessage(rule, value),
      timestamp: new Date(),
      acknowledged: false,
      resolved: false,
      metadata: {},
    };
    
    this.alerts.push(alert);
    this.lastAlertTime.set(rule.id, Date.now());
    
    // Notify through channels
    this.notifyChannels(alert, rule.channels);
    
    // Notify listeners
    this.listeners.forEach(listener => listener(alert));
    
    // Save to storage
    this.saveToStorage();
  }
  
  // Format alert message
  private formatAlertMessage(rule: AlertRule, value: number): string {
    const thresholds = DEFAULT_THRESHOLDS[rule.metric];
    const status = value > thresholds.poor ? 'kötü' : value > thresholds.good ? 'orta' : 'iyi';
    
    return `${rule.name}: ${rule.metric} değeri ${value.toFixed(2)} (eşik: ${rule.threshold}, durum: ${status})`;
  }
  
  // Notify through channels
  private notifyChannels(alert: Alert, channels: NotificationChannel[]): void {
    channels.forEach(channel => {
      switch (channel) {
        case 'console':
          this.notifyConsole(alert);
          break;
        case 'toast':
          this.notifyToast(alert);
          break;
        case 'inApp':
          // Handled by listeners
          break;
        case 'webhook':
          this.notifyWebhook(alert);
          break;
      }
    });
  }
  
  // Console notification
  private notifyConsole(alert: Alert): void {
    const styles = {
      info: 'color: #3b82f6',
      warning: 'color: #f59e0b',
      error: 'color: #ef4444',
      critical: 'color: #dc2626; font-weight: bold',
    };
    
    console.log(
      `%c[Performance Alert] ${alert.severity.toUpperCase()}: ${alert.message}`,
      styles[alert.severity]
    );
  }
  
  // Toast notification
  private notifyToast(alert: Alert): void {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(`Performance Alert: ${alert.ruleName}`, {
          body: alert.message,
          icon: '/favicon.ico',
          tag: alert.id,
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
  }
  
  // Webhook notification
  private async notifyWebhook(alert: Alert): Promise<void> {
    if (!this.webhookUrl) return;
    
    try {
      await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'performance_alert',
          alert,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch {
      console.error('[PerformanceAlerts] Webhook notification failed');
    }
  }
  
  // Add alert rule
  addRule(rule: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt'>): AlertRule {
    const newRule: AlertRule = {
      ...rule,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.rules.set(newRule.id, newRule);
    this.saveToStorage();
    
    return newRule;
  }
  
  // Update alert rule
  updateRule(id: string, updates: Partial<AlertRule>): AlertRule | null {
    const rule = this.rules.get(id);
    if (!rule) return null;
    
    const updatedRule: AlertRule = {
      ...rule,
      ...updates,
      id: rule.id,
      createdAt: rule.createdAt,
      updatedAt: new Date(),
    };
    
    this.rules.set(id, updatedRule);
    this.saveToStorage();
    
    return updatedRule;
  }
  
  // Delete alert rule
  deleteRule(id: string): boolean {
    const deleted = this.rules.delete(id);
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }
  
  // Get all rules
  getRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }
  
  // Get rule by ID
  getRule(id: string): AlertRule | undefined {
    return this.rules.get(id);
  }
  
  // Get alerts
  getAlerts(options: {
    limit?: number;
    severity?: AlertSeverity;
    acknowledged?: boolean;
    resolved?: boolean;
    metric?: MetricType;
    since?: Date;
  } = {}): Alert[] {
    let filtered = [...this.alerts];
    
    if (options.severity) {
      filtered = filtered.filter(a => a.severity === options.severity);
    }
    
    if (options.acknowledged !== undefined) {
      filtered = filtered.filter(a => a.acknowledged === options.acknowledged);
    }
    
    if (options.resolved !== undefined) {
      filtered = filtered.filter(a => a.resolved === options.resolved);
    }
    
    if (options.metric) {
      filtered = filtered.filter(a => a.metric === options.metric);
    }
    
    if (options.since) {
      filtered = filtered.filter(a => a.timestamp >= options.since!);
    }
    
    // Sort by timestamp descending
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    if (options.limit) {
      filtered = filtered.slice(0, options.limit);
    }
    
    return filtered;
  }
  
  // Acknowledge alert
  acknowledgeAlert(id: string, acknowledgedBy?: string): boolean {
    const alert = this.alerts.find(a => a.id === id);
    if (!alert) return false;
    
    alert.acknowledged = true;
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = acknowledgedBy;
    
    this.saveToStorage();
    return true;
  }
  
  // Resolve alert
  resolveAlert(id: string): boolean {
    const alert = this.alerts.find(a => a.id === id);
    if (!alert) return false;
    
    alert.resolved = true;
    alert.resolvedAt = new Date();
    
    this.saveToStorage();
    return true;
  }
  
  // Get alert statistics
  getStats(): AlertStats {
    const bySeverity: Record<AlertSeverity, number> = {
      info: 0,
      warning: 0,
      error: 0,
      critical: 0,
    };
    
    const byMetric: Record<string, number> = {};
    let totalResponseTime = 0;
    let acknowledgedCount = 0;
    
    this.alerts.forEach(alert => {
      bySeverity[alert.severity]++;
      byMetric[alert.metric] = (byMetric[alert.metric] || 0) + 1;
      
      if (alert.acknowledged && alert.acknowledgedAt) {
        acknowledgedCount++;
        totalResponseTime += alert.acknowledgedAt.getTime() - alert.timestamp.getTime();
      }
    });
    
    return {
      total: this.alerts.length,
      bySeverity,
      byMetric,
      acknowledged: this.alerts.filter(a => a.acknowledged).length,
      resolved: this.alerts.filter(a => a.resolved).length,
      avgResponseTime: acknowledgedCount > 0 ? totalResponseTime / acknowledgedCount : 0,
    };
  }
  
  // Subscribe to alerts
  subscribe(callback: (alert: Alert) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  
  // Set webhook URL
  setWebhook(url: string): void {
    this.webhookUrl = url;
  }
  
  // Get metric readings
  getMetricReadings(metric: MetricType): MetricReading[] {
    return this.metricsBuffer.get(metric) || [];
  }
  
  // Get default thresholds
  getDefaultThresholds(metric: MetricType): { good: number; poor: number } {
    return DEFAULT_THRESHOLDS[metric];
  }
  
  // Clear alerts
  clearAlerts(options: { before?: Date; resolved?: boolean } = {}): number {
    const initialCount = this.alerts.length;
    
    this.alerts = this.alerts.filter(alert => {
      if (options.before && alert.timestamp >= options.before) return true;
      if (options.resolved !== undefined && alert.resolved !== options.resolved) return true;
      return false;
    });
    
    this.saveToStorage();
    return initialCount - this.alerts.length;
  }
  
  // Cleanup
  destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    this.listeners.clear();
  }
}

// Singleton instance
export const performanceAlerts = new PerformanceAlertsManager();

export default performanceAlerts;
