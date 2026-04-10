"""CampaignIQ API — Global Political Intelligence Platform."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from dotenv import load_dotenv

load_dotenv()  # Load .env before anything reads os.getenv

from app.routers import analyses, analyze, bias, countries, personas, topics
from app.services.llm import available_providers
from app.services.sentiment import active_model_name

app = FastAPI(
    title="CampaignIQ API",
    description=(
        "Political intelligence platform — sentiment analysis, text analysis, "
        "voter personas, AI strategy"
    ),
    version="0.1.0",
)

# CORS — allow the Next.js dev server and any future production origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
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


@app.get("/api/llm/providers")
async def llm_providers():
    """Return which LLM providers have API keys configured."""
    return {"providers": available_providers()}


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "version": "0.1.0",
        "sentiment_model": active_model_name(),
        "llm_providers": available_providers(),
    }
