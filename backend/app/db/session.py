from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import NullPool
from app.core.config import settings

# Configure engine based on database type
connect_args = {}
poolclass = None

if settings.DATABASE_URI and "sqlite" in settings.DATABASE_URI.lower():
    # SQLite: disable thread-checking and use NullPool
    connect_args = {"check_same_thread": False}
    poolclass = NullPool
else:
    # MySQL: use connect_timeout
    connect_args = {"connect_timeout": 60}

# Create engine with appropriate configuration
engine = create_engine(
    settings.DATABASE_URI, 
    echo=True,
    pool_pre_ping=True,
    pool_recycle=300,
    connect_args=connect_args,
    poolclass=poolclass
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=Session)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
