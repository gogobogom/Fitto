'use client';

import React, { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import RecipeDetail from './RecipeDetail';
import { useLanguage } from '@/contexts/LanguageContext';

interface TheMealDBRecipe {
  idMeal: string;
  strMeal: string;
  strCategory: string;
  strArea: string;
  strMealThumb: string;
  strTags: string | null;
}

interface RecipeSearchProps {
  userId: string;
}

export default function RecipeSearch({ userId }: RecipeSearchProps): JSX.Element {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [recipes, setRecipes] = useState<TheMealDBRecipe[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);

  // Popular search terms by language
  const popularSearchTerms: Record<string, string[]> = {
    tr: ['tavuk', 'kebap', 'et', 'makarna', 'salata', 'çorba', 'balık', 'köfte'],
    en: ['chicken', 'kebab', 'beef', 'pasta', 'salad', 'soup', 'fish', 'meatballs']
  };

  const handleSearch = async (): Promise<void> => {
    if (!searchQuery.trim()) {
      setError(t('recipes.errorPleaseEnter'));
      return;
    }

    setLoading(true);
    setError('');

    // Track cleanup resources
    const controller = new AbortController();
    let timeoutId: NodeJS.Timeout | null = null;

    try {
      // Add timeout protection (15 seconds)
      timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(
        `/api/recipes/search?q=${encodeURIComponent(searchQuery)}&lang=${language}`,
        { signal: controller.signal }
      );

      if (!response.ok) {
        throw new Error(t('recipes.errorLoadRecipes'));
      }

      const result = await response.json();
      
      // API returns wrapped response: { success, data, message }
      const data: { meals?: TheMealDBRecipe[] } = result.data || result;

      if (data.meals && data.meals.length > 0) {
        setRecipes(data.meals);
      } else {
        setRecipes([]);
        setError(t('recipes.errorNotFound'));
      }
    } catch (err: unknown) {
      console.error('Recipe search error:', err);
      if (err instanceof Error && err.name === 'AbortError') {
        setError(t('recipes.errorTimeout'));
      } else {
        setError(t('recipes.errorGeneral'));
      }
      setRecipes([]);
    } finally {
      // Always cleanup
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Popular Turkish searches on mount
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    let timeoutId: NodeJS.Timeout | null = null;

    const loadPopularRecipes = async (): Promise<void> => {
      try {
        // Add timeout protection
        timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(`/api/recipes/search?q=chicken&lang=${language}`, {
          signal: controller.signal
        });
        
        if (response.ok && isMounted) {
          const result = await response.json();
          const data: { meals?: TheMealDBRecipe[] } = result.data || result;
          if (data.meals) {
            setRecipes(data.meals.slice(0, 6));
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Failed to load popular recipes:', err);
        }
        // Silently fail for popular recipes - not critical
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }
    };

    loadPopularRecipes();

    return () => {
      isMounted = false;
      controller.abort();
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [language]);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder={t('recipes.searchPlaceholder')}
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t('recipes.searching')}
            </>
          ) : (
            t('recipes.search')
          )}
        </Button>
      </div>

      {/* Search Suggestions */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-gray-600">{t('recipes.popularSearches')}</span>
        {(popularSearchTerms[language] || popularSearchTerms['en']).map((term: string) => (
          <Button
            key={term}
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery(term);
              setTimeout(() => handleSearch(), 100);
            }}
            className="text-xs"
          >
            {term}
          </Button>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Results Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {recipes.map((recipe: TheMealDBRecipe) => (
          <Card
            key={recipe.idMeal}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedRecipeId(recipe.idMeal)}
          >
            <CardContent className="p-4">
              <div className="flex gap-3">
                <img
                  src={recipe.strMealThumb}
                  alt={recipe.strMeal}
                  className="w-20 h-20 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm line-clamp-2">
                    {recipe.strMeal}
                  </h3>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                      {recipe.strCategory}
                    </span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                      {recipe.strArea}
                    </span>
                  </div>
                  {recipe.strTags && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                      {recipe.strTags}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {!loading && recipes.length === 0 && !error && (
        <div className="text-center py-12 text-gray-500">
          <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>{t('recipes.emptyState')}</p>
        </div>
      )}

      {/* Recipe Detail Dialog */}
      {selectedRecipeId && (
        <RecipeDetail
          recipeId={selectedRecipeId}
          userId={userId}
          onClose={() => setSelectedRecipeId(null)}
        />
      )}
    </div>
  );
}
