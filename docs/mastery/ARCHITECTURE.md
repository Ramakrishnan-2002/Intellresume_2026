# IntelliResume 2026 — Backend Architecture & System Blueprint

> **Verified Technical Architecture, Component Boundaries, Database Schemas, and Execution Flows**
> Derived directly from the executable implementation in `backend/app/`, `dockercompose.yml`, and `frontend/server.ts`.

---

## 1. High-Level Architecture Topology

```mermaid
graph TD
    subgraph "Client Tier"
        Client["Browser Client (React 19 SPA)"]
    end

    subgraph "Gateway Tier (Port 3000)"
        Gateway["Thin Express BFF / Static Server<br><code>frontend/server.ts</code>"]
    end

    subgraph "Core Backend Tier (Port 8000)"
        FastAPI["Authoritative FastAPI Core<br><code>backend/app/main.py</code>"]
        
        subgraph "Resilience Pipeline"
            RL["Distributed Rate Limiter (Redis Lua)"]
            Idemp["Distributed Idempotency (SET NX EX)"]
            Coalesce["Request Coalescing (asyncio.Future)"]
            Bulkhead["Bulkhead Concurrency Guard (Semaphore)"]
            CB["Circuit Breaker (3-State Machine)"]
            Retry["Bounded Retry with Full Jitter"]
        end

        subgraph "Application Services"
            AIService["AI Orchestration Service<br><code>services/ai_service.py</code>"]
            ResumeRouter["Resume CRUD & CAS OCC<br><code>routers/resumes.py</code>"]
            AuthRouter["Auth & Thread-Offloaded bcrypt<br><code>routers/auth.py</code>"]
        end
    end

    subgraph "Storage & Coordination Tier"
        Redis[("Redis 7 Alpine<br>Port 6379<br>Ephemeral Coordination")]
        SQLite[("Authoritative DB<br>SQLite 3 WAL Mode<br><code>backend/resume.db</code>")]
    end

    subgraph "External Upstream"
        Gemini["Google Gemini 1.5 Flash<br>Sync SDK via Threadpool"]
    end

    Client -->|"X-Request-Id, Idempotency-Key, Bearer Token"| Gateway
    Gateway -->|"Transparent Reverse Proxy"| FastAPI
    
    FastAPI --> RL
    RL --> Idemp
    Idemp --> Coalesce
    Coalesce --> Bulkhead
    Bulkhead --> CB
    CB --> Retry
    Retry --> AIService
    
    AIService -->|"Synchronous SDK in anyio threadpool"| Gemini
    RL & Idemp -->|"Atomic Lua & SET NX EX"| Redis
    ResumeRouter -->|"Atomic Compare-And-Swap (WHERE version = :v)"| SQLite
    AuthRouter -->|"User Queries & Thread-Offloaded bcrypt"| SQLite
```

---

## 2. The Single Implementation Principle

To eliminate dual-stack maintenance overhead and keep Python as the single authoritative backend language, responsibilities are strictly partitioned:

| Subsystem / Concern | Authoritative Owner | Implementation Path | Explicitly Excluded from Express BFF |
|---|---|---|---|
| **API Contracts & Routing** | **Python / FastAPI** | `backend/app/routers/*` | Express never defines business routes or schema parsing. |
| **Validation Engine** | **Python / Pydantic v2** | `backend/app/schemas.py` | Express performs zero request/response validation. |
| **Distributed Rate Limiting** | **Python + Redis** | `backend/app/resilience/rate_limiter.py` | `ioredis` completely removed from Express `package.json`. |
| **Distributed Idempotency** | **Python + Redis** | `backend/app/resilience/idempotency.py` | Express forwards `Idempotency-Key` without state tracking. |
| **Request Coalescing** | **Python (Process)** | `backend/app/resilience/coalescing.py` | No in-flight promise caching in Express. |
| **Bulkhead Isolation** | **Python (Process)** | `backend/app/resilience/bulkhead.py` | No concurrency limits in Express. |
| **Circuit Breaker** | **Python (Process)** | `backend/app/resilience/circuit_breaker.py` | Express does not monitor upstream Gemini failures. |
| **AI Orchestration & Fallback** | **Python** | `backend/app/services/ai_service.py` | `@google/genai` completely removed from frontend dependencies. |
| **Persistence & OCC** | **Python + SQLite** | `backend/app/routers/resumes.py` | Database file is accessed exclusively by FastAPI. |
| **Authentication & Password Hashing** | **Python** | `backend/app/routers/auth.py`, `OAuth2.py` | Express handles zero credentials or JWT decoding. |
| **Correlation ID Sanitization** | **Python** | `backend/app/core/correlation.py` | Express simply echoes incoming headers or proxies. |
| **Static SPA Serving & Proxy** | **TypeScript / Express** | `frontend/server.ts` | Serves compiled React assets, handles SPA fallback, and proxies `/api/*` to `:8000`. |

---

## 3. Database Schema & Data Modeling

