import json
import secrets
from typing import Any, Dict, List, Optional, Union
from pydantic import AnyHttpUrl, EmailStr, HttpUrl, validator
try:
    from pydantic_settings import BaseSettings  # pydantic v2
except Exception:
    from pydantic import BaseSettings  # pydantic v1


class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    # SECRET_KEY should be set in .env for production, use fixed key for development
    SECRET_KEY: str = "your-secret-key-change-in-production-9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # Zalo Mini App Configuration
    ZALO_APP_ID: Optional[str]
    ZALO_SECRET_KEY: Optional[str]
    
    SERVER_NAME: str = "Zalo Mini App Backend"
    SERVER_HOST: AnyHttpUrl = "http://localhost"
    
    # Environment Configuration
    DEBUG: bool = False
    ENVIRONMENT: str = "development"
    
    # CORS Configuration
    BACKEND_CORS_ORIGINS: List[str] = [
        "*",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8889",
        "http://localhost:8000",
        "https://zalominiapp.vtlink.vn",
        "http://zalominiapp.vtlink.vn",
        "https://157.10.199.22",
        "http://157.10.199.22",
        "http://157.10.199.22:8000",
        "https://157.10.199.22:8000",
    ]

    PROJECT_NAME: str = "Zalo Mini App"
    
    # Database Configuration
    USE_LOCAL_DB: bool = True  # Set to False for remote MySQL, True for local MySQL on VPS
    DATABASE_URL: Optional[str] = None  # Allow override from .env
    
    # Local SQLite database (for development/testing)
    LOCAL_DB_PATH: str = "local_test.db"
    
    # Remote MySQL database - UPDATED FOR LOCAL TESTING
    MYSQL_SERVER: str = "localhost"
    MYSQL_USER: str = "root"
    MYSQL_PASSWORD: str = "123456"
    MYSQL_DB: str = "bookingservicesiovn_zalominidb"
    DATABASE_URI: Optional[str] = None

    def model_post_init(self, __context) -> None:
        """Initialize database URI after model creation"""
        # Use DATABASE_URL from .env if provided, otherwise construct from components
        if not self.DATABASE_URI:
            if self.DATABASE_URL:
                self.DATABASE_URI = self.DATABASE_URL
                print(f"🔧 Using DATABASE_URL from .env")
            elif self.USE_LOCAL_DB:
                self.DATABASE_URI = f"mysql+pymysql://{self.MYSQL_USER}:{self.MYSQL_PASSWORD}@localhost/{self.MYSQL_DB}"
                print(f"🔧 Using local MySQL database: localhost")
            else:
                self.DATABASE_URI = f"mysql+pymysql://{self.MYSQL_USER}:{self.MYSQL_PASSWORD}@{self.MYSQL_SERVER}/{self.MYSQL_DB}"
                print(f"🔧 Using remote MySQL database: {self.MYSQL_SERVER}")

    # Email
    SMTP_TLS: bool = True
    SMTP_PORT: Optional[int] = None
    SMTP_HOST: Optional[str] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAILS_FROM_EMAIL: Optional[EmailStr] = None
    EMAILS_FROM_NAME: Optional[str] = None

    # Users
    USERS_OPEN_REGISTRATION: bool = False
    EMAIL_RESET_TOKEN_EXPIRE_HOURS: int = 48
    EMAIL_TEMPLATES_DIR: str = "app/email-templates/build"
    EMAILS_ENABLED: bool = False

    # First superuser
    FIRST_SUPERUSER: EmailStr = "admin@example.com"
    FIRST_SUPERUSER_PASSWORD: str = "changethis"

    # File Upload
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_IMAGE_EXTENSIONS: List[str] = [".jpg", ".jpeg", ".png", ".gif", ".webp"]

    class Config:
        env_file = ".env"
        case_sensitive = True
        
settings = Settings()

# Backwards-compatibility: ensure DATABASE_URI is populated when pydantic v1
# is used and `model_post_init` (pydantic v2 hook) did not run.
if not getattr(settings, "DATABASE_URI", None):
    if getattr(settings, "DATABASE_URL", None):
        settings.DATABASE_URI = settings.DATABASE_URL
        print("🔧 Using DATABASE_URL from .env (post-init fallback)")
    elif getattr(settings, "USE_LOCAL_DB", False):
        local_path = getattr(settings, "LOCAL_DB_PATH", "local_test.db")
        settings.DATABASE_URI = f"sqlite:///{local_path}"
        print(f"🔧 Using fallback local SQLite DB: {settings.DATABASE_URI}")
    else:
        settings.DATABASE_URI = f"mysql+pymysql://{settings.MYSQL_USER}:{settings.MYSQL_PASSWORD}@{settings.MYSQL_SERVER}/{settings.MYSQL_DB}"
        print(f"🔧 Using fallback MySQL DB: {settings.MYSQL_SERVER}")
