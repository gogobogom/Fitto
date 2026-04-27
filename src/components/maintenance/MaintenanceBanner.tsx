/**
 * BAKIM MODU BANNER COMPONENT
 * 
 * Bakım modu aktifken kullanıcılara gösterilen uyarı banner'ı
 */

'use client';

import { AlertTriangle } from 'lucide-react';

interface MaintenanceBannerProps {
  message?: string;
  estimatedEnd?: string;
}

export default function MaintenanceBanner({ 
  message = 'Sistemde bakım çalışması yapılıyor',
  estimatedEnd 
}: MaintenanceBannerProps): JSX.Element {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-black py-3 px-4 shadow-lg">
      <div className="container mx-auto flex items-center justify-center gap-3">
        <AlertTriangle className="w-5 h-5" />
        <div className="text-center">
          <p className="font-semibold">{message}</p>
          {estimatedEnd && (
            <p className="text-sm">Tahmini Bitiş: {estimatedEnd}</p>
          )}
        </div>
        <AlertTriangle className="w-5 h-5" />
      </div>
    </div>
  );
}
