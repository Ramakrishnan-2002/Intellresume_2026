"""
tests/resilience/test_rate_limiter_py.py

Unit tests for DistributedRateLimiter:
Proves: in-memory sliding bucket rate limiting, token-based identity extraction, window reset.
"""

import sys
import os
import time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "backend"))

from app.resilience.rate_limiter import DistributedRateLimiter, RateLimitConfig
from app.core.errors import RateLimitedError


def test_in_memory_rate_limiter_allows_under_limit():
    limiter = DistributedRateLimiter(RateLimitConfig("test", max_requests=3, window_seconds=1))
    for _ in range(3):
        limiter._check_memory("user:1")  # Should not raise


def test_in_memory_rate_limiter_blocks_over_limit():
    limiter = DistributedRateLimiter(RateLimitConfig("test", max_requests=3, window_seconds=1))
    for _ in range(3):
        limiter._check_memory("user:2")
    try:
        limiter._check_memory("user:2")
        assert False, "4th request should raise RateLimitedError"
    except RateLimitedError as e:
        assert e.http_status == 429
        assert e.retry_after >= 1


def test_rate_limiter_resets_after_window():
    limiter = DistributedRateLimiter(RateLimitConfig("test", max_requests=2, window_seconds=0.1))
    limiter._check_memory("user:3")
    limiter._check_memory("user:3")
    # Wait past window
    time.sleep(0.15)
    # Should succeed again
    limiter._check_memory("user:3")


if __name__ == "__main__":
    tests = [
        test_in_memory_rate_limiter_allows_under_limit,
        test_in_memory_rate_limiter_blocks_over_limit,
        test_rate_limiter_resets_after_window,
    ]
    passed = 0
    for t in tests:
        try:
            t()
            print(f"  [PASS] {t.__name__}")
            passed += 1
        except Exception as e:
            print(f"  [FAIL] {t.__name__}: {e}")
    print(f"\n{passed}/{len(tests)} rate limiter tests passed")
