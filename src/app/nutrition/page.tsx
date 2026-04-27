'use client';

import { useRouter } from 'next/navigation';
import { useSupabase } from '@/hooks/useSupabase';
import { MealTrackingPage } from '@/components/MealTrackingPage';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

export default function NutritionPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { connected, connection, foodItems, userGoals, dailySummary } = useSupabase();

  const currentDate = new Date().toISOString().split('T')[0];

  if (!connected || !connection) {
    return (
      <div className="h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-red-50 overflow-y-auto">
        <div className="min-h-screen flex items-center justify-center p-4 py-20 md:py-16">
          <Card className="w-full max-w-md shadow-xl">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50">
      {/* Back Button */}
      <div className="fixed top-4 left-4 z-50">
        <Button
          onClick={() => router.push('/')}
          variant="outline"
          size="icon"
          className="bg-white/90 backdrop-blur-sm border-2 border-black shadow-lg hover:bg-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <MealTrackingPage
        connection={connection}
        currentDate={currentDate}
        onBack={() => router.push('/')}
        foodItems={foodItems}
        userGoals={userGoals}
        dailySummary={dailySummary}
      />
    </div>
  );
}
