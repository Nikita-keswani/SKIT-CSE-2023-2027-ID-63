from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.core.config import settings
from app.routes.auth_routes import router as auth_router
from app.routes.notes_routes import router as notes_router

app = FastAPI(title="Auth API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(notes_router)


@app.get("/")
async def root():
    return {"status": "ok"}


@app.get("/health")
async def health():

    return {
        "status": "healthy"
    }