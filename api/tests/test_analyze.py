"""Sentiment endpoints: happy path, input validation, batch maths."""

import pytest


def test_health_reports_backend_truthfully(client):
    body = client.get("/health").json()
    assert body["status"] == "ok"
    # Slim test environment: VADER is live and the API must say so.
    assert body["sentiment"]["model"] == body["sentiment_model"]
    assert isinstance(body["degraded"], bool)
    assert "topics" in body and "available" in body["topics"]


def test_single_analyze_returns_label_and_scores(client):
    res = client.post("/api/analyze", json={"text": "I love this policy"})
    assert res.status_code == 200
    body = res.json()
    assert body["label"] in {"positive", "neutral", "negative"}
    assert 0 <= body["confidence"] <= 1
    assert body["word_count"] == 4


@pytest.mark.parametrize("text", ["", "   "])
def test_single_analyze_rejects_empty_text(client, text):
    res = client.post("/api/analyze", json={"text": text})
    assert res.status_code in (400, 422)


def test_single_analyze_rejects_oversized_text(client):
    res = client.post("/api/analyze", json={"text": "a" * 10_001})
    assert res.status_code == 422


def test_batch_aggregate_maths_add_up(client):
    texts = ["Great news for everyone", "Terrible decision", "The meeting is at 3pm"]
    res = client.post("/api/analyze/batch", json={"texts": texts})
    assert res.status_code == 200
    agg = res.json()["aggregate"]
    assert agg["total"] == 3
    assert sum(agg["label_counts"].values()) == 3
    assert abs(sum(agg["label_share"].values()) - 1.0) < 0.01
    assert -1 <= agg["mean_compound"] <= 1


def test_batch_drops_blank_items(client):
    res = client.post("/api/analyze/batch", json={"texts": ["ok", "", "   ", "fine"]})
    assert res.status_code == 200
    assert res.json()["aggregate"]["total"] == 2


def test_batch_rejects_oversized_item(client):
    res = client.post("/api/analyze/batch", json={"texts": ["x" * 5_001]})
    assert res.status_code == 422
    assert "5,000" in res.text


def test_batch_rejects_oversized_total(client):
    res = client.post("/api/analyze/batch", json={"texts": ["w" * 4_500] * 300})
    assert res.status_code == 422


def test_batch_rejects_more_than_500_items(client):
    res = client.post("/api/analyze/batch", json={"texts": ["a"] * 501})
    assert res.status_code == 422
