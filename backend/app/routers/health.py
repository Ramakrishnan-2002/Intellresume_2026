"""
routers/health.py — Health and readiness probe endpoints.

/health/live  — Liveness: is the process running? Kubernetes/Docker uses this
                to decide whether to restart the container.
/health/ready — Readiness: are dependencies healthy? Used to decide whether
                to route traffic to this instance.
/api/health   — Simple status for frontend consumption.

Circuit state is reported in /health/ready so the test harness can observe
transitions without needing to inspect internal process state.
"""

from __future__ import annotations

import time

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from ..infrastructure import redis_client
from ..infrastructure.gemini_client import gemini
from ..resilience.bulkhead import ai_bulkhead
from ..resilience.circuit_breaker import circuit_breaker

router = APIRouter(tags=["Health"])


@router.get("/health/live")
async def liveness():
    """Liveness: verifies the process is responsive."""
    return {
        "status": "alive",
        "service": "intelliresume-backend",
        "timestamp": time.time(),
    }


@router.get("/health/ready")
async def readiness():
    """
    Readiness: checks SQLite (via ORM) and Redis connectivity.
    Returns 503 if the database is unresponsive.
    Redis failure is reported but does not block readiness (graceful degradation).
    """
    from ..database import SessionLocal
    from sqlalchemy import text

    db_ok = False
    redis_ok = False

    try:
        with SessionLocal() as db:
            db.execute(text("SELECT 1"))
        db_ok = True
    except Exception as exc:
        return JSONResponse(
            status_code=503,
            content={
                "status": "unready",
                "database": f"error: {exc}",
            },
        )

    redis_ok = await redis_client.ping_and_update()
    bulkhead_stats = ai_bulkhead.stats

    return {
        "status": "ready",
        "database": "connected" if db_ok else "unhealthy",
        "redis": "connected" if redis_ok else "degraded_to_memory",
        "aiConfigured": gemini.is_configured,
        "circuitState": circuit_breaker.state,
        "bulkhead": {
            "active": bulkhead_stats.active,
            "queued": bulkhead_stats.queued,
            "maxConcurrent": bulkhead_stats.max_concurrent,
            "maxQueueDepth": bulkhead_stats.max_queue_depth,
            "maxObserved": bulkhead_stats.max_observed_active,
        },
        "timestamp": time.time(),
    }


@router.get("/api/health")
async def api_health():
    """Simple health check consumed by the frontend."""
    return {
        "status": "ok",
        "aiConfigured": gemini.is_configured,
        "circuitState": circuit_breaker.state,
    }


@router.post("/api/circuit-breaker/reset")
async def reset_circuit_breaker():
    """
    Admin / test-harness endpoint to manually reset the circuit breaker.
    Allows adversarial tests to reset state between runs.
    """
    circuit_breaker.reset()
    ai_bulkhead.reset_max_observed()
    return {"status": "reset", "circuitState": circuit_breaker.state}
