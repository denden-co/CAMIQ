"""Pydantic schemas for the Bias & Fairness Audit endpoint (Phase 4).

A bias audit inspects a saved batch analysis and surfaces disparities in
how the sentiment model treats different language groups, together with
a few corpus-level fairness checks. All metrics are computed from the
saved batch — we never re-run the sentiment model here.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

Verdict = Literal["green", "yellow", "red"]
Severity = Literal["info", "warning", "alert"]


class LanguageGroupStats(BaseModel):
    """Per-language slice of the saved analysis."""

    code: str = Field(..., description="ISO-639-1 code, or 'unknown'.")
    name: str = Field(..., description="Human-readable language name.")
    n: int = Field(..., ge=0, description="Number of rows in this group.")
    share: float = Field(..., ge=0, le=1, description="Share of corpus (0..1).")
    label_counts: dict[str, int] = Field(default_factory=dict)
    label_share: dict[str, float] = Field(default_factory=dict)
    mean_confidence: float = Field(..., ge=0, le=1)
    mean_compound: float = Field(..., ge=-1, le=1)
    small_sample: bool = Field(
        ...,
        description="True when n < min_group_size — treat metrics as indicative only.",
    )


class ConfidenceDisparity(BaseModel):
    """4/5ths-style confidence parity check across language groups."""

    min_group: str | None = Field(
        None, description="Language code with the lowest mean confidence."
    )
    max_group: str | None = Field(
        None, description="Language code with the highest mean confidence."
    )
    min_mean_confidence: float | None = Field(None, ge=0, le=1)
    max_mean_confidence: float | None = Field(None, ge=0, le=1)
    disparity_ratio: float | None = Field(
        None,
        ge=0,
        description=(
            "min_mean_confidence / max_mean_confidence. Below 0.80 is flagged "
            "under the EEOC 4/5ths rule, adapted for model confidence."
        ),
    )
    passes_four_fifths: bool | None = Field(
        None,
        description="True when disparity_ratio ≥ 0.80. None when not computable.",
    )


class ChiSquareTest(BaseModel):
    """Chi-square test of independence: label ⟂ language group?"""

    computable: bool
    reason: str | None = Field(
        None,
        description="Why the test is not computable (too few groups, low expected cell, …).",
    )
    chi2: float | None = None
    dof: int | None = None
    p_value: float | None = None
    significant: bool | None = Field(
        None,
        description="True when p_value < 0.05 — label distribution depends on language.",
    )


class CorpusSkew(BaseModel):
    """Overall corpus balance check."""

    dominant_label: str
    dominant_share: float = Field(..., ge=0, le=1)
    skew_flag: bool = Field(
        ...,
        description="True when dominant_share > 0.70 — corpus is heavily skewed.",
    )


class FairnessFlag(BaseModel):
    """A single surfaced fairness concern."""

    code: str = Field(..., description="Short machine code, e.g. 'CONF_DISPARITY'.")
    severity: Severity
    message: str


class BiasAuditRequest(BaseModel):
    """Optional knobs for POST /api/analyses/{id}/bias-audit."""

    min_group_size: int = Field(
        5,
        ge=1,
        le=100,
        description="Minimum n per language group before metrics are trusted.",
    )


class BiasAuditResponse(BaseModel):
    """Full fairness report for a saved analysis."""

    analysis_id: str
    total_rows: int
    languages_detected: int
    min_group_size: int
    language_groups: list[LanguageGroupStats]
    confidence_disparity: ConfidenceDisparity
    chi_square: ChiSquareTest
    corpus_skew: CorpusSkew
    flags: list[FairnessFlag]
    verdict: Verdict = Field(
        ...,
        description="Aggregate traffic-light verdict: green/yellow/red.",
    )
