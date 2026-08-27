from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    GEMINI_API_KEY: str = ""
    SQLALCHEMY_DATABASE_URL: str = "sqlite:///./resume.db"
    SECRET_KEY: str = "change-me-in-production-use-a-256-bit-secret-key-here"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    ALGORITHM: str = "HS256"

    class Config:
        env_file = ".env"

settings = Settings()
