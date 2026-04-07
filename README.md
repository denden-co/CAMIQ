# CampaignIQ (CAMIQ)

**Global political intelligence platform** — turn social media data into actionable campaign insights for elections worldwide.

CampaignIQ operationalises doctoral research on sentiment analysis and election forecasting into a web tool usable by campaign strategists, pollsters, media, academia, and policymakers in any country.

## What It Does

**Social Data Analysis** — Upload a CSV of social media posts, select political parties, and run sentiment analysis across 20+ algorithms. Get prediction dashboards with vote share estimates, confidence scores, and model comparisons.

**Single Text Analysis** — Analyse any political text for emotional tone (joy, sadness, anger, surprise, fear) and topical insights. Visualised with radar charts and topic tags.

**Voter Persona Generator** — Input demographics, concerns, and values. Get AI-generated narrative voter profiles with backstory, political leanings, and engagement strategies.

**AI Strategic Advisor** — Feed analysis results into an LLM-powered advisor that generates campaign recommendations tailored to your country's electoral system.

**Bias & Fairness Audit** — Check model objectivity with Gini coefficient analysis and fairness metrics across demographic groups.

## Global by Design

CampaignIQ works for any country's elections, not just one. It adapts to different electoral systems (FPTP, proportional representation, MMP, two-round), languages (100+ via XLM-RoBERTa), and political landscapes through a JSON configuration system.

Pre-built profiles are included for the UK, USA, India, France, Germany, Brazil, Nigeria, and more. Users can also create custom election configurations with their own parties, languages, and electoral rules.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui, Recharts |
| Backend | Python FastAPI |
| ML/NLP | XLM-RoBERTa, BERTweet, VADER, TextBlob, SVM, Random Forest, XGBoost, CNN, LSTM, BERTopic, LDA, NMF |
| Database | Supabase (PostgreSQL, Auth, Storage, Row Level Security) |
| LLM Providers | Google Gemini, OpenAI, Anthropic Claude, Deepseek, Mistral, Cohere, Meta Llama, HuggingFace |
| Deployment | Vercel (frontend), Railway/Render (API) |

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- Supabase account

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd api
pip install -r requirements.txt
uvicorn main:app --reload
```

### Environment Variables

Create `.env.local` in `frontend/` and `.env` in `api/`:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# LLM Providers (add whichever you use)
OPENAI_API_KEY=your-key
ANTHROPIC_API_KEY=your-key
GOOGLE_AI_API_KEY=your-key
```

## Project Structure

```
CAMIQ/
├── frontend/          # Next.js app (TypeScript, Tailwind, shadcn/ui)
├── api/               # Python FastAPI backend
│   ├── main.py        # API entry point
│   ├── app/
│   │   ├── services/
│   │   │   ├── sentiment/      # RoBERTa, BERTweet, VADER, ensemble
│   │   │   ├── classifiers/    # SVM, RF, XGBoost, CNN, LSTM
│   │   │   ├── topics/         # BERTopic, LDA, NMF, TF-IDF
│   │   │   ├── clustering/     # K-Means, DBSCAN
│   │   │   ├── statistics/     # ANOVA, chi-square, regression
│   │   │   ├── nlp/            # NER, Word2Vec, GloVe
│   │   │   ├── llm/            # Multi-provider abstraction (9+ providers)
│   │   │   ├── data_cleaning/  # Dedup, nulls, bots, encoding, language
│   │   │   ├── personas/       # Voter persona generation
│   │   │   ├── strategy/       # AI strategic advisor
│   │   │   └── audit/          # Bias & fairness
│   │   └── configs/
│   │       └── countries/      # Election JSON profiles (UK, USA, etc.)
│   └── tests/
├── shared/            # Shared types and configs
├── PLAN.md            # Development plan (gstack format)
└── CLAUDE.md          # Project config for AI-assisted development
```

## Algorithms

### Sentiment Analysis
XLM-RoBERTa (multilingual, 100+ languages), BERTweet (English specialist), VADER (lexicon-based), TextBlob (pattern-based), and a weighted ensemble model that achieved 80.3% accuracy/F1 for 3-class sentiment in doctoral research.

### Classification
Support Vector Machines (SVM), Random Forest, XGBoost, Logistic Regression, Convolutional Neural Networks (CNN), Long Short-Term Memory (LSTM/BiLSTM).

### Topic Modelling
BERTopic (transformer-based), Latent Dirichlet Allocation (LDA), Non-negative Matrix Factorisation (NMF), TF-IDF keyword extraction.

### Clustering & Statistics
K-Means, DBSCAN, two-way ANOVA, chi-square tests, correlation analysis, regression modelling.

## Origin

Derived from the doctoral thesis *"Analyzing Twitter/X Sentiment and Topic Signals for the 2024 UK General Election"* by Everton Dennis at the University of East London. The research demonstrated that while social media sentiment provides valuable directional insights, accurate seat-level predictions under FPTP require constituency-level modelling (MRP). CampaignIQ is built as a measurement and diagnostic tool, not an election predictor.

## Development

This project uses [gstack](https://github.com/garrytan/gstack) for structured AI-assisted development workflows.

## Licence

All rights reserved. This software is proprietary.
