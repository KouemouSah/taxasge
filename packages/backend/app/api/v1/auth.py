"""
= TaxasGE Authentication & Authorization API
JWT-based authentication with role-based access control (RBAC)
"""

from fastapi import APIRouter, HTTPException, Depends, status, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, EmailStr, validator
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from enum import Enum
import jwt
import hashlib
import secrets
import re
from loguru import logger

# Create router
router = APIRouter()
security = HTTPBearer()

# Configuration
JWT_SECRET_KEY = "taxasge-jwt-secret-change-in-production"
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
REFRESH_TOKEN_EXPIRE_DAYS = 7

# User roles
class UserRole(str, Enum):
    citizen = "citizen"
    business = "business"
    admin = "admin"
    operator = "operator"
    auditor = "auditor"
    support = "support"

class UserStatus(str, Enum):
    active = "active"
    inactive = "inactive"
    suspended = "suspended"
    pending_verification = "pending_verification"

# Request/Response Models
class LoginRequest(BaseModel):
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=6, description="User password")
    remember_me: bool = Field(False, description="Extended session duration")

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: Dict[str, Any]

# Mock user database - Using configured admin email
MOCK_USERS = {
    "libressai@gmail.com": {
        "id": "usr_admin_001",
        "email": "libressai@gmail.com",
        "password_hash": "hashed_password_admin",
        "first_name": "System",
        "last_name": "Administrator",
        "role": UserRole.admin,
        "status": UserStatus.active,
        "created_at": datetime(2025, 1, 1),
        "permissions": ["*"]
    }
}

# Utility functions
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    # For development: Use configured SMTP password directly
    smtp_password = os.getenv("SMTP_PASSWORD_GMAIL", os.getenv("SMTP_PASSWORD", ""))
    if smtp_password and password == smtp_password:
        return True
    # Fallback to hash comparison
    return hash_password(password) == hashed

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def create_refresh_token(data: Dict[str, Any]) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

# API Endpoints
@router.get("/")
async def get_auth_info():
    return {
        "message": "TaxasGE Authentication API",
        "version": "1.0.0",
        "endpoints": {
            "login": "POST /login - User login",
            "profile": "GET /profile - Get user profile",
        },
        "security": {
            "token_type": "JWT Bearer",
            "access_token_duration": f"{ACCESS_TOKEN_EXPIRE_MINUTES} minutes"
        }
    }

@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    user = MOCK_USERS.get(request.email)
    if not user or not verify_password(request.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    token_data = {"sub": user["email"], "user_id": user["id"], "role": user["role"]}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    user_data = {
        "id": user["id"],
        "email": user["email"],
        "first_name": user["first_name"],
        "last_name": user["last_name"],
        "role": user["role"],
        "status": user["status"]
    }

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=user_data
    )