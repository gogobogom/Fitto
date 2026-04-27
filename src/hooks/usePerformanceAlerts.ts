'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import performanceAlerts, {
  type Alert,
  type AlertRule,
  type AlertSeverity,
  type MetricType,
  type AlertStats,
  type MetricReading,
} from '@/lib/performanceAlerts';

// Main hook for performance alerts
export function usePerformanceAlerts(): {
  alerts: Alert[];
  unacknowledgedCount: number;
  criticalCount: number;
  acknowledge: (alertId: string) => void;
  resolve: (alertId: string) => void;
  clearAlerts: (options?: { before?: Date; resolved?: boolean }) => number;
} {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    // Load initial alerts
    setAlerts(performanceAlerts.getAlerts({ limit: 50 }));

    // Subscribe to new alerts
    const unsubscribe = performanceAlerts.subscribe((alert) => {
      setAlerts((prev) => [alert, ...prev].slice(0, 50));
    });

    // Refresh alerts periodically
    const interval = setInterval(() => {
      setAlerts(performanceAlerts.getAlerts({ limit: 50 }));
    }, 10000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const unacknowledgedCount = useMemo(
    () => alerts.filter((a) => !a.acknowledged).length,
    [alerts]
  );

  const criticalCount = useMemo(
    () => alerts.filter((a) => a.severity === 'critical' && !a.resolved).length,
    [alerts]
  );

  const acknowledge = useCallback((alertId: string) => {
    performanceAlerts.acknowledgeAlert(alertId);
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId ? { ...a, acknowledged: true, acknowledgedAt: new Date() } : a
      )
    );
  }, []);

  const resolve = useCallback((alertId: string) => {
    performanceAlerts.resolveAlert(alertId);
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId ? { ...a, resolved: true, resolvedAt: new Date() } : a
      )
    );
  }, []);

  const clearAlerts = useCallback(
    (options?: { before?: Date; resolved?: boolean }) => {
      const count = performanceAlerts.clearAlerts(options);
      setAlerts(performanceAlerts.getAlerts({ limit: 50 }));
      return count;
    },
    []
  );

  return {
    alerts,
    unacknowledgedCount,
    criticalCount,
    acknowledge,
    resolve,
    clearAlerts,
  };
}

