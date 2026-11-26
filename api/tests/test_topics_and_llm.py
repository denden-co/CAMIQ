"""Topic modelling on the slim install, and LLM error handling."""

import pytest

from conftest import auth_headers


def test_topics_work_without_the_ml_stack(client, saved_analysis):
    """Regression: used to 500 with 'No module named sklearn' on slim deploys."""
    headers = auth_headers()
    res = client.post(f"/api/analyses/{saved_analysis['id']}/topics", headers=headers)
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["backend"] in {"bertopic", "tfidf-kmeans"}
    assert body["total_documents"] == 5


def test_personas_without_provider_key_gives_clear_422(client, saved_analysis, monkeypatch):
    for key in ("GOOGLE_API_KEY", "OPENAI_API_KEY", "ANTHROPIC_API_KEY", "HF_TOKEN"):
        monkeypatch.delenv(key, raising=False)
    headers = auth_headers()
    res = client.post(f"/api/analyses/{saved_analysis['id']}/personas", headers=headers)
    assert res.status_code == 422


@pytest.mark.anyio
@pytest.mark.parametrize("anyio_backend", ["asyncio"])
async def test_llm_post_retries_once_then_raises(anyio_backend, monkeypatch):
    """A provider outage must surface as LLMProviderError, not hang for minutes."""
    import httpx

    from app.services import llm

    calls = {"n": 0}

    class FakeClient:
        def __init__(self, *a, **k):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *a):
            return False

        async def post(self, *a, **k):
            calls["n"] += 1
            raise httpx.ConnectError("boom")

    monkeypatch.setattr(llm.httpx, "AsyncClient", FakeClient)
    with pytest.raises(llm.LLMProviderError):
        await llm._post_json("https://example.invalid/x", {}, {})
    assert calls["n"] == 2

