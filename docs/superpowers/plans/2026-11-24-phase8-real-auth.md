# Phase 8 — Real Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dev-mock login and the client-trusted `X-User-Email` header with Supabase accounts, JWT-verified API calls, and per-user storage under row-level security.

**Architecture:** The browser signs in with Supabase and holds an HTTP-only session cookie; it sends the access token as `Authorization: Bearer` to FastAPI. A FastAPI dependency verifies the token via `supabase.auth.get_user()` and yields `user_id`. `analyses_store` writes to a Supabase `analyses` table (RLS on) using the service-role key, always filtered by the verified `user_id`; the JSON file backend stays only for tests.

**Tech Stack:** Next 16 + `@supabase/ssr` + `@supabase/supabase-js`; FastAPI + `supabase` (supabase-py); Supabase Postgres 17 (project `shcmrlugoytwwgkxhedn`, eu-west-2).

**Spec:** `docs/superpowers/specs/2026-11-24-phase8-real-auth-design.md`

## Global Constraints
- Invite-only: no sign-up UI; users are created in the Supabase dashboard.
- API identity comes only from the verified token `sub`; never from a header or body.
- Slim deploy must keep working: `supabase` added to `requirements.txt` and the lock regenerated.
- Dev mock (`campaigniq_dev_auth` cookie, `campaigniq_dev_user` localStorage, `X-User-Email`) is deleted, not flagged.
- All existing tests keep passing; CI stays green.

## Review Focus
1. Expired access token mid-session → frontend refreshes via `updateSession`; API returns 401, client shows "Session expired — sign in again" (test in Task 4).
2. Token from a different Supabase project (valid JWT shape, wrong issuer) → 401 (Task 3 test with a random JWT).
3. Analysis id that exists but belongs to another user → 404, not 403 (Task 2 test).
4. `SUPABASE_URL` unset in production → API refuses to start rather than silently using the file store (Task 2: file backend only when `CAMIQ_STORE=file`).
5. Very large `original_texts` (500 × 5,000 chars ≈ 2.5 MB JSON) → fits in jsonb; insert succeeds (Task 2 test with 500 items).

---

### Task 1: Database table + RLS (Supabase migration)

**Files:**
- Create: `supabase/migrations/20261124_analyses.sql` (also applied via Supabase MCP `apply_migration`)

**Interfaces:**
- Produces: table `public.analyses` with columns `id text primary key, user_id uuid not null references auth.users(id) on delete cascade, name text not null, country_id text, source text not null default 'paste', total int not null, dominant_label text not null, mean_compound float8 not null, languages_detected int not null default 0, created_at timestamptz not null default now(), batch jsonb not null, original_texts jsonb not null default '[]'`; index on `(user_id, created_at desc)`; RLS enabled; policy `analyses_owner` for all commands `using (user_id = auth.uid()) with check (user_id = auth.uid())`.

- [ ] Step 1: Write the SQL file above.
- [ ] Step 2: Apply it with `apply_migration` (name `analyses_table_rls`).
- [ ] Step 3: Verify: `get_advisors(type=security)` reports no RLS warning for `analyses`; `list_tables` shows the table.
- [ ] Step 4: Commit `supabase/migrations/20261124_analyses.sql`.

### Task 2: API store on Supabase + user_id interface

**Files:**
- Modify: `api/app/services/analyses_store.py` (full rewrite, same public names)
- Modify: `api/requirements.txt` (+`supabase>=2.3.0`), regenerate `api/requirements.lock.txt`
- Modify: `api/.env.example` (+`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CAMIQ_STORE`)
- Test: `api/tests/test_analyses_store.py`, `api/tests/conftest.py`

**Interfaces:**
- Produces: `save_analysis(payload: SaveAnalysisRequest, user_id: str) -> SavedAnalysis`, `list_analyses(user_id: str) -> list[AnalysisSummary]`, `get_analysis(user_id: str, analysis_id: str) -> SavedAnalysis | None`, `delete_analysis(user_id: str, analysis_id: str) -> bool`. Backend chosen at import: `CAMIQ_STORE=file` → JSON files under `_DATA_DIR/<user_id>/`; otherwise Supabase (requires `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`, else `RuntimeError` at startup).
- `SaveAnalysisRequest.user_email` field removed from `api/app/schemas/analyses.py`.

