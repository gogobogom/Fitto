'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Star, Plus, Trash2, Search } from 'lucide-react';
import { useSupabase } from '@/hooks/useSupabase';
import type { FoodItem, FavoriteFood, MealType } from '@/types/supabase';
import { useLanguage } from '@/contexts/LanguageContext';

interface FavoriteFoodsProps {
  foods?: FoodItem[];
  onSelectFood?: (foodId: string) => void;
  selectedFoodId?: string | null;
  onAddMeal?: (foodId: string, mealType: MealType) => void;
}

// FavoriteToggle component for use in AddMealDialog
interface FavoriteToggleProps {
  foodId: string;
  className?: string;
}

export function FavoriteToggle({ foodId, className = '' }: FavoriteToggleProps) {
  const { supabase, user } = useSupabase();
  const [isFavorite, setIsFavorite] = useState<boolean>(false);

  // Check if food is in favorites on mount
  useEffect(() => {
    if (!user) return;

    const checkFavorite = async (): Promise<void> => {
      const { data, error } = await supabase
        .from('favorite_foods')
        .select('*')
        .eq('identity', user.id)
        .eq('food_item_id', foodId)
        .single();

      if (!error && data) {
        setIsFavorite(true);
      }
    };

    checkFavorite();
  }, [supabase, user, foodId]);

  const handleToggle = async (e: React.MouseEvent): Promise<void> => {
    e.stopPropagation();
    
    if (!user) return;

    // Find the food item
    const { data: food, error: foodError } = await supabase
      .from('food_items')
      .select('*')
      .eq('id', foodId)
      .single();

    if (foodError || !food) return;

    if (isFavorite) {
      // Remove from favorites
      const { error } = await supabase
        .from('favorite_foods')
        .delete()
        .eq('identity', user.id)
        .eq('food_item_id', foodId);

      if (!error) {
        setIsFavorite(false);
      }
    } else {
      // Add to favorites
      const { error } = await supabase
        .from('favorite_foods')
        .insert({
          identity: user.id,
          food_item_id: foodId,
          food_name: food.meal_name,
          calories: food.calories || 0,
          protein: food.protein || 0,
          carbs: food.carbs || 0,
          fats: food.fats || 0,
          serving_size: '1 portion',
        });

      if (!error) {
        setIsFavorite(true);
      }
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={className}
    >
      {isFavorite ? '⭐' : '☆'}
    </button>
  );
}

export function FavoriteFoods({ foods, onSelectFood, selectedFoodId, onAddMeal }: FavoriteFoodsProps) {
  const { t } = useLanguage();
  const { supabase, user } = useSupabase();
  const [favorites, setFavorites] = useState<FavoriteFood[]>([]);
  const [allFoods, setAllFoods] = useState<FoodItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showSearch, setShowSearch] = useState<boolean>(false);

  // Fetch favorites
  useEffect(() => {
    if (!user) return;

    const fetchFavorites = async (): Promise<void> => {
      const { data, error } = await supabase
        .from('favorite_foods')
        .select('*')
        .eq('identity', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Favoriler alınırken hata:', error);
        return;
      }

      setFavorites(data || []);
    };

    fetchFavorites();

    // Subscribe to changes
    const channel = supabase
      .channel('favorite_foods_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'favorite_foods',
        filter: `identity=eq.${user.id}`,
      }, () => {
        fetchFavorites();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, user]);

  // Fetch all foods
  useEffect(() => {
    if (!user) return;

    const fetchFoods = async (): Promise<void> => {
      const foodList: FoodItem[] = foods || [];
      
      if (!foods) {
        const { data, error } = await supabase
          .from('food_items')
          .select('*')
          .eq('user_id', user.id);

        if (!error && data) {
          foodList.push(...data);
        }
      }
      
      setAllFoods(foodList);
    };

    fetchFoods();
  }, [supabase, user, foods]);

  const handleAddToFavorites = async (food: FoodItem): Promise<void> => {
    if (!user) return;

    const isAlreadyFavorite: boolean = favorites.some(
      (fav: FavoriteFood) => fav.food_item_id === food.id
    );

    if (isAlreadyFavorite) {
      alert(t('favorites.alreadyInFavorites'));
      return;
    }

    const { error } = await supabase
      .from('favorite_foods')
      .insert({
        identity: user.id,
        food_item_id: food.id,
        food_name: food.meal_name,
        calories: food.calories || 0,
        protein: food.protein || 0,
        carbs: food.carbs || 0,
        fats: food.fats || 0,
        serving_size: '1 portion',
      });

    if (error) {
      console.error('Favorilere eklenirken hata:', error);
    }
  };

  const handleRemoveFromFavorites = async (foodId: string): Promise<void> => {
    if (!user) return;

    if (window.confirm(t('favorites.confirmRemove'))) {
      const { error } = await supabase
        .from('favorite_foods')
        .delete()
        .eq('identity', user.id)
        .eq('food_item_id', foodId);

      if (error) {
        console.error('Favorilerden silinirken hata:', error);
      }
    }
  };

  const handleQuickAdd = (favorite: FavoriteFood): void => {
    const food: FoodItem | undefined = allFoods.find((f: FoodItem) => f.id === favorite.food_item_id);
    
    if (food && onAddMeal) {
      onAddMeal(favorite.food_item_id, 'snack');
    } else {
      alert(t('favorites.foodNotAvailable'));
    }
  };

  const filteredFoods: FoodItem[] = allFoods.filter((food: FoodItem) => {
    const searchLower: string = searchTerm.toLowerCase();
    return food.meal_name.toLowerCase().includes(searchLower);
  });

  // If used in AddMealDialog with onSelectFood, show minimal version
  if (onSelectFood) {
    return (
      <div className="space-y-2">
        {favorites.length > 0 && (
          <div className="border rounded-md p-2 bg-yellow-50">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium">{t('favorites.favorites')}</span>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {favorites.slice(0, 5).map((fav: FavoriteFood) => (
                <div
                  key={fav.food_item_id}
                  className={`flex items-center gap-2 p-2 rounded hover:bg-yellow-100 cursor-pointer ${
                    selectedFoodId === fav.food_item_id ? 'bg-yellow-200' : ''
                  }`}
                  onClick={() => onSelectFood(fav.food_item_id)}
                >
                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{fav.food_name}</div>
                    <div className="text-xs text-gray-600">
                      {fav.calories.toFixed(0)} kcal / {fav.serving_size}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full page version
  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <Button
          onClick={() => setShowSearch(!showSearch)}
          className="bg-yellow-600 hover:bg-yellow-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('favorites.newFavorite')}
        </Button>
      </div>

      {showSearch && (
        <Card className="border-2 shadow-lg">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder={t('favorites.searchFood')}
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {filteredFoods.slice(0, 10).map((food: FoodItem) => (
                  <div
                    key={food.id}
                    className="flex items-center justify-between p-3 border-2 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{food.meal_name}</p>
                      <p className="text-sm text-gray-600">
                        {food.calories?.toFixed(0) || 0} kcal
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAddToFavorites(food)}
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setShowSearch(false);
                  setSearchTerm('');
                }}
                className="w-full"
              >
                {t('common.close')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {favorites.map((favorite: FavoriteFood) => (
          <Card key={favorite.food_item_id} className="border-2">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    <h3 className="text-lg font-bold">{favorite.food_name}</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <p className="text-xs text-gray-600">{t('common.calories')}</p>
                      <p className="text-lg font-bold text-orange-600">
                        {favorite.calories.toFixed(0)} kcal
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">{t('common.protein')}</p>
                      <p className="text-lg font-bold">{favorite.protein.toFixed(1)}g</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">{t('common.carbs')}</p>
                      <p className="text-lg font-bold">{favorite.carbs.toFixed(1)}g</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">{t('common.fat')}</p>
                      <p className="text-lg font-bold">{favorite.fats.toFixed(1)}g</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    {t('common.serving')}: {favorite.serving_size}
                  </p>
                </div>
                <div className="flex gap-2">
                  {onAddMeal && (
                    <Button
                      size="sm"
                      onClick={() => handleQuickAdd(favorite)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      {t('common.add')}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFromFavorites(favorite.food_item_id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {favorites.length === 0 && (
        <Card className="border-2 border-dashed">
          <CardContent className="p-12 text-center">
            <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {t('favorites.noFavoritesYet')}
            </h3>
            <p className="text-gray-600 mb-4">
              {t('favorites.addFavoritesDescription')}
            </p>
            <Button
              onClick={() => setShowSearch(true)}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('favorites.addFirstFavorite')}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
