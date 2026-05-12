'use client';

/**
 * RecipeManager
 *
 * Placeholder implementation. The previous file queried a `recipes` table
 * and used `Recipe` / `RecipeIngredient` types that don't exist in the
 * current Supabase schema, and it was always rendered from MorePage with
 * a `null` connection (`<RecipeManager connection={null as any} />`).
 * Until a proper user-recipes feature is designed, point users to the
 * existing `/tarifler` recipe-browser route.
 */

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ChefHat } from 'lucide-react';
import type { SupabaseConnection } from '@/hooks/useSupabase';
import { useLanguage } from '@/contexts/LanguageContext';

interface RecipeManagerProps {
  connection: SupabaseConnection | null;
  userId: string;
}

export function RecipeManager({ connection: _connection, userId: _userId }: RecipeManagerProps) {
  const { language } = useLanguage();
  return (
    <Card className="border-2 border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ChefHat className="h-5 w-5 text-orange-500" />
          {language === 'tr' ? 'Tariflerim' : 'My Recipes'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-gray-600">
        <p>
          {language === 'tr'
            ? 'Kişisel tarif yönetimi yakında. Şimdilik tarifleri tarifler sayfasından keşfedebilirsiniz.'
            : 'Personal recipe management is coming soon. For now, browse the recipes page.'}
        </p>
        <Button asChild className="w-full">
          <a href="/tarifler">
            {language === 'tr' ? 'Tariflere git' : 'Open recipes'}
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
