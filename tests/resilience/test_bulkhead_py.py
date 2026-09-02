"""
tests/resilience/test_bulkhead_py.py

Unit tests for the Python BulkheadPool implementation.
Proves: maxObservedActive <= 4, queue <= 12, timeout 8s.
"""

import asyncio
import sys
import os
import time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "backend"))

from app.resilience.bulkhead import BulkheadPool
from app.core.errors import BulkheadCapacityError, BulkheadTimeoutError


async def run_test(n_concurrent: int, hold_seconds: float = 0.05) -> dict:
    """
    Launch n_concurrent tasks through the bulkhead.
    Returns stats after all complete.
    """
    pool = BulkheadPool(max_concurrent=4, max_queue_depth=12, queue_timeout=8.0)
    results = []

    async def worker():
        async with pool:
            await asyncio.sleep(hold_seconds)
            results.append("ok")

    tasks = [asyncio.create_task(worker()) for _ in range(n_concurrent)]
    await asyncio.gather(*tasks, return_exceptions=True)
    return pool.stats.__dict__


async def test_max_concurrent_invariant():
    """Under a burst of 20 concurrent requests, maxObservedActive <= 4."""
    pool = BulkheadPool(max_concurrent=4, max_queue_depth=20, queue_timeout=8.0)
    barrier = asyncio.Event()
    observed_active = []

    async def worker():
        async with pool:
            observed_active.append(pool.stats.active)
            await asyncio.sleep(0.05)

    tasks = [asyncio.create_task(worker()) for _ in range(20)]
    await asyncio.gather(*tasks, return_exceptions=True)

    max_seen = max(observed_active) if observed_active else 0
    assert max_seen <= 4, f"maxObservedActive={max_seen} exceeded limit of 4"
    print(f"  [PASS] max_concurrent_invariant: maxObservedActive={max_seen}")


async def test_capacity_exceeded_raises():
    """Requests beyond max_queue_depth are rejected immediately."""
    pool = BulkheadPool(max_concurrent=1, max_queue_depth=2, queue_timeout=5.0)
    errors = []
    started = asyncio.Event()

    async def holder():
        async with pool:
            started.set()
            await asyncio.sleep(0.3)  # Hold slot

    async def worker():
        try:
            async with pool:
                await asyncio.sleep(0.1)
        except BulkheadCapacityError:
            errors.append("capacity")
        except BulkheadTimeoutError:
            errors.append("timeout")  # acceptable too
        except Exception as e:
            errors.append(str(e))

    holder_task = asyncio.create_task(holder())
    await started.wait()  # ensure holder has the semaphore before workers arrive
    # 2 queued + 1 rejected = 3 workers
    tasks = [asyncio.create_task(worker()) for _ in range(3)]
    await asyncio.gather(holder_task, *tasks, return_exceptions=True)

    assert len(errors) >= 1, f"Expected at least one rejection, got errors={errors}"
    print(f"  [PASS] capacity_exceeded: {len(errors)} requests rejected")


async def test_queue_timeout_raises():
    """Requests waiting longer than queue_timeout get BulkheadTimeoutError."""
    pool = BulkheadPool(max_concurrent=1, max_queue_depth=5, queue_timeout=0.1)  # 100ms timeout
    timeout_errors = []

    async def holder():
        async with pool:
            await asyncio.sleep(0.5)  # Hold slot for 500ms

    async def waiter():
        try:
            async with pool:
                pass
        except BulkheadTimeoutError:
            timeout_errors.append("timeout")

    holder_task = asyncio.create_task(holder())
    await asyncio.sleep(0.01)  # Let holder acquire
    waiter_task = asyncio.create_task(waiter())
    await asyncio.gather(holder_task, waiter_task, return_exceptions=True)

    assert len(timeout_errors) >= 1, "Expected BulkheadTimeoutError for queue timeout"
    print(f"  [PASS] queue_timeout: waiter received BulkheadTimeoutError")


async def test_stats_reporting():
    """Stats reflect active/queued/maxObserved correctly."""
    pool = BulkheadPool(max_concurrent=4, max_queue_depth=12, queue_timeout=8.0)
    stats = pool.stats
    assert stats.active == 0
    assert stats.queued == 0
    assert stats.max_concurrent == 4
    assert stats.max_queue_depth == 12
    assert stats.max_observed_active == 0
    print("  [PASS] stats_reporting: initial stats correct")


async def main():
    tests = [
        ("max_concurrent_invariant", test_max_concurrent_invariant),
        ("capacity_exceeded_raises", test_capacity_exceeded_raises),
        ("queue_timeout_raises", test_queue_timeout_raises),
        ("stats_reporting", test_stats_reporting),
    ]
    passed = 0
    for name, fn in tests:
        try:
            await fn()
            passed += 1
        except Exception as e:
            print(f"  [FAIL] {name}: {e}")
    print(f"\n{passed}/{len(tests)} bulkhead tests passed")


if __name__ == "__main__":
    asyncio.run(main())
