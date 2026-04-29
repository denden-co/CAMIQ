# CampaignIQ (CAMIQ)

Global political intelligence platform — sentiment analysis, text analysis, voter persona generation, and AI strategy for elections worldwide.

## Tech stack

- **Frontend:** Next.js 14+ (App Router, TypeScript, Tailwind CSS, shadcn/ui, next-intl, Recharts)
- **Backend:** Python FastAPI
- **ML/NLP:** XLM-RoBERTa (multilingual), BERTweet (English), VADER, TextBlob, SVM, Random Forest, XGBoost, CNN, LSTM, BERTopic, LDA, NMF, K-Means, DBSCAN, NER, TF-IDF, Word2Vec
- **Database/Auth:** Supabase (PostgreSQL, Auth, Storage, RLS)
- **Deployment:** Vercel (frontend) + Railway/Render (Python API)
- **LLM Providers:** Google Gemini, OpenAI, Anthropic Claude, Deepseek, Mistral, Cohere, Meta Llama, HuggingFace, custom OpenAI-compatible

## Repository structure

Monorepo with:
- `frontend/` — Next.js app
- `api/` — FastAPI backend
- `shared/` — shared types/configs

## Commands

```bash
# Frontend
cd frontend && npm run dev      # dev server
cd frontend && npm run build    # production build
cd frontend && npm run lint     # ESLint
cd frontend && npm run test     # Vitest

# Backend
cd api && pip install -r requirements.txt
cd api && uvicorn main:app --reload  # dev server
cd api && pytest                     # tests
```

## Key design decisions

- **Global scope:** Works for ANY country's elections, not just UK
- **Country/election config system:** JSON profiles for parties, electoral systems, languages
- **Electoral system awareness:** FPTP, PR, MMP, two-round — adapts predictions and disclaimers
- **Multi-algorithm engine:** Users pick algorithms or use auto-recommend; compare models side-by-side
- **Built-in data cleaning:** Duplicates, nulls, text normalisation, bot detection, encoding fixes
- **Multilingual:** XLM-RoBERTa for 100+ languages, BERTweet specialist for English, language auto-detection

## Origin

Derived from doctoral thesis: "Analyzing Twitter/X Sentiment and Topic Signals for the 2024 UK General Election" by Everton Dennis at University of East London. The thesis ensemble model (weighted RoBERTa + BERTweet) achieved 80.3% accuracy/F1 for 3-class sentiment.

## Local paths

- **Mac path:** `~/Desktop/Cam/CAMIQ`
- **Git remote:** `origin https://github.com/denden-co/CAMIQ.git` (HTTPS)
- **Branch:** `main`
- **Last pushed commit:** `7436d6d` (CountryPicker retry button) — pushed 2026-04-29
- **Recent commits this session (2026-04-29):**
  - `b9d2c96` security: bump postcss/next-intl/next + Phase 6 follow-up files
  - `c530dc3` feat(home): redirect signed-in users from / to /dashboard
  - `02842d7` refactor(ui): five quick wins from frontend audit
  - `e3ee423` refactor(ui): remove all remaining emoji from module pages
  - `7436d6d` feat(country-picker): add retry on fetch failure

## Build progress (as of 2026-04-29)

### Completed phases

1. **Phase 1** — Core sentiment analysis: single text, batch, CSV upload. XLM-RoBERTa multilingual + BERTweet English. Language auto-detection, key phrase extraction, aggregate stats.
2. **Phase 2** — Country configuration system: JSON profiles for parties, electoral systems, languages. CountryPicker component, country-context provider.
3. **Phase 3** — Topic modelling (BERTopic via API), analysis detail page with Recharts bar charts (topic size, sentiment composition), export to CSV/JSON/PDF.
4. **Phase 4** — Voter Personas (LLM-generated via multi-provider), AI Strategic Advisor (recommendations, risk factors, executive summary), Bias & Fairness Audit (4/5ths rule, chi-square independence, corpus skew, language group breakdown).
5. **Phase 5** — Responsive design polish: Tailwind mobile-first breakpoints on all pages, shared Spinner component, loading states on all buttons/data fetches.
6. **Phase 6** — Premium UI redesign (initially "indigo-violet gradient" per Quorum/Linear/Vercel, since refactored to clean monochrome — see Phase 6.5 below). Inter font, PageShell shared layout, premium data tables, refined form inputs.
7. **Phase 6.5 (2026-04-29 cleanup)** — Refactored Phase 6 against [Frontend Prompt Instructions](./FRONTEND_AUDIT_2026-04-29.md) rubric. Monochrome ink + single indigo accent (no more dominant gradient palette). Lucide icons replace all emoji and geometric glyphs throughout the app. 8px corner radius on cards. Letter-spacing 0 (was -0.03em). Always-visible CTAs. `/` redirects signed-in users to `/dashboard`. CountryPicker has a retry button instead of stuck error state. Legacy class names (`btn-gradient`, `text-gradient`, `hero-mesh`, etc.) retained as aliases but now render flat/monochrome.

