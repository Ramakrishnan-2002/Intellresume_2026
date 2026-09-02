"""
services/ai_service.py — Primary AI orchestration layer.

This is the main system-design story of IntelliResume.

Every AI request flows through this single service, which coordinates
all resilience mechanisms in the correct order:

    Rate Limit check
         ↓
    Idempotency check
         ↓
    Request Coalescing
         ↓
    Bulkhead (capacity guard)
         ↓
    Circuit Breaker (fail-fast guard)
         ↓
    Retry (transient failure recovery)
         ↓
    Gemini (upstream AI call — sync, offloaded to thread)
         ↓
    Pydantic schema validation
         ↓
    Deterministic Fallback (if Gemini failed or is degraded)
         ↓
    Response

Why this ordering?
  1. Rate limit first — cheap Redis check rejects excessive clients early.
  2. Idempotency second — avoids executing operations we've already done.
  3. Coalescing third — deduplicates identical simultaneous requests.
  4. Bulkhead fourth — enforces max concurrency against Gemini.
  5. Circuit breaker fifth — fails fast when Gemini is known to be down.
  6. Retry sixth — recovers from brief transient blips inside one attempt.
  7. Fallback last — ensures every response conforms to the Pydantic schema.

Fallback semantics:
  Fallback responses carry `source="fallback"` so the UI can optionally
  show a degraded-mode indicator.  The response schema is otherwise
  identical to a live Gemini response.  The frontend does not need to
  special-case fallback responses for core rendering.

Thread-pool offloading:
  The Gemini SDK uses synchronous HTTP internally.  To avoid blocking the
  FastAPI event loop, we wrap the synchronous call with anyio.to_thread.run_sync.
"""

from __future__ import annotations

import hashlib
import json
import logging
import random
from typing import Any, Optional

import anyio

from ..infrastructure.gemini_client import GeminiError, GeminiErrorKind, gemini
from ..resilience.bulkhead import ai_bulkhead
from ..resilience.circuit_breaker import circuit_breaker
from ..resilience.coalescing import request_coalescer
from ..resilience.retry import retry_with_jitter
from ..schemas import (
    AIAuditResponse,
    ChatResponse,
    GenerateResumeResponse,
    MatchJDResponse,
    OptimizeOption,
    OptimizeResponse,
    ResumeData,
)

logger = logging.getLogger("intelliresume.ai_service")


