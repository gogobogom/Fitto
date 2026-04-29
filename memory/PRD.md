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

## 6. What's been implemented in this iteration (April 28-29, 2026)

### Phase 1 — Audit & schema realignment (April 28)
- 🔧 **Schema realignment migration** (`/app/migration.sql`) — drops legacy `profiles / daily_logs / food_items / exercise_logs` and creates the canonical 11-table schema with RLS, auto-create trigger, daily-summary aggregation triggers, realtime publication, and 30-row seed.
- 🔧 **Prisma schema populated** (`/app/prisma/schema.prisma`) with 11 models matching the migration; `prisma generate` succeeds.
- 🔧 **`/app/.env.local`** created with Supabase URL + anon + service-role keys; `DATABASE_URL`/`DIRECT_URL` placeholders documented.
- 🔧 **Supabase client hardened** — removed hardcoded fallback URL/key, reads env strictly.
- 🔧 **TypeScript types rewritten** (`src/types/supabase.ts`) — `Database` type now matches actual queried tables; legacy aliases (`DailyLog → FoodItem`) preserved for back-compat.
- 🔧 **Legacy components fixed:** `DashboardNew` collapsed into a thin alias for `EnhancedDashboard`; `ExerciseList`, `DetailedReportCard` re-pointed at new tables; `FavoriteFoods`, `MealTemplates` stubbed; `RecentFoods` deleted.
- 🔧 **Test pages updated** (`/test-supabase`, `/test-supabase-schema`) to use the new schema.
- 🔧 **Dead code purged:** `/spacetime-server` folder, `useAuth.ts` hook, legacy SQL setup files.
- 🔧 **`EnhancedDashboard`** now derives `caloriesBurned` from a live query against `exercises` as a fallback, so the UI is correct even before `daily_summaries` is populated.
- 🔧 **Supervisor entry** `/etc/supervisor/conf.d/nextjs.conf` — runs `next dev` on `0.0.0.0:3000`.

### Phase 2 — Share-my-week social card (April 29)
- 🚀 **OG image route** (`/share/week/[userId]/image`) — Edge-friendly `next/og` `ImageResponse` that renders a 1200×630 branded PNG (Fitto orange→pink gradient, big "X / Y on-target days" headline, 7-day bar chart with green/red/amber bands, adherence %, avg net kcal). Cached 5 min on the CDN.
- 🚀 **Share landing page** (`/share/week/[userId]`) — server component with full `generateMetadata`: `og:image` + `twitter:summary_large_image` + Farcaster Frame v1 + Mini-App `fc:miniapp` JSON. Renders the OG card, three quick stats, and CTAs to "Open Fitto" + "Share on Warpcast" (warpcast.com/~/compose intent).
- 🚀 **Server-only Supabase admin client** (`src/lib/supabase/server.ts`) using the service-role key, `import 'server-only'` to prevent leaking it to the bundle.
- 🚀 **Stats helper** (`src/lib/share/weekStats.ts`) — computes `daysOnTarget / daysLogged`, `adherencePct`, per-day net kcal across last 7 days; safe on legacy schemas (`calories_burned` may not exist yet).
- 🚀 **`<ShareWeekButton />`** — wired into the dashboard motivational banner. Uses `navigator.share` → clipboard → new-tab fallback chain.
- ⚠️ **Routing gotcha solved**: discovered the Emergent Kubernetes ingress proxies all `/api/*` to port 8001 (FastAPI), not Next.js. Moved the OG endpoint off `/api/share/...` to `/share/week/[userId]/image` so it's reachable through the public preview URL.
- 🔬 Verified end-to-end: signup → seed 7 days of meals → fetch OG (172 KB PNG, 200 OK through preview URL) → landing page renders with username, stats, embedded card, and Warpcast intent. Shared TR & EN locales both work.

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
