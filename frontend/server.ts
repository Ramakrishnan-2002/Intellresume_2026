/**
 * frontend/server.ts — Thin BFF (Backend-for-Frontend)
 *
 * RESPONSIBILITY OF THIS FILE:
 *   1. Serve the compiled React SPA (dist/) as static files.
 *   2. Handle SPA fallback routing (all unknown paths → index.html).
 *   3. Forward all /api/* and /health/* requests to the FastAPI backend.
 *   4. Propagate X-Request-Id and Idempotency-Key headers transparently.
 *   5. Provide /health/live for Docker healthchecks.
 *   6. Graceful shutdown (SIGTERM / SIGINT).
 *
 * WHAT THIS FILE MUST NOT CONTAIN:
 *   • Redis connections           → backend/app/infrastructure/redis_client.py
 *   • Gemini AI calls             → backend/app/infrastructure/gemini_client.py
 *   • Rate limiting               → backend/app/resilience/rate_limiter.py
 *   • Idempotency                 → backend/app/resilience/idempotency.py
 *   • Bulkhead                    → backend/app/resilience/bulkhead.py
 *   • Circuit breaker             → backend/app/resilience/circuit_breaker.py
 *   • Retry logic                 → backend/app/resilience/retry.py
 *   • AI orchestration            → backend/app/services/ai_service.py
 *   • Authentication decisions    → backend/app/routers/auth.py
 *   • Business logic              → backend/app/*
 *   • Persistence                 → backend/app/database.py
 *
 * Python/FastAPI is the authoritative backend.
 * Express is a transparent gateway.
 */

import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import http from "http";

dotenv.config();

const currentDir = typeof __dirname !== "undefined" ? __dirname : process.cwd();

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);
const BACKEND_URL = process.env.BACKEND_URL || "http://backend:8000";

// Allow up to 500 KB bodies (Express still parses for header forwarding;
// actual payload validation happens in FastAPI).
app.use(express.json({ limit: "500kb" }));
app.use(express.urlencoded({ extended: true, limit: "500kb" }));

// ─── 1. Liveness probe (owned by this process) ───────────────────────────────
// /health/live tells Docker whether the Node process is alive.
// /health/ready is forwarded to FastAPI, which checks DB + Redis + circuit state.
app.get("/health/live", (_req: Request, res: Response) => {
  res.json({
    status: "alive",
    service: "intelliresume-bff",
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// ─── 2. Transparent API proxy to FastAPI ─────────────────────────────────────
// Forward all /api/* and /health/ready to Python backend.
// The proxy propagates correlation IDs and authentication headers.
// It does NOT add any business logic.
async function proxyToFastAPI(req: Request, res: Response): Promise<void> {
  const targetUrl = `${BACKEND_URL}${req.originalUrl || req.url}`;

  try {
    const headers: Record<string, string> = {
      "Content-Type": req.headers["content-type"] || "application/json",
    };

    // Propagate correlation ID (FastAPI sanitizes and owns it)
    const reqId = req.headers["x-request-id"] as string | undefined;
    if (reqId) headers["X-Request-Id"] = reqId;

    // Propagate auth header (FastAPI validates JWT)
    if (req.headers.authorization) {
      headers["Authorization"] = req.headers.authorization;
    }

    // Propagate idempotency key (FastAPI owns idempotency logic)
    const idempKey =
      req.headers["idempotency-key"] || req.headers["Idempotency-Key"];
    if (idempKey) headers["Idempotency-Key"] = idempKey as string;

    // Propagate test simulation headers (for adversarial test harness)
    const simFailure = req.headers["x-simulate-ai-failure"];
    if (simFailure) headers["X-Simulate-Ai-Failure"] = simFailure as string;
    const simProbe = req.headers["x-simulate-ai-probe"];
    if (simProbe) headers["X-Simulate-Ai-Probe"] = simProbe as string;
    const bypassRL = req.headers["x-test-bypass-rate-limit"];
    if (bypassRL) headers["X-Test-Bypass-Rate-Limit"] = bypassRL as string;

    let body: string | undefined;
    if (["POST", "PUT", "PATCH"].includes(req.method)) {
      const ct = req.headers["content-type"] || "";
      body = ct.includes("application/x-www-form-urlencoded")
        ? new URLSearchParams(req.body as Record<string, string>).toString()
        : JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      signal: AbortSignal.timeout(15_000), // 15s outer timeout
    });

    // Echo correlation ID and caching headers from FastAPI response
    const responseReqId = response.headers.get("x-request-id");
    if (responseReqId) res.setHeader("X-Request-Id", responseReqId);

    const xCache = response.headers.get("x-cache");
    if (xCache) res.setHeader("X-Cache", xCache);

    // Forward all other safe headers
    response.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (lower !== "transfer-encoding" && lower !== "content-encoding" && lower !== "x-cache" && lower !== "x-request-id") {
        res.setHeader(key, value);
      }
    });

    res.status(response.status);
    const text = await response.text();
    try {
      res.json(JSON.parse(text));
    } catch {
      res.send(text);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[BFF Proxy] Failed to forward to ${targetUrl}: ${message}`);
    res.status(503).json({
      error: {
        code: "BACKEND_UNAVAILABLE",
        message: "The backend service is temporarily unreachable. Please retry shortly.",
      },
    });
  }
}

// Proxy all API and non-live health routes to FastAPI
app.all("/api/*", proxyToFastAPI);
app.all("/health/ready", proxyToFastAPI);

// ─── 3. Static SPA serving + Vite dev server ─────────────────────────────────
async function setupVite(): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    // Development: use Vite's HMR middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production: serve compiled React build
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // ─── 4. Start HTTP server ─────────────────────────────────────────────────
  const server = http.createServer(app);
  server.listen(PORT, "0.0.0.0", () => {
    console.log(
      JSON.stringify({
        event: "BFF_STARTED",
        port: PORT,
        backendUrl: BACKEND_URL,
        nodeEnv: process.env.NODE_ENV || "development",
        timestamp: new Date().toISOString(),
        note: "Thin gateway — all resilience and AI logic owned by FastAPI/Python",
      })
    );
  });

  // ─── 5. Graceful shutdown ─────────────────────────────────────────────────
  let shuttingDown = false;
  const gracefulShutdown = (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[BFF] Received ${signal}. Draining connections...`);
    server.close(() => {
      console.log("[BFF] HTTP server closed.");
      process.exit(0);
    });
    setTimeout(() => {
      console.error("[BFF] Force exit after shutdown timeout.");
      process.exit(1);
    }, 10_000).unref();
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT",  () => gracefulShutdown("SIGINT"));
}

setupVite();
