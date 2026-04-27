/**
 * Supabase Type Definitions
 * Updated to match actual database schema used in the application
 */

// ============================================================================
// ENUMS - Database enums
// ============================================================================

export type ActivityLevel = 'sedentary' | 'lightlyActive' | 'moderatelyActive' | 'veryActive' | 'extraActive';
export type Gender = 'male' | 'female' | 'other';
export type GoalType = 'loseWeight' | 'maintainWeight' | 'gainWeight' | 'buildMuscle';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type PlanType = 'free' | 'premium' | 'trial';
export type SubscriptionStatus = 'active' | 'inactive' | 'canceled' | 'expired';
export type HabitFrequency = 'daily' | 'weekly' | 'monthly';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'any';
export type AdminRole = 'super_admin' | 'admin' | 'moderator';
export type AdminStatus = 'active' | 'inactive' | 'suspended';
export type AdminActionType = 
  | 'user_created' 
  | 'user_updated' 
  | 'user_deleted' 
  | 'subscription_modified' 
  | 'system_config_changed' 
  | 'feature_toggled';

// ============================================================================
// CORE TABLES - FIXED TO MATCH ACTUAL SCHEMA
// ============================================================================

export interface UserProfile {
  id: string; // UUID primary key
  user_id: string; // UUID foreign key to auth.users
  full_name: string | null;
  username: string | null; // Added for compatibility
  email: string | null;
  age: number | null;
  weight_kg: number | null;
  height_cm: number | null;
  gender: string | null;
  activity_level: string | null;
  created_at: string; // timestamp
  updated_at: string; // timestamp
}

export interface UserGoals {
  id: string; // UUID primary key
  user_id: string; // UUID foreign key to auth.users
  goal_type: string | null;
  target_weight_kg: number | null;
  daily_calorie_target: number | null;
  protein_target_g: number | null;
  carbs_target_g: number | null;
  fat_target_g: number | null;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  identity: string; // UUID primary key
  plan_type: PlanType;
  status: SubscriptionStatus;
  started_at: string;
  expires_at: string | null;
  auto_renew: boolean;
  ai_requests_used: number;
  ai_requests_limit: number;
  created_at: string;
  updated_at: string;
}

export interface TrialStatus {
  identity: string; // UUID primary key
  is_trial_active: boolean;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  daily_trial_count: number;
  trial_limit: number;
  last_reset: string;
  created_at: string;
  updated_at: string;
}

