"""
tests/resilience/test_retry_py.py

Unit tests for the Python retry_with_jitter implementation.
Proves: max 2 Gemini attempts, transient-only retry, no permanent error retry.
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "backend"))

from app.resilience.retry import retry_with_jitter
from app.infrastructure.gemini_client import GeminiError, GeminiErrorKind


async def test_success_on_first_attempt():
    """No retry needed when first attempt succeeds."""
    attempts = []
    async def fn():
        attempts.append(1)
        return "ok"
    result = await retry_with_jitter(fn, max_attempts=1)
    assert result == "ok"
    assert len(attempts) == 1
    print("  [PASS] success_on_first_attempt: 1 attempt")


async def test_transient_error_retried_once():
    """Transient GeminiError retried exactly once (max 2 total attempts)."""
    attempts = []
    async def fn():
        attempts.append(1)
        if len(attempts) == 1:
            raise GeminiError("429 quota exceeded", GeminiErrorKind.TRANSIENT)
        return "ok"
    result = await retry_with_jitter(fn, max_attempts=1)
    assert result == "ok"
    assert len(attempts) == 2, f"Expected 2 attempts, got {len(attempts)}"
    print("  [PASS] transient_error_retried_once: exactly 2 attempts")


async def test_permanent_error_not_retried():
    """Permanent GeminiError is NOT retried."""
    attempts = []
    async def fn():
        attempts.append(1)
        raise GeminiError("401 unauthorized", GeminiErrorKind.PERMANENT)
    try:
        await retry_with_jitter(fn, max_attempts=1)
        assert False, "Should have raised"
    except GeminiError:
        pass
    assert len(attempts) == 1, f"Permanent error must not be retried, got {len(attempts)} attempts"
    print("  [PASS] permanent_error_not_retried: 1 attempt")


async def test_max_attempts_respected():
    """After max_attempts exhausted, raises the final exception."""
    attempts = []
    async def fn():
        attempts.append(1)
        raise GeminiError("503 unavailable", GeminiErrorKind.TRANSIENT)
    try:
        await retry_with_jitter(fn, max_attempts=1)
        assert False, "Should have raised"
    except GeminiError:
        pass
    # max_attempts=1 means 1 original + 1 retry = 2 total
    assert len(attempts) == 2, f"Expected 2 attempts, got {len(attempts)}"
    print(f"  [PASS] max_attempts_respected: {len(attempts)} total attempts (max amplification = 2x)")


async def test_non_gemini_transient_retried():
    """Generic connection errors are also treated as transient."""
    attempts = []
    async def fn():
        attempts.append(1)
        if len(attempts) == 1:
            raise ConnectionError("connection reset by peer")
        return "recovered"
    result = await retry_with_jitter(fn, max_attempts=1)
    assert result == "recovered"
    print("  [PASS] non_gemini_transient_retried: connection error retried")


async def main():
    tests = [
        test_success_on_first_attempt,
        test_transient_error_retried_once,
        test_permanent_error_not_retried,
        test_max_attempts_respected,
        test_non_gemini_transient_retried,
    ]
    passed = 0
    for t in tests:
        try:
            await t()
            passed += 1
        except Exception as e:
            print(f"  [FAIL] {t.__name__}: {e}")
    print(f"\n{passed}/{len(tests)} retry tests passed")


if __name__ == "__main__":
    asyncio.run(main())