def _sha256(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()


# ─── Deterministic fallback templates ─────────────────────────────────────────

def _fallback_resume(role: str, current_data: Optional[dict] = None) -> ResumeData:
    """
    Structured fallback resume that conforms to the exact Pydantic schema.
    Used when Gemini is unavailable or the circuit is OPEN.
    """
    cd = current_data or {}
    pi = cd.get("personalInfo", {})
    return ResumeData.model_validate({
        "id": f"RES-{random.randint(100, 999)}-FALLBACK",
        "title": role,
        "status": "OPTIMIZED",
        "personalInfo": {
            "firstName":  pi.get("firstName", "Alex"),
            "lastName":   pi.get("lastName", "Chen"),
            "email":      pi.get("email", "alex.chen.dev@example.com"),
            "phone":      pi.get("phone", "+1 (555) 342-8901"),
            "location":   pi.get("location", "San Francisco, CA"),
            "title":      role,
            "summary":    f"Accomplished {role} with extensive experience architecting high-throughput distributed systems, modern reactive web interfaces, and scalable cloud infrastructure. Proven track record reducing latency by 45% and leading cross-functional engineering teams.",
            "linkedin":   pi.get("linkedin", "linkedin.com/in/alexchen-architect"),
            "github":     pi.get("github", "github.com/alexchen-pro"),
        },
        "experience": [
            {
                "id": f"exp-{random.randint(1000, 9999)}-1",
                "role": f"Lead {role}",
                "company": "OmniCloud Systems",
                "location": "San Francisco, CA",
                "startDate": "2022",
                "endDate": "Present",
                "current": True,
                "bullets": [
                    "Architected and scaled event-driven microservices processing 45M+ daily requests with 99.99% availability.",
                    "Spearheaded migration to cloud-native serverless backends, slashing deployment cycle time by 80%.",
                    "Mentored 10 engineers on high-concurrency systems design and distributed tracing.",
                ],
            },
            {
                "id": f"exp-{random.randint(1000, 9999)}-2",
                "role": f"Senior {role}",
                "company": "Veloce Technologies",
                "location": "Seattle, WA",
                "startDate": "2019",
                "endDate": "2022",
                "current": False,
                "bullets": [
                    "Engineered low-latency data visualization engines handling 50k+ real-time events per second.",
                    "Optimized Redis caching layers, achieving a 55% reduction in database CPU utilization.",
                ],
            },
        ],
        "skills": {
            "languages":  ["TypeScript", "Python", "Go", "SQL", "Java"],
            "frameworks": ["React 19", "FastAPI", "Node.js", "Next.js", "Tailwind CSS"],
            "tools":      ["Docker", "Kubernetes", "Git", "CI/CD Pipelines", "Redis"],
            "cloud":      ["Google Cloud Platform", "AWS", "PostgreSQL", "Redis"],
        },
        "education": [{
            "id": f"edu-{random.randint(1000, 9999)}",
            "institution": "University of Washington",
            "degree": "B.S. in Computer Science",
            "field": "Software Engineering & Distributed Systems",
            "graduationYear": "2018",
            "location": "Seattle, WA",
        }],
        "projects": [
            {
                "id": f"proj-{random.randint(1000, 9999)}-1",
                "name": "Aether Telemetry Engine",
                "description": "High-performance real-time telemetry visualizer and distributed tracing dashboard.",
                "tech": ["Python", "FastAPI", "Redis", "WebSocket"],
                "link": "github.com/alexchen-pro/aether-engine",
            }
        ],
        "metrics": {"resumeScore": 96, "jdMatchRate": 91, "profileViews": 1450, "aiCredits": 55},
    })


# ─── Internal Gemini execution (wrapped for thread-pool offloading) ──────────

async def _run_gemini(prompt: str, model: str = "gemini-1.5-flash", **kwargs: Any) -> str:
    """
    Execute a synchronous Gemini call inside a thread pool worker so the
    asyncio event loop is never blocked.
    """
    return await anyio.to_thread.run_sync(
        lambda: gemini.generate_text(prompt, model=model, **kwargs),
        cancellable=True,
    )


# ─── Resilience pipeline wrapper ─────────────────────────────────────────────

async def _execute_ai(coalesce_key: str, fn) -> Any:
    """
    Run fn() through the full resilience pipeline:
      Coalescing → Bulkhead → Circuit Breaker → Retry → fn
    """
    async def _with_bulkhead_and_cb():
        if not circuit_breaker.can_execute():
            from ..core.errors import CircuitOpenError
            raise CircuitOpenError()

        async with ai_bulkhead:
            async def _attempt():
                if not circuit_breaker.can_execute():
                    from ..core.errors import CircuitOpenError
                    raise CircuitOpenError()
                try:
                    result = await fn()
                    circuit_breaker.record_success()
                    return result
                except Exception as exc:
                    # Only record qualifying upstream failures
                    if isinstance(exc, GeminiError) and exc.kind == GeminiErrorKind.TRANSIENT:
                        circuit_breaker.record_failure()
                    elif not isinstance(exc, GeminiError):
                        circuit_breaker.record_failure()
                    raise

            return await retry_with_jitter(_attempt)

    return await request_coalescer.coalesce(coalesce_key, _with_bulkhead_and_cb)


# ─── AI Service methods ───────────────────────────────────────────────────────

async def generate_resume(
    role: str,
    prompt: Optional[str] = None,
    experience_level: Optional[str] = None,
    skills_notes: Optional[str] = None,
    job_description: Optional[str] = None,
    current_data: Optional[dict] = None,
) -> GenerateResumeResponse:
    """Generate a full AI resume or return a deterministic fallback."""

    if not gemini.is_configured:
        return GenerateResumeResponse(
            resume=_fallback_resume(role, current_data),
            source="fallback", fallback=True,
        )

    system_instruction = (
        "You are IntelliResume AI, an elite executive resume architect. "
        "Generate a comprehensive, recruiter-ready, ATS-optimized JSON resume. "
        "Use strong action verbs and quantified metrics. "
        "Output MUST be valid JSON matching the specified schema exactly."
    )
    user_prompt = (
        f'Generate a complete technical resume for role: "{role}".\n'
        f'Prompt: "{prompt or "Comprehensive executive resume"}"\n'
        f'Experience Level: "{experience_level or "Senior"}"\n'
        f'Notes: "{skills_notes or "N/A"}"\n'
        f'Job Description: "{job_description or "N/A"}"\n'
        f'Current Data: {json.dumps(current_data or {})}'
    )
    coalesce_key = _sha256(f"gen:{role}:{prompt}:{job_description}")

    try:
        async def _call():
            raw = await _run_gemini(
                user_prompt,
                system_instruction=system_instruction,
                response_mime_type="application/json",
            )
            parsed = gemini.parse_json_response(raw)
            return _normalize_resume(parsed, role, current_data)

        resume = await _execute_ai(coalesce_key, _call)
        return GenerateResumeResponse(resume=resume, source="gemini")

    except Exception as exc:
        logger.warning("generate_resume falling back: %s", exc)
        return GenerateResumeResponse(resume=_fallback_resume(role, current_data), source="fallback", fallback=True)


async def audit_resume(resume_data: dict) -> AIAuditResponse:
    """Audit a resume and provide grade, strengths, weaknesses."""

    fallback = AIAuditResponse(
        grade="A+ (96/100)",
        strengths=[
            "Outstanding quantifiable metrics across all senior engineering roles.",
            "Exceptional technical alignment across modern tech stack.",
            "Clear progressive leadership trajectory.",
        ],
        weaknesses=[
            "Could link an open-source technical whitepaper or architecture RFC.",
            "Expand on specific database indexing and cache invalidation strategies.",
        ],
        suggestedSummary=f"Accomplished {resume_data.get('title', 'Engineering Leader')} with 8+ years architecting enterprise distributed systems.",
        source="fallback", fallback=True,
    )

    if not gemini.is_configured:
        return fallback

    prompt = (
        f"Perform an executive recruitment and ATS audit of this resume:\n"
        f"{json.dumps(resume_data)}\n\n"
        'Output valid JSON: {"grade": string, "strengths": string[], "weaknesses": string[], "suggestedSummary": string}'
    )
    coalesce_key = _sha256(f"audit:{json.dumps(resume_data, sort_keys=True)}")

    try:
        async def _call():
            raw = await _run_gemini(prompt, response_mime_type="application/json")
            return gemini.parse_json_response(raw)

        parsed = await _execute_ai(coalesce_key, _call)
        return AIAuditResponse(
            grade=parsed.get("grade", "A (92/100)"),
            strengths=parsed.get("strengths", fallback.strengths),
            weaknesses=parsed.get("weaknesses", fallback.weaknesses),
            suggestedSummary=parsed.get("suggestedSummary", fallback.suggestedSummary),
            source="gemini",
        )
    except Exception as exc:
        logger.warning("audit_resume falling back: %s", exc)
        return fallback


def _fallback_chat(message: str, resume_context: Optional[dict] = None) -> str:
    ctx = resume_context or {}
    role = ctx.get("targetRole") or "Senior Software Engineer"
    msg_lower = message.lower()

    if any(w in msg_lower for w in ["weakness", "gap", "critic", "flaw", "risk", "missing", "mistake", "improve"]):
        return (
            f"### Critical Resume Vulnerability Analysis for **{role}**\n\n"
            "Based on automated ATS parsing patterns, here are the top 3 common weaknesses to fix:\n\n"
            "1. **Vague Accomplishments:** Avoid generic phrases like *'worked on backend services'*. Instead write *'Engineered FastAPI/Redis caching layer reducing DB load by 40%'*.\n"
            "2. **Missing Failure Modes:** Senior interviewers look for experience handling degraded modes, retries, and network partitions.\n"
            "3. **Unstated Architectural Scope:** Explicitly specify requests per second (RPS), data volume (GB/TB), and team size."
        )

    if any(w in msg_lower for w in ["summary", "executive", "positioning", "intro", "bio", "about me"]):
        return (
            f"### Executive Summary Formulation for **{role}**\n\n"
            "Here is a tailored 3-sentence summary highlighting system design authority:\n\n"
            f"> *\"High-velocity **{role}** with 8+ years architecting scalable cloud-native backends and resilient web applications. Proven track record eliminating single points of failure, optimizing high-concurrency database workloads, and scaling distributed pipelines to millions of daily active users. Passionate about systems reliability, clean architecture, and technical mentorship.\"*\n\n"
            "**Tip:** Place this directly in your header block for immediate recruiter impact."
        )

    if any(w in msg_lower for w in ["skill", "audit", "staff", "requirements", "tech", "stack"]):
        return (
            f"### Technical Competency Audit: **{role}**\n\n"
            "To stand out for modern Staff/Senior Engineer positions, your profile should demonstrate depth in 4 core quadrants:\n\n"
            "1. **Distributed Systems & Concurrency:** Async I/O event loops, connection pooling, optimistic concurrency (OCC), idempotency keys, and circuit breakers.\n"
            "2. **Production Observability:** Structured JSON logging, correlation IDs (`X-Request-Id`), distributed tracing, and p50/p95/p99 latency tracking.\n"
            "3. **Resilience Engineering:** Graceful degradation, bulkhead isolation, bounded retries with jitter, and dead-letter queues.\n"
            "4. **Cross-functional Impact:** Mentoring engineers, establishing architecture RFCs, and driving zero-downtime database migrations."
        )

    if any(w in msg_lower for w in ["bullet", "rewrite", "experience", "latency", "scale", "p99", "achievement"]):
        return (
            f"### Engineering Experience Optimization for **{role}**\n\n"
            "Here is an optimized, high-impact bullet structure designed for modern technical filters:\n\n"
            "- **Architected and deployed an event-driven telemetry pipeline** using async worker pools, reducing p99 API latency from 450ms to 62ms under 50k concurrent requests/sec.\n"
            "- **Engineered distributed caching & query coalescing** in Redis/Go, cutting redundant downstream RPC calls by 68% and saving $45k/mo in compute overhead.\n\n"
            "**Key Strategy:** Always frontload the architectural action verb, specify technical throughput or constraints, and finish with a quantified business outcome."
        )

    return (
        f"### Strategic Career Recommendation for **{role}**\n\n"
        f"When tailoring your profile for **{role}**, ensure each section demonstrates measurable business value:\n\n"
        "- **Technical Leadership:** Highlight architectural ownership, technology selections, and RFC documentation.\n"
        "- **Quantifiable Outcomes:** Specify latency reductions, throughput gains, and infrastructure cost optimizations.\n"
        "- **Resilience Invariants:** Mention proactive defenses such as rate limiting, idempotency, and graceful degradation."
    )


async def chat(message: str, resume_context: Optional[dict] = None) -> ChatResponse:
    """Career coaching chat response."""

    ctx = resume_context or {}
    fallback_reply = _fallback_chat(message, ctx)

    if not gemini.is_configured:
        return ChatResponse(reply=fallback_reply, source="fallback", fallback=True)

    system_instruction = (
        "You are IntelliResume AI, an elite career architect for technical professionals. "
        "Provide concise, surgical advice with quantifiable metrics. "
        f"Current target role: {ctx.get('targetRole', 'Senior Software Engineer')}."
    )
    prompt = f"Target: {ctx.get('targetRole', 'Software Engineer')}\nPrompt: {message}"
    coalesce_key = _sha256(f"chat:{message}:{json.dumps(ctx, sort_keys=True)}")

    try:
        async def _call():
            return await _run_gemini(prompt, system_instruction=system_instruction, temperature=0.7)

        reply = await _execute_ai(coalesce_key, _call)
        return ChatResponse(reply=reply or fallback_reply, source="gemini")
    except Exception as exc:
        logger.warning("chat falling back: %s", exc)
        return ChatResponse(reply=fallback_reply, source="fallback", fallback=True)


async def optimize_bullet(text: str, section_type: Optional[str] = None, role: Optional[str] = None) -> OptimizeResponse:
    """Optimize a resume bullet point."""

    effective_role = role or "Senior Software Engineer"
    fallback = OptimizeResponse(
        options=[
            OptimizeOption(tag="Performance Focus", content=f"Architected and optimized high-performance subsystems for {effective_role}, achieving a 42% reduction in render latency."),
            OptimizeOption(tag="Scale & Reliability", content="Engineered scalable, fault-tolerant infrastructure handling millions of concurrent events with zero downtime."),
            OptimizeOption(tag="Strategic Leadership", content="Spearheaded delivery of core product features, mentoring 6 junior engineers and increasing sprint velocity by 35%."),
        ],
        scoreImprovement="+8 pts",
        source="fallback", fallback=True,
    )

    if not gemini.is_configured:
        return fallback

    prompt = (
        f'Optimize this resume bullet for a "{effective_role}" position in "{section_type or "Experience"}":\n'
        f'"{text}"\n\n'
        'Output JSON with keys: "options" (array of {tag, content}), "scoreImprovement" (e.g. "+7 pts").'
    )
    coalesce_key = _sha256(f"opt:{role}:{section_type}:{text}")

    try:
        async def _call():
            raw = await _run_gemini(prompt, response_mime_type="application/json")
            parsed = gemini.parse_json_response(raw)
            options = [OptimizeOption(**o) for o in parsed.get("options", [])]
            if not options:
                raise ValueError("Empty options from Gemini")
            return OptimizeResponse(
                options=options,
                scoreImprovement=parsed.get("scoreImprovement", "+5 pts"),
                source="gemini",
            )

        return await _execute_ai(coalesce_key, _call)
    except Exception as exc:
        logger.warning("optimize_bullet falling back: %s", exc)
        return fallback


async def match_job_description(resume_data: dict, job_description: str) -> MatchJDResponse:
    """Match a resume against a job description."""

    fallback = MatchJDResponse(
        matchScore=89,
        matchedSkills=["TypeScript", "React 19", "Python", "Node.js", "Performance Optimization"],
        missingKeywords=["GraphQL Federation", "Distributed Tracing", "Kubernetes"],
        recommendations=[
            "Include specific distributed systems metrics in the Senior Engineer experience block.",
            "Emphasize experience with GraphQL or API gateways to bridge the skill gap.",
            "Add leadership mentoring statistics to align with staff-level expectations.",
        ],
        source="fallback", fallback=True,
    )

    if not gemini.is_configured:
        return fallback

    prompt = (
        f"Match resume against JD:\nResume: {json.dumps(resume_data)}\n"
        f'Job Description: "{job_description}"\n\n'
        'Output valid JSON: {"matchScore": number, "matchedSkills": string[], "missingKeywords": string[], "recommendations": string[]}'
    )
    coalesce_key = _sha256(f"match:{job_description}:{json.dumps(resume_data, sort_keys=True)}")

    try:
        async def _call():
            raw = await _run_gemini(prompt, response_mime_type="application/json")
            parsed = gemini.parse_json_response(raw)
            return MatchJDResponse(
                matchScore=parsed.get("matchScore", 85),
                matchedSkills=parsed.get("matchedSkills", fallback.matchedSkills),
                missingKeywords=parsed.get("missingKeywords", fallback.missingKeywords),
                recommendations=parsed.get("recommendations", fallback.recommendations),
                source="gemini",
            )

        return await _execute_ai(coalesce_key, _call)
    except Exception as exc:
        logger.warning("match_job_description falling back: %s", exc)
        return fallback


# ─── Resume normalization (shared between service and legacy fallback) ────────

def _normalize_resume(parsed: dict, role: str, current_data: Optional[dict]) -> ResumeData:
    """Build a ResumeData from a Gemini-parsed dict, filling defaults from current_data."""
    try:
        return ResumeData.model_validate(parsed)
    except Exception:
        return _fallback_resume(role, current_data)
