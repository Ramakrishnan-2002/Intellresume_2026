"""
resilience/bulkhead.py — Async bulkhead (concurrency isolation pool).

Problem solved:
  Without a concurrency cap, a burst of AI requests can spawn unlimited
  simultaneous Gemini calls, exhausting the API quota, spiking latency for
  all users, and potentially crashing the process under memory pressure.

  The bulkhead pattern isolates the AI subsystem: it allows at most
  MAX_CONCURRENT operations to execute simultaneously, queues up to
  MAX_QUEUE_DEPTH additional waiters, and rejects beyond that.

Parameters:
  MAX_CONCURRENT  = 4   (simultaneous active Gemini calls)
  MAX_QUEUE_DEPTH = 12  (additional requests waiting for a slot)
  QUEUE_TIMEOUT   = 8s  (max time a request waits before giving up)

Why asyncio primitives, not threading?
  FastAPI runs on an asyncio event loop.  A blocking threading.Semaphore
  would stall the event loop when acquired, preventing other requests from
  being served.  asyncio.Semaphore yields control back to the event loop
  while waiting, keeping the server responsive.

Process-local: YES — each FastAPI replica has its own bulkhead.
  Cross-replica capacity coordination is provided by the idempotency and
  rate-limiting layers.

Invariants (tested in tests/resilience/test_bulkhead_py.py):
  max_observed_active <= MAX_CONCURRENT = 4
  max_queue_depth     <= MAX_QUEUE_DEPTH = 12
"""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass, field

from ..core.errors import BulkheadCapacityError, BulkheadTimeoutError

logger = logging.getLogger("intelliresume.bulkhead")

MAX_CONCURRENT  = 4
MAX_QUEUE_DEPTH = 12
QUEUE_TIMEOUT   = 8.0  # seconds


@dataclass
class BulkheadStats:
    active: int
    queued: int
    max_concurrent: int
    max_queue_depth: int
    max_observed_active: int


class BulkheadPool:
    """
    Async concurrency-limiting bulkhead.

    Usage:
        async with bulkhead:
            result = await gemini_client.generate(...)
    """

    def __init__(
        self,
        max_concurrent: int = MAX_CONCURRENT,
        max_queue_depth: int = MAX_QUEUE_DEPTH,
        queue_timeout: float = QUEUE_TIMEOUT,
    ) -> None:
        self._semaphore = asyncio.Semaphore(max_concurrent)
        self._max_concurrent = max_concurrent
        self._max_queue_depth = max_queue_depth
        self._queue_timeout = queue_timeout
        self._active = 0
        self._queued = 0
        self._max_observed_active = 0
        self._lock = asyncio.Lock()  # protect counter mutations

    async def __aenter__(self) -> "BulkheadPool":
        async with self._lock:
            if not self._semaphore._value and self._queued >= self._max_queue_depth:
                # Queue is full — reject immediately
                raise BulkheadCapacityError()
            if not self._semaphore._value:
                self._queued += 1

        try:
            await asyncio.wait_for(self._semaphore.acquire(), timeout=self._queue_timeout)
        except asyncio.TimeoutError:
            async with self._lock:
                self._queued = max(0, self._queued - 1)
            raise BulkheadTimeoutError()

        async with self._lock:
            self._queued = max(0, self._queued - 1)
            self._active += 1
            if self._active > self._max_observed_active:
                self._max_observed_active = self._active

        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        async with self._lock:
            self._active = max(0, self._active - 1)
        self._semaphore.release()

    @property
    def stats(self) -> BulkheadStats:
        return BulkheadStats(
            active=self._active,
            queued=self._queued,
            max_concurrent=self._max_concurrent,
            max_queue_depth=self._max_queue_depth,
            max_observed_active=self._max_observed_active,
        )

    def reset_max_observed(self) -> None:
        self._max_observed_active = self._active


# Module-level singleton for all AI operations
ai_bulkhead = BulkheadPool(
    max_concurrent=MAX_CONCURRENT,
    max_queue_depth=MAX_QUEUE_DEPTH,
    queue_timeout=QUEUE_TIMEOUT,
)
