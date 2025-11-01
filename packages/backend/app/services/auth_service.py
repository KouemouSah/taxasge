"""
Authentication Service for TaxasGE Backend
Orchestrates authentication operations using repositories and services
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Tuple
from loguru import logger

from app.repositories.user_repository import UserRepository
from app.repositories.session_repository import SessionRepository
from app.repositories.refresh_token_repository import RefreshTokenRepository
from app.services.password_service import get_password_service
from app.services.jwt_service import get_jwt_service
from app.models.user import UserCreate, UserResponse, UserRole, UserStatus
from app.models.auth_models import (
    SessionCreate,
    RefreshTokenCreate,
    TokenRefreshResponse,
    LogoutResponse,
)


class AuthService:
    """Service for authentication operations"""

    def __init__(self):
        """Initialize auth service with repositories and services"""
        self.user_repo = UserRepository()
        self.session_repo = SessionRepository()
        self.token_repo = RefreshTokenRepository()
        self.password_service = get_password_service()
        self.jwt_service = get_jwt_service()

        logger.info("AuthService initialized")

    async def register(
        self,
        user_data: UserCreate,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Register a new user

        Args:
            user_data: User registration data
            ip_address: Client IP address
            user_agent: Client user agent

        Returns:
            Dict: Registration response with user data and tokens

        Raises:
            Exception: If registration fails
        """
        try:
            # Check if user already exists
            existing_user = await self.user_repo.find_by_email(user_data.email)
            if existing_user:
                raise Exception("User with this email already exists")

            # Validate password strength
            password_check = self.password_service.check_password_strength(user_data.password)
            if not password_check["valid"]:
                raise Exception(
                    f"Password is too weak: {', '.join(password_check['issues'])}"
                )

            # Hash password
            hashed_password = self.password_service.hash_password(user_data.password)

            # Create user with UserCreate object
            user = await self.user_repo.create_user(
                user_data=user_data,
                password_hash=hashed_password
            )

            if not user:
                raise Exception("Failed to create user")

            logger.info(f"User registered: {user.email} (ID: {user.id})")

            # Create tokens and session
            tokens = await self._create_session(
                user_id=user.id,
                email=user.email,
                role=user.role,
                ip_address=ip_address,
                user_agent=user_agent,
            )

            # Prepare user response
            user_response = UserResponse(
                id=user.id,
                email=user.email,
                role=user.role,
                status=user.status,
                first_name=user.first_name,
                last_name=user.last_name,
                phone=user.phone,
                address=user.address,
                city=user.city,
                language=user.language,
                avatar_url=user.avatar_url,
                created_at=user.created_at,
                updated_at=user.updated_at,
                last_login=user.last_login,
            )

            return {
                **tokens,
                "user": user_response.dict(),
            }

        except Exception as e:
            logger.error(f"Registration failed: {str(e)}")
            raise

    async def login(
        self,
        email: str,
        password: str,
        remember_me: bool = False,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Login user

        Args:
            email: User email
            password: User password
            remember_me: Extended session duration
            ip_address: Client IP address
            user_agent: Client user agent

        Returns:
            Dict: Login response with user data and tokens

        Raises:
            Exception: If login fails
        """
        try:
            # Find user by email WITH password hash (for authentication)
            user_data = await self.user_repo.find_by_email_with_password(email)
            if not user_data:
                raise Exception("Invalid email or password")

            # Verify password
            if not self.password_service.verify_password(password, user_data["password_hash"]):
                logger.warning(f"Failed login attempt for {email}")
                raise Exception("Invalid email or password")

            # Map user data to UserResponse model (excluding password_hash)
            user = self.user_repo._map_to_model(user_data)

            # Check user status
            if user.status == UserStatus.suspended:
                raise Exception("Account is suspended")
            elif user.status == UserStatus.inactive:
                raise Exception("Account is inactive")
            elif user.status == UserStatus.pending_verification:
                raise Exception("Account is pending verification")

            logger.info(f"User logged in: {user.email} (ID: {user.id})")

            # Update last login
            await self.user_repo.update_last_login(user.id)

            # Create tokens and session (with extended expiry if remember_me)
            tokens = await self._create_session(
                user_id=user.id,
                email=user.email,
                role=user.role,
                ip_address=ip_address,
                user_agent=user_agent,
                remember_me=remember_me,
            )

            # Prepare user response
            user_response = UserResponse(
                id=user.id,
                email=user.email,
                role=user.role,
                status=user.status,
                first_name=user.first_name,
                last_name=user.last_name,
                phone=user.phone,
                address=user.address,
                city=user.city,
                language=user.language,
                avatar_url=user.avatar_url,
                created_at=user.created_at,
                updated_at=user.updated_at,
                last_login=datetime.utcnow(),
            )

            return {
                **tokens,
                "user": user_response.dict(),
            }

        except Exception as e:
            logger.error(f"Login failed: {str(e)}")
            raise

    async def refresh_tokens(
        self,
        refresh_token: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> TokenRefreshResponse:
        """
        Refresh access token using refresh token

        Args:
            refresh_token: Refresh token
            ip_address: Client IP address
            user_agent: Client user agent

        Returns:
            TokenRefreshResponse: New token pair

        Raises:
            Exception: If refresh fails
        """
        try:
            # Verify refresh token (JWT)
            payload = self.jwt_service.verify_refresh_token(refresh_token)
            if not payload:
                raise Exception("Invalid or expired refresh token")

            user_id = payload.get("sub")

            # Find refresh token in database
            token_record = await self.token_repo.find_by_token(refresh_token)
            if not token_record:
                raise Exception("Refresh token not found or revoked")

            # Find associated session
            session = await self.session_repo.find_by_id(token_record.session_id)
            if not session or session.status != "active":
                raise Exception("Session is not active")

            # Get user data
            user = await self.user_repo.find_by_id(user_id)
            if not user:
                raise Exception("User not found")

            # Check user status
            if user.status != UserStatus.active:
                raise Exception("User account is not active")

            # Update token last used
            await self.token_repo.update_last_used(token_record.id)

            # Create new token pair
            new_tokens = self.jwt_service.create_token_pair(
                subject=user_id,
                user_data={
                    "email": user.email,
                    "role": user.role.value,
                },
            )

            # Update session with new tokens
            now = datetime.utcnow()
            new_expires_at = now + timedelta(days=7)

            # Create new session (revoke old one)
            await self.session_repo.revoke_session(session.id)
            await self.token_repo.revoke_by_session(session.id)

            # Create new session with new tokens
            session_data = SessionCreate(
                user_id=user_id,
                access_token=new_tokens["access_token"],
                refresh_token=new_tokens["refresh_token"],
                ip_address=ip_address or session.ip_address,
                user_agent=user_agent or session.user_agent,
                device_info=session.device_info,
                expires_at=new_expires_at,
            )

            new_session = await self.session_repo.create_session(session_data)

            # Create new refresh token record
            token_data = RefreshTokenCreate(
                token=new_tokens["refresh_token"],
                user_id=user_id,
                session_id=new_session.id,
                expires_at=new_expires_at,
            )

            await self.token_repo.create_token(token_data)

            logger.info(f"Tokens refreshed for user: {user_id}")

            return TokenRefreshResponse(
                access_token=new_tokens["access_token"],
                refresh_token=new_tokens["refresh_token"],
                token_type="bearer",
                expires_in=new_tokens["expires_in"],
            )

        except Exception as e:
            logger.error(f"Token refresh failed: {str(e)}")
            raise

    async def logout(
        self,
        refresh_token: Optional[str] = None,
        access_token: Optional[str] = None,
        all_sessions: bool = False,
    ) -> LogoutResponse:
        """
        Logout user (revoke tokens and session)

        Args:
            refresh_token: Refresh token to revoke
            access_token: Access token to identify session
            all_sessions: Revoke all user sessions

        Returns:
            LogoutResponse: Logout status

        Raises:
            Exception: If logout fails
        """
        try:
            sessions_revoked = 0

            # Get user_id from token
            user_id = None
            if refresh_token:
                payload = self.jwt_service.decode_token(refresh_token)
                if payload:
                    user_id = payload.get("sub")
            elif access_token:
                payload = self.jwt_service.decode_token(access_token)
                if payload:
                    user_id = payload.get("sub")

            if not user_id:
                raise Exception("Invalid token")

            if all_sessions:
                # Revoke all user sessions
                sessions_revoked = await self.session_repo.revoke_all_user_sessions(user_id)
                await self.token_repo.revoke_all_user_tokens(user_id)
                logger.info(f"All sessions revoked for user: {user_id}")

            else:
                # Revoke specific session
                if refresh_token:
                    token_record = await self.token_repo.find_by_token(refresh_token)
                    if token_record:
                        await self.session_repo.revoke_session(token_record.session_id)
                        await self.token_repo.revoke_by_session(token_record.session_id)
                        sessions_revoked = 1

                elif access_token:
                    session = await self.session_repo.find_by_access_token(access_token)
                    if session:
                        await self.session_repo.revoke_session(session.id)
                        await self.token_repo.revoke_by_session(session.id)
                        sessions_revoked = 1

                logger.info(f"Session revoked for user: {user_id}")

            return LogoutResponse(
                message="Logout successful",
                sessions_revoked=sessions_revoked,
            )

        except Exception as e:
            logger.error(f"Logout failed: {str(e)}")
            raise

    async def validate_access_token(self, access_token: str) -> Optional[Dict[str, Any]]:
        """
        Validate access token and return user data

        Args:
            access_token: JWT access token

        Returns:
            Optional[Dict]: User data if valid, None otherwise
        """
        try:
            # Verify JWT token
            payload = self.jwt_service.verify_access_token(access_token)
            if not payload:
                return None

            # Find session
            session = await self.session_repo.find_by_access_token(access_token)
            if not session or session.status != "active":
                logger.warning("Session not found or not active")
                return None

            # Update session activity
            await self.session_repo.update_last_activity(session.id)

            return payload

        except Exception as e:
            logger.error(f"Token validation failed: {str(e)}")
            return None

    async def _create_session(
        self,
        user_id: str,
        email: str,
        role: UserRole,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        remember_me: bool = False,
    ) -> Dict[str, Any]:
        """
        Internal method to create session and tokens

        Args:
            user_id: User ID
            email: User email
            role: User role
            ip_address: Client IP
            user_agent: Client user agent
            remember_me: Extended session

        Returns:
            Dict: Token data
        """
        # Create token pair
        tokens = self.jwt_service.create_token_pair(
            subject=user_id,
            user_data={
                "email": email,
                "role": role.value if isinstance(role, UserRole) else role,
            },
        )

        # Calculate session expiration
        expires_at = datetime.utcnow() + timedelta(
            days=30 if remember_me else 7
        )

        # Create session
        session_data = SessionCreate(
            user_id=user_id,
            access_token=tokens["access_token"],
            refresh_token=tokens["refresh_token"],
            ip_address=ip_address,
            user_agent=user_agent,
            device_info=None,
            expires_at=expires_at,
        )

        session = await self.session_repo.create_session(session_data)

        # Create refresh token record
        token_data = RefreshTokenCreate(
            token=tokens["refresh_token"],
            user_id=user_id,
            session_id=session.id,
            expires_at=expires_at,
        )

        await self.token_repo.create_token(token_data)

        return tokens


# Singleton instance
_auth_service_instance: Optional[AuthService] = None


def get_auth_service() -> AuthService:
    """
    Get auth service singleton instance

    Returns:
        AuthService: Auth service instance
    """
    global _auth_service_instance

    if _auth_service_instance is None:
        _auth_service_instance = AuthService()

    return _auth_service_instance
