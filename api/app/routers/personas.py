"""Voter Personas router (Phase 4)."""

from fastapi import APIRouter, Depends, HTTPException

from app.auth import CurrentUser, current_user
from app.schemas.personas import PersonaRequest, PersonasResponse
from app.services import analyses_store
from app.services.llm import LLMProviderError
from app.services.personas import generate_personas

router = APIRouter()



@router.post(
    "/analyses/{analysis_id}/personas",
    response_model=PersonasResponse,
)
async def personas_for_analysis(
    analysis_id: str,
    payload: PersonaRequest | None = None,
    user: CurrentUser = Depends(current_user),
) -> PersonasResponse:
    """Generate voter personas from a saved analysis using an LLM.

    The personas are grounded in the sentiment results, key phrases, and
    language distribution of the saved batch. Requires at least one LLM
    provider API key to be configured.
    """
    saved = analyses_store.get_analysis(user.id, analysis_id)
    if saved is None:
        raise HTTPException(status_code=404, detail="Analysis not found.")

    if not saved.batch.results:
        raise HTTPException(
            status_code=422,
            detail="Saved analysis has no batch results to generate personas from.",
        )

    req = payload or PersonaRequest()
    try:
        return await generate_personas(
            analysis_id=analysis_id,
            batch=saved.batch,
            original_texts=saved.original_texts,
            request=req,
        )
    except ValueError as exc:
        # Typically "no LLM provider configured"
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except LLMProviderError as exc:
        # Upstream outage or rate limit — tell the client it is temporary.
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=500,
            detail=f"Persona generation failed: {exc}",
        ) from exc
