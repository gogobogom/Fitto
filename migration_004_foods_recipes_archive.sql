-- =============================================================================
-- migration_004_foods_recipes_archive.sql
-- =============================================================================
-- Adds two Supabase tables that serve as a *local archive* — the goal is to
-- progressively replace external food / recipe APIs (USDA FoodData Central,
-- OpenFoodFacts, third-party recipe APIs) with a cached, owned dataset.
--
-- This migration is ADDITIVE and IDEMPOTENT (CREATE TABLE IF NOT EXISTS +
-- explicit constraint names) so it is safe to apply on a database that
-- already has migration.sql + migration_002 + migration_003 applied.
--
-- Tables:
--   foods    — denormalized food cache (one row per source food item)
--   recipes  — user-authored and curated recipe archive
--
-- Both tables enable RLS with policies that mirror the conventions used by
-- the existing `food_database` table: public read, authenticated write,
-- ownership enforced on update/delete.
-- =============================================================================

-- Required by uuid_generate_v4() — already enabled by migration.sql but
-- kept here so this file can be applied stand-alone.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. FOODS — local archive of external food API hits
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.foods (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Display
  name            TEXT NOT NULL,
  name_tr         TEXT,
  brand           TEXT,
  category        TEXT NOT NULL DEFAULT 'general',
  -- Per-100g macros (mirrors food_database for query compatibility)
  calories        NUMERIC(8,2) NOT NULL,
  protein         NUMERIC(8,2) NOT NULL DEFAULT 0,
  carbs           NUMERIC(8,2) NOT NULL DEFAULT 0,
  fats            NUMERIC(8,2) NOT NULL DEFAULT 0,
  fiber           NUMERIC(8,2) NOT NULL DEFAULT 0,
  sugar           NUMERIC(8,2),
  sodium_mg       NUMERIC(8,2),
  -- Serving info
  serving_size    TEXT NOT NULL DEFAULT '100g',
  serving_size_g  NUMERIC(8,2),
  -- Sourcing — lets us trace each row back to the API it came from so
  -- we can re-sync without duplicating entries.
  source          TEXT NOT NULL DEFAULT 'manual'
                    CHECK (source IN ('manual', 'usda', 'openfoodfacts', 'curated', 'user')),
  source_id       TEXT,
  barcode         TEXT,
  -- Audit
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_synced_at  TIMESTAMPTZ
);

-- One row per (source, source_id) pair so re-imports upsert cleanly.
CREATE UNIQUE INDEX IF NOT EXISTS idx_foods_source_source_id
  ON public.foods (source, source_id)
  WHERE source_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_foods_name    ON public.foods (lower(name));
CREATE INDEX IF NOT EXISTS idx_foods_name_tr ON public.foods (lower(name_tr)) WHERE name_tr IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_foods_barcode ON public.foods (barcode) WHERE barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_foods_category ON public.foods (category);

ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS foods_select_all     ON public.foods;
DROP POLICY IF EXISTS foods_insert_auth    ON public.foods;
DROP POLICY IF EXISTS foods_update_own     ON public.foods;
DROP POLICY IF EXISTS foods_delete_own     ON public.foods;

CREATE POLICY foods_select_all
  ON public.foods FOR SELECT
  USING (true);

CREATE POLICY foods_insert_auth
  ON public.foods FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY foods_update_own
  ON public.foods FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY foods_delete_own
  ON public.foods FOR DELETE
  USING (created_by = auth.uid());

-- -----------------------------------------------------------------------------
-- 2. RECIPES — local recipe archive (user-authored + curated)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recipes (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Display
  title                TEXT NOT NULL,
  title_tr             TEXT,
  description          TEXT,
  description_tr       TEXT,
  image_url            TEXT,
  -- Structured content (kept as JSONB so the client can render markdown,
  -- structured ingredients, or both without a second migration).
  ingredients          JSONB NOT NULL DEFAULT '[]'::jsonb,
  instructions         JSONB NOT NULL DEFAULT '[]'::jsonb,
  tags                 TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  -- Servings & timing
  servings             INTEGER NOT NULL DEFAULT 1 CHECK (servings >= 1),
  prep_time_minutes    INTEGER CHECK (prep_time_minutes IS NULL OR prep_time_minutes >= 0),
  cook_time_minutes    INTEGER CHECK (cook_time_minutes IS NULL OR cook_time_minutes >= 0),
  -- Per-serving macros (denormalized for fast listing)
  calories_per_serving NUMERIC(8,2),
  protein_per_serving  NUMERIC(8,2),
  carbs_per_serving    NUMERIC(8,2),
  fats_per_serving     NUMERIC(8,2),
  -- Classification & sourcing
  category             TEXT NOT NULL DEFAULT 'general',
  cuisine              TEXT,
  difficulty           TEXT CHECK (difficulty IS NULL OR difficulty IN ('easy', 'medium', 'hard')),
  source               TEXT NOT NULL DEFAULT 'user'
                         CHECK (source IN ('user', 'curated', 'imported')),
  source_url           TEXT,
  -- Visibility
  is_public            BOOLEAN NOT NULL DEFAULT FALSE,
  -- Audit
  created_by           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipes_created_by ON public.recipes (created_by);
CREATE INDEX IF NOT EXISTS idx_recipes_title      ON public.recipes (lower(title));
CREATE INDEX IF NOT EXISTS idx_recipes_category   ON public.recipes (category);
CREATE INDEX IF NOT EXISTS idx_recipes_tags       ON public.recipes USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_recipes_is_public  ON public.recipes (is_public) WHERE is_public = TRUE;

ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS recipes_select_visible ON public.recipes;
DROP POLICY IF EXISTS recipes_insert_own     ON public.recipes;
DROP POLICY IF EXISTS recipes_update_own     ON public.recipes;
DROP POLICY IF EXISTS recipes_delete_own     ON public.recipes;

-- Public recipes are readable by everyone; private recipes only by author.
CREATE POLICY recipes_select_visible
  ON public.recipes FOR SELECT
  USING (is_public = TRUE OR created_by = auth.uid());

CREATE POLICY recipes_insert_own
  ON public.recipes FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY recipes_update_own
  ON public.recipes FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY recipes_delete_own
  ON public.recipes FOR DELETE
  USING (created_by = auth.uid());

-- -----------------------------------------------------------------------------
-- 3. updated_at triggers (reuse the helper from migration.sql if present,
--    otherwise create it here)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_foods_updated_at   ON public.foods;
CREATE TRIGGER trg_foods_updated_at
  BEFORE UPDATE ON public.foods
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_recipes_updated_at ON public.recipes;
CREATE TRIGGER trg_recipes_updated_at
  BEFORE UPDATE ON public.recipes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- DONE
-- =============================================================================
DO $$
BEGIN
  RAISE NOTICE 'migration_004_foods_recipes_archive applied — foods + recipes tables ready.';
END $$;
