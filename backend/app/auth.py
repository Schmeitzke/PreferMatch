from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from . import models, database
from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REGISTER_SECRET: str
    DOMAIN: str = "localhost" # For cookie domain setting
    ENVIRONMENT: str = "development" # development or production

    class Config:
        env_file = ".env"

settings = Settings()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/admin/login", auto_error=False)

PEPPER = os.getenv("PASSWORD_PEPPER")
if not PEPPER:
    raise ValueError("PASSWORD_PEPPER environment variable is not set")

import hashlib

def verify_password(plain_password, hashed_password):
    # Pre-hash to avoid bcrypt 72-byte limit
    pre_hashed = hashlib.sha256((plain_password + PEPPER).encode('utf-8')).hexdigest()
    return pwd_context.verify(pre_hashed, hashed_password)

def get_password_hash(password):
    # Pre-hash to avoid bcrypt 72-byte limit
    pre_hashed = hashlib.sha256((password + PEPPER).encode('utf-8')).hexdigest()
    return pwd_context.hash(pre_hashed)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

from fastapi import Request

def get_current_user(request: Request, token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Try to get token from cookie first
    cookie_token = request.cookies.get("access_token")
    if cookie_token:
        token = cookie_token
        
    if not token:
        raise credentials_exception
        
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(models.Admin).filter(models.Admin.email == email).first()
    if user is None:
        raise credentials_exception
    return user
