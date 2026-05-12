# Fitto — Technical Audit Report

**Date:** 2026-01
**Scope:** Data flow & integration, logic verification, dependencies & env, UI↔backend hookups
**Out of scope (per request):** Railway RAG service, Grok API, AI Health Coach

---

## 0. Executive Summary

| Severity | Finding | Status |
|---|---|---|
| 🔴 HIGH | `validateEnvironment()` never checked the two env vars the whole app depends on (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) | **FIXED** |
| 🔴 HIGH | `AddExerciseDialog` spun up a second `useSupabase()` instance → duplicate auth listeners + duplicate Realtime channels (silent intermittent failures) | **FIXED** |
| 🔴 HIGH | `daily_summaries.total_water_ml` is **never** populated — Postgres trigger only aggregated meals + exercises | **FIXED** via `migration_003_water_aggregation.sql` |
| 🟠 MED  | `WaterTracking` was called with `initialGlasses` / `onUpdate` props it didn't accept → parent dashboard's `waterGlasses` stayed at 0 forever, breaking the "Water" quick-stat & achievement | **FIXED** |
| 🟠 MED  | `.single()` used in 4 places where the row may legitimately not exist → spurious PGRST116 errors / red toasts on first-time users | **FIXED** (→ `.maybeSingle()`) |
| 🟠 MED  | "7 Day Streak" achievement had `earned: true` hardcoded | **FIXED** |
| 🟠 MED  | Cached `calories_${date}` was only written when total > 0 → deleting all meals didn't clear stale cache shown in the weekly chart | **FIXED** |
| 🟡 LOW  | `as FoodItem & { meal_type?: string }` unnecessary cast (the field is in the type) | **FIXED** |
| 🟡 LOW  | `next.config.mjs` has `typescript.ignoreBuildErrors: true` — masks the kind of bugs above | **Documented** (intentional?) |
| ⚪ INFO | Prisma is **entirely unused** in `/src` (zero `@prisma/client` imports) — `schema.prisma` is documentation only | **Documented** |
| ⚪ INFO | Missing `.env.local` — only the example exists | **Template updated** |

---

## 1. Data Flow & Integration

### 1.1 Supabase
- ✅ A single `createClient<Database>` browser instance lives in `src/lib/supabase/client.ts`.
- ✅ A separate, `server-only` admin client lives in `src/lib/supabase/server.ts` (service-role key, persistSession off).
- ✅ TypeScript `Database` type in `src/types/supabase.ts` mirrors `migration.sql` accurately.
- ⚠ **Realtime channel reuse** in `useSupabase.tsx` is well-guarded (nonce + `await removeChannel`); good defensive code.
- 🔴 **`AddExerciseDialog`** previously called `useSupabase()` even though the parent already passed a `connection` prop. That created a second auth listener and an extra set of Realtime subscriptions on every dialog open. → **FIXED** — pulls weight via the existing `connection.supabase` with `.maybeSingle()`.

### 1.2 Prisma
- 🔎 `@prisma/client` and `prisma` are in `package.json`, `prisma/schema.prisma` mirrors the SQL schema — but **no source file in `/src` imports Prisma**. Searched: `grep -rln 'PrismaClient\|@prisma/client\|prisma\.' /app/src` → 0 results.
- ✅ As a result, the audit point "ensure all Prisma queries match `schema.prisma`" is N/A: there are no Prisma queries to validate.
- 💡 Recommendation: either (a) remove `@prisma/client` / `prisma` / `schema.prisma` to reduce confusion + bundle weight, or (b) actually adopt Prisma in API routes for type-safe server queries. Currently you pay the cost (dependency + maintenance) with none of the benefits.

### 1.3 Null/undefined handling
- ✅ `useSupabase.tsx` uses `.maybeSingle()` and falls back to `null` cleanly for `user_profiles` and `user_goals` loads.
- 🔴 `.single()` (which **throws** PGRST116 on missing rows) was used in 4 places where the row may not yet exist:
  - `EditProfileDialog.tsx:59` – profile load on first edit
  - `EditProfileDialog.tsx:180` – fetching goal_type to recalc calories
  - `EditGoalsDialog.tsx:58` – goals load
  - `SettingsPage.tsx:99, 115` – profile and goals load
  - All five switched to `.maybeSingle()` → **FIXED**.

### 1.4 Type safety
- The codebase uses `<Database>` generic on the Supabase client, so most queries are typed.
- `payload.new as UserProfile` casts in `useSupabase.tsx` realtime handlers are pragmatic; Supabase doesn't give a stricter type. Acceptable.
- `next.config.mjs` has `typescript.ignoreBuildErrors: true`. This masks the kind of prop-mismatch bug fixed in §3. **Recommendation:** flip this to `false` once CI is green; the fixes in this audit get you closer.

