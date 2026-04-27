'use client';

import { useRouter } from 'next/navigation';
import { useSupabase } from '@/hooks/useSupabase';
import { WaterTracking } from '@/components/WaterTracking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, Droplets, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { DoodleImage } from '@/components/DoodleImage';
import { useState, useEffect } from 'react';

export default function HydrationPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { connected } = useSupabase();
  const [weeklyWater, setWeeklyWater] = useState<number[]>([]);

  // Load weekly water data
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const days: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const waterKey = `water_${dateStr}`;
      
      try {
        const savedWater = localStorage.getItem(waterKey);
        days.push(savedWater ? parseInt(savedWater, 10) : 0);
      } catch {
        days.push(0);
      }
    }
    setWeeklyWater(days);
  }, []);

  if (!connected) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 overflow-y-auto">
        <div className="min-h-screen flex items-center justify-center p-4 py-20 md:py-16">
          <Card className="w-full max-w-md shadow-xl">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
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

  const totalWeeklyGlasses = weeklyWater.reduce((sum, glasses) => sum + glasses, 0);
  const avgDailyGlasses = totalWeeklyGlasses / 7;
  const goalGlasses = 8;
  const weeklyGoal = goalGlasses * 7;
  const weeklyProgress = Math.min((totalWeeklyGlasses / weeklyGoal) * 100, 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 pb-24">
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

      <div className="p-4 space-y-6 pt-20">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 p-6 rounded-2xl relative overflow-hidden shadow-lg border-4 border-black">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white drop-shadow-md font-doodle">
                {t('water.title')}
              </h1>
              <p className="text-white/90 font-doodle-alt drop-shadow mt-1">
                {t('water.tip')}
              </p>
            </div>
            <DoodleImage character="waterDrop" alt="Water Drop" size="xl" className="opacity-80" />
          </div>
        </div>

        {/* Weekly Stats */}
        <Card className="border-4 border-black bg-gradient-to-br from-cyan-50 to-blue-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              {t('water.weeklyProgress') || 'Weekly Progress'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Weekly Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border-2 border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Droplets className="h-4 w-4 text-blue-600" />
                  <span className="text-xs text-gray-600 font-medium">
                    {t('water.totalWeekly') || 'Total This Week'}
                  </span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {totalWeeklyGlasses}
                </div>
                <div className="text-xs text-gray-500">
                  / {weeklyGoal} {t('water.glasses') || 'glasses'}
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border-2 border-cyan-200">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-cyan-600" />
                  <span className="text-xs text-gray-600 font-medium">
                    {t('water.dailyAverage') || 'Daily Average'}
                  </span>
                </div>
                <div className="text-2xl font-bold text-cyan-600">
                  {avgDailyGlasses.toFixed(1)}
                </div>
                <div className="text-xs text-gray-500">
                  / {goalGlasses} {t('water.glasses') || 'glasses'}
                </div>
              </div>
            </div>

            {/* Weekly Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {t('water.weeklyGoal') || 'Weekly Goal Progress'}
                </span>
                <span className="font-semibold text-blue-600">
                  {Math.round(weeklyProgress)}%
                </span>
              </div>
              <div className="h-3 bg-white rounded-full overflow-hidden border-2 border-gray-200">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
                  style={{ width: `${weeklyProgress}%` }}
                />
              </div>
            </div>

            {/* Daily Breakdown */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                {t('water.last7Days') || 'Last 7 Days'}
              </h4>
              {weeklyWater.map((glasses, index) => {
                const date = new Date();
                date.setDate(date.getDate() - (6 - index));
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                const progress = (glasses / goalGlasses) * 100;

                return (
                  <div key={index} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-600 w-12">
                      {dayName}
                    </span>
                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                      <div
                        className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 transition-all duration-500 flex items-center justify-end pr-2"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      >
                        {glasses > 0 && (
                          <span className="text-xs font-bold text-white drop-shadow">
                            {glasses}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 w-12 text-right">
                      {Math.round(progress)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Today's Water Tracking */}
        <WaterTracking />

        {/* Tips Card */}
        <Card className="border-4 border-black bg-gradient-to-r from-green-50 to-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <DoodleImage character="waterDrop" alt="Water" size="lg" className="flex-shrink-0" />
              <div>
                <h3 className="font-bold text-gray-900 mb-2">
                  {t('water.healthTipsTitle') || 'Hydration Tips'}
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• {t('water.tip1') || 'Start your day with a glass of water'}</li>
                  <li>• {t('water.tip2') || 'Drink before you feel thirsty'}</li>
                  <li>• {t('water.tip3') || 'Keep a water bottle with you'}</li>
                  <li>• {t('water.tip4') || 'Drink more during exercise'}</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
