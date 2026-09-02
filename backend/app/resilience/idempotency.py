"""
resilience/idempotency.py — Distributed idempotency manager.

Problem solved:
  Without idempotency, a client that retries a request (due to network
  timeout, etc.) causes the underlying operation to execute twice.  For
  expensive Gemini calls this wastes quota; for mutations it risks
  duplicate state changes.

State machine:
  ABSENT      → acquire lock (SET NX EX) → IN_PROGRESS
  IN_PROGRESS → concurrent caller sees 409 IDEMPOTENCY_IN_PROGRESS
  COMPLETED   → cached result returned (IDEMPOTENT-HIT), skipping re-execution

Atomicity:
  `SET key value EX 60 NX` is executed by the Redis server in a single
  atomic operation.  Exactly one concurrent caller receives "OK" (lock
  acquired); all others receive None.  This eliminates the GET→CHECK→SET
  race condition where two callers both read ABSENT and both proceed.

Payload fingerprint:
  The key is bound to a SHA-256 hash of (method + path + body).
  Reusing the same key with a different payload returns 422
  IDEMPOTENCY_PAYLOAD_MISMATCH, preventing stale cache poisoning.

Crash / TTL recovery:
  IN_PROGRESS locks have a 60-second TTL.  If the process crashes mid-
  request, the lock self-evicts and future requests succeed after 60s.

Response size cap (64 KB):
  We cap stored responses at 64 KB to prevent large Gemini outputs from
  causing Redis memory pressure or eviction storms.  Responses exceeding
  the cap are not cached; the lock is released so retries re-execute.

Distributed: YES (Redis-backed) / falls back to process-local dict.
"""

from __future__ import annotations

import hashlib
import json
import logging
import time
from dataclasses import dataclass
from enum import Enum
from typing import Any, Optional, Tuple

from fastapi import Request
from fastapi.responses import JSONResponse

from ..core.errors import IdempotencyInProgressError, IdempotencyMismatchError
from ..infrastructure import redis_client

logger = logging.getLogger("intelliresume.idempotency")

_IN_PROGRESS_TTL = 60        # seconds — lock expiry on crash
_COMPLETED_TTL   = 86_400    # 24 hours — cached response retention
_MAX_RESPONSE_BYTES = 65_536 # 64 KB — max Redis cached response size


class IdempotencyStatus(str, Enum):
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED   = "COMPLETED"


@dataclass
class _MemoryRecord:
    status: IdempotencyStatus
    fingerprint: str
    body: Optional[Any]
    expires_at: float  # monotonic seconds


def _fingerprint(method: str, path: str, body: dict | str) -> str:
    raw = f"{method}:{path}:{json.dumps(body, sort_keys=True) if isinstance(body, dict) else body}"
    return hashlib.sha256(raw.encode()).hexdigest()


