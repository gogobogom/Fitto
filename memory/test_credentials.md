# Fitto - Test Credentials

> Stored locally only. Do not commit to git (covered by `.gitignore`).

## Supabase Project
- **Project URL:** `https://wkpsimlalongfpjwovtx.supabase.co`
- **Region:** `aws-1-ap-south-1`
- **Anon key (publishable):** stored in `/app/.env.local` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Service role (secret):** stored in `/app/.env.local` → `SUPABASE_SERVICE_ROLE_KEY`
- **Database password:** *not stored here.* Replace `[YOUR-PASSWORD]` in `DATABASE_URL` / `DIRECT_URL` before running Prisma migrations.

## Test Account
A test account is created on demand from the signup page (`/auth/signup`) and via the smoke-test script. Suggested credentials:

| Field    | Value                              |
|----------|------------------------------------|
| Email    | `tester@fitto.dev`                 |
| Password | `Fitto1234!`                       |
| Name     | `Fitto Tester`                     |

> Email confirmation is **off** in Supabase Auth settings, so signup → login works in one step. If you turn confirmation on, complete the magic link first.

## How to verify connectivity manually
```bash
# 1. food_database should return 230 rows
curl -s -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/food_database?select=count"

# 2. user_profiles, user_goals, meals, exercises, daily_summaries also reachable
for t in user_profiles user_goals meals exercises daily_summaries; do
  curl -s -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
    "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/${t}?select=count"; echo
done
```

## Migration to apply
The canonical schema lives in `/app/migration.sql`. Run it once in Supabase SQL Editor. After it succeeds you also get:

- `water_logs`, `body_measurements`, `subscriptions`, `trial_status`, `ai_messages`
- Auto-create trigger (`on_auth_user_created`) that seeds `user_profiles` + `subscriptions` + `trial_status` for every new signup
- `recalc_daily_summary()` triggers that keep `daily_summaries` in sync with `meals` / `exercises`
- RLS policies (`auth.uid()` owner-only)
- Realtime publication for the user-facing tables
