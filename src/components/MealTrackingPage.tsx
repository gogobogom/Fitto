'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Plus, ChevronDown, ChevronUp, Flame } from 'lucide-react';
import { DoodleImage } from './DoodleImage';
import { AddMealDialog } from './AddMealDialog';
import { MealListItem } from './MealListItem';
import { useLanguage } from '@/contexts/LanguageContext';
import type { FoodItem, UserGoals, DailySummary } from '@/types/supabase';
import type { SupabaseConnection } from '@/hooks/useSupabase';

interface MealTrackingPageProps {
  connection: SupabaseConnection;
  currentDate: string;
  onBack: () => void;
  foodItems: ReadonlyMap<string, FoodItem>;
  userGoals?: UserGoals | null;
  dailySummary?: DailySummary | null;
}

type MealTypeKey = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export function MealTrackingPage({ connection, currentDate, onBack, foodItems, userGoals, dailySummary }: MealTrackingPageProps) {
  const { t } = useLanguage();
  const [selectedMealType, setSelectedMealType] = useState<string | null>(null);
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);

  const mealConfigs: Record<MealTypeKey, {
    type: string;
    label: string;
    character: 'breakfastCup' | 'lunchSun' | 'dinnerMoon' | 'snackCookie';
    color: string;
    bgColor: string;
    borderColor: string;
  }> = {
    breakfast: {
      type: 'breakfast',
      label: t('meals.breakfast'),
      character: 'breakfastCup',
      color: 'from-amber-400 to-orange-500',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-300',
    },
    lunch: {
      type: 'lunch',
      label: t('meals.lunch'),
      character: 'lunchSun',
      color: 'from-orange-400 to-red-500',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-300',
    },
    dinner: {
      type: 'dinner',
      label: t('meals.dinner'),
      character: 'dinnerMoon',
      color: 'from-blue-400 to-indigo-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-300',
    },
    snack: {
      type: 'snack',
      label: t('meals.snack'),
      character: 'snackCookie',
      color: 'from-purple-400 to-pink-500',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-300',
    },
  };

  // Calculate consumed calories from meals table (LIVE calculation)
  const consumedCalories = useMemo((): number => {
    let total = 0;
    for (const food of foodItems.values()) {
      // Only count meals for today
      if (food.date === currentDate) {
        total += food.calories || 0;
      }
    }
    return total;
  }, [foodItems, currentDate]);

  const targetCalories = userGoals?.daily_calorie_target || 2000;
  const calorieProgress = Math.min((consumedCalories / targetCalories) * 100, 100);

  // Get meals for today grouped by meal type
  const getMealsForType = (mealType: string): FoodItem[] => {
    const meals: FoodItem[] = [];
    for (const food of foodItems.values()) {
      // Check if meal is for today and matches meal type
      // Cast food to any to access meal_type property that exists in database but not in FoodItem type
      const mealData = food as FoodItem & { meal_type?: string };
      if (food.date === currentDate && mealData.meal_type === mealType) {
        meals.push(food);
      }
    }
    return meals;
  };

  // Calculate calories for a meal type
  const getCaloriesForMealType = (mealType: string): number => {
    const meals = getMealsForType(mealType);
    return meals.reduce((total: number, meal: FoodItem) => total + (meal.calories || 0), 0);
  };

  const getMotivationMessage = (): string => {
    if (consumedCalories === 0) return t('meals.motivationStart');
    if (consumedCalories < targetCalories * 0.5) return t('meals.motivationGood');
    if (consumedCalories < targetCalories) return t('meals.motivationClose');
    return t('meals.motivationComplete');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50 pb-40">
      {/* Header */}
      <div className="p-4 pb-0">
        <div className="doodle-card bg-gradient-to-br from-orange-500 via-pink-500 to-red-500 rounded-2xl shadow-lg p-6 border-4 border-black">
          <h1 className="text-2xl md:text-3xl font-doodle font-bold text-white drop-shadow-md mb-2">{t('meals.title')}</h1>
          <p className="text-sm md:text-base font-doodle-alt text-white/90 drop-shadow">{t('meals.description')}</p>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Daily Calorie Goal */}
        <Card className="doodle-card overflow-hidden border-4 border-black">
          <div className="bg-gradient-to-r from-orange-500 via-pink-500 to-red-500 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 rounded-full p-3 backdrop-blur">
                  <Flame className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-black font-doodle">{t('meals.dailyCalorie')}</h2>
                  <p className="text-white/90 text-sm font-doodle-alt">{t('meals.yourGoal')}</p>
                </div>
              </div>
              <DoodleImage character="utensils" alt="Utensils" size="lg" className="opacity-80" />
            </div>

            <div className="space-y-3">
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-5xl font-black font-doodle drop-shadow-md">
                    {Math.round(consumedCalories)}
                  </div>
                  <div className="text-white/90 font-doodle-alt">/ {targetCalories} kcal</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {targetCalories - Math.round(consumedCalories)} kcal
                  </div>
                  <div className="text-white/90 text-sm">{t('meals.remaining')}</div>
                </div>
              </div>

              <div className="relative h-4 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-white rounded-full transition-all duration-500"
                  style={{ width: `${calorieProgress}%` }}
                />
              </div>

              <div className="text-center text-white/90 text-sm font-doodle-alt">
                {calorieProgress >= 100
                  ? t('meals.goalReached')
                  : `%${Math.round(calorieProgress)} ${t('meals.completed')}`}
              </div>
            </div>
          </div>
        </Card>

        {/* Meals */}
        <div className="space-y-4">
          <h3 className="text-xl font-black font-doodle text-gray-900 flex items-center gap-2">
            <DoodleImage character="fullPlate" alt="Plate" size="md" />
            {t('meals.dailyMeals')}
          </h3>

          {(Object.keys(mealConfigs) as MealTypeKey[]).map((mealKey: MealTypeKey) => {
            const config = mealConfigs[mealKey];
            const meals = getMealsForType(config.type);
            const calories = getCaloriesForMealType(config.type);
            const isExpanded = expandedMeal === mealKey;

            return (
              <Card
                key={mealKey}
                className={`doodle-card hover:shadow-xl transition-all ${config.bgColor} border-4 ${config.borderColor}`}
              >
                <CardContent className="p-5">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => {
                      if (meals.length > 0) {
                        setExpandedMeal(isExpanded ? null : mealKey);
                      } else {
                        setSelectedMealType(mealKey);
                      }
                    }}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`doodle-border bg-white p-3 wiggle`}>
                        <DoodleImage
                          character={config.character}
                          alt={config.label}
                          size="lg"
                        />
                      </div>
                      <div>
                        <h4 className="text-xl font-black font-doodle text-gray-900">
                          {config.label}
                        </h4>
                        <div className="text-sm font-doodle-alt text-gray-600">
                          {calories > 0 ? (
                            <>
                              <span className="font-bold text-green-600">{calories} kcal</span>
                              {meals.length > 0 && <span className="ml-1">({meals.length} {t('meals.foods')})</span>}
                            </>
                          ) : (
                            t('meals.notAdded')
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {meals.length > 0 && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="doodle-button border-gray-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedMeal(isExpanded ? null : mealKey);
                          }}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="doodle-button border-gray-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMealType(mealKey);
                        }}
                      >
                        <Plus className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>

                  {isExpanded && meals.length > 0 && (
                    <div
                      className="mt-4 space-y-2 pt-4"
                      style={{ borderTop: '2px dashed #000' }}
                    >
                      {meals.map((meal: FoodItem) => (
                        <MealListItem
                          key={meal.id}
                          mealLog={meal}
                          foodItem={meal}
                          connection={connection}
                          currentDate={currentDate}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Motivation Message */}
        <Card className="doodle-card bg-gradient-to-r from-green-50 to-emerald-50 border-4 border-green-300">
          <CardContent className="p-6 text-center">
            <DoodleImage character="fruitBowl" alt="Fruit Bowl" size="xl" className="mx-auto mb-4 bounce-soft" />
            <h3 className="text-lg font-black font-doodle text-gray-900 mb-2">
              {getMotivationMessage()}
            </h3>
            <p className="text-sm text-gray-600 font-doodle-alt">
              {t('meals.balancedDiet')}
            </p>
          </CardContent>
        </Card>
      </div>

      {selectedMealType && (
        <AddMealDialog
          connection={connection}
          currentDate={currentDate}
          onClose={() => setSelectedMealType(null)}
          foodItems={foodItems}
          mealType={selectedMealType}
        />
      )}
    </div>
  );
}
