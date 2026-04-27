-- ============================================================================
-- FITTO - Complete Supabase Database Setup
-- ============================================================================
-- Run this script in your Supabase SQL Editor to create all tables
-- URL: https://wkpsimlalongfpjwovtx.supabase.co
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE PROFILE TABLES
-- ============================================================================

-- User Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  height_cm NUMERIC(5,2) NOT NULL,
  weight_kg NUMERIC(5,2) NOT NULL,
  activity_level TEXT NOT NULL CHECK (activity_level IN ('sedentary', 'lightlyActive', 'moderatelyActive', 'veryActive', 'extraActive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Goals Table
CREATE TABLE IF NOT EXISTS user_goals (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('loseWeight', 'maintainWeight', 'gainWeight', 'buildMuscle')),
  target_weight_kg NUMERIC(5,2) NOT NULL,
  daily_calorie_target INTEGER NOT NULL,
  protein_target_g INTEGER NOT NULL,
  carbs_target_g INTEGER NOT NULL,
  fat_target_g INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
  identity UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'premium', 'trial')),
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'canceled', 'expired')),
  started_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT FALSE,
  ai_requests_used INTEGER DEFAULT 0,
  ai_requests_limit INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trial Status Table
CREATE TABLE IF NOT EXISTS trial_status (
  identity UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  is_trial_active BOOLEAN DEFAULT FALSE,
  trial_started_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  daily_trial_count INTEGER DEFAULT 0,
  trial_limit INTEGER DEFAULT 3,
  last_reset TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ad Credits Table
CREATE TABLE IF NOT EXISTS ad_credits (
  identity UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  ad_credits INTEGER DEFAULT 0,
  last_ad_watched TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- MEAL & NUTRITION TRACKING
-- ============================================================================

-- Food Items Table
CREATE TABLE IF NOT EXISTS food_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  calories NUMERIC(8,2) NOT NULL,
  protein NUMERIC(8,2) NOT NULL,
  carbs NUMERIC(8,2) NOT NULL,
  fats NUMERIC(8,2) NOT NULL,
  serving_size TEXT NOT NULL,
  barcode TEXT,
  is_custom BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_food_items_user_id ON food_items(user_id);
CREATE INDEX IF NOT EXISTS idx_food_items_barcode ON food_items(barcode) WHERE barcode IS NOT NULL;

-- Daily Logs Table
CREATE TABLE IF NOT EXISTS daily_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  food_item_id UUID REFERENCES food_items(id) ON DELETE SET NULL,
  food_name TEXT NOT NULL,
  calories NUMERIC(8,2) NOT NULL,
  protein NUMERIC(8,2) NOT NULL,
  carbs NUMERIC(8,2) NOT NULL,
  fats NUMERIC(8,2) NOT NULL,
  serving_size TEXT NOT NULL,
  quantity NUMERIC(8,2) DEFAULT 1,
  water_ml INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON daily_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_id ON daily_logs(user_id);

-- Daily Summaries Table
CREATE TABLE IF NOT EXISTS daily_summaries (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_calories NUMERIC(8,2) DEFAULT 0,
  total_protein NUMERIC(8,2) DEFAULT 0,
  total_carbs NUMERIC(8,2) DEFAULT 0,
  total_fats NUMERIC(8,2) DEFAULT 0,
  total_water INTEGER DEFAULT 0,
  meals_logged INTEGER DEFAULT 0,
  exercises_logged INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_summaries_user_id ON daily_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_summaries_date ON daily_summaries(date);

-- Favorite Foods Table
CREATE TABLE IF NOT EXISTS favorite_foods (
  identity UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  food_item_id UUID NOT NULL REFERENCES food_items(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  calories NUMERIC(8,2) NOT NULL,
  protein NUMERIC(8,2) NOT NULL,
  carbs NUMERIC(8,2) NOT NULL,
  fats NUMERIC(8,2) NOT NULL,
  serving_size TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (identity, food_item_id)
);

-- Favorite Food Status Table
CREATE TABLE IF NOT EXISTS favorite_food_status (
  identity UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  food_item_id UUID NOT NULL,
  is_favorited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (identity, food_item_id)
);

-- ============================================================================
-- EXERCISE TRACKING
-- ============================================================================

-- Exercise Logs Table
CREATE TABLE IF NOT EXISTS exercise_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  exercise_name TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  calories_burned NUMERIC(8,2) NOT NULL,
  intensity TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exercise_logs_user_date ON exercise_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_user_id ON exercise_logs(user_id);

-- ============================================================================
-- BODY MEASUREMENTS & PROGRESS
-- ============================================================================

-- Body Measurements Table
CREATE TABLE IF NOT EXISTS body_measurements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight NUMERIC(5,2) NOT NULL,
  body_fat_percentage NUMERIC(4,2),
  muscle_mass NUMERIC(5,2),
  waist NUMERIC(5,2),
  hips NUMERIC(5,2),
  chest NUMERIC(5,2),
  arms NUMERIC(5,2),
  legs NUMERIC(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_body_measurements_user_date ON body_measurements(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_body_measurements_user_id ON body_measurements(user_id);

-- Progress Photos Table
CREATE TABLE IF NOT EXISTS progress_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identity UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  photo_url TEXT NOT NULL,
  weight NUMERIC(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_progress_photos_identity ON progress_photos(identity);

-- ============================================================================
-- HABITS & MOOD TRACKING
-- ============================================================================

-- Habits Table
CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identity UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  target_count INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_habits_identity ON habits(identity);

-- Habit Logs Table
CREATE TABLE IF NOT EXISTS habit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  identity UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_date ON habit_logs(habit_id, date);
CREATE INDEX IF NOT EXISTS idx_habit_logs_identity ON habit_logs(identity);

-- Habit Streak Status Table
CREATE TABLE IF NOT EXISTS habit_streak_status (
  habit_id UUID PRIMARY KEY REFERENCES habits(id) ON DELETE CASCADE,
  identity UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_completed DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mood Entries Table
CREATE TABLE IF NOT EXISTS mood_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identity UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  mood_score INTEGER NOT NULL CHECK (mood_score >= 1 AND mood_score <= 10),
  energy_level INTEGER NOT NULL CHECK (energy_level >= 1 AND energy_level <= 10),
  stress_level INTEGER NOT NULL CHECK (stress_level >= 1 AND stress_level <= 10),
  sleep_quality INTEGER NOT NULL CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mood_entries_identity_date ON mood_entries(identity, date);

-- Mood Trend Summaries Table
CREATE TABLE IF NOT EXISTS mood_trend_summaries (
  identity UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  avg_mood NUMERIC(3,2) NOT NULL,
  avg_energy NUMERIC(3,2) NOT NULL,
  avg_stress NUMERIC(3,2) NOT NULL,
  avg_sleep NUMERIC(3,2) NOT NULL,
  total_entries INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (identity, period_start, period_end)
);

-- ============================================================================
-- SUPPLEMENTS
-- ============================================================================

-- Supplements Table
CREATE TABLE IF NOT EXISTS supplements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identity UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  time_of_day TEXT NOT NULL CHECK (time_of_day IN ('morning', 'afternoon', 'evening', 'any')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplements_identity ON supplements(identity);

-- Supplement Logs Table
CREATE TABLE IF NOT EXISTS supplement_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplement_id UUID NOT NULL REFERENCES supplements(id) ON DELETE CASCADE,
  identity UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  taken BOOLEAN DEFAULT FALSE,
  time_taken TIME,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplement_logs_supplement_date ON supplement_logs(supplement_id, date);

-- Supplement Completion Summaries Table
CREATE TABLE IF NOT EXISTS supplement_completion_summaries (
  supplement_id UUID PRIMARY KEY REFERENCES supplements(id) ON DELETE CASCADE,
  identity UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_doses INTEGER NOT NULL,
  completed_doses INTEGER NOT NULL,
  completion_rate NUMERIC(4,2) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- RECIPES
-- ============================================================================

-- Recipes Table
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identity UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  ingredients JSONB NOT NULL,
  instructions TEXT NOT NULL,
  prep_time_minutes INTEGER NOT NULL,
  cook_time_minutes INTEGER NOT NULL,
  servings INTEGER NOT NULL,
  calories_per_serving NUMERIC(8,2) NOT NULL,
  protein_per_serving NUMERIC(8,2) NOT NULL,
  carbs_per_serving NUMERIC(8,2) NOT NULL,
  fats_per_serving NUMERIC(8,2) NOT NULL,
  tags JSONB DEFAULT '[]'::JSONB,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipes_identity ON recipes(identity);
CREATE INDEX IF NOT EXISTS idx_recipes_tags ON recipes USING gin(tags);

-- ============================================================================
-- AI FEATURES
-- ============================================================================

-- AI Messages Table
CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identity UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_identity ON ai_messages(identity, created_at DESC);

-- ============================================================================
-- ADMIN SYSTEM
-- ============================================================================

-- Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
  identity UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'moderator')),
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin Sessions Table
CREATE TABLE IF NOT EXISTS admin_sessions (
  identity UUID PRIMARY KEY REFERENCES admin_users(identity) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);

-- Admin Audit Logs Table
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_identity UUID NOT NULL REFERENCES admin_users(identity) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('user_created', 'user_updated', 'user_deleted', 'subscription_modified', 'system_config_changed', 'feature_toggled')),
  target_identity UUID,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin ON admin_audit_logs(admin_identity, created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_food_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_streak_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_trend_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplements ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplement_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplement_completion_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read/write their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User Goals: Users can read/write their own goals
CREATE POLICY "Users can view own goals" ON user_goals FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own goals" ON user_goals FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own goals" ON user_goals FOR INSERT WITH CHECK (auth.uid() = id);

-- Subscriptions: Users can read/write their own subscription
CREATE POLICY "Users can view own subscription" ON subscriptions FOR SELECT USING (auth.uid() = identity);
CREATE POLICY "Users can update own subscription" ON subscriptions FOR UPDATE USING (auth.uid() = identity);
CREATE POLICY "Users can insert own subscription" ON subscriptions FOR INSERT WITH CHECK (auth.uid() = identity);

-- Trial Status: Users can read/write their own trial status
CREATE POLICY "Users can view own trial status" ON trial_status FOR SELECT USING (auth.uid() = identity);
CREATE POLICY "Users can update own trial status" ON trial_status FOR UPDATE USING (auth.uid() = identity);
CREATE POLICY "Users can insert own trial status" ON trial_status FOR INSERT WITH CHECK (auth.uid() = identity);

-- Ad Credits: Users can read/write their own ad credits
CREATE POLICY "Users can view own ad credits" ON ad_credits FOR SELECT USING (auth.uid() = identity);
CREATE POLICY "Users can update own ad credits" ON ad_credits FOR UPDATE USING (auth.uid() = identity);
CREATE POLICY "Users can insert own ad credits" ON ad_credits FOR INSERT WITH CHECK (auth.uid() = identity);

-- Food Items: Users can manage their own food items
CREATE POLICY "Users can view own food items" ON food_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own food items" ON food_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own food items" ON food_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own food items" ON food_items FOR DELETE USING (auth.uid() = user_id);

-- Daily Logs: Users can manage their own daily logs
CREATE POLICY "Users can view own daily logs" ON daily_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own daily logs" ON daily_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own daily logs" ON daily_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own daily logs" ON daily_logs FOR DELETE USING (auth.uid() = user_id);

-- Daily Summaries: Users can view/update their own summaries
CREATE POLICY "Users can view own daily summaries" ON daily_summaries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own daily summaries" ON daily_summaries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own daily summaries" ON daily_summaries FOR UPDATE USING (auth.uid() = user_id);

-- Exercise Logs: Users can manage their own exercise logs
CREATE POLICY "Users can view own exercise logs" ON exercise_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own exercise logs" ON exercise_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own exercise logs" ON exercise_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own exercise logs" ON exercise_logs FOR DELETE USING (auth.uid() = user_id);

-- Body Measurements: Users can manage their own measurements
CREATE POLICY "Users can view own body measurements" ON body_measurements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own body measurements" ON body_measurements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own body measurements" ON body_measurements FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own body measurements" ON body_measurements FOR DELETE USING (auth.uid() = user_id);

-- Progress Photos: Users can manage their own photos
CREATE POLICY "Users can view own progress photos" ON progress_photos FOR SELECT USING (auth.uid() = identity);
CREATE POLICY "Users can insert own progress photos" ON progress_photos FOR INSERT WITH CHECK (auth.uid() = identity);
CREATE POLICY "Users can delete own progress photos" ON progress_photos FOR DELETE USING (auth.uid() = identity);

-- Habits: Users can manage their own habits
CREATE POLICY "Users can view own habits" ON habits FOR SELECT USING (auth.uid() = identity);
CREATE POLICY "Users can insert own habits" ON habits FOR INSERT WITH CHECK (auth.uid() = identity);
CREATE POLICY "Users can update own habits" ON habits FOR UPDATE USING (auth.uid() = identity);
CREATE POLICY "Users can delete own habits" ON habits FOR DELETE USING (auth.uid() = identity);

-- Habit Logs: Users can manage their own habit logs
CREATE POLICY "Users can view own habit logs" ON habit_logs FOR SELECT USING (auth.uid() = identity);
CREATE POLICY "Users can insert own habit logs" ON habit_logs FOR INSERT WITH CHECK (auth.uid() = identity);
CREATE POLICY "Users can delete own habit logs" ON habit_logs FOR DELETE USING (auth.uid() = identity);

-- Mood Entries: Users can manage their own mood entries
CREATE POLICY "Users can view own mood entries" ON mood_entries FOR SELECT USING (auth.uid() = identity);
CREATE POLICY "Users can insert own mood entries" ON mood_entries FOR INSERT WITH CHECK (auth.uid() = identity);
CREATE POLICY "Users can update own mood entries" ON mood_entries FOR UPDATE USING (auth.uid() = identity);
CREATE POLICY "Users can delete own mood entries" ON mood_entries FOR DELETE USING (auth.uid() = identity);

-- Supplements: Users can manage their own supplements
CREATE POLICY "Users can view own supplements" ON supplements FOR SELECT USING (auth.uid() = identity);
CREATE POLICY "Users can insert own supplements" ON supplements FOR INSERT WITH CHECK (auth.uid() = identity);
CREATE POLICY "Users can update own supplements" ON supplements FOR UPDATE USING (auth.uid() = identity);
CREATE POLICY "Users can delete own supplements" ON supplements FOR DELETE USING (auth.uid() = identity);

-- Supplement Logs: Users can manage their own supplement logs
CREATE POLICY "Users can view own supplement logs" ON supplement_logs FOR SELECT USING (auth.uid() = identity);
CREATE POLICY "Users can insert own supplement logs" ON supplement_logs FOR INSERT WITH CHECK (auth.uid() = identity);

-- Recipes: Users can manage their own recipes
CREATE POLICY "Users can view own recipes" ON recipes FOR SELECT USING (auth.uid() = identity);
CREATE POLICY "Users can insert own recipes" ON recipes FOR INSERT WITH CHECK (auth.uid() = identity);
CREATE POLICY "Users can update own recipes" ON recipes FOR UPDATE USING (auth.uid() = identity);
CREATE POLICY "Users can delete own recipes" ON recipes FOR DELETE USING (auth.uid() = identity);

-- AI Messages: Users can manage their own AI messages
CREATE POLICY "Users can view own ai messages" ON ai_messages FOR SELECT USING (auth.uid() = identity);
CREATE POLICY "Users can insert own ai messages" ON ai_messages FOR INSERT WITH CHECK (auth.uid() = identity);

-- Favorite Foods: Users can manage their own favorites
CREATE POLICY "Users can view own favorite foods" ON favorite_foods FOR SELECT USING (auth.uid() = identity);
CREATE POLICY "Users can insert own favorite foods" ON favorite_foods FOR INSERT WITH CHECK (auth.uid() = identity);
CREATE POLICY "Users can delete own favorite foods" ON favorite_foods FOR DELETE USING (auth.uid() = identity);

-- Favorite Food Status: Users can manage their own favorite statuses
CREATE POLICY "Users can view own favorite food status" ON favorite_food_status FOR SELECT USING (auth.uid() = identity);
CREATE POLICY "Users can insert own favorite food status" ON favorite_food_status FOR INSERT WITH CHECK (auth.uid() = identity);
CREATE POLICY "Users can update own favorite food status" ON favorite_food_status FOR UPDATE USING (auth.uid() = identity);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_goals_updated_at BEFORE UPDATE ON user_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trial_status_updated_at BEFORE UPDATE ON trial_status FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ad_credits_updated_at BEFORE UPDATE ON ad_credits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_daily_summaries_updated_at BEFORE UPDATE ON daily_summaries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_habits_updated_at BEFORE UPDATE ON habits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mood_entries_updated_at BEFORE UPDATE ON mood_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mood_trend_summaries_updated_at BEFORE UPDATE ON mood_trend_summaries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_supplements_updated_at BEFORE UPDATE ON supplements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_favorite_food_status_updated_at BEFORE UPDATE ON favorite_food_status FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_habit_streak_status_updated_at BEFORE UPDATE ON habit_streak_status FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_supplement_completion_summaries_updated_at BEFORE UPDATE ON supplement_completion_summaries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Fitto database setup complete!';
  RAISE NOTICE '📊 All tables created successfully';
  RAISE NOTICE '🔒 Row Level Security policies enabled';
  RAISE NOTICE '⚡ Triggers and functions configured';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Next steps:';
  RAISE NOTICE '   1. Enable Realtime for your tables in Supabase Dashboard';
  RAISE NOTICE '   2. Refresh your app - it should now connect successfully!';
  RAISE NOTICE '   3. No more 406/404 errors!';
END $$;
