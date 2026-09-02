"""
tests/resilience/test_idempotency_py.py

Unit tests for IdempotencyManager:
Proves: fingerprint calculation, in-memory fallback, duplicate detection, payload mismatch 422.
"""

import sys
import os
import time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "backend"))

from app.resilience.idempotency import IdempotencyManager, IdempotencyStatus, _fingerprint
from app.core.errors import IdempotencyInProgressError, IdempotencyMismatchError


def test_fingerprint_deterministic():
    fp1 = _fingerprint("POST", "/api/optimize", {"text": "hello", "role": "dev"})
    fp2 = _fingerprint("POST", "/api/optimize", {"role": "dev", "text": "hello"})
    assert fp1 == fp2, "Fingerprint must be invariant to dict key ordering"


def test_fingerprint_differs_for_different_payload():
    fp1 = _fingerprint("POST", "/api/optimize", {"text": "payload 1"})
    fp2 = _fingerprint("POST", "/api/optimize", {"text": "payload 2"})
    assert fp1 != fp2


def test_in_memory_idempotency_workflow():
    manager = IdempotencyManager()
    fp_a = _fingerprint("POST", "/api/optimize", {"text": "a"})
    fp_b = _fingerprint("POST", "/api/optimize", {"text": "b"})

    # 1. Acquire in memory
    res1 = manager._check_memory("idemp:key-1", fp_a)
    assert res1 is None, "First acquisition should succeed (return None)"

    # 2. In-progress concurrent attempt should raise IdempotencyInProgressError
    try:
        manager._check_memory("idemp:key-1", fp_a)
        assert False, "Should have raised IdempotencyInProgressError"
    except IdempotencyInProgressError:
        pass

    # 3. Mark completed
    manager._memory["idemp:key-1"].status = IdempotencyStatus.COMPLETED
    manager._memory["idemp:key-1"].body = {"options": ["opt1"]}

    # 4. Same key + Same payload -> returns cached response
    res2 = manager._check_memory("idemp:key-1", fp_a)
    assert res2 is not None
    assert res2.headers.get("X-Cache") == "IDEMPOTENT-HIT"

    # 5. Same key + Different payload -> raises IdempotencyMismatchError
    try:
        manager._check_memory("idemp:key-1", fp_b)
        assert False, "Should have raised IdempotencyMismatchError"
    except IdempotencyMismatchError:
        pass


if __name__ == "__main__":
    tests = [
        test_fingerprint_deterministic,
        test_fingerprint_differs_for_different_payload,
        test_in_memory_idempotency_workflow,
    ]
    passed = 0
    for t in tests:
        try:
            t()
            print(f"  [PASS] {t.__name__}")
            passed += 1
        except Exception as e:
            print(f"  [FAIL] {t.__name__}: {e}")
    print(f"\n{passed}/{len(tests)} idempotency tests passed")
