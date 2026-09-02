# IntelliResume 2026 — Full Technical & UI/UX Context Document
Repository analyzed: `https://github.com/Ramakrishnan-2002/Intellresume_2026` (default branch, shallow clone)

---

## 1. PROJECT OVERVIEW

**One-Line Product Description:**
> An AI-powered resume builder for technical professionals that generates, edits, audits, and exports ATS-optimized resumes using Google's Gemini models, presented through a 3D/glassmorphic "Resume Studio" interface.

- **Project name:** IntelliResume 2026 (`IntellResume_2026` on GitHub; app title "IntelliResume")
- **Purpose:** Generate, edit, score, and export resumes tailored to a target role or a pasted job description, with an AI chat assistant for career coaching.
- **Problem it solves:** Manual resume writing/tailoring for ATS systems; provides AI-generated bullet points, JD-keyword gap analysis, and an executive "audit" grade.
- **Target users:** Technical professionals (software engineers, ML engineers, DevOps/cloud architects) per the built-in role presets.
- **Main use cases:**
  1. Generate a full resume from a target role + experience level (+ optional JD).
  2. Manually edit resume fields in a structured editor with live 3D/flat preview.
  3. Chat with an AI career assistant with slash-style prompts.
  4. Paste a job description and get a match score + missing-keyword list, with one-click merge into Skills.
  5. Get an "executive audit" (grade, strengths, weaknesses, rewritten summary).
  6. Export the resume as a PDF via the browser's native print dialog.
- **Core features:** AI Chat Hub, Resume Studio (structured editor + 3D/flat preview), JD Matcher, AI Resume Generator, Analytics/Telemetry dashboard, Settings.
- **Application type:** Single-Page Application (client-rendered React SPA) backed by a lightweight Node/Express API layer; a second, largely unused FastAPI service also exists in the repo (see §4 and §15 for the critical wiring caveat).
- **Current architecture:** Three deployable units defined in `dockercompose.yml`:
  1. `frontend` — Vite + React 19 + TypeScript SPA, served by a custom Express server (`frontend/server.ts`) that also implements every AI-facing REST endpoint in-process using `@google/genai` (Gemini).
  2. `backend` — FastAPI (Python) service with SQLAlchemy/SQLite, JWT-based auth scaffolding, and a **duplicate** set of AI endpoints implemented with `google-generativeai`.
  3. (No separate database container — SQLite file `backend/resume.db` is used and is checked into the repository.)
