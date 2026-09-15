from bson import ObjectId
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
 
from src.core.security import decode_access_token
from src.core.config import users_collection
 
# Tells FastAPI's docs where to send login requests to get a token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")
 
 
# Use this as a dependency on any route that needs a logged-in user:
#   async def some_route(current_user: dict = Depends(get_current_user)):
async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
 
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if user_id is None:
            raise unauthorized
    except JWTError:
        raise unauthorized
 
    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise unauthorized
 
    return user
 
