
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict
from motor.motor_asyncio import AsyncIOMotorClient


BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    # MongoDB
    mongo_uri: str = "mongodb://localhost:27017"
    mongo_db_name: str = "authapp"

    # Authentication
    jwt_secret_key: str = "change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440
    google_client_id: str = ""

    # Frontend
    frontend_origin: str = "http://localhost:5173"
    GROQ_API_KEY: str
    GROQ_MODEL: str = "openai/gpt-oss-20b"

    CHROMA_DIR: str = "data/chroma"

    EMBEDDING_MODEL: str = (
        "sentence-transformers/all-MiniLM-L6-v2"
    )

    CHUNK_SIZE: int = 800
    CHUNK_OVERLAP: int = 120

    # Existing Groq configuration
    groq_api_key: str = ""
    groq_model: str = "openai/gpt-oss-120b"

    # Notes Summarizer
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    CHROMA_DIR: str = str(
        BACKEND_DIR / "data" / "notes_summarizer" / "chroma"
    )
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"

    # PDF RAG
    PDF_RAG_MAX_FILE_SIZE_MB: int = 20

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
    )


settings = Settings()

client = AsyncIOMotorClient(settings.mongo_uri)
db = client[settings.mongo_db_name]
users_collection = db["users"]
