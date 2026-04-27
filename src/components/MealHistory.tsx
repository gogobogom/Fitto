'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar, Trash2 } from 'lucide-react';
import type { SupabaseConnection } from '@/hooks/useSupabase';
import type { FoodItem } from '@/types/supabase';
import { useLanguage } from '../contexts/LanguageContext';

interface MealHistoryProps {
  connection: SupabaseConnection | null;   // ✅ null olabilir
  currentDate: string;
}

export function MealHistory({ connection, currentDate }: MealHistoryProps) {
  const [mealLogs, setMealLogs] = useState<FoodItem[]>([]);
  const { t } = useLanguage();

  const supabase = connection?.supabase;
  const userId = connection?.userId;

  useEffect(() => {
    if (!supabase || !userId || !currentDate) return; // ✅ hazır değilse çık

    let channel: ReturnType<typeof supabase.channel> | null = null;

    const loadMeals = async () => {
      try {
        const { data, error } = await supabase
          .from('meals')
          .select('*')
          .eq('user_id', userId)
          .eq('date', currentDate)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching meal history:', error);
          return;
        }
        setMealLogs(data || []);
      } catch (err) {
        console.error('Error fetching meal history:', err);
      }
    };

    loadMeals();

    channel = supabase
      .channel(`meal_history_${currentDate}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meals', filter: `user_id=eq.${userId}` },
        () => loadMeals()
      )
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [supabase, userId, currentDate]);

  // ... render kısmın aynı kalabilir
  // (istersen connection yokken bir skeleton göster)
  if (!supabase || !userId) {
    return (
      <Card className="border-2">
        <CardContent className="py-12 text-center">
          <p className="text-gray-600">{t('more.connectionPreparing') ?? 'Bağlantı hazırlanıyor...'}</p>
        </CardContent>
      </Card>
    );
  }

  // ✅ kalan UI aynı
  // ...
}
