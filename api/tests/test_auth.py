"""API authentication: identity comes only from a verified bearer token."""

from conftest import ALICE, auth_headers


def test_missing_token_is_401(client):
    res = client.get("/api/analyses")
    assert res.status_code == 401
    assert "bearer" in res.json()["detail"].lower()


def test_garbage_token_is_401(client):
    assert client.get("/api/analyses", headers={"Authorization": "Bearer not-a-token"}).status_code == 401


def test_well_formed_foreign_jwt_is_401(client):
    # Three base64url segments — looks like a JWT, signed by nobody we trust.
    jwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhdHRhY2tlciJ9.c2lnbmF0dXJl"
    assert client.get("/api/analyses", headers={"Authorization": f"Bearer {jwt}"}).status_code == 401


def test_legacy_x_user_email_header_is_ignored(client):
    assert client.get("/api/analyses", headers={"X-User-Email": "anyone@example.com"}).status_code == 401


def test_valid_token_is_accepted(client):
    res = client.get("/api/analyses", headers=auth_headers(ALICE))
    assert res.status_code == 200
    assert res.json() == []


def test_personas_topics_bias_require_token(client, saved_analysis):
    aid = saved_analysis["id"]
    for path in ("personas", "topics", "bias-audit", "strategy"):
        assert client.post(f"/api/analyses/{aid}/{path}").status_code == 401, path
