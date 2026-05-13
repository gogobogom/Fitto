'use client';

/**
 * SubscriptionContext
 *
 * Single source of truth for `isPremium` across the app. The flag is
 * derived from the same `fitto_subscription` localStorage entry that
 * `SubscriptionManager` writes from both the RevenueCat (native) and
 * Supabase (web) flows, so the gate stays accurate even when the
 * backend is unreachable.
 *
 * Listens to `storage` events + a custom `fitto:subscription-changed`
 * event so any caller can trigger a refresh without prop-drilling.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';

const STORAGE_KEY_SUBSCRIPTION = 'fitto_subscription';
const SUBSCRIPTION_EVENT = 'fitto:subscription-changed';

interface SubscriptionSnapshot {
  isActive: boolean;
  expiresAt: string | null;
}

interface SubscriptionContextValue {
  isPremium: boolean;
  expiresAt: string | null;
  refresh: () => void;
}

const defaultValue: SubscriptionContextValue = {
  isPremium: false,
  expiresAt: null,
  refresh: () => {},
};

const SubscriptionContext = createContext<SubscriptionContextValue>(defaultValue);

function readSnapshot(): SubscriptionSnapshot {
  if (typeof window === 'undefined') return { isActive: false, expiresAt: null };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_SUBSCRIPTION);
    if (!raw) return { isActive: false, expiresAt: null };
    const parsed = JSON.parse(raw) as Partial<SubscriptionSnapshot>;
    const expiresAt = parsed?.expiresAt ?? null;
    // If we have an expiry date and it's already in the past, treat as expired.
    if (expiresAt && Number.isFinite(Date.parse(expiresAt)) && Date.parse(expiresAt) < Date.now()) {
      return { isActive: false, expiresAt };
    }
    return { isActive: parsed?.isActive === true, expiresAt };
  } catch (err) {
    console.error('[SubscriptionContext] failed to read snapshot:', err);
    return { isActive: false, expiresAt: null };
  }
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<SubscriptionSnapshot>({ isActive: false, expiresAt: null });

  const refresh = useCallback(() => {
    setSnapshot(readSnapshot());
  }, []);

  useEffect(() => {
    refresh();
    if (typeof window === 'undefined') return;
    const onStorage = (e: StorageEvent): void => {
      if (e.key === STORAGE_KEY_SUBSCRIPTION) refresh();
    };
    const onCustom = (): void => refresh();
    window.addEventListener('storage', onStorage);
    window.addEventListener(SUBSCRIPTION_EVENT, onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(SUBSCRIPTION_EVENT, onCustom);
    };
  }, [refresh]);

  const value = useMemo<SubscriptionContextValue>(
    () => ({ isPremium: snapshot.isActive, expiresAt: snapshot.expiresAt, refresh }),
    [snapshot, refresh],
  );

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription(): SubscriptionContextValue {
  return useContext(SubscriptionContext);
}

/**
 * Convenience helper for any code path that mutates the premium snapshot
 * (e.g. RevenueCat purchase callback, Supabase fetch). Writes the value
 * and notifies in-process subscribers via a custom event.
 */
export function broadcastSubscriptionChange(
  isActive: boolean,
  expiresAt: string | null,
): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY_SUBSCRIPTION,
      JSON.stringify({ isActive, expiresAt }),
    );
    window.dispatchEvent(new Event(SUBSCRIPTION_EVENT));
  } catch (err) {
    console.error('[SubscriptionContext] failed to broadcast:', err);
  }
}
