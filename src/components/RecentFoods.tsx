'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Clock } from 'lucide-react';
import { useSupabase } from '@/hooks/useSupabase';
import type { FoodItem, DailyLog } from '@/types/supabase';

interface RecentFoodsProps {
  onSelectFood: (foodId: string) => void;
  selectedFoodId: string | null;
}

interface RecentFoodEntry {
  foodId: string;
  lastUsed: number;
  usageCount: number;
}

export function RecentFoods({ onSelectFood, selectedFoodId }: RecentFoodsProps) {
  const { supabase, user } = useSupabase();
  const [recentEntries, setRecentEntries] = useState<RecentFoodEntry[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);

  // Fetch daily logs
  useEffect(() => {
    if (!user) return;

    const fetchDailyLogs = async (): Promise<void> => {
      const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Son yenenleri alırken hata:', error);
        return;
      }

      setDailyLogs(data || []);
    };

    fetchDailyLogs();
  }, [supabase, user]);

  // Fetch food items
  useEffect(() => {
    if (!user) return;

    const fetchFoodItems = async (): Promise<void> => {
      const { data, error } = await supabase
        .from('food_items')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Yiyecek verileri alınırken hata:', error);
        return;
      }

      setFoodItems(data || []);
    };

    fetchFoodItems();
  }, [supabase, user]);

  // Get recent foods from daily logs
  const recentFoodIds = useMemo(() => {
    const foodUsage = new Map<string, RecentFoodEntry>();
    
    for (const log of dailyLogs) {
      const foodIdStr = log.food_item_id;
      const existing = foodUsage.get(foodIdStr);
      
      if (existing) {
        foodUsage.set(foodIdStr, {
          foodId: foodIdStr,
          lastUsed: Math.max(existing.lastUsed, new Date(log.created_at).getTime()),
          usageCount: existing.usageCount + 1,
        });
      } else {
        foodUsage.set(foodIdStr, {
          foodId: foodIdStr,
          lastUsed: new Date(log.created_at).getTime(),
          usageCount: 1,
        });
      }
    }

    // Sort by last used, then by usage count
    return Array.from(foodUsage.values())
      .sort((a: RecentFoodEntry, b: RecentFoodEntry) => {
        if (b.lastUsed !== a.lastUsed) {
          return b.lastUsed - a.lastUsed;
        }
        return b.usageCount - a.usageCount;
      })
      .slice(0, 5)
      .map((entry: RecentFoodEntry) => entry.foodId);
  }, [dailyLogs]);

  // Get food details
  const recentFoods = useMemo(() => {
    return foodItems.filter((food: FoodItem) => recentFoodIds.includes(food.id));
  }, [foodItems, recentFoodIds]);

  if (recentFoods.length === 0) {
    return null;
  }

  return (
    <Card className="border-2 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5 text-blue-600" />
          Son Yenenler
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {recentFoods.map((food: FoodItem) => (
            <button
              key={food.id}
              onClick={() => onSelectFood(food.id)}
              className={`w-full text-left p-2 rounded hover:bg-blue-100 transition-colors ${
                selectedFoodId === food.id ? 'bg-blue-200' : ''
              }`}
            >
              <div className="font-medium">{food.meal_name}</div>
              <div className="text-sm text-gray-600">
                {food.calories?.toFixed(0) || 0} kcal
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
