'use client';

/**
 * FavoriteFoods - placeholder.
 *
 * The legacy implementation depended on a `favorite_foods` and `food_items`
 * table that no longer exist in the canonical schema. The feature is
 * non-critical for the calorie-tracking flow; we expose a no-op surface so
 * downstream callers (MorePage, AddMealDialog) keep working until the
 * favorites feature is rebuilt against the new `food_database` table.
 */

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Star } from 'lucide-react';

interface FavoriteToggleProps {
  foodId: string;
  className?: string;
}

export function FavoriteToggle(_props: FavoriteToggleProps) {
  return null;
}

export function FavoriteFoods() {
  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          Favori Yiyecekler
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Henüz favori yiyecek eklenmedi. Yemek arama ekranından bir yemeği favorilerine ekleyebilirsin.
        </p>
      </CardContent>
    </Card>
  );
}

export default FavoriteFoods;
