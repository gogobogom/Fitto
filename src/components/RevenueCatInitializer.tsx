'use client';

import { useEffect } from 'react';
import { RevenueCatService } from '@/lib/revenuecat';

export function RevenueCatInitializer() {
  useEffect(() => {
    // Initialize RevenueCat when the app starts
    RevenueCatService.initialize();
  }, []);

  return null;
}
