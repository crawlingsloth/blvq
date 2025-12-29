"""Application configuration"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Ewity API
    ewity_api_token: str  # Required - must be set in .env
    ewity_api_base_url: str = "https://api.ewitypos.com/v1"

    # Database
    database_url: str = "sqlite:///./blvq.db"

    # Security
    secret_key: str = "your-secret-key-change-in-production-min-32-chars"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24 hours

    # Default Admin User (created on first startup)
    admin_username: str = "admin"
    admin_password: str = "admin123"

    # CORS
    frontend_url: str = "https://blvq.crawlingsloth.cloud"

    # Cache
    cache_ttl_seconds: int = 300  # 5 minutes

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
