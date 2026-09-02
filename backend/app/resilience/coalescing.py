"""
resilience/coalescing.py — Process-local request coalescing.

Problem solved:
  If 20 concurrent requests arrive with the same Gemini prompt (e.g.
  identical resume audit for the same cached user session), naively
  dispatching all 20 to Gemini wastes quota and spikes latency.
  Coalescing lets the first arrival execute; the others attach to its
  asyncio.Future and receive the same result when it resolves.

How it differs from idempotency:
  Idempotency   — distributed, Redis-backed, across restarts / replicas.
                  Purpose: prevent re-execution across separate requests.
  Coalescing    — process-local, asyncio.Future, ephemeral.
                  Purpose: deduplicate simultaneous in-flight duplicates
                  within a single process to avoid unnecessary Gemini calls.

Process-local: YES — intentionally not distributed.
  Each FastAPI replica independently coalesces its own in-flight requests.
  Cross-replica deduplication is handled by the idempotency layer (Redis).

Fingerprint:
  Callers provide a deterministic key (e.g. SHA-256 of operation + payload).
  Requests with the same fingerprint share a Future.
  Requests with different fingerprints always execute independently.

Lifecycle:
  • Future created → stored in dict.
  • On completion (success or exception) → removed from dict.
  • No permanent memory leak: futures are cleaned up in a `finally` block.
  • Exception propagation: if the first request fails, all waiting callers
    receive the same exception.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any, Callable, Coroutine, TypeVar

logger = logging.getLogger("intelliresume.coalescing")

T = TypeVar("T")


class RequestCoalescer:
    """
    In-flight request deduplicator using asyncio.Future.

    Usage:
        coalescer = RequestCoalescer()

        result = await coalescer.coalesce(
            key="sha256-of-prompt",
            fn=lambda: gemini_client.generate(prompt),
        )
    """

    def __init__(self) -> None:
        # Maps fingerprint → Future that represents the in-flight operation
        self._in_flight: dict[str, asyncio.Future[Any]] = {}

    async def coalesce(
        self,
        key: str,
        fn: Callable[[], Coroutine[Any, Any, T]],
    ) -> T:
        """
        Execute fn() if no identical request is in flight; otherwise wait for
        the already-running request and return its result.

        The key must be a deterministic fingerprint of the logical operation.
        """
        loop = asyncio.get_event_loop()

        existing_future = self._in_flight.get(key)
        if existing_future is not None:
            logger.debug("Coalescing request onto existing future key=%s", key[:16])
            # Attach to the already-running operation
            return await asyncio.shield(existing_future)

        future: asyncio.Future[T] = loop.create_future()
        self._in_flight[key] = future

        try:
            result = await fn()
            future.set_result(result)
            return result
        except Exception as exc:
            if not future.done():
                future.set_exception(exc)
            raise
        finally:
            # Always clean up — prevent unbounded memory growth
            self._in_flight.pop(key, None)

    @property
    def active_count(self) -> int:
        """Number of currently in-flight coalesced operations."""
        return len(self._in_flight)


# Module-level singleton shared across all AI endpoints
request_coalescer = RequestCoalescer()
