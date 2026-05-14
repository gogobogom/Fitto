'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Home, RefreshCcw, RotateCcw } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to console for debugging. We deliberately log the digest
    // and full Error object so it shows up in Sentry / browser devtools
    // — never swallow it silently.
    console.error('[error.tsx] Application Error:', error, { digest: error?.digest });
  }, [error]);

  const handleGoHome = () => {
    // Plain client-side navigation back to the safe shell.
    window.location.href = '/';
  };

  // Hard reload that bypasses the bfcache, busts a stale chunk, and
  // unregisters any service workers so a corrupted PWA install can't
  // keep crashing the preview. Used when `reset()` doesn't help.
  const handleHardReload = async () => {
    try {
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      if (typeof caches !== 'undefined' && caches?.keys) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch (err) {
      console.error('[error.tsx] hard reload cleanup failed:', err);
    } finally {
      window.location.reload();
    }
  };

  return (
    <div
      data-testid="global-error-boundary"
      className="h-screen bg-gradient-to-br from-red-50 via-orange-50 to-pink-50 overflow-y-auto"
    >
      <div className="min-h-screen flex items-center justify-center p-4 py-20">
        <Card className="w-full max-w-md shadow-xl border-2 border-red-200">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-red-900">
              Bir Şeyler Yanlış Gitti 😔
            </CardTitle>
            <CardDescription className="text-base">
              Üzgünüz, beklenmeyen bir hata oluştu. Endişelenmeyin, verileriniz güvende!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Error details: full message in dev, digest+message preview always.
                Keeping the digest visible in production lets users share a
                trace ID without exposing internal stack traces. */}
            {process.env.NODE_ENV === 'development' && error?.message && (
              <div
                data-testid="error-dev-message"
                className="p-3 bg-red-50 border border-red-200 rounded-md"
              >
                <p className="text-xs font-mono text-red-700 break-words">{error.message}</p>
              </div>
            )}
            {error?.digest && (
              <p
                data-testid="error-digest"
                className="text-xs text-red-500 text-center font-mono"
              >
                Error ID: {error.digest}
              </p>
            )}

            {/* Recovery actions (most → least surgical) */}
            <div className="space-y-3">
              <Button
                data-testid="error-retry-btn"
                onClick={reset}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Tekrar Dene
              </Button>

              <Button
                data-testid="error-hard-reload-btn"
                onClick={handleHardReload}
                variant="outline"
                className="w-full"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Önbelleği Temizle &amp; Yenile
              </Button>

              <Button
                data-testid="error-home-btn"
                onClick={handleGoHome}
                variant="ghost"
                className="w-full"
              >
                <Home className="mr-2 h-4 w-4" />
                Ana Sayfaya Dön
              </Button>
            </div>

            {/* Help text */}
            <div className="text-center text-sm text-gray-600 pt-2">
              <p>Sorun devam ederse:</p>
              <ul className="mt-2 space-y-1 text-left list-disc list-inside">
                <li>Sayfayı yenilemeyi deneyin</li>
                <li>Tarayıcı önbelleğini temizleyin</li>
                <li>Farklı bir tarayıcı deneyin</li>
                <li>Internet bağlantınızı kontrol edin</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
