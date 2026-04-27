'use client';

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';
import type { SupabaseConnection } from '@/hooks/useSupabase';
import type { UserGoals, FoodItem } from '@/types/supabase';

interface MacroDonutChartProps {
  connection: SupabaseConnection;
  userGoals: UserGoals | null;
  period: 'week' | 'month';
}

const COLORS = {
  protein: '#10b981',  // Green
  carbs: '#3b82f6',    // Blue
  fat: '#f59e0b',      // Amber
};

export function MacroDonutChart({ connection, userGoals, period }: MacroDonutChartProps) {
  const { t } = useLanguage();
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
          console.error('Macro data load error:', error);
          return;
        }
        
        setMeals(data || []);
      } catch (error) {
        console.error('Macro data calculation error:', error);
      }
    };
    
    loadMeals();
  }, [connection, period]);
  
  const macroData = useMemo(() => {
    try {
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;

      meals.forEach((meal) => {
        totalProtein += meal.protein || 0;
        totalCarbs += meal.carbs || 0;
        totalFat += meal.fats || 0;
      });

      // Calculate percentages
      const total = totalProtein + totalCarbs + totalFat;
      
      if (total === 0) {
        return [
          { name: t('profile.protein'), value: 33, grams: 0, color: COLORS.protein },
          { name: t('stats.carbs'), value: 33, grams: 0, color: COLORS.carbs },
          { name: t('profile.fat'), value: 34, grams: 0, color: COLORS.fat },
        ];
      }

      return [
        { 
          name: t('profile.protein'), 
          value: Math.round((totalProtein / total) * 100), 
          grams: Math.round(totalProtein),
          color: COLORS.protein 
        },
        { 
          name: t('stats.carbs'), 
          value: Math.round((totalCarbs / total) * 100), 
          grams: Math.round(totalCarbs),
          color: COLORS.carbs 
        },
        { 
          name: t('profile.fat'), 
          value: Math.round((totalFat / total) * 100), 
          grams: Math.round(totalFat),
          color: COLORS.fat 
        },
      ];
    } catch (error) {
      console.error('Macro data calculation error:', error);
      return [
        { name: t('profile.protein'), value: 33, grams: 0, color: COLORS.protein },
        { name: t('stats.carbs'), value: 33, grams: 0, color: COLORS.carbs },
        { name: t('profile.fat'), value: 34, grams: 0, color: COLORS.fat },
      ];
    }
  }, [meals, t]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg border-2 shadow-lg">
          <p className="font-semibold text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">{data.grams}g ({data.value}%)</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle>{t('stats.macroDistribution')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={macroData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
            >
              {macroData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value, entry: any) => {
                const data = macroData.find((d) => d.name === value);
                return `${value}: ${data?.grams || 0}g`;
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Target Comparison */}
        {userGoals && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{t('stats.proteinTarget')}:</span>
              <span className="font-semibold">{Math.round(userGoals.protein_target_g || 0)}g</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{t('stats.carbsTarget')}:</span>
              <span className="font-semibold">{Math.round(userGoals.carbs_target_g || 0)}g</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{t('stats.fatTarget')}:</span>
              <span className="font-semibold">{Math.round(userGoals.fat_target_g || 0)}g</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
