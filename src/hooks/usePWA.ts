'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  isUpdateAvailable: boolean;
}

// Check actual network connectivity by pinging our own API
async function checkNetworkConnectivity(): Promise<boolean> {
  try {
    // Try to fetch our health endpoint with a short timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('/api/health', {
      method: 'HEAD',
      cache: 'no-store',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    // If health endpoint fails, try a simple fetch to our own origin
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response.ok || response.status === 304;
    } catch {
      return false;
    }
  }
}

export function usePWA() {
  const [state, setState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isOnline: true, // Start optimistically as online
    isUpdateAvailable: false,
  });

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const checkingRef = useRef(false);
  const lastCheckRef = useRef<number>(0);

  // Debounced network check
  const verifyNetworkStatus = useCallback(async (forceCheck = false) => {
    // Prevent concurrent checks
    if (checkingRef.current) return;
    
    // Rate limit checks to every 2 seconds unless forced
    const now = Date.now();
    if (!forceCheck && now - lastCheckRef.current < 2000) return;
    
    checkingRef.current = true;
    lastCheckRef.current = now;
    
    try {
      // First check navigator.onLine - if it says offline, trust it
      if (!navigator.onLine) {
        setState(prev => ({ ...prev, isOnline: false }));
        return;
      }
      
      // If navigator says online, verify with actual request
      const isActuallyOnline = await checkNetworkConnectivity();
      setState(prev => ({ ...prev, isOnline: isActuallyOnline }));
    } finally {
      checkingRef.current = false;
    }
  }, []);

  // Check if app is installed
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = ('standalone' in window.navigator) && (window.navigator as Navigator & { standalone: boolean }).standalone;
      
      setState(prev => ({
        ...prev,
        isInstalled: isStandalone || isInWebAppiOS || false,
      }));
    };

    checkInstalled();

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = () => checkInstalled();
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // Handle install prompt
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setState(prev => ({ ...prev, isInstallable: true }));
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setState(prev => ({
        ...prev,
        isInstallable: false,
        isInstalled: true,
      }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Handle online/offline status with verification
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initial check on mount
    verifyNetworkStatus(true);

    const handleOnline = () => {
      // When browser says online, verify it
      verifyNetworkStatus(true);
    };

    const handleOffline = () => {
      // When browser says offline, trust it immediately
      setState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic check every 30 seconds when tab is visible
    let intervalId: NodeJS.Timeout | null = null;
    
    const startPeriodicCheck = () => {
      if (intervalId) return;
      intervalId = setInterval(() => {
        if (document.visibilityState === 'visible') {
          verifyNetworkStatus();
        }
      }, 30000);
    };

    const stopPeriodicCheck = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        verifyNetworkStatus(true);
        startPeriodicCheck();
      } else {
        stopPeriodicCheck();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    startPeriodicCheck();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopPeriodicCheck();
    };
  }, [verifyNetworkStatus]);

  // Install prompt handler
  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      console.log('Install prompt not available');
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setState(prev => ({ ...prev, isInstallable: false }));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Install prompt error:', error);
      return false;
    }
  }, [deferredPrompt]);

  // Check for service worker updates
  const checkForUpdates = useCallback(async () => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
      }
    } catch (error) {
      console.error('Update check failed:', error);
    }
  }, []);

  // Manual refresh network status
  const refreshNetworkStatus = useCallback(() => {
    verifyNetworkStatus(true);
  }, [verifyNetworkStatus]);

  return {
    ...state,
    promptInstall,
    checkForUpdates,
    refreshNetworkStatus,
    deferredPrompt: !!deferredPrompt,
  };
}

export default usePWA;