### Key UI components

- `frontend/components/page-shell.tsx` — shared nav + page header. Accepts `Icon: LucideIcon` prop (renders in a 1px-bordered square). `← Dashboard` link uses lucide `ArrowLeft`.
- `frontend/components/spinner.tsx` — animated SVG loading spinner
- `frontend/components/ui/button.tsx` — `btn-gradient` (now solid ink), `accent`, `outline`, `ghost`, `secondary` variants
- `frontend/components/country-picker.tsx` — country selector dropdown with retry button on fetch failure (lucide `RefreshCw`)
- `frontend/components/csv-upload.tsx` — CSV file upload with column picker
- `frontend/lib/country-context.tsx` — country list provider exposes `refetch()` for in-place retry

Icon convention: lucide-react throughout (no emoji or hand-drawn SVG except language flags 🇬🇧🇫🇷… which are intentional cultural identifiers, and the few flag emoji in `/analyze`'s LANG_FLAGS map). Icons render at `h-5 w-5` with `strokeWidth={1.75}` in headers, `h-4 w-4` strokeWidth 1.75–2 elsewhere.

### Design system (globals.css)

**Foundation: monochrome — `#FAFAF9` canvas, `#0A0A0A` ink, `#FFFFFF` cards, single indigo accent `#4F46E5`. 1px borders, no glows or orbs.**

Colour tokens: `--background`, `--foreground` (ink), `--card`, `--primary` (ink for CTAs), `--accent` (indigo-500 for highlights and the secondary CTA), `--accent-soft` (`#EEF2FF`), `--muted`, `--border`, `--ring`, semantic `--success/--warning/--danger`.

Legacy "gradient" class names retained as backwards-compat aliases — they all render flat: `.hero-mesh` = flat canvas, `.text-gradient` = solid indigo, `.btn-gradient` = solid ink, `.gradient-border` = 1px border, `.divider-gradient` = 1px line. Worth renaming in a future pass (see Frontend Audit doc Priority 3.3).

Other classes: `.input-refined`, `.table-premium`, `.stat-badge`, `.chip`, `.chip-accent`, `.nav-bar`, `.card-glass`, `.card-hover`, `.logomark`, `.dot`.

Custom shadows in tailwind.config.ts: `glow` and `glow-lg` (subtle ink ring), `soft`, `card`, `card-hover`. All shadows are now ink-based not colour-tinted.

Headlines: `letter-spacing: 0` (was `-0.03em`). Inter is optically tight enough.

### Current state

- Dev-mode auth via localStorage mock + `campaigniq_dev_auth` cookie. Login form at `/login` accepts any email + password.
- `/` redirects signed-in users (cookie present) to `/dashboard`; otherwise renders the marketing landing page.
- Frontend: localhost:3000, API: localhost:8000
- All 6 modules live and tested. Module page headers use lucide icons (`BarChart3`, `Users`, `Sparkles`, `Scale`, `Globe2`).
- Dashboard module grid uses neutral cards (no rainbow gradients) with lucide icons + always-visible "Open module →" CTA.
- TypeScript compiles with zero errors. `next build` succeeds with `/` correctly marked Dynamic and all other routes Static.

### Running the stack locally

```bash
# Frontend (kill any running first if needed):
cd ~/Desktop/Cam/CAMIQ/frontend && npm run dev      # :3000

# Backend (FastAPI):
cd ~/Desktop/Cam/CAMIQ/api && source .venv/bin/activate && \
  uvicorn main:app --host 127.0.0.1 --port 8000      # :8000
```

The dashboard's `CountryPicker` and `Recent Analyses` table both call the API. If the API is down on first paint, the picker shows "Country service unavailable — retry" (clickable, no page reload needed). Sentiment analysis at `/analyze` posts to `/api/analyze`.

### Pending (next phases)

- **Phase 7** — Deployment: Vercel (frontend) + Railway/Render (API)
- **Phase 8** — Supabase auth integration (replace dev mock + cookie). `/` redirect already accepts a Supabase session cookie — just add a second check alongside `campaigniq_dev_auth`.
- **Phase 9** — Real-time data ingestion (Twitter/X API)
- **Phase 10** — Additional ML models beyond XLM-RoBERTa

### From the frontend audit — still outstanding

(Full doc: [`FRONTEND_AUDIT_2026-04-29.md`](./FRONTEND_AUDIT_2026-04-29.md). Priority 1 wins are all shipped.)

- **Priority 2.2** — replace mock product preview on `/` with a live snapshot of an actual analysis
- **Priority 2.3** — global ⌘K command palette (`cmdk` library)
- **Priority 2.4** — module-to-module nav rail (currently only "← Dashboard" back-link)
- **Priority 3.1** — decide whether `/` should drop the marketing page entirely (Option B in audit)
- **Priority 3.2** — fill in `/legal/{privacy,terms,cookies,security}` stubs or hide from footer
- **Priority 3.3** — rename misleading legacy classes (`btn-gradient` → `btn-primary`, etc.)
- **Priority 3.5** — eslint 8 → 9 migration (flat config) so `npm run lint` works again

### Security log

- **2026-04-29** — Resolved 3 moderate npm advisories (commit `b9d2c96`):
  - `postcss` → `^8.5.12` (GHSA-qx2v-qp2m-jg93, XSS via unescaped `</style>`)
  - `next-intl` → `^4.11.0` (GHSA-8f24-v5vv-gm5j, open redirect)
  - `next` → `^16.2.4` (transitive postcss)
  - Added `overrides.postcss = ^8.5.12` to force-resolve Next's bundled copy.
  - Verified: `npm audit` reports 0 vulnerabilities; `tsc --noEmit` passes.
  - Pre-existing: ESLint 8.57.1 ↔ eslint-config-next 16 peer-dep mismatch — `npm install` needs `--legacy-peer-deps`. Worth a future cleanup (Audit Priority 3.5).

### Session notes

- GitHub repo: https://github.com/denden-co/CAMIQ
- **Session 2026-04-29:**
  - Security patch (commit `b9d2c96`) + ~18 days of accumulated Phase 6 follow-up shipped.
  - Wrote [`FRONTEND_AUDIT_2026-04-29.md`](./FRONTEND_AUDIT_2026-04-29.md) — full audit against the Frontend Prompt Instructions rubric (29 Apr 2026, e.dennis7@icloud.com → eveden02@icloud.com email).
  - Shipped all 5 Priority-1 quick wins (commit `02842d7`): lucide icons, drop rainbow gradients, 8px corners, zero letter-spacing, always-visible CTAs.
  - Added `/` → `/dashboard` redirect for signed-in users (commit `c530dc3`).
  - Removed all remaining emoji from `/analyze`, `/personas`, `/strategy`, `/bias`, `/countries` headers and inline maps (commit `e3ee423`). PageShell prop renamed `icon: string` → `Icon: LucideIcon`.
  - Made CountryPicker error state recoverable in-place (commit `7436d6d`) — adds `refetch()` to country-context, retry button to picker.
  - Memory note: the previous CLAUDE.md description of "indigo-violet gradient design system" was incorrect — the actual code had been refactored to clean monochrome + indigo accent. This file now reflects reality.
- New files in repo: `FRONTEND_AUDIT_2026-04-29.md`, `FRONTEND_IMPROVEMENT_PLAN.md`, `multi-lang-test.csv`, `start-dev-backend.command`, plus stub pages `/about /blog /changelog /contact /legal/{cookies,privacy,security,terms} /status`.
