"""
core/errors.py — Centralized structured error model for IntelliResume.

Every API response on error uses:
    { "error": { "code": str, "message": str, "requestId": str } }

This module defines the canonical error codes, custom exception classes, and
the FastAPI exception handlers that produce normalized JSON responses.

Why centralize here?
- Prevents callers from hand-rolling different JSON shapes.
- Makes it trivial to add observability (log once, here).
- Keeps route handlers clean.
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger("intelliresume")


# ─── Canonical error codes ───────────────────────────────────────────────────

class ErrorCode:
    RATE_LIMITED               = "RATE_LIMITED"
    IDEMPOTENCY_IN_PROGRESS    = "IDEMPOTENCY_IN_PROGRESS"
    IDEMPOTENCY_PAYLOAD_MISMATCH = "IDEMPOTENCY_PAYLOAD_MISMATCH"
    AI_QUEUE_TIMEOUT           = "AI_QUEUE_TIMEOUT"
    AI_CAPACITY_EXCEEDED       = "AI_CAPACITY_EXCEEDED"
    AI_DEGRADED                = "AI_DEGRADED"
    AI_TIMEOUT                 = "AI_TIMEOUT"
    CIRCUIT_BREAKER_OPEN       = "CIRCUIT_BREAKER_OPEN"
    OPTIMISTIC_CONCURRENCY_CONFLICT = "OPTIMISTIC_CONCURRENCY_CONFLICT"
    VALIDATION_ERROR           = "VALIDATION_ERROR"
    UNAUTHORIZED               = "UNAUTHORIZED"
    FORBIDDEN                  = "FORBIDDEN"
    NOT_FOUND                  = "NOT_FOUND"
    UPSTREAM_ERROR             = "UPSTREAM_ERROR"
    SERVICE_UNAVAILABLE        = "SERVICE_UNAVAILABLE"
    INTERNAL_ERROR             = "INTERNAL_ERROR"


# ─── Base application exception ─────────────────────────────────────────────

class AppError(Exception):
    """
    Base exception for all structured IntelliResume errors.
    Raise this anywhere; the global handler will normalize it.
    """
    def __init__(
        self,
        code: str,
        message: str,
        http_status: int = 500,
        extra: Optional[dict] = None,
    ):
        super().__init__(message)
        self.code = code
        self.message = message
        self.http_status = http_status
        self.extra = extra or {}


class RateLimitedError(AppError):
    def __init__(self, retry_after: int = 60):
        super().__init__(
            code=ErrorCode.RATE_LIMITED,
            message=f"Rate limit exceeded. Retry after {retry_after} seconds.",
            http_status=429,
            extra={"retryAfter": retry_after},
        )
        self.retry_after = retry_after


class IdempotencyInProgressError(AppError):
    def __init__(self):
        super().__init__(
            code=ErrorCode.IDEMPOTENCY_IN_PROGRESS,
            message="A request with this Idempotency-Key is currently being processed.",
            http_status=409,
        )


class IdempotencyMismatchError(AppError):
    def __init__(self):
        super().__init__(
            code=ErrorCode.IDEMPOTENCY_PAYLOAD_MISMATCH,
            message="The Idempotency-Key was previously used with a different request payload.",
            http_status=422,
        )


class BulkheadTimeoutError(AppError):
    def __init__(self):
        super().__init__(
            code=ErrorCode.AI_QUEUE_TIMEOUT,
            message="AI request spent too long waiting for an execution slot. Retry shortly.",
            http_status=503,
            extra={"retryAfter": 5},
        )


class BulkheadCapacityError(AppError):
    def __init__(self):
        super().__init__(
            code=ErrorCode.AI_CAPACITY_EXCEEDED,
            message="AI processing pipeline is at peak capacity. Please retry shortly.",
            http_status=503,
            extra={"retryAfter": 5},
        )


class CircuitOpenError(AppError):
    def __init__(self):
        super().__init__(
            code=ErrorCode.CIRCUIT_BREAKER_OPEN,
            message="AI service is temporarily unavailable. Operating in fallback mode.",
            http_status=503,
        )


def error_body(code: str, message: str, request_id: str, extra: Optional[dict] = None) -> dict:
    payload: dict = {
        "error": {"code": code, "message": message, "requestId": request_id},
        "detail": message,
    }
    if extra:
        payload["error"].update(extra)
    return payload


# ─── FastAPI exception handlers ──────────────────────────────────────────────

async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    request_id = getattr(request.state, "request_id", "unknown")
    logger.warning(
        "AppError code=%s status=%s path=%s request_id=%s msg=%s",
        exc.code, exc.http_status, request.url.path, request_id, exc.message,
    )
    headers = {}
    if isinstance(exc, RateLimitedError):
        headers["Retry-After"] = str(exc.retry_after)
    if isinstance(exc, (BulkheadTimeoutError, BulkheadCapacityError)):
        headers["Retry-After"] = "5"

    return JSONResponse(
        status_code=exc.http_status,
        content=error_body(exc.code, exc.message, request_id, exc.extra or None),
        headers=headers,
    )


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    request_id = getattr(request.state, "request_id", "unknown")
    # Map common HTTP status codes to canonical error codes
    code_map = {
        401: ErrorCode.UNAUTHORIZED,
        403: ErrorCode.FORBIDDEN,
        404: ErrorCode.NOT_FOUND,
        409: ErrorCode.OPTIMISTIC_CONCURRENCY_CONFLICT,
        422: ErrorCode.VALIDATION_ERROR,
        429: ErrorCode.RATE_LIMITED,
        503: ErrorCode.SERVICE_UNAVAILABLE,
    }
    code = code_map.get(exc.status_code, ErrorCode.INTERNAL_ERROR)
    detail = exc.detail
    # If FastAPI raised a rich dict detail (e.g. OCC 409), preserve both detail and error
    if isinstance(detail, dict):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": detail, "error": detail},
        )
    return JSONResponse(
        status_code=exc.status_code,
        content=error_body(code, str(detail), request_id),
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    request_id = getattr(request.state, "request_id", "unknown")
    logger.exception("Unhandled exception request_id=%s path=%s", request_id, request.url.path)
    return JSONResponse(
        status_code=500,
        content=error_body(
            ErrorCode.INTERNAL_ERROR,
            "An unexpected internal error occurred.",
            request_id,
        ),
    )
