"""Bias & Fairness audit router (Phase 4)."""

from fastapi import APIRouter, Header, HTTPException

from app.schemas.bias import BiasAuditRequest, BiasAuditResponse
from app.services import analyses_store
from app.services.bias import run_bias_audit

router = APIRouter()


def _require_user(x_user_email: str | None) -> str:
    if not x_user_email:
        raise HTTPException(status_code=401, detail="Missing X-User-Email header.")
    return x_user_email


@router.post(
    "/analyses/{analysis_id}/bias-audit",
    response_model=BiasAuditResponse,
)
async def bias_audit_for_analysis(
    analysis_id: str,
    payload: BiasAuditRequest | None = None,
    x_user_email: str | None = Header(None, alias="X-User-Email"),
) -> BiasAuditResponse:
    """Run a fairness audit on a saved analysis.

    Operates purely on the stored batch — per-language distribution,
    confidence parity (4/5ths rule), chi-square independence test, and
    corpus skew check.
    """
    user_email = _require_user(x_user_email)
    saved = analyses_store.get_analysis(user_email, analysis_id)
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
        return run_bias_audit(
            analysis_id=analysis_id,
            results=results,
            min_group_size=req.min_group_size,
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=500,
            detail=f"Bias audit failed: {exc}",
        ) from exc