- [ ] Step 1: In `conftest.py` set `monkeypatch.setenv("CAMIQ_STORE","file")` before importing `main`; add fixture `auth_headers(user_id="11111111-1111-1111-1111-111111111111")` returning `{"Authorization": "Bearer test-<user_id>"}` (Task 3 makes the verifier accept `test-<uuid>` tokens only when `CAMIQ_AUTH=fake`; set that env too).
- [ ] Step 2: Update `test_analyses_store.py`: round trip; other user (different uuid) → 404; delete → 204 then 404; 500-item payload saves.
- [ ] Step 3: Run `pytest api/tests/test_analyses_store.py` → FAIL (signature / auth).
- [ ] Step 4: Rewrite `analyses_store.py` with a `_FileBackend` and `_SupabaseBackend` class sharing the four methods; module functions delegate to the selected backend. Supabase rows map 1:1 to `SavedAnalysis` fields; `batch` and `original_texts` stored as JSON.
- [ ] Step 5: Run the tests → PASS. Commit.

### Task 3: API auth dependency

**Files:**
- Create: `api/app/auth.py`
- Modify: `api/app/routers/analyses.py`, `personas.py`, `strategy.py`, `topics.py`, `bias.py` (replace `_require_user` with `Depends(current_user)`)
- Test: `api/tests/test_auth.py`

**Interfaces:**
- Produces: `class CurrentUser(BaseModel): id: str; email: str | None`; `async def current_user(authorization: str | None = Header(None)) -> CurrentUser`. Raises `HTTPException(401, "Missing bearer token")` / `(401, "Invalid or expired token")`. Verification: `supabase.create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).auth.get_user(token)`. When `CAMIQ_AUTH=fake`, accepts `test-<uuid>` tokens and returns that uuid (tests only; refused if `SUPABASE_URL` is set).

- [ ] Step 1: Tests: no header → 401; `Bearer not-a-token` → 401; random well-formed JWT (`eyJ...` three segments) → 401 (fake mode rejects anything not `test-<uuid>`); `test-<uuid>` → 200 on `GET /api/analyses`.
- [ ] Step 2: Run → FAIL. Implement `auth.py`; swap routers to `user: CurrentUser = Depends(current_user)` and pass `user.id` to the store.
- [ ] Step 3: Run full `pytest` → PASS. Commit.

### Task 4: Frontend — real login, session guard, bearer token

**Files:**
- Modify: `frontend/app/login/page.tsx` (signInWithPassword, forgot-password link, error copy)
- Create: `frontend/app/auth/reset-password/page.tsx` (email form → `resetPasswordForEmail`, redirect to `/auth/update-password`)
- Modify: `frontend/proxy.ts` (delegate to `updateSession`; guard `/dashboard`, `/analyze`, `/personas`, `/strategy`, `/bias`, `/countries`)
- Modify: `frontend/lib/api.ts` (delete `getDevUserEmail`/`authHeader`; add `async function authHeader()` reading `supabase.auth.getSession()`; all authed calls `await` it; 401 → throw `SessionExpiredError`)
- Modify: `frontend/app/dashboard/page.tsx`, `sign-out-button.tsx` (user email from session; sign out via `supabase.auth.signOut()` then `/login`)
- Modify: `frontend/app/page.tsx` redirect check: session via server client instead of dev cookie
- Test: `frontend/lib/__tests__/api-auth.test.ts`

**Interfaces:**
- Consumes: `createClient()` from `lib/supabase/client.ts`; `updateSession` from `lib/supabase/middleware.ts`.
- Produces: `class SessionExpiredError extends Error`.

- [ ] Step 1: Test: `authHeader()` returns `{Authorization: "Bearer <token>"}` when a session mock exists and `{}` otherwise; a 401 response makes `getAnalysis` throw `SessionExpiredError`.
- [ ] Step 2: Run `npx vitest run` → FAIL. Implement.
- [ ] Step 3: `npx tsc --noEmit`, `eslint .`, `next build` (no env) → PASS. Commit.

### Task 5: Migration script, docs, deploy config

**Files:**
- Create: `scripts/migrate_analyses_to_supabase.py` (args: `--user-id <uuid> --from api/data/analyses/<folder>`)
- Modify: `docs/DEPLOYMENT.md` (new env vars; invite-only steps), `README.md` (first-run: Supabase vars now required for login), `CLAUDE.md` (Phase 8 done; dev mock removed), `api/render.yaml` (env placeholders)
- Modify: `api/tests/test_analyses_store.py` remove `_safe_key` test if the function is gone.

- [ ] Step 1: Run the migration for Everton's folder `evertondennis1_gmail.com` once his user exists (after Task 6 invite).
- [ ] Step 2: Full `pytest` + frontend checks → PASS. Commit.

### Task 6: Live verification with the user

- [ ] Step 1: Invite Everton's email in Supabase (dashboard or `auth.admin.invite_user_by_email` via MCP SQL is not available → dashboard).
- [ ] Step 2: He sets a password from the invite email, signs in at `/login`, lands on `/dashboard`, sees migrated analyses.
- [ ] Step 3: Confirm `curl /api/analyses` with no token → 401; with a second account's token → cannot see his rows.
- [ ] Step 4: Push; CI green.
