/**
 * RevenueCat adapter for the generic ISubscriptionProvider interface.
 *
 * This file is the ONLY place that imports from the RevenueCat-specific
 * `@/lib/revenuecat` wrapper. Every other piece of app code should depend
 * on `ISubscriptionProvider` (re-exported from `@/lib/subscriptions`)
 * instead. That way, swapping vendors later is a one-file change.
 *
 * Behaviour: this adapter wraps the existing `RevenueCatService` so we
 * don't churn the SDK loading / native vs. web split twice. The legacy
 * RC components (RevenueCatInitializer, SubscriptionManager) continue to
 * work unchanged — they call the wrapper directly. New code should prefer
 * `getSubscriptionProvider()` from `@/lib/subscriptions`.
 */

import {
  RevenueCatService,
  PREMIUM_ENTITLEMENT_ID,
} from '@/lib/revenuecat';
import type {
  ISubscriptionProvider,
  PresentPaywallOptions,
  PresentPaywallResult,
  RestoreResult,
  SubscriptionStatus,
} from './types';

const FREE_STATUS: SubscriptionStatus = {
  isActive: false,
  expiresAt: null,
  productId: null,
  planSlug: null,
  source: 'revenuecat',
  isAnonymous: true,
};

function extractPremium(
  info: unknown,
): { active: true; expiresAt: string | null; productId: string | null }
  | { active: false } {
  if (!info || typeof info !== 'object') return { active: false };
  const ent = (info as {
    entitlements?: { active?: Record<string, { expirationDate?: Date | string | null; productIdentifier?: string }> };
  }).entitlements;
  const premium = ent?.active?.[PREMIUM_ENTITLEMENT_ID];
  if (!premium) return { active: false };
  const exp = premium.expirationDate ?? null;
  const expiresAt =
    exp instanceof Date ? exp.toISOString() : typeof exp === 'string' ? exp : null;
  return {
    active: true,
    expiresAt,
    productId: premium.productIdentifier ?? null,
  };
}

export class RevenueCatProvider implements ISubscriptionProvider {
  readonly name = 'revenuecat' as const;

  isConfigured(): boolean {
    return RevenueCatService.isWebBillingConfigured();
  }

  async init(options?: { userId?: string | null }): Promise<void> {
    if (typeof window === 'undefined') return;
    // RC web SDK persists an anonymous id in localStorage when no userId is
    // passed, so calling init() unauthenticated is safe and recommended.
    await RevenueCatService.initWeb({ userId: options?.userId ?? null });
  }

  async getCustomerStatus(_userId?: string): Promise<SubscriptionStatus> {
    void _userId; // RC tracks identity via its own SDK state
    if (typeof window === 'undefined') return FREE_STATUS;

    // Prefer the web SDK customer info; fall back to native.
    const info =
      (await RevenueCatService.getWebCustomerInfo()) ??
      (await RevenueCatService.getCustomerInfo());

    const extracted = extractPremium(info);
    if (!extracted.active) {
      return { ...FREE_STATUS };
    }

    return {
      isActive: true,
      expiresAt: extracted.expiresAt,
      productId: extracted.productId,
      planSlug: extracted.productId, // RC uses same id for product + plan
      source: 'revenuecat',
      isAnonymous: false,
    };
  }

  async presentPaywall(
    _options?: PresentPaywallOptions,
  ): Promise<PresentPaywallResult> {
    void _options; // RC hosted paywall reads offering from dashboard config
    if (typeof window === 'undefined') {
      return { purchased: false, reason: 'sdk_unavailable' };
    }
    if (!this.isConfigured()) {
      return { purchased: false, reason: 'not_configured' };
    }

    // Pre-flight so callers can show a clear "no offering yet" toast
    // instead of a silent dismiss.
    const offerings = await RevenueCatService.getWebOfferings();
    if (!offerings?.current) {
      return { purchased: false, reason: 'no_offering_configured' };
    }

    const result = await RevenueCatService.presentWebPaywall();
    if (!result) {
      // SDK throws UserCancelledError on dismiss; the wrapper maps that
      // (and any other failure) to null.
      return { purchased: false, reason: 'user_cancelled' };
    }
    return { purchased: true };
  }

  async restorePurchases(): Promise<RestoreResult> {
    const status = await this.getCustomerStatus();
    return { restored: status.isActive, status };
  }

  async identify(userId: string): Promise<void> {
    if (!userId) return;
    await RevenueCatService.identify(userId);
  }

  async logout(): Promise<void> {
    // RC has no first-class "log out" on the web SDK; switching back to
    // an anonymous id is the supported pattern. The wrapper does this via
    // initWeb({}) which will pick a fresh anonymous id if none exists.
    await RevenueCatService.initWeb({});
  }
}
