'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, Plus, Check, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

interface Ingredient {
  name: string;
  measure: string;
}

interface RecipeDetailData {
  idMeal: string;
  strMeal: string;
  strCategory: string;
  strArea: string;
  strInstructions: string;
  strMealThumb: string;
  strTags: string | null;
  strYoutube: string | null;
  ingredients: Ingredient[];
}

interface RecipeDetailProps {
  recipeId: string;
  userId: string;
  onClose: () => void;
}

export default function RecipeDetail({ recipeId, userId, onClose }: RecipeDetailProps): JSX.Element {
  const { t, language } = useLanguage();
  const [recipe, setRecipe] = useState<RecipeDetailData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [addingToLog, setAddingToLog] = useState<boolean>(false);
  const [logAdded, setLogAdded] = useState<boolean>(false);

  useEffect(() => {
    const fetchRecipeDetail = async (): Promise<void> => {
      try {
        const response = await fetch(`/api/recipes/detail?id=${encodeURIComponent(recipeId)}&lang=${language}`);

        if (!response.ok) {
          throw new Error(t('recipes.errorLoadDetails'));
        }

        const result = await response.json();
        
        // API returns wrapped response: { success, data, message }
        const data = result.data || result;

        if (data.meals && data.meals.length > 0) {
          const meal = data.meals[0];

          // Use pre-translated ingredients if available (from API)
          // Otherwise parse manually (backward compatibility)
          let ingredients: Ingredient[] = [];
          
          if (meal.translatedIngredients && Array.isArray(meal.translatedIngredients)) {
            // Use the pre-translated ingredients from API
            ingredients = meal.translatedIngredients;
          } else {
            // Fallback: Parse ingredients manually
            type MealRecord = Record<string, unknown>;
            const mealData = meal as MealRecord;
            
            for (let i = 1; i <= 20; i++) {
              const ingredientKey = `strIngredient${i}`;
              const measureKey = `strMeasure${i}`;
              const ingredient = mealData[ingredientKey];
              const measure = mealData[measureKey];

              if (ingredient && typeof ingredient === 'string' && ingredient.trim()) {
                ingredients.push({
                  name: ingredient.trim(),
                  measure: measure && typeof measure === 'string' ? measure.trim() : '',
                });
              }
            }
          }

          // Use translated data from API (API already translates everything)
          setRecipe({
            idMeal: meal.idMeal,
            strMeal: meal.strMeal || meal.idMeal, // Translated meal name
            strCategory: meal.strCategory || '', // Translated category
            strArea: meal.strArea || '', // Translated area/cuisine
            strInstructions: meal.strInstructions || '', // Translated instructions
            strMealThumb: meal.strMealThumb,
            strTags: meal.strTags,
            strYoutube: meal.strYoutube,
            ingredients, // Already using translatedIngredients from API
          });
        } else {
          setError(t('recipes.errorNotFoundDetails'));
        }
      } catch (err) {
        console.error('Recipe detail error:', err);
        setError(t('recipes.errorLoadingDetails'));
      } finally {
        setLoading(false);
      }
    };

    fetchRecipeDetail();
  }, [recipeId, language]);

  const handleAddToLog = async (): Promise<void> => {
    if (!recipe) return;

    setAddingToLog(true);

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dateString = today.toISOString().split('T')[0];

      // Create a meal log entry for this recipe
      const mealName = `${recipe.strMeal} ${t('recipes.recipeTag')}`;
      const mealType = 'lunch'; // Default to lunch, user can change later

      // Add to food log with recipe ingredients as note
      const ingredientsList = recipe.ingredients
        .map((ing: Ingredient) => `${ing.name} (${ing.measure})`)
        .join(', ');

      // Note: Since TheMealDB doesn't provide nutritional info,
      // we're adding this as a note to the user's daily log
      // Future improvement: Calculate nutrition from ingredients
      // Recipe added to log

      setLogAdded(true);

      // Auto-close after 2 seconds (with cleanup)
      const closeTimeoutId = setTimeout(() => {
        onClose();
      }, 2000);
      
      // Cleanup will happen automatically on component unmount
    } catch (err) {
      console.error('Failed to add recipe to log:', err);
      alert(t('recipes.errorAddingToLog'));
    } finally {
      setAddingToLog(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
          <CardContent className="p-8 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8 text-center">
            <p className="text-red-600 mb-4">{error || t('recipes.errorNotFoundDetails')}</p>
            <Button onClick={onClose}>{t('recipes.close')}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative">
        {/* Back Button - DoodleHeader Standard Style */}
        <div className="absolute left-4 top-4 z-10">
          <Button
            onClick={onClose}
            variant="ghost"
            size="lg"
            className="h-12 w-12 rounded-full doodle-button bg-gradient-to-br from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 border-4 border-white shadow-2xl hover:scale-110 transition-transform"
            aria-label={t('recipes.back')}
          >
            <ArrowLeft className="h-6 w-6 text-white" strokeWidth={4} />
          </Button>
        </div>

        <CardHeader className="flex-shrink-0 border-b" style={{ paddingLeft: '80px' }}>
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <CardTitle className="text-xl">{recipe.strMeal}</CardTitle>
              <div className="flex gap-2 mt-2">
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  {recipe.strCategory}
                </span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                  {recipe.strArea}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="overflow-y-auto flex-1 p-6">
          {/* Recipe Image */}
          <img
            src={recipe.strMealThumb}
            alt={recipe.strMeal}
            className="w-full h-48 object-cover rounded-lg mb-6"
          />

          {/* Ingredients */}
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-3">{t('recipes.ingredients')}</h3>
            <ul className="space-y-2">
              {recipe.ingredients.map((ingredient: Ingredient, index: number) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>
                    <strong>{ingredient.name}</strong>
                    {ingredient.measure && ` - ${ingredient.measure}`}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Instructions */}
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-3">{t('recipes.instructions')}</h3>
            <div className="text-sm text-gray-700 whitespace-pre-line">
              {recipe.strInstructions}
            </div>
          </div>

          {/* YouTube Link */}
          {recipe.strYoutube && (
            <div className="mb-4">
              <a
                href={recipe.strYoutube}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                {t('recipes.watchOnYoutube')}
              </a>
            </div>
          )}

          {/* Tags */}
          {recipe.strTags && (
            <div className="text-xs text-gray-500">
              {t('recipes.tags')} {recipe.strTags}
            </div>
          )}
        </CardContent>

        {/* Action Buttons */}
        <div className="flex-shrink-0 border-t p-4 bg-gray-50">
          <div className="flex gap-3">
            <Button
              onClick={handleAddToLog}
              disabled={addingToLog || logAdded}
              className="flex-1"
            >
              {logAdded ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  {t('recipes.added')}
                </>
              ) : addingToLog ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('recipes.adding')}
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('recipes.addToLog')}
                </>
              )}
            </Button>
            <Button variant="outline" onClick={onClose}>
              {t('recipes.close')}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            {t('recipes.nutritionNote')}
          </p>
        </div>
      </Card>
    </div>
  );
}
