"""
= TaxasGE Authentication & Authorization API
JWT-based authentication with role-based access control (RBAC)
Updated to use AuthService, PasswordService, and JWTService
"""

from fastapi import APIRouter, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, EmailStr, validator, model_validator
from typing import Optional, Dict, Any, List, Union
from datetime import datetime
from enum import Enum
from loguru import logger

from app.services.auth_service import get_auth_service
from app.services.session_service import get_session_service
from app.models.user import (
    UserCreate,
    UserResponse,
    UserProfile,
    CitizenProfile,
    BusinessProfile,
    UserRole,
    UserStatus,
)
from app.models.auth_models import (
    TokenRefreshRequest,
    LogoutRequest,
    TokenRefreshResponse,
    LogoutResponse,
)

# Create router
router = APIRouter()
security = HTTPBearer()


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

    # Citizen-specific fields (optional, only for role=citizen)
    national_id: Optional[str] = Field(None, max_length=20, description="National ID number (citizen only)")
    birth_date: Optional[str] = Field(None, description="Date of birth YYYY-MM-DD (citizen only)")
    gender: Optional[str] = Field(None, pattern="^(M|F|O)$", description="Gender M/F/O (citizen only)")
    marital_status: Optional[str] = Field(None, pattern="^(single|married|divorced|widowed)$", description="Marital status (citizen only)")
    occupation: Optional[str] = Field(None, max_length=100, description="Professional occupation (citizen only)")

    # Business-specific fields (required for role=business)
    business_name: Optional[str] = Field(None, min_length=2, max_length=100, description="Business name (required for business)")
    business_type: Optional[str] = Field(None, pattern="^(sole_proprietor|corporation|partnership|cooperative|ngo)$", description="Business entity type (required for business)")
    tax_id: Optional[str] = Field(None, max_length=20, description="Business tax ID (business only)")
    registration_number: Optional[str] = Field(None, max_length=30, description="Business registration number (business only)")
    industry: Optional[str] = Field(None, max_length=100, description="Industry sector (business only)")
    employee_count: Optional[int] = Field(None, ge=0, le=10000, description="Number of employees (business only)")
    annual_revenue: Optional[float] = Field(None, ge=0, description="Annual revenue in XAF (business only)")
    website: Optional[str] = Field(None, description="Business website URL (business only)")

    @model_validator(mode='before')
    @classmethod
    def validate_business_fields(cls, values):
        """Validate business fields are provided for business role"""
        role = values.get('role')
        if role == UserRole.business:
            if not values.get('business_name'):
                raise ValueError("Business name is required for business registration")
            if not values.get('business_type'):
                raise ValueError("Business type is required for business registration")
        return values


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: Dict[str, Any]


class PasswordResetRequestRequest(BaseModel):
    email: EmailStr = Field(..., description="User email address")


class PasswordResetRequestResponse(BaseModel):
    message: str
    email: EmailStr


class PasswordResetConfirmRequest(BaseModel):
    token: str = Field(..., min_length=32, max_length=64, description="Password reset token")
    new_password: str = Field(..., min_length=8, description="New password (min 8 characters)")


class PasswordResetConfirmResponse(BaseModel):
    message: str


class EmailVerifyRequest(BaseModel):
    verification_code: str = Field(..., min_length=6, max_length=6, description="6-digit verification code")


class EmailVerifyResponse(BaseModel):
    message: str


class EmailResendRequest(BaseModel):
    pass  # No body needed, use current_user from token


class EmailResendResponse(BaseModel):
    message: str
    email: EmailStr


class TwoFactorLoginResponse(BaseModel):
    """Response when 2FA is required after login"""

    requires_2fa: bool = Field(True, description="Indicates 2FA verification is required")
    temp_token: str = Field(..., description="Temporary token for 2FA verification (5 min validity)")
    message: str = Field(
        default="2FA verification required. Please provide your 2FA code.",
        description="User-facing message",
    )


