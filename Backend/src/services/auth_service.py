from fastapi import HTTPException, status
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests

from src.core.config import settings, users_collection
from src.core.security import hash_password, verify_password, create_access_token
from src.schemas.auth_schema import UserOutSchema, TokenResponseSchema


def _user_doc_to_out(user: dict) -> UserOutSchema:
    return UserOutSchema(
        id=str(user["_id"]),
        name=user["name"],
        email=user["email"],
        auth_provider=user.get("auth_provider", "password"),
    )


async def signup_user(name: str, email: str, password: str) -> TokenResponseSchema:
    existing = await users_collection.find_one({"email": email})
    if existing:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Email already registered")

    user_doc = {
        "name": name,
        "email": email,
        "hashed_password": hash_password(password),
        "auth_provider": "password",
    }
    result = await users_collection.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    token = create_access_token(str(user_doc["_id"]))
    return TokenResponseSchema(access_token=token, user=_user_doc_to_out(user_doc))


async def login_user(email: str, password: str) -> TokenResponseSchema:
    user = await users_collection.find_one({"email": email})
    if not user or user.get("auth_provider") != "password":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")

    if not verify_password(password, user["hashed_password"]):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")

    token = create_access_token(str(user["_id"]))
    return TokenResponseSchema(access_token=token, user=_user_doc_to_out(user))


async def google_login_user(id_token_str: str) -> TokenResponseSchema:
    # Confirms the token really came from Google, for OUR app, and hasn't expired
    try:
        idinfo = google_id_token.verify_oauth2_token(
            id_token_str, google_requests.Request(), settings.google_client_id
        )
    except ValueError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid Google token")

    email = idinfo["email"]
    name = idinfo.get("name", email.split("@")[0])

    user = await users_collection.find_one({"email": email})

    if user is None:
        # First time we've seen this Google account -> create it
        user_doc = {
            "name": name,
            "email": email,
            "hashed_password": None,
            "auth_provider": "google",
        }
        result = await users_collection.insert_one(user_doc)
        user_doc["_id"] = result.inserted_id
        user = user_doc
    elif user.get("auth_provider") != "google":
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "This email already has a password account. Please log in with your password.",
        )

    token = create_access_token(str(user["_id"]))
    return TokenResponseSchema(access_token=token, user=_user_doc_to_out(user))