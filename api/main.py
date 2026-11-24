"""CampaignIQ API — Global Political Intelligence Platform."""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from dotenv import load_dotenv

load_dotenv()  # Load .env before anything reads os.getenv

from app.routers import analyses, analyze, bias, countries, personas, strategy, topics
from app.services.llm import available_providers, provider_catalogue
from app.services.sentiment import active_model_name, sentiment_status
from app.services.topics import topics_status

app = FastAPI(
    title="CampaignIQ API",
    description=(
        "Political intelligence platform — sentiment analysis, text analysis, "
        "voter personas, AI strategy"
    ),
    version="0.1.0",
)

# CORS — dev origins by default; production origins come from the
# CORS_ORIGINS env var (comma-separated, e.g. "https://campaigniq.vercel.app").
_default_origins = "http://localhost:3000,http://127.0.0.1:3000"
_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", _default_origins).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze.router, prefix="/api", tags=["analyze"])
app.include_router(analyses.router, prefix="/api", tags=["analyses"])
app.include_router(countries.router, prefix="/api", tags=["countries"])
app.include_router(topics.router, prefix="/api", tags=["topics"])
app.include_router(bias.router, prefix="/api", tags=["bias"])
app.include_router(personas.router, prefix="/api", tags=["personas"])
app.include_router(strategy.router, prefix="/api", tags=["strategy"])


@app.get("/api/llm/providers")
async def llm_providers():
    """Return configured providers plus the full supported catalogue.

    `providers` is the legacy shape (configured names only); `catalogue`
    lists every supported provider with its status so the UI can offer
    all of them and explain how to enable the rest.
    """
    return {
        "providers": available_providers(),
        "catalogue": provider_catalogue(),
    }


@app.get("/health")
async def health_check():
    """Liveness + truthful capability report.

    ``degraded`` is True when any module is running on a weaker fallback
    (VADER instead of XLM-RoBERTa, TF-IDF instead of BERTopic). The UI
    shows a banner so users are never silently given lower-quality results.
    """
    sentiment = sentiment_status()
    topics = topics_status()
    return {
        "status": "ok",
        "version": "0.1.0",
        "sentiment_model": active_model_name(),
        "sentiment": sentiment,
        "topics": topics,
        "degraded": sentiment["degraded"] or topics["degraded"],
        "llm_providers": available_providers(),
    }
