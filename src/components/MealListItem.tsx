'use client';

import { X } from 'lucide-react';
import { Button } from './ui/button';
import type { FoodItem } from '@/types/supabase';
import type { SupabaseConnection } from '@/hooks/useSupabase';

interface MealListItemProps {
  mealLog: FoodItem;
  foodItem: FoodItem | null;
  connection: SupabaseConnection;
  currentDate: string;
}

export function MealListItem({ mealLog, foodItem, connection, currentDate }: MealListItemProps) {
  if (!foodItem) return null;

  const handleDelete = async (): Promise<void> => {
    try {
      const { error } = await connection.supabase
        .from('meals')
        .delete()
        .eq('id', mealLog.id);

      if (error) {
        console.error('Error deleting meal:', error);
        alert('Yemek silinirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Yemek silinirken hata:', error);
      alert('Yemek silinirken bir hata oluştu.');
    }
  };

  const calories = Math.round(foodItem.calories || 0);
  const protein = Math.round(foodItem.protein || 0);
  const carbs = Math.round(foodItem.carbs || 0);
  const fat = Math.round(foodItem.fats || 0);

  return (
    <div className="flex items-start justify-between py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm text-gray-900 truncate">{foodItem.meal_name}</p>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
          <span className="font-medium text-green-600">{calories} kcal</span>
          <span>P: {protein}g</span>
          <span>K: {carbs}g</span>
          <span>Y: {fat}g</span>
        </div>
      </div>
      <Button
        onClick={handleDelete}
        size="icon"
        variant="ghost"
        className="h-7 w-7 flex-shrink-0 ml-2 text-red-500 hover:text-red-700 hover:bg-red-50"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
