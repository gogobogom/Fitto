-- =============================================================================
-- Migration 003 — Wire water_logs into daily_summaries.total_water_ml
-- =============================================================================
-- The original recalc_daily_summary() function only aggregated meals and
-- exercises, leaving daily_summaries.total_water_ml permanently at 0.  This
-- migration:
--   1. Updates recalc_daily_summary() to also pull today's ml from water_logs.
--   2. Adds an AFTER INSERT/UPDATE/DELETE trigger on water_logs so changes
--      propagate to the matching daily_summaries row immediately.
-- Idempotent — safe to re-run.
-- =============================================================================

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
  v_total_water_ml    INTEGER      := 0;
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

  -- NEW: aggregate water intake from water_logs (1 row per user/day)
  SELECT COALESCE(SUM(ml), 0)
  INTO v_total_water_ml
  FROM public.water_logs
  WHERE user_id = p_user_id AND date = p_date;

  INSERT INTO public.daily_summaries (
    user_id, date,
    total_calories, total_protein, total_carbs, total_fats,
    meals_logged, exercises_logged, exercise_calories,
    total_water_ml
  ) VALUES (
    p_user_id, p_date,
    v_total_calories, v_total_protein, v_total_carbs, v_total_fats,
    v_meals_logged, v_exercises_logged, v_exercise_calories,
    v_total_water_ml
  )
  ON CONFLICT (user_id, date) DO UPDATE SET
    total_calories    = EXCLUDED.total_calories,
    total_protein     = EXCLUDED.total_protein,
    total_carbs       = EXCLUDED.total_carbs,
    total_fats        = EXCLUDED.total_fats,
    meals_logged      = EXCLUDED.meals_logged,
    exercises_logged  = EXCLUDED.exercises_logged,
    exercise_calories = EXCLUDED.exercise_calories,
    total_water_ml    = EXCLUDED.total_water_ml,
    updated_at        = NOW();
END;
$$;

-- -----------------------------------------------------------------------------
-- water_logs trigger — recompute daily_summaries on any change
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_water_log_recalc()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalc_daily_summary(OLD.user_id, OLD.date);
    RETURN OLD;
  ELSE
    PERFORM public.recalc_daily_summary(NEW.user_id, NEW.date);
    IF TG_OP = 'UPDATE' AND (OLD.user_id <> NEW.user_id OR OLD.date <> NEW.date) THEN
      PERFORM public.recalc_daily_summary(OLD.user_id, OLD.date);
    END IF;
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_water_logs_recalc ON public.water_logs;
CREATE TRIGGER trg_water_logs_recalc
  AFTER INSERT OR UPDATE OR DELETE ON public.water_logs
  FOR EACH ROW EXECUTE FUNCTION public.trg_water_log_recalc();

DO $$ BEGIN
  RAISE NOTICE '✅ Migration 003 applied — daily_summaries.total_water_ml is now kept in sync with water_logs.';
END $$;