class IdempotencyManager:
    """
    Manages idempotent request execution.

    Usage in a route handler:

        manager = IdempotencyManager()

        result = await manager.check(request)
        if result is not None:
            return result   # cached / in-progress response

        try:
            data = ... expensive work ...
            await manager.store_success(request, data)
            return JSONResponse(data)
        except Exception:
            await manager.clear(request)
            raise
    """

    def __init__(self) -> None:
        self._memory: dict[str, _MemoryRecord] = {}

    # ── Key helpers ────────────────────────────────────────────────────────

    @staticmethod
    def _redis_key(idempotency_key: str) -> str:
        return f"idemp:{idempotency_key}"

    @staticmethod
    def _get_key(request: Request) -> Optional[str]:
        """Return the Idempotency-Key header, or None if absent/inapplicable."""
        if request.method not in ("POST", "PUT", "PATCH"):
            return None
        return request.headers.get("Idempotency-Key") or request.headers.get("idempotency-key")

    # ── Public interface ───────────────────────────────────────────────────

    async def check(
        self,
        request: Request,
        body: Any,
    ) -> Optional[JSONResponse]:
        """
        Phase 1 of idempotency: check / acquire.

        Returns:
          None         — caller should execute the underlying operation.
          JSONResponse — caller should return this response immediately
                         (either an in-progress 409 or a cached 200).
        """
        idempotency_key = self._get_key(request)
        if not idempotency_key:
            return None

        redis_key = self._redis_key(idempotency_key)
        fp = _fingerprint(request.method, str(request.url.path), body)

        if redis_client.is_healthy():
            return await self._check_redis(redis_key, fp)
        return self._check_memory(redis_key, fp)

    async def store_success(
        self,
        request: Request,
        body: Any,
        response_data: Any,
    ) -> None:
        """
        Phase 2: after a successful execution, cache the result so that
        future retries return the same response without re-running.
        """
        idempotency_key = self._get_key(request)
        if not idempotency_key:
            return

        redis_key = self._redis_key(idempotency_key)
        body_obj = body if isinstance(body, dict) else {}
        fp = _fingerprint(request.method, str(request.url.path), body_obj)
        record = {
            "status": IdempotencyStatus.COMPLETED,
            "fingerprint": fp,
            "body": response_data,
        }
        serialized = json.dumps(record)

        if len(serialized.encode()) > _MAX_RESPONSE_BYTES:
            # Response too large to cache safely — release lock instead
            logger.info("Idempotency response too large (%d bytes) — skipping Redis cache", len(serialized.encode()))
            await self.clear(request)
            return

        if redis_client.is_healthy():
            try:
                await redis_client.get_client().set(
                    redis_key, serialized, ex=_COMPLETED_TTL
                )
            except Exception as exc:
                logger.warning("Failed to store idempotency result: %s", exc)
        else:
            self._memory[redis_key] = _MemoryRecord(
                status=IdempotencyStatus.COMPLETED,
                fingerprint=fp,
                body=response_data,
                expires_at=time.monotonic() + _COMPLETED_TTL,
            )

    async def clear(self, request: Request) -> None:
        """Release an IN_PROGRESS lock (on error or oversized response)."""
        idempotency_key = self._get_key(request)
        if not idempotency_key:
            return
        redis_key = self._redis_key(idempotency_key)
        if redis_client.is_healthy():
            try:
                await redis_client.get_client().delete(redis_key)
            except Exception:
                pass
        else:
            self._memory.pop(redis_key, None)

    # ── Redis path ─────────────────────────────────────────────────────────

    async def _check_redis(self, redis_key: str, fp: str) -> Optional[JSONResponse]:
        r = redis_client.get_client()
        in_progress_value = json.dumps({
            "status": IdempotencyStatus.IN_PROGRESS,
            "fingerprint": fp,
        })

        try:
            # Atomic acquisition: only one concurrent caller receives "OK"
            acquired = await r.set(redis_key, in_progress_value, ex=_IN_PROGRESS_TTL, nx=True)

            if acquired:
                return None  # This caller won the lock; proceed

            # Someone else holds the lock — read their state
            existing_raw = await r.get(redis_key)
            if not existing_raw:
                return None  # Key expired between our SET and GET — proceed

            existing = json.loads(existing_raw)
            return self._evaluate_existing(existing, fp)

        except (IdempotencyInProgressError, IdempotencyMismatchError):
            raise
        except Exception as exc:
            logger.warning("Redis idempotency check failed: %s — skipping", exc)
            return None

    # ── In-memory fallback path ────────────────────────────────────────────

    def _check_memory(self, redis_key: str, fp: str) -> Optional[JSONResponse]:
        now = time.monotonic()
        existing = self._memory.get(redis_key)

        if existing is None or now > existing.expires_at:
            self._memory[redis_key] = _MemoryRecord(
                status=IdempotencyStatus.IN_PROGRESS,
                fingerprint=fp,
                body=None,
                expires_at=now + _IN_PROGRESS_TTL,
            )
            return None

        return self._evaluate_existing(
            {"status": existing.status, "fingerprint": existing.fingerprint, "body": existing.body},
            fp,
        )

    # ── State evaluation ───────────────────────────────────────────────────

    @staticmethod
    def _evaluate_existing(existing: dict, current_fp: str) -> Optional[JSONResponse]:
        status = existing.get("status")
        stored_fp = existing.get("fingerprint")

        if status == IdempotencyStatus.IN_PROGRESS:
            raise IdempotencyInProgressError()

        if status == IdempotencyStatus.COMPLETED:
            if stored_fp and stored_fp != current_fp:
                raise IdempotencyMismatchError()
            response = JSONResponse(content=existing.get("body"))
            response.headers["X-Cache"] = "IDEMPOTENT-HIT"
            return response

        return None


# Module-level singleton
idempotency_manager = IdempotencyManager()