class TwoFactorVerifyRequest(BaseModel):
    """Request to verify 2FA code and complete login"""

    temp_token: str = Field(..., description="Temporary token from login response")
    code: str = Field(..., description="6-digit TOTP code or 8-char backup code (XXXX-XXXX)")

    class Config:
        schema_extra = {
            "example": {"temp_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", "code": "123456"}
        }


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
        "version": "2.4.0",  # TASK-M01-013: 2FA login integration added
        "endpoints": {
            "register": "POST /register - Register new user",
            "login": "POST /login - User login (returns temp_token if 2FA enabled)",
            "login_2fa_verify": "POST /login/2fa-verify - Verify 2FA code and complete login",
            "refresh": "POST /refresh - Refresh access token",
            "logout": "POST /logout - Logout user",
            "profile": "GET /profile - Get current user profile",
            "password_reset_request": "POST /password/reset/request - Request password reset email",
            "password_reset_confirm": "POST /password/reset/confirm - Confirm password reset with token",
            "email_verify": "POST /email/verify - Verify email with 6-digit code",
            "email_resend": "POST /email/resend - Resend email verification code",
            "sessions": "GET /sessions - Get active sessions for current user",
        },
        "security": {
            "token_type": "JWT Bearer",
            "access_token_duration": "60 minutes",
            "refresh_token_duration": "7 days",
            "password_hashing": "bcrypt (12 rounds)",
            "password_reset_token_validity": "1 hour",
            "email_verification_code_validity": "15 minutes",
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

        # Create base UserProfile
        user_profile = UserProfile(
            first_name=request.first_name,
            last_name=request.last_name,
            phone=request.phone,
            language="es",  # Default to Spanish
        )

        # Create role-specific profiles
        citizen_profile = None
        business_profile = None

        if request.role == UserRole.citizen:
            # Create CitizenProfile with extended fields
            citizen_profile = CitizenProfile(
                first_name=request.first_name,
                last_name=request.last_name,
                phone=request.phone,
                language="es",
                national_id=request.national_id,
                birth_date=datetime.fromisoformat(request.birth_date) if request.birth_date else None,
                gender=request.gender,
                marital_status=request.marital_status,
                occupation=request.occupation,
            )

        elif request.role == UserRole.business:
            # Create BusinessProfile with extended fields
            business_profile = BusinessProfile(
                first_name=request.first_name,
                last_name=request.last_name,
                phone=request.phone,
                language="es",
                business_name=request.business_name,
                business_type=request.business_type,
                tax_id=request.tax_id,
                registration_number=request.registration_number,
                industry=request.industry,
                employee_count=request.employee_count,
                annual_revenue=request.annual_revenue,
                website=request.website,
            )

        # Create UserCreate model with role-specific profiles
        user_data = UserCreate(
            email=request.email,
            password=request.password,
            role=request.role,
            profile=user_profile,
            citizen_profile=citizen_profile,
            business_profile=business_profile,
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


@router.post("/login", response_model=Union[TokenResponse, TwoFactorLoginResponse])
async def login(
    request: LoginRequest,
    req: Request,
):
    """
    Login user and create session

    **Workflow**:
    1. Validate email and password
    2. Check if user has 2FA enabled:
       - If 2FA enabled: Return temp_token + requires_2fa=true
       - If 2FA disabled: Return access/refresh tokens immediately
    3. If 2FA required, client calls /login/2fa-verify with code

    Args:
        request: Login credentials
        req: FastAPI request object

    Returns:
        Union[TokenResponse, TwoFactorLoginResponse]:
            - TokenResponse: If 2FA disabled (access/refresh tokens + user data)
            - TwoFactorLoginResponse: If 2FA enabled (temp_token + requires_2fa flag)

    Raises:
        HTTPException: If login fails

    Source: TASK-M01-013 (Login 2FA Integration)
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

        # Check if 2FA is required
        if result.get("requires_2fa"):
            logger.info(f"User logged in, 2FA verification required: {request.email}")
            return TwoFactorLoginResponse(**result)

        logger.info(f"User logged in successfully: {request.email}")
        return TokenResponse(**result)

    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )


@router.post("/login/2fa-verify", response_model=TokenResponse)
async def verify_2fa_login(
    request: TwoFactorVerifyRequest,
):
    """
    Verify 2FA code and complete login process

    **Workflow**:
    1. User calls /login with email + password
    2. If user has 2FA enabled, receives temp_token + requires_2fa=true
    3. User provides 2FA code (from authenticator app or backup code)
    4. This endpoint verifies code and returns real access/refresh tokens

    Args:
        request: Temp token + 2FA code (TOTP or backup)

    Returns:
        TokenResponse: Access/refresh tokens and user data

    Raises:
        HTTPException: If 2FA verification fails

    **Security**:
    - Temp token is short-lived (5 minutes)
    - Invalid code = authentication failure
    - Backup codes are one-time use

    Source: TASK-M01-013 (Login 2FA Integration)
    """
    try:
        # Verify 2FA code via AuthService
        auth_service = get_auth_service()
        result = await auth_service.verify_2fa_login(
            temp_token=request.temp_token,
            code=request.code,
        )

        logger.info("2FA login verification successful")
        return TokenResponse(**result)

    except Exception as e:
        logger.error(f"2FA login verification error: {str(e)}")
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


# =============================================================================
# PASSWORD RESET ENDPOINTS (MODULE_02)
# =============================================================================

@router.post("/password/reset/request", response_model=PasswordResetRequestResponse)
async def request_password_reset(request: PasswordResetRequestRequest):
    """
    Request password reset - Send reset email with token

    **Public endpoint** (no authentication required)

    Args:
        request: Email address

    Returns:
        PasswordResetRequestResponse: Confirmation message

    Raises:
        HTTPException: If email sending fails

    Business Rules:
        - For security, always returns success (even if email doesn't exist)
        - Token valid for 1 hour
        - Email sent with reset link containing token

    Source: .github/docs-internal/Documentations/Backend/API_REFERENCE.md
    """
    try:
        # Request password reset via AuthService
        auth_service = get_auth_service()
        await auth_service.request_password_reset(email=request.email)

        # Always return success (don't reveal if email exists)
        return PasswordResetRequestResponse(
            message="If your email exists in our system, you will receive a password reset link shortly.",
            email=request.email
        )

    except Exception as e:
        logger.error(f"Password reset request error: {str(e)}")
        # Still return success to avoid revealing internal errors
        return PasswordResetRequestResponse(
            message="If your email exists in our system, you will receive a password reset link shortly.",
            email=request.email
        )


@router.post("/password/reset/confirm", response_model=PasswordResetConfirmResponse)
async def confirm_password_reset(request: PasswordResetConfirmRequest):
    """
    Confirm password reset - Validate token and update password

    **Public endpoint** (no authentication required)

    Args:
        request: Reset token and new password

    Returns:
        PasswordResetConfirmResponse: Confirmation message

    Raises:
        HTTPException: If token invalid/expired or password update fails

    Business Rules:
        - Token must be valid and not expired (1 hour validity)
        - New password must meet strength requirements (min 8 chars)
        - Token cleared after successful reset
        - Confirmation email sent

    Source: .github/docs-internal/Documentations/Backend/API_REFERENCE.md
    """
    try:
        # Confirm password reset via AuthService
        auth_service = get_auth_service()
        success = await auth_service.confirm_password_reset(
            reset_token=request.token,
            new_password=request.new_password
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password reset failed",
            )

        return PasswordResetConfirmResponse(
            message="Password reset successful. You can now login with your new password."
        )

    except Exception as e:
        logger.error(f"Password reset confirm error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


# =============================================================================
# EMAIL VERIFICATION ENDPOINTS (MODULE_02)
# =============================================================================

@router.post("/email/verify", response_model=EmailVerifyResponse)
async def verify_email(request: EmailVerifyRequest):
    """
    Verify email address with 6-digit code

    **Public endpoint** (no authentication required)

    Args:
        request: Email verification code (6 digits)

    Returns:
        EmailVerifyResponse: Confirmation message

    Raises:
        HTTPException: If code invalid/expired or verification fails

    Business Rules:
        - Code must be valid and not expired (15 minutes validity)
        - Email marked as verified in database
        - Code cleared after successful verification

    Source: .github/docs-internal/Documentations/Backend/API_REFERENCE.md
    """
    try:
        # Verify email via AuthService
        auth_service = get_auth_service()
        success = await auth_service.verify_email_code(
            verification_code=request.verification_code
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email verification failed",
            )

        return EmailVerifyResponse(
            message="Email verified successfully."
        )

    except Exception as e:
        logger.error(f"Email verification error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/email/resend", response_model=EmailResendResponse)
async def resend_verification_email(
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Resend email verification code

    **Authenticated endpoint** (requires valid access token)

    Args:
        current_user: Current authenticated user

    Returns:
        EmailResendResponse: Confirmation message with email

    Raises:
        HTTPException: If email sending fails

    Business Rules:
        - User must be authenticated
        - New 6-digit code generated
        - Code valid for 15 minutes
        - Email sent with verification code

    Source: .github/docs-internal/Documentations/Backend/API_REFERENCE.md
    """
    try:
        user_id = current_user["sub"]
        email = current_user["email"]

        # Resend verification email via AuthService
        auth_service = get_auth_service()
        success = await auth_service.send_verification_email(
            user_id=user_id,
            email=email
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to send verification email",
            )

        return EmailResendResponse(
            message="Verification code sent successfully.",
            email=email
        )

    except Exception as e:
        logger.error(f"Email resend error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


# === TASK-M01-008: Sessions Management ===

class SessionInfoResponse(BaseModel):
    """Model for session information response"""
    id: str = Field(..., description="Session ID")
    device: str = Field(..., description="Device type (Desktop/Mobile/Tablet)")
    browser: str = Field(..., description="Browser name")
    location: str = Field(..., description="Location (IP address or City, Country)")
    ip_address: Optional[str] = Field(None, description="IP address")
    created_at: datetime = Field(..., description="Session creation time")
    last_activity: datetime = Field(..., description="Last activity time")
    expires_at: datetime = Field(..., description="Session expiration time")
    is_current: bool = Field(..., description="True if this is the current session")


class SessionsListResponse(BaseModel):
    """Model for sessions list response"""
    sessions: List[SessionInfoResponse] = Field(..., description="List of active sessions")
    total: int = Field(..., description="Total number of active sessions")


@router.get("/sessions", response_model=SessionsListResponse)
async def get_sessions(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Get all active sessions for the current user

    **Authenticated endpoint** (requires valid access token)

    Args:
        credentials: Bearer token from Authorization header
        current_user: Current authenticated user

    Returns:
        SessionsListResponse: List of active sessions with metadata

    Raises:
        HTTPException: If retrieval fails

    Business Rules:
        - Only return non-expired sessions (expires_at > now)
        - Mark current session (matching access_token)
        - Verify user owns all returned sessions (security check)
        - Enrich with device, browser, location metadata
        - Order by created_at desc (most recent first)

    Source: .github/docs-internal/Documentations/Backend/RAPPORT_MODULE_01_AUTHENTICATION.md line 414-417
    """
    try:
        user_id = current_user["sub"]
        access_token = credentials.credentials

        # Get active sessions via SessionService
        session_service = get_session_service()
        sessions_data = await session_service.get_active_sessions(
            user_id=user_id,
            current_token=access_token
        )

        # Convert to response models
        sessions_list = [
            SessionInfoResponse(
                id=session["id"],
                device=session["device"],
                browser=session["browser"],
                location=session["location"],
                ip_address=session.get("ip_address"),
                created_at=session["created_at"],
                last_activity=session["last_activity"],
                expires_at=session["expires_at"],
                is_current=session["is_current"]
            )
            for session in sessions_data
        ]

        logger.info(f"Retrieved {len(sessions_list)} active sessions for user {user_id}")

        return SessionsListResponse(
            sessions=sessions_list,
            total=len(sessions_list)
        )

    except Exception as e:
        logger.error(f"Get sessions error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve sessions: {str(e)}",
        )
