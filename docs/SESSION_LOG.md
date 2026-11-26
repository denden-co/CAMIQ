# CAMIQ — Session and Security Log

Moved from the root `CLAUDE.md` on 2026-11-26. Historical record only; the current state lives in `CLAUDE.md`.

## Security log

- **2026-07-02** — Cleared the GitHub Dependabot alerts (4 reported: 1 high, 2 moderate, 1 low):
  - **npm (frontend):** `npm audit fix --legacy-peer-deps` resolved vite (high, GHSA-fx2h-pf6j-xcff + launch-editor GHSA-v6wh-96g9-6wx3), js-yaml (moderate, GHSA-h67p-54hq-rp68), @babel/core (low, GHSA-4x5r-pxfx-6jf8). `npm audit` now 0 vulnerabilities.
  - **pip (api venv):** upgraded fastapi→0.139.0 (pulls starlette 1.3.1, fixes PYSEC-2026-161/248/249, CVE-2026-48817/48818), python-multipart→0.0.32 (CVE-2026-40347/42561/53538–53540), pyjwt→2.13.0, pydantic-settings→2.14.2, urllib3→2.7.0, cryptography→49.0.0, idna→3.18. Security floors added to `api/requirements.txt`.
  - **Accepted risks (no fixed release yet):** nltk 3.9.4 (PYSEC-2026-597) and torch 2.11.0 (CVE-2025-3000) — both in the heavy-ML dependency chain, not used in v0 request paths. Re-check next session.
  - Verified: `tsc --noEmit` clean, API restarts and serves `/api/countries` + `/api/analyze`, dashboard renders end-to-end.
- **2026-04-29** — Resolved 3 moderate npm advisories (commit `b9d2c96`):
  - `postcss` → `^8.5.12` (GHSA-qx2v-qp2m-jg93, XSS via unescaped `</style>`)
  - `next-intl` → `^4.11.0` (GHSA-8f24-v5vv-gm5j, open redirect)
  - `next` → `^16.2.4` (transitive postcss)
  - Added `overrides.postcss = ^8.5.12` to force-resolve Next's bundled copy.
  - Verified: `npm audit` reports 0 vulnerabilities; `tsc --noEmit` passes.
  - Pre-existing: ESLint 8.57.1 ↔ eslint-config-next 16 peer-dep mismatch — `npm install` needs `--legacy-peer-deps`. Worth a future cleanup (Audit Priority 3.5).

## Session notes

- **Session 2026-11-24 (health review fixes):** repo moved to `~/Desktop/CAMIQ.nosync`; clean-checkout build fixed (Supabase client optional); `/health` now reports `sentiment`/`topics`/`degraded` truthfully and the UI shows a reduced-accuracy banner; scikit-learn in slim requirements so topics work on Render; batch caps (5,000 chars/item, 1M/request) + `run_in_threadpool` for inference; LLM calls 45 s timeout + 1 retry, 503 on provider outage; npm audit 0 (Next 16.4.6); `api/requirements.lock.txt` pinned; 18 pytest + 4 vitest tests; GitHub Actions CI at `.github/workflows/ci.yml`. Phase 8 real auth landed the same day: JWT-verified API, `public.analyses` table with RLS, invite-only accounts.

- GitHub repo: https://github.com/denden-co/CAMIQ
- **Session 2026-06-10b (full LLM provider catalogue):**
  - `/api/llm/providers` now returns a `catalogue` of ALL supported providers (configured flag, default model, env key) alongside the legacy `providers` list.
  - New `huggingface` provider in llm.py registry (HF Inference router, OpenAI-compatible, env `HF_TOKEN`, default `meta-llama/Llama-3.3-70B-Instruct`) — covers Meta Llama models.
  - `components/provider-picker.tsx` — shared provider + model-override fields used by Personas and Strategy. Unconfigured providers visible but disabled with the env key that enables them.
  - Both generate calls now pass `model` override (backend already supported it).
- **Session 2026-06-10 (professional-polish pass):**
  - **Repo restructure:** scratch files moved out of root — plans/audits → `docs/`, old HTML previews → `docs/archive/`, helper scripts → `scripts/`, test CSVs → `samples/`. Root now: README, CLAUDE.md, api, frontend, shared, docs, samples, scripts.
  - **Legacy class rename (audit 3.3):** `btn-gradient` → `btn-primary`, `text-gradient` → Tailwind `text-accent`, `hero-mesh` → plain `bg-background`, `card-glass` → `card-surface`, `divider-gradient` → `divider`. Dead aliases and unused animations deleted from globals.css.
  - **ESLint 9 (audit 3.5):** flat config at `frontend/eslint.config.mjs` (FlatCompat + next/core-web-vitals). `next lint` is gone in Next 16, so `npm run lint` = `eslint .`. **Run `npm install --legacy-peer-deps` once to pull eslint 9 + @eslint/eslintrc.**
  - **⌘K command palette (audit 2.3):** `components/command-palette.tsx`, dependency-free (no cmdk), mounted in root layout. ⌘K/Ctrl-K everywhere; buttons dispatch `camiq:open-palette`.
  - **Module nav rail (audit 2.4):** `components/module-nav.tsx` — module links in PageShell top bar (hidden < md), current page highlighted, plus ⌘K trigger button.
  - **Legal pages (audit 3.2):** real UK-GDPR-aware content for `/legal/{privacy,terms,cookies,security}` via shared `components/legal-page.tsx`. ⚠️ Drafted by AI — have a solicitor review before public launch.
  - **Deployment prep (Phase 7):** CORS origins now read from `CORS_ORIGINS` env var (api/main.py); `api/.env.example`, `frontend/.env.example`, `api/Procfile`, `api/render.yaml`, and step-by-step [`docs/DEPLOYMENT.md`](./DEPLOYMENT.md).
  - **README** rewritten to match the shipped product (Next 16/React 19, accurate modules, new repo layout).
  - Typed routes: new nav components use `Route` from "next" for href types.
  - Verified: `tsc --noEmit` clean, `py_compile main.py` clean. `npm run lint`/`next build` still to be verified on the Mac after `npm install --legacy-peer-deps`.
- **Session 2026-04-29:**
  - Security patch (commit `b9d2c96`) + ~18 days of accumulated Phase 6 follow-up shipped.
  - Wrote [`FRONTEND_AUDIT_2026-04-29.md`](./FRONTEND_AUDIT_2026-04-29.md) — full audit against the Frontend Prompt Instructions rubric (29 Apr 2026, e.dennis7@icloud.com → eveden02@icloud.com email).
  - Shipped all 5 Priority-1 quick wins (commit `02842d7`): lucide icons, drop rainbow gradients, 8px corners, zero letter-spacing, always-visible CTAs.
  - Added `/` → `/dashboard` redirect for signed-in users (commit `c530dc3`).
  - Removed all remaining emoji from `/analyze`, `/personas`, `/strategy`, `/bias`, `/countries` headers and inline maps (commit `e3ee423`). PageShell prop renamed `icon: string` → `Icon: LucideIcon`.
  - Made CountryPicker error state recoverable in-place (commit `7436d6d`) — adds `refetch()` to country-context, retry button to picker.
  - Memory note: the previous CLAUDE.md description of "indigo-violet gradient design system" was incorrect — the actual code had been refactored to clean monochrome + indigo accent. This file now reflects reality.
- New files in repo: `FRONTEND_AUDIT_2026-04-29.md`, `FRONTEND_IMPROVEMENT_PLAN.md`, `multi-lang-test.csv`, `start-dev-backend.command`, plus stub pages `/about /blog /changelog /contact /legal/{cookies,privacy,security,terms} /status`.
