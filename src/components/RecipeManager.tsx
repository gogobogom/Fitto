'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ChefHat, Plus, Trash2, Clock, Users, Search } from 'lucide-react';
import RecipeSearch from './RecipeSearch';
import type { SupabaseConnection } from '@/hooks/useSupabase';
import type { Recipe, RecipeIngredient } from '@/types/supabase';
import { useLanguage } from '@/contexts/LanguageContext';

interface RecipeManagerProps {
  connection: SupabaseConnection;
  userId: string;
}

export function RecipeManager({ connection, userId }: RecipeManagerProps) {
  const { t } = useLanguage();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState<boolean>(false);
  const [recipeName, setRecipeName] = useState<string>('');
  const [instructions, setInstructions] = useState<string>('');
  const [servings, setServings] = useState<string>('1');
  const [prepTimeMinutes, setPrepTimeMinutes] = useState<string>('30');
  const [selectedIngredients, setSelectedIngredients] = useState<RecipeIngredient[]>([]);
  const [ingredientName, setIngredientName] = useState<string>('');
  const [ingredientAmount, setIngredientAmount] = useState<string>('');
  const [ingredientUnit, setIngredientUnit] = useState<string>('');

  // Load recipes from Supabase
  useEffect(() => {
    const loadRecipes = async () => {
      try {
        const { data, error } = await connection.supabase
          .from('recipes')
          .select('*')
          .eq('identity', connection.userId)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error(t('recipes.errorLoadingRecipes'), error);
          return;
        }
        
        setRecipes(data || []);
      } catch (error) {
        console.error(t('recipes.errorLoadingRecipes'), error);
      }
    };
    
    loadRecipes();
    
    // Subscribe to real-time changes
    const channel = connection.supabase
      .channel('recipes_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'recipes',
          filter: `identity=eq.${connection.userId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRecipe = payload.new as Recipe;
            setRecipes((prev) => [newRecipe, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            const oldRecipe = payload.old as Recipe;
            setRecipes((prev) => prev.filter((r) => r.id !== oldRecipe.id));
          }
        }
      )
      .subscribe();
    
    return () => {
      connection.supabase.removeChannel(channel);
    };
  }, [connection, t]);

  const handleAddIngredient = (): void => {
    if (ingredientName.trim() && ingredientAmount.trim()) {
      setSelectedIngredients([
        ...selectedIngredients,
        {
          name: ingredientName.trim(),
          amount: ingredientAmount.trim(),
          unit: ingredientUnit.trim() || 'g',
        },
      ]);
      setIngredientName('');
      setIngredientAmount('');
      setIngredientUnit('');
    }
  };

  const handleRemoveIngredient = (index: number): void => {
    setSelectedIngredients(selectedIngredients.filter((_, i) => i !== index));
  };

  const handleCreateRecipe = async (): Promise<void> => {
    if (!recipeName.trim() || selectedIngredients.length === 0) {
      alert(t('recipes.errorPleaseEnterName'));
      return;
    }

    try {
      const { error } = await connection.supabase
        .from('recipes')
        .insert({
          identity: connection.userId,
          name: recipeName.trim(),
          description: null,
          ingredients: selectedIngredients,
          instructions: instructions.trim(),
          prep_time_minutes: parseInt(prepTimeMinutes, 10) || 30,
          cook_time_minutes: 0,
          servings: parseInt(servings, 10) || 1,
          calories_per_serving: 0,
          protein_per_serving: 0,
          carbs_per_serving: 0,
          fats_per_serving: 0,
          tags: [],
          is_favorite: false,
        });

      if (error) {
        console.error(t('recipes.errorCreatingRecipe'), error);
        alert(t('recipes.errorCreatingRecipeMsg'));
        return;
      }

      setRecipeName('');
      setInstructions('');
      setServings('1');
      setPrepTimeMinutes('30');
      setSelectedIngredients([]);
      setShowCreateDialog(false);
    } catch (error) {
      console.error(t('recipes.errorCreatingRecipe'), error);
      alert(t('recipes.errorCreatingRecipeMsg'));
    }
  };

  const handleDeleteRecipe = async (recipeId: string): Promise<void> => {
    if (confirm(t('recipes.confirmDelete'))) {
      try {
        const { error } = await connection.supabase
          .from('recipes')
          .delete()
          .eq('id', recipeId);

        if (error) {
          console.error(t('recipes.errorDeletingRecipe'), error);
          alert(t('recipes.errorDeletingRecipeMsg'));
        }
      } catch (error) {
        console.error(t('recipes.errorDeletingRecipe'), error);
        alert(t('recipes.errorDeletingRecipeMsg'));
      }
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="my-recipes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-recipes">
            <ChefHat className="h-4 w-4 mr-2" />
            {t('recipes.myRecipes')}
          </TabsTrigger>
          <TabsTrigger value="search">
            <Search className="h-4 w-4 mr-2" />
            {t('recipes.searchRecipes')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-recipes" className="space-y-4">
          <div className="flex items-center justify-end">
            <Button onClick={() => setShowCreateDialog(true)} className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              {t('recipes.newRecipe')}
            </Button>
          </div>

          {recipes.length === 0 ? (
            <Card className="border-2">
              <CardContent className="py-12 text-center">
                <ChefHat className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('recipes.noRecipesYet')}</h3>
                <p className="text-gray-600 mb-4">{t('recipes.createYourRecipes')}</p>
                <Button onClick={() => setShowCreateDialog(true)} className="bg-green-600 hover:bg-green-700">
                  {t('recipes.createFirstRecipe')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {recipes.map((recipe) => (
                <Card key={recipe.id} className="border-2">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-xl">{recipe.name}</CardTitle>
                      <Button
                        onClick={() => handleDeleteRecipe(recipe.id)}
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {recipe.prep_time_minutes} {t('recipes.minutes')}
                      </Badge>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {recipe.servings} {t('recipes.serving')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recipe.instructions && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">{t('recipes.recipe')}</h4>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{recipe.instructions}</p>
                      </div>
                    )}

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">{t('recipes.ingredientsList')}</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {recipe.ingredients.map((ingredient: RecipeIngredient, idx: number) => (
                          <li key={idx}>
                            • {ingredient.name} - {ingredient.amount} {ingredient.unit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="search">
          <RecipeSearch userId={userId} connection={connection} />
        </TabsContent>
      </Tabs>

      {/* Create Recipe Dialog */}
      {showCreateDialog && (
        <Dialog open onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('recipes.createNewRecipe')}</DialogTitle>
              <DialogDescription>{t('recipes.createNewRecipeDesc')}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recipeName">{t('recipes.recipeName')}</Label>
                <Input
                  id="recipeName"
                  value={recipeName}
                  onChange={(e) => setRecipeName(e.target.value)}
                  placeholder={t('recipes.recipeNamePlaceholder')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="servings">{t('recipes.servings')}</Label>
                  <Input
                    id="servings"
                    type="number"
                    value={servings}
                    onChange={(e) => setServings(e.target.value)}
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prepTime">{t('recipes.prepTime')}</Label>
                  <Input
                    id="prepTime"
                    type="number"
                    value={prepTimeMinutes}
                    onChange={(e) => setPrepTimeMinutes(e.target.value)}
                    min="1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">{t('recipes.recipeNotes')}</Label>
                <Textarea
                  id="instructions"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder={t('recipes.recipeNotesPlaceholder')}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>{t('recipes.ingredientsLabel')}</Label>
                {selectedIngredients.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {selectedIngredients.map((ing, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <span className="flex-1 text-sm">{ing.name}</span>
                        <span className="text-sm text-gray-600">{ing.amount} {ing.unit}</span>
                        <Button
                          onClick={() => handleRemoveIngredient(idx)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Input
                    value={ingredientName}
                    onChange={(e) => setIngredientName(e.target.value)}
                    placeholder={t('recipes.ingredientName') || 'İsim'}
                    className="flex-1"
                  />
                  <Input
                    value={ingredientAmount}
                    onChange={(e) => setIngredientAmount(e.target.value)}
                    placeholder="100"
                    className="w-20"
                  />
                  <Input
                    value={ingredientUnit}
                    onChange={(e) => setIngredientUnit(e.target.value)}
                    placeholder="g"
                    className="w-16"
                  />
                  <Button
                    onClick={handleAddIngredient}
                    variant="outline"
                    size="icon"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={() => setShowCreateDialog(false)} variant="outline" className="flex-1">
                  {t('recipes.cancel')}
                </Button>
                <Button onClick={handleCreateRecipe} className="flex-1 bg-green-600 hover:bg-green-700">
                  {t('recipes.create')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
