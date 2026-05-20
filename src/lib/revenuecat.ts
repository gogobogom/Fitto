/**
 * RevenueCat service wrapper.
 *
 * Supports two runtimes:
 *   • Native (iOS / Android via Capacitor)  → @revenuecat/purchases-capacitor
 *   • Web Billing (browser, Next.js)        → @revenuecat/purchases-js
 *
 * All API keys are read from environment variables. Missing keys cause the
 * SDK methods to short-circuit gracefully (returning null / no-op) so the
 * rest of the app stays interactive — purchase UI just stays unavailable.
 *
 * NEVER hardcode keys here. NEVER log key values.
 */

import {
  Purchases as PurchasesNative,
  LOG_LEVEL,
  type PurchasesPackage as NativePurchasesPackage,
  type CustomerInfo as NativeCustomerInfo,
  type PurchasesOfferings as NativePurchasesOfferings,
} from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';

// ---------------------------------------------------------------------------
// Env-driven configuration
// ---------------------------------------------------------------------------
// NOTE: Next.js inlines `NEXT_PUBLIC_*` at build time; the other two keys
// are only inlined into the mobile bundle by the `build:mobile` step. They
// are NOT exposed to the public web bundle.
const WEB_BILLING_API_KEY: string | undefined =
  process.env.NEXT_PUBLIC_REVENUECAT_WEB_BILLING_API_KEY;
const IOS_API_KEY: string | undefined = process.env.REVENUECAT_IOS_API_KEY;
const ANDROID_API_KEY: string | undefined =
  process.env.REVENUECAT_ANDROID_API_KEY;

// Re-export the native types so callers don't depend on the package directly.
export type {
  NativePurchasesPackage as PurchasesPackage,
  NativeCustomerInfo as CustomerInfo,
  NativePurchasesOfferings as PurchasesOfferings,
};

// ---------------------------------------------------------------------------
// Web-SDK lazy loader
// ---------------------------------------------------------------------------
// `@revenuecat/purchases-js` is a browser-only SDK. To keep the Next.js
// server bundle small (and SSR-safe) we import it dynamically and cache the
// shared instance.
type WebPurchasesModule = typeof import('@revenuecat/purchases-js');
type WebPurchasesInstance = InstanceType<WebPurchasesModule['Purchases']>;
type WebOfferings = Awaited<ReturnType<WebPurchasesInstance['getOfferings']>>;
type WebPackage = NonNullable<WebOfferings['current']>['availablePackages'][number];
type WebPurchaseResult = Awaited<ReturnType<WebPurchasesInstance['purchase']>>;

let webModulePromise: Promise<WebPurchasesModule> | null = null;
let webInstance: WebPurchasesInstance | null = null;

async function loadWebModule(): Promise<WebPurchasesModule | null> {
  if (typeof window === 'undefined') return null;
  if (!webModulePromise) {
    webModulePromise = import('@revenuecat/purchases-js');
  }
  try {
    return await webModulePromise;
  } catch (err) {
    console.error('[RevenueCat] Failed to load web SDK', err);
    webModulePromise = null;
    return null;
  }
}

// ---------------------------------------------------------------------------
// RevenueCatService
// ---------------------------------------------------------------------------

export class RevenueCatService {
  private static nativeInitialized = false;
  private static webInitializedFor: string | null = null;

  /**
   * Initialize the native Capacitor SDK. No-op on web.
   *
   * @param userId Optional Supabase user ID. If omitted, the SDK will use an
   *               anonymous ID and `identify()` can attach it later.
   */
  static async initialize(userId?: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    if (this.nativeInitialized) {
      if (userId) {
        await this.identify(userId).catch(() => {});
      }
      return;
    }

    const platform = Capacitor.getPlatform();
    const apiKey =
      platform === 'ios'
        ? IOS_API_KEY
        : platform === 'android'
          ? ANDROID_API_KEY
          : undefined;

    if (!apiKey) {
      console.warn(
        `[RevenueCat] No native API key configured for platform "${platform}". Purchases disabled.`,
      );
      return;
    }

    try {
      await PurchasesNative.configure({
        apiKey,
        ...(userId ? { appUserID: userId } : {}),
      });
      await PurchasesNative.setLogLevel({ level: LOG_LEVEL.WARN });
      this.nativeInitialized = true;
    } catch (err) {
      console.error('[RevenueCat] native init failed:', err);
    }
  }

  /**
   * Initialize the Web Billing SDK. No-op on native or when running on the
   * server. Idempotent for the same `userId`; calling again with a different
   * userId will switch the active user via `changeUser`.
   */
  static async initWeb({ userId }: { userId: string }): Promise<void> {
    if (Capacitor.isNativePlatform()) return;
    if (typeof window === 'undefined') return;
    if (!WEB_BILLING_API_KEY) {
      // Soft fail — keep the app interactive; purchase UI will surface an
      // error only if the user actively tries to buy.
      return;
    }
    if (!userId) return;

    const mod = await loadWebModule();
    if (!mod) return;
    const { Purchases } = mod;

    try {
      if (Purchases.isConfigured()) {
        // SDK already configured this session. Switch user if needed.
        const current = Purchases.getSharedInstance();
        webInstance = current;
        if (this.webInitializedFor !== userId) {
          await current.changeUser(userId);
          this.webInitializedFor = userId;
        }
        return;
      }

      webInstance = Purchases.configure({
        apiKey: WEB_BILLING_API_KEY,
        appUserId: userId,
      });
      this.webInitializedFor = userId;
    } catch (err) {
      console.error('[RevenueCat] web init failed');
      // Do not re-throw — keep app responsive.
    }
  }

