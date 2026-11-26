"""Persistence for saved analyses, keyed by the verified user id.

Two backends share one interface:

* ``SupabaseBackend`` (production) — table ``public.analyses`` with
  row-level security. The API uses the service-role key, which bypasses
  RLS, so every query here ALSO filters by ``user_id``.
* ``FileBackend`` (tests / offline dev) — one JSON file per analysis under
  ``api/data/analyses/<user_id>/``. Selected only by ``CAMIQ_STORE=file``.

Public functions keep the same names as before; they now take ``user_id``
(the token's ``sub``) instead of an email.
"""

from __future__ import annotations

import json
import os
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Protocol

from app.schemas.analyses import (
    AnalysisSummary,
    SavedAnalysis,
    SaveAnalysisRequest,
)

# api/app/services/analyses_store.py → parents[2] = api/
_DATA_DIR = Path(__file__).resolve().parents[2] / "data" / "analyses"
_TABLE = "analyses"


def _dominant_label(counts: dict[str, int]) -> str:
    if not counts:
        return "neutral"
    return max(counts.items(), key=lambda kv: kv[1])[0]


def _build_record(payload: SaveAnalysisRequest) -> SavedAnalysis:
    agg = payload.batch.aggregate
    return SavedAnalysis(
        id=uuid.uuid4().hex[:12],
        name=payload.name.strip(),
        country_id=payload.country_id,
        source=payload.source,
        total=agg.total,
        dominant_label=_dominant_label(agg.label_counts),
        mean_compound=agg.mean_compound,
        languages_detected=len(agg.language_counts),
        created_at=datetime.now(timezone.utc),
        batch=payload.batch,
        original_texts=payload.original_texts,
    )


def _summary_of(data: dict[str, Any]) -> AnalysisSummary:
    return AnalysisSummary(
        id=data["id"],
        name=data["name"],
        country_id=data.get("country_id"),
        source=data.get("source", "paste"),
        total=data["total"],
        dominant_label=data["dominant_label"],
        mean_compound=data["mean_compound"],
        languages_detected=data.get("languages_detected", 0),
        created_at=data["created_at"],
    )


class _Backend(Protocol):
    def save(self, user_id: str, record: SavedAnalysis) -> None: ...
    def list(self, user_id: str) -> list[AnalysisSummary]: ...
    def get(self, user_id: str, analysis_id: str) -> SavedAnalysis | None: ...
    def delete(self, user_id: str, analysis_id: str) -> bool: ...


# ---------------------------------------------------------------------------
# File backend (tests / offline)
# ---------------------------------------------------------------------------


def _safe_key(value: str) -> str:
    """Make a user id safe as a directory name (defence in depth)."""
    return re.sub(r"[^A-Za-z0-9._-]+", "_", value.strip().lower())


class FileBackend:
    def __init__(self, data_dir: Path) -> None:
        self.data_dir = data_dir

    def _user_dir(self, user_id: str) -> Path:
        return self.data_dir / _safe_key(user_id)

    def save(self, user_id: str, record: SavedAnalysis) -> None:
        d = self._user_dir(user_id)
        d.mkdir(parents=True, exist_ok=True)
        target = d / f"{record.id}.json"
        tmp = target.with_suffix(".json.tmp")
        tmp.write_text(record.model_dump_json(indent=2), encoding="utf-8")
        tmp.rename(target)

    def list(self, user_id: str) -> list[AnalysisSummary]:
        d = self._user_dir(user_id)
        if not d.exists():
            return []
        out: list[AnalysisSummary] = []
        for path in d.glob("*.json"):
            try:
                out.append(_summary_of(json.loads(path.read_text(encoding="utf-8"))))
            except (json.JSONDecodeError, KeyError, ValueError):
                continue
        out.sort(key=lambda s: s.created_at, reverse=True)
        return out

    def get(self, user_id: str, analysis_id: str) -> SavedAnalysis | None:
        target = self._user_dir(user_id) / f"{_safe_key(analysis_id)}.json"
        if not target.exists():
            return None
        try:
            return SavedAnalysis.model_validate_json(target.read_text(encoding="utf-8"))
        except ValueError:
            return None

    def delete(self, user_id: str, analysis_id: str) -> bool:
        target = self._user_dir(user_id) / f"{_safe_key(analysis_id)}.json"
        if not target.exists():
            return False
        target.unlink()
        return True


# ---------------------------------------------------------------------------
# Supabase backend (production)
# ---------------------------------------------------------------------------

_SUMMARY_COLUMNS = (
    "id,name,country_id,source,total,dominant_label,mean_compound,"
    "languages_detected,created_at"
)


class SupabaseBackend:
    def __init__(self, url: str, service_role_key: str) -> None:
        from supabase import create_client  # type: ignore

        self._client = create_client(url, service_role_key)

    def _table(self):
        return self._client.table(_TABLE)

    def save(self, user_id: str, record: SavedAnalysis) -> None:
        row = {
            "id": record.id,
            "user_id": user_id,
            "name": record.name,
            "country_id": record.country_id,
            "source": record.source,
            "total": record.total,
            "dominant_label": record.dominant_label,
            "mean_compound": record.mean_compound,
            "languages_detected": record.languages_detected,
            "created_at": record.created_at.isoformat(),
            "batch": record.batch.model_dump(mode="json"),
            "original_texts": record.original_texts,
        }
        self._table().insert(row).execute()

    def list(self, user_id: str) -> list[AnalysisSummary]:
        res = (
            self._table()
            .select(_SUMMARY_COLUMNS)
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        return [_summary_of(r) for r in (res.data or [])]

    def get(self, user_id: str, analysis_id: str) -> SavedAnalysis | None:
        res = (
            self._table()
            .select("*")
            .eq("user_id", user_id)
            .eq("id", analysis_id)
            .limit(1)
            .execute()
        )
        rows = res.data or []
        if not rows:
            return None
        row = dict(rows[0])
        row.pop("user_id", None)
        try:
            return SavedAnalysis.model_validate(row)
        except ValueError:
            return None

    def delete(self, user_id: str, analysis_id: str) -> bool:
        res = (
            self._table()
            .delete()
            .eq("user_id", user_id)
            .eq("id", analysis_id)
            .execute()
        )
        return bool(res.data)


# ---------------------------------------------------------------------------
# Backend selection + public API
# ---------------------------------------------------------------------------


def _select_backend() -> _Backend:
    if os.getenv("CAMIQ_STORE") == "file":
        if os.getenv("SUPABASE_URL"):
            raise RuntimeError(
                "CAMIQ_STORE=file is a test switch and cannot be combined with "
                "SUPABASE_URL — unset one of them."
            )
        return FileBackend(_DATA_DIR)
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise RuntimeError(
            "Saved analyses need SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. "
            "For offline development set CAMIQ_STORE=file."
        )
    return SupabaseBackend(url, key)


_backend: _Backend = _select_backend()


def save_analysis(payload: SaveAnalysisRequest, user_id: str) -> SavedAnalysis:
    """Persist a batch analysis for ``user_id`` and return the saved record."""
    record = _build_record(payload)
    _backend.save(user_id, record)
    return record


def list_analyses(user_id: str) -> list[AnalysisSummary]:
    """Recent Analyses for ``user_id``, newest first."""
    return _backend.list(user_id)


def get_analysis(user_id: str, analysis_id: str) -> SavedAnalysis | None:
    return _backend.get(user_id, analysis_id)


def delete_analysis(user_id: str, analysis_id: str) -> bool:
    return _backend.delete(user_id, analysis_id)
