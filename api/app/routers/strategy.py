"""AI Strategic Advisor router (Phase 4)."""

from fastapi import APIRouter, Header, HTTPException

from app.schemas.strategy import StrategyRequest, StrategyResponse
from app.services import analyses_store
from app.services.strategy import generate_strategy

router = APIRouter()


def _require_user(x_user_email: str | None) -> str:
    if not x_user_email:
        raise HTTPException(status_code=401, detail="Missing X-User-Email header.")
    return x_user_email


@router.post(
    "/analyses/{analysis_id}/strategy",
    response_model=StrategyResponse,
)
async def strategy_for_analysis(
    analysis_id: str,
    payload: StrategyRequest | None = None,
    x_user_email: str | None = Header(None, alias="X-User-Email"),
) -> StrategyResponse:
    """Generate campaign strategy recommendations from a saved analysis.

    Uses an LLM to produce actionable, data-grounded recommendations
    covering messaging, targeting, risk mitigation, and resource
    allocation. Requires at least one LLM provider API key.
    """
    user_email = _require_user(x_user_email)
    saved = analyses_store.get_analysis(user_email, analysis_id)
    if saved is None:
        raise HTTPException(status_code=404, detail="Analysis not found.")

    if not saved.batch.results:
        raise HTTPException(
            status_code=422,
            detail="Saved analysis has no batch results to generate strategy from.",
        )

    req = payload or StrategyRequest()
    try:
        return await generate_strategy(
            analysis_id=analysis_id,
            batch=saved.batch,
            original_texts=saved.original_texts,
            request=req,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=500,
            detail=f"Strategy generation failed: {exc}",
        ) from exc
