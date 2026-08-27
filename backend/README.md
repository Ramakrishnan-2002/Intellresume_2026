# IntelliResume Backend (FastAPI)

FastAPI backend designed for the **IntelliResume 2026** React SPA frontend.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check + AI configuration status |
| POST | `/api/generate-resume` | AI generates a full structured resume |
| POST | `/api/generate-pdf-data` | Alias for `/api/generate-resume` |
| POST | `/api/ai-audit` | Executive resume audit & grade |
| POST | `/api/chat` | AI career assistant chat |
| POST | `/api/optimize` | Optimize a bullet point / section |
| POST | `/api/match-jd` | Match resume against a job description |
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | User login (OAuth2PasswordBearer) |

## Setup

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Copy env and fill in your Gemini key
cp .env.example .env

# Run
uvicorn app.main:app --reload --port 8000
```

## Environment Variables

- `GEMINI_API_KEY` – Google Gemini API key (required for AI features)
- `SQLALCHEMY_DATABASE_URL` – Database connection string
- `SECRET_KEY` – JWT signing secret
- `ACCESS_TOKEN_EXPIRE_MINUTES` – JWT expiry

## Frontend Integration

The frontend expects the backend at the **same origin** (proxied) or configure the Vite dev server to proxy `/api` to `http://localhost:8000`.

Add to your frontend `vite.config.ts`:

```ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    },
  },
}
```
