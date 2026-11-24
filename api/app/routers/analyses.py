"""Saved analyses router (Phase 2 persistence)."""

from fastapi import APIRouter, Depends, HTTPException

from app.auth import CurrentUser, current_user
from app.schemas.analyses import (
    AnalysisSummary,
    SavedAnalysis,
    SaveAnalysisRequest,
)
from app.services import analyses_store

router = APIRouter()



@router.post("/analyses", response_model=SavedAnalysis, status_code=201)
async def create_analysis(
    payload: SaveAnalysisRequest,
    user: CurrentUser = Depends(current_user),
) -> SavedAnalysis:
    """Persist a completed batch analysis so it shows up in Recent Analyses."""

    try:
        return analyses_store.save_analysis(payload, user.id)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save analysis: {exc}",
        ) from exc


@router.get("/analyses", response_model=list[AnalysisSummary])
async def list_analyses(
    user: CurrentUser = Depends(current_user),
) -> list[AnalysisSummary]:
    """List Recent Analyses for the current user, newest first."""
    return analyses_store.list_analyses(user.id)


@router.get("/analyses/{analysis_id}", response_model=SavedAnalysis)
async def get_analysis(
    analysis_id: str,
    user: CurrentUser = Depends(current_user),
) -> SavedAnalysis:
    saved = analyses_store.get_analysis(user.id, analysis_id)
    if saved is None:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    return saved


@router.delete("/analyses/{analysis_id}", status_code=204)
async def delete_analysis(
    analysis_id: str,
    user: CurrentUser = Depends(current_user),
) -> None:
    ok = analyses_store.delete_analysis(user.id, analysis_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    return None