- **Frontend technology:** React 19, TypeScript 5, Vite 6, Tailwind CSS 4, Express 4 (as the frontend's own server/API host, not just a static file server), Three.js, `@google/genai`, `canvas-confetti`, `lucide-react`, `motion`.
- **Backend technology:** FastAPI 0.115, Uvicorn, SQLAlchemy 2.0 (SQLite by default), Pydantic v2/`pydantic-settings`, `python-jose` (JWT), `passlib`/`bcrypt`, `google-generativeai`.
- **Database:** SQLite (`sqlite:///./resume.db`), via SQLAlchemy ORM. Only used by the FastAPI service, which (per §4/§15) is not actually called by the running frontend.
- **External services:** Google Gemini API (`@google/genai` in the Express server; `google-generativeai` in the FastAPI service). Google Fonts (Inter, JetBrains Mono, Plus Jakarta Sans, Material Symbols) loaded via `<link>` tags in `index.html`.
- **Authentication mechanism (as designed):** Email/password registration + OAuth2-password-flow login issuing a JWT (`backend/app/routers/auth.py`, `OAuth2.py`). **As actually wired into the UI: none** — the frontend's `AuthPortalView` never calls these endpoints (see §7, §15).
- **Deployment-related information:** `dockercompose.yml` builds two images (`./backend`, `./frontend`) and exposes ports `8000` (backend) and `3000` (frontend). Frontend Dockerfile runs the dev server (`npm run dev`) even in the compose config used for "production" (`DISABLE_HMR=true` is set, but this only affects Vite's HMR/watcher, not a production build).
- **Important environment variables:** see §17.
- **Major dependencies:** see §2.

---

## 2. COMPLETE TECHNOLOGY STACK

| Layer | Technology | Version | Purpose | Evidence |
|---|---|---|---|---|
| Frontend framework | React | 19.0.1 | UI rendering | `frontend/package.json` |
| Frontend language | TypeScript | ~5.8.2 | Type safety | `frontend/package.json`, `tsconfig.json` |
| Build tool / dev server | Vite | ^6.2.3 | Bundling, HMR | `frontend/vite.config.ts` |
| Frontend host/API server | Express | ^4.21.2 | Serves SPA (dev via Vite middleware) **and** implements all `/api/*` AI endpoints | `frontend/server.ts` |
| Styling | Tailwind CSS | ^4.1.14 (`@tailwindcss/vite`) | Utility-first CSS, imported via `@import "tailwindcss"` | `frontend/src/index.css`, `vite.config.ts` |
| State management | React `useState` (local component state only) | React 19 | All app state (resume data, chat, activities, modals) lives in `App.tsx` and is passed down via props | `frontend/src/App.tsx` |
| API communication | native `fetch` | — | All AI calls (`/api/chat`, `/api/optimize`, etc.) | grep of `frontend/src/components/*.tsx` |
| 3D/graphics | Three.js | ^0.185.1 | Custom WebGL "AI brain" visualization and background shader | `ThreeAIBrain.tsx`, `BackgroundShader.tsx` |
| Icons | lucide-react | ^0.546.0 | Icon set | multiple components |
| Animation/confetti | `canvas-confetti`, `motion` | ^1.9.4 / ^12.23.24 | Celebration effects on save/generate/export | multiple components |
| AI SDK (frontend server) | `@google/genai` | ^2.4.0 | Calls Gemini model `gemini-3.6-flash` | `frontend/server.ts` |
| Backend framework | FastAPI | 0.115.6 | REST API (auth + duplicate AI endpoints) | `backend/requirements.txt`, `backend/app/main.py` |
| ASGI server | Uvicorn | 0.34.0 | Serves FastAPI app | `backend/Dockerfile` |
| ORM | SQLAlchemy | 2.0.36 | `User`, `Resume` models | `backend/app/models.py` |
| Database | SQLite | (file `resume.db`, committed to repo) | Default persistence store | `backend/app/config.py`, `backend/resume.db` |
| Migrations | Alembic (listed) | 1.14.0 | Present in `requirements.txt` but **no migration scripts found in repo** | UNKNOWN / NOT FOUND IN REPOSITORY (no `alembic/` directory) |
| Auth (backend) | `python-jose` (JWT), `passlib`+`bcrypt` (hashing) | 3.5.0 / 1.7.4 | Token creation/verification, password hashing | `backend/app/OAuth2.py`, `utils.py` |
| AI SDK (backend) | `google-generativeai` | 0.8.3 | Calls Gemini model `gemini-1.5-flash` (hardcoded) | `backend/app/routers/api.py` |
| Validation | Pydantic | 2.10.4 | Request/response schemas | `backend/app/schemas.py` |
| Testing | — | — | **No test files found anywhere in the repository** (frontend or backend) | UNKNOWN / NOT FOUND IN REPOSITORY |
| Build tool (backend) | pip / `requirements.txt` | — | Dependency install | `backend/Dockerfile` |
| Deployment | Docker Compose | — | Two services: `backend`, `frontend` | `dockercompose.yml` |
| CI/CD | — | — | No `.github/workflows` or other CI config found | UNKNOWN / NOT FOUND IN REPOSITORY |
| External services | Google Gemini API, Google Fonts CDN | — | AI generation; typography | `server.ts`, `api.py`, `index.html` |

---

## 3. REPOSITORY STRUCTURE

```text
Intellresume_2026/
├── README.md                      # Root project readme (marketing + setup + partial API table)
├── dockercompose.yml               # Two-service orchestration (backend:8000, frontend:3000)
├── backend/
│   ├── Dockerfile                  # python:3.11-slim, uvicorn entrypoint
│   ├── README.md                   # Backend-specific docs; recommends a Vite proxy that is NOT configured
│   ├── requirements.txt            # Pinned Python deps (FastAPI, SQLAlchemy, google-generativeai, JWT, etc.)
│   ├── resume.db                   # SQLite DB file, committed to git (currently empty — 0 users)
│   ├── .env.example                # GEMINI_API_KEY, SQLALCHEMY_DATABASE_URL, SECRET_KEY, token expiry
│   └── app/
│       ├── main.py                 # FastAPI app instance, CORS, router mounting, optional SPA static serving
│       ├── config.py                # Pydantic `Settings` (env-driven config)
│       ├── database.py              # SQLAlchemy engine/session, `get_db` dependency
│       ├── models.py                # ORM models: `User`, `Resume`
│       ├── schemas.py               # All Pydantic request/response models (auth + resume + AI contracts)
│       ├── utils.py                 # Password hashing helpers (bcrypt via passlib)
│       ├── OAuth2.py                 # JWT creation/verification, `get_current_user` dependency
│       └── routers/
│           ├── auth.py              # `/api/auth/register`, `/api/auth/login`, `/api/auth/me` (broken — see §15)
│           └── api.py               # `/api/health`, `/api/generate-resume`, `/api/generate-pdf-data`,
│                                     #  `/api/ai-audit`, `/api/chat`, `/api/optimize`, `/api/match-jd`
│                                     #  (all Gemini-backed with hardcoded fallback data)
└── frontend/
    ├── Dockerfile                   # node:20-alpine, runs `npm run dev` (dev server, not a production build)
    ├── index.html                   # SPA shell, dark theme, Google Fonts preconnect
    ├── metadata.json                 # AI Studio applet metadata (capability flags)
    ├── package.json                  # Scripts: dev (tsx server.ts), build, start, lint
    ├── server.ts                     # Express app: mounts Vite middleware (dev) or static `dist` (prod),
    │                                  #  AND implements every `/api/*` AI endpoint directly (duplicate of backend/app/routers/api.py)
    ├── vite.config.ts                 # React + Tailwind plugins; proxy explicitly removed (comment: "server.ts handles /api/* routes directly")
    ├── tsconfig.json
    └── src/
        ├── main.tsx                  # ReactDOM root render
        ├── App.tsx                   # Root component: ALL app state, tab routing, modal orchestration, activity feed
        ├── types.ts                  # Shared TypeScript interfaces (ResumeData, ChatMessage, ActivityItem, ActiveTab)
        ├── index.css                  # Tailwind import + design tokens (CSS vars), glassmorphism utilities, print styles
        ├── data/
        │   └── mockData.ts            # `initialResumeData`, `initialActivities`, `initialChatMessages`, `avatarUrls`
        │                              #  — only `avatarUrls` is actually imported/used; the rest is dead code (see §14)
        └── components/
            ├── SideNavBar.tsx          # Left rail nav (Dashboard/Studio/Chat/Analytics/Settings/Auth) + quick actions
            ├── TopAppBar.tsx            # Top bar: view tabs, search input (non-functional), notifications popover, help
            ├── DashboardView.tsx         # Welcome bento, telemetry metric cards, activity timeline
            ├── ResumeStudioView.tsx       # Largest component (893 lines): structured accordion editor + 3D/flat preview host
            ├── ThreeResumeCanvas.tsx       # 3D/flat viewport chrome: zoom, rotate, template switch, "Export PDF" (window.print)
            ├── ResumeDocument.tsx          # The actual printable resume markup (3 template style variants)
            ├── AIChatView.tsx               # Chat UI incl. custom markdown-to-HTML renderer, 3D "AI brain" panel, suggestion chips
            ├── ThreeAIBrain.tsx              # Three.js WebGL wireframe icosahedron animation for the chat panel
            ├── BackgroundShader.tsx           # Raw WebGL fragment-shader animated background (used on Auth screen)
            ├── AuthPortalView.tsx              # Login/Register UI — entirely client-side mocked (see §7, §15)
            ├── AIGenerateModal.tsx              # "Generate AI Resume" modal (role presets, calls `/api/generate-resume`)
            ├── JDMatcherModal.tsx                # JD paste + sample JDs, calls `/api/match-jd` (field-name bug — see §14)
            ├── AIReviewModal.tsx                  # Executive audit modal, calls `/api/ai-audit`
            └── SettingsView.tsx                     # Profile name/email fields + two toggle switches; `onSave` has no API call
```

---

## 4. SYSTEM ARCHITECTURE

```text
                    ┌───────────────────────────┐
                    │        Browser (SPA)       │
                    │  React 19 + TS, Vite HMR    │
                    │  All state in App.tsx        │
                    └──────────────┬───────────────┘
                                   │ fetch('/api/...')  (relative path, same origin)
                                   ▼
                    ┌───────────────────────────┐
                    │   Express server (:3000)    │◄── serves the SPA itself (Vite middleware in dev,
                    │   frontend/server.ts          │      static `dist/` + SPA fallback in "prod")
                    │                                │
                    │   Implements DIRECTLY:          │
                    │   /api/health                    │
                    │   /api/generate-resume            │
                    │   /api/generate-pdf-data           │
                    │   /api/ai-audit                     │
                    │   /api/chat                           │
                    │   /api/optimize                        │
                    │   /api/match-jd                          │
                    └──────────────┬────────────────────────────┘
                                   │ @google/genai SDK call (model: gemini-3.6-flash)
                                   ▼
                    ┌───────────────────────────┐
                    │      Google Gemini API       │
                    └───────────────────────────┘

   ── SEPARATE, PARALLEL, NOT CONNECTED TO THE ABOVE AT RUNTIME ──

                    ┌───────────────────────────┐
                    │   FastAPI server (:8000)    │
                    │   backend/app/main.py         │
                    │                                │
                    │   /api/auth/register             │
                    │   /api/auth/login                  │
                    │   /api/auth/me   (broken)            │
                    │   /api/health                          │
                    │   /api/generate-resume                   │  (near-duplicate logic of server.ts,
                    │   /api/generate-pdf-data                    │   model: gemini-1.5-flash)
                    │   /api/ai-audit                                │
                    │   /api/chat                                      │
                    │   /api/optimize                                    │
                    │   /api/match-jd                                      │
                    └──────────────┬─────────────────┬─────────────────────┘
                                   │                 │
                                   ▼                 ▼
                    ┌──────────────────┐   ┌───────────────────┐
                    │  SQLite (resume.db) │   │  Google Gemini API   │
                    │  users, resumes tbl   │   └───────────────────┘
                    └──────────────────┘
```

**Frontend → backend communication:** The browser only ever talks to the Express server on the same origin/port it was served from (port 3000). `vite.config.ts` explicitly removed its dev proxy with the comment *"Proxy removed — server.ts handles /api/* routes directly."* The FastAPI service on port 8000 is started by `docker compose` but is **never reached by the browser** in the current configuration — there is no reverse proxy, no CORS-enabled cross-origin fetch from the SPA, and no code path in `frontend/src` that targets `:8000` or an absolute FastAPI URL.

**Authentication flow (as wired):** None. See §7.

**Data flow:** All resume data lives only in React state (`App.tsx`). AI endpoints receive the current in-memory resume as `currentData`/`resumeData` in the request body and return either AI-generated JSON or a hardcoded fallback object (used whenever `GEMINI_API_KEY` is unset or the Gemini call throws). Nothing is written to any database from the running app.

**Caching:** None found.
**File storage:** None (no upload endpoints; "Attach Job Description or File" button in `AIChatView` only shows an `alert()`).
**Background jobs:** None found.
**AI/LLM integration:** Two independent Gemini integrations exist (Express/`@google/genai`/`gemini-3.6-flash`, and FastAPI/`google-generativeai`/`gemini-1.5-flash`); only the Express one is live.
**Error handling:** Every AI-calling endpoint (both stacks) wraps the Gemini call in try/catch and returns a deterministic, hardcoded "fallback" payload on any failure (missing key, malformed JSON, network error), so the UI always receives a `200`-shaped response with plausible-looking demo data rather than a hard error, except in the Express server's `catch` blocks which return HTTP 500 with `{ error: message }` for `generate-resume/ai-audit/chat/optimize/match-jd` (the FastAPI equivalents swallow the exception and return 200 with fallback content instead — an inconsistency between the two implementations).

---

## 5. COMPLETE API INVENTORY

> Two independent API surfaces exist. **"LIVE"** = actually reachable from the shipped frontend. **"ORPHANED"** = defined in code, running in its own container, but not called by the SPA.

### 5.1 Express server (`frontend/server.ts`) — LIVE, this is what the SPA actually uses

| Method | Endpoint | Purpose | Auth | Request | Response | Frontend Usage |
|---|---|---|---|---|---|---|
| GET | `/api/health` | Health check + AI-configured flag | None | — | `{ status, aiConfigured }` | Not called from any component (defined, unused by UI) |
| POST | `/api/generate-resume` | Generate a full resume from role/level/prompt/JD | None | `GenerateResumeRequest`-shaped JSON | `{ resume: ResumeData }` | `AIGenerateModal.tsx` |
| POST | `/api/generate-pdf-data` | Alias of the above (identical handler) | None | same as above | same as above | Not called from any component (alias only) |
| POST | `/api/ai-audit` | Executive resume grade + strengths/weaknesses + rewritten summary | None | `{ resumeData }` | `{ grade, strengths[], weaknesses[], suggestedSummary }` | `AIReviewModal.tsx` |
| POST | `/api/chat` | Career-coach chat reply | None | `{ message, resumeContext?, history? }` | `{ reply }` | `AIChatView.tsx` |
| POST | `/api/optimize` | Rewrite a bullet/summary into 3 tagged variants | None | `{ text, sectionType?, role? }` | `{ options: [{tag, content}], scoreImprovement }` | `ResumeStudioView.tsx` (bullet + summary optimize) |
| POST | `/api/match-jd` | Score resume against a pasted JD | None | `{ jobDescription, resumeData }` | `{ matchScore, matchedSkills[], missingKeywords[], recommendations[] }` | `JDMatcherModal.tsx` — **field-name mismatch bug, see §14** |

None of these endpoints enforce authentication or authorization — there is no auth middleware in `server.ts` at all.

### 5.2 FastAPI backend (`backend/app/routers/*.py`) — ORPHANED (not reachable from the shipped SPA)

| Method | Endpoint | Purpose | Auth | Request | Response | Frontend Usage |
|---|---|---|---|---|---|---|
| POST | `/api/auth/register` | Create a user (bcrypt-hashed password) | None | `UserCreate {name, email, password}` | `{ success, user: UserOut }`, 201 | **None** |
| POST | `/api/auth/login` | OAuth2-password-flow login → JWT | None (issues the credential) | form-encoded `username`,`password` | `Token {access_token, token_type}` | **None** |
| GET | `/api/auth/me` | Get current user | Intended: Bearer JWT | — | `UserOut` | **None — and this route is broken**, see §15 |
| GET | `/api/health` | Health check | None | — | `HealthResponse` | **None** |
| POST | `/api/generate-resume` (+ `/api/generate-pdf-data` alias) | Same purpose as Express version, via `google-generativeai` | None | `GenerateResumeRequest` | `GenerateResumeResponse` | **None** |
| POST | `/api/ai-audit` | Same purpose as Express version | None | `AIAuditRequest` | `AIAuditResponse` | **None** |
| POST | `/api/chat` | Same purpose as Express version | None | `ChatRequest` | `ChatResponse` | **None** |
| POST | `/api/optimize` | Same purpose as Express version | None | `OptimizeRequest` | `OptimizeResponse` | **None** |
| POST | `/api/match-jd` | Same purpose as Express version | None | `MatchJDRequest` | `MatchJDResponse` | **None** |

No CRUD endpoints exist for the `Resume` SQLAlchemy model (no create/list/get/update/delete route in `routers/api.py` or elsewhere), despite the model being fully defined in `models.py`. This means the persistence layer is scaffolded but incomplete/unwired even on the backend side.

---

## 6. API REQUEST/RESPONSE CONTRACTS

All contracts below are the Pydantic schemas in `backend/app/schemas.py`, which are also the de-facto contract the Express server mirrors (field-for-field, as plain TS object literals — there is no shared/generated type file between the two backends).

```text
ResumeData
├── id: string
├── title: string
├── status: "DRAFT" | "OPTIMIZED" | "PUBLISHED"
├── personalInfo: PersonalInfo
│   ├── firstName: string (required)
│   ├── lastName: string (required)
│   ├── email: string (required)
│   ├── phone: string (required)
│   ├── location: string (required)
│   ├── title: string (required)
│   ├── summary: string (required)
│   ├── website?: string
│   ├── linkedin?: string
│   └── github?: string
├── experience: ExperienceItem[]
│   ├── id, role, company, location, startDate, endDate: string (required)
│   ├── current: boolean (required)
│   └── bullets: string[] (required)
├── skills: Skills
│   ├── languages: string[]
│   ├── frameworks: string[]
│   ├── tools: string[]
│   └── cloud: string[]
├── education: EducationItem[]
│   ├── id, institution, degree, field, graduationYear: string (required)
│   └── location?: string
├── projects: ProjectItem[]
│   ├── id, name, description: string (required)
│   ├── tech: string[] (required)
│   └── link?: string
└── metrics: Metrics
    ├── resumeScore: int
    ├── jdMatchRate: int
    ├── profileViews: int
    └── aiCredits: int

GenerateResumeRequest
├── prompt?: string
├── targetRole?: string
├── experienceLevel?: string
├── skillsNotes?: string
├── jobDescription?: string
└── currentData?: ResumeData

GenerateResumeResponse
└── resume: ResumeData

AIAuditRequest
└── resumeData: ResumeData
AIAuditResponse
├── grade: string          e.g. "A+ (96/100)"
├── strengths: string[]
├── weaknesses: string[]
└── suggestedSummary: string

ChatRequest
├── message: string (required)
├── resumeContext?: dict
└── history?: dict[]        # NOTE: accepted by the schema but never actually sent by the frontend (AIChatView keeps `messages` in local state and does not include `history` in the request body)
ChatResponse
└── reply: string

OptimizeRequest
├── text: string (required)
├── sectionType?: string
└── role?: string
OptimizeResponse
├── options: { tag: string, content: string }[]
└── scoreImprovement: string   e.g. "+8 pts"

MatchJDRequest
├── jobDescription: string (required)
└── resumeData: dict (partial; frontend sends {title, summary, skills, experience} only, not the full ResumeData)
MatchJDResponse                              ⚠️ see §14 — frontend expects different field names
├── matchScore: int (0–100)
├── matchedSkills: string[]
├── missingKeywords: string[]
└── recommendations: string[]

UserCreate (auth)
├── name: string
├── email: EmailStr
└── password: string
UserOut
├── id: int
├── name: string
└── email: EmailStr
Token
├── access_token: string
└── token_type: string = "bearer"
```

**Validation rules:** Enforced only via Pydantic types on the FastAPI side (e.g., `email: EmailStr`); the Express server does **no** request validation/schema enforcement — it destructures `req.body` directly and relies on optional chaining/defaults.

**Pagination / sorting / filtering / search:** Not implemented anywhere (no list endpoints exist that would need them). The `TopAppBar` search input (`searchQuery`) is local state that is **never used to filter anything** — it is wired to `setSearchQuery` but no component reads `searchQuery` to filter the dashboard, resumes, or activity feed.

**Error format:** Express: `{ error: string }` with HTTP 500 on unhandled exceptions in `generate-resume/ai-audit/chat/optimize/match-jd`. FastAPI: standard FastAPI/Pydantic validation error shape (HTTP 422) for malformed request bodies; `HTTPException(status_code, detail)` for `auth` errors (400 for duplicate email, 401 for bad credentials, 404 for missing user in `get_current_user`).

---

## 7. AUTHENTICATION & AUTHORIZATION

**As designed (FastAPI, unused):**
```text
User
 ↓ fills login/register form (would be) submitted to FastAPI
Authentication API (/api/auth/register or /api/auth/login)
 ↓ bcrypt-verify password, sign JWT {id, email, name, exp}
Token (JWT, HS256, default 60-minute expiry)
 ↓ (intended) stored client-side
Frontend Storage — NOT IMPLEMENTED (no `Authorization` header is ever sent by any frontend fetch call)
 ↓
Authenticated Requests — NOT IMPLEMENTED
 ↓
Backend Middleware (`OAuth2.py: get_current_user`, `oauth2_bearer`) — defined but not attached to any live route
 ↓
Authorized Resource — none exist (no protected endpoints)
```

**As actually implemented (what ships):**
- `App.tsx` initializes `isAuthenticated` to `true` by default — the app is unlocked with no login step required on load.
- `AuthPortalView.tsx` renders a Login/Register form, but its `handleSubmit` does **not** call any API: it sets a `loading` flag, waits 600 ms via `setTimeout`, then calls `onSuccessAuth()` (which just sets `isAuthenticated = true` and switches to the Dashboard tab). Username/password field values are never sent anywhere.
- A secondary "Instant Guest Access" button bypasses the form entirely and calls `onSuccessAuth()` directly.
- There is no logout action anywhere in the UI.
- No JWT, cookie, or `localStorage`/`sessionStorage` token persistence exists in the frontend.
- **Conclusion: the shipped application has no real authentication or session management.** The FastAPI `register`/`login`/`me` endpoints are functional in isolation (reachable via `/docs` on port 8000) but are completely disconnected from the user-facing product.
- **Role-based access / permission checks:** Not implemented (no roles/permissions modeled anywhere).

---

## 8. DATABASE & DATA MODEL

**Database technology:** SQLite (single file, `backend/resume.db`), accessed via SQLAlchemy Core/ORM. `SQLALCHEMY_DATABASE_URL` is configurable via env var but defaults to `sqlite:///./resume.db`, and the docker-compose file hardcodes that same SQLite URL for the `backend` service (i.e., Postgres/MySQL are not configured anywhere despite `SQLAlchemy` supporting them).

```text
User (table: users)
 ├── id: int, PK, indexed
 ├── email: string, unique, not null
 ├── password: string, not null (bcrypt hash)
 ├── name: string, not null
 ├── created_at: timestamptz, server_default now()
 └──< Resume (no FK constraint defined — see below)

Resume (table: resumes)
 ├── id: int, PK, indexed
 ├── user_id: int, indexed  (⚠ NOT declared as a ForeignKey to users.id — just a plain int column)
 ├── resume_id: string, not null   (a separate app-level identifier from the PK — purpose/usage UNKNOWN, no code reads/writes it)
 ├── title: string, not null
 ├── status: string, not null, default "DRAFT"
 ├── data: text, not null   (JSON-serialized ResumeData blob — schemaless at the DB layer)
 ├── created_at: timestamptz, server_default now()
 └── updated_at: timestamptz, server_default now(), onupdate now()
```

- **Relationships:** Conceptually one-to-many (`User` → `Resume`), but there is no SQLAlchemy `relationship()` or FK constraint linking them — the link is implicit via the untyped `user_id` integer column only.
- **Indexes:** `id` (both tables, via `index=True`) and `user_id` (Resume). No index on `User.email` beyond the implicit unique constraint.
- **No CRUD router exists for `Resume`** (see §5.2) — the table is currently unreachable through any API.
- **Data lifecycle:** `created_at`/`updated_at` are server-managed; no soft-delete, versioning, or audit trail.
- **Enumerations:** `status` on both `ResumeData` (Pydantic: `"DRAFT" | "OPTIMIZED" | "PUBLISHED"`) and `Resume.status` (DB: an unconstrained string defaulting to `"DRAFT"`) — the DB column does not enforce the enum.

---

## 9. FRONTEND ARCHITECTURE

- **Framework:** React 19 with function components and hooks exclusively; no class components.
- **Routing:** No router library (no `react-router`, no URL-based routes). "Navigation" is a single `activeTab: ActiveTab` state value (`'dashboard' | 'studio' | 'chat' | 'analytics' | 'settings' | 'auth'`) held in `App.tsx` and passed down; the browser URL never changes, so views are not deep-linkable/bookmarkable and the browser back/forward buttons do nothing.
- **Layouts:** One implicit layout — fixed 80px-wide (hover-expandable) `SideNavBar` + `TopAppBar` + a `<main>` area that swaps views conditionally (`{activeTab === 'x' && <XView/>}`). The Auth view fully replaces this layout (early return in `App.tsx`).
- **Pages/Views:** Dashboard, Resume Studio, AI Chat, Analytics, Settings, Auth Portal (see §10).
- **Reusable components:** Modals (`AIGenerateModal`, `JDMatcherModal`, `AIReviewModal`) are the main reusable overlay pattern; there is no generic `Modal` wrapper component — each modal duplicates its own backdrop/card/close-button markup.
- **Hooks:** Only built-in React hooks (`useState`, `useEffect`, `useRef`) are used; no custom hooks were found (no `useXyz.ts` files exist).
- **State management:** 100% local component state, lifted to `App.tsx` as the single source of truth for `resumeData`, `activities`, `searchQuery`, and modal open/closed flags. No Context API, Redux, Zustand, or React Query. Every state-consuming view receives its data via explicit props.
- **API service layer:** None — each component calls `fetch()` directly inline (no shared `api.ts`/client wrapper, no request interceptor, no centralized error handling or base URL config).
- **Authentication state:** A single boolean (`isAuthenticated`) in `App.tsx`; see §7 for how thin this is.
- **Form handling:** Plain controlled inputs with inline `onChange` handlers; no form library (no React Hook Form/Formik). Minimal validation (`required` HTML attribute only, e.g. in `AuthPortalView`).
- **Error handling:** Per-call `try/catch` around each `fetch`, with a hardcoded UI-side fallback message/content on failure (mirrors the backend's own fallback pattern — i.e., failures are double-masked and the user is unlikely to ever see a real error state).
- **Loading states:** Local boolean flags per action (`isGenerating`, `isTyping`, `loading`, `isOptimizingSection`, `analyzing`, `isExporting`) drive spinners/disabled buttons; no global loading indicator or skeleton screens.
- **Responsive behavior:** Tailwind responsive classes (`sm:`, `md:`, `lg:`) are used throughout for grid/flex reflow; see §19 for specifics and gaps.
- **Styling system:** Tailwind CSS 4 utility classes plus a small custom design-token layer in `index.css` (`--color-primary`, `--color-surface*`, etc.) and hand-rolled "glassmorphism" utility classes (`.glass-z1`, `.glass-z2`, `.glass-panel`, `.glass-panel-active`, `.input-glass`, `.btn-spring`, `.ai-pulse`, `.floating-card`).
- **Theme system:** Single fixed dark theme (`class="dark"` hardcoded on `<html>`); no light-mode toggle or theme switcher exists despite `Moon` icon being imported in `SettingsView` (imported but unused for theme switching).
- **Icons:** `lucide-react`.
- **Animations:** CSS keyframes (`floatAnim`, `pulseBorder`) + `canvas-confetti` bursts on save/generate/apply actions + custom WebGL animation loops (Three.js scene in `ThreeAIBrain`, raw WebGL shader in `BackgroundShader`).
- **Charts:** None (all "charts" are hand-built `<div>` progress bars with inline `width: %` styles, not a charting library).
- **Tables:** None found (all list-like data is rendered as cards/flex lists).
- **Modals:** Custom, one-off per use case (see above).
- **Toasts:** A single global toast (`toastMessage` state + fixed-position div in `App.tsx`), auto-dismissed via `setTimeout`, not a toast queue/library.
- **Navigation:** `SideNavBar` (icon rail, expands on hover) + `TopAppBar` (secondary tab links + search + notifications + help).

---

## 10. COMPLETE PAGE / SCREEN INVENTORY

> There is no router, so "Route" below is the `ActiveTab` value, not a URL.

| "Route" (tab) | Page | Purpose | Authentication | Main Components | APIs Used | User Actions |
|---|---|---|---|---|---|---|
| `dashboard` | Dashboard | Overview, quick actions, telemetry, activity feed | Gated by mocked `isAuthenticated` only | `DashboardView` | None directly (children trigger modals that call APIs) | Open AI Generator, start new resume, open JD matcher, jump to Chat |
| `studio` | Resume Studio | Structured resume editing + live preview + export | Gated by mocked `isAuthenticated` | `ResumeStudioView`, `ThreeResumeCanvas`, `ResumeDocument` | `/api/optimize` (bullet & summary) | Edit all resume fields, add/remove experience/education/projects/bullets, toggle 3D/flat view, switch template, zoom, export PDF (`window.print`), save draft (confetti + toast only) |
| `chat` | AI Chat Hub | Conversational AI assistant | Gated by mocked `isAuthenticated` | `AIChatView`, `ThreeAIBrain` | `/api/chat` | Send message, use suggestion chips (`/optimize`, `/analyze`, `/format`), copy AI-suggested options, "apply" first experience bullet from an option |
| `analytics` | Analytics/Telemetry | ATS score breakdown & recommendations | Gated by mocked `isAuthenticated` | `AnalyticsView` | None (fully static/hardcoded — see §14) | Trigger JD matcher re-scan |
| `settings` | Settings | Profile fields + AI/3D toggles | Gated by mocked `isAuthenticated` | `SettingsView` | None (no API call on save) | Edit name/email locally, toggle two checkboxes, "Save Changes" (local-only, shows a checkmark + toast) |
| `auth` | Auth Portal | Login / Register / Guest access | N/A (this *is* the gate) | `AuthPortalView`, `BackgroundShader` | None (fully mocked, see §7) | Switch Login/Register tab, submit form (mocked), "Instant Guest Access" |

### Page detail: Dashboard
- **Route:** `dashboard` (tab)
- **Purpose:** Landing screen after "auth"; surfaces quick actions and current resume telemetry.
- **Who can access it:** Anyone past the mocked auth gate (i.e., everyone, immediately).
- **Layout:** Max-width centered column; 3-column bento grid (welcome card spans 2, AI-advisor card spans 1) → 4-column metric card grid → activity timeline card.
- **Major sections:** Welcome/quick-actions bento, Telemetry Overview (4 metric cards bound to `resumeData.metrics`), Activity Timeline (bound to `activities` state).
- **Data displayed:** `resumeData.metrics.{resumeScore,jdMatchRate,profileViews,aiCredits}`; `activities[]`.
- **API calls:** None directly; buttons open modals (`AIGenerateModal`, `JDMatcherModal`) or call `onNewResume`/`setActiveTab`.
- **User interactions:** "Generate Resume with AI", "New Workspace", "Match Job Description", click AI-advisor card → Chat tab.
- **Loading states:** None (this view itself performs no async work).
- **Empty states:** **Not implemented** — if `activities` is empty (the default on first load, since `mockData` seeding is commented out), the Activity Timeline section renders its header with a completely empty body and no "no activity yet" message.
- **Error states:** None applicable (no fetches from this view).
- **Navigation:** Side nav + top bar tabs; in-card buttons switch tabs or open modals.
- **Responsive behavior:** `grid-cols-1 md:grid-cols-3` (bento) and `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` (metrics).

### Page detail: Resume Studio
- **Route:** `studio`
- **Purpose:** Primary content-editing surface; the "product" of the app.
- **Who can access it:** Anyone past the auth gate.
- **Layout:** Two-pane: fixed ~500px left accordion editor + flexible right 3D/flat preview viewport.
- **Major sections (left, accordion):** JD Matcher shortcut bar, Personal Info, Experience (repeatable, with per-bullet AI-optimize), Skills, Education (repeatable), Projects (repeatable); footer with "Save Draft" and (implicitly) AI Review trigger.
- **Major sections (right):** Viewport toolbar (template switch, 3D/flat toggle, zoom in/out/reset, Export PDF), ambient "Live 3D Viewport" badge, the `ResumeDocument` itself rendered inside a tilting/scaling wrapper.
- **Components:** `ResumeStudioView` (editor logic), `ThreeResumeCanvas` (viewport chrome + tilt/zoom + print trigger), `ResumeDocument` (printable markup, 3 template variants: modern/minimal/executive).
- **Data displayed:** The full live `resumeData` object, two-way bound.
- **API calls:** `/api/optimize` for (a) a single experience bullet and (b) the personal-info summary.
- **User interactions:** Edit any text field; add/remove experience entries, bullets, education entries, projects; per-bullet "AI optimize" button; toggle 3D/Flat; cycle template (Modern → Minimal → Executive → Modern); zoom/rotate/reset; Export PDF (browser print dialog); Save Draft (confetti + toast, no persistence).
- **Loading states:** Per-bullet spinner via `optimizingIndex`; section-level spinner via `isOptimizingSection`; viewport "Exporting..." label for ~400 ms before `window.print()` fires.
- **Empty states:** Not designed for (arrays start non-empty once a resume is created via `handleNewResume`/AI generation; deleting all experience/education/project items is possible via the trash-icon buttons and produces an empty section list with no explicit "add your first X" prompt beyond the existing "+" add button, which does remain visible).
- **Error states:** `/api/optimize` failures fall back to a client-side templated bullet rewrite (see `ResumeStudioView.handleAIBulletOptimize` catch block) rather than showing an error message.
- **Navigation:** Accordion sections toggle open/closed one at a time (`activeSection` string state); modals (`JDMatcherModal`, `AIReviewModal`, `AIGenerateModal`) are reachable from within this view.
- **Responsive behavior:** Left panel is `w-full lg:w-[500px]` — on narrow screens it does not clearly coexist with the right viewport (see §19).

### Page detail: AI Chat Hub
- **Route:** `chat`
- **Purpose:** Freeform + slash-command-styled AI conversation, contextualized with the current resume.
- **Who can access it:** Anyone past the auth gate.
- **Layout:** Left 320px column (3D brain visualization + contextual suggestion chips, hidden below `lg`) + flexible chat panel (message stream + input bar).
- **Major sections:** 3D "AI brain" hero panel, "Contextual Suggestions" chip list (`/optimize`, `/analyze`, `/format` canned prompts), message stream (user/AI bubbles), input bar (textarea + send + fake attach button).
- **Data displayed:** `messages[]` (session-only, starts empty every load), resume-derived context sent silently with each request (`targetRole`, `currentSummary`, `recentRole`, `skills`).
- **API calls:** `/api/chat` per message.
- **User interactions:** Type + send (Enter to send, Shift+Enter for newline), click a suggestion chip (auto-sends its canned prompt), copy an AI-suggested "option" block to clipboard, click paperclip (shows an `alert()`, does not actually attach anything).
- **Loading states:** Animated three-dot "typing" bubble while awaiting the AI reply.
- **Empty states:** Not implemented — with `messages` starting empty, the message stream renders with nothing but its own bottom-scroll anchor and no "start a conversation" placeholder.
- **Error states:** On fetch failure, a hardcoded "high-impact architectural rewrite" AI-style message is injected as if it were a real reply (masks the failure from the user entirely).
- **Navigation:** N/A beyond global nav.
- **Responsive behavior:** Left panel `hidden lg:flex` — mobile/tablet users only ever see the chat stream, no suggestion chips.

### Page detail: Analytics
- **Route:** `analytics`
- **Purpose:** Present ATS-readiness "telemetry."
- **Who can access it:** Anyone past the auth gate.
- **Layout:** 3-card top row + 2-column detail grid.
- **Data displayed:** **All hardcoded** (98/100 ATS index, 83% quantified-impact, "Top 5%" action-verb density, fixed 96/92/84/89% category bars, fixed checklist items) — none of it derives from the `data` prop that is passed in (confirmed: `data` is never referenced in the component body). This is a functional gap, not just a visual one — see §14/§15.
- **API calls:** None.
- **User interactions:** "Re-Scan Against Job Description" → opens `JDMatcherModal`.
- **Loading/Empty/Error states:** N/A (static content only).
- **Responsive behavior:** `grid-cols-1 md:grid-cols-3` and `grid-cols-1 lg:grid-cols-2`.

### Page detail: Settings
- **Route:** `settings`
- **Purpose:** Placeholder account/preferences screen.
- **Data displayed:** Name/email seeded from `resumeData.personalInfo` (not a real account record).
- **API calls:** None — `onSave` only triggers a parent-level toast; nothing is persisted or sent to any backend.
- **User interactions:** Edit two text fields, toggle two checkboxes (uncontrolled, `defaultChecked`, so their state cannot even be read back by the app), submit form.
- **Loading/Empty/Error states:** A 2-second local "Preferences Saved!" checkmark swap; no real error path exists since there's no request.

### Page detail: Auth Portal
- See §7 for the full (lack of) authentication behavior.
- **Layout:** Centered glass card over the animated `BackgroundShader` canvas.
- **User interactions:** Switch Login/Register tab, "Forgot?" (shows an `alert()`), submit (mocked), "Instant Guest Access" bypass.

---

## 11. COMPONENT INVENTORY

### Navigation
- **`SideNavBar`** — Fixed 80px rail that expands to 250px on hover; icon+label buttons for each tab; two "quick action" buttons (Open AI Generator, New Workspace) pinned near the top. Props: `activeTab`, `setActiveTab`, `onNewResume`, `onOpenAIGenerator`.
- **`TopAppBar`** — Secondary nav links (Studio/Workspace — note: these only toggle between `studio` and `dashboard`, duplicating part of the side nav), a search box (non-functional, see §9), an AI Generator shortcut, a notifications bell with a static two-item popover, a help button (`alert()`-based instructions), and a static avatar image.

### Data Display
- **Metric cards** (Dashboard, inline JSX, not extracted into a shared component) — score/progress-bar cards.
- **Activity Timeline** (Dashboard, inline) — vertical timeline with connecting line and type-based icon.
- **`ResumeDocument`** — the printable resume itself; effectively a "data display" component keyed by `templateStyle`.

### Forms
- Plain HTML `<input>`/`<textarea>`/`<select>` elements styled via the `.input-glass` utility class or raw Tailwind, used inline throughout `ResumeStudioView`, `AIGenerateModal`, `JDMatcherModal`, `SettingsView`, `AuthPortalView`. **No shared `<Input>`/`<Select>`/`<TextArea>` component exists** — styling is duplicated per usage site (a maintenance/consistency risk, see §14).

### Feedback
- **Toast** — single global instance in `App.tsx` (fixed bottom-right, green accent, auto-dismiss).
- **Modals** — `AIGenerateModal`, `JDMatcherModal`, `AIReviewModal` (each self-contained, each reimplementing its own backdrop/card chrome).
- **Loading indicators** — per-action booleans driving spinner icons (`animate-spin` on `Wand2`/`RefreshCw`) or text swaps ("Generating...", "Scanning...", "Exporting...").
- **Error states** — no dedicated error component; errors are masked with fallback content (see §14/§18).

### Specialized Components
- **`ThreeAIBrain`** — Three.js wireframe icosahedron + inner sphere + two colored orbital rings, animated continuously; purely decorative, no data binding, used only in `AIChatView`.
- **`BackgroundShader`** — Raw WebGL (not Three.js) fragment shader painting an animated dark gradient with mouse-reactive `u_mouse` uniform; used only behind `AuthPortalView`.
- **`ThreeResumeCanvas`** — Not literally Three.js (misleading name) — it's a CSS 3D-transform (`rotateX/rotateY` via mouse position) wrapper around the flat `ResumeDocument`, plus the export/zoom/template toolbar.
- **Markdown renderer** — a bespoke regex-based `markdownToHtml()` function inside `AIChatView.tsx` (headers, bold/italic, inline code, blockquote, hr, lists, links) rendered via `dangerouslySetInnerHTML`. **Not a sanitized renderer** — see §22 (XSS surface).

---

## 12. USER FLOWS

### Flow A — First-time generation
```text
Auth Portal (any button) 
 ↓
Dashboard 
 ↓ "Generate Resume with AI"
AIGenerateModal (pick preset or fill role/level/skills/JD) 
 ↓ POST /api/generate-resume
Resume Studio (auto-navigated here, resume state replaced, activity logged, toast shown)
 ↓
Edit fields / AI-optimize individual bullets (POST /api/optimize)
 ↓
Export PDF → browser print dialog (window.print())
```
Success state: toast + confetti + auto-navigation to Studio. Failure state: inline red error banner inside the modal (`errorMsg`), modal stays open.

### Flow B — JD-driven tailoring
```text
Dashboard or Studio → "Match Job Description"
 ↓
JDMatcherModal (paste JD or pick a sample) → POST /api/match-jd
 ↓
View match %, matched/missing keyword chips, recommendations
 ↓ "1-Click Auto-Merge Missing Keywords into Resume"
App.handleApplyJDMatches → merges missingKeywords into skills.tools,
bumps jdMatchRate/resumeScore, logs activity, toast shown
```
⚠️ Because of the field-name mismatch (§14), `matchRate` read from the response is `undefined` in the success path, so `Math.max(prev.metrics.jdMatchRate, undefined)` evaluates to `NaN`, silently corrupting the `jdMatchRate` metric whenever the live Gemini call succeeds and returns its (correctly-named, per the schema) `matchScore` field. Only the JSON-parse-failure/catch-block path in `JDMatcherModal` (which hardcodes `matchRate: 91`) produces a numerically valid result.

### Flow C — Executive audit
```text
Studio → (AI Review trigger) → AIReviewModal opens → auto-fires POST /api/ai-audit on open
 ↓
View grade/strengths/weaknesses/suggested summary
 ↓ "Apply Recommended Summary to Resume"
App.handleApplyAIImprovement → personalInfo.summary replaced, resumeScore +4, activity logged, modal closes
```

### Flow D — Conversational assistance
```text
Chat tab → type message or click a suggestion chip → POST /api/chat (with resume context)
 ↓
AI reply rendered as markdown; if the reply included "options", user can copy them
 ↓ (only wired for the very first experience bullet)
AIChatView.onApplyOptionToResume → overwrites experience[0].bullets[0] only, regardless of which
 option or which bullet the user actually intended to replace
```

### Flow E — "Login"
```text
Auth Portal → fill form → submit (or "Instant Guest Access")
 ↓ (600ms artificial delay, no network call)
isAuthenticated = true → Dashboard
```

---

## 13. FEATURE → API → UI MAPPING

| Feature | Frontend Page | Component | API Endpoint (live) | Backend Service | Database |
|---|---|---|---|---|---|
| AI resume generation | Dashboard, Studio | `AIGenerateModal` | `POST /api/generate-resume` | Express (`server.ts`) → Gemini `gemini-3.6-flash` | None (nothing persisted) |
| PDF/print export | Studio | `ThreeResumeCanvas` → `ResumeDocument` | None (client-only `window.print()`) | — | — |
| Bullet/summary AI optimize | Studio | `ResumeStudioView` | `POST /api/optimize` | Express → Gemini | None |
| Executive audit | Studio (modal) | `AIReviewModal` | `POST /api/ai-audit` | Express → Gemini | None |
| JD match & keyword merge | Dashboard, Studio, Analytics | `JDMatcherModal` | `POST /api/match-jd` | Express → Gemini | None |
| AI chat | Chat tab | `AIChatView` | `POST /api/chat` | Express → Gemini | None |
| Dashboard telemetry | Dashboard | `DashboardView` | None (reads local `resumeData.metrics`) | — | — |
| Analytics telemetry | Analytics | `AnalyticsView` | None (fully static) | — | — |
| Settings | Settings | `SettingsView` | None | — | — |
| Auth (as designed, unused) | Auth Portal | `AuthPortalView` | `POST /api/auth/register`, `POST /api/auth/login` | FastAPI (`backend/app`) | SQLite `users` table |
| Resume persistence (designed, unbuilt) | — | — | *(no endpoint exists)* | FastAPI | SQLite `resumes` table (model only, unused) |

---

## 14. CURRENT UI/UX ANALYSIS

### Visual Design
- **Typography:** Three-font system — Inter (body), Plus Jakarta Sans (headings/brand), JetBrains Mono (labels, badges, metrics, "telemetry"-styled numbers) — applied fairly consistently via utility classes and the `.font-mono` rule in `index.css`.
- **Color system:** A cohesive dark, "cyber/HUD" palette anchored on an emerald accent (`#4edea3`) with CSS custom properties defined once (`:root` in `index.css`) but **inconsistently referenced afterward** — most components hardcode raw hex/Tailwind-bracket colors (`bg-[#111827]`, `text-[#c0c1ff]`, `border-[#1F2937]`) rather than the declared `--color-*` variables, so the token layer exists but is not the actual source of truth in practice.
- **Spacing:** Generally consistent Tailwind spacing scale; card padding is fairly uniform (`p-4`/`p-6`).
- **Borders/Shadows/Cards:** Heavy use of soft glow shadows (`shadow-[0_0_20px_rgba(...)]`) and glassmorphism (`backdrop-blur`), applied per-component rather than through a shared `Card` component — each card's border/radius/shadow combination is retyped at every call site.
- **Buttons:** At least three visually distinct button "families" in use (gradient emerald→blue CTA, outlined glass button, solid emerald "primary" pill) with no single source-of-truth button component — every button's full class string is duplicated across files.
- **Forms:** Consistent dark-input look (`.input-glass` / raw Tailwind equivalents), but two different implementations of the same visual style coexist (the utility class vs. inline Tailwind), so a change to one won't propagate to the other.
- **Icons:** Consistent (`lucide-react` throughout).
- **Visual hierarchy:** Generally strong on the Dashboard/Studio (clear primary CTA, bento layout); weaker in Settings (visually under-designed compared to the rest of the app).

### UX
- **Navigation:** Two overlapping navigation surfaces (`SideNavBar` full tab set + `TopAppBar` partial tab set covering only Studio/Dashboard) creates redundant, slightly inconsistent affordances for switching between the same two views.
- **Information architecture:** Six flat tabs with no sub-navigation; acceptable for the current feature count but will not scale if resume "list/manage multiple resumes" is ever added (there is currently no concept of multiple saved resumes at all — only one `resumeData` object exists in memory at a time).
- **Discoverability:** The AI Generator is discoverable (three separate entry points: side nav, top bar, Studio header), which is good; the Executive Audit ("AI Review") flow's *entry point is not obvious* — `AIReviewModal`'s `onOpenAIReview` handler is wired from `ResumeStudioView`'s props but the actual trigger button for it was not found to be rendered anywhere with clearly-audit-specific labeling in the reviewed accordion markup — cross-check this specific entry-point wiring against the live app before redesign (UNKNOWN — the prop is threaded through but the specific JSX button invoking `onOpenAIReview` should be re-verified against the deployed build).
- **Feedback:** Toasts + confetti are used generously and consistently for success states.
- **Error handling (UX-level):** Because every failure path is masked with plausible fallback content (see §18), **the user is never shown that anything went wrong** — this is a deliberate design choice for demo resilience but is a real UX/trust problem in production (a user editing with a dead/invalid Gemini key has no way to know their "AI" results are actually a canned template).
- **Loading states:** Present and reasonably clear at the point of use, but inconsistent in style (spinning icon vs. text-only "Generating..." vs. animated dots).
- **Empty states:** Missing in Dashboard (empty activity feed), Chat (empty message stream) — both simply render nothing.
- **Accessibility:** See §20.
- **Responsive behavior:** See §19.

### Technical UI Issues
**Functional problems:**
- `AnalyticsView` ignores its `data` prop entirely — all numbers are hardcoded and never reflect the user's actual resume.
- `JDMatcherModal` reads `data.matchRate`/`data.matchedKeywords` from a response whose real (both Express- and FastAPI-documented) field names are `matchScore`/`matchedSkills` — a live Gemini response will silently fail to populate the match card correctly, always falling through to the modal's own hardcoded defaults (`89`/canned keyword arrays) instead of the real AI output.
- `TopAppBar`'s search input has no consumer — typing into it does nothing.
- `SettingsView`'s two checkboxes are uncontrolled (`defaultChecked`) — their toggled state is unreadable by the rest of the app and is not saved anywhere.
- `SettingsView.onSave`, `handleSaveDraft` (Studio), and the entire Auth flow perform **no network I/O** — nothing a user does in this app currently survives a page refresh.
- `mockData.ts`'s `initialResumeData`/`initialActivities`/`initialChatMessages` exports are dead code (import is commented out in `App.tsx`); only `avatarUrls` from that file is used.
- `AIChatView.onApplyOptionToResume` always overwrites `experience[0].bullets[0]`, regardless of which experience entry or bullet index the suggestion was actually relevant to.
- `backend/app/routers/auth.py`'s `/api/auth/me` endpoint is implemented incorrectly (`Depends(lambda db, token: None)` does not resolve `db`/`token` as FastAPI dependencies the way `Depends(get_current_user)` would) and additionally imports `get_current_user` inside the function body without using it — this endpoint will not behave as intended if ever called.
- `Resume.user_id` has no FK constraint to `users.id`.

**Visual/design problems:**
- No shared `Button`/`Card`/`Input`/`Modal` components — every visual pattern is copy-pasted with slightly different class strings across files, risking visual drift over time.
- CSS custom properties (`--color-*`) defined in `index.css` are largely unused in favor of raw hardcoded hex values in Tailwind arbitrary-value syntax.
- Two parallel dark-input styles (`.input-glass` utility vs. inline Tailwind equivalents) exist for what should be one control style.

---

## 15. WHAT MUST NOT CHANGE

### MUST PRESERVE
- The `/api/*` **contract shapes** currently consumed by the frontend (request/response field names for `generate-resume`, `ai-audit`, `chat`, `optimize`, `match-jd`) — a visual redesign must not require these to change, since the Express server is the sole live backend.
- The relative-path, same-origin `fetch('/api/...')` calling convention (no base-URL config exists to change without also touching `server.ts`/deployment).
- The `ResumeData` TypeScript shape (`types.ts`) end-to-end, since it round-trips through the AI endpoints, the editor, and the printable document.
- The three `ResumeDocument` template variants' printability (`@media print` CSS rules, `window.print()` trigger) — this is the only working "export" mechanism in the app.
- The Express server's dual role as both static/dev asset host and API host (a redesign that assumes a separate API origin will break the current single-container deployment model unless the routing is explicitly re-architected).

### SAFE TO REDESIGN
- All visual styling: colors, spacing, typography, card/button/input treatments, the glassmorphism aesthetic, the 3D tilt effect, the specific `BackgroundShader`/`ThreeAIBrain` decorations.
- The navigation chrome (`SideNavBar`/`TopAppBar` layout, or replacing the tab-string routing with a real router) as long as the same six logical views/actions remain reachable and the same data flows into them.
- The internal component decomposition (extracting shared `Button`/`Card`/`Input`/`Modal` components) — encouraged, since none currently exist.
- Any of the currently-hardcoded/dead UI (`AnalyticsView`'s static numbers, `SettingsView`'s non-functional toggles) — these can be redesigned and *should* be reconnected to real data as part of the same effort, since they are not meaningfully "existing functionality" today (they display fabricated data, not user data).
- The Auth Portal's visual design entirely — but see §16 for what would be required to make it *functionally* real, which is a backend-wiring task, not a pure frontend redesign task.

---

## 16. FRONTEND REDESIGN BOUNDARIES

### Can change (pure frontend, no backend coordination needed)
- Visual design system: colors, typography, spacing scale, border radius, shadows, card treatments.
- Component structure/composition (introducing shared primitives).
- Navigation presentation (sidebar/topbar layout, adding a client-side router for real URLs — this does not require backend changes since there are no server-rendered routes to break).
- Dashboard/Analytics/Settings composition and layout.
- Animations, the 3D/glass aesthetic, confetti usage.
- Making the (currently hardcoded) Analytics view and Settings toggles *look* wired, and even wiring Analytics to derive its numbers from the real `resumeData` client-side (this is a frontend-only fix — no new endpoint is required since the raw resume data is already in the browser).
- Fixing the `JDMatcherModal` field-name bug (`matchScore`/`matchedSkills` vs. `matchRate`/`matchedKeywords`) is a **frontend-only** fix, since the backend already returns the "correct" (schema-documented) names — this does not require any backend change.

### Should NOT change without backend changes
- The `/api/*` endpoint paths and HTTP methods (`POST /api/generate-resume`, etc.) — changing these requires updating `frontend/server.ts` in lockstep (and, if it is ever wired up, `backend/app/routers/api.py` too).
- The `GenerateResumeRequest`/`ResumeData`/`MatchJDResponse`/etc. field shapes — changing these requires updating both the Express handlers and the Pydantic schemas to stay consistent (currently they are two hand-maintained copies of the same contract with no shared source of truth).
- Making Settings/Auth *actually* persist data — this requires either wiring the frontend to the existing-but-orphaned FastAPI backend (adding a reverse proxy or absolute base URL + CORS handling) or building new persistence endpoints on the Express server; it cannot be done as a pure visual redesign.
- Making "Save Draft" actually save anything — same as above; no persistence endpoint currently exists for `Resume` records despite the DB model being present.
- Introducing real authentication/session gating — requires connecting the existing FastAPI `register`/`login` endpoints (or an equivalent) to the frontend, storing a token, and attaching it to subsequent requests; none of this exists today.

---

## 17. ENVIRONMENT & CONFIGURATION

| Variable | Where used | Required | Default | Notes |
|---|---|---|---|---|
| `GEMINI_API_KEY` | Both `frontend/server.ts` and `backend/app/config.py` | Effectively yes (else fallback/demo content only) | `""` | SECRET FOUND — VALUE OMITTED (not present in repo; only `.env.example` placeholders are committed) |
| `SQLALCHEMY_DATABASE_URL` | `backend/app/config.py` | No | `sqlite:///./resume.db` | Only Postgres/MySQL URL *would* work if changed; untested in this repo |
| `SECRET_KEY` | `backend/app/config.py`, `OAuth2.py` | No (but should be, for real use) | `"change-me-in-production-use-a-256-bit-secret-key-here"` — a **placeholder secret is hardcoded as the default** and is also hardcoded again directly in `dockercompose.yml` (`SECRET_KEY=change-me-in-production`) | Security concern — see §22 |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `backend/app/config.py` | No | `60` | |
| `ALGORITHM` | `backend/app/config.py` | No (not exposed as env var, hardcoded in class) | `"HS256"` | |
| `DISABLE_HMR` | `frontend/vite.config.ts`, `dockercompose.yml` | No | unset (HMR on) | Set to `"true"` in compose; disables Vite watch/HMR but does **not** produce a production build — the container still runs `npm run dev` |
| `APP_URL` | `frontend/.env.example` only | No | — | Documented as an "AI Studio" runtime injection; **not read anywhere in `server.ts` or any frontend source file** (UNKNOWN why it's documented — likely leftover from the Google AI Studio scaffold this project was bootstrapped from) |

**Feature flags:** None found.
**Dev vs. production config:** The only production-mode branch is in `server.ts`'s `setupVite()` (`NODE_ENV === "production"` serves `dist/` + SPA fallback instead of Vite middleware); `dockercompose.yml` does not set `NODE_ENV`, so the compose-based "production" deployment actually still runs the Vite dev server.

---

## 18. ERROR / LOADING / EMPTY STATES

| Scenario | Current behavior |
|---|---|
| Gemini API key missing | Both backends silently serve hardcoded, realistic-looking fallback resume/audit/chat/optimize/match data — no error surfaced to the user anywhere. |
| Gemini call throws/malformed JSON | Express: `generate-resume` returns HTTP 500 `{error}`, which `AIGenerateModal` surfaces as an inline red banner; `chat`/`optimize`/`match-jd`/`ai-audit` on the *frontend* additionally have their own client-side `catch` blocks that inject fallback content, so in practice the user rarely sees the 500 path except for resume generation specifically. FastAPI equivalents catch internally and return HTTP 200 with fallback content (no error ever surfaces from that stack, but it isn't reachable anyway). |
| Validation errors | Not applicable on the Express side (no validation performed). On FastAPI, standard Pydantic 422 responses — not exercised by the live UI. |
| Authentication errors | Not applicable — no real auth flow is exercised (see §7). |
| Network failure (fetch throws) | Every calling component has a local `catch` that injects a plausible hardcoded fallback (see §14) rather than showing a network-error message. |
| Empty datasets | Dashboard activity feed and Chat message list render as blank (no explicit empty-state copy or illustration) when their arrays are empty. |
| Loading states | Present per-action (see §9/§14); no global loading skeletons. |
| Failed uploads | Not applicable — no file upload exists (the chat "attach" button is a stub `alert()`). |
| Failed processing | N/A — no long-running/background processing exists. |
| Permission errors | Not applicable — no authorization checks exist anywhere in the live app. |
| 404 pages | Not applicable — no client-side router exists to have unmatched routes; the FastAPI backend's SPA-fallback route (`/{full_path:path}`) returns `{"detail": "Frontend dist not built yet"}` if `backend/dist` doesn't exist, which it never will in the current compose setup since the frontend is a separate container. |
| Unexpected/uncaught errors | React 19's default error boundary behavior (uncaught render errors would blank the app) — **no custom Error Boundary component was found anywhere in the frontend source.** |

---

## 19. RESPONSIVE DESIGN

- **Breakpoints used:** Tailwind defaults — `sm` (640px), `md` (768px), `lg` (1024px) — no custom breakpoints defined in `vite.config.ts`/Tailwind config beyond the framework defaults (no `tailwind.config.*` file was found in the repo at all; Tailwind 4's CSS-first config means there may be none needed, but this also means **no project-specific breakpoint/theme customization exists** — UNKNOWN whether this is intentional).
- **Sidebar:** `SideNavBar` is `fixed`, always rendered (no off-canvas/hamburger collapse for narrow viewports) — on a phone-width screen it will always occupy 80px of a very constrained width, and its hover-to-expand-to-250px interaction is a poor fit for touch devices (no tap-to-expand fallback was found).
- **Studio two-pane layout:** Left editor panel is `w-full lg:w-[500px]` — below `lg` it becomes full-width, but there is no evidence of the right preview viewport being hidden/tabbed away on narrow screens, so both panels likely compete for space or stack in an unreviewed way below 1024px (UNKNOWN — needs live-viewport verification; the static markup does not include a mobile-specific view-switcher for Studio).
- **AI Chat left panel:** Explicitly `hidden lg:flex` — cleanly hidden below `lg`, a deliberate mobile simplification.
- **Grids:** Dashboard/Analytics use responsive `grid-cols-1 → sm/md/lg` step-ups consistently.
- **Tables:** N/A (no tables in the app).
- **Modals:** Fixed `max-w-2xl`/`max-w-md` with `p-4` outer padding and internal scroll (`overflow-y-auto`) — should reflow reasonably on mobile, not specifically verified live.
- **Overflow issues:** Not verified live; UNKNOWN beyond static code reading. The 3D tilt/zoom preview's `overflow: auto` container plus a `perspective` transform could interact awkwardly with mobile scroll/touch — flagged for live testing, not confirmed as a bug from source alone.

---

## 20. ACCESSIBILITY

- **Semantic HTML:** Reasonable use of `<header>`, `<nav>`, `<main>`, `<section>` in several views, but many interactive "tab" elements are `<button>`s without `role="tab"`/`aria-selected` semantics (no ARIA tab pattern implemented for the Side/Top nav or the Studio accordion).
- **Keyboard navigation:** Standard tab order via native `<button>`/`<input>` elements should mostly work by default; no custom keyboard traps were found, but no explicit keyboard shortcuts or focus-management code exists either (e.g., opening a modal does not appear to move focus into it or trap focus — UNKNOWN/NOT VERIFIED LIVE, no `aria-modal`, `role="dialog"`, or focus-trap logic found in any modal's source).
- **Focus states:** Relies on Tailwind's default/`focus:outline-none` + custom `focus:border-[#4edea3] focus:ring-*` styles on inputs — visible focus rings are removed (`focus:outline-none`) and replaced with color/glow changes, which is common but should be checked for sufficient contrast/visibility (not measured here).
- **ARIA usage:** Minimal to none found (no `aria-*` attributes located via source inspection of the component files).
- **Color contrast:** Not measured; the AI Chat and modal text use light gray (`text-slate-400`, `text-slate-300`) on very dark backgrounds, which is a common contrast risk area worth auditing.
- **Form labels:** Present as visual `<label>` elements above inputs in most forms (Auth, AI Generate, JD Matcher, Settings), but `<label>`/`<input>` are not linked via `htmlFor`/`id` pairs anywhere found — they are visually associated only, not programmatically associated for screen readers.
- **Screen-reader considerations:** The bespoke markdown-to-HTML chat renderer injects raw HTML via `dangerouslySetInnerHTML` with no semantic landmarks beyond what the regex produces; icon-only buttons (e.g., zoom, template switch, notifications bell) rely on a `title` attribute (tooltip) rather than `aria-label`, which is a weaker screen-reader affordance.
- **Interactive element accessibility:** Buttons are true `<button>` elements throughout (good baseline), but several "clickable card" patterns (e.g., the Dashboard's AI-advisor card, using `onClick` on a `<div>`) are not natively keyboard-operable or announced as interactive (no `role="button"`/`tabIndex`/`onKeyDown` found on that `<div>`).

---

## 21. PERFORMANCE CONSIDERATIONS

- **Lazy loading / code splitting:** None found — no `React.lazy`/`Suspense` usage, no dynamic `import()` calls for routes/views; all six views and all modals are bundled and mounted eagerly (though only the active one is rendered).
- **Pagination:** N/A (no lists large enough to need it currently exist).
- **Debouncing:** Not found — the `TopAppBar` search input has no debounce (moot, since it's also functionally disconnected — see §14).
- **Caching:** None (no `React Query`/SWR, no HTTP caching headers set by `server.ts`).
- **Memoization:** No `useMemo`/`useCallback`/`React.memo` usage found anywhere in the reviewed components — every keystroke in the Studio editor triggers a full `App`-level state update and re-render of whichever view is active plus its children.
- **Image optimization:** The single external avatar image (`avatarUrls.user1`, sourced from `mockData.ts`) is loaded directly with no responsive `srcset`/lazy `loading="lazy"` attribute found.
- **API optimization:** Each modal/action fires its own independent request with no batching/dedup; `AIChatView` does not send prior conversation `history` to the backend despite the schema supporting it (see §6), so multi-turn context is not actually preserved server-side beyond what's baked into the system prompt each call.
- **Virtualization:** N/A (no long lists exist).
- **3D/WebGL cost:** Two independent always-running render loops (`ThreeAIBrain`'s `requestAnimationFrame` Three.js scene, `BackgroundShader`'s raw WebGL loop) plus a CSS-transform-based tilt effect in the Studio viewport — all continuous-animation, which is a real (if unmeasured) battery/CPU cost on lower-end devices; no found mechanism to pause them when their view/tab is not visible (no `IntersectionObserver`/visibility-based pausing).

---

## 22. SECURITY CONSIDERATIONS

**Implemented:**
- Password hashing via `bcrypt` (`passlib`) for the FastAPI `User` model.
- JWT signing (HS256) with an expiry (`ACCESS_TOKEN_EXPIRE_MINUTES`) for the (unused) FastAPI auth flow.
- Basic input typing/validation via Pydantic on the FastAPI side.

**Potential concerns:**
- **No authentication or authorization is enforced anywhere in the live application** (see §7) — every AI endpoint on the Express server is open, unauthenticated, and unrate-limited.
- **CORS is wide open** on the FastAPI service: `allow_origins=["*"]` combined with `allow_credentials=True` in `backend/app/main.py` — this specific combination is invalid/unsafe per the CORS spec (browsers will reject credentialed requests with a wildcard origin, and if it were narrowed to allow credentials it would need an explicit origin list) — flagged as a configuration bug as well as a hardening item, even though this backend is currently orphaned.
- **Hardcoded default `SECRET_KEY`** committed in both `backend/app/config.py`'s Pydantic default and again literally in `dockercompose.yml` (`SECRET_KEY=change-me-in-production`) — if the FastAPI backend were ever wired up and deployed without overriding this, all issued JWTs would be forgeable by anyone with the public repo.
- **`backend/resume.db` (a real SQLite database file) is committed to version control** and is not listed in `.gitignore` (only `.env*` patterns are ignored) — currently empty (0 rows) at time of analysis, but this is a bad practice that risks committing real user credentials/PII in the future if the backend is ever put into real use without fixing this.
- **No CSRF protection** — not applicable in the strictest sense since there's no cookie-based session, but also means there is nothing in place should session-cookie auth ever be added later.
- **No rate limiting** on any AI endpoint (either backend) — a real Gemini key wired into this app today would have no protection against abusive/expensive request volume.
- **No input sanitization before AI prompt interpolation:** user-supplied `text`, `message`, `jobDescription`, etc. are interpolated directly into Gemini prompts via template strings/f-strings with no escaping — a classic prompt-injection surface (low severity here since the AI only returns JSON/text back into a resume editor, but worth naming).
- **Client-side `dangerouslySetInnerHTML` of AI-generated content** (`AIChatView`'s custom markdown renderer, and the "options" card renderer) with only a basic `&`/`<`/`>` escape pass before re-introducing HTML tags via regex — this is a **self-XSS-adjacent risk**: if a Gemini response (or a manipulated/malicious prompt-injected response) ever included something like an `href="javascript:..."` link via the supported `[text](url)` markdown syntax, it would be rendered without a protocol allowlist/sanitizer.
- **File upload button is a stub**, so no file-upload attack surface currently exists (worth confirming this remains true if that feature is ever implemented for real).

---

## 23. TESTING

**No test files, test framework configuration, or test scripts were found anywhere in the repository** — neither `frontend/package.json` nor `backend/requirements.txt` references a testing library (no Jest/Vitest/Playwright/Cypress on the frontend; no `pytest` on the backend), and no `__tests__`/`*.test.*`/`*.spec.*` files exist in the tree. `frontend/package.json`'s only quality-related script is `"lint": "tsc --noEmit"` (a type-check, not a lint or test run). This is UNKNOWN/NOT FOUND IN REPOSITORY across unit, integration, and E2E categories for both stacks.

---

## 24. DEPLOYMENT & INFRASTRUCTURE

- **Docker:** Two `Dockerfile`s — `backend/Dockerfile` (`python:3.11-slim`, installs `requirements.txt`, runs `uvicorn app.main:app --host 0.0.0.0 --port 8000`) and `frontend/Dockerfile` (`node:20-alpine`, `npm install`, `EXPOSE 5173`, but `CMD ["npm", "run", "dev", "--", "--host"]` which actually runs `tsx server.ts` per `package.json`'s `dev` script — **the `EXPOSE 5173` is inconsistent with the app's actual hardcoded port 3000**, and the `-- --host` flag is meaningless to `tsx server.ts`/Express, which already binds `0.0.0.0` unconditionally in code).
- **Docker Compose:** `dockercompose.yml` defines `backend` (port `8000:8000`) and `frontend` (port `3000:3000`, `depends_on: backend`) services, both with bind-mounted source volumes (`./backend:/app`, `./frontend:/app` + an anonymous `/app/node_modules` volume) — this is a **development-oriented** compose file (live-reload-friendly bind mounts) rather than an immutable production image build, despite being the only orchestration file in the repo.
- **CI/CD:** No `.github/workflows/`, `.gitlab-ci.yml`, or other CI configuration found. UNKNOWN/NOT FOUND IN REPOSITORY.
- **Cloud services / hosting:** None referenced in code or config (no Vercel/Netlify/Cloud Run/AWS config files found), aside from the `frontend/.env.example`'s comment about "AI Studio" auto-injecting `GEMINI_API_KEY`/`APP_URL` at runtime — implying this project originated from (or was scaffolded via) Google's AI Studio "build" flow, though no other Cloud Run/AI-Studio-specific deployment files are present in this repo snapshot.
- **Build process:** `frontend/package.json`'s `build` script (`vite build && esbuild server.ts --bundle --platform=node --format=cjs ...`) does produce a real production bundle (`dist/`) and a bundled server (`dist/server.cjs`), runnable via the `start` script — but **this build path is not what `dockercompose.yml`/`frontend/Dockerfile` actually exercises** (they run `dev`, not `build`+`start`).
- **Ports:** Backend `8000`; frontend `3000` (despite the Dockerfile's stale `EXPOSE 5173`).
- **Reverse proxy:** None configured anywhere (no Nginx/Traefik/Caddy config found) — this is directly relevant to why the FastAPI backend is unreachable from the SPA (see §4/§15).

---

## 25. DESIGN-READY APPLICATION SPECIFICATION

```text
APPLICATION
├── Purpose: AI-assisted resume building/tailoring for technical roles
├── Users: Individual technical job-seekers (no team/org/multi-user concepts exist)
├── Core Features: AI resume generation, structured manual editing with live preview,
│                    JD match scoring + keyword merge, executive AI audit, AI chat coach,
│                    print-based PDF export
├── Pages: Dashboard, Resume Studio, AI Chat, Analytics, Settings, Auth Portal (tab-based, no URLs)
├── Navigation: SideNavBar (all 6) + TopAppBar (Studio/Dashboard only) — redundant, no deep links
├── Authentication: Designed (FastAPI JWT) but NOT connected to the UI; UI is unlocked by default
├── APIs: 7 live Express endpoints (health/generate-resume/generate-pdf-data/ai-audit/chat/optimize/match-jd);
│          9 orphaned FastAPI endpoints (same 7 minus generate-pdf-data-as-separate-route, plus 3 auth routes)
├── Data Models: ResumeData (client-side, the real source of truth) mirrors backend Pydantic schemas exactly;
│                  User/Resume SQLAlchemy models exist server-side but are disconnected from the live app
├── User Flows: Generate → Edit → Optimize/Audit/Match → Export(print); Chat is a parallel, loosely-coupled flow
└── Constraints: single in-memory resume (no multi-resume management, no persistence, no real auth,
                   single hardcoded dark theme, no router/URLs, no i18n)
```

### Existing Pages
Dashboard, Resume Studio, AI Chat Hub, Analytics, Settings, Auth Portal (see §10 for full detail).

### Existing Features
AI resume generation with role presets and optional JD-tailoring; manual structured editing of all resume sections; per-bullet and per-summary AI rewriting; JD match scoring with one-click keyword merge; AI executive audit with one-click summary replacement; AI chat with slash-style prompt shortcuts and copyable suggestions; 3D/flat live preview with 3 print templates; browser-print-based PDF export; local activity-feed logging of AI actions; toast + confetti feedback.

### Existing APIs
See §5 in full (7 live Express endpoints; 9 orphaned FastAPI endpoints).

### Existing Components
See §11 in full.

### Existing User Flows
See §12 in full (Flows A–E).

### Critical Business Rules
- AI-generated/optimized content always falls back to deterministic, hand-authored "demo" content whenever the Gemini key is absent or the call fails — the app must never show a hard error for these actions.
- `status` on a resume is one of `DRAFT | OPTIMIZED | PUBLISHED`; AI-generation always sets it to `OPTIMIZED`.
- Metrics (`resumeScore`, `jdMatchRate`) are nudged incrementally by client-side logic on certain AI actions (e.g., +2 per bullet optimize, +4 on applying an audited summary, +3 capped at 100 on JD-keyword merge) rather than being purely AI-derived — this incremental-scoring behavior is itself a "business rule" implemented only in `App.tsx`/`ResumeStudioView.tsx` and should be preserved or deliberately/explicitly redesigned, not silently dropped.

### Redesign Constraints
See §15/§16.

---

## 26. RECOMMENDED REDESIGN INFORMATION ARCHITECTURE
*(Recommendation — not existing functionality.)*

- Introduce a real client-side router (e.g., URL-backed routes `/dashboard`, `/studio/:resumeId`, `/chat`, `/analytics`, `/settings`, `/login`) so views are bookmarkable/shareable and back/forward works, while keeping the same six logical destinations.
- Consolidate `SideNavBar` and `TopAppBar` into one coherent navigation model — e.g., side nav owns all primary destinations; top bar owns only page-local context (breadcrumium/title + contextual actions), removing the current Studio/Dashboard duplication between the two.
- Introduce an explicit "My Resumes" concept (a list/grid landing before Studio) once/if persistence is added — this is a natural home for the currently-unused `Resume.resume_id`/`title`/`status` fields already modeled on the backend.
- Group AI actions (Generate, Optimize, Audit, Match) under a single consistent "AI Tools" affordance pattern (e.g., a persistent AI action rail within Studio) rather than the current mix of header buttons, sidebar quick-actions, and per-field inline triggers.
- Give Settings real sections (Profile, AI/Model preferences, Data & Privacy) once it's backed by real persistence, rather than the current two-field placeholder.

## 27. RECOMMENDED MODERN UI/UX DIRECTION
*(Recommendation — not existing functionality.)*

- **Design philosophy:** Keep the existing dark, "engineering HUD" identity (it fits the target audience of technical professionals) but formalize it: promote the already-defined `--color-*` CSS variables from decoration to the *only* source of color truth, and build a small shared primitive set (`Button`, `Card`, `Input`, `Select`, `Modal`, `Badge`) so the visual language stops drifting per-file.
- **Typography:** Keep the Inter/Plus Jakarta Sans/JetBrains Mono three-font system; codify a type scale (e.g., 6–8 sizes) instead of the current ad hoc `text-xs`/`text-sm`/`text-2xl` mixing.
- **Color strategy:** Keep emerald (`#4edea3`) as the single accent; reserve the secondary/tertiary tones (`#c0c1ff`, `#ffb783`) for a maximum of 2–3 clearly-defined semantic roles (e.g., "match/JD" vs. "warning") rather than ad hoc per-card usage.
- **Spacing system:** Adopt a documented 4/8px-based scale consistently (largely already true; formalize it in the shared primitives).
- **Border radius / shadows:** Keep the soft-glow, rounded-xl aesthetic but standardize 2–3 radius/shadow "levels" (e.g., `card`, `raised`, `floating`) instead of bespoke shadow strings per component.
- **Cards / Buttons / Forms / Tables:** Extract shared components as above; when tabular data is eventually needed (e.g., a resume list), introduce a real table component rather than more ad hoc flex/grid cards.
- **Navigation / Dashboard:** See §26.
- **Empty / Loading / Error states:** Add explicit, on-brand empty states for the activity feed and chat stream; and — importantly — stop universally masking failures with fake fallback content in contexts where the user has a real expectation of live AI output (e.g., surface a small, dismissible "Using offline sample content — AI key not configured" notice instead of silently substituting canned text).
- **Micro-interactions / Animations:** Keep confetti/spring-buttons as signature moments but gate the two continuous WebGL loops (`ThreeAIBrain`, `BackgroundShader`) behind visibility so they don't run when off-screen/off-tab.
- **Responsive behavior:** Design an explicit mobile treatment for the Studio two-pane layout (e.g., a tab/segmented-control switch between "Edit" and "Preview" below `lg`) rather than relying on incidental reflow.
- **Accessibility:** Add proper `label[for]`/`id` pairing, `aria-label`s on icon-only buttons, `role="dialog"`/focus-trapping on modals, and keyboard operability for the currently `div`-based clickable Dashboard card.

## 28. REDESIGN PRIORITY MATRIX

| Area | Current Problem | Priority | Recommended Direction | Risk |
|---|---|---:|---|---|
| Navigation | Duplicated tab affordances across side/top bars; no URLs | High | Single router-backed nav model (§26) | Low — purely additive/frontend |
| Dashboard | Empty-state gap; hardcoded "Live" framing on data that can be stale | Medium | Add empty states; keep bento layout | Low |
| Analytics | 100% hardcoded, disconnected from real resume data | High | Derive all metrics from live `resumeData` client-side, or clearly label as illustrative | Low (frontend-only fix) |
| Forms | No shared Input/Select components; inconsistent styling | Medium | Extract shared form primitives | Low |
| JD Matcher | Field-name bug silently breaks live-AI match display (`matchRate`/`matchedKeywords` vs `matchScore`/`matchedSkills`) | High | Fix field mapping in `JDMatcherModal` | Low (frontend-only fix) |
| Settings/Auth persistence | Nothing persists; auth is fully mocked | High (if real accounts are a goal) | Wire to FastAPI (or a new persistence layer) with a documented base-URL/proxy strategy | Medium–High — requires backend/infra coordination, not a pure redesign |
| Mobile | No explicit mobile treatment for the two-pane Studio | High | Segmented Edit/Preview switch below `lg` | Low–Medium |
| Accessibility | Missing label associations, ARIA on icon buttons/modals/tabs | Medium | Systematic ARIA pass alongside primitive-extraction work | Low |
| Security (backend, if ever wired up) | Wildcard CORS + credentials, hardcoded default `SECRET_KEY`, committed DB file | High (only if/when FastAPI is put into real use) | Hard-fail on missing `SECRET_KEY` in prod, restrict CORS origin list, remove DB from VCS | N/A to a pure frontend redesign, but should not be silently perpetuated |

---

## 29. ANTIGRAVITY HANDOFF SPECIFICATION

**Application Context:** IntelliResume 2026 is an AI resume-building SPA for technical professionals. See §1.

**Existing Architecture:** React 19/Vite SPA served by an Express server that *also* implements every live AI endpoint in-process via `@google/genai` (Gemini `gemini-3.6-flash`). A parallel FastAPI + SQLite service exists in its own container with near-duplicate AI endpoints (Gemini `gemini-1.5-flash`) plus real (but unused) JWT auth — it is not reachable from the shipped frontend today (no proxy/CORS wiring exists between them). See §4.

**Existing Frontend:** Six tab-based views (no router) driven entirely by state lifted into `App.tsx`; no shared component library; no API service layer (`fetch` calls inline per component); Tailwind 4 + hand-rolled design tokens; Three.js/WebGL decorative elements; browser-print-based PDF export. See §9–§11.

**Existing Backend:** FastAPI app (`backend/app`) with SQLAlchemy `User`/`Resume` models (SQLite), JWT auth utilities, and 7 AI endpoints mirroring the Express server's contracts field-for-field (hand-maintained, not code-generated/shared). See §5.2, §8.

**API Contracts:** See §6 for the full `ResumeData`/`GenerateResumeRequest`/`AIAuditResponse`/`ChatRequest`/`OptimizeRequest`/`MatchJDRequest`/`MatchJDResponse`/auth schemas, verbatim from `backend/app/schemas.py` (the frontend's plain-object request bodies match these field-for-field, with the one documented exception in §14/§28: `JDMatcherModal`'s response-reading code expects field names the backend does not actually return).

**Authentication:** Designed (JWT via FastAPI) but entirely disconnected from the live UI, which defaults to "authenticated" and offers a guest-bypass button. See §7.

**Database/Data Models:** SQLite via SQLAlchemy; `users` and `resumes` tables exist; `resumes` has no CRUD API and no FK constraint to `users`; currently unused by the live app. See §8.

**Pages:** Dashboard, Resume Studio, AI Chat Hub, Analytics, Settings, Auth Portal. See §10.

**Components:** See §11 for the full inventory, including the specific "no shared primitives exist" finding that should shape any redesign's component architecture.

**User Flows:** See §12, Flows A–E, including the documented JD-match field-mismatch defect inside Flow B.

**Feature/API Mapping:** See §13.

**Current UX Problems:** See §14, §18, §19, §20, §21, §22 for functional bugs, masked-error UX, responsive gaps, accessibility gaps, performance notes, and security notes, respectively. The single highest-priority *functional* items for any agent touching this codebase are: (1) `AnalyticsView` not using its `data` prop at all, (2) the `JDMatcherModal` response field-name mismatch, (3) the complete absence of persistence for anything a user does, and (4) the fully-mocked authentication gate.

**Redesign Goals:** Modernize/unify the visual system, fix the frontend-only defects above, and (as a follow-on, backend-touching effort, not a visual redesign) decide deliberately whether to wire up, replace, or delete the orphaned FastAPI backend rather than continuing to maintain two hand-synced copies of the same API contract.

**Things That MUST NOT Break:** See §15, MUST PRESERVE.

**Things That CAN Be Redesigned:** See §15, SAFE TO REDESIGN, and §16, "Can change."

**Recommended Information Architecture:** See §26.

**Recommended UI/UX Direction:** See §27.

**Implementation Constraints:** No test suite exists to regression-check against (§23) — any redesign effort should budget for adding at least smoke/E2E coverage of the five user flows in §12 concurrently, since there is currently zero automated safety net. No CI exists either (§24) — consider adding at minimum a type-check (`tsc --noEmit`, already scripted as `lint`) gate to CI as part of this effort.

**Acceptance Criteria:** See §30.

---

## 30. FINAL ACCEPTANCE CRITERIA FOR THE REDESIGN

Generic criteria:
- All existing features remain available (see §13 feature list).
- The 7 live Express `/api/*` contracts remain backward-compatible unless a coordinated backend change is explicitly part of the same effort.
- Existing user flows (§12, Flows A–E) remain completable end-to-end.
- Responsive behavior is verified across desktop, tablet, and mobile — including a deliberate (currently absent) mobile treatment for the Studio two-pane layout.
- Loading/error/empty states are implemented for every view that currently lacks them (Dashboard activity feed, Chat message stream, Analytics).
- Navigation is coherent (recommend resolving the SideNavBar/TopAppBar duplication as part of this effort — see §26).
- UI components are extracted into reusable primitives rather than re-duplicated per file.
- No existing functionality is silently removed.
- No fake/mock functionality is introduced where a real API already exists (e.g., do not add new hardcoded numbers to Analytics — wire it to real `resumeData` instead, or explicitly label it as illustrative).
- No new API endpoints are invented unless explicitly requested by the person commissioning the redesign.
- The existing Express backend is not modified merely to accommodate visual redesign (only touch `server.ts` if a request/response contract or persistence change is explicitly in scope).

Project-specific criteria:
- The `JDMatcherModal` field-name mismatch (§14/§28) is fixed as part of any work that touches the JD Matcher UI.
- `AnalyticsView` either reads from live `resumeData` or is explicitly relabeled as illustrative/sample content — it must not continue silently presenting fabricated numbers as if they were the user's real telemetry.
- Any redesign that touches Settings or Auth must not claim persistence/login "works" in copy or UI state (e.g., a "Saved" confirmation) unless a real backend call backs it — currently these are pure UI theater.
- If the redesign introduces a router/URL-based navigation, the six existing destinations (§10) must each remain reachable, and existing entry points into the three modals (AI Generate, JD Matcher, AI Review) must remain reachable from at least the same set of places they are today (Dashboard + Studio, per §13).
- Continuous WebGL/Three.js animations (`ThreeAIBrain`, `BackgroundShader`) should be gated to not run when their host view is not visible, as a performance acceptance bar for the redesign (§21/§27).

---

## 31. UNKNOWN / UNCERTAIN ITEMS

| Item | Status | Why Unknown | What Should Be Checked |
|---|---|---|---|
| `resume_id` field on the `Resume` model | UNKNOWN | No code reads or writes this field anywhere in the repo; its intended relationship to the primary key `id` is undocumented | Search for any external system/consumer that might reference `resume_id`; if none, confirm it's safe to drop or repurpose |
| `APP_URL` env var (`frontend/.env.example`) | UNKNOWN | Documented but never read in any frontend source file found | Confirm with the author whether this is vestigial AI-Studio scaffolding or intended for a not-yet-implemented feature |
| Exact live rendering of the Studio two-pane layout below `lg` breakpoint | UNKNOWN | Only static markup was reviewed; no live/browser rendering was performed as part of this analysis | Manually test the Studio view at common mobile/tablet widths |
| The specific JSX trigger button for `onOpenAIReview` inside `ResumeStudioView`'s accordion | Partially UNKNOWN | The prop is threaded through and referenced in modal wiring in `App.tsx`, but the exact button copy/location inside the very large `ResumeStudioView.tsx` accordion sections was not individually isolated in this pass | Grep `onOpenAIReview` usage inside `ResumeStudioView.tsx` directly and confirm its label/placement for the redesign's IA work |
| Whether the FastAPI backend is used in any deployment context outside this repo (e.g., a separate reverse-proxy config not committed here) | UNKNOWN | This analysis is scoped to the repository contents only | Ask the maintainer whether any external infra (not in this repo) proxies `/api` to port 8000 in a real deployment |
| Tailwind theme customization | UNKNOWN | No `tailwind.config.*` file exists in the repo; Tailwind 4's CSS-first config may make this a non-issue, but this wasn't independently confirmed against the installed Tailwind version's defaults | Confirm whether any project-specific theme extension is expected/missing versus Tailwind 4 defaults |
| Real-world performance/accessibility metrics (Lighthouse, axe, contrast ratios) | UNKNOWN | Not measured; this analysis is static-code-based only | Run Lighthouse/axe against a running instance before finalizing redesign priorities in §28 |
