'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  initWebVitals,
  getPerformanceSummary,
  getStoredVitals,
  clearStoredVitals,
  startMark,
  endMark,
  getConnectionInfo,
  getDeviceMemory,
  type WebVitalsMetric,
} from '@/lib/webVitals';

/**
 * Hook for Web Vitals monitoring
 */
export function useWebVitals() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [summary, setSummary] = useState<Record<string, { avg: number; rating: string; count: number }>>({});
  
  useEffect(() => {
    initWebVitals().then(() => {
      setIsInitialized(true);
    });
  }, []);
  
  const refreshSummary = useCallback(() => {
    setSummary(getPerformanceSummary());
  }, []);
  
  useEffect(() => {
    if (isInitialized) {
      refreshSummary();
      
      // Refresh summary every 5 seconds
      const interval = setInterval(refreshSummary, 5000);
      return () => clearInterval(interval);
    }
  }, [isInitialized, refreshSummary]);
  
  const clearMetrics = useCallback(() => {
    clearStoredVitals();
    setSummary({});
  }, []);
  
  return {
    isInitialized,
    summary,
    refreshSummary,
    clearMetrics,
    getStoredVitals,
  };
}

/**
 * Hook for measuring component render performance
 */
export function useRenderPerformance(componentName: string) {
  useEffect(() => {
    startMark(`render-${componentName}`);
    
    return () => {
      const duration = endMark(`render-${componentName}`);
      
      if (duration && duration > 16.67) { // More than one frame (60fps)
        console.warn(`[Performance] Slow render detected: ${componentName} took ${duration.toFixed(2)}ms`);
      }
    };
  }, [componentName]);
}

/**
 * Hook for tracking async operation performance
 */
export function useAsyncPerformance() {
  const trackAsync = useCallback(async <T>(
    operationName: string,
    asyncFn: () => Promise<T>,
    warnThreshold: number = 1000
  ): Promise<T> => {
    startMark(operationName);
    
    try {
      const result = await asyncFn();
      const duration = endMark(operationName);
      
      if (duration && duration > warnThreshold) {
        console.warn(`[Performance] Slow operation: ${operationName} took ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      endMark(operationName);
      throw error;
    }
  }, []);
  
  return { trackAsync };
}

/**
 * Hook for monitoring network quality
 */
export function useNetworkQuality() {
  const [networkInfo, setNetworkInfo] = useState<{
    type?: string;
    downlink?: number;
    rtt?: number;
    isSlowConnection: boolean;
  }>({ isSlowConnection: false });
  
  useEffect(() => {
    const updateNetworkInfo = () => {
      const info = getConnectionInfo();
      const isSlowConnection = 
        info.type === 'slow-2g' || 
        info.type === '2g' || 
        (info.rtt !== undefined && info.rtt > 500) ||
        (info.downlink !== undefined && info.downlink < 1);
      
      setNetworkInfo({
        ...info,
        isSlowConnection,
      });
    };
    
    updateNetworkInfo();
    
    // Listen for connection changes
    const connection = (navigator as Navigator & { 
      connection?: EventTarget 
    }).connection;
    
    if (connection) {
      connection.addEventListener('change', updateNetworkInfo);
      return () => connection.removeEventListener('change', updateNetworkInfo);
    }
  }, []);
  
  return networkInfo;
}

/**
 * Hook for device capability detection
 */
export function useDeviceCapabilities() {
  const [capabilities, setCapabilities] = useState<{
    memory?: number;
    cores?: number;
    isLowEndDevice: boolean;
  }>({ isLowEndDevice: false });
  
  useEffect(() => {
    const memory = getDeviceMemory();
    const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : undefined;
    
    const isLowEndDevice = 
      (memory !== undefined && memory < 4) ||
      (cores !== undefined && cores < 4);
    
    setCapabilities({
      memory,
      cores,
      isLowEndDevice,
    });
  }, []);
  
  return capabilities;
}

/**
 * Hook for performance-aware feature flags
 */
export function usePerformanceFeatures() {
  const networkQuality = useNetworkQuality();
  const deviceCapabilities = useDeviceCapabilities();
  
  return {
    // Disable heavy animations on slow connections or low-end devices
    enableAnimations: !networkQuality.isSlowConnection && !deviceCapabilities.isLowEndDevice,
    
    // Use lower quality images on slow connections
    useHighQualityImages: !networkQuality.isSlowConnection,
    
    // Reduce data fetching frequency on slow connections
    fetchInterval: networkQuality.isSlowConnection ? 60000 : 30000, // 60s vs 30s
    
    // Enable/disable real-time features
    enableRealtime: !networkQuality.isSlowConnection,
    
    // Prefetch next pages
    enablePrefetch: !networkQuality.isSlowConnection && !deviceCapabilities.isLowEndDevice,
  };
}

/**
 * Get all stored Web Vitals metrics
 */
export function useStoredVitals(): WebVitalsMetric[] {
  const [vitals, setVitals] = useState<WebVitalsMetric[]>([]);
  
  useEffect(() => {
    setVitals(getStoredVitals());
    
    // Update every 5 seconds
    const interval = setInterval(() => {
      setVitals(getStoredVitals());
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  return vitals;
}
