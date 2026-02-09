from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# Load .env ONLY for local development
if os.getenv("ENV") != "production":
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        pass

DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is not set.\n"
        "• For local: add it to .env\n"
        "• For Render: add it in Environment Variables"
    )

engine_args = {"pool_pre_ping": True}

# Neon/Render often require explicit SSL in production
if os.getenv("ENV") == "production":
    engine_args["connect_args"] = {"sslmode": "require"}

engine = create_engine(
    DATABASE_URL,
    **engine_args
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
