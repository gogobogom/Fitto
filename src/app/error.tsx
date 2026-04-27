'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Home, RefreshCcw } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to console for debugging
    console.error('Application Error:', error);
  }, [error]);

  const handleGoHome = () => {
    // Clear any corrupted state
    if (typeof window !== 'undefined') {
      // Don't clear 'fitto_welcomed' - user shouldn't see welcome again
      // localStorage.removeItem('fitto_welcomed');
    }
    window.location.href = '/';
  };

  return (
    <div className="h-screen bg-gradient-to-br from-red-50 via-orange-50 to-pink-50 overflow-y-auto">
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
            {/* Error details (only in development) */}
            {process.env.NODE_ENV === 'development' && error.message && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-xs font-mono text-red-700 break-words">
                  {error.message}
                </p>
                {error.digest && (
                  <p className="text-xs text-red-500 mt-2">
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-3">
              <Button
                onClick={reset}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Tekrar Dene
              </Button>
              
              <Button
                onClick={handleGoHome}
                variant="outline"
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