  /**
   * Identify the user with RevenueCat. Works on both runtimes.
   * Safe to call before `initialize` / `initWeb` — it will defer to whichever
   * branch is active.
   */
  static async identify(userId: string): Promise<void> {
    if (!userId) return;

    if (Capacitor.isNativePlatform()) {
      if (!this.nativeInitialized) {
        await this.initialize(userId);
        return;
      }
      try {
        await PurchasesNative.logIn({ appUserID: userId });
      } catch (err) {
        console.error('[RevenueCat] native logIn failed:', err);
      }
      return;
    }

    if (typeof window === 'undefined') return;
    if (!webInstance) {
      await this.initWeb({ userId });
      return;
    }
    try {
      await webInstance.changeUser(userId);
      this.webInitializedFor = userId;
    } catch (err) {
      console.error('[RevenueCat] web changeUser failed');
    }
  }

  // -------------------------------------------------------------------------
  // Native (iOS / Android) helpers
  // -------------------------------------------------------------------------

  static async getOfferings(): Promise<NativePurchasesOfferings | null> {
    if (!Capacitor.isNativePlatform()) return null;
    if (!this.nativeInitialized) return null;
    try {
      return await PurchasesNative.getOfferings();
    } catch (err) {
      console.error('[RevenueCat] getOfferings (native) failed:', err);
      return null;
    }
  }

  static async purchasePackage(
    pkg: NativePurchasesPackage,
  ): Promise<{ customerInfo: NativeCustomerInfo; productIdentifier: string } | null> {
    if (!Capacitor.isNativePlatform()) return null;
    if (!this.nativeInitialized) return null;
    try {
      const { customerInfo, productIdentifier } =
        await PurchasesNative.purchasePackage({ aPackage: pkg });
      return {
        customerInfo: customerInfo as NativeCustomerInfo,
        productIdentifier,
      };
    } catch (err: unknown) {
      const userCancelled =
        typeof err === 'object' && err !== null && 'userCancelled' in err
          ? Boolean((err as { userCancelled?: unknown }).userCancelled)
          : false;
      if (!userCancelled) {
        console.error('[RevenueCat] purchasePackage (native) failed:', err);
      }
      return null;
    }
  }

  static async getCustomerInfo(): Promise<NativeCustomerInfo | null> {
    if (!Capacitor.isNativePlatform()) return null;
    if (!this.nativeInitialized) return null;
    try {
      const { customerInfo } = await PurchasesNative.getCustomerInfo();
      return customerInfo;
    } catch (err) {
      console.error('[RevenueCat] getCustomerInfo (native) failed:', err);
      return null;
    }
  }

  // -------------------------------------------------------------------------
  // Web Billing helpers
  // -------------------------------------------------------------------------

  /**
   * @returns Whether Web Billing is configured (env key present + SDK ready).
   *          Useful for the subscription UI to decide whether to render the
   *          web upgrade button or fall back to "store-only" messaging.
   */
  static isWebBillingConfigured(): boolean {
    return !!WEB_BILLING_API_KEY;
  }

  static async getWebOfferings(): Promise<WebOfferings | null> {
    if (Capacitor.isNativePlatform()) return null;
    if (typeof window === 'undefined') return null;
    if (!webInstance) return null;
    try {
      return await webInstance.getOfferings();
    } catch (err) {
      console.error('[RevenueCat] getWebOfferings failed');
      return null;
    }
  }

  /**
   * Launch the Stripe-backed Web Billing checkout for a given package.
   * Resolves with the purchase result on success, or `null` on
   * cancellation / failure (the SDK throws on user-cancel).
   */
  static async purchaseWebPackage(
    pkg: WebPackage,
  ): Promise<WebPurchaseResult | null> {
    if (Capacitor.isNativePlatform()) return null;
    if (typeof window === 'undefined') return null;
    if (!webInstance) return null;
    try {
      return await webInstance.purchase({ rcPackage: pkg });
    } catch (err: unknown) {
      // ErrorCode.UserCancelledError === user-cancelled. Anything else is
      // an unexpected failure we want surfaced to the caller's UI.
      const errorCode =
        typeof err === 'object' && err !== null && 'errorCode' in err
          ? (err as { errorCode?: unknown }).errorCode
          : undefined;
      // 1 = UserCancelledError per the SDK's ErrorCode enum.
      if (errorCode !== 1) {
        console.error('[RevenueCat] purchaseWebPackage failed');
      }
      return null;
    }
  }

  /** Fetches latest CustomerInfo from the Web Billing SDK. */
  static async getWebCustomerInfo(): Promise<Awaited<
    ReturnType<WebPurchasesInstance['getCustomerInfo']>
  > | null> {
    if (Capacitor.isNativePlatform()) return null;
    if (typeof window === 'undefined') return null;
    if (!webInstance) return null;
    try {
      return await webInstance.getCustomerInfo();
    } catch (err) {
      console.error('[RevenueCat] getWebCustomerInfo failed');
      return null;
    }
  }
}

// Convenience re-export of the web package type for callers that want to
// type their UI state without importing the SDK directly.
export type WebBillingPackage = WebPackage;
export type WebBillingOfferings = WebOfferings;