export interface AdCredit {
  identity: string; // UUID primary key
  ad_credits: number;
  last_ad_watched: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// MEAL & NUTRITION TRACKING
// ============================================================================

export interface FoodItem {
  id: string; // UUID primary key
  user_id: string; // user UUID
  meal_name: string;
  meal_type?: string; // 'breakfast' | 'lunch' | 'dinner' | 'snack'
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fats: number | null;
  notes: string | null;
  date: string | null; // date format: YYYY-MM-DD
  created_at: string;
}

export interface DailyLog {
  id: string; // UUID primary key
  user_id: string; // user UUID
  date: string; // date format: YYYY-MM-DD
  meal_type: MealType;
  food_item_id: string; // FK to FoodItem
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  serving_size: string;
  quantity: number;
  water_ml: number;
  notes: string | null;
  created_at: string;
}

export interface DailySummary {
  id: string; // UUID primary key
  user_id: string; // UUID
  date: string; // date format: YYYY-MM-DD
  total_calories: number | null;
  total_exercises: number | null;
  notes: string | null;
  created_at: string;
}

export interface FavoriteFood {
  identity: string; // UUID
  food_item_id: string; // FK to FoodItem
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  serving_size: string;
  created_at: string;
}

export interface FavoriteFoodStatus {
  identity: string; // UUID
  food_item_id: string;
  is_favorited: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// EXERCISE TRACKING
// ============================================================================

export interface ExerciseLog {
  id: string; // UUID primary key
  user_id: string; // user UUID
  exercise_name: string;
  sets: number | null;
  reps: number | null;
  weight: number | null;
  notes: string | null;
  date: string | null; // date format: YYYY-MM-DD
  created_at: string;
}

// ============================================================================
// BODY MEASUREMENTS & PROGRESS
// ============================================================================

export interface BodyMeasurement {
  id: string; // UUID primary key
  user_id: string; // user UUID
  date: string;
  weight: number;
  body_fat_percentage: number | null;
  muscle_mass: number | null;
  waist: number | null;
  hips: number | null;
  chest: number | null;
  arms: number | null;
  legs: number | null;
  notes: string | null;
  created_at: string;
}

export interface ProgressPhoto {
  id: string; // UUID primary key
  identity: string; // user UUID
  date: string;
  photo_url: string;
  weight: number | null;
  notes: string | null;
  created_at: string;
}

// ============================================================================
// HABITS & MOOD TRACKING
// ============================================================================

export interface Habit {
  id: string; // UUID primary key
  identity: string; // user UUID
  name: string;
  description: string | null;
  frequency: HabitFrequency;
  target_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HabitLog {
  id: string; // UUID primary key
  habit_id: string; // FK to Habit
  identity: string; // user UUID
  date: string;
  completed: boolean;
  notes: string | null;
  created_at: string;
}

export interface HabitStreakStatus {
  habit_id: string; // primary key
  identity: string; // user UUID
  current_streak: number;
  longest_streak: number;
  last_completed: string | null;
  updated_at: string;
}

export interface MoodEntry {
  id: string; // UUID primary key
  identity: string; // user UUID
  date: string;
  mood_score: number; // 1-10
  energy_level: number; // 1-10
  stress_level: number; // 1-10
  sleep_quality: number; // 1-10
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MoodTrendSummary {
  identity: string; // UUID
  period_start: string;
  period_end: string;
  avg_mood: number;
  avg_energy: number;
  avg_stress: number;
  avg_sleep: number;
  total_entries: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// SUPPLEMENTS
// ============================================================================

export interface Supplement {
  id: string; // UUID primary key
  identity: string; // user UUID
  name: string;
  dosage: string;
  frequency: HabitFrequency;
  time_of_day: TimeOfDay;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupplementLog {
  id: string; // UUID primary key
  supplement_id: string; // FK to Supplement
  identity: string; // user UUID
  date: string;
  taken: boolean;
  time_taken: string | null;
  notes: string | null;
  created_at: string;
}

export interface SupplementCompletionSummary {
  supplement_id: string; // primary key
  identity: string; // user UUID
  period_start: string;
  period_end: string;
  total_doses: number;
  completed_doses: number;
  completion_rate: number;
  updated_at: string;
}

// ============================================================================
// RECIPES
// ============================================================================

export interface RecipeIngredient {
  name: string;
  amount: string;
  unit: string;
}

export interface Recipe {
  id: string; // UUID primary key
  identity: string; // user UUID
  name: string;
  description: string | null;
  ingredients: RecipeIngredient[]; // JSONB
  instructions: string;
  prep_time_minutes: number;
  cook_time_minutes: number;
  servings: number;
  calories_per_serving: number;
  protein_per_serving: number;
  carbs_per_serving: number;
  fats_per_serving: number;
  tags: string[]; // JSONB
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// AI FEATURES
// ============================================================================

export interface AIMessage {
  id: string; // UUID primary key
  identity: string; // user UUID
  role: string; // 'user' | 'assistant' | 'system'
  content: string;
  created_at: string;
}

// ============================================================================
// ADMIN SYSTEM
// ============================================================================

export interface AdminUser {
  identity: string; // UUID primary key
  username: string; // unique
  role: AdminRole;
  status: AdminStatus;
  created_at: string;
  updated_at: string;
}

export interface AdminSession {
  identity: string; // UUID primary key
  session_token: string; // unique
  expires_at: string;
  created_at: string;
}

export interface AdminAuditLog {
  id: string; // UUID primary key
  admin_identity: string; // FK to AdminUser
  action_type: AdminActionType;
  target_identity: string | null; // affected user
  description: string;
  metadata: Record<string, unknown>; // JSONB
  created_at: string;
}

// ============================================================================
// DATABASE TYPE
// ============================================================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: UserProfile;
        Insert: Omit<UserProfile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserProfile, 'id' | 'created_at'>>;
      };
      user_goals: {
        Row: UserGoals;
        Insert: Omit<UserGoals, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserGoals, 'id' | 'created_at'>>;
      };
      subscriptions: {
        Row: Subscription;
        Insert: Omit<Subscription, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Subscription, 'identity' | 'created_at'>>;
      };
      trial_status: {
        Row: TrialStatus;
        Insert: Omit<TrialStatus, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<TrialStatus, 'identity' | 'created_at'>>;
      };
      ad_credits: {
        Row: AdCredit;
        Insert: Omit<AdCredit, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<AdCredit, 'identity' | 'created_at'>>;
      };
      food_items: {
        Row: FoodItem;
        Insert: Omit<FoodItem, 'id' | 'created_at'>;
        Update: Partial<Omit<FoodItem, 'id' | 'created_at'>>;
      };
      daily_logs: {
        Row: DailyLog;
        Insert: Omit<DailyLog, 'id' | 'created_at'>;
        Update: Partial<Omit<DailyLog, 'id' | 'created_at'>>;
      };
      daily_summaries: {
        Row: DailySummary;
        Insert: Omit<DailySummary, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DailySummary, 'created_at'>>;
      };
      favorite_foods: {
        Row: FavoriteFood;
        Insert: FavoriteFood;
        Update: Partial<Omit<FavoriteFood, 'identity' | 'food_item_id' | 'created_at'>>;
      };
      favorite_food_status: {
        Row: FavoriteFoodStatus;
        Insert: Omit<FavoriteFoodStatus, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<FavoriteFoodStatus, 'created_at'>>;
      };
      exercise_logs: {
        Row: ExerciseLog;
        Insert: Omit<ExerciseLog, 'id' | 'created_at'>;
        Update: Partial<Omit<ExerciseLog, 'id' | 'created_at'>>;
      };
      body_measurements: {
        Row: BodyMeasurement;
        Insert: Omit<BodyMeasurement, 'id' | 'created_at'>;
        Update: Partial<Omit<BodyMeasurement, 'id' | 'created_at'>>;
      };
      progress_photos: {
        Row: ProgressPhoto;
        Insert: Omit<ProgressPhoto, 'id' | 'created_at'>;
        Update: Partial<Omit<ProgressPhoto, 'id' | 'created_at'>>;
      };
      habits: {
        Row: Habit;
        Insert: Omit<Habit, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Habit, 'id' | 'created_at'>>;
      };
      habit_logs: {
        Row: HabitLog;
        Insert: Omit<HabitLog, 'id' | 'created_at'>;
        Update: Partial<Omit<HabitLog, 'id' | 'created_at'>>;
      };
      habit_streak_status: {
        Row: HabitStreakStatus;
        Insert: Omit<HabitStreakStatus, 'updated_at'>;
        Update: Partial<HabitStreakStatus>;
      };
      mood_entries: {
        Row: MoodEntry;
        Insert: Omit<MoodEntry, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<MoodEntry, 'id' | 'created_at'>>;
      };
      mood_trend_summaries: {
        Row: MoodTrendSummary;
        Insert: Omit<MoodTrendSummary, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<MoodTrendSummary, 'created_at'>>;
      };
      supplements: {
        Row: Supplement;
        Insert: Omit<Supplement, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Supplement, 'id' | 'created_at'>>;
      };
      supplement_logs: {
        Row: SupplementLog;
        Insert: Omit<SupplementLog, 'id' | 'created_at'>;
        Update: Partial<Omit<SupplementLog, 'id' | 'created_at'>>;
      };
      supplement_completion_summaries: {
        Row: SupplementCompletionSummary;
        Insert: Omit<SupplementCompletionSummary, 'updated_at'>;
        Update: Partial<SupplementCompletionSummary>;
      };
      recipes: {
        Row: Recipe;
        Insert: Omit<Recipe, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Recipe, 'id' | 'created_at'>>;
      };
      ai_messages: {
        Row: AIMessage;
        Insert: Omit<AIMessage, 'id' | 'created_at'>;
        Update: Partial<Omit<AIMessage, 'id' | 'created_at'>>;
      };
      admin_users: {
        Row: AdminUser;
        Insert: Omit<AdminUser, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<AdminUser, 'identity' | 'created_at'>>;
      };
      admin_sessions: {
        Row: AdminSession;
        Insert: Omit<AdminSession, 'created_at'>;
        Update: Partial<Omit<AdminSession, 'identity' | 'created_at'>>;
      };
      admin_audit_logs: {
        Row: AdminAuditLog;
        Insert: Omit<AdminAuditLog, 'id' | 'created_at'>;
        Update: never; // Audit logs are immutable
      };
    };
  };
}
