"""
resilience/retry.py — Bounded exponential backoff with jitter.

Problem solved:
  Transient upstream failures (Gemini 429/503) often resolve in seconds.
  A single retry with backoff converts a timeout into a successful response
  without requiring the client to retry.

Amplification bound:
  1 logical request → at most 2 upstream Gemini attempts (1 original + 1 retry).
  maxAttempts=1 means "retry at most once".

Why limit to 1 retry?
  More retries amplify load on the already-struggling upstream:
    3 retries × 20 users = 60 Gemini calls instead of 20.
  The circuit breaker handles sustained failures; retry handles brief blips.

Backoff formula:
  delay = base_ms * 2^attempt + random_ms
  With base_ms=300, attempt=1: delay ≈ 600ms + random(0..150ms)

Retry conditions — TRANSIENT errors only:
  • 429 Resource Exhausted
  • 503 Service Unavailable
  • Connection reset / timeout

Never retry:
  • 400 Bad Request       → caller's fault; retrying won't help
  • 401 Unauthorized      → invalid token; retrying won't help
  • 403 Forbidden         → access denied; retrying won't help
  • Pydantic parse errors → logic bug; retrying won't help

Process-local: YES — pure Python, no external coordination.
"""

from __future__ import annotations

import asyncio
import logging
import random
from typing import Any, Callable, Coroutine, TypeVar

from ..infrastructure.gemini_client import GeminiError, GeminiErrorKind

logger = logging.getLogger("intelliresume.retry")

T = TypeVar("T")

MAX_ATTEMPTS  = 1      # retries (0-indexed attempts after first try)
BASE_DELAY_MS = 300    # ms before first retry
MAX_DELAY_MS  = 2000   # ms cap (prevents excessive waits)
JITTER_MS     = 150    # maximum random jitter added


def _compute_delay(attempt: int) -> float:
    """Bounded exponential backoff with full jitter (seconds)."""
    exp = BASE_DELAY_MS * (2 ** attempt)
    jitter = random.uniform(0, JITTER_MS)
    delay_ms = min(exp + jitter, MAX_DELAY_MS)
    return delay_ms / 1000.0


def _is_retryable(exc: Exception) -> bool:
    """
    Only retry transient upstream errors.
    GeminiError.kind == TRANSIENT means 429/503/connection.
    Any other exception type (ValueError, AssertionError, etc.) is not retried.
    """
    if isinstance(exc, GeminiError):
        return exc.kind == GeminiErrorKind.TRANSIENT
    # Catch-all for unexpected transient network errors
    msg = str(exc).lower()
    return any(indicator in msg for indicator in ("429", "503", "timeout", "connection"))


async def retry_with_jitter(
    fn: Callable[[], Coroutine[Any, Any, T]],
    max_attempts: int = MAX_ATTEMPTS,
) -> T:
    """
    Execute fn() with bounded retry on transient failures.

    max_attempts=1 → at most 2 total Gemini calls (original + 1 retry).

    Raises the final exception if all attempts are exhausted or the error
    is non-retryable.
    """
    attempt = 0
    while True:
        try:
            return await fn()
        except Exception as exc:
            if attempt >= max_attempts or not _is_retryable(exc):
                raise

            delay = _compute_delay(attempt)
            logger.info(
                "[Retry] Attempt %d/%d failed (%s). Retrying in %.0fms.",
                attempt + 1, max_attempts + 1, type(exc).__name__, delay * 1000,
            )
            await asyncio.sleep(delay)
            attempt += 1
