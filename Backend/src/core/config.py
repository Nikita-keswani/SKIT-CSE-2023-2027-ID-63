from pydantic_settings import BaseSettings
from motor.motor_asyncio import AsyncIOMotorClient
 
 
# All settings are read from the .env file automatically
class Settings(BaseSettings):
    mongo_uri: str = "mongodb://localhost:27017"
    mongo_db_name: str = "authapp"
 
    jwt_secret_key: str = "change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440
 
    google_client_id: str = ""
 
    frontend_origin: str = "http://localhost:5173"
    GROQ_API_KEY: str
    GROQ_MODEL: str = "openai/gpt-oss-20b"

    CHROMA_DIR: str = "data/chroma"

    EMBEDDING_MODEL: str = (
        "sentence-transformers/all-MiniLM-L6-v2"
    )

    CHUNK_SIZE: int = 800
    CHUNK_OVERLAP: int = 120

    TOP_K: int = 5

    MAX_FILE_SIZE_MB: int = 10

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )
 
    class Config:
        env_file = ".env"
 
 
settings = Settings()
 
# One shared MongoDB connection, used everywhere via `users_collection`
client = AsyncIOMotorClient(settings.mongo_uri)
db = client[settings.mongo_db_name]
users_collection = db["users"]


print("[CONFIG] Settings loaded successfully")
print(f"[CONFIG] Groq model: {settings.GROQ_MODEL}")
print(f"[CONFIG] Embedding model: {settings.EMBEDDING_MODEL}")
print(f"[CONFIG] Chunk size: {settings.CHUNK_SIZE}")
print(f"[CONFIG] Top K: {settings.TOP_K}")
 
