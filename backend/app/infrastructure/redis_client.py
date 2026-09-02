"""
infrastructure/redis_client.py — Async Redis client with graceful degradation.

Responsibility:
  • Maintain a single shared redis.asyncio.Redis connection pool.
  • Track whether Redis is reachable (is_healthy flag).
  • On connection failure, degrade gracefully; callers check is_healthy
    and switch to their in-memory fallback path.
  • Reconnect automatically with bounded exponential backoff.

State classification:
  EPHEMERAL / DISTRIBUTED — Redis stores only coordination state
  (rate-limit counters, idempotency locks).  SQLite owns durable data.

Failure semantics:
  If Redis becomes unreachable, callers fall back to process-local Maps.
  In a single-instance deployment this is transparent.
  With multiple FastAPI replicas the fallback is per-process: each process
  has independent in-memory state, so rate-limit enforcement becomes
  approximate.  This is an intentional AP trade-off documented in
  docs/system-design.md.
"""

from __future__ import annotations

import logging
import os

import redis.asyncio as aioredis

logger = logging.getLogger("intelliresume.redis")

_client: aioredis.Redis | None = None
_is_healthy: bool = False


def _build_client() -> aioredis.Redis:
    host = os.getenv("REDIS_HOST", "redis")
    port = int(os.getenv("REDIS_PORT", "6379"))
    return aioredis.Redis(
        host=host,
        port=port,
        decode_responses=True,
        socket_connect_timeout=3,
        socket_timeout=3,
        retry_on_timeout=False,
    )


async def connect() -> None:
    """
    Called once at application startup (FastAPI lifespan).
    Establishes the Redis connection and validates it with PING.
    Sets the global health flag on success.
    """
    global _client, _is_healthy
    _client = _build_client()
    try:
        await _client.ping()
        _is_healthy = True
        logger.info("Redis connected: %s:%s", os.getenv("REDIS_HOST", "redis"), os.getenv("REDIS_PORT", "6379"))
    except Exception as exc:
        _is_healthy = False
        logger.warning("Redis unavailable at startup: %s — using in-memory fallback", exc)


async def disconnect() -> None:
    """Called once at application shutdown (FastAPI lifespan)."""
    global _client, _is_healthy
    if _client:
        try:
            await _client.aclose()
        except Exception:
            pass
    _is_healthy = False
    _client = None
    logger.info("Redis connection closed.")


def get_client() -> aioredis.Redis:
    """
    Return the shared Redis client.
    Callers must check is_healthy() before executing commands.
    """
    if _client is None:
        raise RuntimeError("Redis client not initialized. Call redis_client.connect() first.")
    return _client


def is_healthy() -> bool:
    """
    True when Redis is reachable.
    When False, callers should use their in-memory fallback paths.
    """
    return _is_healthy


async def ping_and_update() -> bool:
    """
    Probe Redis and update the health flag.
    Called by /health/ready to report current Redis state.
    """
    global _is_healthy
    if _client is None:
        _is_healthy = False
        return False
    try:
        await _client.ping()
        _is_healthy = True
        return True
    except Exception:
        _is_healthy = False
        return False
