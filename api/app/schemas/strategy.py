"""Pydantic schemas for the AI Strategic Advisor endpoint (Phase 4).

The Strategic Advisor takes a saved analysis (sentiment results, topics,
key phrases) and generates actionable campaign strategy recommendations
using an LLM. Recommendations cover messaging, targeting, risk
mitigation, and resource allocation.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class StrategyRequest(BaseModel):
    """Input to POST /api/analyses/{id}/strategy."""

    focus_topics: list[str] | None = Field(
        None,
        description=(
            "Optional list of topics to focus the strategy on "
            "(e.g. ['economy', 'healthcare']). If omitted, the LLM "
            "infers priorities from the data."
        ),
    )
    target_party: str | None = Field(
        None,
        description=(
            "Optional party the strategy is being written for "
            "(e.g. 'Labour', 'Conservative'). Omit for a neutral overview."
        ),
    )
    bias_awareness: bool = Field(
        True,
        description="Include a fairness/bias caveat section in the strategy.",
    )
    provider: str | None = Field(
        None,
        description="LLM provider to use. Auto-selects first available if omitted.",
    )
    model: str | None = Field(
        None,
        description="Model override for the chosen provider.",
    )


class StrategyRecommendation(BaseModel):
    """A single strategic recommendation."""

    category: str = Field(
        ...,
        description=(
            "Category of recommendation, e.g. 'Messaging', 'Targeting', "
            "'Risk Mitigation', 'Resource Allocation', 'Digital Strategy'."
        ),
    )
    title: str = Field(
        ..., description="Short headline for the recommendation."
    )
    rationale: str = Field(
        ...,
        description="Why this matters, grounded in the analysis data.",
    )
    actions: list[str] = Field(
        ...,
        description="2-4 specific, actionable next steps.",
    )
    priority: str = Field(
        ..., description="High / Medium / Low."
    )
    sentiment_link: str = Field(
        "",
        description="How this recommendation connects to the sentiment data.",
    )


class StrategyResponse(BaseModel):
    """Full response from the strategy endpoint."""

    analysis_id: str
    total_rows: int = Field(
        ..., description="Number of rows in the source analysis."
    )
    executive_summary: str = Field(
        ...,
        description="2-3 sentence high-level summary of the strategic picture.",
    )
    recommendations: list[StrategyRecommendation]
    risk_factors: list[str] = Field(
        default_factory=list,
        description="Key risks identified from the sentiment data.",
    )
    bias_caveat: str | None = Field(
        None,
        description="Fairness caveat about potential biases in the source data.",
    )
    grounding_summary: str = Field(
        ...,
        description="Short explanation of how the strategy was derived from the data.",
    )
    provider: str = Field(..., description="LLM provider used.")
    model: str = Field(..., description="Model name used.")
