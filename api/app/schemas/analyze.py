"""Pydantic schemas for the Single Text Analysis endpoint."""

from typing import Literal

from pydantic import BaseModel, Field, field_validator


class AnalyzeRequest(BaseModel):
    text: str = Field(
        ...,
        min_length=1,
        max_length=10_000,
        description="Raw text to analyse (speech, post, manifesto excerpt, etc.)",
    )
    language: str | None = Field(
        None,
        description="Optional ISO-639-1 code. Defaults to English for VADER.",
    )


class SentimentScores(BaseModel):
    positive: float = Field(..., ge=0, le=1)
    neutral: float = Field(..., ge=0, le=1)
    negative: float = Field(..., ge=0, le=1)
    compound: float = Field(..., ge=-1, le=1)


class KeyPhrase(BaseModel):
    phrase: str
    weight: float = Field(..., ge=0, le=1)


class DetectedLanguage(BaseModel):
    code: str = Field(..., description="ISO-639-1 code, e.g. 'en', 'fr', 'es'.")
    name: str = Field(..., description="Human-readable name.")
    confidence: float = Field(..., ge=0, le=1)


class AnalyzeResponse(BaseModel):
    label: Literal["positive", "neutral", "negative"]
    confidence: float = Field(..., ge=0, le=1)
    scores: SentimentScores
    key_phrases: list[KeyPhrase]
    language: DetectedLanguage | None = Field(
        None,
        description="Auto-detected language, if langdetect is installed.",
    )
    model: str
    word_count: int
    character_count: int


# Per-item cap for batch texts. A tweet is <= 280 chars; a long post or
# speech excerpt fits in 5,000. Without this cap a single request could
# carry 500 x 100,000 chars (~50 MB) and stall the server.
BATCH_ITEM_MAX_CHARS = 5_000
# Total characters across the whole batch (~1 MB) — a second guard so 500
# items near the per-item cap cannot combine into a multi-MB payload.
BATCH_TOTAL_MAX_CHARS = 1_000_000


class BatchAnalyzeRequest(BaseModel):
    texts: list[str] = Field(
        ...,
        min_length=1,
        max_length=500,
        description=(
            "List of texts to analyse in one call. Capped at 500 per request "
            f"and {BATCH_ITEM_MAX_CHARS:,} characters per item to keep "
            "XLM-RoBERTa inference times reasonable on CPU."
        ),
    )

    @field_validator("texts")
    @classmethod
    def _cap_text_sizes(cls, texts: list[str]) -> list[str]:
        """Reject oversized items early with a clear 422, not a hung server."""
        total = 0
        for i, t in enumerate(texts):
            if len(t) > BATCH_ITEM_MAX_CHARS:
                raise ValueError(
                    f"texts[{i}] is {len(t):,} characters; the limit is "
                    f"{BATCH_ITEM_MAX_CHARS:,} per item."
                )
            total += len(t)
        if total > BATCH_TOTAL_MAX_CHARS:
            raise ValueError(
                f"Batch totals {total:,} characters; the limit is "
                f"{BATCH_TOTAL_MAX_CHARS:,} per request."
            )
        return texts


class BatchAggregate(BaseModel):
    total: int
    label_counts: dict[str, int] = Field(
        ...,
        description="Count of each label across the batch.",
    )
    label_share: dict[str, float] = Field(
        ...,
        description="Share (0..1) of each label across the batch.",
    )
    mean_compound: float = Field(..., ge=-1, le=1)
    language_counts: dict[str, int] = Field(
        default_factory=dict,
        description="Detected language codes → count. Empty if langdetect missing.",
    )
    top_phrases: list[KeyPhrase] = Field(
        default_factory=list,
        description="Top phrases across the entire batch, re-weighted globally.",
    )


class BatchAnalyzeResponse(BaseModel):
    results: list[AnalyzeResponse]
    aggregate: BatchAggregate
    model: str
