from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
import os

from . import models
from .database import engine
from .routers import auth, api

app = FastAPI(
    title="IntelliResume API",
    description="AI-powered resume generation backend for IntelliResume 2026",
    version="2.0.0",
)

# ─── CORS ───────────────────────────────────────────────
# Allow the Vite dev server (default :3000 or :5173) and production origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Database ───────────────────────────────────────────
models.Base.metadata.create_all(bind=engine)

# ─── API Routers ────────────────────────────────────────
app.include_router(auth.router)
app.include_router(api.router)

# ─── Static / SPA Fallback ──────────────────────────────
# If a `dist` folder exists (built frontend), serve it and fallback to index.html
DIST_DIR = Path(__file__).resolve().parent.parent / "dist"
if DIST_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(DIST_DIR / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # API routes are already handled by routers above
        index_file = DIST_DIR / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        return {"detail": "Frontend dist not built yet"}
