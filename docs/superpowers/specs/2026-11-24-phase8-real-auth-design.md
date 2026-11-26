# Phase 8 — Real authentication and per-user storage

**Date:** 2026-11-24 · **Status:** approved by Everton · **Size:** half a day

## Intent

Replace the dev-mock login (any email/password, a `campaigniq_dev_auth` cookie,
and an `X-User-Email` header the API trusts) with real Supabase accounts, so each
user can only see their own saved analyses and a public link becomes safe.

## Goals
- Only invited users can sign in.
- The API accepts only requests carrying a valid Supabase JWT; identity is the
  token's `sub` (user id), never a header the client can set.
- Saved analyses live in Supabase Postgres with row-level security and survive
  redeploys.
- Tests prove: no token → 401; forged token → 401; user A cannot read user B.

## Non-goals (later phases)
Roles/teams, Google/SSO sign-in, billing, open self-serve sign-up.

## Anti-goals
Leaving the dev mock in behind a flag; shipping without the isolation test.

## Constraints
- Supabase project `campaigniq` (ref `shcmrlugoytwwgkxhedn`, eu-west-2, Postgres 17).
- Frontend: Next 16, `@supabase/ssr` already a dependency; helpers stubbed in
  `frontend/lib/supabase/`.
- API: FastAPI; slim deploy must keep working (`requirements.lock.txt`).

## Approaches considered
1. **JWT-verified API + Supabase table with RLS** — chosen. Durable storage,
   defence in depth (RLS + API filter), personas/topics keep working server-side.
2. JWT check only, keep the JSON file store — quicker, but data is wiped on every
   redeploy and there is no second line of defence.
3. Browser talks to Supabase directly for storage — the API still needs the saved
   analysis for personas/topics/bias, so the server path is required anyway.

## Decisions
- **Invite-only**: users are created from the Supabase dashboard
  (Authentication → Users → Invite). Signup UI is removed.
- **Login**: `/login` uses `supabase.auth.signInWithPassword`; "Forgot password"
  sends the reset email; `/auth/update-password` already exists.
- **Session**: HTTP-only cookies via `@supabase/ssr`; `proxy.ts` uses
  `lib/supabase/middleware.ts` (`updateSession`) to guard `/dashboard` and the
  module pages.
- **API auth**: `Authorization: Bearer <access_token>` on every request.
  A FastAPI dependency `current_user()` verifies the token with
  `supabase.auth.get_user(token)` (server-side check against the project; no
  local key handling), caches nothing sensitive, and returns `user_id` + `email`.
  Missing/invalid → 401.
- **Storage**: table `public.analyses` (`id text pk`, `user_id uuid not null`,
  `name`, `country_id`, `source`, `total int`, `dominant_label`, `mean_compound
  float8`, `languages_detected int`, `created_at timestamptz`, `batch jsonb`,
  `original_texts jsonb`). RLS on; policy `user_id = auth.uid()` for
  select/insert/update/delete. API uses the service-role key and always filters
  by the verified `user_id`.
- **Data store module**: `analyses_store.py` keeps its public interface
  (`save_analysis`, `list_analyses`, `get_analysis`, `delete_analysis`) but takes a
  `user_id` instead of an email and talks to Supabase via `supabase-py`.
  The file backend remains only as a test fallback when `SUPABASE_URL` is unset.
- **Env**: API reads `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
  (documented in `api/.env.example`, `docs/DEPLOYMENT.md`). Frontend unchanged.
- **Migration**: one-off script `scripts/migrate_analyses_to_supabase.py` moves
  existing JSON analyses to the table for a given user id.
- **Frontend API client**: `lib/api.ts` attaches the session access token from
  the browser Supabase client; `getDevUserEmail()` and the dev cookie are deleted.

## Left to the builder
Exact UI copy on the login page; whether to show the user's email in the
dashboard header (yes, from the session); logging format for 401s.
