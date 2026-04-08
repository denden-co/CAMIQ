"""Single Text Analysis router."""

from fastapi import APIRouter, HTTPException

from app.schemas.analyze import AnalyzeRequest, AnalyzeResponse
from app.services.sentiment import analyze_text

router = APIRouter()


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(payload: AnalyzeRequest) -> AnalyzeResponse:
    """Analyse a single piece of text for sentiment and key phrases.

    v0 uses VADER (English, lexicon-based). Multilingual XLM-RoBERTa lands in v1.
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
