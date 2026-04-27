'use client';

import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWA } from '@/hooks/usePWA';
import { cn } from '@/lib/utils';

interface InstallPromptProps {
  className?: string;
}

export function InstallPrompt({ className }: InstallPromptProps) {
  const { isInstallable, isInstalled, promptInstall } = usePWA();
  const [dismissed, setDismissed] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Check if user has dismissed the prompt before
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissedAt = localStorage.getItem('pwa-install-dismissed');
      if (dismissedAt) {
        const dismissedTime = parseInt(dismissedAt, 10);
        // Show again after 7 days
        if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
          setDismissed(true);
        }
      }
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  const handleInstall = async () => {
    setIsInstalling(true);
    const success = await promptInstall();
    setIsInstalling(false);
    
    if (success) {
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setDismissed(true);
      }, 2000);
    }
  };

  // Don't show if already installed, not installable, or dismissed
  if (isInstalled || !isInstallable || dismissed) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed bottom-20 left-4 right-4 z-50',
        'animate-in slide-in-from-bottom-5 duration-300',
        className
      )}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Success State */}
        {showSuccess ? (
          <div className="p-6 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
              <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Yüklendi!
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Fitto ana ekranınıza eklendi
            </p>
          </div>
        ) : (
          <>
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Kapat"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            {/* Content */}
            <div className="p-5 pr-12">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg">
                  <Smartphone className="w-7 h-7 text-white" />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Fitto&apos;yu Yükle
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Ana ekranınıza ekleyin, daha hızlı erişin ve çevrimdışı kullanın
                  </p>
                </div>
              </div>

              {/* Features */}
              <div className="flex flex-wrap gap-2 mt-4">
                {['Hızlı Erişim', 'Çevrimdışı', 'Bildirimler'].map((feature) => (
                  <span
                    key={feature}
                    className="px-2.5 py-1 text-xs font-medium bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-full"
                  >
                    {feature}
                  </span>
                ))}
              </div>

              {/* Install button */}
              <Button
                onClick={handleInstall}
                disabled={isInstalling}
                className="w-full mt-4 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-medium py-3 rounded-xl transition-all duration-200 shadow-lg shadow-teal-500/25"
              >
                {isInstalling ? (
                  <>
                    <Download className="w-5 h-5 mr-2 animate-bounce" />
                    Yükleniyor...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-2" />
                    Şimdi Yükle
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default InstallPrompt;
