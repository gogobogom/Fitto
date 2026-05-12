/**
 * Supabase Type Definitions
 *
 * Mirrors the canonical Postgres schema defined in /app/migration.sql
 * Tables: user_profiles, user_goals, meals, exercises, food_database,
 *         daily_summaries, water_logs, body_measurements,
 *         ai_messages, subscriptions, trial_status
 */

// ============================================================================
// ENUM-LIKE STRING UNIONS
// ============================================================================
export type ActivityLevel =
  | 'sedentary'
  | 'lightlyActive'
  | 'moderatelyActive'
  | 'veryActive'
  | 'extraActive';

export type Gender = 'male' | 'female' | 'other';

export type GoalType = 'loseWeight' | 'maintainWeight' | 'gainWeight' | 'buildMuscle';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type PlanType = 'free' | 'premium' | 'trial';

export type SubscriptionStatus = 'active' | 'inactive' | 'canceled' | 'expired';

// ============================================================================
// CORE ROWS
// ============================================================================

export type UserProfile = {
  id: string;
  user_id: string;
  full_name: string | null;
  username: string | null;
  email: string | null;
  age: number | null;
  weight_kg: number | null;
  height_cm: number | null;
  gender: Gender | string | null;
  activity_level: ActivityLevel | string | null;
  referrer_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export type UserGoals = {
  id: string;
  user_id: string;
  goal_type: GoalType | string | null;
  target_weight_kg: number | null;
  daily_calorie_target: number | null;
  protein_target_g: number | null;
  carbs_target_g: number | null;
  fat_target_g: number | null;
  created_at: string;
  updated_at: string;
}

export type FoodItem = {
  id: string;
  user_id: string;
  meal_name: string;
  meal_type?: MealType | string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fats: number | null;
  notes: string | null;
  date: string | null;
  created_at: string;
}

// Alias kept for legacy imports
export type Meal = FoodItem;

export type ExerciseLog = {
  id: string;
  user_id: string;
  exercise_name: string;
  sets: number | null;
  reps: number | null;
  weight: number | null;
  duration_minutes: number | null;
  calories_burned: number | null;
  notes: string | null;
  date: string | null;
  created_at: string;
}

export type FoodDatabaseItem = {
  id: string;
  name: string;
  name_tr: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  category: string;
  category_tr: string;
  serving_size: string;
  serving_size_tr: string;
  barcode: string | null;
  is_custom: boolean;
  created_by: string | null;
  created_at: string;
}

export type DailySummary = {
  id: string;
  user_id: string;
  date: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fats: number;
  total_water_ml: number;
  meals_logged: number;
  exercises_logged: number;
  exercise_calories: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type WaterLog = {
  id: string;
  user_id: string;
  date: string;
  glasses: number;
  ml: number;
  updated_at: string;
}

export type BodyMeasurement = {
  id: string;
  user_id: string;
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

export type AIMessage = {
  id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system' | string;
  content: string;
  created_at: string;
}

export type Subscription = {
  user_id: string;
  plan_type: PlanType | string;
  status: SubscriptionStatus | string;
  started_at: string;
  expires_at: string | null;
  auto_renew: boolean;
  ai_requests_used: number;
  ai_requests_limit: number;
  created_at: string;
  updated_at: string;
}

export type TrialStatus = {
  user_id: string;
  is_trial_active: boolean;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  daily_trial_count: number;
  trial_limit: number;
  last_reset: string;
  created_at: string;
  updated_at: string;
}

// Legacy DailyLog export kept as an alias of FoodItem so old code compiles
export type DailyLog = FoodItem;

// ============================================================================
// DATABASE TYPE (used by createClient<Database>)
// ============================================================================
// NOTE: supabase-js v2.87+ requires `Relationships: GenericRelationship[]` on
// every table for the generic table inference to work — otherwise every
// `.from('x')` call collapses to `never`. We keep it as a mutable empty
// array type since we don't model foreign-key relationships here.
type Rel = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
}[];

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile;
        Insert: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<UserProfile, 'id' | 'user_id' | 'created_at'>>;
        Relationships: Rel;
      };
      user_goals: {
        Row: UserGoals;
        Insert: Omit<UserGoals, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<UserGoals, 'id' | 'user_id' | 'created_at'>>;
        Relationships: Rel;
      };
      meals: {
        Row: FoodItem;
        Insert: Omit<FoodItem, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<FoodItem, 'id' | 'user_id' | 'created_at'>>;
        Relationships: Rel;
      };
      exercises: {
        Row: ExerciseLog;
        Insert: Omit<ExerciseLog, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<ExerciseLog, 'id' | 'user_id' | 'created_at'>>;
        Relationships: Rel;
      };
      food_database: {
        Row: FoodDatabaseItem;
        Insert: Omit<FoodDatabaseItem, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<FoodDatabaseItem, 'id' | 'created_at'>>;
        Relationships: Rel;
      };
      daily_summaries: {
        Row: DailySummary;
        Insert: Omit<DailySummary, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<DailySummary, 'id' | 'user_id' | 'created_at'>>;
        Relationships: Rel;
      };
      water_logs: {
        Row: WaterLog;
        Insert: Omit<WaterLog, 'id' | 'updated_at'> & {
          id?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<WaterLog, 'id' | 'user_id'>>;
        Relationships: Rel;
      };
      body_measurements: {
        Row: BodyMeasurement;
        Insert: Omit<BodyMeasurement, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<BodyMeasurement, 'id' | 'user_id' | 'created_at'>>;
        Relationships: Rel;
      };
      ai_messages: {
        Row: AIMessage;
        Insert: Omit<AIMessage, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<AIMessage, 'id' | 'user_id' | 'created_at'>>;
        Relationships: Rel;
      };
      subscriptions: {
        Row: Subscription;
        Insert: Omit<Subscription, 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Subscription, 'user_id' | 'created_at'>>;
        Relationships: Rel;
      };
      trial_status: {
        Row: TrialStatus;
        Insert: Omit<TrialStatus, 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<TrialStatus, 'user_id' | 'created_at'>>;
        Relationships: Rel;
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
  };
}
