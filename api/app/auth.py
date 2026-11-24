"""Request authentication.

Identity comes ONLY from a verified Supabase access token sent as
``Authorization: Bearer <token>``. The token is verified server-side by
asking Supabase Auth for the user it belongs to (``auth.get_user``), so the
API never handles signing keys itself and revoked sessions fail immediately.

Test mode: when ``CAMIQ_AUTH=fake`` *and* ``SUPABASE_URL`` is unset, tokens
of the form ``test-<uuid>`` are accepted and map to that uuid. Production
never sets CAMIQ_AUTH, and setting SUPABASE_URL disables fake mode even if
it is set by mistake.
"""

from __future__ import annotations

import logging
import os
import uuid
from functools import lru_cache
from typing import Any

from fastapi import Header, HTTPException
from pydantic import BaseModel

log = logging.getLogger(__name__)


class CurrentUser(BaseModel):
    id: str
    email: str | None = None


_PRODUCTION_MARKERS = ("RENDER", "RAILWAY_ENVIRONMENT", "VERCEL", "FLY_APP_NAME")


def _on_production_host() -> bool:
    return os.getenv("CAMIQ_ENV") == "production" or any(os.getenv(m) for m in _PRODUCTION_MARKERS)


def _fake_mode() -> bool:
    """Test-only verifier. Needs BOTH test switches and no Supabase URL."""
    return (
        os.getenv("CAMIQ_AUTH") == "fake"
        and os.getenv("CAMIQ_STORE") == "file"
        and not os.getenv("SUPABASE_URL")
    )


def check_auth_config() -> None:
    """Fail fast at start-up on a dangerous or incomplete configuration.

    Called from main.py. Raises RuntimeError rather than letting the API
    boot into a state where every request is a 401 (or, worse, where the
    fake verifier is live on a public host).
    """
    if os.getenv("CAMIQ_AUTH") == "fake" or os.getenv("CAMIQ_STORE") == "file":
        if _on_production_host():
            raise RuntimeError(
                "CAMIQ_AUTH=fake / CAMIQ_STORE=file are test switches and are "
                "refused on a production host."
            )
        if _fake_mode():
            log.warning(
                "AUTH IS IN FAKE MODE: 'Bearer test-<uuid>' is accepted as any user. "
                "Local development and tests only."
            )
            return
    if not os.getenv("SUPABASE_URL") or not os.getenv("SUPABASE_SERVICE_ROLE_KEY"):
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for authentication "
            "(or CAMIQ_AUTH=fake with CAMIQ_STORE=file for local tests)."
        )


@lru_cache(maxsize=1)
def _supabase_admin() -> Any:
    """Service-role Supabase client (cached). Raises if not configured."""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for authentication."
        )
    from supabase import create_client  # type: ignore

    return create_client(url, key)


def _unauthorised(detail: str) -> HTTPException:
    return HTTPException(
        status_code=401,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def _verify_fake(token: str) -> CurrentUser:
    if token.startswith("test-"):
        try:
            return CurrentUser(id=str(uuid.UUID(token[5:])), email=None)
        except ValueError:
            pass
    raise _unauthorised("Invalid or expired token")


def _verify_supabase(token: str) -> CurrentUser:
    try:
        from supabase_auth.errors import AuthApiError  # type: ignore
    except ImportError:  # pragma: no cover - older supabase-py
        AuthApiError = ()  # type: ignore[assignment]
    try:
        res = _supabase_admin().auth.get_user(token)
    except AuthApiError as exc:  # Supabase looked at the token and said no
        log.info("token rejected: %s", getattr(exc, "code", type(exc).__name__))
        raise _unauthorised("Invalid or expired token") from exc
    except Exception as exc:  # noqa: BLE001 — outage / misconfig, NOT the user's fault
        log.error("auth service unavailable: %s: %s", type(exc).__name__, exc)
        raise HTTPException(
            status_code=503, detail="Authentication service unavailable. Try again shortly."
        ) from exc
    user = getattr(res, "user", None)
    if user is None or not getattr(user, "id", None):
        raise _unauthorised("Invalid or expired token")
    return CurrentUser(id=str(user.id), email=getattr(user, "email", None))


def current_user(
    authorization: str | None = Header(None, alias="Authorization"),
) -> CurrentUser:
    """FastAPI dependency: the verified caller, or 401.

    Deliberately a plain ``def``: the Supabase round trip is blocking, and
    FastAPI runs sync dependencies in its threadpool, off the event loop.
    """
    if not authorization:
        raise _unauthorised("Missing bearer token")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise _unauthorised("Missing bearer token")
    token = token.strip()
    if _fake_mode():
        return _verify_fake(token)
    return _verify_supabase(token)
