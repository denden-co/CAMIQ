"""Topic modelling router (Phase 3)."""

from fastapi.concurrency import run_in_threadpool
from fastapi import APIRouter, Depends, HTTPException

from app.auth import CurrentUser, current_user
from app.schemas.topics import TopicModelRequest, TopicModelResponse
from app.services import analyses_store
from app.services.topics import extract_topics

router = APIRouter()



@router.post(
    "/analyses/{analysis_id}/topics",
    response_model=TopicModelResponse,
)
async def topics_for_analysis(
    analysis_id: str,
    payload: TopicModelRequest | None = None,
    user: CurrentUser = Depends(current_user),
) -> TopicModelResponse:
    """Run BERTopic on a saved analysis and return topics + sentiment lean.

    Documents and per-row sentiment results come from the saved analysis,
    so this endpoint never re-runs the sentiment model — topics are layered
    on top of the existing batch result.
    """
    saved = await run_in_threadpool(analyses_store.get_analysis, user.id, analysis_id)
    if saved is None:
        raise HTTPException(status_code=404, detail="Analysis not found.")

    texts = saved.original_texts
    results = saved.batch.results
    if not texts:
        raise HTTPException(
            status_code=422,
            detail="Saved analysis has no original_texts to model.",
        )
    if len(texts) != len(results):
        raise HTTPException(
            status_code=500,
            detail=(
                f"Saved analysis is corrupted: {len(texts)} texts vs "
                f"{len(results)} results."
            ),
        )

    req = payload or TopicModelRequest()
    try:
        # Topic modelling is CPU-heavy — run off the event loop.
        return await run_in_threadpool(
            extract_topics,
            analysis_id=analysis_id,
            texts=texts,
            results=results,
            n_topics=req.n_topics,
            min_topic_size=req.min_topic_size,
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=500,
            detail=f"Topic modelling failed: {exc}",
        ) from exc
