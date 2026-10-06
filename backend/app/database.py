from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings
import logging

logger = logging.getLogger(__name__)

Base = declarative_base()
engine = None
SessionLocal = None

def init_db():
    global engine, SessionLocal
    if not settings.DATABASE_URL:
        logger.warning("DATABASE_URL not set. Running in memory-only mode.")
        return False
    try:
        engine = create_engine(
            settings.DATABASE_URL,
            pool_pre_ping=True,
            pool_size=5,
            max_overflow=10,
            connect_args={"sslmode": "require"} if ("neon" in settings.DATABASE_URL or "supabase" in settings.DATABASE_URL) else {}
        )
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        logger.info("Database connected successfully")
        return True
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return False

def get_db():
    if SessionLocal is None:
        yield None
        return
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    if engine is None:
        return
    try:
        # Enable pgvector
        with engine.connect() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            conn.commit()
        Base.metadata.create_all(bind=engine)
        logger.info("Tables created successfully")
    except Exception as e:
        logger.warning(f"Table creation: {e}")
        try:
            Base.metadata.create_all(bind=engine)
        except Exception as e2:
            logger.error(f"Failed to create tables: {e2}")
