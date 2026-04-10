"""Voter Persona generation service (Phase 4).

Takes a saved analysis (sentiment results, aggregate stats, key phrases)
and uses an LLM to generate realistic voter personas grounded in the data.
"""

from __future__ import annotations

import json
import logging
from collections import Counter

from app.schemas.analyze import AnalyzeResponse, BatchAnalyzeResponse
from app.schemas.personas import (
    PersonaProfile,
    PersonaRequest,
    PersonasResponse,
    PersonaTrait,
)
from app.services.llm import LLMResponse, chat

log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Data summariser — distill a saved analysis into an LLM-friendly brief
# ---------------------------------------------------------------------------

def _summarise_analysis(
    batch: BatchAnalyzeResponse,
    original_texts: list[str],
) -> str:
    """Build a concise data brief for the LLM prompt."""
    agg = batch.aggregate
    lines: list[str] = []

    lines.append(f"Total texts analysed: {agg.total}")
    lines.append(f"Sentiment distribution: {dict(agg.label_counts)}")
    lines.append(
        f"Sentiment share: "
        + ", ".join(f"{k}={v:.0%}" for k, v in agg.label_share.items())
    )
    lines.append(f"Mean compound score: {agg.mean_compound:.3f}")

    if agg.language_counts:
        lines.append(f"Languages detected: {dict(agg.language_counts)}")

    if agg.top_phrases:
        top = ", ".join(p.phrase for p in agg.top_phrases[:15])
        lines.append(f"Top phrases: {top}")

    # Grab a sample of actual texts (diverse by sentiment)
    pos_texts = []
    neu_texts = []
    neg_texts = []
    for r, t in zip(batch.results, original_texts):
        bucket = pos_texts if r.label == "positive" else (neg_texts if r.label == "negative" else neu_texts)
        if len(bucket) < 3:
            bucket.append(t[:200])

    if pos_texts:
        lines.append(f"\nSample positive texts:\n" + "\n".join(f"  - {t}" for t in pos_texts))
    if neu_texts:
        lines.append(f"\nSample neutral texts:\n" + "\n".join(f"  - {t}" for t in neu_texts))
    if neg_texts:
        lines.append(f"\nSample negative texts:\n" + "\n".join(f"  - {t}" for t in neg_texts))

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Prompt builder
# ---------------------------------------------------------------------------

_SYSTEM_PROMPT = """\
You are a political intelligence analyst specialising in voter persona creation.
You create realistic, data-grounded voter personas for campaign strategy teams.

RULES:
1. Every persona MUST be grounded in the sentiment data provided.
2. Personas must be diverse across demographics, geography, and political outlook.
3. Names should be culturally appropriate for the country context.
4. Each persona's sentiment_alignment must match one of the sentiment clusters in the data.
5. Allocate personas roughly proportional to the sentiment distribution (e.g. if 60% positive, most personas should align positive).
6. Be specific and actionable — campaign teams need to act on these.
7. Return ONLY valid JSON matching the schema below, no markdown fences, no extra text.

OUTPUT SCHEMA (JSON array):
[
  {
    "name": "string",
    "age": integer (18-100),
    "gender": "string",
    "location": "string (city or region)",
    "occupation": "string",
    "education": "string",
    "income_bracket": "string",
    "political_leaning": "string",
    "top_issues": ["string", ...],
    "sentiment_alignment": "positive" | "neutral" | "negative",
    "confidence_level": float (0-1),
    "narrative": "string (2-4 sentences)",
    "media_diet": ["string", ...],
    "persuadability": "Low" | "Medium" | "High",
    "messaging_angles": ["string", ...],
    "traits": [{"trait": "string", "description": "string"}, ...]
  }
]
"""


