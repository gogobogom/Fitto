'use client';

import React, { useEffect } from 'react';
import { InstallPrompt } from './InstallPrompt';
import { OfflineIndicator } from './OfflineIndicator';
import { usePWA } from '@/hooks/usePWA';
import { useResourceOptimization } from '@/hooks/useResourceOptimization';

interface PWAProviderProps {
  children: React.ReactNode;
  showInstallPrompt?: boolean;
  showOfflineIndicator?: boolean;
}

export function PWAProvider({
  children,
  showInstallPrompt = true,
  showOfflineIndicator = true,
}: PWAProviderProps) {
  const { checkForUpdates } = usePWA();
  
  // Initialize resource optimization (prefetch, preconnect, etc.)
  useResourceOptimization();

  // Check for updates on mount and when app becomes visible
  useEffect(() => {
    checkForUpdates();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdates();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkForUpdates]);

  // Register for push notifications if supported
  useEffect(() => {
    const registerPushNotifications = async () => {
      if (typeof window === 'undefined') return;
      if (!('Notification' in window)) return;
      if (!('serviceWorker' in navigator)) return;
      
      // Only ask for permission if not already granted or denied
      if (Notification.permission === 'default') {
        // Don't auto-request - let user initiate
        console.log('Push notifications available but not configured');
      }
    };

    registerPushNotifications();
  }, []);

  return (
    <>
      {/* Offline indicator at top */}
      {showOfflineIndicator && <OfflineIndicator />}

      {/* Main content */}
      {children}

      {/* Install prompt at bottom */}
      {showInstallPrompt && <InstallPrompt />}
    </>
  );
}

export default PWAProvider;
