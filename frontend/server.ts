import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import Redis from "ioredis";
import crypto from "crypto";
import http from "http";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);
const BACKEND_URL = process.env.BACKEND_URL || "http://backend:8000";

// Payload size defense: strictly limit to 500KB to prevent memory exhaustion
app.use(express.json({ limit: "500kb" }));
app.use(express.urlencoded({ extended: true, limit: "500kb" }));

// ─── 1. Correlation ID Middleware & Structured Logging ──────────
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = (req.headers["x-request-id"] as string) || crypto.randomUUID();
  req.headers["x-request-id"] = requestId;
  res.setHeader("X-Request-Id", requestId);

  const startTime = Date.now();
  res.on("finish", () => {
    const durationMs = Date.now() - startTime;
    // Structured JSON log (production observability)
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        requestId,
        method: req.method,
        path: req.originalUrl || req.url,
        status: res.statusCode,
        durationMs,
        ip: req.ip || req.socket.remoteAddress,
        circuitState: circuitBreaker.state,
      })
    );
  });
  next();
});

// ─── 2. Redis Client with Resilient Graceful Degradation ────────
const REDIS_HOST = process.env.REDIS_HOST || "redis";
const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379", 10);

let isRedisHealthy = false;
const redis = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: 1,
  connectTimeout: 3000,
  enableOfflineQueue: false,
  retryStrategy(times) {
    // Bounded exponential backoff with jitter for Redis reconnection
    const delay = Math.min(times * 200 + Math.random() * 100, 3000);
    return delay;
  },
});

redis.on("connect", () => {
  isRedisHealthy = true;
  console.log(`[Redis] Connected to redis://${REDIS_HOST}:${REDIS_PORT}`);
});

redis.on("ready", () => {
  isRedisHealthy = true;
});

redis.on("error", (err) => {
  if (isRedisHealthy) {
    console.warn(`[Redis] Connection degraded: ${err.message}. Falling back to in-memory coordination.`);
  }
  isRedisHealthy = false;
});

redis.on("close", () => {
  isRedisHealthy = false;
});

// In-memory fallback stores for rate limiting and idempotency if Redis fails
const memoryRateLimits = new Map<string, { count: number; resetTime: number }>();
const memoryIdempotency = new Map<string, { status: "IN_PROGRESS" | "COMPLETED"; body?: any; expiresAt: number }>();

// ─── 3. Distributed Rate Limiter (Redis + In-Memory Fallback) ───
interface RateLimitConfig {
  windowSeconds: number;
  maxRequests: number;
  keyPrefix: string;
}

function createRateLimiter(config: RateLimitConfig) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const key = `rl:${config.keyPrefix}:${ip}`;

    if (isRedisHealthy) {
      try {
        const current = await redis.incr(key);
        if (current === 1) {
          await redis.expire(key, config.windowSeconds);
        }
        if (current > config.maxRequests) {
          const ttl = await redis.ttl(key);
          res.setHeader("Retry-After", ttl > 0 ? ttl : config.windowSeconds);
          return res.status(429).json({
            error: "RATE_LIMITED",
            message: `Too many requests on ${config.keyPrefix}. Please slow down.`,
            retryAfterSeconds: ttl > 0 ? ttl : config.windowSeconds,
          });
        }
        return next();
      } catch (e) {
        // Fall through to memory rate limiter if Redis command fails
      }
    }

    // Fallback: In-memory sliding rate limiter
    const now = Date.now();
    const record = memoryRateLimits.get(key);
    if (!record || now > record.resetTime) {
      memoryRateLimits.set(key, { count: 1, resetTime: now + config.windowSeconds * 1000 });
      return next();
    }

    record.count++;
    if (record.count > config.maxRequests) {
      const waitSec = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader("Retry-After", waitSec);
      return res.status(429).json({
        error: "RATE_LIMITED",
        message: `Too many requests on ${config.keyPrefix}. Please slow down.`,
        retryAfterSeconds: waitSec,
      });
    }

    return next();
  };
}

