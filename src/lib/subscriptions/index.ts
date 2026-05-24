/**
 * Subscription provider — entry point.
 *
 * App code should ONLY import from this module:
 *
 *   import { getSubscriptionProvider } from '@/lib/subscriptions';
 *   const sub = getSubscriptionProvider();
 *   const status = await sub.getCustomerStatus();
 *
 * The provider returned today is the RevenueCat adapter. To switch
 * vendors later, add a new file in this directory implementing
 * `ISubscriptionProvider` and change the factory below — every consumer
 * is shielded behind the interface.
 *
 * --------------------------------------------------------------------
 * TODO — future provider adapters (NOT installed in this task):
 *   • Adapty           → src/lib/subscriptions/adaptyProvider.ts
 *                        SDK: @adapty/javascript-sdk
 *   • Qonversion       → src/lib/subscriptions/qonversionProvider.ts
 *                        SDK: @qonversion/web-sdk
 *   • Superwall        → src/lib/subscriptions/superwallProvider.ts
 *                        SDK: @superwall/web (paywall + RC entitlement bridge)
 *   • Paddle Billing   → src/lib/subscriptions/paddleProvider.ts
 *                        SDK: @paddle/paddle-js
 *   • Lemon Squeezy    → src/lib/subscriptions/lemonsqueezyProvider.ts
 *                        SDK: @lemonsqueezy/lemonsqueezy.js
 *
 * Do NOT install or import these SDKs until product strategy is decided.
 * --------------------------------------------------------------------
 */

import { RevenueCatProvider } from './revenuecatProvider';
import { NoopSubscriptionProvider } from './noopProvider';
import type { ISubscriptionProvider } from './types';

// Cache the chosen instance so repeated calls return the same object.
let cached: ISubscriptionProvider | null = null;

/**
 * Returns the active subscription provider. Today: RevenueCat when its
 * Web Billing key is present, otherwise a no-op provider that keeps the
 * UI interactive.
 *
 * Override at runtime (e.g. for tests / Storybook) via
 * `setSubscriptionProvider(...)`.
 */
export function getSubscriptionProvider(): ISubscriptionProvider {
  if (cached) return cached;
  const rc = new RevenueCatProvider();
  cached = rc.isConfigured() ? rc : new NoopSubscriptionProvider();
  return cached;
}

/** Test / Storybook hook to inject a fake provider. */
export function setSubscriptionProvider(p: ISubscriptionProvider | null): void {
  cached = p;
}

// Re-export the interface + types so callers can write one import.
export type {
  ISubscriptionProvider,
  ProviderName,
  PresentPaywallOptions,
  PresentPaywallResult,
  RestoreResult,
  SubscriptionStatus,
} from './types';
