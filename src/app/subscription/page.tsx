'use client';

/**
 * Subscription page — mounts the existing <SubscriptionManager />.
 *
 * Kept intentionally minimal. Plan UI / pricing / RevenueCat wiring all live
 * inside SubscriptionManager. This page just guards on the Supabase
 * connection so SubscriptionManager always has a valid `connection`.
 */

import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SubscriptionManager } from '@/components/SubscriptionManager';
import { useSupabase } from '@/hooks/useSupabase';
import { useLanguage } from '@/contexts/LanguageContext';

export default function SubscriptionPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { connected, connection } = useSupabase();

  if (!connected || !connection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl" data-testid="subscription-loading">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-orange-600" />
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">{t('connection.connecting')}</h2>
                <p className="text-gray-600">{t('connection.pleaseWait')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50">
      <div className="fixed top-4 left-4 z-50">
        <Button
          data-testid="subscription-back-btn"
          onClick={() => router.push('/')}
          variant="outline"
          size="icon"
          className="bg-white/90 backdrop-blur-sm border-2 border-black shadow-lg hover:bg-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <div className="max-w-3xl mx-auto p-4 pt-20 pb-24">
        <SubscriptionManager connection={connection} />
      </div>
    </div>
  );
}
