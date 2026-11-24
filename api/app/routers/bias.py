"""Bias & Fairness audit router (Phase 4)."""

from fastapi.concurrency import run_in_threadpool
from fastapi import APIRouter, Depends, HTTPException

from app.auth import CurrentUser, current_user
from app.schemas.bias import BiasAuditRequest, BiasAuditResponse
from app.services import analyses_store
from app.services.bias import run_bias_audit

router = APIRouter()



@router.post(
    "/analyses/{analysis_id}/bias-audit",
    response_model=BiasAuditResponse,
)
async def bias_audit_for_analysis(
    analysis_id: str,
    payload: BiasAuditRequest | None = None,
    user: CurrentUser = Depends(current_user),
) -> BiasAuditResponse:
    """Run a fairness audit on a saved analysis.

    Operates purely on the stored batch — per-language distribution,
    confidence parity (4/5ths rule), chi-square independence test, and
    corpus skew check.
    """
    saved = await run_in_threadpool(analyses_store.get_analysis, user.id, analysis_id)
    if saved is None:
        raise HTTPException(status_code=404, detail="Analysis not found.")

    results = saved.batch.results
    if not results:
        raise HTTPException(
            status_code=422,
            detail="Saved analysis has no batch results to audit.",
        )

    req = payload or BiasAuditRequest()
    try:
        return await run_in_threadpool(
            run_bias_audit,
            analysis_id=analysis_id,
            results=results,
            min_group_size=req.min_group_size,
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=500,
            detail=f"Bias audit failed: {exc}",
        ) from exc
