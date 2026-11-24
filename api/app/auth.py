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


def _fake_mode() -> bool:
    return os.getenv("CAMIQ_AUTH") == "fake" and not os.getenv("SUPABASE_URL")


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
        res = _supabase_admin().auth.get_user(token)
    except Exception as exc:  # noqa: BLE001 — any auth error is a 401, not a 500
        log.info("token rejected: %s", type(exc).__name__)
        raise _unauthorised("Invalid or expired token") from exc
    user = getattr(res, "user", None)
    if user is None or not getattr(user, "id", None):
        raise _unauthorised("Invalid or expired token")
    return CurrentUser(id=str(user.id), email=getattr(user, "email", None))


async def current_user(
    authorization: str | None = Header(None, alias="Authorization"),
) -> CurrentUser:
    """FastAPI dependency: the verified caller, or 401."""
    if not authorization:
        raise _unauthorised("Missing bearer token")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise _unauthorised("Missing bearer token")
    token = token.strip()
    if _fake_mode():
        return _verify_fake(token)
    return _verify_supabase(token)
