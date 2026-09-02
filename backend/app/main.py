import time
import uuid
import os
from pathlib import Path
from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy import text

from . import models
from .database import engine, SessionLocal
from .routers import auth, api, resumes

app = FastAPI(
    title="IntelliResume API",
    description="Resilient backend for IntelliResume 2026",
    version="2.1.0",
)

# ─── Correlation ID & Structured Access Logging ──────────
@app.middleware("http")
async def correlation_id_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-Id") or str(uuid.uuid4())
    start_time = time.time()
    
    response = await call_next(request)
    
    duration_ms = round((time.time() - start_time) * 1000, 2)
    response.headers["X-Request-Id"] = request_id
    response.headers["X-Response-Time-Ms"] = str(duration_ms)
    
    return response

# ─── CORS ───────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Database Tables Initialization & Migrations ────────
models.Base.metadata.create_all(bind=engine)

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE resumes ADD COLUMN version INTEGER DEFAULT 1"))
        conn.commit()
    except Exception:
        pass  # Column already exists

# ─── Health & Readiness Probes ──────────────────────────
@app.get("/health/live", tags=["Health"])
async def liveness():
    """Liveness probe: verifies the process is responsive."""
    return {"status": "alive", "service": "intelliresume-backend", "timestamp": time.time()}

@app.get("/health/ready", tags=["Health"])
async def readiness():
    """
    Readiness probe: verifies critical dependencies (SQLite database).
    Checks if DB is responsive.
    """
    db_ok = False
    redis_ok = False
    
    # 1. Check SQLite database connectivity
    try:
        with SessionLocal() as db:
            db.execute(text("SELECT 1"))
        db_ok = True
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "unready", "database": f"error: {str(e)}"}
        )

    # 2. Check Redis (optional dependency, non-blocking)
    redis_host = os.getenv("REDIS_HOST", "redis")
    redis_port = int(os.getenv("REDIS_PORT", "6379"))
    try:
        import redis
        r = redis.Redis(host=redis_host, port=redis_port, socket_timeout=1.0)
        redis_ok = r.ping()
    except Exception:
        redis_ok = False

    return {
        "status": "ready",
        "database": "connected" if db_ok else "unhealthy",
        "redis": "connected" if redis_ok else "unavailable_or_not_used",
        "timestamp": time.time(),
    }

# ─── API Routers ────────────────────────────────────────
app.include_router(auth.router)
app.include_router(resumes.router)
app.include_router(api.router)

# ─── Static / SPA Fallback ──────────────────────────────
DIST_DIR = Path(__file__).resolve().parent.parent / "dist"
if DIST_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(DIST_DIR / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        index_file = DIST_DIR / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        return {"detail": "Frontend dist not built yet"}
