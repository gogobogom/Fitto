'use client';

import React, { useEffect, useState, useRef } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { cn } from '@/lib/utils';

interface OfflineIndicatorProps {
  className?: string;
  /** Minimum time (ms) to be offline before showing banner. Default: 3000 */
  debounceMs?: number;
  /** Whether to show the indicator at all. Default: true */
  enabled?: boolean;
}

export function OfflineIndicator({ 
  className, 
  debounceMs = 3000,
  enabled = true 
}: OfflineIndicatorProps) {
  const { isOnline, refreshNetworkStatus } = usePWA();
  const [showOffline, setShowOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  
  const offlineTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectedTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (offlineTimerRef.current) clearTimeout(offlineTimerRef.current);
      if (reconnectedTimerRef.current) clearTimeout(reconnectedTimerRef.current);
    };
  }, []);

  // Handle online/offline state changes with debouncing
  useEffect(() => {
    if (!enabled) {
      setShowOffline(false);
      setShowReconnected(false);
      return;
    }

    if (!isOnline) {
      // Clear any existing reconnected message
      if (reconnectedTimerRef.current) {
        clearTimeout(reconnectedTimerRef.current);
        reconnectedTimerRef.current = null;
      }
      setShowReconnected(false);
      
      // Debounce showing offline banner to prevent flickering
      if (!offlineTimerRef.current) {
        offlineTimerRef.current = setTimeout(() => {
          setShowOffline(true);
          setWasOffline(true);
          offlineTimerRef.current = null;
        }, debounceMs);
      }
    } else {
      // Clear offline timer if we come back online quickly
      if (offlineTimerRef.current) {
        clearTimeout(offlineTimerRef.current);
        offlineTimerRef.current = null;
      }
      
      // Hide offline banner
      setShowOffline(false);
      
      // Show reconnected message if we were previously offline
      if (wasOffline) {
        setShowReconnected(true);
        
        // Hide reconnected message after 3 seconds
        if (reconnectedTimerRef.current) {
          clearTimeout(reconnectedTimerRef.current);
        }
        reconnectedTimerRef.current = setTimeout(() => {
          setShowReconnected(false);
          setWasOffline(false);
          reconnectedTimerRef.current = null;
        }, 3000);
      }
    }
  }, [isOnline, wasOffline, debounceMs, enabled]);

  // Don't render anything if disabled
  if (!enabled) return null;

  // Show offline banner
  if (showOffline) {
    return (
      <div
        className={cn(
          'fixed top-0 left-0 right-0 z-[100]',
          'bg-amber-500 text-white py-2 px-4',
          'flex items-center justify-center gap-2',
          'animate-in slide-in-from-top duration-300',
          'safe-area-top',
          className
        )}
        role="alert"
        aria-live="polite"
      >
        <WifiOff className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
        <span className="text-sm font-medium">
          Bağlantı sorunu - Kontrol ediliyor...
        </span>
        <button
          onClick={refreshNetworkStatus}
          className="ml-2 p-1 rounded-full hover:bg-amber-600 transition-colors"
          aria-label="Bağlantıyı yenile"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Show reconnected message briefly
  if (showReconnected) {
    return (
      <div
        className={cn(
          'fixed top-0 left-0 right-0 z-[100]',
          'bg-green-500 text-white py-2 px-4',
          'flex items-center justify-center gap-2',
          'animate-in slide-in-from-top duration-300',
          'safe-area-top',
          className
        )}
        role="status"
        aria-live="polite"
      >
        <Wifi className="w-4 h-4" aria-hidden="true" />
        <span className="text-sm font-medium">
          Bağlantı yeniden kuruldu
        </span>
      </div>
    );
  }

  return null;
}

// Simple offline page component
export function OfflinePage() {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          <WifiOff className="w-12 h-12 text-gray-500 dark:text-gray-400" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Çevrimdışısınız
        </h1>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          İnternet bağlantınızı kontrol edin ve tekrar deneyin. 
          Bazı özellikler çevrimdışı çalışmaya devam edebilir.
        </p>

        {/* Features available offline */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6 text-left">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Çevrimdışı kullanılabilir:
          </h3>
          <ul className="space-y-2">
            {[
              'Kayıtlı yemeklerinizi görüntüleme',
              'Geçmiş verilerinize erişim',
              'Hedef ve profil bilgileri',
            ].map((feature, index) => (
              <li
                key={index}
                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Retry button */}
        <button
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-xl transition-colors duration-200"
        >
          <RefreshCw className="w-5 h-5" />
          Tekrar Dene
        </button>
      </div>
    </div>
  );
}

export default OfflineIndicator;