---

## 2. Logic Verification

### 2.1 BMR / TDEE math
- ✅ `HealthCalculators.tsx`, `Onboarding.tsx`, and `EditProfileDialog.tsx` all use the **Mifflin–St Jeor** equation correctly:
  - Male  `BMR = 10·W + 6.25·H − 5·A + 5`
  - Female `BMR = 10·W + 6.25·H − 5·A − 161`
- ✅ Activity multipliers (1.2 / 1.375 / 1.55 / 1.725 / 1.9) are the standard values.
- ⚠ **Minor UX inconsistency** (not fixed, low priority): `Onboarding.tsx` and `EditProfileDialog.tsx` adjust TDEE by **±500 kcal** for lose/gain/build-muscle goals. The recommendation card in `HealthCalculators.tsx` shows **+300 kcal** for gain. Pick one and align copy.
- ⚠ `HealthCalculators` activity-level keys are `sedentary/light/moderate/active/veryActive` whereas the rest of the app uses `sedentary/lightlyActive/moderatelyActive/veryActive/extraActive`. The standalone calculator is fine (self-contained), but if you ever wire it to user goals you'll need to map them.

### 2.2 MET-based calorie burn
- ✅ `AddExerciseDialog.tsx` formula `kcal = MET × weight × duration/60` is correct.
- ✅ Defaults to 70 kg when the profile weight is missing — sensible.

### 2.3 Daily aggregation (the most important finding here)
- ✅ `migration.sql` defines `recalc_daily_summary(p_user_id, p_date)` plus AFTER-row triggers on `meals` and `exercises`. They correctly recalc on INSERT / UPDATE / DELETE, and also re-aggregate the *old* date on a date change.
- 🔴 **BUG:** the function never read `water_logs` and never wrote `total_water_ml`. There was also no trigger on `water_logs`. So `daily_summaries.total_water_ml` was permanently 0 in production. → **FIXED** via `migration_003_water_aggregation.sql` (idempotent — safe to re-run).
- ⚠ The daily summary doesn't track `body_measurements`/weight at all (probably intentional — separate timeseries).

### 2.4 Calorie tracking on the client
- ✅ `EnhancedDashboard.caloriesConsumed` correctly filters by today's date and sums `calories`.
- ✅ `caloriesBurned` falls back from server-aggregated `daily_summary.exercise_calories` to a client-side sum of today's exercises — robust against trigger lag.
- 🔴 **Cache bug:** `simpleStorage.setItem('calories_${date}', total)` was only written **when total > 0**, so deleting all today's meals left a stale value in the weekly chart. → **FIXED**.

---

## 3. UI ↔ Backend Connection

### 3.1 WaterTracking ↔ EnhancedDashboard (the prop-mismatch bug)
- 🔴 `EnhancedDashboard.tsx:671` rendered `<WaterTracking initialGlasses={waterGlasses} onUpdate={handleWaterUpdate} />`.
- The component **did not accept any props** — it had its own `useState` and Supabase calls.
- Result: the dashboard's local `waterGlasses` state was always 0; the **"Water" quick-stat card and the "Water Champion" achievement were broken** for every user.
- Hidden because `ignoreBuildErrors: true`.
- → **FIXED** by accepting both props in `WaterTracking.tsx` and notifying the parent on every change via `useEffect(() => onUpdate?.(glasses), [glasses, onUpdate])`. The component remains the source of truth (Supabase), but the parent now reflects it.

### 3.2 Other interactive flows reviewed
| Component | Action | Hookup | Error handling |
|---|---|---|---|
| `AddMealDialog` | `supabase.from('meals').insert(...)` | OK | `try/catch` + `alert` (could use `toast.error` for consistency) |
| `AddExerciseDialog` | `connection.reducers.addExercise()` | OK | `try/catch` + `alert` |
| `EditProfileDialog` | `update user_profiles` + recompute calories | OK | `try/catch` + `toast.error` |
| `EditGoalsDialog` | `upsert user_goals` | OK | `try/catch` + `toast.error` |
| `WaterTracking` | `upsert water_logs` (debounced 350 ms) | OK + Realtime subscription for multi-device sync | Silent failure (debounce). Consider a toast on persistent error. |
| `Onboarding` (page.tsx) | `upsert user_profiles` then `user_goals` | OK | `try/catch` + `alert` |
| `SettingsPage` → JSON export | client-only blob download | OK | `try/catch` |

### 3.3 Realtime
- ✅ The reset/cleanup logic in `useSupabase.tsx` (`clearRealtime()` + nonced channel names) is well-thought-out and prevents the classic Supabase "cannot add postgres_changes callbacks after subscribe()" error.

---

## 4. Dependency & Environment Scan

