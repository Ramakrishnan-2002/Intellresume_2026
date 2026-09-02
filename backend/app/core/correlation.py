"""
core/correlation.py — Request correlation ID middleware for FastAPI.

Responsibility:
  • Accept X-Request-Id from the caller (Express BFF or browser direct).
  • Sanitize it: max 64 chars, alphanumeric + hyphens only.
  • Generate a fresh UUID if absent or invalid.
  • Store in request.state AND in a module-level contextvars.ContextVar
    so that any service/log call in the same async task can read it.
  • Echo the final ID back as X-Request-Id in every response.

Why process correlation IDs in Python?
  Express is only allowed to forward the header, not create or own it.
  Python is the authoritative backend; logs and error payloads must all
  agree on the same correlation ID.

Distributed vs process-local:
  Process-local. ContextVar is scoped to the asyncio Task that handles
  the request. No cross-process coordination is needed for tracing IDs.
"""

from __future__ import annotations

import re
import uuid
from contextvars import ContextVar

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

# Accessible from any module in the same request context (async task).
request_id_var: ContextVar[str] = ContextVar("request_id", default="")

_VALID_REQUEST_ID = re.compile(r"^[a-zA-Z0-9_.-]{1,64}$")


def _sanitize(raw: str | None) -> str:
    """
    Accept the header value if it conforms to the safe format.
    Reject (and replace with a fresh UUID) if:
      - absent / empty
      - longer than 64 characters (log-injection vector)
      - contains characters outside [a-zA-Z0-9_-] (header-splitting vector)
    """
    if raw and isinstance(raw, str) and _VALID_REQUEST_ID.match(raw):
        return raw
    return str(uuid.uuid4())


class CorrelationMiddleware(BaseHTTPMiddleware):
    """
    Starlette/FastAPI middleware that sanitizes and propagates X-Request-Id.

    Insert via: app.add_middleware(CorrelationMiddleware)
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        raw = request.headers.get("X-Request-Id") or request.headers.get("x-request-id")
        request_id = _sanitize(raw)

        # Make available to route handlers and services via request.state
        request.state.request_id = request_id

        # Make available to any async code in this request's task tree
        token = request_id_var.set(request_id)

        try:
            response: Response = await call_next(request)
        finally:
            request_id_var.reset(token)

        response.headers["X-Request-Id"] = request_id
        return response


def get_request_id() -> str:
    """
    Helper callable from any service/log function.
    Returns the current request's correlation ID or an empty string if
    called outside a request context (e.g., background tasks).
    """
    return request_id_var.get()