const aiRateLimiter = createRateLimiter({
  keyPrefix: "ai",
  windowSeconds: 60,
  maxRequests: 30, // 30 AI requests per minute per IP
});

const generalRateLimiter = createRateLimiter({
  keyPrefix: "api",
  windowSeconds: 60,
  maxRequests: 120, // 120 general requests per minute
});

app.use("/api/", generalRateLimiter);
app.use(["/api/generate-resume", "/api/generate-pdf-data", "/api/ai-audit", "/api/chat", "/api/optimize", "/api/match-jd"], aiRateLimiter);

// ─── 4. Distributed Idempotency Middleware ──────────────────────
async function idempotencyMiddleware(req: Request, res: Response, next: NextFunction) {
  const idempotencyKey = req.headers["idempotency-key"] as string;
  if (!idempotencyKey || req.method !== "POST") {
    return next();
  }

  const key = `idemp:${idempotencyKey}`;

  if (isRedisHealthy) {
    try {
      const existing = await redis.get(key);
      if (existing) {
        const parsed = JSON.parse(existing);
        if (parsed.status === "IN_PROGRESS") {
          return res.status(409).json({
            error: "IDEMPOTENCY_IN_PROGRESS",
            message: "A request with this Idempotency-Key is currently being processed.",
          });
        }
        if (parsed.status === "COMPLETED") {
          res.setHeader("X-Cache", "IDEMPOTENT-HIT");
          return res.status(200).json(parsed.body);
        }
      }

      // Mark IN_PROGRESS with 60s lock TTL
      await redis.set(key, JSON.stringify({ status: "IN_PROGRESS", timestamp: Date.now() }), "EX", 60);
    } catch (e) {
      // Degrade to in-memory
    }
  } else {
    // In-memory fallback
    const existing = memoryIdempotency.get(key);
    if (existing && Date.now() < existing.expiresAt) {
      if (existing.status === "IN_PROGRESS") {
        return res.status(409).json({
          error: "IDEMPOTENCY_IN_PROGRESS",
          message: "A request with this Idempotency-Key is currently being processed.",
        });
      }
      if (existing.status === "COMPLETED") {
        res.setHeader("X-Cache", "IDEMPOTENT-HIT");
        return res.status(200).json(existing.body);
      }
    }
    memoryIdempotency.set(key, { status: "IN_PROGRESS", expiresAt: Date.now() + 60000 });
  }

  // Intercept response to record result
  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      if (isRedisHealthy) {
        redis.set(key, JSON.stringify({ status: "COMPLETED", body }), "EX", 86400).catch(() => {});
      } else {
        memoryIdempotency.set(key, { status: "COMPLETED", body, expiresAt: Date.now() + 86400000 });
      }
    } else {
      // Clear key on error to allow retry
      if (isRedisHealthy) {
        redis.del(key).catch(() => {});
      } else {
        memoryIdempotency.delete(key);
      }
    }
    return originalJson(body);
  };

  next();
}

app.use(idempotencyMiddleware);

// ─── 5. Request Coalescing (In-Flight Deduplication) ────────────
const inFlightRequests = new Map<string, Promise<any>>();

async function coalesceRequest<T>(cacheKey: string, fn: () => Promise<T>): Promise<T> {
  const existing = inFlightRequests.get(cacheKey);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = fn().finally(() => {
    inFlightRequests.delete(cacheKey);
  });

  inFlightRequests.set(cacheKey, promise);
  return promise;
}

// ─── 6. Bulkhead Concurrency Pool & Circuit Breaker ─────────────
class BulkheadLimiter {
  private active = 0;
  private queue: Array<() => void> = [];

  constructor(
    private maxConcurrent: number = 4,
    private maxQueueDepth: number = 12
  ) {}

