"""Voter Personas router (Phase 4)."""

from fastapi import APIRouter, Header, HTTPException

from app.schemas.personas import PersonaRequest, PersonasResponse
from app.services import analyses_store
from app.services.personas import generate_personas

router = APIRouter()


def _require_user(x_user_email: str | None) -> str:
    if not x_user_email:
        raise HTTPException(status_code=401, detail="Missing X-User-Email header.")
    return x_user_email


@router.post(
    "/analyses/{analysis_id}/personas",
    response_model=PersonasResponse,
)
async def personas_for_analysis(
    analysis_id: str,
    payload: PersonaRequest | None = None,
    x_user_email: str | None = Header(None, alias="X-User-Email"),
) -> PersonasResponse:
    """Generate voter personas from a saved analysis using an LLM.

    The personas are grounded in the sentiment results, key phrases, and
    language distribution of the saved batch. Requires at least one LLM
    provider API key to be configured.
    """
    user_email = _require_user(x_user_email)
    saved = analyses_store.get_analysis(user_email, analysis_id)
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
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=500,
            detail=f"Persona generation failed: {exc}",
        ) from exc
