"""Saved analyses: save/load round trip, isolation between users, auth."""


def test_save_then_load_round_trip(client, saved_analysis):
    headers = {"X-User-Email": "alice@example.com"}
    aid = saved_analysis["id"]

    listed = client.get("/api/analyses", headers=headers).json()
    assert [a["id"] for a in listed] == [aid]

    fetched = client.get(f"/api/analyses/{aid}", headers=headers).json()
    assert fetched["name"] == "fixture"
    assert fetched["total"] == 5
    assert len(fetched["original_texts"]) == 5


def test_missing_identity_header_is_rejected(client):
    assert client.get("/api/analyses").status_code == 401


def test_another_user_cannot_see_the_analysis(client, saved_analysis):
    """Each identity only sees its own data.

    NOTE: until Phase 8 (Supabase auth) the identity is a plain header, so
    this isolation is advisory only. This test pins the storage contract
    so the real-auth swap keeps it.
    """
    aid = saved_analysis["id"]
    res = client.get(f"/api/analyses/{aid}", headers={"X-User-Email": "bob@example.com"})
    assert res.status_code == 404


def test_email_is_sanitised_before_becoming_a_path(client, saved_analysis, tmp_path):
    from app.services import analyses_store

    assert analyses_store._safe_key("../../etc") == ".._.._etc"
    assert "/" not in analyses_store._safe_key("a/b@c.com")


def test_delete_removes_the_analysis(client, saved_analysis):
    headers = {"X-User-Email": "alice@example.com"}
    aid = saved_analysis["id"]
    assert client.delete(f"/api/analyses/{aid}", headers=headers).status_code == 204
    assert client.get(f"/api/analyses/{aid}", headers=headers).status_code == 404
