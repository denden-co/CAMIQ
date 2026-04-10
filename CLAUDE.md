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

## Build progress (as of 2026-04-10)

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

### Pending

- Deployment: Vercel (frontend) + Railway/Render (API)
- Supabase auth integration (replace dev mock)
- Real-time data ingestion (Twitter/X API)
- Additional ML models beyond XLM-RoBERTa
