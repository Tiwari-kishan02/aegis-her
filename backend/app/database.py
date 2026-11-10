import os

from dotenv import load_dotenv
from sqlalchemy import create_engine

load_dotenv()
from sqlalchemy.orm import DeclarativeBase, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./aegis.db")
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def ensure_alert_details_column() -> None:
    if not DATABASE_URL.startswith("sqlite"):
        return

    try:
        with engine.begin() as connection:
            columns = connection.exec_driver_sql("PRAGMA table_info(alerts)").fetchall()
            if columns and not any(column[1] == "details" for column in columns):
                connection.exec_driver_sql("ALTER TABLE alerts ADD COLUMN details TEXT")
    except Exception:
        # Existing SQLite databases may already have the column or be incompatible for migration.
        pass


ensure_alert_details_column()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
