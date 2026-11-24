"""AI Strategic Advisor router (Phase 4)."""

from fastapi import APIRouter, Depends, HTTPException

from app.auth import CurrentUser, current_user
from app.schemas.strategy import StrategyRequest, StrategyResponse
from app.services import analyses_store
from app.services.llm import LLMProviderError
from app.services.strategy import generate_strategy

router = APIRouter()



@router.post(
    "/analyses/{analysis_id}/strategy",
    response_model=StrategyResponse,
)
async def strategy_for_analysis(
    analysis_id: str,
    payload: StrategyRequest | None = None,
    user: CurrentUser = Depends(current_user),
) -> StrategyResponse:
    """Generate campaign strategy recommendations from a saved analysis.

    Uses an LLM to produce actionable, data-grounded recommendations
    covering messaging, targeting, risk mitigation, and resource
    allocation. Requires at least one LLM provider API key.
    """
    saved = analyses_store.get_analysis(user.id, analysis_id)
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
    except LLMProviderError as exc:
        # Upstream outage or rate limit — tell the client it is temporary.
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=500,
            detail=f"Strategy generation failed: {exc}",
        ) from exc
