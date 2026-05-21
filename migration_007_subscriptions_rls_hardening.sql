-- =============================================================================
-- migration_007_subscriptions_rls_hardening.sql
-- =============================================================================
-- Hardens Row Level Security on public.subscriptions so that authenticated
-- end-users can READ their own row but can NEVER write to it directly.
--
-- BEFORE this migration:
--   • subscriptions_select_own  — authenticated user can SELECT their row
--   • subscriptions_insert_own  — authenticated user can INSERT their row  <-- exploitable
--   • subscriptions_update_own  — authenticated user can UPDATE their row  <-- exploitable
--   • subscriptions_delete_own  — authenticated user can DELETE their row  <-- exploitable
--
-- AFTER this migration:
--   • subscriptions_select_own  — UNCHANGED (kept so the UI can render plan info)
--   • (insert / update / delete policies removed)
--
-- Allowed writers after this change:
--   1. The /api/revenuecat/webhook Next.js route, via the service-role
--      Supabase client. The service role bypasses RLS by design.
--   2. The public.handle_new_user() trigger (SECURITY DEFINER) which seeds a
--      `free` row when a new auth.users record is created. SECURITY DEFINER
--      bypasses RLS.
--   3. The referral bonus path in public.claim_referral_code()
--      (SECURITY DEFINER) which bumps ai_requests_limit. Bypasses RLS.
--
-- Why this is safe:
--   • End-user-facing frontend code no longer writes to `subscriptions`
--     (the SubscriptionManager web flow now drives RevenueCat Web Billing
--     instead of an INSERT/UPDATE; the canonical row is written by the
--     webhook). See: src/components/SubscriptionManager.tsx.
--   • The webhook authenticates via REVENUECAT_WEBHOOK_SECRET before any
--     DB write — see src/app/api/revenuecat/webhook/route.ts.
--   • SECURITY DEFINER triggers/functions continue to work because they run
--     as the function owner (postgres / supabase_admin), not the caller.
--
-- This migration is idempotent — every drop uses IF EXISTS, and it can be
-- re-applied safely.
-- =============================================================================

-- 1. Drop the three permissive write policies. Safe to run multiple times.
DROP POLICY IF EXISTS subscriptions_insert_own ON public.subscriptions;
DROP POLICY IF EXISTS subscriptions_update_own ON public.subscriptions;
DROP POLICY IF EXISTS subscriptions_delete_own ON public.subscriptions;

-- 2. Sanity check: keep the SELECT policy in place. Re-create only if it is
--    missing (so this file remains the single authoritative source for the
--    final desired state of subscriptions RLS).
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

-- 3. Make RLS explicit (already enabled by migration.sql; reasserted here so
--    the resulting state is self-contained if this file is ever applied to a
--    fresh project that somehow lacks the original ENABLE).
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 4. Final assertion. Emits a NOTICE so the migration run is auditable in
--    the Supabase logs without leaking PII.
DO $$
DECLARE
  policy_count INT;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename  = 'subscriptions'
    AND cmd IN ('INSERT', 'UPDATE', 'DELETE');

  IF policy_count > 0 THEN
    RAISE EXCEPTION
      'subscriptions still has % write policies for authenticated role — RLS hardening failed',
      policy_count;
  END IF;

  RAISE NOTICE 'migration_007 ✓ subscriptions write policies removed; SELECT-own retained.';
END $$;
