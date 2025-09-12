import json
import secrets
from typing import Any, Dict, List, Optional, Union
from pydantic import AnyHttpUrl, EmailStr, HttpUrl, validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # Zalo Mini App Configuration
    ZALO_APP_ID: Optional[str] = None
    ZALO_SECRET_KEY: Optional[str] = None
    
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
        case_sensitive = True
        env_file = ".env"


settings = Settings()
