from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
from app.core.config import settings

# Configure engine based on database type
# For SQLite: disable thread-checking and use NullPool to avoid cross-thread issues
if settings.DATABASE_URI and "sqlite" in settings.DATABASE_URI.lower():
    engine = create_engine(
        settings.DATABASE_URI,
        connect_args={"check_same_thread": False},
        poolclass=NullPool
    )
else:
    # For MySQL/other databases
    engine = create_engine(settings.DATABASE_URI)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
