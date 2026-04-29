-- =============================================================================
-- Fitto - Patch 002 · Referral Loop
-- =============================================================================
-- Run AFTER the canonical /app/migration.sql.
--
-- Adds:
--   • user_profiles.referrer_user_id (UUID, optional, FK auth.users)
--   • Updated handle_new_user() trigger that, when raw_user_meta_data contains
--     `referrer_user_id`, stores it on the new profile and bumps both users'
--     subscriptions.ai_requests_limit by 70 (≈ 1 week of AI Coach quota).
-- =============================================================================

-- 1. New column ---------------------------------------------------------------
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS referrer_user_id UUID
  REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_profiles_referrer
  ON public.user_profiles(referrer_user_id)
  WHERE referrer_user_id IS NOT NULL;

-- 2. Replace the auto-create trigger -----------------------------------------
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
      IF v_ref = NEW.id THEN v_ref := NULL; END IF;
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

  INSERT INTO public.subscriptions (user_id, ai_requests_limit)
  VALUES (NEW.id, 10 + (CASE WHEN v_ref IS NOT NULL THEN REFERRAL_BONUS ELSE 0 END))
  ON CONFLICT DO NOTHING;
  INSERT INTO public.trial_status (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;

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

DO $$
BEGIN
  RAISE NOTICE '✅ Referral loop patch applied. Sign-up via /auth/signup?ref=<uuid> now bumps both users by 70 AI requests.';
END $$;
