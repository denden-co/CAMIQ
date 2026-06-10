# CampaignIQ — Development Plan

## Vision

CampaignIQ is a global political intelligence platform that turns social media data into actionable campaign insights. It operationalises doctoral research on sentiment analysis and election forecasting into a web tool usable by campaign strategists, pollsters, media, academia, and policymakers worldwide.

**10-star product:** A campaign strategist in any country opens CampaignIQ, uploads their social media dataset, and within minutes gets sentiment predictions, topic analysis, voter personas, and AI-generated strategy recommendations — all adapted to their country's electoral system, language, and political landscape.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 14+)                │
│  TypeScript · Tailwind · shadcn/ui · next-intl · Recharts│
│                                                          │
│  Pages:                                                  │
│  /dashboard       — Main analysis hub                    │
│  /analysis/social — CSV upload + batch sentiment         │
│  /analysis/text   — Single text analysis                 │
│  /personas        — Voter persona generator              │
│  /strategy        — AI strategic advisor                 │
│  /audit           — Bias & fairness audit                │
│  /settings        — API keys, LLM provider, preferences  │
│  /elections       — Country/election configuration        │
└──────────────────────┬──────────────────────────────────┘
                       │ REST + WebSocket
┌──────────────────────▼──────────────────────────────────┐
│                  BACKEND (Python FastAPI)                 │
│                                                          │
│  Services:                                               │
│  ├─ data_cleaning/    — Pipeline: dedup, nulls, bots,   │
│  │                      normalisation, encoding, lang    │
│  ├─ sentiment/        — RoBERTa, BERTweet, XLM-R,       │
│  │                      VADER, TextBlob, ensemble        │
│  ├─ classifiers/      — SVM, RF, XGBoost, LR, CNN, LSTM │
│  ├─ topics/           — BERTopic, LDA, NMF, TF-IDF      │
│  ├─ clustering/       — K-Means, DBSCAN                  │
│  ├─ statistics/       — ANOVA, chi-square, regression    │
│  ├─ nlp/              — NER, Word2Vec, GloVe             │
│  ├─ llm/              — Multi-provider abstraction       │
│  │                      (9+ providers)                   │
│  ├─ personas/         — Voter persona generation via LLM │
│  ├─ strategy/         — AI strategic advisor via LLM     │
│  └─ audit/            — Bias & fairness (Gini coeff)     │
│                                                          │
│  Configs:                                                │
│  └─ countries/        — JSON election profiles           │
│     ├─ uk.json        — UK: FPTP, parties, languages     │
│     ├─ usa.json       — USA: Electoral College, states   │
│     ├─ india.json     — India: FPTP, 800+ parties        │
│     ├─ france.json    — France: Two-round system         │
│     ├─ germany.json   — Germany: MMP system              │
│     ├─ brazil.json    — Brazil: PR system                │
│     ├─ nigeria.json   — Nigeria: Modified FPTP           │
│     └─ custom.json    — User-defined elections           │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│              SUPABASE (PostgreSQL + Auth)                 │
│  Tables: users, projects, analyses, personas, strategies │
│  Auth: Email/password, OAuth (Google, GitHub)            │
│  Storage: CSV uploads, generated reports                 │
│  RLS: Per-user data isolation                            │
└─────────────────────────────────────────────────────────┘
```

## Phases

### Phase 1: Foundation (Weeks 1-3)
**Goal:** Monorepo scaffolding, auth, and basic navigation.

| Task | Human team | CC+gstack | Priority |
|------|-----------|-----------|----------|
| Next.js 14 app with TypeScript, Tailwind, shadcn/ui | 2 days | 15 min | P0 |
| FastAPI project with proper structure | 1 day | 15 min | P0 |
| Supabase project: auth tables, RLS policies | 1 day | 20 min | P0 |
| Auth flow: signup, login, password reset, OAuth | 3 days | 30 min | P0 |
| Dashboard layout with sidebar navigation | 1 day | 15 min | P0 |
| Country/election JSON config system | 1 day | 15 min | P0 |
| API settings panel (LLM provider picker) | 1 day | 15 min | P1 |
| i18n setup with next-intl | 1 day | 15 min | P1 |
| CI/CD: GitHub Actions for lint, test, deploy | 1 day | 15 min | P1 |

### Phase 2: Data Engine (Weeks 4-6)
**Goal:** CSV upload, data cleaning pipeline, and core sentiment analysis.

| Task | Human team | CC+gstack | Priority |
|------|-----------|-----------|----------|
| CSV upload with drag-and-drop, preview, column mapping | 2 days | 20 min | P0 |
| Data cleaning pipeline (dedup, nulls, bots, encoding) | 3 days | 30 min | P0 |
| Language auto-detection and routing | 1 day | 15 min | P0 |
| XLM-RoBERTa integration (multilingual sentiment) | 2 days | 30 min | P0 |
| BERTweet integration (English specialist) | 1 day | 20 min | P0 |
| VADER + TextBlob (lightweight options) | 1 day | 15 min | P1 |
| Ensemble model (weighted combination) | 2 days | 20 min | P0 |
| Prediction dashboard with horizontal bar charts | 2 days | 20 min | P0 |
| WebSocket progress updates during analysis | 1 day | 15 min | P1 |

### Phase 3: Analysis Suite (Weeks 7-9)
**Goal:** Full algorithm library, topic analysis, and statistics.

| Task | Human team | CC+gstack | Priority |
|------|-----------|-----------|----------|
| Single text analysis page (emotions radar chart, topic tags) | 2 days | 20 min | P0 |
| Algorithm picker UI (select or auto-recommend) | 2 days | 20 min | P0 |
| Classifier integrations: SVM, RF, XGBoost, CNN, LSTM | 1 week | 45 min | P0 |
| Topic modelling: BERTopic, LDA, NMF | 3 days | 30 min | P0 |
| Clustering: K-Means, DBSCAN | 2 days | 20 min | P1 |
| Statistics: ANOVA, chi-square, correlation, regression | 2 days | 20 min | P0 |
| NLP: NER, TF-IDF, Word2Vec/GloVe | 2 days | 20 min | P1 |
| Model comparison (side-by-side results) | 2 days | 20 min | P1 |
| Results export (PDF report, CSV, JSON) | 1 day | 15 min | P1 |

### Phase 4: AI Features (Weeks 10-12)
**Goal:** LLM-powered features — personas, strategy, bias audit.

| Task | Human team | CC+gstack | Priority |
|------|-----------|-----------|----------|
| Multi-provider LLM abstraction layer | 3 days | 30 min | P0 |
| Voter persona generator (demographics → narrative) | 3 days | 25 min | P0 |
| AI strategic advisor (analysis → recommendations) | 3 days | 25 min | P0 |
| Bias & fairness audit (Gini coefficient) | 2 days | 20 min | P0 |
| LLM provider switcher in settings (9+ providers) | 1 day | 15 min | P0 |
| Prompt engineering for quality outputs | 2 days | 30 min | P0 |
| Rate limiting and error handling for LLM calls | 1 day | 15 min | P1 |

### Phase 5: Polish & Ship (Weeks 13-14)
**Goal:** Production readiness, deploy, documentation.

| Task | Human team | CC+gstack | Priority |
|------|-----------|-----------|----------|
| Responsive design (mobile, tablet, desktop) | 2 days | 20 min | P0 |
| Loading states, error boundaries, empty states | 1 day | 15 min | P0 |
| Vercel deployment (frontend) | 0.5 day | 10 min | P0 |
| Railway/Render deployment (API) | 0.5 day | 10 min | P0 |
| Supabase production config | 0.5 day | 10 min | P0 |
| End-to-end QA with gstack /qa | 1 day | 30 min | P0 |
| Security audit with gstack /cso | 1 day | 20 min | P0 |
| User documentation / help pages | 2 days | 20 min | P1 |
| Performance testing with large datasets | 1 day | 15 min | P1 |

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Large ML models slow API response | High | Async processing with WebSocket progress; model caching; lightweight models (VADER/TextBlob) as fast alternatives |
| LLM API costs in production | Medium | Rate limiting per user; free tier with limited calls; bring-your-own-key model |
| Multilingual model accuracy varies | Medium | Language-specific model routing; confidence scores shown to users; fallback chains |
| Electoral system complexity | Low | Modular JSON configs; clear disclaimers about prediction limitations per system |
| Supabase free tier limits | Medium | Efficient queries; pagination; archive old analyses; upgrade path documented |

## Immediate Next Steps

1. **Scaffold monorepo** — `frontend/` (Next.js) + `api/` (FastAPI) + shared configs
2. **Set up Supabase** — Create project, auth tables, RLS policies
3. **Build auth flow** — Signup, login, dashboard shell
4. **Create country config system** — Start with UK, USA, India, France, Germany
5. **Implement CSV upload** — Drag-and-drop with preview and column mapping

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | -- | -- |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | -- | -- |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 0 | -- | -- |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | -- | -- |

**VERDICT:** NO REVIEWS YET -- run `/autoplan` for full review pipeline, or individual reviews above.
