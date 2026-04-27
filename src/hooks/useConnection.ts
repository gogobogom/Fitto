'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface ConnectionStatus {
  isOnline: boolean;
  lastChecked: Date | null;
  rtt: number | null; // Round trip time in ms
}

export function useConnection(): ConnectionStatus {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [rtt, setRtt] = useState<number | null>(null);
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);

  const checkConnection = useCallback(async (): Promise<void> => {
    const startTime = performance.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const endTime = performance.now();
      const roundTripTime = Math.round(endTime - startTime);

      if (isMountedRef.current) {
        setIsOnline(response.ok);
        setRtt(roundTripTime);
        setLastChecked(new Date());
      }
    } catch (error: unknown) {
      if (isMountedRef.current) {
        setIsOnline(false);
        setRtt(null);
        setLastChecked(new Date());
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    // Initial check
    checkConnection();

    // Online/offline event listeners
    const handleOnline = (): void => {
      if (isMountedRef.current) {
        setIsOnline(true);
        checkConnection();
      }
    };

    const handleOffline = (): void => {
      if (isMountedRef.current) {
        setIsOnline(false);
        setRtt(null);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic check every 30 seconds
    const intervalId = setInterval(() => {
      if (isMountedRef.current) {
        checkConnection();
      }
    }, 30000);

    // Cleanup
    return () => {
      isMountedRef.current = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [checkConnection]);

  return {
    isOnline,
    lastChecked,
    rtt
  };
}
