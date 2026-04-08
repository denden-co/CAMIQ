"""Saved analyses router (Phase 2 persistence)."""

from fastapi import APIRouter, Header, HTTPException

from app.schemas.analyses import (
    AnalysisSummary,
    SavedAnalysis,
    SaveAnalysisRequest,
)
from app.services import analyses_store

router = APIRouter()


def _require_user(x_user_email: str | None) -> str:
    """Dev-mock 'auth'.

    Reads the user identifier from the X-User-Email header. When real
    Supabase auth lands, this is replaced with a JWT-verified dependency
    that returns auth.uid().
    """
    if not x_user_email:
        raise HTTPException(
            status_code=401,
            detail="Missing X-User-Email header.",
        )
    return x_user_email


@router.post("/analyses", response_model=SavedAnalysis, status_code=201)
async def create_analysis(
    payload: SaveAnalysisRequest,
    x_user_email: str | None = Header(None, alias="X-User-Email"),
) -> SavedAnalysis:
    """Persist a completed batch analysis so it shows up in Recent Analyses."""
    user_email = _require_user(x_user_email)
    # Trust the header over any user_email in the body — the client must
    # not be able to save under someone else's name.
    payload.user_email = user_email

    try:
        return analyses_store.save_analysis(payload)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save analysis: {exc}",
        ) from exc


@router.get("/analyses", response_model=list[AnalysisSummary])
async def list_analyses(
    x_user_email: str | None = Header(None, alias="X-User-Email"),
) -> list[AnalysisSummary]:
    """List Recent Analyses for the current user, newest first."""
    user_email = _require_user(x_user_email)
    return analyses_store.list_analyses(user_email)


@router.get("/analyses/{analysis_id}", response_model=SavedAnalysis)
async def get_analysis(
    analysis_id: str,
    x_user_email: str | None = Header(None, alias="X-User-Email"),
) -> SavedAnalysis:
    user_email = _require_user(x_user_email)
    saved = analyses_store.get_analysis(user_email, analysis_id)
    if saved is None:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    return saved


@router.delete("/analyses/{analysis_id}", status_code=204)
async def delete_analysis(
    analysis_id: str,
    x_user_email: str | None = Header(None, alias="X-User-Email"),
) -> None:
    user_email = _require_user(x_user_email)
    ok = analyses_store.delete_analysis(user_email, analysis_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    return None
