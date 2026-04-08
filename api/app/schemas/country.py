"""Pydantic schemas for country/election configuration."""

from typing import Literal

from pydantic import BaseModel, Field

ElectoralSystem = Literal[
    "fptp",                # First past the post
    "pr",                  # Proportional representation
    "mmp",                 # Mixed member proportional
    "two_round",           # Two-round system
    "electoral_college",
    "stv",                 # Single transferable vote
    "other",
]


class Party(BaseModel):
    id: str
    name: str
    short: str
    colour: str = Field(..., description="Hex colour code")


class CountryProfile(BaseModel):
    id: str
    country: str
    country_code: str = Field(..., description="ISO 3166-1 alpha-2 code")
    election_name: str
    election_type: str
    electoral_system: ElectoralSystem
    date: str
    languages: list[str]
    primary_language: str
    parties: list[Party]
    disclaimers: list[str] = []
    sentiment_models_recommended: list[str] = []
    total_constituencies: int | None = None
    total_electoral_votes: int | None = None
    winning_threshold: int | None = None


class CountrySummary(BaseModel):
    """Lightweight summary used in list endpoints."""

    id: str
    country: str
    country_code: str
    election_name: str
    electoral_system: ElectoralSystem
    date: str
    party_count: int
    primary_language: str