The authoritative relational database is SQLite 3 executing in Write-Ahead Logging (`WAL`) mode via SQLAlchemy ORM.

### 3.1 Table Definitions

#### `users` Table
Stores user credentials and profile metadata.
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR NOT NULL UNIQUE,
    password VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX ix_users_id ON users (id);
CREATE UNIQUE INDEX ix_users_email ON users (email);
```

#### `resumes` Table
Stores structured resume JSON documents with Optimistic Concurrency Control (`OCC`) versioning.
```sql
CREATE TABLE resumes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    resume_id VARCHAR NOT NULL,
    title VARCHAR NOT NULL,
    status VARCHAR DEFAULT 'DRAFT' NOT NULL,
    data TEXT NOT NULL,
    version INTEGER DEFAULT 1 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX ix_resumes_id ON resumes (id);
CREATE INDEX ix_resumes_user_id ON resumes (user_id);
CREATE INDEX ix_resumes_resume_id ON resumes (resume_id);
```

### 3.2 SQLAlchemy Domain Model Mapping
- **`User`** (`backend/app/models.py`): Maps to `users`. Password stored as 60-character bcrypt hash string.
- **`Resume`** (`backend/app/models.py`): Maps to `resumes`. The `data` column stores serialized JSON conforming to the `ResumeData` Pydantic model (`schemas.py`). The `version` column increments atomically on every successful write.

---

## 4. End-to-End Execution Flows

### 4.1 Complete Request Lifecycle & Middleware Pipeline

```mermaid
sequenceDiagram
    autonumber
    participant C as Browser Client
    participant E as Express BFF (:3000)
    participant F as FastAPI Core (:8000)
    participant CM as Correlation Middleware
    participant RL as Rate Limiter (Redis)
    participant ID as Idempotency Manager
    participant AI as AI Orchestrator
    participant DB as SQLite WAL

    C->>E: POST /api/optimize (Payload + Idempotency-Key)
    E->>F: Transparent Proxy (Headers Preserved)
    F->>CM: 1. Sanitize or Generate X-Request-Id
    CM->>F: Set contextvars & request.state
    F->>RL: 2. Check Sliding Window Counter (Lua)
    alt Rate Limit Exceeded
        RL-->>C: 429 RATE_LIMITED (Retry-After: 60)
    end
    F->>ID: 3. SET idemp:{key} NX EX 60
    alt Lock Held (In Progress)
        ID-->>C: 409 IDEMPOTENCY_IN_PROGRESS
    else Cached (Completed)
        ID-->>C: 200 OK (X-Cache: IDEMPOTENT-HIT)
    else Payload Mismatch
        ID-->>C: 422 IDEMPOTENCY_PAYLOAD_MISMATCH
    end
    F->>AI: 4. Execute Resilience Pipeline
    AI-->>F: Validated Pydantic Response
    F->>ID: 5. Store Completed Result in Redis (TTL: 24h)
    F-->>E: 200 OK + X-Request-Id Header
    E-->>C: 200 OK JSON Response
```

---

### 4.2 Authentication & Password Security Lifecycle

```mermaid
sequenceDiagram
    autonumber
    participant C as Client
    participant F as FastAPI
    participant TP as Worker Threadpool
    participant DB as SQLite DB

    Note over C,DB: Registration Flow
    C->>F: POST /api/auth/register (name, email, password)
    F->>DB: Check if email exists
    F->>TP: anyio.to_thread.run_sync(hash_password, password)
    TP-->>F: Salted bcrypt Hash (Work Factor 12)
    F->>DB: INSERT INTO users (name, email, password)
    DB-->>F: user.id
    F-->>C: 201 Created (UserOut Schema)

    Note over C,DB: Login Flow
    C->>F: POST /api/auth/login (username, password)
    F->>DB: SELECT * FROM users WHERE email = :email
    F->>TP: anyio.to_thread.run_sync(verify_password, password, db_hash)
    TP-->>F: True
    F->>F: Sign JWT (sub=email, id=user_id, exp=60m, HS256)
    F-->>C: 200 OK (access_token, token_type="bearer")
