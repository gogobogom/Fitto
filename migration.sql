-- =============================================================================
-- FITTO - CLEAN MIGRATION (Realigned schema, matching application code)
-- =============================================================================
-- Run this in: Supabase Dashboard → SQL Editor → New query
--
-- This migration:
--   • Drops the legacy mismatched tables (profiles, daily_logs, food_items, exercise_logs, ...)
--   • Creates the canonical tables actually queried by the running app:
--       user_profiles, user_goals, meals, exercises, food_database,
--       daily_summaries, body_measurements, water_logs, ai_messages,
--       subscriptions, trial_status
--   • Links primary keys correctly to auth.users(id) via user_id
--   • Enables Row Level Security with proper auth.uid() policies
--   • Creates triggers to auto-create user_profiles on signup
--   • Enables Supabase Realtime on the relevant tables
--   • Seeds food_database with 30 common Turkish + International foods
-- =============================================================================

-- 1. EXTENSIONS --------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CLEAN UP LEGACY OBJECTS -------------------------------------------------
-- Drop in dependency-safe order. CASCADE removes any FK-dependent objects.
DROP TABLE IF EXISTS public.admin_audit_logs CASCADE;
DROP TABLE IF EXISTS public.admin_sessions CASCADE;
DROP TABLE IF EXISTS public.admin_users CASCADE;
DROP TABLE IF EXISTS public.ai_messages CASCADE;
DROP TABLE IF EXISTS public.recipes CASCADE;
DROP TABLE IF EXISTS public.supplement_completion_summaries CASCADE;
DROP TABLE IF EXISTS public.supplement_logs CASCADE;
DROP TABLE IF EXISTS public.supplements CASCADE;
DROP TABLE IF EXISTS public.mood_trend_summaries CASCADE;
DROP TABLE IF EXISTS public.mood_entries CASCADE;
DROP TABLE IF EXISTS public.habit_streak_status CASCADE;
DROP TABLE IF EXISTS public.habit_logs CASCADE;
DROP TABLE IF EXISTS public.habits CASCADE;
DROP TABLE IF EXISTS public.progress_photos CASCADE;
DROP TABLE IF EXISTS public.body_measurements CASCADE;
DROP TABLE IF EXISTS public.exercise_logs CASCADE;
DROP TABLE IF EXISTS public.exercises CASCADE;
DROP TABLE IF EXISTS public.favorite_food_status CASCADE;
DROP TABLE IF EXISTS public.favorite_foods CASCADE;
DROP TABLE IF EXISTS public.daily_summaries CASCADE;
DROP TABLE IF EXISTS public.daily_logs CASCADE;
DROP TABLE IF EXISTS public.meals CASCADE;
DROP TABLE IF EXISTS public.water_logs CASCADE;
DROP TABLE IF EXISTS public.food_items CASCADE;
DROP TABLE IF EXISTS public.food_database CASCADE;
DROP TABLE IF EXISTS public.ad_credits CASCADE;
DROP TABLE IF EXISTS public.trial_status CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.user_goals CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 3. SHARED HELPERS ----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

