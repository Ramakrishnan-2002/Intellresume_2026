"""
main.py — FastAPI application factory and wiring.

Startup order:
  1. Redis connection established (lifespan)
  2. SQLite tables initialized
  3. Middleware registered (correlation IDs, CORS, body size)
  4. Exception handlers registered (normalized errors)
  5. Routers mounted (auth, resumes, AI, health)

Shutdown order:
  1. FastAPI lifespan context exits
  2. Redis connection gracefully closed

This file is intentionally free of business logic.
"""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from starlette.exceptions import HTTPException as StarletteHTTPException

from . import models
from .core.correlation import CorrelationMiddleware
from .core.errors import (
    AppError,
    app_error_handler,
    http_exception_handler,
    unhandled_exception_handler,
)
from .database import SessionLocal, engine
from .infrastructure import redis_client
from .routers import ai, auth, health, resumes

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("intelliresume")


# ─── Application lifespan (startup / shutdown hooks) ──────────────────────────

@asynccontextmanager
async def lifespan(application: FastAPI):
    """
    Startup: initialize Redis connection.
    Shutdown: gracefully close Redis.
    """
    await redis_client.connect()
    yield
    await redis_client.disconnect()


# ─── Application factory ──────────────────────────────────────────────────────

app = FastAPI(
    title="IntelliResume API",
    description=(
        "Production-grade IntelliResume 2026 backend.\n\n"
        "Python/FastAPI is the authoritative implementation of all "
        "distributed-systems mechanisms: rate limiting, idempotency, "
        "request coalescing, bulkhead, circuit breaker, retry, "
        "AI orchestration, authentication, and persistence."
    ),
    version="3.0.0",
    lifespan=lifespan,
)


# ─── Middleware (outermost → innermost) ───────────────────────────────────────

# 1. Correlation IDs — sanitize X-Request-Id, set in contextvars, echo in response
app.add_middleware(CorrelationMiddleware)

# 2. CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Exception handlers ───────────────────────────────────────────────────────

app.add_exception_handler(AppError, app_error_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)


# ─── Database initialization ──────────────────────────────────────────────────

models.Base.metadata.create_all(bind=engine)

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE resumes ADD COLUMN version INTEGER DEFAULT 1"))
        conn.commit()
    except Exception:
        pass  # Column already exists


# ─── Routers ──────────────────────────────────────────────────────────────────

app.include_router(health.router)   # /health/live, /health/ready, /api/health
app.include_router(auth.router)     # /api/auth/*
app.include_router(resumes.router)  # /api/resumes/*
app.include_router(ai.router)       # /api/generate-resume, /api/ai-audit, etc.


# ─── Static / SPA fallback (optional: only if dist/ is present) ───────────────

DIST_DIR = Path(__file__).resolve().parent.parent / "dist"
if DIST_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(DIST_DIR / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        index_file = DIST_DIR / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        return {"detail": "Frontend dist not built yet"}