  async run<T>(task: () => Promise<T>): Promise<T> {
    if (this.active >= this.maxConcurrent) {
      if (this.queue.length >= this.maxQueueDepth) {
        const err: any = new Error("AI processing pipeline is at peak capacity. Please retry shortly.");
        err.status = 503;
        err.code = "AI_CAPACITY_EXCEEDED";
        throw err;
      }
      await new Promise<void>((resolve) => this.queue.push(resolve));
    }

    this.active++;
    try {
      return await task();
    } finally {
      this.active--;
      if (this.queue.length > 0) {
        const next = this.queue.shift();
        if (next) next();
      }
    }
  }

  get stats() {
    return { active: this.active, queued: this.queue.length };
  }
}

const aiBulkhead = new BulkheadLimiter(4, 12);

class CircuitBreaker {
  state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";
  private failureCount = 0;
  private lastFailureTime = 0;

  constructor(
    private failureThreshold = 5,
    private resetTimeoutMs = 30000
  ) {}

  recordSuccess() {
    this.failureCount = 0;
    this.state = "CLOSED";
  }

  recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.failureThreshold) {
      this.state = "OPEN";
      console.warn(`[CircuitBreaker] Tripped to OPEN! Failing fast for next ${this.resetTimeoutMs / 1000}s.`);
    }
  }

  canExecute(): boolean {
    if (this.state === "CLOSED") return true;
    if (this.state === "OPEN") {
      if (Date.now() - this.lastFailureTime > this.resetTimeoutMs) {
        this.state = "HALF_OPEN";
        console.log("[CircuitBreaker] Transitioned to HALF_OPEN trial probe.");
        return true;
      }
      return false;
    }
    return true; // HALF_OPEN allows trial probe
  }
}

const circuitBreaker = new CircuitBreaker(5, 30000);

// Bounded exponential backoff with jitter
async function retryWithJitter<T>(fn: () => Promise<T>, maxAttempts = 2): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err: any) {
      attempt++;
      const isRetryable =
        err.status === 429 ||
        err.status === 503 ||
        err.code === "ECONNRESET" ||
        err.message?.includes("429") ||
        err.message?.includes("Resource exhausted");

      if (attempt > maxAttempts || !isRetryable) {
        throw err;
      }

      const backoff = 500 * Math.pow(2, attempt) + Math.random() * 200;
      console.log(`[Retry] Attempt ${attempt} failed with ${err.message}. Retrying in ${Math.round(backoff)}ms...`);
      await new Promise((resolve) => setTimeout(resolve, backoff));
    }
  }
}

// ─── 7. Gemini AI Client ─────────────────────────────────────────
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "intelliresume-bff/2.1",
        },
      },
    });
  }
  return aiClient;
}

