/**
 * No-op subscription provider.
 *
 * Used when no real provider is configured (e.g. preview environments
 * without a RevenueCat key). Returns benign defaults so the app remains
 * interactive and never crashes on a missing SDK.
 */

import type {
  ISubscriptionProvider,
  PresentPaywallResult,
  RestoreResult,
  SubscriptionStatus,
} from './types';

export class NoopSubscriptionProvider implements ISubscriptionProvider {
  readonly name = 'noop' as const;

  isConfigured(): boolean {
    return false;
  }

  async getCustomerStatus(_userId?: string): Promise<SubscriptionStatus> {
    void _userId;
    return {
      isActive: false,
      expiresAt: null,
      productId: null,
      planSlug: null,
      source: 'noop',
      isAnonymous: true,
    };
  }

  async presentPaywall(): Promise<PresentPaywallResult> {
    return { purchased: false, reason: 'not_configured' };
  }

  async restorePurchases(): Promise<RestoreResult> {
    const status = await this.getCustomerStatus();
    return { restored: false, status };
  }

  async identify(_userId: string): Promise<void> {
    void _userId;
  }

  async logout(): Promise<void> {
    /* no-op */
  }
}
