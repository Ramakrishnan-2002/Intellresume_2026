# IntelliResume 2026 — Backend Engineering & System Design Mastery Suite

> **Canonical Backend Curriculum, Engineering Story Board, Architecture Specification, and System Design Interview Reference**
> Reverse-engineered directly from the production implementation of the IntelliResume 2026 codebase.

---

## 🎯 Purpose & Scope

This mastery suite is designed for **Python Backend Engineers, FastAPI Architects, and Distributed Systems Practitioners**. It uses the real **IntelliResume 2026** application as an authoritative case study to teach production backend development from first principles to senior interview defense.

### What This Curriculum Covers:
- **Python Backend Engineering & Async Programming**: Event loops, non-blocking I/O, threadpool offloading, coroutines, and `contextvars`.
- **FastAPI Core Architecture**: Application lifespan hooks, dependency injection, Pydantic v2 validation engines, custom middleware, and error normalization.
- **Database Engineering & Concurrency**: SQLite Write-Ahead Logging (`WAL` mode), ACID transactions, and atomic Compare-And-Swap (CAS) Optimistic Concurrency Control (`OCC`).
- **Distributed Systems & Resilience**: Atomic Redis Lua sliding-window rate limiters, distributed idempotency (`SET NX EX`), in-flight request coalescing (`asyncio.Future`), bulkhead semaphore pools, 3-state circuit breakers, and bounded retries with full jitter.
- **AI / LLM Backend Orchestration**: Synchronous Google Gemini SDK offloading, structured JSON prompt engineering, Pydantic response validation, and role-aware deterministic fallbacks.
- **Security & Multi-Tenancy**: Salted `bcrypt` hashing, stateless JWT bearer tokens, regex correlation ID sanitization, and Broken Object-Level Authorization (`BOLA/IDOR`) scoped SQL queries.
- **Container Infrastructure & Diagnostics**: Multi-container Docker Compose orchestration, bridge networking, and liveness vs. readiness probes.

---

## 📚 The 5 Canonical Mastery Documents

This directory contains exactly **5 canonical documents**. Each document serves a distinct, non-overlapping purpose:

```
docs/mastery/
├── README.md                      # [You Are Here] Navigation hub, scope, statistics & study methodology
├── ARCHITECTURE.md                # Verified current backend architecture, component boundaries & Mermaid flows
├── BACKEND_ENGINEERING_STORIES.md # Development board & 45 deep engineering stories with build/break exercises
├── SYSTEM_DESIGN.md               # NFRs, deep tradeoffs, failure matrix, capacity math & development gap register
└── BACKEND_ROADMAP.md             # Dependency DAG, visual Mermaid graph & 12-day structured study curriculum
```

| Document | Primary Focus | Best Used For |
|---|---|---|
| 📖 **[`ARCHITECTURE.md`](ARCHITECTURE.md)** | Verified execution topology, component boundaries, database schemas, and request lifecycles. | Understanding how the system is wired and tracing requests end-to-end. |
| 🛠️ **[`BACKEND_ENGINEERING_STORIES.md`](BACKEND_ENGINEERING_STORIES.md)** | **45 concrete engineering stories** with implementation mapping, build exercises, failure injection, and interview defense. | Hands-on backend development tracking, code comprehension, and self-building. |
| 📐 **[`SYSTEM_DESIGN.md`](SYSTEM_DESIGN.md)** | Deep architectural tradeoffs, failure recovery matrices, capacity formulas, scaling phases, and development gaps. | Senior/Staff system design interview preparation and scaling analysis. |
| 🗺️ **[`BACKEND_ROADMAP.md`](BACKEND_ROADMAP.md)** | Prerequisite DAG, visual dependency graph, and daily learning schedule. | Structured learning order and development prioritization. |

---

## 📊 Curriculum & Story Statistics

```
Total Modules:               18 Backend Modules
Total Engineering Stories:   45 Concrete Stories

Priority Breakdown:
  • Essential:               28 Stories (Core backend, DB, Auth, Resilience & AI)
  • Important:               12 Stories (Testing, Diagnostics, Caching & Error Handling)
  • Advanced:                 5 Stories (Scaling triggers, Queue extraction & Multi-instance)

Implementation Status:
  • [CURRENT]:               38 Stories (100% code-backed and executable today)
  • [PARTIAL]:                4 Stories (Working baseline with identified development gaps)
  • [THEORY]:                 2 Stories (Distributed systems concepts for interview defense)
  • [FUTURE]:                 1 Story   (Requirement-driven PostgreSQL & Queue evolution)

Development Tracking:
  • [COMPLETE]:              38 Stories
  • [IN PROGRESS]:            3 Stories
  • [NEEDS VERIFICATION]:     3 Stories
  • [NOT IMPLEMENTED]:        1 Story
```

---

## 🔄 Study & Development Methodology

To master each concept, follow the **6-Stage Mastery Loop**:

```
1. Explain It   ──► Articulate the problem without referring to code.
      │
2. Draw It      ──► Sketch the component interaction and failure boundaries.
      │
3. Locate It    ──► Find the exact Python file, class, function, and schema.
      │
4. Trace It     ──► Follow a real request from entry point through the resilience pipeline to the DB.
      │
5. Build/Break  ──► Complete the "Build It Yourself" and "Break It & Debug It" exercises.
      │
6. Defend It    ──► Answer the interview defense questions with concrete tradeoffs.
```

---

## 🚀 Quick Navigation

- **Start with the Architecture**: 👉 [Read `ARCHITECTURE.md`](ARCHITECTURE.md)
- **Track Development & Build Features**: 👉 [Open `BACKEND_ENGINEERING_STORIES.md`](BACKEND_ENGINEERING_STORIES.md)
- **Prepare for System Design Interviews**: 👉 [Study `SYSTEM_DESIGN.md`](SYSTEM_DESIGN.md)
- **Follow the Learning Path**: 👉 [Follow `BACKEND_ROADMAP.md`](BACKEND_ROADMAP.md)
