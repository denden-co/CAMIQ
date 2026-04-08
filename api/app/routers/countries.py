"""Country configuration router."""

from fastapi import APIRouter, HTTPException

from app.schemas.country import CountryProfile, CountrySummary
from app.services.countries import get_country, list_countries

router = APIRouter()


@router.get("/countries", response_model=list[CountrySummary])
async def list_all() -> list[CountrySummary]:
    """Return summaries of every configured country / election."""
    return list_countries()


@router.get("/countries/{country_id}", response_model=CountryProfile)
async def get_one(country_id: str) -> CountryProfile:
    """Return the full profile for one country by ID."""
    profile = get_country(country_id)
    if profile is None:
        raise HTTPException(
            status_code=404,
            detail=f"Country '{country_id}' not found.",
        )
    return profile
