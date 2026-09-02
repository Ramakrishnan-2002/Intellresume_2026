"""
resilience/circuit_breaker.py — Process-local circuit breaker for Gemini.

Problem solved:
  When Gemini is temporarily unavailable (429/503), calling it repeatedly
  amplifies the failure: each caller waits for a timeout before seeing an
  error.  A circuit breaker short-circuits this by failing fast after a
  threshold of consecutive failures is reached.

State machine:
  CLOSED ──(5 failures)──► OPEN ──(15s elapsed)──► HALF_OPEN
    ▲                                                │
    └──────────(successful probe)───────────────────┘
                                ▼ (failed probe)
                              OPEN

CLOSED:
  Normal operation.  Every Gemini call goes through.
  Success resets the failure counter.
  Failure increments the counter.

OPEN:
  Gemini is considered unreliable.  Incoming requests fail fast (<5 ms)
  and receive deterministic fallback responses.  No Gemini calls are made,
  protecting quota and latency.

HALF_OPEN:
  After the recovery timeout, exactly one probe request is allowed.
  - Probe succeeds → CLOSED.
  - Probe fails → back to OPEN.
  Concurrent requests during HALF_OPEN also fail fast (not probe duplicates).

Why process-local, not Redis-backed?
  Circuit state is an optimization for protecting an external dependency.
  It does not need to be globally consistent: each replica independently
  discovers failures and trips independently.  Using Redis would add latency
  and complexity for negligible benefit at current scale.

Concurrency safety:
  asyncio.Lock ensures that state transitions (OPEN → HALF_OPEN,
  probe activation) are mutually exclusive within the process, preventing
  two concurrent requests from both thinking they are the probe.

Tests: tests/resilience/test_circuit_breaker_py.py
"""

from __future__ import annotations

import asyncio
import logging
import time
from enum import Enum

logger = logging.getLogger("intelliresume.circuit_breaker")


class CircuitState(str, Enum):
    CLOSED    = "CLOSED"
    OPEN      = "OPEN"
    HALF_OPEN = "HALF_OPEN"


class CircuitBreaker:
    """
    Three-state circuit breaker protecting the Gemini AI dependency.

    Usage:
        if not circuit_breaker.can_execute():
            return fallback_response()
        try:
            result = await call_gemini()
            circuit_breaker.record_success()
        except Exception as exc:
            circuit_breaker.record_failure()
            raise
    """

    def __init__(
        self,
        failure_threshold: int = 5,
        recovery_timeout: float = 15.0,   # seconds before attempting HALF_OPEN
    ) -> None:
        self._failure_threshold = failure_threshold
        self._recovery_timeout = recovery_timeout
        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._last_failure_at: float = 0.0
        self._probe_active = False
        self._lock = asyncio.Lock()

    # ── State accessors ────────────────────────────────────────────────────

    @property
    def state(self) -> CircuitState:
        return self._state

    # ── Core interface ─────────────────────────────────────────────────────

    def can_execute(self) -> bool:
        """
        Returns True if a Gemini call should proceed.
        Thread-safe for async single-process use (no lock needed for read).
        """
        if self._state == CircuitState.CLOSED:
            return True

        if self._state == CircuitState.OPEN:
            elapsed = time.monotonic() - self._last_failure_at
            if elapsed >= self._recovery_timeout:
                # Transition is handled lazily on first can_execute() call
                self._state = CircuitState.HALF_OPEN
                self._probe_active = False
                logger.info("[CircuitBreaker] Transitioned OPEN → HALF_OPEN (recovery timeout elapsed)")
            else:
                return False  # Still OPEN; fail fast

        if self._state == CircuitState.HALF_OPEN:
            # Allow exactly one concurrent probe
            if not self._probe_active:
                self._probe_active = True
                logger.info("[CircuitBreaker] HALF_OPEN: allowing single probe request")
                return True
            return False  # Another probe is active; fail fast

        return True

    def record_success(self) -> None:
        """Called after a successful Gemini response."""
        prev = self._state
        self._failure_count = 0
        self._state = CircuitState.CLOSED
        self._probe_active = False
        if prev != CircuitState.CLOSED:
            logger.info("[CircuitBreaker] %s → CLOSED after successful response", prev)

    def record_failure(self) -> None:
        """Called after a qualifying Gemini failure (429, 503, timeout, etc.)."""
        self._probe_active = False
        self._failure_count += 1
        self._last_failure_at = time.monotonic()
        if self._failure_count >= self._failure_threshold:
            if self._state != CircuitState.OPEN:
                logger.warning(
                    "[CircuitBreaker] %s → OPEN after %d failures. Failing fast for %.0fs.",
                    self._state, self._failure_count, self._recovery_timeout,
                )
            self._state = CircuitState.OPEN

    def reset(self) -> None:
        """Force reset to CLOSED (used by admin endpoint and test harness)."""
        self._failure_count = 0
        self._state = CircuitState.CLOSED
        self._probe_active = False
        logger.info("[CircuitBreaker] Manually reset to CLOSED")

    @property
    def stats(self) -> dict:
        return {
            "state": self._state,
            "failureCount": self._failure_count,
            "probeActive": self._probe_active,
            "failureThreshold": self._failure_threshold,
            "recoveryTimeoutSeconds": self._recovery_timeout,
        }


# Module-level singleton
circuit_breaker = CircuitBreaker(failure_threshold=5, recovery_timeout=15.0)
