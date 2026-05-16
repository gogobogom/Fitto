-- =============================================================================
-- migration_006_wellness_dna_jsonb.sql
-- =============================================================================
-- Adds a structured `wellness_dna` JSONB column to `public.user_profiles`
-- so Mira can use a richer coaching profile.
--
-- Additive only:
--   * Existing columns (wellness_goal, dietary_preference, allergies) are
--     kept and continue to mirror the headline values from `wellness_dna`.
--   * The new column is nullable, with an empty-object default. Every
--     existing row stays valid.
--   * No RLS changes required — the policies created in `migration.sql`
--     for `user_profiles` already gate every column on `auth.uid()`.
--
-- Idempotent: `ADD COLUMN IF NOT EXISTS` + `CREATE INDEX IF NOT EXISTS`.
-- Safe to re-run.
-- =============================================================================

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS wellness_dna JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Cheap GIN index for any future queries that filter inside wellness_dna
-- (e.g. "users with vegan dietary_preference"). Optional but inexpensive.
CREATE INDEX IF NOT EXISTS idx_user_profiles_wellness_dna
  ON public.user_profiles
  USING GIN (wellness_dna);

DO $$
BEGIN
  RAISE NOTICE 'migration_006_wellness_dna_jsonb applied — wellness_dna JSONB column ready.';
END $$;
