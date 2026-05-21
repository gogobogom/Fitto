'use client';

import { useEffect } from 'react';
import { RevenueCatService } from '@/lib/revenuecat';
import { supabase } from '@/lib/supabase/client';
import { Capacitor } from '@capacitor/core';

/**
 * RevenueCatInitializer
 *
 * Boots RevenueCat as soon as the app mounts:
 *
 *   • Web:    `initWeb()` is called immediately with no `userId`, so the
 *             SDK configures with a stable anonymous id from localStorage.
 *             When the Supabase session resolves (now or later), we call
 *             `identify(userId)` which aliases anonymous → real user id
 *             server-side, preserving entitlement continuity.
 *
 *   • Native: `initialize(userId)` requires a known userId, so we keep the
 *             original "wait for session" behavior on iOS/Android.
 *
 * Failure modes:
 *   • RevenueCat env keys missing → all lib methods soft-fail; no UI error.
 *   • SDK throws → logged once; app remains interactive.
 */
export function RevenueCatInitializer() {
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      // 1) Boot immediately with anonymous id on web. (No-op on native.)
      if (!Capacitor.isNativePlatform()) {
        try {
          await RevenueCatService.initWeb({});
        } catch (err) {
          console.error('[RevenueCatInitializer] initWeb (anon) failed:', err);
        }
      }

      if (cancelled) return;

      // 2) Then identify with the real Supabase user id (resolves
      //    immediately if already signed in).
      try {
        const { data } = await supabase.auth.getSession();
        const userId = data.session?.user?.id ?? null;
        if (userId && !cancelled) {
          if (Capacitor.isNativePlatform()) {
            await RevenueCatService.initialize(userId);
          } else {
            await RevenueCatService.identify(userId);
          }
        }
      } catch (err) {
        console.error('[RevenueCatInitializer] getSession failed:', err);
      }
    })();

    // 3) Re-identify on future auth state changes (sign in / out / refresh).
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const userId = session?.user?.id ?? null;
      if (!userId) return;
      void (async () => {
        try {
          if (Capacitor.isNativePlatform()) {
            await RevenueCatService.initialize(userId);
          } else {
            await RevenueCatService.identify(userId);
          }
        } catch (err) {
          console.error('[RevenueCatInitializer] re-identify failed:', err);
        }
      })();
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return null;
}
