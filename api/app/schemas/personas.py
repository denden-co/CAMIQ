"""Pydantic schemas for the Voter Personas endpoint (Phase 4).

Personas are LLM-generated voter archetypes grounded in real sentiment
analysis data. They combine the statistical signals from a saved
analysis (sentiment distribution, key phrases, topic breakdown) with
demographic and psychographic context to create realistic voter
profiles a campaign strategist can act on.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class PersonaRequest(BaseModel):
    """Input to POST /api/analyses/{id}/personas."""

    count: int = Field(
        3,
        ge=1,
        le=10,
        description="Number of personas to generate.",
    )
    country: str | None = Field(
        None,
        description="Country context (e.g. 'United Kingdom'). Auto-detected from analysis if omitted.",
    )
    election: str | None = Field(
        None,
        description="Election context (e.g. '2024 General Election').",
    )
    demographics_hint: str | None = Field(
        None,
        description=(
            "Optional free-text hint for demographic diversity "
            "(e.g. 'include a young urban voter and a rural retiree')."
        ),
    )
    provider: str | None = Field(
        None,
        description="LLM provider to use. Auto-selects first available if omitted.",
    )
    model: str | None = Field(
        None,
        description="Model override for the chosen provider.",
    )


class PersonaTrait(BaseModel):
    """A single personality or behavioural trait."""

    trait: str = Field(..., description="Short trait name.")
    description: str = Field(..., description="One-sentence explanation.")


class PersonaProfile(BaseModel):
    """A single generated voter persona."""

    name: str = Field(..., description="Realistic fictional name.")
    age: int = Field(..., ge=18, le=100)
    gender: str
    location: str = Field(..., description="City or region.")
    occupation: str
    education: str
    income_bracket: str
    political_leaning: str = Field(
        ..., description="E.g. 'centre-left', 'right-wing populist', 'undecided'."
    )
    top_issues: list[str] = Field(
        ..., description="3-5 issues this voter cares about most."
    )
    sentiment_alignment: Literal["positive", "neutral", "negative"] = Field(
        ...,
        description="Which sentiment cluster this persona aligns with from the analysis data.",
    )
    confidence_level: float = Field(
        ..., ge=0, le=1,
        description="How confident this voter is in their current position (0=very uncertain, 1=firm).",
    )
    narrative: str = Field(
        ...,
        description="2-4 sentence narrative describing this voter's perspective and motivations.",
    )
    media_diet: list[str] = Field(
        default_factory=list,
        description="News sources, social platforms, or media this voter consumes.",
    )
    persuadability: str = Field(
        ...,
        description="Low / Medium / High — how open to changing their vote.",
    )
    messaging_angles: list[str] = Field(
        default_factory=list,
        description="2-3 campaign messaging angles that would resonate with this persona.",
    )
    traits: list[PersonaTrait] = Field(
        default_factory=list,
        description="Key personality traits.",
    )


class PersonasResponse(BaseModel):
    """Full response from the personas endpoint."""

    analysis_id: str
    total_rows: int = Field(..., description="Number of rows in the source analysis.")
    personas: list[PersonaProfile]
    grounding_summary: str = Field(
        ...,
        description="Short explanation of how the personas were derived from the data.",
    )
    provider: str = Field(..., description="LLM provider used.")
    model: str = Field(..., description="Model name used.")
