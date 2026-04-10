"""AI Strategic Advisor service (Phase 4).

Takes a saved analysis (sentiment results, aggregate stats, key phrases)
and uses an LLM to generate actionable campaign strategy recommendations
grounded in the data.
"""

from __future__ import annotations

import json
import logging

from app.schemas.analyze import BatchAnalyzeResponse
from app.schemas.strategy import (
    StrategyRecommendation,
    StrategyRequest,
    StrategyResponse,
)
from app.services.llm import LLMResponse, chat

log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Data summariser — reuses the same distillation approach as personas
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
        "Sentiment share: "
        + ", ".join(f"{k}={v:.0%}" for k, v in agg.label_share.items())
    )
    lines.append(f"Mean compound score: {agg.mean_compound:.3f}")

    if agg.language_counts:
        lines.append(f"Languages detected: {dict(agg.language_counts)}")

    if agg.top_phrases:
        top = ", ".join(p.phrase for p in agg.top_phrases[:15])
        lines.append(f"Top phrases: {top}")

    # Grab a sample of actual texts (diverse by sentiment)
    pos_texts: list[str] = []
    neu_texts: list[str] = []
    neg_texts: list[str] = []
    for r, t in zip(batch.results, original_texts):
        bucket = (
            pos_texts
            if r.label == "positive"
            else (neg_texts if r.label == "negative" else neu_texts)
        )
        if len(bucket) < 3:
            bucket.append(t[:200])

    if pos_texts:
        lines.append(
            "\nSample positive texts:\n"
            + "\n".join(f"  - {t}" for t in pos_texts)
        )
    if neu_texts:
        lines.append(
            "\nSample neutral texts:\n"
            + "\n".join(f"  - {t}" for t in neu_texts)
        )
    if neg_texts:
        lines.append(
            "\nSample negative texts:\n"
            + "\n".join(f"  - {t}" for t in neg_texts)
        )

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Prompt builder
# ---------------------------------------------------------------------------

_SYSTEM_PROMPT = """\
You are a senior political campaign strategist and data analyst.
You provide actionable, data-grounded strategy recommendations
based on sentiment analysis of public conversations.

RULES:
1. Every recommendation MUST be grounded in the sentiment data provided.
2. Recommendations must cover diverse categories: Messaging, Targeting, \
Risk Mitigation, Resource Allocation, Digital Strategy.
3. Be specific and actionable — campaign teams need concrete next steps.
4. Prioritise recommendations as High / Medium / Low.
5. Always link recommendations back to the sentiment patterns in the data.
6. If bias_awareness is requested, include a candid section about \
limitations and potential biases in social media sentiment data.
7. Return ONLY valid JSON matching the schema below, no markdown fences, \
no extra text.

OUTPUT SCHEMA (JSON object):
{
  "executive_summary": "string (2-3 sentences)",
  "recommendations": [
    {
      "category": "string",
      "title": "string",
      "rationale": "string",
      "actions": ["string", ...],
      "priority": "High" | "Medium" | "Low",
      "sentiment_link": "string"
    }
  ],
  "risk_factors": ["string", ...],
  "bias_caveat": "string or null"
}
"""


def _build_user_prompt(
    data_brief: str,
    request: StrategyRequest,
) -> str:
    parts: list[str] = []
    parts.append(
        "Generate campaign strategy recommendations based on this "
        "sentiment analysis data:\n"
    )
    parts.append(data_brief)

    if request.focus_topics:
        parts.append(
            f"\nFocus the strategy on these topics: "
            f"{', '.join(request.focus_topics)}"
        )
    if request.target_party:
        parts.append(
            f"\nWrite the strategy from the perspective of: "
            f"{request.target_party}"
        )
    if request.bias_awareness:
        parts.append(
            "\nInclude a bias_caveat section about limitations of "
            "sentiment analysis on social media data."
        )
    else:
        parts.append("\nSet bias_caveat to null.")

    parts.append(
        "\nProvide 4-6 recommendations across different categories. "
        "Return a single JSON object matching the schema."
    )
    return "\n".join(parts)


# ---------------------------------------------------------------------------
# JSON parser
# ---------------------------------------------------------------------------


def _parse_strategy_json(raw: str) -> dict:
    """Parse JSON from the LLM, stripping markdown fences if present."""
    text = raw.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines)

    data = json.loads(text)
    if not isinstance(data, dict):
        raise ValueError("Expected a JSON object with strategy data.")
    return data


def _dict_to_recommendation(d: dict) -> StrategyRecommendation:
    """Convert a raw dict to a StrategyRecommendation with defaults."""
    return StrategyRecommendation(
        category=d.get("category", "General"),
        title=d.get("title", "Untitled"),
        rationale=d.get("rationale", ""),
        actions=d.get("actions", [])[:4],
        priority=d.get("priority", "Medium"),
        sentiment_link=d.get("sentiment_link", ""),
    )


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


async def generate_strategy(
    *,
    analysis_id: str,
    batch: BatchAnalyzeResponse,
    original_texts: list[str],
    request: StrategyRequest,
) -> StrategyResponse:
    """Generate campaign strategy from a saved analysis via LLM."""

    data_brief = _summarise_analysis(batch, original_texts)
    user_prompt = _build_user_prompt(data_brief, request)

    llm_resp: LLMResponse = await chat(
        system=_SYSTEM_PROMPT,
        user=user_prompt,
        provider=request.provider,
        model=request.model,
        temperature=0.7,
        max_tokens=4096,
    )

    log.info(
        "Strategy LLM call: provider=%s model=%s tokens=%s",
        llm_resp.provider,
        llm_resp.model,
        llm_resp.usage,
    )

    data = _parse_strategy_json(llm_resp.text)

    recommendations = [
        _dict_to_recommendation(r) for r in data.get("recommendations", [])
    ]
    risk_factors = data.get("risk_factors", [])
    bias_caveat = data.get("bias_caveat")
    executive_summary = data.get("executive_summary", "No summary available.")

    # Build grounding summary
    agg = batch.aggregate
    sentiment_dist = ", ".join(
        f"{k}={v:.0%}" for k, v in agg.label_share.items()
    )
    grounding = (
        f"Strategy generated from {agg.total} analysed texts "
        f"(sentiment: {sentiment_dist}). "
        f"{len(recommendations)} recommendations across "
        f"{len(set(r.category for r in recommendations))} categories."
    )

    return StrategyResponse(
        analysis_id=analysis_id,
        total_rows=agg.total,
        executive_summary=executive_summary,
        recommendations=recommendations,
        risk_factors=risk_factors,
        bias_caveat=bias_caveat,
        grounding_summary=grounding,
        provider=llm_resp.provider,
        model=llm_resp.model,
    )
