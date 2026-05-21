-- =============================================================================
-- migration_008_subscriptions_bootstrap.sql
-- =============================================================================
-- Idempotently provisions `public.subscriptions` and locks down its RLS so
-- the only writer is the service-role / SECURITY DEFINER path.
--
-- Why this file exists:
--   Some Supabase projects never had the base migration.sql applied
--   end-to-end, so `public.subscriptions` may be missing. The earlier
--   `migration_007_subscriptions_rls_hardening.sql` assumed the table
--   already existed and therefore failed with
--     ERROR: relation "public.subscriptions" does not exist
--
-- This file is a superset of migration_007: it creates the table when
-- missing AND applies the hardened RLS, in one paste.
--
-- Safe to re-run. Safe on projects where the table already exists. Will not
-- drop or modify existing data.
--
-- Out of scope (NOT created here):
--   • handle_new_user() trigger — depends on user_profiles/user_goals
--     /trial_status, which are part of the base migration.sql. Subscriptions
--     will simply be created on first RevenueCat webhook event instead
--     (the SubscriptionManager UI gracefully renders "Ücretsiz" when the row
--     is absent, and the webhook does an upsert).
--   • Other tables (meals, profiles, food_database, etc.) — already exist.
-- =============================================================================

-- 1. Shared helper used by the updated_at trigger. CREATE OR REPLACE is
--    safe — no behavior change if it already exists.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

-- 2. Create the table only if missing. The full canonical schema matches
--    src/types/supabase.ts → `Subscription`.
CREATE TABLE IF NOT EXISTS public.subscriptions (
  user_id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type           TEXT        NOT NULL DEFAULT 'free'
                                  CHECK (plan_type IN ('free','premium','trial')),
  status              TEXT        NOT NULL DEFAULT 'active'
                                  CHECK (status   IN ('active','inactive','canceled','expired')),
  started_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at          TIMESTAMPTZ,
  auto_renew          BOOLEAN     NOT NULL DEFAULT FALSE,
  ai_requests_used    INTEGER     NOT NULL DEFAULT 0,
  ai_requests_limit   INTEGER     NOT NULL DEFAULT 10,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Defensive column backfill — if the table somehow exists with an older
--    partial shape, fill in anything missing. `ADD COLUMN IF NOT EXISTS`
--    is a no-op when the column is already there.
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS plan_type         TEXT        NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS status            TEXT        NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS started_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS expires_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS auto_renew        BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ai_requests_used  INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_requests_limit INTEGER     NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 4. `updated_at` BEFORE-UPDATE trigger. Drop-then-create so re-runs don't
--    leave a stale duplicate trigger behind.
DROP TRIGGER IF EXISTS trg_subscriptions_updated ON public.subscriptions;
CREATE TRIGGER trg_subscriptions_updated
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Enable Row Level Security. No-op if already enabled.
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 6. Remove any authenticated-role WRITE policies that might exist from a
--    prior partial run of migration.sql. We do NOT want end users to write
--    to this table directly — only the service role (RevenueCat webhook)
--    and SECURITY DEFINER functions (signup trigger, referral) may write.
DROP POLICY IF EXISTS subscriptions_insert_own ON public.subscriptions;
DROP POLICY IF EXISTS subscriptions_update_own ON public.subscriptions;
DROP POLICY IF EXISTS subscriptions_delete_own ON public.subscriptions;

-- 7. Create the SELECT-own policy if absent. Owners can read their plan so
--    the UI can render "Ücretsiz" / "Premium", expiry date, AI quota, etc.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'subscriptions'
      AND policyname = 'subscriptions_select_own'
  ) THEN
    EXECUTE 'CREATE POLICY subscriptions_select_own
               ON public.subscriptions
               FOR SELECT
               TO authenticated
               USING (user_id = auth.uid())';
  END IF;
END $$;

-- 8. Self-assertion. Fails loudly if any authenticated-role write policy
--    has survived; emits a NOTICE on success without leaking any data.
DO $$
DECLARE
  write_policies INT;
  has_select     INT;
BEGIN
  SELECT COUNT(*) INTO write_policies
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename  = 'subscriptions'
    AND 'authenticated' = ANY(roles)
    AND cmd IN ('INSERT','UPDATE','DELETE');

  SELECT COUNT(*) INTO has_select
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename  = 'subscriptions'
    AND policyname = 'subscriptions_select_own';

  IF write_policies > 0 THEN
    RAISE EXCEPTION
      'migration_008 FAILED: subscriptions still has % authenticated-write policies',
      write_policies;
  END IF;

  IF has_select = 0 THEN
    RAISE EXCEPTION
      'migration_008 FAILED: subscriptions_select_own policy is missing';
  END IF;

  RAISE NOTICE 'migration_008 OK  table=public.subscriptions  rls=on  policies=[select_own]  writers=[service_role, SECURITY DEFINER only]';
END $$;
