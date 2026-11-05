from pydantic import BaseModel, EmailStr, Field


class SignupSchema(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginSchema(BaseModel):
    email: EmailStr
    password: str


class GoogleLoginSchema(BaseModel):
    id_token: str


class UserOutSchema(BaseModel):
    id: str
    name: str
    email: EmailStr
    auth_provider: str
    role: str = "student"


class TokenResponseSchema(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOutSchema