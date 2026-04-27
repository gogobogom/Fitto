'use client';

/**
 * 🍳 AI RECIPE GENERATOR COMPONENT
 * 
 * Generate personalized recipes based on preferences and available ingredients
 */

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, ChefHat, Clock, Users, Flame } from 'lucide-react';
import { toast } from 'sonner';

interface GeneratedRecipe {
  name: string;
  description: string;
  ingredients: Array<{
    item: string;
    amount: string;
  }>;
  instructions: string[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  prepTime: number;
  cookTime: number;
  servings: number;
}

interface AIRecipeGeneratorProps {
  userId: string;
}

export default function AIRecipeGenerator({ userId }: AIRecipeGeneratorProps) {
  const { language } = useLanguage();
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [recipe, setRecipe] = useState<GeneratedRecipe | null>(null);
  
  // Form state
  const [ingredients, setIngredients] = useState<string>('');
  const [mealType, setMealType] = useState<string>('');
  const [calorieTarget, setCalorieTarget] = useState<string>('');
  const [cuisine, setCuisine] = useState<string>('');

  const labels = {
    tr: {
      title: '🍳 AI Tarif Üretici',
      subtitle: 'Kişiselleştirilmiş tarifler oluştur',
      ingredients: 'Malzemeler',
      ingredientsPlaceholder: 'Tavuk, pirinç, brokoli',
      mealType: 'Öğün Tipi',
      selectMeal: 'Seçiniz',
      breakfast: 'Kahvaltı',
      lunch: 'Öğle',
      dinner: 'Akşam',
      snack: 'Atıştırmalık',
      calories: 'Hedef Kalori',
      caloriesPlaceholder: 'Örn: 500',
      cuisine: 'Mutfak',
      cuisinePlaceholder: 'Türk, İtalyan, Meksika',
      generate: 'Tarif Oluştur',
      generating: 'Oluşturuluyor...',
      tryAnother: 'Başka Tarif',
      prepTime: 'Hazırlık',
      cookTime: 'Pişirme',
      servings: 'Porsiyon',
      ingredientsList: 'Malzemeler',
      instructions: 'Hazırlanışı',
      nutrition: 'Besin Değerleri',
      min: 'dk',
    },
    en: {
      title: '🍳 AI Recipe Generator',
      subtitle: 'Create personalized recipes',
      ingredients: 'Ingredients',
      ingredientsPlaceholder: 'Chicken, rice, broccoli',
      mealType: 'Meal Type',
      selectMeal: 'Select',
      breakfast: 'Breakfast',
      lunch: 'Lunch',
      dinner: 'Dinner',
      snack: 'Snack',
      calories: 'Target Calories',
      caloriesPlaceholder: 'e.g. 500',
      cuisine: 'Cuisine',
      cuisinePlaceholder: 'Turkish, Italian, Mexican',
      generate: 'Generate Recipe',
      generating: 'Generating...',
      tryAnother: 'Try Another',
      prepTime: 'Prep',
      cookTime: 'Cook',
      servings: 'Servings',
      ingredientsList: 'Ingredients',
      instructions: 'Instructions',
      nutrition: 'Nutrition',
      min: 'min',
    },
  };

  const t = labels[language];

  const handleGenerate = async () => {
    if (!userId) return;

    setIsGenerating(true);
    setRecipe(null);

    try {
      const response = await fetch('/api/ai-recipe-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients: ingredients ? ingredients.split(',').map(i => i.trim()) : undefined,
          mealType: mealType || undefined,
          calorieTarget: calorieTarget ? parseInt(calorieTarget) : undefined,
          cuisine: cuisine || undefined,
          userId: userId,
          language,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      setRecipe(data as GeneratedRecipe);
      toast.success('✅ Recipe generated!');
    } catch (error) {
      console.error('Recipe generation error:', error);
      toast.error('Failed to generate recipe. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const resetGenerator = () => {
    setRecipe(null);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">{t.title}</CardTitle>
        <p className="text-sm text-gray-500">{t.subtitle}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        {!recipe && !isGenerating && (
          <div className="space-y-4">
            {/* Ingredients Input */}
            <div className="space-y-2">
              <Label htmlFor="ingredients">{t.ingredients}</Label>
              <Input
                id="ingredients"
                placeholder={t.ingredientsPlaceholder}
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
              />
            </div>

            {/* Meal Type */}
            <div className="space-y-2">
              <Label htmlFor="mealType">{t.mealType}</Label>
              <Select value={mealType} onValueChange={setMealType}>
                <SelectTrigger id="mealType">
                  <SelectValue placeholder={t.selectMeal} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">{t.breakfast}</SelectItem>
                  <SelectItem value="lunch">{t.lunch}</SelectItem>
                  <SelectItem value="dinner">{t.dinner}</SelectItem>
                  <SelectItem value="snack">{t.snack}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Calorie Target */}
            <div className="space-y-2">
              <Label htmlFor="calories">{t.calories}</Label>
              <Input
                id="calories"
                type="number"
                placeholder={t.caloriesPlaceholder}
                value={calorieTarget}
                onChange={(e) => setCalorieTarget(e.target.value)}
              />
            </div>

            {/* Cuisine */}
            <div className="space-y-2">
              <Label htmlFor="cuisine">{t.cuisine}</Label>
              <Input
                id="cuisine"
                placeholder={t.cuisinePlaceholder}
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
              />
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              className="w-full bg-teal-600 hover:bg-teal-700"
              disabled={isGenerating}
            >
              <ChefHat className="w-4 h-4 mr-2" />
              {t.generate}
            </Button>
          </div>
        )}

        {/* Generating State */}
        {isGenerating && (
          <div className="text-center py-8 space-y-3">
            <Loader2 className="w-12 h-12 mx-auto text-teal-600 animate-spin" />
            <p className="text-sm text-gray-600">{t.generating}</p>
          </div>
        )}

        {/* Recipe Result */}
        {recipe && !isGenerating && (
          <div className="space-y-4">
            {/* Recipe Header */}
            <div className="space-y-2">
              <h3 className="font-bold text-xl text-teal-700">{recipe.name}</h3>
              <p className="text-sm text-gray-600">{recipe.description}</p>
              
              {/* Meta Info */}
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {t.prepTime}: {recipe.prepTime}{t.min}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Flame className="w-3 h-3" />
                  {t.cookTime}: {recipe.cookTime}{t.min}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {recipe.servings} {t.servings}
                </Badge>
              </div>
            </div>

            {/* Nutrition Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-2xl font-bold text-purple-700">
                  {recipe.nutrition.calories}
                </p>
                <p className="text-xs text-purple-600">Calories</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-2xl font-bold text-blue-700">
                  {recipe.nutrition.protein}g
                </p>
                <p className="text-xs text-blue-600">Protein</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-2xl font-bold text-orange-700">
                  {recipe.nutrition.carbs}g
                </p>
                <p className="text-xs text-orange-600">Carbs</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-2xl font-bold text-green-700">
                  {recipe.nutrition.fat}g
                </p>
                <p className="text-xs text-green-600">Fat</p>
              </div>
            </div>

            {/* Ingredients */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-gray-700">{t.ingredientsList}</h4>
              <ul className="space-y-1">
                {recipe.ingredients.map((ing, idx) => (
                  <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-teal-600 font-bold">•</span>
                    <span>
                      {ing.item} - <span className="text-teal-600">{ing.amount}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Instructions */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-gray-700">{t.instructions}</h4>
              <ol className="space-y-2">
                {recipe.instructions.map((step, idx) => (
                  <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="font-bold text-teal-600 min-w-[20px]">
                      {idx + 1}.
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Try Another Button */}
            <Button
              onClick={resetGenerator}
              variant="outline"
              className="w-full"
            >
              {t.tryAnother}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
