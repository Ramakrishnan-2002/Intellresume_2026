"""
tests/resilience/test_coalescing_py.py

Unit tests for RequestCoalescer:
Proves: 10 concurrent requests with same key execute underlying operation exactly ONCE.
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "backend"))

from app.resilience.coalescing import RequestCoalescer


async def test_coalesces_concurrent_identical_requests():
    """10 simultaneous calls with identical key execute the worker exactly ONCE."""
    coalescer = RequestCoalescer()
    executions = 0

    async def expensive_work():
        nonlocal executions
        executions += 1
        await asyncio.sleep(0.05)
        return {"data": "gemini_result"}

    # Launch 10 simultaneous requests
    tasks = [
        asyncio.create_task(coalescer.coalesce("same-hash-key", expensive_work))
        for _ in range(10)
    ]
    results = await asyncio.gather(*tasks)

    assert executions == 1, f"Expected exactly 1 execution, got {executions}"
    assert len(results) == 10
    assert all(r == {"data": "gemini_result"} for r in results)
    assert coalescer.active_count == 0, "Coalescer must clean up completed futures"
    print(f"  [PASS] test_coalesces_concurrent_identical_requests: 10 calls -> {executions} execution")


async def test_different_keys_execute_independently():
    """Requests with different keys execute independently."""
    coalescer = RequestCoalescer()
    executions = 0

    async def worker(idx):
        nonlocal executions
        executions += 1
        await asyncio.sleep(0.02)
        return f"result_{idx}"

    tasks = [
        asyncio.create_task(coalescer.coalesce(f"key-{i}", lambda i=i: worker(i)))
        for i in range(5)
    ]
    results = await asyncio.gather(*tasks)

    assert executions == 5, f"Expected 5 executions for 5 unique keys, got {executions}"
    assert results == [f"result_{i}" for i in range(5)]
    assert coalescer.active_count == 0
    print(f"  [PASS] test_different_keys_execute_independently: 5 unique keys -> {executions} executions")


async def test_exception_propagates_and_cleans_up():
    """If the operation fails, all waiting callers get the exception and future is cleaned up."""
    coalescer = RequestCoalescer()

    async def failing_worker():
        await asyncio.sleep(0.02)
        raise ValueError("Simulated failure")

    tasks = [
        asyncio.create_task(coalescer.coalesce("fail-key", failing_worker))
        for _ in range(3)
    ]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    assert len(results) == 3
    assert all(isinstance(r, ValueError) for r in results)
    assert coalescer.active_count == 0, "Failed operations must be cleaned up from dict"
    print("  [PASS] test_exception_propagates_and_cleans_up: errors propagate and future cleans up")


async def main():
    tests = [
        test_coalesces_concurrent_identical_requests,
        test_different_keys_execute_independently,
        test_exception_propagates_and_cleans_up,
    ]
    passed = 0
    for t in tests:
        try:
            await t()
            passed += 1
        except Exception as e:
            print(f"  [FAIL] {t.__name__}: {e}")
    print(f"\n{passed}/{len(tests)} coalescing tests passed")


if __name__ == "__main__":
    asyncio.run(main())