### 4.1 Dependencies (`package.json`)
- ✅ All Supabase + Capacitor + Prisma deps present and pinned.
- ⚠ `@capacitor/cli` and `@capacitor/core` are present but **no `@capacitor/android` or `@capacitor/ios` platforms**. `capacitor.config.ts` sets `androidScheme: 'https'`, suggesting Android was planned. If/when you build a native shell, run:
  ```bash
  yarn add @capacitor/android @capacitor/ios
  npx cap add android && npx cap add ios
  ```
- ⚠ `@types/request` and `request` are both deprecated (`request` has been EOL'd for years). Likely unused — `depcheck` will confirm. Suggest removal.
- ⚠ `spacetimedb` is imported nowhere in `/src` based on grep. Confirm and drop if unused.

### 4.2 Environment variables actually referenced in code
Scanned via `grep -rhE "process\.env\.[A-Z_]+" /app/src`:
- `NEXT_PUBLIC_SUPABASE_URL` (browser + server clients)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (browser client)
- `SUPABASE_SERVICE_ROLE_KEY` (server client only — `/share/*` OG image route)
- `NODE_ENV` (everywhere)

Vars *referenced in docs/schema but never read from `process.env` in source*:
- `DATABASE_URL`, `DIRECT_URL` — only used by `prisma/schema.prisma`. Since Prisma is unused, **these are effectively dead** at runtime.
- `USDA_API_KEY`, `GEMINI_API_KEY` — declared in `src/lib/env.ts` with safe defaults / placeholders. The USDA fallback is a public demo key. Not currently used by any API route on the read path I traced; verify with grep.
- `ADMIN_USERNAME`, `ADMIN_PASSWORD` — used by `src/lib/adminAuth.ts` / `src/app/api/admin/auth/route.ts`.

### 4.3 The validation bug
🔴 `env.ts → validateEnvironment()` only checked `USDA_API_KEY` (which has a fallback default, so it always passes). It **did not** validate the two `NEXT_PUBLIC_SUPABASE_*` vars — the only ones whose absence actually breaks the app. → **FIXED** to validate the Supabase vars directly from `process.env`.

### 4.4 Missing `.env.local`
- 🔴 Only `.env.local.example` exists in `/app`. Without `.env.local`, the Supabase browser client silently substitutes `'http://localhost'` and the dashboard renders blank.
- → `.env.local.example` updated with the **actual required keys**, comments, and explicit production-blocker warnings. User must `cp .env.local.example .env.local` and fill in real values.

---

## 5. Files Changed (summary)

| File | Change |
|---|---|
| `src/components/WaterTracking.tsx` | Accept optional `initialGlasses` & `onUpdate` props; notify parent on every change |
| `src/components/AddExerciseDialog.tsx` | Remove redundant `useSupabase()` instance; fetch weight via `connection.supabase` once with `.maybeSingle()` |
| `src/components/EditProfileDialog.tsx` | `.single()` → `.maybeSingle()` (×2) |
| `src/components/EditGoalsDialog.tsx`   | `.single()` → `.maybeSingle()` |
| `src/components/SettingsPage.tsx`      | `.single()` → `.maybeSingle()` (×2) |
| `src/components/EnhancedDashboard.tsx` | Achievement `earned: true` → computed from `weeklyData`; calorie cache also writes 0; deps fixed |
| `src/components/MealTrackingPage.tsx`  | Drop the unnecessary `as FoodItem & { meal_type?: string }` cast |
| `src/lib/env.ts`                       | `validateEnvironment()` now checks `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `migration_003_water_aggregation.sql`  | **NEW** — fixes `daily_summaries.total_water_ml` aggregation + trigger on `water_logs` |
| `.env.local.example`                   | Rewrote with actual required keys and explicit warnings |

All edits preserve the existing UI/UX and the data contract. No new dependencies were added.

---

## 6. Next Steps (recommended, not done in this pass)

1. **Apply `migration_003_water_aggregation.sql`** to your Supabase project (SQL editor → run).
2. **Create `.env.local`** with real Supabase credentials, then restart `next dev`.
3. **Flip `typescript.ignoreBuildErrors: true` → `false`** in `next.config.mjs` and fix whatever the compiler now complains about. (The fixes above should make the count manageable.)
4. **Decide on Prisma:** either delete `prisma/`, `@prisma/client`, `prisma`, `DATABASE_URL`, `DIRECT_URL` — or actually use it in API routes.
5. **Drop unused deps:** `request`, `@types/request`, `spacetimedb` (verify with `npx depcheck`).
6. **Add a regression test** for `WaterTracking` to prevent another prop-drift bug — even a simple Playwright "fill 3 glasses → reload → see 3 glasses" smoke test.
7. **Align "build muscle" calorie surplus** to a single value (currently +500 in actions, +300 in the recommendations card).
