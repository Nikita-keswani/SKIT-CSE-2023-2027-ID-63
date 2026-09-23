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
 
    class Config:
        env_file = ".env"
 
 
settings = Settings()
 
# One shared MongoDB connection, used everywhere via `users_collection`
client = AsyncIOMotorClient(settings.mongo_uri)
db = client[settings.mongo_db_name]
users_collection = db["users"]
 
