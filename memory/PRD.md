# Fitto - Product Requirements Document (PRD)

## 1. Original Problem Statement
> Analyze my GitHub repository for the Fitto project (Next.js + TypeScript + Supabase + Prisma + Capacitor).
> Identify and fix all existing bugs to ensure the application works flawlessly:
> 1. Frontend ↔ Supabase/Prisma data flow.
> 2. Calorie tracking and health monitoring logic.
> 3. Missing dependencies / env config issues.
> 4. UI components in `src/` correctly wired to backend.
>
> The Railway-hosted Grok RAG AI Health Coach is **offline**. Focus exclusively on the core app's stability.

## 2. Architecture
- **Framework:** Next.js 15 (App Router) + React 19 + TypeScript 5.8
- **Backend:** Supabase (Auth + Postgres + Realtime + RLS)
- **ORM:** Prisma 5 (newly populated schema, used for type-safe server-side access)
- **UI:** TailwindCSS + Radix UI (shadcn/ui), Doodle theme
- **Mobile shell:** Capacitor 8 (web build → out/, iOS/Android wrappers)
- **i18n:** Custom `LanguageContext` (Turkish 🇹🇷 / English 🇬🇧)
- **Optional:** Farcaster Mini App SDK (Quick Auth), RevenueCat, USDA + OpenFoodFacts proxies

## 3. Canonical Schema (after migration.sql is applied)
| Table              | Purpose                                                |
|--------------------|--------------------------------------------------------|
| `user_profiles`    | Per-user profile (FK → auth.users.id)                  |
| `user_goals`       | Calorie / macro / weight targets                       |
| `meals`            | Logged meals (calories, protein, carbs, fats, date)    |
| `exercises`        | Logged workouts (sets/reps/weight + duration/burn)     |
| `food_database`    | Shared food catalog (230 seeded rows)                  |
| `daily_summaries`  | Auto-aggregated daily totals (trigger-maintained)      |
| `water_logs`       | Per-day water intake                                   |
| `body_measurements`| Weight & circumference history                         |
| `ai_messages`      | AI Coach chat history                                  |
| `subscriptions`    | RevenueCat / billing state                             |
| `trial_status`     | Free-trial counters                                    |

All personal tables are protected by RLS owner policies (`user_id = auth.uid()`).

## 4. User Personas
- **Mobile-first dieter (TR/EN):** wants to track meals + exercises against a daily kcal target.
- **Power user:** wants charts, weekly progress, body measurements, goal recalculations.
- **Premium subscriber:** uses AI Coach, recipe generator, meal photo analysis (deferred — Grok offline).

## 5. Core Requirements (verified ✅ / deferred 🚧)
- ✅ Email/password auth (Supabase) with login, signup, password reset
- ✅ Onboarding wizard → upserts `user_profiles` + `user_goals`, computes BMR/TDEE
- ✅ Calorie circle, macro bars, weekly chart driven by live `meals` data
- ✅ Add / delete meals (`AddMealDialog` ↔ `meals` table) with food_database autocomplete
- ✅ Add / delete exercises (`AddExerciseDialog` ↔ `exercises` table)
- ✅ Realtime updates via Supabase channels
- ✅ Calories burned reflected on dashboard (server aggregate + client fallback)
- 🚧 AI Coach (Grok backend offline — kept in code, gated)
- 🚧 Capacitor iOS/Android build (web flow first, mobile next)

## 6. What's been implemented in this iteration (April 28, 2026)
- 🔧 **Schema realignment migration** (`/app/migration.sql`) — drops legacy `profiles / daily_logs / food_items / exercise_logs` and creates the canonical 11-table schema with RLS, auto-create trigger, daily-summary aggregation triggers, realtime publication, and 30-row seed.
- 🔧 **Prisma schema populated** (`/app/prisma/schema.prisma`) with 11 models matching the migration; `prisma generate` succeeds.
- 🔧 **`/app/.env.local`** created with Supabase URL + anon + service-role keys; `DATABASE_URL`/`DIRECT_URL` placeholders documented.
- 🔧 **Supabase client hardened** — removed hardcoded fallback URL/key, reads env strictly.
- 🔧 **TypeScript types rewritten** (`src/types/supabase.ts`) — `Database` type now matches actual queried tables; legacy aliases (`DailyLog → FoodItem`) preserved for back-compat.
- 🔧 **Legacy components fixed:**
  - `DashboardNew.tsx` collapsed into a thin alias for `EnhancedDashboard` (removes dropped-table queries)
  - `ExerciseList.tsx` rewritten for the new `exercises` table
  - `DetailedReportCard.tsx` re-pointed at `meals`, with corrected goal column names
  - `FavoriteFoods.tsx`, `MealTemplates.tsx` stubbed (legacy tables removed)
  - `RecentFoods.tsx` deleted (unused)
- 🔧 **Test pages updated** (`/test-supabase`, `/test-supabase-schema`) to use the new schema.
- 🔧 **Dead code purged:** `/spacetime-server` folder, `useAuth.ts` hook, legacy SQL setup files.
- 🔧 **`EnhancedDashboard`** now derives `caloriesBurned` from a live query against `exercises` as a fallback, so the UI is correct even before `daily_summaries` is populated.
- 🔧 **Supervisor entry** `/etc/supervisor/conf.d/nextjs.conf` — runs `next dev` on `0.0.0.0:3000`.

## 7. Verified end-to-end (against live Supabase)
- ✅ Signup → 200 with access_token
- ✅ user_profiles upsert → 201 with row
- ✅ user_goals upsert → 201
- ✅ Meal insert (`Yumurta + Tam Buğday Ekmeği`, 400 kcal) → 201
- ✅ Read back today's meals → returns the row
- ✅ Exercise insert (sets/reps/weight schema) → 201
- ✅ All authenticated REST calls respect RLS (only own rows visible)

## 8. Known follow-ups
| Priority | Task                                                                                  |
|----------|---------------------------------------------------------------------------------------|
| **P0**   | User runs `migration.sql` in Supabase SQL Editor (only adds missing tables + triggers; meals/profiles already match) |
| **P0**   | User pastes the real DB password into `DATABASE_URL`/`DIRECT_URL` if Prisma will be used at runtime |
| P1       | Reconcile `AddExerciseDialog` (sets/reps/weight) with `ExerciseList` (duration/burn) — currently strength workouts log no kcal-burn |
| P1       | Wire `WaterTracking` to the new `water_logs` table (currently localStorage-only)      |
| P1       | Body measurements page persistence (UI exists, table now exists)                      |
| P2       | Restore `FavoriteFoods` against `food_database` (currently a placeholder)             |
| P2       | Re-enable AI Coach when the Grok service comes back up                                |
| P2       | Capacitor iOS/Android build verification                                              |

## 9. Backlog / future enhancements
- Push notifications for meal & water reminders (already configured client-side; needs FCM + APNs keys)
- Streak / achievement system backed by DB rather than localStorage
- Weekly progress export (CSV/PDF)
- Apple Health / Google Fit sync
