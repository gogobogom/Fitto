/**
 * Generic, provider-agnostic subscription types.
 *
 * Designed so the app can target any in-app-purchase / paywall vendor
 * (RevenueCat today; Adapty / Qonversion / Superwall / Paddle / Lemon Squeezy
 * tomorrow) through a single interface. Adding a new vendor means writing
 * one adapter that satisfies `ISubscriptionProvider` — no UI / context /
 * webhook code should ever import a vendor SDK directly again.
 */

/**
 * The result of asking a provider whether the current user has an active
 * premium entitlement. Fields are intentionally provider-agnostic.
 */
export interface SubscriptionStatus {
  /** True iff the canonical premium entitlement is active right now. */
  isActive: boolean;

  /**
   * Entitlement expiration as an ISO 8601 string, or `null` for lifetime
   * entitlements, anonymous users, or providers that don't expose a date.
   */
  expiresAt: string | null;

  /** Stable id of the SKU/package the user is on, when the provider knows it. */
  productId?: string | null;

  /** Free-form product/plan slug for analytics/UI (e.g. "monthly", "yearly"). */
  planSlug?: string | null;

  /** Provider tag for logging — e.g. "revenuecat", "adapty". */
  source: ProviderName;

  /**
   * Whether the user identity used for this check is anonymous (no auth
   * yet). Useful for telling the UI to show "Sign in to restore" prompts.
   */
  isAnonymous?: boolean;
}

/** Outcome of opening the provider's hosted paywall. */
export interface PresentPaywallResult {
  /** True iff a purchase actually completed in this flow. */
  purchased: boolean;

  /**
   * Reason a purchase didn't complete, when applicable. Stable string
   * codes so the UI can map them to localised toasts without poking into
   * SDK-specific error shapes.
   */
  reason?:
    | 'user_cancelled'
    | 'no_offering_configured'
    | 'not_configured'
    | 'sdk_unavailable'
    | 'native_only'
    | 'unknown_error';
}

/** Outcome of `restorePurchases()`. */
export interface RestoreResult {
  restored: boolean;
  status: SubscriptionStatus;
}

/** Optional knobs you can pass when opening the paywall. */
export interface PresentPaywallOptions {
  /**
   * Offering / placement identifier configured in the provider dashboard.
   * Omit to use the dashboard's "current" / default offering.
   */
  offeringId?: string;

  /**
   * Pre-fill the customer email in the checkout when supported (RC, Paddle).
   * Optional — providers ignore unknown fields.
   */
  customerEmail?: string;
}

/**
 * Tag used for logging + the `source` field on returned values. Keep this
 * list small — new entries cost an adapter implementation.
 */
export type ProviderName =
  | 'revenuecat'
  | 'adapty'
  | 'qonversion'
  | 'superwall'
  | 'paddle'
  | 'lemonsqueezy'
  | 'noop';

/**
 * Minimum surface every subscription provider adapter must implement.
 *
 * Method-level contract notes:
 *   • All methods MUST be safe to call before the SDK is configured. When
 *     not configured, return a benign default (`isActive: false`,
 *     `purchased: false`, `reason: 'not_configured'`) rather than throw.
 *   • All methods MUST be safe on the server (SSR). On Node they should
 *     short-circuit without touching `window`.
 *   • Identity calls (`identify` / `logout`) MUST be idempotent.
 */
export interface ISubscriptionProvider {
  /** Provider tag for logging. */
  readonly name: ProviderName;

  /** Returns true iff the SDK has the credentials it needs to operate. */
  isConfigured(): boolean;

  /**
   * One-shot SDK boot. Safe to call multiple times. Pass a `userId` if
   * already authenticated, otherwise the provider should configure with
   * a stable anonymous id (persisted across page refreshes when possible).
   */
  init(options?: { userId?: string | null }): Promise<void>;

  /**
   * Look up the current user's subscription status. May be called as often
   * as needed; implementations should cache internally where appropriate.
   */
  getCustomerStatus(userId?: string): Promise<SubscriptionStatus>;

  /**
   * Open the provider's hosted paywall and resolve once the user dismisses
   * it or completes a purchase.
   */
  presentPaywall(options?: PresentPaywallOptions): Promise<PresentPaywallResult>;

  /**
   * Re-sync the user's purchases from the provider's servers (e.g. after
   * a user signs back in on a new device).
   */
  restorePurchases(): Promise<RestoreResult>;

  /** Attach a user id to the current SDK session. Aliases anonymous → user. */
  identify(userId: string): Promise<void>;

  /** Drop the current user id back to anonymous. */
  logout(): Promise<void>;
}
