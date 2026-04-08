"""Single-text and batch text analysis routers."""

from fastapi import APIRouter, HTTPException

from app.schemas.analyze import (
    AnalyzeRequest,
    AnalyzeResponse,
    BatchAnalyzeRequest,
    BatchAnalyzeResponse,
)
from app.services.sentiment import analyze_batch, analyze_text

router = APIRouter()


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(payload: AnalyzeRequest) -> AnalyzeResponse:
    """Analyse a single piece of text for sentiment, language, and key phrases.

    Uses XLM-RoBERTa (multilingual) if `transformers` + `torch` are installed,
    otherwise falls back to VADER (English). Check `/health` to see which
    backend is active.
    """
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text is empty.")

    try:
        return analyze_text(text)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {exc}",
        ) from exc


@router.post("/analyze/batch", response_model=BatchAnalyzeResponse)
async def analyze_batch_route(
    payload: BatchAnalyzeRequest,
) -> BatchAnalyzeResponse:
    """Analyse many texts at once and return per-text results + aggregates.

    Intended for the Social Data Analysis workflow — paste a CSV column of
    tweets, posts, or speeches and get back label distribution, mean
    compound score, language breakdown, and a global top-phrases list.
    """
    cleaned = [t.strip() for t in payload.texts if t and t.strip()]
    if not cleaned:
        raise HTTPException(
            status_code=400,
            detail="No non-empty texts supplied.",
        )

    try:
        return analyze_batch(cleaned)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=500,
            detail=f"Batch analysis failed: {exc}",
        ) from exc