-- 4. CORE PROFILE TABLES -----------------------------------------------------
CREATE TABLE public.user_profiles (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name         TEXT,
  username          TEXT,
  email             TEXT,
  age               INTEGER,
  weight_kg         NUMERIC(5,2),
  height_cm         NUMERIC(5,2),
  gender            TEXT CHECK (gender IN ('male','female','other')),
  activity_level    TEXT CHECK (activity_level IN ('sedentary','lightlyActive','moderatelyActive','veryActive','extraActive')),
  referrer_user_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_user_profiles_user_id  ON public.user_profiles(user_id);
CREATE INDEX idx_user_profiles_referrer ON public.user_profiles(referrer_user_id) WHERE referrer_user_id IS NOT NULL;
CREATE TRIGGER trg_user_profiles_updated
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.user_goals (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_type             TEXT CHECK (goal_type IN ('loseWeight','maintainWeight','gainWeight','buildMuscle')),
  target_weight_kg      NUMERIC(5,2),
  daily_calorie_target  INTEGER,
  protein_target_g      NUMERIC(8,2),
  carbs_target_g        NUMERIC(8,2),
  fat_target_g          NUMERIC(8,2),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_user_goals_user_id ON public.user_goals(user_id);
CREATE TRIGGER trg_user_goals_updated
  BEFORE UPDATE ON public.user_goals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. MEAL & EXERCISE LOGGING -------------------------------------------------
CREATE TABLE public.meals (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_name   TEXT NOT NULL,
  meal_type   TEXT CHECK (meal_type IN ('breakfast','lunch','dinner','snack')),
  calories    NUMERIC(8,2) NOT NULL DEFAULT 0,
  protein     NUMERIC(8,2) NOT NULL DEFAULT 0,
  carbs       NUMERIC(8,2) NOT NULL DEFAULT 0,
  fats        NUMERIC(8,2) NOT NULL DEFAULT 0,
  notes       TEXT,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_meals_user_date ON public.meals(user_id, date);
CREATE INDEX idx_meals_user_id   ON public.meals(user_id);

CREATE TABLE public.exercises (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_name     TEXT NOT NULL,
  sets              INTEGER,
  reps              INTEGER,
  weight            NUMERIC(8,2),
  duration_minutes  INTEGER,
  calories_burned   NUMERIC(8,2),
  notes             TEXT,
  date              DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_exercises_user_date ON public.exercises(user_id, date);

-- 6. FOOD DATABASE (shared, read-mostly) -------------------------------------
CREATE TABLE public.food_database (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             TEXT NOT NULL,
  name_tr          TEXT NOT NULL,
  calories         NUMERIC(8,2) NOT NULL,
  protein          NUMERIC(8,2) NOT NULL DEFAULT 0,
  carbs            NUMERIC(8,2) NOT NULL DEFAULT 0,
  fats             NUMERIC(8,2) NOT NULL DEFAULT 0,
  fiber            NUMERIC(8,2) NOT NULL DEFAULT 0,
  category         TEXT NOT NULL DEFAULT 'general',
  category_tr      TEXT NOT NULL DEFAULT 'genel',
  serving_size     TEXT NOT NULL DEFAULT '100g',
  serving_size_tr  TEXT NOT NULL DEFAULT '100g',
  barcode          TEXT,
  is_custom        BOOLEAN NOT NULL DEFAULT FALSE,
  created_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_food_database_name_tr ON public.food_database (lower(name_tr));
CREATE INDEX idx_food_database_name    ON public.food_database (lower(name));
CREATE INDEX idx_food_database_barcode ON public.food_database(barcode) WHERE barcode IS NOT NULL;

-- 7. DAILY ROLL-UPS, WATER, BODY MEASUREMENTS --------------------------------
CREATE TABLE public.daily_summaries (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date                DATE NOT NULL,
  total_calories      NUMERIC(8,2) NOT NULL DEFAULT 0,
  total_protein       NUMERIC(8,2) NOT NULL DEFAULT 0,
  total_carbs         NUMERIC(8,2) NOT NULL DEFAULT 0,
  total_fats          NUMERIC(8,2) NOT NULL DEFAULT 0,
  total_water_ml      INTEGER NOT NULL DEFAULT 0,
  meals_logged        INTEGER NOT NULL DEFAULT 0,
  exercises_logged    INTEGER NOT NULL DEFAULT 0,
  exercise_calories   NUMERIC(8,2) NOT NULL DEFAULT 0,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, date)
);
CREATE INDEX idx_daily_summaries_user_date ON public.daily_summaries(user_id, date);
CREATE TRIGGER trg_daily_summaries_updated
  BEFORE UPDATE ON public.daily_summaries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.water_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  glasses     INTEGER NOT NULL DEFAULT 0,
  ml          INTEGER NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, date)
);
CREATE TRIGGER trg_water_logs_updated
  BEFORE UPDATE ON public.water_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.body_measurements (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date                  DATE NOT NULL DEFAULT CURRENT_DATE,
  weight                NUMERIC(5,2) NOT NULL,
  body_fat_percentage   NUMERIC(4,2),
  muscle_mass           NUMERIC(5,2),
  waist                 NUMERIC(5,2),
  hips                  NUMERIC(5,2),
  chest                 NUMERIC(5,2),
  arms                  NUMERIC(5,2),
  legs                  NUMERIC(5,2),
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_body_measurements_user_date ON public.body_measurements(user_id, date);

-- 8. AI / SUBSCRIPTION (minimal) ---------------------------------------------
CREATE TABLE public.ai_messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ai_messages_user_id ON public.ai_messages(user_id);

CREATE TABLE public.subscriptions (
  user_id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type           TEXT NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free','premium','trial')),
  status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','canceled','expired')),
  started_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at          TIMESTAMPTZ,
  auto_renew          BOOLEAN NOT NULL DEFAULT FALSE,
  ai_requests_used    INTEGER NOT NULL DEFAULT 0,
  ai_requests_limit   INTEGER NOT NULL DEFAULT 10,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_subscriptions_updated
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.trial_status (
  user_id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_trial_active    BOOLEAN NOT NULL DEFAULT FALSE,
  trial_started_at   TIMESTAMPTZ,
  trial_ends_at      TIMESTAMPTZ,
  daily_trial_count  INTEGER NOT NULL DEFAULT 0,
  trial_limit        INTEGER NOT NULL DEFAULT 3,
  last_reset         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_trial_status_updated
  BEFORE UPDATE ON public.trial_status
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 9. AUTO-CREATE PROFILE ROW ON SIGNUP + REFERRAL CREDITING ------------------
-- Reads `raw_user_meta_data->>'referrer_user_id'` (set by the signup form when
-- ?ref=<uuid> is in the URL) and:
--   • stores it on the new user's profile,
--   • bumps both users' subscriptions.ai_requests_limit by 70 (≈ 1 week of
--     daily AI Coach quota at the default 10/day).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_ref_text TEXT;
  v_ref UUID;
  REFERRAL_BONUS CONSTANT INT := 70;
BEGIN
  v_ref_text := NEW.raw_user_meta_data->>'referrer_user_id';
  IF v_ref_text IS NOT NULL AND v_ref_text <> '' THEN
    BEGIN
      v_ref := v_ref_text::UUID;
      -- Don't allow self-referral
      IF v_ref = NEW.id THEN v_ref := NULL; END IF;
      -- Validate that the referrer actually exists
      IF v_ref IS NOT NULL AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_ref) THEN
        v_ref := NULL;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_ref := NULL;
    END;
  END IF;

  INSERT INTO public.user_profiles (user_id, email, full_name, username, referrer_user_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    v_ref
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- New user gets a base subscription with the referral bonus already applied
  INSERT INTO public.subscriptions (user_id, ai_requests_limit)
  VALUES (NEW.id, 10 + (CASE WHEN v_ref IS NOT NULL THEN REFERRAL_BONUS ELSE 0 END))
  ON CONFLICT DO NOTHING;
  INSERT INTO public.trial_status (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;

  -- Reward the referrer too
  IF v_ref IS NOT NULL THEN
    INSERT INTO public.subscriptions (user_id, ai_requests_limit)
    VALUES (v_ref, 10 + REFERRAL_BONUS)
    ON CONFLICT (user_id) DO UPDATE
      SET ai_requests_limit = public.subscriptions.ai_requests_limit + REFERRAL_BONUS,
          updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. ROW LEVEL SECURITY -----------------------------------------------------
ALTER TABLE public.user_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_goals         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_summaries    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_measurements  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trial_status       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_database      ENABLE ROW LEVEL SECURITY;

-- Owner-only policies for personal tables
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'user_profiles','user_goals','meals','exercises','daily_summaries',
    'water_logs','body_measurements','ai_messages','subscriptions','trial_status'
  ] LOOP
    EXECUTE format('CREATE POLICY %I_select_own ON public.%I FOR SELECT TO authenticated USING (user_id = auth.uid())', t, t);
    EXECUTE format('CREATE POLICY %I_insert_own ON public.%I FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid())', t, t);
    EXECUTE format('CREATE POLICY %I_update_own ON public.%I FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())', t, t);
    EXECUTE format('CREATE POLICY %I_delete_own ON public.%I FOR DELETE TO authenticated USING (user_id = auth.uid())', t, t);
  END LOOP;
END $$;

-- food_database is readable by everyone, writable by row-creator only
CREATE POLICY food_database_select_all
  ON public.food_database FOR SELECT
  TO anon, authenticated
  USING (TRUE);

CREATE POLICY food_database_insert_own
  ON public.food_database FOR INSERT
  TO authenticated
  WITH CHECK (created_by IS NULL OR created_by = auth.uid());

CREATE POLICY food_database_update_own
  ON public.food_database FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- 11. DAILY SUMMARY AUTO-AGGREGATION ----------------------------------------
-- Recomputes the caller's daily_summaries row whenever meals or exercises change.
CREATE OR REPLACE FUNCTION public.recalc_daily_summary(p_user_id UUID, p_date DATE)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_total_calories    NUMERIC(8,2) := 0;
  v_total_protein     NUMERIC(8,2) := 0;
  v_total_carbs       NUMERIC(8,2) := 0;
  v_total_fats        NUMERIC(8,2) := 0;
  v_meals_logged      INTEGER      := 0;
  v_exercises_logged  INTEGER      := 0;
  v_exercise_calories NUMERIC(8,2) := 0;
BEGIN
  SELECT
    COALESCE(SUM(calories), 0),
    COALESCE(SUM(protein),  0),
    COALESCE(SUM(carbs),    0),
    COALESCE(SUM(fats),     0),
    COUNT(*)
  INTO v_total_calories, v_total_protein, v_total_carbs, v_total_fats, v_meals_logged
  FROM public.meals
  WHERE user_id = p_user_id AND date = p_date;

  SELECT
    COUNT(*),
    COALESCE(SUM(calories_burned), 0)
  INTO v_exercises_logged, v_exercise_calories
  FROM public.exercises
  WHERE user_id = p_user_id AND date = p_date;

  INSERT INTO public.daily_summaries (
    user_id, date, total_calories, total_protein, total_carbs, total_fats,
    meals_logged, exercises_logged, exercise_calories
  ) VALUES (
    p_user_id, p_date, v_total_calories, v_total_protein, v_total_carbs, v_total_fats,
    v_meals_logged, v_exercises_logged, v_exercise_calories
  )
  ON CONFLICT (user_id, date) DO UPDATE SET
    total_calories    = EXCLUDED.total_calories,
    total_protein     = EXCLUDED.total_protein,
    total_carbs       = EXCLUDED.total_carbs,
    total_fats        = EXCLUDED.total_fats,
    meals_logged      = EXCLUDED.meals_logged,
    exercises_logged  = EXCLUDED.exercises_logged,
    exercise_calories = EXCLUDED.exercise_calories,
    updated_at        = NOW();
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_meal_recalc()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    PERFORM public.recalc_daily_summary(OLD.user_id, OLD.date);
    RETURN OLD;
  ELSE
    PERFORM public.recalc_daily_summary(NEW.user_id, NEW.date);
    IF (TG_OP = 'UPDATE' AND (OLD.user_id, OLD.date) IS DISTINCT FROM (NEW.user_id, NEW.date)) THEN
      PERFORM public.recalc_daily_summary(OLD.user_id, OLD.date);
    END IF;
    RETURN NEW;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_exercise_recalc()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    PERFORM public.recalc_daily_summary(OLD.user_id, OLD.date);
    RETURN OLD;
  ELSE
    PERFORM public.recalc_daily_summary(NEW.user_id, NEW.date);
    IF (TG_OP = 'UPDATE' AND (OLD.user_id, OLD.date) IS DISTINCT FROM (NEW.user_id, NEW.date)) THEN
      PERFORM public.recalc_daily_summary(OLD.user_id, OLD.date);
    END IF;
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS meals_aggregate ON public.meals;
CREATE TRIGGER meals_aggregate
  AFTER INSERT OR UPDATE OR DELETE ON public.meals
  FOR EACH ROW EXECUTE FUNCTION public.trg_meal_recalc();

DROP TRIGGER IF EXISTS exercises_aggregate ON public.exercises;
CREATE TRIGGER exercises_aggregate
  AFTER INSERT OR UPDATE OR DELETE ON public.exercises
  FOR EACH ROW EXECUTE FUNCTION public.trg_exercise_recalc();

-- 12. REALTIME PUBLICATION ---------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE
  public.user_profiles,
  public.user_goals,
  public.meals,
  public.exercises,
  public.daily_summaries,
  public.water_logs,
  public.body_measurements;

-- 13. SEED FOOD DATABASE -----------------------------------------------------
INSERT INTO public.food_database (name, name_tr, calories, protein, carbs, fats, fiber, category, category_tr, serving_size, serving_size_tr) VALUES
  ('Chicken Breast (grilled)', 'Tavuk Göğsü (ızgara)', 165, 31, 0, 3.6, 0,    'protein',     'protein',    '100g', '100g'),
  ('Beef Steak',               'Dana Bonfile',         250, 26, 0, 17,  0,    'protein',     'protein',    '100g', '100g'),
  ('Salmon (cooked)',          'Somon (pişmiş)',       208, 22, 0, 13,  0,    'protein',     'protein',    '100g', '100g'),
  ('Tuna (canned in water)',   'Ton Balığı',           116, 26, 0, 1,   0,    'protein',     'protein',    '100g', '100g'),
  ('Egg (boiled)',             'Yumurta (haşlanmış)',  155, 13, 1.1, 11, 0,   'protein',     'protein',    '100g', '100g'),
  ('Greek Yogurt',             'Yoğurt (Süzme)',       97,  9,  3.6, 5,  0,   'dairy',       'sutUrunleri','100g', '100g'),
  ('Cheese (white)',           'Beyaz Peynir',         264, 17, 1.5, 21, 0,   'dairy',       'sutUrunleri','100g', '100g'),
  ('Milk (whole)',             'Süt (tam yağlı)',      61,  3.2, 4.8, 3.3, 0, 'dairy',       'sutUrunleri','100ml','100ml'),
  ('Rice (cooked)',            'Pirinç Pilavı',        130, 2.7, 28,  0.3, 0.4,'grains',     'tahillar',   '100g', '100g'),
  ('Bulgur Pilaf',             'Bulgur Pilavı',        83,  3,   18,  0.2, 4.5,'grains',     'tahillar',   '100g', '100g'),
  ('Whole Wheat Bread',        'Tam Buğday Ekmeği',    247, 13,  41,  3.4, 7,  'grains',     'tahillar',   '100g', '100g'),
  ('Pasta (cooked)',           'Makarna (pişmiş)',     131, 5,   25,  1.1, 1.8,'grains',     'tahillar',   '100g', '100g'),
  ('Oats',                     'Yulaf Ezmesi',         389, 16.9, 66, 6.9, 10.6,'grains',    'tahillar',   '100g', '100g'),
  ('Lentils (cooked)',         'Mercimek (pişmiş)',    116, 9,   20,  0.4, 7.9,'legumes',    'baklagiller','100g', '100g'),
  ('Chickpeas (cooked)',       'Nohut (pişmiş)',       164, 8.9, 27,  2.6, 7.6,'legumes',    'baklagiller','100g', '100g'),
  ('Beans (white, cooked)',    'Beyaz Fasulye',        139, 9.7, 25,  0.5, 6.3,'legumes',    'baklagiller','100g', '100g'),
  ('Tomato',                   'Domates',              18,  0.9, 3.9, 0.2, 1.2,'vegetables', 'sebzeler',   '100g', '100g'),
  ('Cucumber',                 'Salatalık',            16,  0.7, 3.6, 0.1, 0.5,'vegetables', 'sebzeler',   '100g', '100g'),
  ('Spinach',                  'Ispanak',              23,  2.9, 3.6, 0.4, 2.2,'vegetables', 'sebzeler',   '100g', '100g'),
  ('Potato (boiled)',          'Patates (haşlanmış)',  87,  1.9, 20,  0.1, 1.8,'vegetables', 'sebzeler',   '100g', '100g'),
  ('Carrot',                   'Havuç',                41,  0.9, 9.6, 0.2, 2.8,'vegetables', 'sebzeler',   '100g', '100g'),
  ('Apple',                    'Elma',                 52,  0.3, 14,  0.2, 2.4,'fruits',     'meyveler',   '100g', '100g'),
  ('Banana',                   'Muz',                  89,  1.1, 23,  0.3, 2.6,'fruits',     'meyveler',   '100g', '100g'),
  ('Orange',                   'Portakal',             47,  0.9, 12,  0.1, 2.4,'fruits',     'meyveler',   '100g', '100g'),
  ('Strawberry',               'Çilek',                32,  0.7, 7.7, 0.3, 2,  'fruits',     'meyveler',   '100g', '100g'),
  ('Avocado',                  'Avokado',              160, 2,   9,   15,  6.7,'fruits',     'meyveler',   '100g', '100g'),
  ('Almonds',                  'Badem',                579, 21,  22,  50,  12.5,'nuts',      'kuruyemis',  '100g', '100g'),
  ('Walnut',                   'Ceviz',                654, 15,  14,  65,  6.7,'nuts',       'kuruyemis',  '100g', '100g'),
  ('Olive Oil',                'Zeytinyağı',           884, 0,   0,   100, 0,  'fats',       'yaglar',     '100ml','100ml'),
  ('Honey',                    'Bal',                  304, 0.3, 82,  0,   0.2,'sweets',     'tatlilar',   '100g', '100g')
ON CONFLICT DO NOTHING;

-- 14. DONE -------------------------------------------------------------------
DO $$
BEGIN
  RAISE NOTICE '✅ Fitto canonical schema applied successfully.';
  RAISE NOTICE '   Tables: user_profiles, user_goals, meals, exercises, food_database,';
  RAISE NOTICE '           daily_summaries, water_logs, body_measurements,';
  RAISE NOTICE '           ai_messages, subscriptions, trial_status';
  RAISE NOTICE '   RLS:    enabled with auth.uid() owner policies';
  RAISE NOTICE '   Trigger: on_auth_user_created seeds user_profiles + subscriptions + trial_status';
  RAISE NOTICE '   Realtime: enabled on the user-facing tables';
  RAISE NOTICE '   Seed:    food_database now has 30 starter foods (TR/EN)';
END $$;
