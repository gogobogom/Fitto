# Fitto — PRD / Status

## Original Problem
Fitto project cleanup: ~38 remaining TS errors after a major cleanup
(Prisma, performanceIndex.ts barrel, deprecated deps removed;
`src/types/supabase.ts` updated with `InsertOf`/`UpdateOf` helpers for
Supabase-js v2). Goals:
1. Resolve all TS errors → zero-error `tsc --noEmit`.
2. Configure Capacitor for iOS/Android pointing at Next.js static export.
3. Install husky + lint-staged with a pre-push hook running `tsc --noEmit`
   to prevent regressions.
4. Ignore offline Grok/Railway RAG service. Local + Supabase only.

## Architecture
- Next.js 15 (App Router) + React 19 + TypeScript 5.8 (strict).
- Supabase (`@supabase/supabase-js` v2) for auth/data.
- Capacitor 8 wrapping the static export for iOS/Android.
- Tailwind + Radix UI for the design system.
- Husky + lint-staged for git hooks.

## Implemented (2026-01)
- **TS errors: 38 → 0** (`tsc --noEmit` is clean). Targeted minimal fixes:
  - `src/app/api/proxy/route.ts`: typed `parsed` shape; safe `error.message` narrowing.
  - `src/lib/requestBatching.ts`: removed duplicate `BatchProcessor` identifier; renamed type alias to `BatchProcessorFn`.
  - `src/hooks/useRenderOptimization.ts`: `useRef<T | undefined>(undefined)` for React 19 ref typing.
  - `src/components/ui/lazy-image.tsx`: narrowed `src` to `string` in `ProgressiveImage`.
  - `src/app/page.tsx`: `AICoachOrchestrator` prop renamed `identity` → `userId`.
  - `src/app/tarifler/page.tsx`: dropped unsupported `connection` prop on `RecipeSearch`.
  - `src/components/ABTestingDashboard.tsx`: cast demo variant to `Variant` for display.
  - `src/components/Dashboard.tsx`: cast tab states for `BottomNav`/`onNavigate`.
  - `src/components/DetailedReportCard.tsx`: import `supabase` client directly (was destructuring a non-existent field).
  - `src/components/MorePage.tsx`: `currentDate` now `string`; removed unsupported `connection` prop on `FavoriteFoods`.
  - `src/components/SettingsPage.tsx`: pass `connection as SupabaseConnection` to `SubscriptionManager`.
  - `src/components/SubscriptionManager.tsx`: upsert uses `user_id` (was `identity`, which the Subscription type doesn't have).
  - `src/hooks/useCriticalCSS.ts`: type-extend `CSSStyleDeclaration` for `fontDisplay`.
  - `src/hooks/useFormPerformance.ts`: explicit cast for `validators[field]`.
  - `src/hooks/useLighthouseMetrics.ts`: callback return is `(() => void) | void`.
  - `src/hooks/useResourceCleanup.ts`: replaced erroneous `useRef` destructure with single `useRef`.
  - `src/hooks/useSSRPerformance.ts`: extended `connection` type with `add/removeEventListener`.
  - `src/lib/apiPerformance.ts`: typed retry callback param.
  - `src/lib/componentLoader.ts`: aligned `loading` option with `next/dynamic`'s signature.
  - `src/lib/domPerformance.ts` & `src/lib/lighthouseOptimization.ts`: cast 'test' event type for passive-support detection.
  - `src/lib/openfoodfacts.ts`: cast normalized API response.
  - `src/lib/revenuecat.ts`: `getCustomerInfo()` destructures `{ customerInfo }` (matches v11 SDK shape).
  - `src/lib/ssrPerformance.ts`: simplified `precomputeData` index write.
  - `src/lib/supabaseConnectionPool.ts`: cast partial data to `never` for v2 strict insert/update typing.
  - `src/lib/toast.ts`: defaulted optional cancel.onClick to no-op (sonner requires the handler).
  - `src/lib/webVitals.ts`: removed `onFID` (deprecated in web-vitals v5).

- **Capacitor mobile setup**:
  - Added `@capacitor/android@^8` and `@capacitor/ios@^8`.
  - `capacitor.config.ts` keeps `webDir: 'out'`, appId `com.fitto.app`.
  - `next.config.mjs` now toggles `output: 'export'` + `images.unoptimized` via `MOBILE_BUILD=true` so API routes still work on web while mobile gets a static bundle.
  - New scripts:
    - `yarn build:mobile` — produces `out/` for Capacitor.
    - `yarn sync:android` / `yarn sync:ios` — build + `npx cap sync`.

- **Regression prevention**:
  - `husky@9` initialized; `prepare` script wired.
  - `.husky/pre-push`: runs `npx tsc --noEmit` (whole-project type-check).
  - `.husky/pre-commit`: runs `npx lint-staged`.
  - `lint-staged` config: `next lint --fix --file` on staged `*.{js,jsx,ts,tsx}`.
  - New script: `yarn typecheck`.

## Verified
- `npx tsc --noEmit` → **0 errors, exit 0** (was 38).
- `bash .husky/pre-push` → exits 0.

## Backlog / Next Steps
- Run `npx cap add android` & `npx cap add ios` to scaffold native projects (requires Android SDK / Xcode locally — out of scope for this container).
- Audit remaining `as any` / `as never` casts introduced for the zero-error build and tighten incrementally.
- Replace `connection={null as any}` placeholders in `MorePage.tsx` once the underlying components are migrated to Supabase-only props.
- Optional: add `tsc --noEmit` to CI in addition to the local pre-push hook.

## Notes
- Offline Grok / Railway RAG service intentionally untouched per problem statement.
- No auth credentials created or modified in this iteration.