```

---

### 4.3 AI Resilience Pipeline

Every AI operation in `ai_service.py` executes through a strictly ordered 7-stage resilience chain:

```mermaid
flowchart TD
    Start["Incoming AI Request"] --> Stage1["1. Rate Limit Check<br><i>Redis Lua sliding window</i>"]
    Stage1 -->|Allowed| Stage2["2. Idempotency Guard<br><i>SET NX EX 60 + SHA-256 fingerprint</i>"]
    Stage1 -->|Exceeded| Err429["429 RATE_LIMITED"]
    
    Stage2 -->|Lock Acquired| Stage3["3. Request Coalescing<br><i>Attach to in-flight asyncio.Future if identical</i>"]
    Stage2 -->|Hit / Conflict| IdempResp["200 (HIT) / 409 (IN_PROGRESS) / 422 (MISMATCH)"]
    
    Stage3 --> Stage4["4. Bulkhead Concurrency Guard<br><i>asyncio.Semaphore <= 4 active, <= 12 queued</i>"]
    Stage4 -->|Capacity Full| Err503["503 AI_CAPACITY_EXCEEDED"]
    
    Stage4 --> Stage5["5. Circuit Breaker<br><i>Check State: CLOSED / OPEN / HALF_OPEN</i>"]
    Stage5 -->|OPEN| FallbackFast["Immediate Deterministic Fallback (<6ms)"]
    
    Stage5 -->|CLOSED / Probe| Stage6["6. Bounded Retry with Jitter<br><i>Max 1 retry on 429/503 (delay = min(300*2^att + jitter, 2000))</i>"]
    Stage6 --> Stage7["7. Synchronous Gemini Execution<br><i>anyio.to_thread.run_sync</i>"]
    
    Stage7 -->|Success| Validate["Pydantic Validation (schemas.py)"]
    Stage7 -->|All Retries Failed| FallbackSafe["Contextual Pydantic Fallback"]
    
    Validate --> Complete["Store Idempotency Result & Return 200 OK"]
    FallbackFast & FallbackSafe --> Complete
```

---

### 4.4 Optimistic Concurrency Control (OCC) Write Conflict Flow

```mermaid
sequenceDiagram
    autonumber
    participant TabA as Browser Tab A (Version 1)
    participant TabB as Browser Tab B (Version 1)
    participant F as FastAPI (/api/resumes/:id)
    participant DB as SQLite (resumes table)

    Note over TabA,TabB: Both tabs load resume at Version 1
    TabA->>F: PUT /api/resumes/RES-1 (version: 1, title: "Title A")
    F->>DB: UPDATE resumes SET title="Title A", version=2 WHERE id='RES-1' AND version=1
    DB-->>F: rows_affected = 1 (SUCCESS)
    F-->>TabA: 200 OK (version: 2)

    TabB->>F: PUT /api/resumes/RES-1 (version: 1, title: "Title B")
    F->>DB: UPDATE resumes SET title="Title B", version=2 WHERE id='RES-1' AND version=1
    DB-->>F: rows_affected = 0 (STALE WRITE DETECTED)
    F->>DB: SELECT version FROM resumes WHERE id='RES-1'
    DB-->>F: current_version = 2
    F-->>TabB: 409 OPTIMISTIC_CONCURRENCY_CONFLICT (serverVersion=2, clientVersion=1)
    Note over TabB: Tab B receives conflict, fetches version 2, and merges changes cleanly.
```

---

### 4.5 PDF Vector Export & Print Portal Flow

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant R as React App (App.tsx)
    participant DOM as Browser DOM
    participant PE as Browser Print Engine

    U->>R: Click "Export PDF"
    R->>DOM: Mount isolated portal: <div id="print-root"><ResumeDocument data={resumeData} /></div>
    R->>PE: Trigger window.print()
    Note over PE,DOM: @media print stylesheet activates
    PE->>DOM: Hide <div id="screen-root"> (display: none !important)
    PE->>DOM: Hide navigation, toolbars, sidebars, buttons (.print:hidden)
    PE->>DOM: Display ONLY #print-root (display: block !important, bg: #ffffff)
    PE->>DOM: Apply A4 geometry: @page { size: A4 portrait; margin: 12mm 15mm; }
    PE->>DOM: Apply page-break isolation: break-inside: avoid on sections & articles
    PE-->>U: Pristine vector PDF preview with clean pagination & zero UI chrome
```

---

## 5. Docker Infrastructure & Networking Topology

```mermaid
graph TD
    subgraph "Host Machine"
        HostPort3000["Host Port 3000"]
        HostPort8000["Host Port 8000"]
        HostPort6379["Host Port 6379"]
        HostVolume["./backend:/app<br>(Durable resume.db)"]
    end

    subgraph "Docker Bridge Network (intelliresume_2026_default)"
        Frontend["frontend container<br>Node 20 Alpine<br>Express BFF<br>Health: /health/live"]
        Backend["backend container<br>Python 3.11 Slim<br>FastAPI + Uvicorn<br>Health: /health/ready"]
        Redis["redis container<br>Redis 7 Alpine<br>Health: redis-cli ping"]
    end

    HostPort3000 --> Frontend
    HostPort8000 --> Backend
    HostPort6379 --> Redis
    Backend --> HostVolume

    Frontend -->|"depends_on: backend (healthy)"| Backend
    Frontend -->|"depends_on: redis (healthy)"| Redis
    Backend -->|"depends_on: redis (healthy)"| Redis
```

### Healthcheck Diagnostics
- **Redis (`redis:7-alpine`)**: `redis-cli ping` every 5s.
- **Backend (`python:3.11-slim`)**: `urlopen('http://localhost:8000/health/ready')` every 10s. Verifies SQLite connectivity, Redis reachability, Circuit Breaker state, and Bulkhead queue metrics.
- **Frontend (`node:20-alpine`)**: HTTP GET on `http://localhost:3000/health/live` every 10s.
