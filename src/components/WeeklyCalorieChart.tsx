'use client';

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';
import type { SupabaseConnection } from '@/hooks/useSupabase';
import type { UserGoals, FoodItem } from '@/types/supabase';

interface WeeklyCalorieChartProps {
  connection: SupabaseConnection;
  userGoals: UserGoals | null;
  period: 'week' | 'month';
}

export function WeeklyCalorieChart({ connection, userGoals, period }: WeeklyCalorieChartProps) {
  const { t, language } = useLanguage();
  const [meals, setMeals] = useState<FoodItem[]>([]);
  
  // Load meals from Supabase
  useEffect(() => {
    const loadMeals = async () => {
      try {
        const today = new Date();
        const days = period === 'week' ? 7 : 30;
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - days);
        
        const { data, error } = await connection.supabase
          .from('meals')
          .select('*')
          .eq('user_id', connection.userId)
          .gte('date', startDate.toISOString().split('T')[0])
          .lte('date', today.toISOString().split('T')[0]);
        
        if (error) {
          console.error('Chart data load error:', error);
          return;
        }
        
        setMeals(data || []);
      } catch (error) {
        console.error('Chart data calculation error:', error);
      }
    };
    
    loadMeals();
  }, [connection, period]);
  
  const chartData = useMemo(() => {
    try {
      const today = new Date();
      const days = period === 'week' ? 7 : 30;
      const data: Array<{ date: string; kalori: number; hedef: number }> = [];

      const dayNames = language === 'tr' 
        ? [t('stats.sunday'), t('stats.monday'), t('stats.tuesday'), t('stats.wednesday'), t('stats.thursday'), t('stats.friday'), t('stats.saturday')]
        : [t('stats.sunday'), t('stats.monday'), t('stats.tuesday'), t('stats.wednesday'), t('stats.thursday'), t('stats.friday'), t('stats.saturday')];

      for (let i = days - 1; i >= 0; i--) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        
        const dateStr = checkDate.toISOString().split('T')[0];

        const totalCalories = meals
          .filter((meal) => meal.date === dateStr)
          .reduce((sum, meal) => sum + (meal.calories || 0), 0);

        const dateLabel = period === 'week' 
          ? dayNames[checkDate.getDay()]
          : `${checkDate.getDate()}/${checkDate.getMonth() + 1}`;

        data.push({
          date: dateLabel,
          kalori: Math.round(totalCalories),
          hedef: userGoals?.daily_calorie_target || 2000,
        });
      }

      return data;
    } catch (error) {
      console.error('Chart data calculation error:', error);
      return [];
    }
  }, [meals, userGoals, period, t, language]);

  const averageCalories = useMemo(() => {
    if (chartData.length === 0) return 0;
    const sum = chartData.reduce((acc, day) => acc + day.kalori, 0);
    return Math.round(sum / chartData.length);
  }, [chartData]);

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{t('stats.calorieTracking')}</span>
          <span className="text-sm font-normal text-gray-600">
            {t('stats.average')}: {averageCalories} kcal
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              stroke="#888"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              stroke="#888"
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px'
              }}
              formatter={(value: number) => [`${value} kcal`, '']}
            />
            <Legend 
              wrapperStyle={{ fontSize: '14px', paddingTop: '10px' }}
            />
            <ReferenceLine 
              y={userGoals?.daily_calorie_target || 2000} 
              stroke="#10b981" 
              strokeDasharray="5 5"
              label={{ value: t('stats.target'), position: 'insideTopRight', fontSize: 12, fill: '#10b981' }}
            />
            <Line 
              type="monotone" 
              dataKey="kalori" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
              name={t('meals.calories')}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
