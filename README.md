# CampaignIQ (CAMIQ)

**Global political intelligence platform** — turn social media data into evidence-based campaign insight, for elections anywhere in the world.

CampaignIQ operationalises doctoral research on sentiment analysis and election signals into a web platform for campaign strategists, researchers, media, and policymakers. It is a **measurement and diagnostic tool, not an election predictor**.

## Features

| Module | What it does |
|--------|--------------|
| **Text Analysis** | Single text, batch paste, or CSV upload. Multilingual sentiment via XLM-RoBERTa (100+ languages) with VADER fallback, language auto-detection, key-phrase extraction, aggregate stats, save & export. |
| **Topic Modelling** | BERTopic over saved analyses (TF-IDF + KMeans fallback), per-topic sentiment composition, representative samples, charts. |
| **Voter Personas** | LLM-generated narrative voter profiles grounded in your analysis data. Multi-provider (Gemini, OpenAI, Claude, Mistral, and more). |
| **AI Strategic Advisor** | Recommendations, risk factors, and an executive summary generated from saved analyses — adapted to the country's electoral system. |
| **Bias & Fairness Audit** | 4/5ths rule, chi-square independence, corpus skew, and per-language-group breakdowns. |
| **Country Configuration** | JSON profiles per country: parties, electoral system (FPTP, PR, MMP, two-round, electoral college), languages. Forward-looking election catalogue. |

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Recharts, lucide-react |
| Backend | Python FastAPI |
| ML / NLP | XLM-RoBERTa, BERTweet, VADER, BERTopic, sentence-transformers, scikit-learn |
| LLM providers | Google Gemini, OpenAI, Anthropic Claude, Deepseek, Mistral, Cohere, Meta Llama, HuggingFace, custom OpenAI-compatible |
| Database / Auth | Supabase (PostgreSQL, Auth, Storage, RLS) — being integrated; dev-mock auth in the meantime |
| Deployment | Vercel (frontend) + Railway/Render (API) |

## Repository structure

```
CAMIQ/
├── frontend/        # Next.js app
├── api/             # FastAPI backend
│   ├── main.py      # API entry point
│   ├── app/         # Routers, schemas, services (sentiment, topics, personas, strategy, audit)
│   └── configs/
│       └── countries/   # Election JSON profiles
├── shared/          # Shared types and configs
├── docs/            # Plans, audits, session notes (archive/ for old previews)
├── samples/         # Sample CSVs for testing
├── scripts/         # Dev helper scripts (.command launchers, diagnostics)
└── CLAUDE.md        # Project state & config for AI-assisted development
```

## Getting started

### Prerequisites

- Node.js 20+
- Python 3.12+ (3.14 works on the slim path; some ML wheels need 3.12)

### Frontend

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev          # http://localhost:3000
```

### Backend

```bash
cd api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt        # slim: FastAPI + VADER fallback
pip install -r requirements-ml.txt     # optional: XLM-RoBERTa, BERTopic (heavy)
uvicorn main:app --reload --port 8000  # http://localhost:8000
```

> **Note:** always start the backend from an *activated* venv. Without the ML
> dependencies the API silently falls back to VADER sentiment. `/health`
> reports which backend is active.

### Environment variables

Copy the examples and fill in your keys:

```bash
cp frontend/.env.example frontend/.env.local
cp api/.env.example api/.env
```

See those files for the full list (Supabase keys, LLM provider keys, API URL, CORS origins).

### Scripts

| Command | Where | What |
|---------|-------|------|
| `npm run dev` | `frontend/` | Dev server |
| `npm run build` | `frontend/` | Production build |
| `npm run lint` | `frontend/` | ESLint (flat config, eslint 9) |
| `npm run typecheck` | `frontend/` | TypeScript check |
| `npm run test` | `frontend/` | Vitest |
| `pytest` | `api/` | Backend tests |
| `scripts/start-camiq.command` | repo root | macOS: launch backend + frontend in Terminal tabs |

## Deployment

- **Frontend → Vercel.** Root directory `frontend/`. Set the env vars from `frontend/.env.example`.
- **API → Railway or Render.** Root directory `api/`. A `Procfile` and `render.yaml` are provided. Set `CORS_ORIGINS` to your frontend URL.

See `docs/` for the full deployment plan.

## Origin

Derived from the doctoral thesis *“Analyzing Twitter/X Sentiment and Topic Signals for the 2024 UK General Election”* by Everton Dennis, University of East London. The thesis ensemble model (weighted XLM-RoBERTa + BERTweet) achieved **80.3% accuracy/F1** for 3-class sentiment. The research showed social sentiment gives valuable directional insight, while seat-level prediction under FPTP needs constituency-level modelling — hence CampaignIQ's positioning as a diagnostic tool.

## Licence

All rights reserved. This software is proprietary.
