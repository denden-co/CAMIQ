"""Country configuration loader.

Reads JSON profiles from `api/configs/countries/` and caches them in memory.
Drop a new `<code>.json` file in that directory and it shows up on the next
server restart — no code changes needed.
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from app.schemas.country import CountryProfile, CountrySummary

# api/app/services/countries.py  ->  api/configs/countries/
_CONFIG_DIR = Path(__file__).resolve().parents[2] / "configs" / "countries"


@lru_cache(maxsize=1)
def _load_all() -> dict[str, CountryProfile]:
    profiles: dict[str, CountryProfile] = {}
    if not _CONFIG_DIR.exists():
        return profiles

    for path in sorted(_CONFIG_DIR.glob("*.json")):
        with path.open("r", encoding="utf-8") as f:
            data = json.load(f)
        profile = CountryProfile.model_validate(data)
        profiles[profile.id] = profile
    return profiles


def list_countries() -> list[CountrySummary]:
    """Return lightweight summaries of every configured country."""
    return [
        CountrySummary(
            id=p.id,
            country=p.country,
            country_code=p.country_code,
            election_name=p.election_name,
            electoral_system=p.electoral_system,
            date=p.date,
            party_count=len(p.parties),
            primary_language=p.primary_language,
        )
        for p in _load_all().values()
    ]


def get_country(country_id: str) -> CountryProfile | None:
    return _load_all().get(country_id)
