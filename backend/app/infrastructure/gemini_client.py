"""
infrastructure/gemini_client.py — Thin async wrapper around the Gemini SDK.

Responsibility:
  • Configure the SDK with the API key once at startup.
  • Provide a single async method `generate(model, prompt, **kwargs) -> str`
    that returns the raw response text.
  • Parse and re-raise upstream errors with a stable error classification
    so the resilience layer can decide whether to retry.

What this module does NOT own:
  • Rate limiting    → resilience/rate_limiter.py
  • Circuit breaking → resilience/circuit_breaker.py
  • Bulkhead         → resilience/bulkhead.py
  • Retry policy     → resilience/retry.py
  • Fallback logic   → services/ai_service.py

This separation keeps each concern independently testable.

Upstream error classification:
  TRANSIENT  — should be retried (429, 503, connection errors)
  PERMANENT  — should not be retried (400, 401, 403)
"""

from __future__ import annotations

import json
import logging
import os
import re
from enum import Enum
from typing import Any, Optional

logger = logging.getLogger("intelliresume.gemini")

# Default model used for all IntelliResume AI features
DEFAULT_MODEL = "gemini-1.5-flash"


class GeminiErrorKind(Enum):
    TRANSIENT  = "transient"   # safe to retry
    PERMANENT  = "permanent"   # do not retry
    UNKNOWN    = "unknown"


class GeminiError(Exception):
    """Wraps upstream Gemini SDK errors with a classification."""
    def __init__(self, message: str, kind: GeminiErrorKind, original: Exception | None = None):
        super().__init__(message)
        self.kind = kind
        self.original = original


def _classify_error(exc: Exception) -> GeminiErrorKind:
    msg = str(exc).lower()
    # 429 / resource_exhausted → transient (rate limited; retry with backoff)
    if "429" in msg or "resource_exhausted" in msg or "quota" in msg:
        return GeminiErrorKind.TRANSIENT
    # 503 / unavailable → transient
    if "503" in msg or "unavailable" in msg:
        return GeminiErrorKind.TRANSIENT
    # Connection errors → transient
    if "connection" in msg or "timeout" in msg or "reset" in msg:
        return GeminiErrorKind.TRANSIENT
    # Auth / bad request → permanent
    if "401" in msg or "403" in msg or "400" in msg or "invalid" in msg:
        return GeminiErrorKind.PERMANENT
    return GeminiErrorKind.UNKNOWN


def _strip_markdown_json(raw: str) -> str:
    """Remove ```json ... ``` fences that Gemini sometimes wraps around JSON."""
    stripped = raw.strip()
    stripped = re.sub(r"^```json\s*", "", stripped, flags=re.IGNORECASE)
    stripped = re.sub(r"\s*```$", "", stripped)
    return stripped.strip()


class GeminiClient:
    """
    Async-compatible Gemini client.

    Because google-generativeai's Python SDK uses synchronous I/O internally,
    calls are made synchronously but wrapped in anyio.to_thread.run_sync inside
    the AI service so the FastAPI event loop is never blocked.
    """

    def __init__(self) -> None:
        self._model_cache: dict[str, Any] = {}
        self._configured = False
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=api_key)
                self._configured = True
                self._genai = genai
                logger.info("Gemini SDK configured with provided API key.")
            except Exception as exc:
                logger.warning("Failed to configure Gemini SDK: %s", exc)
        else:
            logger.warning("GEMINI_API_KEY not set — AI features will use fallback responses.")

    @property
    def is_configured(self) -> bool:
        return self._configured

    def _get_model(self, model_name: str, system_instruction: Optional[str] = None):
        cache_key = f"{model_name}::{system_instruction or ''}"
        if cache_key not in self._model_cache:
            kwargs: dict[str, Any] = {}
            if system_instruction:
                kwargs["system_instruction"] = system_instruction
            self._model_cache[cache_key] = self._genai.GenerativeModel(model_name, **kwargs)
        return self._model_cache[cache_key]

    def generate_text(
        self,
        prompt: str,
        model: str = DEFAULT_MODEL,
        system_instruction: Optional[str] = None,
        response_mime_type: Optional[str] = None,
        temperature: Optional[float] = None,
    ) -> str:
        """
        Synchronous Gemini content generation.
        Callers in the async AI service MUST wrap this with
        anyio.to_thread.run_sync to avoid blocking the event loop.

        Returns raw response text.
        Raises GeminiError on any upstream failure.
        """
        if not self._configured:
            raise GeminiError("Gemini API key not configured.", GeminiErrorKind.PERMANENT)

        try:
            genai_model = self._get_model(model, system_instruction=system_instruction)

            generation_config: dict[str, Any] = {}
            if response_mime_type:
                generation_config["response_mime_type"] = response_mime_type
            if temperature is not None:
                generation_config["temperature"] = temperature

            kwargs: dict[str, Any] = {
                "contents": [{"role": "user", "parts": [prompt]}],
            }
            if generation_config:
                kwargs["generation_config"] = generation_config

            response = genai_model.generate_content(**kwargs)
            return response.text or ""
        except GeminiError:
            raise
        except Exception as exc:
            kind = _classify_error(exc)
            logger.warning("Gemini upstream error [%s]: %s", kind.value, exc)
            raise GeminiError(str(exc), kind, original=exc)

    def parse_json_response(self, raw: str) -> dict:
        """
        Parse the raw text response as JSON, stripping markdown fences.
        Raises ValueError if the response cannot be parsed.
        """
        try:
            return json.loads(_strip_markdown_json(raw))
        except (json.JSONDecodeError, ValueError) as exc:
            raise ValueError(f"Gemini returned non-JSON response: {raw[:200]}") from exc


# Module-level singleton — created once on import
gemini = GeminiClient()