// Fallback deterministic templates when Gemini is unconfigured or degraded
function getFallbackResume(role: string, currentData: any = {}) {
  return {
    id: `RES-${Math.floor(100 + Math.random() * 900)}-DETERMINISTIC`,
    title: role,
    status: "OPTIMIZED",
    personalInfo: {
      firstName: currentData?.personalInfo?.firstName || "Alex",
      lastName: currentData?.personalInfo?.lastName || "Chen",
      email: currentData?.personalInfo?.email || "alex.chen.dev@example.com",
      phone: currentData?.personalInfo?.phone || "+1 (555) 342-8901",
      location: currentData?.personalInfo?.location || "San Francisco, CA",
      title: role,
      summary: `Accomplished ${role} with extensive experience architecting high-throughput distributed systems, modern reactive web interfaces, and scalable cloud infrastructures. Proven track record reducing latency by 45% and leading cross-functional engineering squads.`,
      linkedin: currentData?.personalInfo?.linkedin || "linkedin.com/in/alexchen-architect",
      github: currentData?.personalInfo?.github || "github.com/alexchen-pro",
    },
    experience: [
      {
        id: `exp-${Date.now()}-1`,
        role: `Lead ${role}`,
        company: "OmniCloud Systems",
        location: "San Francisco, CA",
        startDate: "2022",
        endDate: "Present",
        current: true,
        bullets: [
          "Architected and scaled event-driven microservices processing 45M+ daily requests with 99.99% availability.",
          "Spearheaded migration to modern TypeScript, React 19, and cloud-native serverless backends, slashing payload sizes by 40%.",
          "Automated distributed CI/CD delivery pipelines, cutting feature deployment release cycles from 2 weeks to 30 minutes.",
          "Mentored 10+ engineers on high-concurrency systems design, telemetry instrumentation, and code quality standards.",
        ],
      },
      {
        id: `exp-${Date.now()}-2`,
        role: `Senior ${role}`,
        company: "Veloce Technologies",
        location: "Seattle, WA",
        startDate: "2019",
        endDate: "2022",
        current: false,
        bullets: [
          "Engineered low-latency data visualization engines handling 50k+ real-time telemetry events per second.",
          "Optimized PostgreSQL and Redis caching layers, resulting in a 55% reduction in database CPU utilization.",
          "Designed and published a comprehensive company-wide UI component library with 100% test coverage.",
        ],
      },
    ],
    skills: {
      languages: ["TypeScript", "JavaScript (ES2024)", "Go", "Python", "SQL"],
      frameworks: ["React 19", "Node.js", "Express", "Next.js", "Tailwind CSS", "Three.js"],
      tools: ["Docker", "Kubernetes", "Git", "Vite", "CI/CD Pipelines", "Jest/Playwright"],
      cloud: ["Google Cloud Platform", "AWS", "PostgreSQL", "Redis", "Kafka"],
    },
    education: [
      {
        id: `edu-${Date.now()}`,
        institution: "University of Washington",
        degree: "B.S. in Computer Science",
        field: "Software Engineering & Distributed Systems",
        graduationYear: "2018",
        location: "Seattle, WA",
      },
    ],
    projects: [
      {
        id: `proj-${Date.now()}-1`,
        name: "Aether Telemetry Engine",
        description: "High-performance real-time telemetry visualizer and distributed tracing dashboard.",
        tech: ["TypeScript", "WebGL", "Node.js", "Redis"],
        link: "github.com/alexchen-pro/aether-engine",
      },
      {
        id: `proj-${Date.now()}-2`,
        name: "CloudScale Micro-Gateway",
        description: "Ultra-fast API gateway and request routing proxy with sub-millisecond overhead.",
        tech: ["Go", "Docker", "GCP", "PostgreSQL"],
        link: "cloudscale-gateway.io",
      },
    ],
    metrics: {
      resumeScore: 96,
      jdMatchRate: 91,
      profileViews: 1450,
      aiCredits: 55,
    },
  };
}

// ─── 8. Health & Readiness Probes ────────────────────────────────
app.get("/health/live", (req, res) => {
  res.json({
    status: "alive",
    service: "intelliresume-bff",
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.get("/health/ready", async (req, res) => {
  let backendOk = false;
  try {
    const beReq = await fetch(`${BACKEND_URL}/health/live`, { signal: AbortSignal.timeout(2000) });
    backendOk = beReq.ok;
  } catch {
    backendOk = false;
  }

  const isReady = backendOk;
  const statusCode = isReady ? 200 : 503;

  res.status(statusCode).json({
    status: isReady ? "ready" : "degraded",
    redis: isRedisHealthy ? "connected" : "degraded_to_memory",
    backend: backendOk ? "connected" : "unreachable",
    aiConfigured: !!process.env.GEMINI_API_KEY,
    circuitState: circuitBreaker.state,
    bulkhead: aiBulkhead.stats,
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    aiConfigured: !!process.env.GEMINI_API_KEY,
    circuitState: circuitBreaker.state,
  });
});

// ─── 9. Proxy to FastAPI for Auth & Resumes Persistence ──────────
async function proxyToFastAPI(req: Request, res: Response) {
  const targetUrl = `${BACKEND_URL}${req.originalUrl || req.url}`;
  const requestId = req.headers["x-request-id"] as string;

  try {
    const contentType = req.headers["content-type"] || "application/json";
    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "X-Request-Id": requestId,
    };
    if (req.headers.authorization) {
      headers["Authorization"] = req.headers.authorization;
    }

    let bodyData: any = undefined;
    if (["POST", "PUT", "PATCH"].includes(req.method)) {
      if (contentType.includes("application/x-www-form-urlencoded")) {
        bodyData = new URLSearchParams(req.body as any).toString();
      } else {
        bodyData = JSON.stringify(req.body);
      }
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: bodyData,
      signal: AbortSignal.timeout(10000),
    });

    res.status(response.status);
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== "transfer-encoding") {
        res.setHeader(key, value);
      }
    });

    const data = await response.text();
    try {
      res.send(JSON.parse(data));
    } catch {
      res.send(data);
    }
  } catch (err: any) {
    console.error(`[ProxyError] Failed to forward to ${targetUrl}:`, err.message);
    res.status(503).json({
      error: "BACKEND_UNAVAILABLE",
      message: "The backend service is temporarily unreachable. Please retry shortly.",
    });
  }
}

