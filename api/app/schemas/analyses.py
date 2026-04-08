"""Pydantic schemas for saved analyses (Phase 2 persistence)."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.analyze import BatchAnalyzeResponse

AnalysisSource = Literal["paste", "csv", "api"]


class SaveAnalysisRequest(BaseModel):
    """Request body for POST /api/analyses.

    The client sends the original batch response (which already contains
    per-row results + aggregate) plus a few pieces of metadata that the
    backend can't infer: a user-given name, the country focus, the source
    (paste/csv/api), and the original row text (so exports can reproduce
    the input column).
    """

    name: str = Field(..., min_length=1, max_length=200)
    country_id: str | None = Field(
        None,
        description="Country profile id at the time of analysis, e.g. 'uk-2024-ge'.",
    )
    source: AnalysisSource = "paste"
    original_texts: list[str] = Field(
        default_factory=list,
        description="Original input texts in the same order as batch.results.",
    )
    batch: BatchAnalyzeResponse
    user_email: str = Field(
        ...,
        description=(
            "Identifier for the dev-mock user. Replaced by auth.uid() when "
            "real Supabase auth is wired back in."
        ),
    )


class AnalysisSummary(BaseModel):
    """Lightweight row for the dashboard Recent Analyses list."""

    id: str
    name: str
    country_id: str | None
    source: AnalysisSource
    total: int
    dominant_label: str
    mean_compound: float
    languages_detected: int
    created_at: datetime


class SavedAnalysis(AnalysisSummary):
    """Full saved analysis — summary + the original batch payload and texts."""

    batch: BatchAnalyzeResponse
    original_texts: list[str]
