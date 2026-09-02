"""
tests/resilience/test_circuit_breaker_py.py

Unit tests for the Python CircuitBreaker implementation.
These tests prove the state machine behavior without any network calls.
"""

import asyncio
import sys
import os
import time

# Allow running from project root
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "backend"))

from app.resilience.circuit_breaker import CircuitBreaker, CircuitState


def make_cb(threshold=5, recovery=0.1) -> CircuitBreaker:
    """Create a circuit breaker with a short recovery time for fast tests."""
    return CircuitBreaker(failure_threshold=threshold, recovery_timeout=recovery)


class TestCircuitBreakerStateMachine:

    def test_initial_state_is_closed(self):
        cb = make_cb()
        assert cb.state == CircuitState.CLOSED
        assert cb.can_execute() is True

    def test_failures_below_threshold_stay_closed(self):
        cb = make_cb(threshold=5)
        for _ in range(4):
            cb.record_failure()
        assert cb.state == CircuitState.CLOSED
        assert cb.can_execute() is True

    def test_threshold_failures_trip_to_open(self):
        cb = make_cb(threshold=5)
        for _ in range(5):
            cb.record_failure()
        assert cb.state == CircuitState.OPEN
        assert cb.can_execute() is False

    def test_open_fails_fast(self):
        cb = make_cb(threshold=1)
        cb.record_failure()
        assert cb.state == CircuitState.OPEN
        # Verify fast failure — no sleep needed
        start = time.monotonic()
        result = cb.can_execute()
        elapsed = time.monotonic() - start
        assert result is False
        assert elapsed < 0.01  # sub-10ms fail fast

    def test_open_transitions_to_half_open_after_timeout(self):
        cb = make_cb(threshold=1, recovery=0.05)
        cb.record_failure()
        assert cb.state == CircuitState.OPEN
        time.sleep(0.1)  # wait past recovery_timeout
        result = cb.can_execute()  # lazy transition
        assert cb.state == CircuitState.HALF_OPEN
        assert result is True

    def test_half_open_allows_exactly_one_probe(self):
        cb = make_cb(threshold=1, recovery=0.05)
        cb.record_failure()
        time.sleep(0.1)

        # First call in HALF_OPEN: allowed (probe)
        assert cb.can_execute() is True
        assert cb._probe_active is True
        # Second concurrent call: rejected
        assert cb.can_execute() is False

    def test_successful_probe_transitions_to_closed(self):
        cb = make_cb(threshold=1, recovery=0.05)
        cb.record_failure()
        time.sleep(0.1)
        cb.can_execute()  # → HALF_OPEN probe activated
        cb.record_success()
        assert cb.state == CircuitState.CLOSED
        assert cb.can_execute() is True

    def test_failed_probe_returns_to_open(self):
        cb = make_cb(threshold=1, recovery=0.05)
        cb.record_failure()  # trip to OPEN
        time.sleep(0.1)
        cb.can_execute()     # → HALF_OPEN probe activated
        cb.record_failure()  # probe fails → back to OPEN
        assert cb.state == CircuitState.OPEN

    def test_success_in_closed_resets_failure_count(self):
        cb = make_cb(threshold=5)
        for _ in range(3):
            cb.record_failure()
        cb.record_success()
        # Failure count reset; 5 more failures should trip
        for _ in range(4):
            cb.record_failure()
        assert cb.state == CircuitState.CLOSED  # Not yet tripped
        cb.record_failure()
        assert cb.state == CircuitState.OPEN

    def test_manual_reset(self):
        cb = make_cb(threshold=1)
        cb.record_failure()
        assert cb.state == CircuitState.OPEN
        cb.reset()
        assert cb.state == CircuitState.CLOSED
        assert cb.can_execute() is True

    def test_stats_dict(self):
        cb = make_cb(threshold=3)
        cb.record_failure()
        stats = cb.stats
        assert stats["state"] == CircuitState.CLOSED
        assert stats["failureCount"] == 1
        assert stats["failureThreshold"] == 3


if __name__ == "__main__":
    suite = TestCircuitBreakerStateMachine()
    tests = [
        suite.test_initial_state_is_closed,
        suite.test_failures_below_threshold_stay_closed,
        suite.test_threshold_failures_trip_to_open,
        suite.test_open_fails_fast,
        suite.test_open_transitions_to_half_open_after_timeout,
        suite.test_half_open_allows_exactly_one_probe,
        suite.test_successful_probe_transitions_to_closed,
        suite.test_failed_probe_returns_to_open,
        suite.test_success_in_closed_resets_failure_count,
        suite.test_manual_reset,
        suite.test_stats_dict,
    ]
    passed = 0
    for t in tests:
        try:
            t()
            print(f"  [PASS] {t.__name__}")
            passed += 1
        except Exception as e:
            print(f"  [FAIL] {t.__name__}: {e}")
    print(f"\n{passed}/{len(tests)} tests passed")
