'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { WeeklyCalorieChart } from './WeeklyCalorieChart';
import { MacroDonutChart } from './MacroDonutChart';
import { WeightProgressChart } from './WeightProgressChart';
import { AchievementBadges } from './AchievementBadges';
import { DetailedReportCard } from './DetailedReportCard';
import { Calendar, TrendingUp, Award, BarChart3 } from 'lucide-react';
interface StatsPageProps {
  userId: string;
}

export function StatsPage({ userId }: StatsPageProps) {
  const { t } = useLanguage();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');

  // TODO: Implement with Supabase
  const calculateStreak = 0;

  // TODO: Implement with Supabase
  const totalMealsLogged = 0;

  // TODO: Implement with Supabase
  const totalExercises = 0;

  // TODO: Implement with Supabase
  const averageDailyCalories = 0;

  return (
    <div className="space-y-6 pb-40">
      {/* Header */}
      <div className="doodle-card bg-gradient-to-br from-orange-500 via-pink-500 to-red-500 rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl md:text-3xl font-doodle font-bold text-white drop-shadow-md">{t('stats.title')}</h1>
          <img 
            src="https://usdozf7pplhxfvrl.public.blob.vercel-storage.com/86857801-8cff-4e58-be6d-2161a1cf559c-RJ8ctzI1m97qoXXUTeP9LoLttbOzh3" 
            alt="İstatistik" 
            className="w-16 h-16 md:w-20 md:h-20 object-contain"
          />
        </div>
        <p className="text-sm md:text-base font-doodle-alt text-white/90 drop-shadow">{t('stats.description')}</p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="doodle-card bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-doodle font-bold text-blue-600">{calculateStreak}</div>
              <div className="text-sm md:text-base font-doodle-alt text-gray-600 mt-1 flex items-center justify-center gap-1">
                <Calendar className="h-4 w-4" />
                {t('stats.consecutiveDays')}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="doodle-card bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-doodle font-bold text-purple-600">{totalMealsLogged}</div>
              <div className="text-sm md:text-base font-doodle-alt text-gray-600 mt-1 flex items-center justify-center gap-1">
                <BarChart3 className="h-4 w-4" />
                {t('stats.mealLogs')}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="doodle-card bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-doodle font-bold text-green-600">{averageDailyCalories}</div>
              <div className="text-sm md:text-base font-doodle-alt text-gray-600 mt-1 flex items-center justify-center gap-1">
                <TrendingUp className="h-4 w-4" />
                {t('stats.avgCalories')}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="doodle-card bg-gradient-to-br from-orange-50 to-amber-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-doodle font-bold text-orange-600">{totalExercises}</div>
              <div className="text-sm md:text-base font-doodle-alt text-gray-600 mt-1 flex items-center justify-center gap-1">
                <Award className="h-4 w-4" />
                {t('stats.exercises')}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievement Badges */}
      <AchievementBadges 
        streak={calculateStreak}
        totalMeals={totalMealsLogged}
        totalExercises={totalExercises}
      />

      {/* Weight Progress */}
      <WeightProgressChart userId={userId} />
    </div>
  );
}
