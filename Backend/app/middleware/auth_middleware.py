from bson import ObjectId
from bson.errors import InvalidId
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError

from src.core.security import decode_access_token
from src.core.config import users_collection


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"}
    )

    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")

        if not user_id:
            raise unauthorized

        user = await users_collection.find_one({
            "_id": ObjectId(user_id)
        })

    except (JWTError, InvalidId, TypeError):
        raise unauthorized

    if user is None:
        raise unauthorized

    if not user.get("active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated"
        )

    # Existing accounts without a role remain students.
    user["role"] = user.get("role", "student")

    return user


def require_roles(*roles: str):
    async def role_dependency(
        current_user: dict = Depends(get_current_user)
    ):
        if current_user.get("role", "student") not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource"
            )

        return current_user

    return role_dependency


student_only = require_roles("student")
teacher_only = require_roles("teacher")
admin_only = require_roles("admin")