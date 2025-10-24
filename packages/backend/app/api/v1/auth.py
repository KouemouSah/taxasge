"""
= TaxasGE Authentication & Authorization API
JWT-based authentication with role-based access control (RBAC)
Updated to use AuthService, PasswordService, and JWTService
"""

from fastapi import APIRouter, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum
from loguru import logger

from app.services.auth_service import get_auth_service
from app.models.user import UserCreate, UserResponse, UserProfile
from app.models.auth_models import (
    TokenRefreshRequest,
    LogoutRequest,
    TokenRefreshResponse,
    LogoutResponse,
)

# Create router
router = APIRouter()
security = HTTPBearer()

# User roles (used by models and repositories)
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


class RegisterRequest(BaseModel):
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=8, description="User password (min 8 characters)")
    first_name: str = Field(..., min_length=2, max_length=50, description="First name")
    last_name: str = Field(..., min_length=2, max_length=50, description="Last name")
    phone: Optional[str] = Field(None, description="Phone number")
    role: UserRole = Field(default=UserRole.citizen, description="User role")


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: Dict[str, Any]


# Dependency to get client info from request
def get_client_info(request: Request) -> tuple[Optional[str], Optional[str]]:
    """Extract client IP and user agent from request"""
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    return ip_address, user_agent


# Dependency to get current user from token
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> Dict[str, Any]:
    """
    Validate access token and return current user data

    Args:
        credentials: Bearer token from Authorization header

    Returns:
        Dict: Current user data from token

    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        auth_service = get_auth_service()
        token_data = await auth_service.validate_access_token(credentials.credentials)

        if not token_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired access token",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return token_data

    except Exception as e:
        logger.error(f"Token validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


# API Endpoints
@router.get("/")
async def get_auth_info():
    """Get authentication API information"""
    return {
        "message": "TaxasGE Authentication API",
        "version": "2.0.0",
        "endpoints": {
            "register": "POST /register - Register new user",
            "login": "POST /login - User login",
            "refresh": "POST /refresh - Refresh access token",
            "logout": "POST /logout - Logout user",
            "profile": "GET /profile - Get current user profile",
        },
        "security": {
            "token_type": "JWT Bearer",
            "access_token_duration": "60 minutes",
            "refresh_token_duration": "7 days",
            "password_hashing": "bcrypt (12 rounds)",
        },
    }


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    request: RegisterRequest,
    req: Request,
):
    """
    Register a new user

    Args:
        request: Registration data
        req: FastAPI request object

    Returns:
        TokenResponse: Access/refresh tokens and user data

    Raises:
        HTTPException: If registration fails
    """
    try:
        # Get client info
        ip_address, user_agent = get_client_info(req)

        # Create UserCreate model
        user_profile = UserProfile(
            first_name=request.first_name,
            last_name=request.last_name,
            phone=request.phone,
            country="GQ",  # Default to Equatorial Guinea
            language="es",  # Default to Spanish
        )

        user_data = UserCreate(
            email=request.email,
            password=request.password,
            role=request.role,
            profile=user_profile,
        )

        # Register user via AuthService
        auth_service = get_auth_service()
        result = await auth_service.register(
            user_data=user_data,
            ip_address=ip_address,
            user_agent=user_agent,
        )

        logger.info(f"User registered successfully: {request.email}")
        return TokenResponse(**result)

    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest,
    req: Request,
):
    """
    Login user and create session

    Args:
        request: Login credentials
        req: FastAPI request object

    Returns:
        TokenResponse: Access/refresh tokens and user data

    Raises:
        HTTPException: If login fails
    """
    try:
        # Get client info
        ip_address, user_agent = get_client_info(req)

        # Login via AuthService
        auth_service = get_auth_service()
        result = await auth_service.login(
            email=request.email,
            password=request.password,
            remember_me=request.remember_me,
            ip_address=ip_address,
            user_agent=user_agent,
        )

        logger.info(f"User logged in successfully: {request.email}")
        return TokenResponse(**result)

    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )


@router.post("/refresh", response_model=TokenRefreshResponse)
async def refresh_token(
    request: TokenRefreshRequest,
    req: Request,
):
    """
    Refresh access token using refresh token

    Args:
        request: Refresh token request
        req: FastAPI request object

    Returns:
        TokenRefreshResponse: New access/refresh tokens

    Raises:
        HTTPException: If refresh fails
    """
    try:
        # Get client info
        ip_address, user_agent = get_client_info(req)

        # Refresh tokens via AuthService
        auth_service = get_auth_service()
        result = await auth_service.refresh_tokens(
            refresh_token=request.refresh_token,
            ip_address=ip_address,
            user_agent=user_agent,
        )

        logger.info("Tokens refreshed successfully")
        return result

    except Exception as e:
        logger.error(f"Token refresh error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )


@router.post("/logout", response_model=LogoutResponse)
async def logout(
    request: LogoutRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Logout user (revoke tokens and session)

    Args:
        request: Logout request (optional refresh token, all_sessions flag)
        current_user: Current authenticated user

    Returns:
        LogoutResponse: Logout status

    Raises:
        HTTPException: If logout fails
    """
    try:
        # Logout via AuthService
        auth_service = get_auth_service()
        result = await auth_service.logout(
            refresh_token=request.refresh_token,
            all_sessions=request.all_sessions,
        )

        logger.info(f"User logged out: {current_user.get('email')}")
        return result

    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get("/profile", response_model=UserResponse)
async def get_profile(
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Get current user profile

    Args:
        current_user: Current authenticated user

    Returns:
        UserResponse: User profile data

    Raises:
        HTTPException: If profile fetch fails
    """
    try:
        # Get user from database
        from app.repositories.user_repository import UserRepository

        user_repo = UserRepository()
        user = await user_repo.find_by_id(current_user["sub"])

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        # Return user response
        return UserResponse(
            id=user.id,
            email=user.email,
            role=user.role,
            status=user.status,
            first_name=user.first_name,
            last_name=user.last_name,
            phone=user.phone,
            address=user.address,
            city=user.city,
            country=user.country,
            language=user.language,
            avatar_url=user.avatar_url,
            created_at=user.created_at,
            updated_at=user.updated_at,
            last_login=user.last_login,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Profile fetch error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch user profile",
        )
