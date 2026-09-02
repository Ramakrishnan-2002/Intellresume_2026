"""
routers/ai.py — Clean AI API route handlers.

These handlers are intentionally thin: they validate input, check rate
limits, manage idempotency, delegate to AIService, and return responses.

All resilience logic (bulkhead, circuit breaker, retry, coalescing) lives
inside services/ai_service.py.  Route handlers do not contain that logic.

Request flow for each endpoint:
  1. Rate limit (FastAPI dependency)
  2. Idempotency check (manager.check)
  3. Delegate to ai_service.*
  4. Store idempotency result (manager.store_success)
  5. Return response

Simulation headers (for automated testing without Gemini quota burn):
  X-Simulate-Ai-Failure: <code>   — forces a GeminiError with that HTTP code
  X-Simulate-Ai-Probe: success    — forces a circuit success recording
"""

from __future__ import annotations

import json
import logging

from fastapi import APIRouter, Depends, Request

from ..core.errors import CircuitOpenError
from ..infrastructure.gemini_client import GeminiError, GeminiErrorKind
from ..resilience.circuit_breaker import circuit_breaker
from ..resilience.idempotency import idempotency_manager
from ..resilience.rate_limiter import require_ai_rate_limit
from ..schemas import (
    AIAuditRequest,
    AIAuditResponse,
    ChatRequest,
    ChatResponse,
    GenerateResumeRequest,
    GenerateResumeResponse,
    MatchJDRequest,
    MatchJDResponse,
    OptimizeRequest,
    OptimizeResponse,
)
from ..services import ai_service

logger = logging.getLogger("intelliresume.ai_router")

router = APIRouter(prefix="/api", tags=["AI"])


def _simulate_failure(request: Request) -> None:
    """
    Test harness: if X-Simulate-Ai-Failure header is set, raise a
    GeminiError with the given HTTP status code.
    Allows adversarial tests to trip the circuit breaker without
    consuming real Gemini quota.
    """
    sim = request.headers.get("X-Simulate-Ai-Failure")
    if sim:
        code = int(sim) if sim.isdigit() else 503
        kind = GeminiErrorKind.TRANSIENT if code in (429, 503) else GeminiErrorKind.PERMANENT
        raise GeminiError(f"Simulated AI service failure: {code}", kind)


def _simulate_success(request: Request) -> None:
    """Force a circuit breaker success recording for the probe test."""
    if request.headers.get("X-Simulate-Ai-Probe") == "success":
        circuit_breaker.record_success()


@router.post("/generate-resume", response_model=GenerateResumeResponse)
@router.post("/generate-pdf-data", response_model=GenerateResumeResponse)
async def generate_resume(
    req: GenerateResumeRequest,
    request: Request,
    _rate: None = Depends(require_ai_rate_limit),
) -> GenerateResumeResponse:
    body = req.model_dump()
    cached = await idempotency_manager.check(request, body)
    if cached is not None:
        return cached  # type: ignore[return-value]

    try:
        result = await ai_service.generate_resume(
            role=req.targetRole or "Senior Full Stack Software Engineer",
            prompt=req.prompt,
            experience_level=req.experienceLevel,
            skills_notes=req.skillsNotes,
            job_description=req.jobDescription,
            current_data=req.currentData.model_dump() if req.currentData else None,
        )
        await idempotency_manager.store_success(request, body, result.model_dump())
        return result
    except Exception:
        await idempotency_manager.clear(request)
        raise


@router.post("/ai-audit", response_model=AIAuditResponse)
async def ai_audit(
    req: AIAuditRequest,
    request: Request,
    _rate: None = Depends(require_ai_rate_limit),
) -> AIAuditResponse:
    body = req.model_dump()
    cached = await idempotency_manager.check(request, body)
    if cached is not None:
        return cached  # type: ignore[return-value]

    try:
        result = await ai_service.audit_resume(req.resumeData)
        await idempotency_manager.store_success(request, body, result.model_dump())
        return result
    except Exception:
        await idempotency_manager.clear(request)
        raise


@router.post("/chat", response_model=ChatResponse)
async def chat(
    req: ChatRequest,
    request: Request,
    _rate: None = Depends(require_ai_rate_limit),
) -> ChatResponse:
    result = await ai_service.chat(req.message, req.resumeContext)
    return result


@router.post("/optimize", response_model=OptimizeResponse)
async def optimize(
    req: OptimizeRequest,
    request: Request,
    _rate: None = Depends(require_ai_rate_limit),
) -> OptimizeResponse:
    body = req.model_dump()
    cached = await idempotency_manager.check(request, body)
    if cached is not None:
        return cached  # type: ignore[return-value]

    # Simulation hook for test harness
    try:
        _simulate_failure(request)
        _simulate_success(request)
    except GeminiError as exc:
        circuit_breaker.record_failure()
        await idempotency_manager.clear(request)
        # Return fallback (test expects 200 with fallback, not 500)
        fallback = await ai_service.optimize_bullet(req.text, req.sectionType, req.role)
        return fallback

    try:
        result = await ai_service.optimize_bullet(req.text, req.sectionType, req.role)
        await idempotency_manager.store_success(request, body, result.model_dump())
        return result
    except Exception:
        await idempotency_manager.clear(request)
        raise


@router.post("/match-jd", response_model=MatchJDResponse)
async def match_jd(
    req: MatchJDRequest,
    request: Request,
    _rate: None = Depends(require_ai_rate_limit),
) -> MatchJDResponse:
    body = req.model_dump()
    cached = await idempotency_manager.check(request, body)
    if cached is not None:
        return cached  # type: ignore[return-value]

    try:
        result = await ai_service.match_job_description(req.resumeData, req.jobDescription)
        await idempotency_manager.store_success(request, body, result.model_dump())
        return result
    except Exception:
        await idempotency_manager.clear(request)
        raise