app.all("/api/auth/*", proxyToFastAPI);
app.all("/api/resumes*", proxyToFastAPI);

// ─── 10. Hardened AI Endpoints with Bulkhead & Circuit Breaker ───

// AI Resume Generator
app.post(["/api/generate-resume", "/api/generate-pdf-data"], async (req, res) => {
  const { prompt, targetRole, experienceLevel, skillsNotes, jobDescription, currentData } = req.body;
  const role = targetRole || "Senior Full Stack Software Engineer";
  const ai = getAI();

  if (!ai || !circuitBreaker.canExecute()) {
    return res.json({
      resume: getFallbackResume(role, currentData),
      fallback: true,
      reason: !ai ? "AI_NOT_CONFIGURED" : "CIRCUIT_BREAKER_OPEN",
    });
  }

  // Deduplicate identical in-flight generation requests
  const hashKey = crypto
    .createHash("sha256")
    .update(`gen:${role}:${prompt}:${jobDescription}`)
    .digest("hex");

  try {
    const resume = await coalesceRequest(hashKey, async () => {
      return aiBulkhead.run(async () => {
        return retryWithJitter(async () => {
          const systemInstruction = `You are IntelliResume AI, an elite executive resume architect and career intelligence system.
Generate a comprehensive, recruiter-ready, ATS-optimized JSON resume conforming EXACTLY to the requested schema.
Ensure high-impact bullet points starting with strong action verbs and realistic, impressive quantified metrics.`;

          const userPrompt = `Generate a complete, top-tier technical resume for role: "${role}".
User Prompt: "${prompt || "Generate an executive resume with impact metrics"}"
Experience Level: "${experienceLevel || "Senior"}"
Notes: "${skillsNotes || "N/A"}"
Job Description: "${jobDescription || "N/A"}"
Current Data: ${JSON.stringify(currentData || {})}`;

          const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: userPrompt,
            config: {
              systemInstruction,
              responseMimeType: "application/json",
            },
          });

          const rawText = (response.text || "{}").trim();
          const cleanJson = rawText.replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
          const parsed = JSON.parse(cleanJson);
          circuitBreaker.recordSuccess();

          return {
            id: parsed.id || `RES-${Math.floor(100 + Math.random() * 900)}-AI`,
            title: parsed.title || role,
            status: "OPTIMIZED",
            personalInfo: parsed.personalInfo || getFallbackResume(role, currentData).personalInfo,
            experience: Array.isArray(parsed.experience) && parsed.experience.length > 0 ? parsed.experience : getFallbackResume(role, currentData).experience,
            skills: parsed.skills || getFallbackResume(role, currentData).skills,
            education: Array.isArray(parsed.education) && parsed.education.length > 0 ? parsed.education : getFallbackResume(role, currentData).education,
            projects: Array.isArray(parsed.projects) && parsed.projects.length > 0 ? parsed.projects : getFallbackResume(role, currentData).projects,
            metrics: parsed.metrics || { resumeScore: 95, jdMatchRate: 90, profileViews: 1200, aiCredits: 50 },
          };
        });
      });
    });

    res.json({ resume });
  } catch (error: any) {
    circuitBreaker.recordFailure();
    console.error("[AI Generator Error]", error.message);
    // Graceful degradation: return deterministic structured template rather than failing client
    res.json({
      resume: getFallbackResume(role, currentData),
      fallback: true,
      reason: error.code || "AI_REQUEST_FAILED",
    });
  }
});

