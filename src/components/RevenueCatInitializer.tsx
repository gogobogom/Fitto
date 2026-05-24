'use client';

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/lib/supabase/client';
import { getSubscriptionProvider } from '@/lib/subscriptions';
// Native path still imports the RC service directly because the iOS/Android
// Capacitor RevenueCat plugin is compile-time bound and not yet modeled in
// the generic ISubscriptionProvider interface (per-package SKU UI lives in
// SubscriptionManager and consumes RC's PurchasesPackage type). Migrating
// native to the abstraction is a follow-up task — see comment in
// SubscriptionManager.tsx near the native flow.
import { RevenueCatService } from '@/lib/revenuecat';

/**
 * RevenueCatInitializer
 *
 * Boots the active subscription provider as soon as the app mounts.
 *
 *   • Web:    `getSubscriptionProvider().init()` is called immediately with
 *             no `userId`, so the provider configures with a stable
 *             anonymous id from localStorage. When the Supabase session
 *             resolves (now or later), we call `identify(userId)` which
 *             aliases anonymous → real user id, preserving entitlement
 *             continuity. The component name is kept as
 *             `RevenueCatInitializer` for layout compatibility, but the
 *             actual provider is whatever `getSubscriptionProvider()`
 *             returns (RevenueCat today, no-op when unconfigured).
 *
 *   • Native: still uses `RevenueCatService.initialize(userId)` directly
 *             because the iOS/Android plugin requires a known userId at
 *             configure time. See above comment.
 *
 * Failure modes:
 *   • Provider not configured → init/identify are no-ops; no UI error.
 *   • SDK throws → logged once; app remains interactive.
 */
export function RevenueCatInitializer() {
  useEffect(() => {
    let cancelled = false;
    const provider = getSubscriptionProvider();

    void (async () => {
      // 1) Boot immediately with anonymous id on web. (No-op on native.)
      if (!Capacitor.isNativePlatform()) {
        try {
          await provider.init();
        } catch (err) {
          console.error('[RevenueCatInitializer] provider.init (anon) failed:', err);
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
            await provider.identify(userId);
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
            await provider.identify(userId);
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
