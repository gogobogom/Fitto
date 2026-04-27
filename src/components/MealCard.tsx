'use client';

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Plus, Coffee, Sun, Moon, Cookie, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './ui/button';
import { MealListItem } from './MealListItem';
import type { SupabaseConnection } from '@/hooks/useSupabase';
import type { FoodItem } from '@/types/supabase';

interface MealCardProps {
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  connection: SupabaseConnection;
  currentDate: string;
  onClick: () => void;
}

const mealConfig = {
  breakfast: {
    icon: Coffee,
    label: 'Kahvaltı',
    emoji: '☕',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-500',
  },
  lunch: {
    icon: Sun,
    label: 'Öğle Yemeği',
    emoji: '🍽️',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-500',
  },
  dinner: {
    icon: Moon,
    label: 'Akşam Yemeği',
    emoji: '🌙',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-500',
  },
  snack: {
    icon: Cookie,
    label: 'Atıştırmalık',
    emoji: '🍪',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-500',
  },
};

export function MealCard({ mealType, connection, currentDate, onClick }: MealCardProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [mealLogs, setMealLogs] = useState<FoodItem[]>([]);
  const config = mealConfig[mealType];
  const Icon = config.icon;

  // Load meal logs from Supabase
  useEffect(() => {
    const loadMeals = async () => {
      try {
        const { data, error } = await connection.supabase
          .from('meals')
          .select('*')
          .eq('user_id', connection.userId)
          .eq('date', currentDate)
          .eq('meal_type', mealType);
        
        if (error) {
          console.error('Meal logs load error:', error);
          return;
        }
        
        setMealLogs(data || []);
      } catch (error) {
        console.error('Öğün kayıtları alınırken hata:', error);
      }
    };
    
    loadMeals();
    
    // Subscribe to real-time changes
    const channel = connection.supabase
      .channel(`meal_${mealType}_${currentDate}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meals',
          filter: `user_id=eq.${connection.userId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const meal = payload.new as FoodItem;
            if (meal.date === currentDate && meal.meal_type === mealType) {
              loadMeals();
            }
          } else if (payload.eventType === 'DELETE') {
            loadMeals();
          }
        }
      )
      .subscribe();
    
    return () => {
      connection.supabase.removeChannel(channel);
    };
  }, [connection, currentDate, mealType]);

  const totalCalories = useMemo(() => {
    return mealLogs.reduce((total, log) => total + (log.calories || 0), 0);
  }, [mealLogs]);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't expand if clicking the add button
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    if (mealLogs.length > 0) {
      setIsExpanded(!isExpanded);
    } else {
      onClick();
    }
  };

  return (
    <Card className={`doodle-card hover:shadow-lg transition-all ${config.bgColor}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between cursor-pointer" onClick={handleCardClick}>
          <div className="flex items-center gap-3">
            <div className={`doodle-border ${config.bgColor} ${config.borderColor} p-3 wiggle`}>
              <Icon className={`h-6 w-6 ${config.color}`} />
            </div>
            <div>
              <div className="font-semibold text-gray-900 font-doodle text-lg">
                {config.label} {config.emoji}
              </div>
              <div className="text-sm text-gray-600 font-doodle-alt">
                {totalCalories > 0 ? (
                  <>
                    <span className="font-medium text-green-600">{Math.round(totalCalories)} kcal</span>
                    {mealLogs.length > 0 && <span className="ml-1">({mealLogs.length} yemek)</span>}
                  </>
                ) : (
                  'Henüz eklenmedi'
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {mealLogs.length > 0 && (
              <Button
                size="icon"
                variant="ghost"
                className="doodle-button border-gray-600"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
              >
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-gray-600" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-600" />
                )}
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="doodle-button border-gray-600"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              <Plus className="h-5 w-5 text-gray-600" />
            </Button>
          </div>
        </div>

        {isExpanded && mealLogs.length > 0 && (
          <div className="mt-3 space-y-2 pt-3"
               style={{
                 borderTop: '2px dashed #000'
               }}>
            {mealLogs.map((log) => (
              <MealListItem
                key={log.id}
                mealLog={log}
                foodItem={log}
                connection={connection}
                currentDate={currentDate}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