// AI Executive Resume Audit
app.post("/api/ai-audit", async (req, res) => {
  const { resumeData } = req.body;
  const ai = getAI();

  const fallbackAudit = {
    grade: "A+ (96/100)",
    strengths: [
      "Outstanding quantifiable metrics across all senior engineering roles (45M+ events, 60% latency reduction, 99.99% SLA).",
      "Exceptional technical alignment across modern tech stack (React 19, TypeScript, Cloud).",
      "Clear progressive leadership trajectory from Engineer to Principal Architect.",
    ],
    weaknesses: [
      "Could link an open-source technical whitepaper or architecture RFC.",
      "Expand on specific database indexing and cache invalidation strategies.",
    ],
    suggestedSummary: `Accomplished ${resumeData?.title || "Engineering Leader"} with 8+ years architecting enterprise distributed systems and real-time interfaces serving 1.4M+ daily active users. Proven track record reducing latency by 45% and leading high-velocity squads.`,
  };

  if (!ai || !circuitBreaker.canExecute()) {
    return res.json({ ...fallbackAudit, fallback: true });
  }

  const hashKey = crypto
    .createHash("sha256")
    .update(`audit:${JSON.stringify(resumeData)}`)
    .digest("hex");

  try {
    const result = await coalesceRequest(hashKey, async () => {
      return aiBulkhead.run(async () => {
        return retryWithJitter(async () => {
          const prompt = `Perform an executive recruitment and ATS audit of this resume:
${JSON.stringify(resumeData)}

Output valid JSON:
{
  "grade": string,
  "strengths": string[],
  "weaknesses": string[],
  "suggestedSummary": string
}`;

          const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: prompt,
            config: { responseMimeType: "application/json" },
          });

          const raw = (response.text || "{}").trim().replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
          circuitBreaker.recordSuccess();
          return JSON.parse(raw);
        });
      });
    });

    res.json(result);
  } catch (error: any) {
    circuitBreaker.recordFailure();
    console.error("[AI Audit Error]", error.message);
    res.json({ ...fallbackAudit, fallback: true });
  }
});

// AI Chat
app.post("/api/chat", async (req, res) => {
  const { message, resumeContext } = req.body;
  const ai = getAI();

  const fallbackReply =
    "Lead with a strong action verb, specify technical constraints, and quantify the business outcome (e.g. latency, throughput, cost savings).";

  if (!ai || !circuitBreaker.canExecute()) {
    return res.json({ reply: fallbackReply, fallback: true });
  }

  try {
    const reply = await aiBulkhead.run(async () => {
      return retryWithJitter(async () => {
        const systemInstruction = `You are IntelliResume AI, an elite career architect for technical professionals. Provide concise, surgical advice with quantifiable metrics.`;
        const response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: `Target: ${resumeContext?.targetRole || "Software Engineer"}\nPrompt: ${message}`,
          config: { systemInstruction, temperature: 0.7 },
        });
        circuitBreaker.recordSuccess();
        return response.text || fallbackReply;
      });
    });

    res.json({ reply });
  } catch (error: any) {
    circuitBreaker.recordFailure();
    console.error("[AI Chat Error]", error.message);
    res.json({ reply: fallbackReply, fallback: true });
  }
});

