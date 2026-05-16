/**
 * wellnessDNAShape.ts
 * ---------------------------------------------------------------
 * Single source of truth for the structured Wellness DNA profile
 * stored in `public.user_profiles.wellness_dna` (JSONB).
 *
 * Schema is versioned (`v: 1`). All fields are optional so that
 * the questionnaire can be filled progressively and safely
 * persisted partial state. Mirror values (goal label, dietary
 * preference, allergies) are also written to the legacy columns
 * so that the existing card and other consumers keep working.
 */

export const WELLNESS_DNA_VERSION = 1 as const;

export type PrimaryGoal =
  | 'lose_weight'
  | 'maintain'
  | 'gain_muscle'
  | 'energy'
  | 'digestion'
  | 'habits'
  | 'performance';

export type Motivation =
  | 'appearance'
  | 'health'
  | 'energy'
  | 'confidence'
  | 'routine'
  | 'medical'
  | 'sport';

export type AgeRange = '18-25' | '26-35' | '36-45' | '46-55' | '55+';
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderate' | 'very_active';
export type WorkStyle = 'desk' | 'active' | 'student' | 'irregular';
export type SleepQuality = 'poor' | 'ok' | 'good' | 'great';
export type StressLevel = 'low' | 'medium' | 'high';

export type DietaryPreference =
  | 'omnivore'
  | 'vegetarian'
  | 'vegan'
  | 'pescatarian'
  | 'low_carb'
  | 'mediterranean'
  | 'halal'
  | 'none';

export type Craving = 'sweet' | 'salty' | 'fast_food' | 'bakery' | 'late_night';
export type MealFrequency = '2' | '3' | '4' | '5+';
export type BreakfastHabit = 'always' | 'sometimes' | 'never';
export type CookingSkill = 'beginner' | 'home_cook' | 'confident' | 'pro';
export type CookingTime = 'under_15' | '15_30' | '30_60' | 'over_60';
export type Budget = 'tight' | 'normal' | 'flexible';
export type KitchenItem = 'oven' | 'air_fryer' | 'stove' | 'blender' | 'microwave';

export type CoachTone = 'soft' | 'direct' | 'friendly' | 'data';
export type MotivationStyle = 'encouragement' | 'challenge' | 'small_steps' | 'strict';
export type DetailLevel = 'numbers' | 'simple';
export type Interest = 'recipes' | 'meal_plans' | 'snacks' | 'exercise' | 'habits';

export interface WellnessDNAFull {
  v: typeof WELLNESS_DNA_VERSION;
  goal?: {
    primary?: PrimaryGoal;
    target_weight_kg?: number;
    motivation?: Motivation;
  };
  body?: {
    age_range?: AgeRange;
    gender?: Gender;
    height_cm?: number;
    current_weight_kg?: number;
    activity_level?: ActivityLevel;
    wake_time?: string;
    sleep_time?: string;
    work_style?: WorkStyle;
    sleep_quality?: SleepQuality;
    stress_level?: StressLevel;
  };
  nutrition?: {
    dietary_preference?: DietaryPreference;
    allergies?: string[];
    disliked_foods?: string[];
    favorite_foods?: string[];
    cravings?: Craving[];
    meal_frequency?: MealFrequency;
    breakfast_habit?: BreakfastHabit;
    cooking_skill?: CookingSkill;
    cooking_time?: CookingTime;
    budget?: Budget;
    kitchen?: KitchenItem[];
  };
  coaching?: {
    tone?: CoachTone;
    motivation_style?: MotivationStyle;
    detail_level?: DetailLevel;
    interests?: Interest[];
  };
  health_flags?: {
    pregnancy_breastfeeding?: boolean;
    diabetes?: boolean;
    hypertension?: boolean;
    eating_disorder_history?: boolean;
    food_restriction_concern?: boolean;
    medical_diet?: string;
  };
  updated_at?: string;
}

export const EMPTY_DNA_FULL: WellnessDNAFull = { v: WELLNESS_DNA_VERSION };
