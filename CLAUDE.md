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
- **Last pushed commit:** `2e5516a` (Phase 6 UI redesign, 23 files, pushed 2026-04-11) — security fix commit pending push (2026-04-29)

## Build progress (as of 2026-04-29)

### Completed phases

1. **Phase 1** — Core sentiment analysis: single text, batch, CSV upload. XLM-RoBERTa multilingual + BERTweet English. Language auto-detection, key phrase extraction, aggregate stats.
2. **Phase 2** — Country configuration system: JSON profiles for parties, electoral systems, languages. CountryPicker component, country-context provider.
3. **Phase 3** — Topic modelling (BERTopic via API), analysis detail page with Recharts bar charts (topic size, sentiment composition), export to CSV/JSON/PDF.
4. **Phase 4** — Voter Personas (LLM-generated via multi-provider), AI Strategic Advisor (recommendations, risk factors, executive summary), Bias & Fairness Audit (4/5ths rule, chi-square independence, corpus skew, language group breakdown).
5. **Phase 5** — Responsive design polish: Tailwind mobile-first breakpoints on all pages, shared Spinner component, loading states on all buttons/data fetches.
6. **Phase 6** — Premium UI redesign: indigo-violet gradient design system (inspired by Quorum Analytics + Linear + Vercel). Inter font, mesh gradient hero, frosted glass nav bar, PageShell shared layout, gradient module cards, premium data tables, refined form inputs.

### Key UI components

- `frontend/components/page-shell.tsx` — shared nav + gradient page header for all module pages
- `frontend/components/spinner.tsx` — animated SVG loading spinner
- `frontend/components/ui/button.tsx` — gradient button (btn-gradient) with outline/ghost/secondary variants
- `frontend/components/country-picker.tsx` — country selector dropdown
- `frontend/components/csv-upload.tsx` — CSV file upload with column picker

### Design system (globals.css)

CSS component classes: `.hero-mesh`, `.btn-gradient`, `.input-refined`, `.table-premium`, `.stat-badge`, `.text-gradient`, `.nav-bar`, `.gradient-border`, `.card-glass`, `.card-hover`, `.divider-gradient`

Colour tokens: `--primary` (indigo-violet), `--accent` (cyan), `--success`, `--warning`, `--danger`, `--card`, `--ring`, `--gradient-start/end/accent`

Custom shadows in tailwind.config.ts: `glow`, `glow-lg`, `soft`, `card`, `card-hover`

### Current state

- Dev-mode auth via localStorage mock user (no Supabase yet)
- Frontend: localhost:3000, API: localhost:8000
- All 6 modules live and tested
- TypeScript compiles with zero errors

### Pending (next phases)

- **Phase 7** — Deployment: Vercel (frontend) + Railway/Render (API)
- **Phase 8** — Supabase auth integration (replace dev mock localStorage user)
- **Phase 9** — Real-time data ingestion (Twitter/X API)
- **Phase 10** — Additional ML models beyond XLM-RoBERTa

### Security log

- **2026-04-29** — Resolved 3 moderate npm advisories:
  - `postcss` → `^8.5.12` (GHSA-qx2v-qp2m-jg93, XSS via unescaped `</style>`)
  - `next-intl` → `^4.11.0` (GHSA-8f24-v5vv-gm5j, open redirect)
  - `next` → `^16.2.4` (transitive postcss)
  - Added `overrides.postcss = ^8.5.12` to force-resolve Next's bundled copy.
  - Verified: `npm audit` reports 0 vulnerabilities; `tsc --noEmit` passes.
  - Pre-existing: ESLint 8.57.1 ↔ eslint-config-next 16 peer-dep mismatch — install needs `--legacy-peer-deps`. Worth a future cleanup.

### Session notes

- GitHub repo: https://github.com/denden-co/CAMIQ
- Session 2026-04-29: security patch + Phase 6 follow-on work (UI tweaks, new /about /blog /changelog /contact /legal /status pages, FRONTEND_IMPROVEMENT_PLAN.md, multi-lang-test.csv, start-dev-backend.command).
