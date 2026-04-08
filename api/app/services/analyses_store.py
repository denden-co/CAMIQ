"""File-backed persistence stub for saved analyses.

Phase 2 uses flat JSON files on disk keyed by user email. The public
interface is identical to what a Supabase-backed store will look like, so
when real auth comes back we swap this one module out and the rest of the
API is unchanged.

Storage layout:
    api/data/analyses/
        <email>/
            <id>.json      # SavedAnalysis payload
            _index.json    # optional, currently unused

Files are written atomically (tmp + rename) to avoid half-written state.
"""

from __future__ import annotations

import json
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path

from app.schemas.analyses import (
    AnalysisSummary,
    SavedAnalysis,
    SaveAnalysisRequest,
)

# api/app/services/analyses_store.py → parents[2] = api/
_DATA_DIR = Path(__file__).resolve().parents[2] / "data" / "analyses"


def _safe_key(email: str) -> str:
    """Turn an email into a safe filesystem directory name."""
    return re.sub(r"[^A-Za-z0-9._-]+", "_", email.strip().lower())


def _user_dir(email: str) -> Path:
    d = _DATA_DIR / _safe_key(email)
    d.mkdir(parents=True, exist_ok=True)
    return d


def _dominant_label(counts: dict[str, int]) -> str:
    if not counts:
        return "neutral"
    return max(counts.items(), key=lambda kv: kv[1])[0]


def save_analysis(payload: SaveAnalysisRequest) -> SavedAnalysis:
    """Persist a batch analysis to disk and return the saved record."""
    analysis_id = uuid.uuid4().hex[:12]
    created_at = datetime.now(timezone.utc)

    saved = SavedAnalysis(
        id=analysis_id,
        name=payload.name.strip(),
        country_id=payload.country_id,
        source=payload.source,
        total=payload.batch.aggregate.total,
        dominant_label=_dominant_label(payload.batch.aggregate.label_counts),
        mean_compound=payload.batch.aggregate.mean_compound,
        languages_detected=len(payload.batch.aggregate.language_counts),
        created_at=created_at,
        batch=payload.batch,
        original_texts=payload.original_texts,
    )

    user_dir = _user_dir(payload.user_email)
    target = user_dir / f"{analysis_id}.json"
    tmp = target.with_suffix(".json.tmp")
    tmp.write_text(saved.model_dump_json(indent=2), encoding="utf-8")
    tmp.rename(target)

    return saved


def list_analyses(user_email: str) -> list[AnalysisSummary]:
    """Return Recent Analyses for a user, newest first."""
    user_dir = _DATA_DIR / _safe_key(user_email)
    if not user_dir.exists():
        return []

    summaries: list[AnalysisSummary] = []
    for path in user_dir.glob("*.json"):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            # Build a summary without the heavy batch/original_texts payload.
            summaries.append(
                AnalysisSummary(
                    id=data["id"],
                    name=data["name"],
                    country_id=data.get("country_id"),
                    source=data.get("source", "paste"),
                    total=data["total"],
                    dominant_label=data["dominant_label"],
                    mean_compound=data["mean_compound"],
                    languages_detected=data["languages_detected"],
                    created_at=data["created_at"],
                )
            )
        except (json.JSONDecodeError, KeyError):
            # Skip corrupted files rather than 500 the list endpoint.
            continue

    summaries.sort(key=lambda s: s.created_at, reverse=True)
    return summaries


def get_analysis(user_email: str, analysis_id: str) -> SavedAnalysis | None:
    user_dir = _DATA_DIR / _safe_key(user_email)
    target = user_dir / f"{analysis_id}.json"
    if not target.exists():
        return None
    try:
        data = json.loads(target.read_text(encoding="utf-8"))
        return SavedAnalysis.model_validate(data)
    except (json.JSONDecodeError, ValueError):
        return None


def delete_analysis(user_email: str, analysis_id: str) -> bool:
    user_dir = _DATA_DIR / _safe_key(user_email)
    target = user_dir / f"{analysis_id}.json"
    if not target.exists():
        return False
    target.unlink()
    return True
