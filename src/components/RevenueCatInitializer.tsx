'use client';

import { useEffect } from 'react';
import { RevenueCatService } from '@/lib/revenuecat';
import { supabase } from '@/lib/supabase/client';
import { Capacitor } from '@capacitor/core';

/**
 * RevenueCatInitializer
 *
 * Waits for the Supabase auth session, then configures the appropriate
 * RevenueCat SDK with the Supabase `user.id` as the `appUserID`. Re-runs
 * on every Supabase auth state change so cross-device entitlement stays
 * tied to the right account.
 *
 * Failure modes:
 *   • No Supabase session yet → wait for `onAuthStateChange`.
 *   • RevenueCat env keys missing → the lib methods soft-fail; no UI error.
 *   • SDK throws → logged once, app remains interactive.
 */
export function RevenueCatInitializer() {
  useEffect(() => {
    let cancelled = false;

    const configureFor = async (userId: string | null): Promise<void> => {
      if (cancelled || !userId) return;
      try {
        if (Capacitor.isNativePlatform()) {
          await RevenueCatService.initialize(userId);
        } else {
          await RevenueCatService.initWeb({ userId });
        }
      } catch (err) {
        console.error('[RevenueCatInitializer] init failed:', err);
      }
    };

    // 1) Initial session (resolves immediately if already signed in).
    void (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const userId = data.session?.user?.id ?? null;
        await configureFor(userId);
      } catch (err) {
        console.error('[RevenueCatInitializer] getSession failed:', err);
      }
    })();

    // 2) Re-identify on future auth state changes (sign in / out / refresh).
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const userId = session?.user?.id ?? null;
      if (userId) void configureFor(userId);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return null;
}
