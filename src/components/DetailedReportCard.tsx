'use client';

import { useMemo, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { TrendingUp, TrendingDown, Target, Calendar } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSupabase } from '@/hooks/useSupabase';
import type { Database } from '@/types/supabase';

type UserGoal = Database['public']['Tables']['user_goals']['Row'];

interface DetailedReportCardProps {
  userGoals: UserGoal | null;
  period: 'week' | 'month';
}

interface NutrientTrend {
  nutrientKey: string;
  current: number;
  target: number;
  trend: 'up' | 'down' | 'stable';
  percentage: number;
}

export function DetailedReportCard({ userGoals, period }: DetailedReportCardProps) {
  const { t } = useLanguage();
  const { supabase } = useSupabase();
  const daysToAnalyze = period === 'week' ? 7 : 30;

  const [nutritionAnalysis, setNutritionAnalysis] = useState({
    avgCalories: 0,
    avgProtein: 0,
    avgCarbs: 0,
    avgFat: 0,
    daysWithData: 0,
  });

  useEffect(() => {
    if (!supabase) return;

    const fetchNutritionData = async (): Promise<void> => {
      try {
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - daysToAnalyze);

        // Fetch daily logs for the period
        const { data: dailyLogs, error } = await supabase
          .from('daily_logs')
          .select('*')
          .gte('date', startDate.toISOString().split('T')[0])
          .lte('date', today.toISOString().split('T')[0]);

        if (error) {
          console.error('Error fetching daily logs:', error);
          return;
        }

        // Calculate daily totals
        const dailyData: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {};

        // Initialize days
        for (let i = 0; i < daysToAnalyze; i++) {
          const checkDate = new Date(today);
          checkDate.setDate(today.getDate() - i);
          const dateKey = checkDate.toISOString().split('T')[0];
          dailyData[dateKey] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
        }

        // Aggregate data from logs
        if (dailyLogs) {
          for (const log of dailyLogs) {
            const dateKey = log.date;
            if (dateKey in dailyData) {
              dailyData[dateKey].calories += log.calories || 0;
              dailyData[dateKey].protein += log.protein || 0;
              dailyData[dateKey].carbs += log.carbs || 0;
              dailyData[dateKey].fat += log.fat || 0;
            }
          }
        }

        // Calculate averages
        let totalCalories = 0;
        let totalProtein = 0;
        let totalCarbs = 0;
        let totalFat = 0;
        let daysWithData = 0;

        Object.values(dailyData).forEach((day) => {
          if (day.calories > 0) {
            daysWithData++;
            totalCalories += day.calories;
            totalProtein += day.protein;
            totalCarbs += day.carbs;
            totalFat += day.fat;
          }
        });

        const avgCalories = daysWithData > 0 ? totalCalories / daysWithData : 0;
        const avgProtein = daysWithData > 0 ? totalProtein / daysWithData : 0;
        const avgCarbs = daysWithData > 0 ? totalCarbs / daysWithData : 0;
        const avgFat = daysWithData > 0 ? totalFat / daysWithData : 0;

        setNutritionAnalysis({
          avgCalories: Math.round(avgCalories),
          avgProtein: Math.round(avgProtein),
          avgCarbs: Math.round(avgCarbs),
          avgFat: Math.round(avgFat),
          daysWithData,
        });
      } catch (error) {
        console.error('Nutrition analysis error:', error);
      }
    };

    fetchNutritionData();

    // Set up real-time subscription
    const channel = supabase
      .channel('detailed-report-logs')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_logs',
        },
        () => {
          fetchNutritionData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, daysToAnalyze]);

  const nutrientTrends = useMemo((): NutrientTrend[] => {
    if (!userGoals) return [];

    const trends: NutrientTrend[] = [
      {
        nutrientKey: 'stats.calorie',
        current: nutritionAnalysis.avgCalories,
        target: userGoals.daily_calorie_target || 0,
        trend: 'stable',
        percentage: 0,
      },
      {
        nutrientKey: 'profile.protein',
        current: nutritionAnalysis.avgProtein,
        target: userGoals.daily_protein_target || 0,
        trend: 'stable',
        percentage: 0,
      },
      {
        nutrientKey: 'stats.carbs',
        current: nutritionAnalysis.avgCarbs,
        target: userGoals.daily_carbs_target || 0,
        trend: 'stable',
        percentage: 0,
      },
      {
        nutrientKey: 'profile.fat',
        current: nutritionAnalysis.avgFat,
        target: userGoals.daily_fat_target || 0,
        trend: 'stable',
        percentage: 0,
      },
    ];

    trends.forEach((trend) => {
      if (trend.target > 0) {
        trend.percentage = Math.round((trend.current / trend.target) * 100);
        if (trend.percentage > 105) {
          trend.trend = 'up';
        } else if (trend.percentage < 95) {
          trend.trend = 'down';
        } else {
          trend.trend = 'stable';
        }
      }
    });

    return trends;
  }, [nutritionAnalysis, userGoals]);

  const getStatusColor = (percentage: number): string => {
    if (percentage >= 95 && percentage <= 105) return 'text-green-600';
    if (percentage >= 85 && percentage <= 115) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (percentage: number): React.ReactNode => {
    if (percentage >= 95 && percentage <= 105) {
      return <Badge className="bg-green-100 text-green-700 border-green-300">{t('stats.onTarget')}</Badge>;
    }
    if (percentage >= 85 && percentage <= 115) {
      return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">{t('stats.close')}</Badge>;
    }
    if (percentage > 115) {
      return <Badge className="bg-red-100 text-red-700 border-red-300">{t('stats.high')}</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-700 border-blue-300">{t('stats.low')}</Badge>;
  };

  const periodText = period === 'week' ? t('stats.last7Days') : t('stats.last30Days');

  return (
    <Card className="border-2 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5 text-blue-600" />
          {t('stats.detailedReport')} - {periodText}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Summary Stats */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('stats.daysWithData')}</p>
              <p className="text-2xl font-bold text-gray-900">{nutritionAnalysis.daysWithData}</p>
            </div>
            <Target className="h-12 w-12 text-purple-600" />
          </div>
        </div>

        {/* Nutrient Trends */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            {t('stats.nutrientTrends')}
          </h3>

          {nutrientTrends.map((trend) => (
            <div key={trend.nutrientKey} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{t(trend.nutrientKey)}</span>
                  {trend.trend === 'up' && <TrendingUp className="h-4 w-4 text-red-500" />}
                  {trend.trend === 'down' && <TrendingDown className="h-4 w-4 text-blue-500" />}
                </div>
                {getStatusBadge(trend.percentage)}
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Progress value={Math.min(trend.percentage, 100)} className="h-3" />
                </div>
                <span className={`text-sm font-semibold ${getStatusColor(trend.percentage)}`}>
                  {trend.percentage}%
                </span>
              </div>

              <div className="flex justify-between text-xs text-gray-600">
                <span>{t('stats.average')}: {trend.current}g</span>
                <span>{t('stats.target')}: {trend.target}g</span>
              </div>
            </div>
          ))}
        </div>

        {/* Recommendations */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2">
          <h4 className="font-semibold text-gray-900 mb-2">{t('stats.recommendations')}</h4>
          <ul className="space-y-1 text-sm text-gray-700">
            {nutrientTrends.map((trend) => {
              if (trend.percentage > 115) {
                return (
                  <li key={trend.nutrientKey}>
                    • {t(trend.nutrientKey)} {t('stats.tryReducing')}
                  </li>
                );
              }
              if (trend.percentage < 85) {
                return (
                  <li key={trend.nutrientKey}>
                    • {t(trend.nutrientKey)} {t('stats.tryIncreasing')}
                  </li>
                );
              }
              return null;
            })}
            {nutrientTrends.every((t) => t.percentage >= 95 && t.percentage <= 105) && (
              <li>{t('stats.allOnTarget')}</li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
