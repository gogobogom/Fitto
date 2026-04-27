'use client';

/**
 * 🍳 RECIPE SEARCH PAGE
 * 
 * Features:
 * - TheMealDB API integration for recipe search
 * - Turkish language support with smart translation
 * - Secure API calls through validated endpoints
 * - Real-time search with debouncing
 * - Responsive design for mobile and desktop
 * 
 * Security:
 * - All API calls go through validated server routes
 * - Input sanitization handled by validation service
 * - XSS protection enabled
 * - Rate limiting on API endpoints
 * 
 * @version 1.0.0
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import RecipeSearch from '@/components/RecipeSearch';
import { DoodleHeader } from '@/components/DoodleHeader';
import { useSupabase } from '@/hooks/useSupabase';
import { useLanguage } from '@/contexts/LanguageContext';

export default function TariflerPage(): JSX.Element {
  const router = useRouter();
  const { t } = useLanguage();
  const { connection, isConnecting, connectionError } = useSupabase();
  const [userId, setUserId] = useState<string>('guest');

  // Get user ID from Supabase connection
  useEffect(() => {
    if (connection?.userId) {
      setUserId(connection.userId);
    }
  }, [connection]);

  // Handle connection errors
  if (connectionError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-rose-50 p-4 pt-safe">
        <div className="max-w-4xl mx-auto space-y-6">
          <DoodleHeader 
            title={t('recipes.pageTitle')} 
            subtitle={t('recipes.connectionError')} 
            emoji="❌" 
          />
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 mb-4">{t('recipes.connectionFailed')}</p>
            <Button onClick={() => window.location.reload()}>
              {t('recipes.reload')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isConnecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-rose-50 p-4 pt-safe">
        <div className="max-w-4xl mx-auto space-y-6">
          <DoodleHeader 
            title={t('recipes.pageTitle')} 
            subtitle={t('recipes.loading')} 
            emoji="🍳" 
          />
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-rose-50 p-4 pt-safe">
      <div className="max-w-4xl mx-auto space-y-6 pb-24">
        {/* Page Header */}
        <div className="doodle-card bg-gradient-to-br from-orange-500 via-pink-500 to-red-500 rounded-2xl shadow-lg p-6 border-4 border-black relative">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-doodle font-bold text-white drop-shadow-md mb-2">{t('recipes.pageTitle')}</h1>
              <p className="text-sm md:text-base font-doodle-alt text-white/90 drop-shadow">{t('recipes.subtitle')}</p>
            </div>
            <div className="flex-shrink-0 ml-4">
              <img 
                src="https://usdozf7pplhxfvrl.public.blob.vercel-storage.com/a216b650-a107-41cb-ae0d-f7627119739d-s8qqqwEaLVk2OZ28aAxtunYJ6WNeHS" 
                alt="Chef" 
                className="w-16 h-16 object-contain"
              />
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-lg border-2 border-orange-200 p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">{t('recipes.howToUse')}</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>{t('recipes.howToUseStep1')}</li>
                <li>{t('recipes.howToUseStep2')}</li>
                <li>{t('recipes.howToUseStep3')}</li>
                <li>{t('recipes.howToUseStep4')}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Recipe Search Component */}
        <div className="bg-white/90 backdrop-blur-sm rounded-lg border-2 border-orange-200 shadow-lg p-6">
          <RecipeSearch 
            userId={userId} 
            connection={connection}
          />
        </div>

        {/* Security & Privacy Notice */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
          <div className="flex items-start gap-2">
            <span className="text-lg">🔒</span>
            <div className="flex-1">
              <p className="text-xs text-gray-600">
                {t('recipes.securityNote')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
