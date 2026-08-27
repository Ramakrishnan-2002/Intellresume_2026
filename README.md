# IntelliResume 2026

> AI-Powered Resume Builder & Career Intelligence Platform

IntelliResume is a full-stack, AI-driven resume generation and optimization platform designed for technical professionals. It combines a sleek React frontend with Google's Gemini AI to generate, analyze, and tailor resumes for specific job descriptions in real-time.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100-009688?logo=fastapi)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)

---

## ✨ Features

### 🤖 AI Chat Hub
- **Real-time career coaching** powered by Google Gemini
- **Context-aware suggestions** based on your current resume
- **Slash commands**: `/optimize`, `/analyze`, `/format`
- **Markdown-rendered responses** with syntax highlighting

### 📝 Resume Studio
- **Live editing** of personal info, experience, skills, education, and projects
- **3D holographic AI brain** visualization
- **ATS score tracking** with live metrics
- **PDF export** ready for print

### 🎯 Job Description Matcher
- **Paste any JD** and get an instant ATS match score
- **Keyword gap analysis** — see what's missing vs. what you have
- **1-click auto-merge** missing keywords into your skills matrix
- **Sample JD presets** for quick testing

### ⚡ AI Resume Generator
- **Generate complete resumes** from a target role + experience level
- **Fast presets** for common tech roles (Full Stack, ML Engineer, DevOps, etc.)
- **Custom prompts** to tailor tone and emphasis
- **Job description-aware generation** for keyword alignment

### 📊 Analytics Dashboard
- **Resume score** with progress bar
- **JD match rate** tracking
- **Profile views** simulation
- **Activity timeline** of all AI interactions

---

## 🏗️ Architecture

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   React SPA     │◄────►│  Express Server │◄────►│  Google Gemini  │
│  (Port 3000)    │      │  (server.ts)    │      │     API         │
│                 │      │                 │      │                 │
│ • Vite + HMR    │      │ • /api/chat     │      │ • gemini-3.6-   │
│ • Tailwind CSS  │      │ • /api/generate │      │   flash         │
│ • Lucide Icons  │      │ • /api/match-jd │      │                 │
│ • Canvas Confetti│     │ • /api/optimize │      │                 │
└─────────────────┘      │ • /api/ai-audit │      └─────────────────┘
                         └─────────────────┘
                                  │
                         ┌─────────────────┐
                         │   FastAPI       │
                         │  (Port 8000)    │
                         │                 │
                         │ • Auth (JWT)    │
                         │ • Health checks │
                         │ • Future APIs   │
                         └─────────────────┘
```

---

## 🚀 Quick Start (Docker)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Google Gemini API Key](https://aistudio.google.com/app/apikey)

### 1. Clone the repository

```bash
git clone https://github.com/Ramakrishnan-2002/Intellresume_2026.git
cd Intellresume_2026
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

> ⚠️ **Never commit your `.env` file.** It is already in `.gitignore`.

### 3. Launch with Docker Compose

```bash
docker compose up --build
```

### 4. Open the app

Navigate to: **`http://localhost:3000`**

The backend API docs are available at: **`http://localhost:8000/docs`** (Swagger UI)

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 19 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool & dev server |
| Tailwind CSS | Utility-first styling |
| Express.js | SSR / API proxy server |
| Lucide React | Icon library |
| Canvas Confetti | Celebration animations |

### Backend
| Technology | Purpose |
|------------|---------|
| FastAPI | Python API framework |
| Uvicorn | ASGI server |
| SQLAlchemy | ORM (SQLite default) |
| PyJWT | Authentication tokens |
| Python 3.11 | Runtime |

### AI
| Technology | Purpose |
|------------|---------|
| Google Gemini 3.6 Flash | LLM for resume generation, chat, and analysis |
| @google/genai | Official Node.js SDK |

---

## 📁 Project Structure

```
Intellresume_2026/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── main.py            # FastAPI entry point
│   │   └── ...
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                   # React + Express frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── AIChatView.tsx
│   │   │   ├── DashboardView.tsx
│   │   │   ├── ResumeStudioView.tsx
│   │   │   ├── AIGenerateModal.tsx
│   │   │   ├── JDMatcherModal.tsx
│   │   │   └── ...
│   │   ├── App.tsx            # Root component
│   │   ├── server.ts          # Express API server
│   │   └── types.ts           # TypeScript interfaces
│   ├── Dockerfile
│   ├── vite.config.ts
│   └── package.json
├── dockercompose.yml           # Docker orchestration
├── .env                        # Environment variables (not committed)
├── .gitignore
└── README.md                   # You are here
```

---

## 🔌 API Endpoints

All AI endpoints are served by the Express server (`frontend/server.ts`):

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat` | AI career assistant chat |
| `POST` | `/api/generate-resume` | Generate full resume from role + skills |
| `POST` | `/api/generate-pdf-data` | Alias for generate-resume |
| `POST` | `/api/optimize` | Optimize a bullet point / section |
| `POST` | `/api/match-jd` | Match resume against job description |
| `POST` | `/api/ai-audit` | Executive resume audit & grade |
| `GET`  | `/api/health` | Health check + AI config status |

FastAPI backend endpoints (`backend/app/main.py`):

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | User registration |
| `POST` | `/api/auth/login` | User login (OAuth2PasswordBearer) |

---

## ⚙️ Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | ✅ Yes | Google Gemini API key for all AI features |
| `SQLALCHEMY_DATABASE_URL` | ❌ No | Database URL (default: `sqlite:///./resume.db`) |
| `SECRET_KEY` | ❌ No | JWT signing secret |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | ❌ No | JWT expiry (default: 60) |
| `DISABLE_HMR` | ❌ No | Set to `true` to disable Vite HMR (Docker) |

---

## 🧪 Testing the App

### AI Chat Commands
```
/optimize Led a team of 5 developers to build microservices
/analyze My latest role: "Built REST APIs using Node.js..."
/format We need a Staff Engineer to design distributed systems...
```

### Sample Job Description for Matcher
```
Meta - Staff Software Engineer (AI Infrastructure)
We are seeking a Staff Software Engineer to build and scale our AI 
training infrastructure. You will design distributed systems for 
training large-scale LLMs across 10,000+ GPUs...
```

### AI Resume Generator Input
- **Target Role**: `Staff Machine Learning Engineer`
- **Experience Level**: `Staff / Lead (8-12 years)`
- **Core Skills**: `Python, PyTorch, LLMs, LangChain, RAG, MLOps`

---

## 🐳 Docker Commands

```bash
# Build and start
docker compose up --build

# Start in background
docker compose up -d

# View logs
docker logs intelliresume_2026-frontend-1
docker logs intelliresume_2026-backend-1

# Stop and remove containers
docker compose down

# Force rebuild without cache
docker compose build --no-cache
```

---

## 📝 License

This project is licensed under the MIT License.

---

## 🙋‍♂️ Author

**Ramakrishnan** — [GitHub](https://github.com/Ramakrishnan-2002)

---

> Built with ❤️ for engineers who want their resumes to work as hard as they do.
