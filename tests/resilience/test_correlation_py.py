"""
tests/resilience/test_correlation_py.py

Unit tests for CorrelationMiddleware:
Proves: header sanitization, injection prevention, UUID fallback, contextvar propagation.
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "backend"))

from app.core.correlation import _sanitize, get_request_id, request_id_var


def test_valid_uuid_accepted():
    uid = "123e4567-e89b-12d3-a456-426614174000"
    assert _sanitize(uid) == uid


def test_alphanumeric_with_dashes_accepted():
    req_id = "req-abc-123_456.789"
    assert _sanitize(req_id) == req_id


def test_newline_injection_rejected():
    injected = "req-123\nInjected-Header: evil"
    sanitized = _sanitize(injected)
    # Must generate a fresh UUID, rejecting the newline
    assert "\n" not in sanitized
    assert len(sanitized) == 36  # UUID length


def test_carriage_return_injection_rejected():
    injected = "req-123\r\nSet-Cookie: session=hijacked"
    sanitized = _sanitize(injected)
    assert "\r" not in sanitized
    assert "\n" not in sanitized
    assert len(sanitized) == 36


def test_oversized_header_rejected():
    oversized = "a" * 200
    sanitized = _sanitize(oversized)
    assert len(sanitized) == 36  # rejected and replaced with UUID


def test_empty_string_generates_uuid():
    sanitized = _sanitize("")
    assert len(sanitized) == 36


def test_contextvar_propagation():
    request_id_var.set("test-ctx-id-123")
    assert get_request_id() == "test-ctx-id-123"


if __name__ == "__main__":
    tests = [
        test_valid_uuid_accepted,
        test_alphanumeric_with_dashes_accepted,
        test_newline_injection_rejected,
        test_carriage_return_injection_rejected,
        test_oversized_header_rejected,
        test_empty_string_generates_uuid,
        test_contextvar_propagation,
    ]
    passed = 0
    for t in tests:
        try:
            t()
            print(f"  [PASS] {t.__name__}")
            passed += 1
        except Exception as e:
            print(f"  [FAIL] {t.__name__}: {e}")
    print(f"\n{passed}/{len(tests)} correlation tests passed")
