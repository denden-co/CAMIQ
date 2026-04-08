# CampaignIQ API

FastAPI backend — sentiment analysis, text analysis, voter personas, and AI strategy.

## Setup

Create a virtual environment and install dependencies:

```bash
cd api
python3 -m venv .venv
source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### Optional: enable the multilingual XLM-RoBERTa model

The slim `requirements.txt` ships VADER only (English). To unlock the
multilingual transformer backend (v1) install the ML extras:

```bash
pip install -r requirements-ml.txt
```

On first boot the API will download
`cardiffnlp/twitter-xlm-roberta-base-sentiment` (~1.1GB) into the Hugging
Face cache. After that, `/api/analyze` will automatically use XLM-RoBERTa
for any language. Hit `GET /health` to confirm — the `sentiment_model`
field reports which backend is live.

## Run

```bash
source .venv/bin/activate
uvicorn main:app --reload --port 8000
```

The API will be live at **http://localhost:8000**.

Interactive docs (Swagger UI) at **http://localhost:8000/docs**.

## Endpoints

| Method | Path            | Purpose                                    |
| ------ | --------------- | ------------------------------------------ |
| GET    | `/health`       | Health check — `{status, version, sentiment_model}` |
| POST   | `/api/analyze`  | Single Text Analysis (VADER or XLM-RoBERTa) |
| GET    | `/api/countries`| List configured country profiles             |
| GET    | `/api/countries/{id}` | Full profile (parties, electoral system) |

### Example: single text analysis

```bash
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "The new housing policy is a bold step forward."}'
```

Response shape:

```json
{
  "label": "positive",
  "confidence": 0.74,
  "scores": { "positive": 0.42, "neutral": 0.58, "negative": 0.0, "compound": 0.6249 },
  "key_phrases": [{ "phrase": "housing", "weight": 1.0 }, ...],
  "model": "vader-lexicon-3.3.2",
  "word_count": 9,
  "character_count": 47
}
```

## Structure

```
api/
├── main.py                  # FastAPI app + CORS + router mounting
├── requirements.txt
├── app/
│   ├── routers/
│   │   └── analyze.py       # POST /api/analyze
│   ├── schemas/
│   │   └── analyze.py       # Pydantic request/response models
│   ├── services/
│   │   └── sentiment/
│   │       └── __init__.py  # VADER + key-phrase extraction
│   └── configs/
│       └── countries/       # uk.json, usa.json
└── tests/
```

## Roadmap

- **v0 (now)**: VADER sentiment + unigram key phrases — English only.
- **v1**: XLM-RoBERTa for 100+ languages, language auto-detection.
- **v2**: Ensemble (weighted RoBERTa + BERTweet) — reproducing the thesis 80.3% F1 on the 2024 UK General Election dataset.
- **v3**: BERTopic and KeyBERT for phrase-level topics, NER for named-entity enrichment.
