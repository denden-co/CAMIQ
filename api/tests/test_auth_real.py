"""The real verifier, the production store, and the start-up safety rails.

These run the Supabase code paths against fakes, so CI proves the filters
and error mapping without a live project.
"""

import importlib
import types

import pytest
from fastapi import HTTPException

from conftest import ALICE, BOB, auth_headers


# --- real verifier --------------------------------------------------------

class _FakeAuth:
    def __init__(self, behaviour):
        self._behaviour = behaviour

    def get_user(self, token):
        b = self._behaviour
        if isinstance(b, Exception):
            raise b
        return b


def _patch_admin(monkeypatch, behaviour):
    from app import auth

    monkeypatch.setattr(auth, "_supabase_admin", lambda: types.SimpleNamespace(auth=_FakeAuth(behaviour)))


def test_verify_supabase_returns_user_id(monkeypatch):
    from app import auth

    user = types.SimpleNamespace(id=ALICE, email="alice@example.com")
    _patch_admin(monkeypatch, types.SimpleNamespace(user=user))
    who = auth._verify_supabase("sometoken")
    assert (who.id, who.email) == (ALICE, "alice@example.com")


def test_verify_supabase_auth_rejection_is_401(monkeypatch):
    from app import auth
    from supabase_auth.errors import AuthApiError

    _patch_admin(monkeypatch, AuthApiError("invalid JWT", 401, "bad_jwt"))
    with pytest.raises(HTTPException) as exc:
        auth._verify_supabase("eyJ.bad.jwt")
    assert exc.value.status_code == 401


def test_verify_supabase_outage_is_503_not_401(monkeypatch):
    """A Supabase outage must not read as 'your session expired'."""
    from app import auth

    _patch_admin(monkeypatch, ConnectionError("eu-west-2 unreachable"))
    with pytest.raises(HTTPException) as exc:
        auth._verify_supabase("sometoken")
    assert exc.value.status_code == 503


def test_verify_supabase_no_user_is_401(monkeypatch):
    from app import auth

    _patch_admin(monkeypatch, types.SimpleNamespace(user=None))
    with pytest.raises(HTTPException) as exc:
        auth._verify_supabase("sometoken")
    assert exc.value.status_code == 401


# --- fake mode rails -------------------------------------------------------

def test_fake_mode_is_off_when_supabase_url_is_set(monkeypatch):
    from app import auth

    monkeypatch.setenv("CAMIQ_AUTH", "fake")
    monkeypatch.setenv("CAMIQ_STORE", "file")
    monkeypatch.setenv("SUPABASE_URL", "https://x.supabase.co")
    assert auth._fake_mode() is False


def test_fake_mode_is_off_without_file_store(monkeypatch):
    from app import auth

    monkeypatch.setenv("CAMIQ_AUTH", "fake")
    monkeypatch.delenv("CAMIQ_STORE", raising=False)
    monkeypatch.delenv("SUPABASE_URL", raising=False)
    assert auth._fake_mode() is False


def test_fake_mode_refused_on_production_host(monkeypatch):
    from app import auth

    monkeypatch.setenv("CAMIQ_AUTH", "fake")
    monkeypatch.setenv("CAMIQ_STORE", "file")
    monkeypatch.delenv("SUPABASE_URL", raising=False)
    monkeypatch.setenv("RENDER", "true")
    with pytest.raises(RuntimeError):
        auth.check_auth_config()


def test_store_refuses_file_backend_when_supabase_url_set(monkeypatch):
    from app.services import analyses_store

    monkeypatch.setenv("CAMIQ_STORE", "file")
    monkeypatch.setenv("SUPABASE_URL", "https://x.supabase.co")
    with pytest.raises(RuntimeError):
        analyses_store._select_backend()


def test_store_refuses_to_start_without_config(monkeypatch):
    from app.services import analyses_store

    monkeypatch.delenv("CAMIQ_STORE", raising=False)
    monkeypatch.delenv("SUPABASE_URL", raising=False)
    monkeypatch.delenv("SUPABASE_SERVICE_ROLE_KEY", raising=False)
    with pytest.raises(RuntimeError):
        analyses_store._select_backend()


# --- production store filters ----------------------------------------------

class _Query:
    """Records the filters a SupabaseBackend call applies."""

    def __init__(self, log, data):
        self.log = log
        self.data = data

    def select(self, cols):
        self.log.append(("select", cols)); return self
    def insert(self, row):
        self.log.append(("insert", row["user_id"])); return self
    def delete(self):
        self.log.append(("delete",)); return self
    def eq(self, col, val):
        self.log.append(("eq", col, val)); return self
    def order(self, *a, **k):
        return self
    def limit(self, *a):
        return self
    def execute(self):
        return types.SimpleNamespace(data=self.data)


def _backend_with(log, data):
    from app.services.analyses_store import SupabaseBackend

    b = SupabaseBackend.__new__(SupabaseBackend)
    b._client = types.SimpleNamespace(table=lambda name: _Query(log, data))
    return b


@pytest.mark.parametrize("method,args", [("list", ()), ("get", ("abc",)), ("delete", ("abc",))])
def test_supabase_backend_always_filters_by_user_id(method, args):
    log: list = []
    b = _backend_with(log, [])
    getattr(b, method)(BOB, *args)
    assert ("eq", "user_id", BOB) in log, log


def test_supabase_backend_insert_sets_owner_from_argument(client):
    from app.services import analyses_store
    from conftest import save_payload
    from app.schemas.analyses import SaveAnalysisRequest

    log: list = []
    b = _backend_with(log, [])
    payload = SaveAnalysisRequest.model_validate(save_payload(client))
    b.save(ALICE, analyses_store._build_record(payload))
    assert ("insert", ALICE) in log


# --- analyse endpoints need a token ---------------------------------------

def test_analyze_endpoints_require_token(client):
    assert client.post("/api/analyze", json={"text": "hello"}).status_code == 401
    assert client.post("/api/analyze/batch", json={"texts": ["a", "b"]}).status_code == 401
    assert client.post("/api/analyze", json={"text": "hello"}, headers=auth_headers()).status_code == 200