def _build_user_prompt(
    data_brief: str,
    count: int,
    country: str | None,
    election: str | None,
    demographics_hint: str | None,
) -> str:
    parts: list[str] = []
    parts.append(f"Generate {count} voter persona(s) based on this analysis data:\n")
    parts.append(data_brief)

    if country:
        parts.append(f"\nCountry context: {country}")
    if election:
        parts.append(f"Election context: {election}")
    if demographics_hint:
        parts.append(f"Demographic guidance: {demographics_hint}")

    parts.append(f"\nReturn a JSON array of exactly {count} persona object(s).")
    return "\n".join(parts)


# ---------------------------------------------------------------------------
# JSON parser with fallback
# ---------------------------------------------------------------------------

def _parse_personas_json(raw: str) -> list[dict]:
    """Parse JSON from the LLM, stripping markdown fences if present."""
    text = raw.strip()
    # Strip ```json ... ``` fences
    if text.startswith("```"):
        lines = text.split("\n")
        # Remove first and last fence lines
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines)

    data = json.loads(text)
    if isinstance(data, dict) and "personas" in data:
        data = data["personas"]
    if not isinstance(data, list):
        raise ValueError("Expected a JSON array of persona objects.")
    return data


def _dict_to_profile(d: dict) -> PersonaProfile:
    """Convert a raw dict to a PersonaProfile, with sensible defaults."""
    traits_raw = d.get("traits", [])
    traits = []
    for t in traits_raw:
        if isinstance(t, dict):
            traits.append(PersonaTrait(
                trait=t.get("trait", "Unknown"),
                description=t.get("description", ""),
            ))

    return PersonaProfile(
        name=d.get("name", "Unknown"),
        age=max(18, min(100, int(d.get("age", 35)))),
        gender=d.get("gender", "Not specified"),
        location=d.get("location", "Not specified"),
        occupation=d.get("occupation", "Not specified"),
        education=d.get("education", "Not specified"),
        income_bracket=d.get("income_bracket", "Not specified"),
        political_leaning=d.get("political_leaning", "Not specified"),
        top_issues=d.get("top_issues", [])[:5],
        sentiment_alignment=d.get("sentiment_alignment", "neutral"),
        confidence_level=max(0.0, min(1.0, float(d.get("confidence_level", 0.5)))),
        narrative=d.get("narrative", "No narrative provided."),
        media_diet=d.get("media_diet", []),
        persuadability=d.get("persuadability", "Medium"),
        messaging_angles=d.get("messaging_angles", []),
        traits=traits,
    )


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def generate_personas(
    *,
    analysis_id: str,
    batch: BatchAnalyzeResponse,
    original_texts: list[str],
    request: PersonaRequest,
) -> PersonasResponse:
    """Generate voter personas from a saved analysis via LLM."""

    data_brief = _summarise_analysis(batch, original_texts)
    user_prompt = _build_user_prompt(
        data_brief=data_brief,
        count=request.count,
        country=request.country,
        election=request.election,
        demographics_hint=request.demographics_hint,
    )

    llm_resp: LLMResponse = await chat(
        system=_SYSTEM_PROMPT,
        user=user_prompt,
        provider=request.provider,
        model=request.model,
        temperature=0.8,
        max_tokens=4096,
    )

    log.info(
        "Persona LLM call: provider=%s model=%s tokens=%s",
        llm_resp.provider,
        llm_resp.model,
        llm_resp.usage,
    )

    raw_personas = _parse_personas_json(llm_resp.text)
    profiles = [_dict_to_profile(d) for d in raw_personas[:request.count]]

    # Build grounding summary
    agg = batch.aggregate
    sentiment_dist = ", ".join(f"{k}={v:.0%}" for k, v in agg.label_share.items())
    grounding = (
        f"Generated {len(profiles)} persona(s) from {agg.total} analysed texts "
        f"(sentiment: {sentiment_dist}). Personas are distributed across "
        f"sentiment clusters proportional to the data."
    )

    return PersonasResponse(
        analysis_id=analysis_id,
        total_rows=agg.total,
        personas=profiles,
        grounding_summary=grounding,
        provider=llm_resp.provider,
        model=llm_resp.model,
    )
