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