// AI Optimize Bullet Point / Section
app.post("/api/optimize", async (req, res) => {
  const { text, sectionType, role } = req.body;
  const ai = getAI();

  const fallbackOptions = {
    options: [
      {
        tag: "Performance Focus",
        content: `Architected and optimized high-performance subsystems for ${role || "Cloud Platforms"}, achieving a 42% reduction in render latency.`,
      },
      {
        tag: "Scale & Reliability",
        content: `Engineered scalable, fault-tolerant infrastructure handling millions of concurrent events with zero downtime.`,
      },
      {
        tag: "Strategic Leadership",
        content: `Spearheaded delivery of core product features, mentoring 6 junior engineers and increasing sprint velocity by 35%.`,
      },
    ],
    scoreImprovement: "+8 pts",
  };

  if (!ai || !circuitBreaker.canExecute()) {
    return res.json({ ...fallbackOptions, fallback: true });
  }

  // Deduplicate identical in-flight optimize requests
  const hashKey = crypto
    .createHash("sha256")
    .update(`opt:${role}:${sectionType}:${text}`)
    .digest("hex");

  try {
    const result = await coalesceRequest(hashKey, async () => {
      return aiBulkhead.run(async () => {
        return retryWithJitter(async () => {
          const prompt = `Optimize this resume bullet for a "${role || "Senior Software Engineer"}" position in "${sectionType || "Experience"}":
"${text}"

Output JSON with keys: "options" (array of {tag, content}), "scoreImprovement" (e.g. "+7 pts").`;

          const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: prompt,
            config: { responseMimeType: "application/json" },
          });

          const raw = (response.text || "{}").trim().replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
          circuitBreaker.recordSuccess();
          return JSON.parse(raw);
        });
      });
    });

    res.json(result);
  } catch (error: any) {
    circuitBreaker.recordFailure();
    console.error("[AI Optimize Error]", error.message);
    res.json({ ...fallbackOptions, fallback: true });
  }
});

// AI Job Description Matcher
app.post("/api/match-jd", async (req, res) => {
  const { jobDescription, resumeData } = req.body;
  const ai = getAI();

  const fallbackMatch = {
    matchScore: 89,
    matchedSkills: ["TypeScript", "React 19", "Three.js", "Node.js", "Performance Optimization", "Architecture"],
    missingKeywords: ["GraphQL Federation", "Distributed Tracing", "Kubernetes"],
    recommendations: [
      "Include specific distributed systems metrics in the Senior Engineer experience block.",
      "Emphasize experience with GraphQL or API gateways to bridge the 11% skill gap.",
      "Add leadership mentoring statistics to align with staff-level expectations.",
    ],
  };

  if (!ai || !circuitBreaker.canExecute()) {
    return res.json({ ...fallbackMatch, fallback: true });
  }

  const hashKey = crypto
    .createHash("sha256")
    .update(`match:${jobDescription}:${JSON.stringify(resumeData)}`)
    .digest("hex");

  try {
    const result = await coalesceRequest(hashKey, async () => {
      return aiBulkhead.run(async () => {
        return retryWithJitter(async () => {
          const prompt = `Match resume against JD:
Resume: ${JSON.stringify(resumeData)}
Job Description: "${jobDescription}"

Output valid JSON:
{
  "matchScore": number (0 to 100),
  "matchedSkills": string[],
  "missingKeywords": string[],
  "recommendations": string[]
}`;

          const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: prompt,
            config: { responseMimeType: "application/json" },
          });

          const raw = (response.text || "{}").trim().replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
          circuitBreaker.recordSuccess();
          return JSON.parse(raw);
        });
      });
    });

    res.json(result);
  } catch (error: any) {
    circuitBreaker.recordFailure();
    console.error("[AI Match Error]", error.message);
    res.json({ ...fallbackMatch, fallback: true });
  }
});

// ─── 11. Static SPA Serving / Vite Dev Middleware ────────────────
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(
      JSON.stringify({
        event: "SERVER_STARTED",
        port: PORT,
        backendUrl: BACKEND_URL,
        redisUrl: `redis://${REDIS_HOST}:${REDIS_PORT}`,
        nodeEnv: process.env.NODE_ENV || "development",
        timestamp: new Date().toISOString(),
      })
    );
  });
}

setupVite();
