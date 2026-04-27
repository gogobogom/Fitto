/**
 * BAKIM MODU TAM EKRAN SAYFASI
 * 
 * Bakım modu aktifken kullanıcıları karşılayan sayfa
 */

'use client';

import { Construction, Clock, Wrench } from 'lucide-react';

interface MaintenancePageProps {
  message?: string;
  estimatedEnd?: string;
  features?: string[];
}

export default function MaintenancePage({
  message = 'Sistemde bakım çalışması yapılıyor',
  estimatedEnd,
  features = []
}: MaintenancePageProps): JSX.Element {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white/10 backdrop-blur-lg rounded-2xl p-12 text-center border border-white/20">
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <Construction className="w-24 h-24 text-yellow-400 animate-bounce" />
            <Wrench className="w-12 h-12 text-yellow-500 absolute -bottom-2 -right-2 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
        </div>

        {/* Message */}
        <h1 className="text-4xl font-bold text-white mb-4">
          🚧 Bakım Çalışması
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          {message}
        </p>

        {/* Estimated End */}
        {estimatedEnd && (
          <div className="flex items-center justify-center gap-3 mb-8 text-gray-300">
            <Clock className="w-5 h-5" />
            <p>Tahmini Bitiş Süresi: <span className="font-semibold text-yellow-400">{estimatedEnd}</span></p>
          </div>
        )}

        {/* Features */}
        {features.length > 0 && (
          <div className="bg-white/5 rounded-lg p-6 mt-8">
            <h3 className="text-lg font-semibold text-white mb-4">
              ✨ Neler Yapılıyor?
            </h3>
            <ul className="space-y-2 text-gray-300">
              {features.map((feature: string, index: number) => (
                <li key={index} className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <p className="text-gray-400 mt-8 text-sm">
          Anlayışınız için teşekkür ederiz. Kısa süre içinde geri döneceğiz! 🙏
        </p>
      </div>
    </div>
  );
}
