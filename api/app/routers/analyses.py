"""Saved analyses router (Phase 2 persistence)."""

import logging

from fastapi.concurrency import run_in_threadpool
from fastapi import APIRouter, Depends, HTTPException

from app.auth import CurrentUser, current_user
from app.schemas.analyses import (
    AnalysisSummary,
    SavedAnalysis,
    SaveAnalysisRequest,
)
from app.services import analyses_store

log = logging.getLogger(__name__)

router = APIRouter()



@router.post("/analyses", response_model=SavedAnalysis, status_code=201)
async def create_analysis(
    payload: SaveAnalysisRequest,
    user: CurrentUser = Depends(current_user),
) -> SavedAnalysis:
    """Persist a completed batch analysis so it shows up in Recent Analyses."""

    try:
        return await run_in_threadpool(analyses_store.save_analysis, payload, user.id)
    except Exception as exc:  # noqa: BLE001
        # Log the real error server-side; never echo database internals.
        log.exception("save_analysis failed for user %s", user.id)
        raise HTTPException(status_code=500, detail="Failed to save analysis.") from exc


@router.get("/analyses", response_model=list[AnalysisSummary])
async def list_analyses(
    user: CurrentUser = Depends(current_user),
) -> list[AnalysisSummary]:
    """List Recent Analyses for the current user, newest first."""
    return await run_in_threadpool(analyses_store.list_analyses, user.id)


@router.get("/analyses/{analysis_id}", response_model=SavedAnalysis)
async def get_analysis(
    analysis_id: str,
    user: CurrentUser = Depends(current_user),
) -> SavedAnalysis:
    saved = await run_in_threadpool(analyses_store.get_analysis, user.id, analysis_id)
    if saved is None:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    return saved


@router.delete("/analyses/{analysis_id}", status_code=204)
async def delete_analysis(
    analysis_id: str,
    user: CurrentUser = Depends(current_user),
) -> None:
    ok = await run_in_threadpool(analyses_store.delete_analysis, user.id, analysis_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    return None
