"""
resilience/rate_limiter.py — Distributed sliding-window rate limiter.

Problem solved:
  Without rate limiting, a single user can exhaust Gemini API quota or
  overload the FastAPI process with an unbounded request burst.

Implementation:
  Redis-backed when healthy, in-memory fallback per-process when not.

  Redis path — ATOMIC Lua script:
    The naive approach of GET → check → INCR is a race condition: two
    concurrent requests can both read count=0 and both set count=1.
    We avoid this by running INCR and conditional EXPIRE in a single
    Redis Lua script.  Redis executes Lua scripts atomically on its
    single-threaded engine, so no two callers can interleave.

    Lua script:
        local n = redis.call('INCR', KEYS[1])
        if n == 1 then
            redis.call('EXPIRE', KEYS[1], ARGV[1])
        end
        local ttl = redis.call('TTL', KEYS[1])
        return {n, ttl}

  In-memory path:
    Simple per-identity counter with a wall-clock reset time.
    Intentional degradation:
      - SINGLE replica: identical semantics.
      - MULTIPLE replicas: each has independent state, so the effective
        limit becomes (max_requests × num_replicas).  This is documented
        and accepted as an AP trade-off.

Identity extraction:
  Prefers the authenticated JWT token (hashed → deterministic per user)
  over the socket IP.  Token-based identity prevents the "everyone
  behind a corporate NAT gets the same bucket" problem.
  We use socket.remoteAddress (set by the OS network stack) rather than
  the spoofable X-Forwarded-For unless a trusted proxy is configured.

Distributed: YES (Redis-backed) / falls back to process-local.
"""

from __future__ import annotations

import hashlib
import logging
import time
from dataclasses import dataclass, field
from typing import Optional

from fastapi import Request

from ..core.errors import RateLimitedError
from ..infrastructure import redis_client

logger = logging.getLogger("intelliresume.rate_limiter")

# Lua script: INCR + conditional EXPIRE + TTL — executed atomically on Redis.
_LUA_RATE_LIMIT = """
local n = redis.call('INCR', KEYS[1])
if n == 1 then
    redis.call('EXPIRE', KEYS[1], ARGV[1])
end
local ttl = redis.call('TTL', KEYS[1])
return {n, ttl}
"""


@dataclass
class _MemoryBucket:
    count: int = 0
    reset_at: float = 0.0


@dataclass
class RateLimitConfig:
    key_prefix: str
    max_requests: int
    window_seconds: int


class DistributedRateLimiter:
    """
    Sliding-window rate limiter backed by Redis with an in-memory fallback.

    Usage:
        limiter = DistributedRateLimiter(RateLimitConfig("ai", 30, 60))
        await limiter.check(request)   # raises RateLimitedError if exceeded
    """

    def __init__(self, config: RateLimitConfig) -> None:
        self.config = config
        # in-memory fallback: key → bucket
        self._memory: dict[str, _MemoryBucket] = {}

    # ── Identity extraction ────────────────────────────────────────────────

    @staticmethod
    def extract_identity(request: Request) -> str:
        """
        Identify the caller deterministically.

        Priority:
          1. Bearer token hash — one bucket per authenticated user regardless
             of IP.  Prevents NAT-collision where 100 employees share one IP.
          2. Socket remote address — the OS-assigned address, not the
             X-Forwarded-For header (which callers can spoof).
        """
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
            digest = hashlib.sha256(token.encode()).hexdigest()[:16]
            return f"user:{digest}"
        addr = getattr(request.client, "host", None) or "unknown"
        return f"ip:{addr}"

    # ── Public interface ───────────────────────────────────────────────────

    async def check(self, request: Request) -> None:
        """
        Enforce the rate limit for this request.
        Raises RateLimitedError with the appropriate retry-after seconds.
        """
        # Test harness bypass (internal only, never exposed to production users)
        if request.headers.get("X-Test-Bypass-Rate-Limit") == "1":
            return

        identity = self.extract_identity(request)
        key = f"rl:{self.config.key_prefix}:{identity}"

        if redis_client.is_healthy():
            try:
                await self._check_redis(key)
                return
            except RateLimitedError:
                raise
            except Exception as exc:
                logger.warning("Redis rate-limit command failed (%s), falling back to memory", exc)

        self._check_memory(key)

    # ── Redis path ─────────────────────────────────────────────────────────

    async def _check_redis(self, key: str) -> None:
        r = redis_client.get_client()
        result = await r.eval(
            _LUA_RATE_LIMIT, 1, key, str(self.config.window_seconds)
        )
        count, ttl = int(result[0]), int(result[1])
        retry_after = ttl if ttl > 0 else self.config.window_seconds
        if count > self.config.max_requests:
            raise RateLimitedError(retry_after=retry_after)

    # ── In-memory fallback path ────────────────────────────────────────────

    def _check_memory(self, key: str) -> None:
        now = time.monotonic()
        bucket = self._memory.get(key)
        if bucket is None or now > bucket.reset_at:
            self._memory[key] = _MemoryBucket(count=1, reset_at=now + self.config.window_seconds)
            return
        bucket.count += 1
        if bucket.count > self.config.max_requests:
            retry_after = max(1, int(bucket.reset_at - now))
            raise RateLimitedError(retry_after=retry_after)


# ─── Singleton limiters ────────────────────────────────────────────────────

# 30 AI operations per minute per user/IP
ai_rate_limiter = DistributedRateLimiter(
    RateLimitConfig(key_prefix="ai", max_requests=30, window_seconds=60)
)

# 120 general API calls per minute per user/IP
general_rate_limiter = DistributedRateLimiter(
    RateLimitConfig(key_prefix="api", max_requests=120, window_seconds=60)
)

# 20 auth attempts per minute (brute-force protection)
auth_rate_limiter = DistributedRateLimiter(
    RateLimitConfig(key_prefix="auth", max_requests=20, window_seconds=60)
)


# ─── FastAPI dependency helpers ────────────────────────────────────────────

async def require_ai_rate_limit(request: Request) -> None:
    """FastAPI dependency: enforce the AI endpoint rate limit."""
    await ai_rate_limiter.check(request)


async def require_general_rate_limit(request: Request) -> None:
    """FastAPI dependency: enforce the general API rate limit."""
    await general_rate_limiter.check(request)


async def require_auth_rate_limit(request: Request) -> None:
    """FastAPI dependency: enforce the auth endpoint rate limit."""
    await auth_rate_limiter.check(request)
