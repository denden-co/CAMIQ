"""Shared pytest fixtures for the CampaignIQ API.

Tests run against the slim (VADER) backend so they need no model download
and no network. Saved analyses are redirected to a temp folder so tests
never touch real user data under api/data/.
"""

import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

# Make `main` and `app.*` importable when pytest runs from the repo root.
API_ROOT = Path(__file__).resolve().parents[1]
if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))


@pytest.fixture()
def client(tmp_path, monkeypatch):
    """A TestClient whose analyses store writes to a throwaway directory."""
    from app.services import analyses_store

    monkeypatch.setattr(analyses_store, "_DATA_DIR", tmp_path / "analyses")

    from main import app

    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture()
def saved_analysis(client):
    """Create and return a saved analysis for one test user."""
    texts = [
        "The NHS plan is a huge win for working families.",
        "Taxes are far too high and nothing works.",
        "Housing policy finally helps first-time buyers.",
        "The immigration debate has become toxic.",
        "Energy bills keep rising every single month.",
    ]
    batch = client.post("/api/analyze/batch", json={"texts": texts}).json()
    payload = {
        "name": "fixture",
        "source": "paste",
        "batch": batch,
        "original_texts": texts,
        "user_email": "ignored@example.com",
    }
    res = client.post(
        "/api/analyses", json=payload, headers={"X-User-Email": "alice@example.com"}
    )
    assert res.status_code == 201, res.text
    return res.json()