// Hook for alert rules management
export function useAlertRules(): {
  rules: AlertRule[];
  addRule: (rule: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt'>) => AlertRule;
  updateRule: (id: string, updates: Partial<AlertRule>) => AlertRule | null;
  deleteRule: (id: string) => boolean;
  toggleRule: (id: string) => void;
} {
  const [rules, setRules] = useState<AlertRule[]>([]);

  useEffect(() => {
    setRules(performanceAlerts.getRules());
  }, []);

  const addRule = useCallback(
    (rule: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt'>) => {
      const newRule = performanceAlerts.addRule(rule);
      setRules(performanceAlerts.getRules());
      return newRule;
    },
    []
  );

  const updateRule = useCallback((id: string, updates: Partial<AlertRule>) => {
    const updated = performanceAlerts.updateRule(id, updates);
    if (updated) {
      setRules(performanceAlerts.getRules());
    }
    return updated;
  }, []);

  const deleteRule = useCallback((id: string) => {
    const deleted = performanceAlerts.deleteRule(id);
    if (deleted) {
      setRules(performanceAlerts.getRules());
    }
    return deleted;
  }, []);

  const toggleRule = useCallback((id: string) => {
    const rule = performanceAlerts.getRule(id);
    if (rule) {
      performanceAlerts.updateRule(id, { enabled: !rule.enabled });
      setRules(performanceAlerts.getRules());
    }
  }, []);

  return {
    rules,
    addRule,
    updateRule,
    deleteRule,
    toggleRule,
  };
}

// Hook for alert statistics
export function useAlertStats(): {
  stats: AlertStats;
  refresh: () => void;
} {
  const [stats, setStats] = useState<AlertStats>({
    total: 0,
    bySeverity: { info: 0, warning: 0, error: 0, critical: 0 },
    byMetric: {},
    acknowledged: 0,
    resolved: 0,
    avgResponseTime: 0,
  });

  const refresh = useCallback(() => {
    setStats(performanceAlerts.getStats());
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { stats, refresh };
}

// Hook for metric monitoring
export function useMetricMonitor(metric: MetricType): {
  readings: MetricReading[];
  current: number | null;
  average: number | null;
  max: number | null;
  min: number | null;
  trend: 'up' | 'down' | 'stable';
  thresholds: { good: number; poor: number };
  status: 'good' | 'needs-improvement' | 'poor';
  recordMetric: (value: number) => void;
} {
  const [readings, setReadings] = useState<MetricReading[]>([]);

  useEffect(() => {
    // Load initial readings
    setReadings(performanceAlerts.getMetricReadings(metric));

    // Refresh periodically
    const interval = setInterval(() => {
      setReadings(performanceAlerts.getMetricReadings(metric));
    }, 1000);

    return () => clearInterval(interval);
  }, [metric]);

  const current = readings.length > 0 ? readings[readings.length - 1].value : null;

  const average = useMemo(() => {
    if (readings.length === 0) return null;
    return readings.reduce((sum, r) => sum + r.value, 0) / readings.length;
  }, [readings]);

  const max = useMemo(() => {
    if (readings.length === 0) return null;
    return Math.max(...readings.map((r) => r.value));
  }, [readings]);

  const min = useMemo(() => {
    if (readings.length === 0) return null;
    return Math.min(...readings.map((r) => r.value));
  }, [readings]);

  const trend = useMemo(() => {
    if (readings.length < 5) return 'stable';

    const recent = readings.slice(-5);
    const older = readings.slice(-10, -5);

    if (older.length === 0) return 'stable';

    const recentAvg = recent.reduce((sum, r) => sum + r.value, 0) / recent.length;
    const olderAvg = older.reduce((sum, r) => sum + r.value, 0) / older.length;

    const diff = ((recentAvg - olderAvg) / olderAvg) * 100;

    if (diff > 10) return 'up';
    if (diff < -10) return 'down';
    return 'stable';
  }, [readings]);

  const thresholds = performanceAlerts.getDefaultThresholds(metric);

  const status = useMemo(() => {
    if (current === null) return 'good';
    if (current <= thresholds.good) return 'good';
    if (current <= thresholds.poor) return 'needs-improvement';
    return 'poor';
  }, [current, thresholds]);

  const recordMetric = useCallback(
    (value: number) => {
      performanceAlerts.recordMetric(metric, value);
    },
    [metric]
  );

  return {
    readings,
    current,
    average,
    max,
    min,
    trend,
    thresholds,
    status,
    recordMetric,
  };
}

// Hook for alert notifications
export function useAlertNotifications(options: {
  severity?: AlertSeverity[];
  playSound?: boolean;
  showToast?: boolean;
} = {}): {
  latestAlert: Alert | null;
  notificationPermission: NotificationPermission | null;
  requestPermission: () => Promise<void>;
} {
  const { severity = ['warning', 'error', 'critical'], playSound = false, showToast = true } = options;

  const [latestAlert, setLatestAlert] = useState<Alert | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }

    const unsubscribe = performanceAlerts.subscribe((alert) => {
      if (!severity.includes(alert.severity)) return;

      setLatestAlert(alert);

      if (showToast && typeof window !== 'undefined') {
        // Dispatch custom event for toast system
        window.dispatchEvent(
          new CustomEvent('performance-alert', {
            detail: alert,
          })
        );
      }

      if (playSound && typeof window !== 'undefined') {
        // Play alert sound
        const audio = new Audio('/sounds/alert.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => {
          // Ignore autoplay errors
        });
      }
    });

    return unsubscribe;
  }, [severity, playSound, showToast]);

  const requestPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    const result = await Notification.requestPermission();
    setPermission(result);
  }, []);

  return {
    latestAlert,
    notificationPermission: permission,
    requestPermission,
  };
}

// Hook for custom metric tracking
export function useCustomMetric(
  metricName: string,
  options: {
    autoRecord?: boolean;
    interval?: number;
    getValue?: () => number;
  } = {}
): {
  value: number | null;
  record: (value: number) => void;
  history: number[];
} {
  const { autoRecord = false, interval = 5000, getValue } = options;

  const [value, setValue] = useState<number | null>(null);
  const [history, setHistory] = useState<number[]>([]);

  const record = useCallback(
    (val: number) => {
      setValue(val);
      setHistory((prev) => [...prev.slice(-99), val]);
      performanceAlerts.recordMetric('custom', val, { metric: metricName });
    },
    [metricName]
  );

  useEffect(() => {
    if (!autoRecord || !getValue) return;

    const tick = () => {
      const val = getValue();
      record(val);
    };

    tick();
    const timer = setInterval(tick, interval);

    return () => clearInterval(timer);
  }, [autoRecord, interval, getValue, record]);

  return { value, record, history };
}

export default usePerformanceAlerts;
