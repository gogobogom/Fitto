'use client';

import { useEffect, useState } from 'react';
import { TURKISH_FOOD_DATABASE } from '@/lib/turkishFoodDatabase';
import type { SupabaseConnection } from '@/hooks/useSupabase';
import type { FoodItem } from '@/types/supabase';

interface FoodDatabaseInitializerProps {
  connection: SupabaseConnection;
  foodItems: ReadonlyMap<string, FoodItem>;
}

export function FoodDatabaseInitializer({ connection, foodItems }: FoodDatabaseInitializerProps) {
  const [hasInitialized, setHasInitialized] = useState<boolean>(false);

  // DISABLED: Food database initialization (requires proper database setup)
  useEffect(() => {
    if (!connection || hasInitialized) return;

    // Skip food initialization in demo mode or until proper database is set up
    console.log('Fitto: Food database initialization skipped (demo mode or database not configured)');
    setHasInitialized(true);
    
  }, [connection, hasInitialized]);

  // This component doesn't render anything - it works silently in the background
  return null;
}
