-- =============================================================================
-- migration_005_wellness_dna.sql
-- =============================================================================
-- Adds the "Wellness DNA" fields to `public.user_profiles`. Each ALTER is
-- guarded with `IF NOT EXISTS` so the migration is idempotent.
--
-- Note: the user-facing spec calls this the `profiles` table; the canonical
-- table in this project is `public.user_profiles` (see migration.sql).
-- =============================================================================

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS wellness_goal       TEXT,
  ADD COLUMN IF NOT EXISTS dietary_preference  TEXT,
  ADD COLUMN IF NOT EXISTS allergies           TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Optional sanity index for queries that filter by wellness goal (cheap,
-- ignored when the column is mostly NULL).
CREATE INDEX IF NOT EXISTS idx_user_profiles_wellness_goal
  ON public.user_profiles (wellness_goal)
  WHERE wellness_goal IS NOT NULL;

DO $$
BEGIN
  RAISE NOTICE 'migration_005_wellness_dna applied — wellness_goal / dietary_preference / allergies columns ready.';
END $$;
