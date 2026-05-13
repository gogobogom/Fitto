'use client';

import { useEffect } from 'react';
import { RevenueCatService } from '@/lib/revenuecat';

export function RevenueCatInitializer() {
  useEffect(() => {
    // Initialize RevenueCat when the app starts. The service itself
    // swallows errors and resolves, but we add an extra guard here so a
    // throw from `initialize()` can never lock up the UI tree.
    void (async () => {
      try {
        await RevenueCatService.initialize();
      } catch (err) {
        console.error('[RevenueCatInitializer] initialize failed:', err);
      }
    })();
  }, []);

  return null;
}
