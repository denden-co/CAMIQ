"""Shared pytest fixtures for the CampaignIQ API.

Tests run against the slim (VADER) backend, the JSON *file* store and the
*fake* auth verifier, so they need no network, no model download and no
Supabase project. Both are selected by env vars that production never sets.
"""

import os
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

API_ROOT = Path(__file__).resolve().parents[1]
if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))

# Must be set before `main` (and therefore the store/auth modules) is imported.
os.environ["CAMIQ_STORE"] = "file"
os.environ["CAMIQ_AUTH"] = "fake"
os.environ.pop("SUPABASE_URL", None)
os.environ.pop("SUPABASE_SERVICE_ROLE_KEY", None)

ALICE = "11111111-1111-4111-8111-111111111111"
BOB = "22222222-2222-4222-8222-222222222222"


def auth_headers(user_id: str = ALICE) -> dict[str, str]:
    """Bearer header the fake verifier accepts: `test-<uuid>`."""
    return {"Authorization": f"Bearer test-{user_id}"}


@pytest.fixture()
def client(tmp_path, monkeypatch):
    """A TestClient whose file store writes to a throwaway directory."""
    from app.services import analyses_store

    monkeypatch.setattr(analyses_store, "_DATA_DIR", tmp_path / "analyses")
    if hasattr(analyses_store, "_backend") and hasattr(analyses_store._backend, "data_dir"):
        monkeypatch.setattr(analyses_store._backend, "data_dir", tmp_path / "analyses")

    from main import app

    with TestClient(app) as test_client:
        yield test_client


TEXTS = [
    "The NHS plan is a huge win for working families.",
    "Taxes are far too high and nothing works.",
    "Housing policy finally helps first-time buyers.",
    "The immigration debate has become toxic.",
    "Energy bills keep rising every single month.",
]


def save_payload(client, texts=TEXTS, name="fixture"):
    batch = client.post("/api/analyze/batch", json={"texts": texts}).json()
    return {"name": name, "source": "paste", "batch": batch, "original_texts": texts}


@pytest.fixture()
def saved_analysis(client):
    """Create and return a saved analysis owned by ALICE."""
    res = client.post("/api/analyses", json=save_payload(client), headers=auth_headers(ALICE))
    assert res.status_code == 201, res.text
    return res.json()
