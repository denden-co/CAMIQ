"""Saved analyses: save/load round trip, isolation between users, large payloads."""

from conftest import ALICE, BOB, auth_headers, save_payload


def test_save_then_load_round_trip(client, saved_analysis):
    aid = saved_analysis["id"]
    listed = client.get("/api/analyses", headers=auth_headers(ALICE)).json()
    assert [a["id"] for a in listed] == [aid]

    fetched = client.get(f"/api/analyses/{aid}", headers=auth_headers(ALICE)).json()
    assert fetched["name"] == "fixture"
    assert fetched["total"] == 5
    assert len(fetched["original_texts"]) == 5


def test_other_user_gets_404_not_403(client, saved_analysis):
    """Existence must not leak: Bob sees 404, the same as a missing id."""
    aid = saved_analysis["id"]
    assert client.get(f"/api/analyses/{aid}", headers=auth_headers(BOB)).status_code == 404
    assert client.delete(f"/api/analyses/{aid}", headers=auth_headers(BOB)).status_code == 404
    assert client.get("/api/analyses", headers=auth_headers(BOB)).json() == []
    # Alice still has it.
    assert client.get(f"/api/analyses/{aid}", headers=auth_headers(ALICE)).status_code == 200


def test_body_cannot_choose_the_owner(client):
    """A stray user_email / user_id in the body is ignored; identity is the token."""
    payload = save_payload(client) | {"user_email": "bob@example.com", "user_id": BOB}
    res = client.post("/api/analyses", json=payload, headers=auth_headers(ALICE))
    assert res.status_code == 201
    assert client.get("/api/analyses", headers=auth_headers(BOB)).json() == []
    assert len(client.get("/api/analyses", headers=auth_headers(ALICE)).json()) == 1


def test_delete_removes_the_analysis(client, saved_analysis):
    aid = saved_analysis["id"]
    assert client.delete(f"/api/analyses/{aid}", headers=auth_headers(ALICE)).status_code == 204
    assert client.get(f"/api/analyses/{aid}", headers=auth_headers(ALICE)).status_code == 404


def test_large_payload_saves(client):
    texts = [f"Voter {i} says the plan is {'great' if i % 2 else 'awful'} " + "x" * 1_900 for i in range(500)]
    payload = save_payload(client, texts=texts, name="big")
    res = client.post("/api/analyses", json=payload, headers=auth_headers(ALICE))
    assert res.status_code == 201, res.text[:200]
    assert res.json()["total"] == 500
