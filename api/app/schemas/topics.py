"""Pydantic schemas for the Topic Modelling endpoint (Phase 3)."""

from typing import Literal

from pydantic import BaseModel, Field

TopicLabel = Literal["positive", "neutral", "negative"]


class TopicModelRequest(BaseModel):
    """Optional knobs for POST /api/analyses/{id}/topics."""

    n_topics: int | None = Field(
        None,
        ge=2,
        le=30,
        description=(
            "Target number of topics. If omitted, BERTopic chooses "
            "automatically; otherwise the model is reduced to roughly this "
            "many topics."
        ),
    )
    min_topic_size: int = Field(
        3,
        ge=2,
        le=50,
        description=(
            "Minimum number of documents required to form a topic. Lower "
            "values yield more, smaller topics."
        ),
    )


class TopicSample(BaseModel):
    """A representative document for a topic."""

    text: str
    label: TopicLabel
    compound: float = Field(..., ge=-1, le=1)


class Topic(BaseModel):
    """A single topic with terms, sentiment lean, and samples."""

    id: int
    label: str = Field(
        ..., description="Human-readable label, e.g. 'cost of living, energy, bills'."
    )
    keywords: list[str] = Field(
        default_factory=list,
        description="Top keywords for this topic, ordered by importance.",
    )
    doc_count: int = Field(..., ge=0)
    share: float = Field(..., ge=0, le=1)
    mean_compound: float = Field(..., ge=-1, le=1)
    label_counts: dict[str, int] = Field(default_factory=dict)
    label_share: dict[str, float] = Field(default_factory=dict)
    dominant_label: TopicLabel
    samples: list[TopicSample] = Field(default_factory=list)


class TopicModelResponse(BaseModel):
    """Topic modelling result for a saved analysis."""

    analysis_id: str
    total_documents: int
    assigned_documents: int = Field(
        ...,
        description=(
            "Documents assigned to a topic. Documents flagged as outliers by "
            "BERTopic are excluded from the per-topic counts."
        ),
    )
    outlier_documents: int
    topic_count: int
    backend: str = Field(
        ...,
        description="'bertopic' for the embedding path, 'tfidf-kmeans' for fallback.",
    )
    topics: list[Topic]
