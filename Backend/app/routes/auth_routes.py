from fastapi import APIRouter, Depends
 
from src.schemas.auth_schema import (
    SignupSchema,
    LoginSchema,
    GoogleLoginSchema,
    TokenResponseSchema,
    UserOutSchema,
)
from src.services import auth_service
from app.middleware.auth_middleware import get_current_user
 
router = APIRouter(prefix="/auth", tags=["auth"])
 
 
@router.post("/signup", response_model=TokenResponseSchema)
async def signup(payload: SignupSchema):
    return await auth_service.signup_user(payload.name, payload.email, payload.password)
 
 
@router.post("/login", response_model=TokenResponseSchema)
async def login(payload: LoginSchema):
    return await auth_service.login_user(payload.email, payload.password)
 
 
@router.post("/google", response_model=TokenResponseSchema)
async def google_login(payload: GoogleLoginSchema):
    return await auth_service.google_login_user(payload.id_token)
 
 
@router.get("/me", response_model=UserOutSchema)
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": str(current_user["_id"]),
        "name": current_user["name"],
        "email": current_user["email"],
        "auth_provider": current_user.get("auth_provider", "password"),
    }
 
