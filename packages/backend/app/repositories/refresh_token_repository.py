"""
Refresh Token Repository for TaxasGE Backend
Handles refresh token data access and management
"""

from datetime import datetime, timedelta
from typing import Optional, List
from loguru import logger
import uuid
import hashlib

from app.core.supabase import get_supabase_client
from app.models.auth_models import (
    RefreshToken,
    RefreshTokenCreate,
    RefreshTokenResponse,
)


class RefreshTokenRepository:
    """Repository for refresh token data access"""

    def __init__(self):
        """Initialize refresh token repository with Supabase client"""
        self.supabase = get_supabase_client()
        self.table = "refresh_tokens"

    def _hash_token(self, token: str) -> str:
        """
        Hash a refresh token for secure storage

        Args:
            token: Plain text token

        Returns:
            str: Hashed token
        """
        return hashlib.sha256(token.encode()).hexdigest()

    async def create_token(self, token_data: RefreshTokenCreate) -> RefreshToken:
        """
        Create a new refresh token

        Args:
            token_data: Refresh token creation data

        Returns:
            RefreshToken: Created refresh token

        Raises:
            Exception: If token creation fails
        """
        try:
            token_id = str(uuid.uuid4())
            now = datetime.utcnow()

            # Hash the token before storing
            hashed_token = self._hash_token(token_data.token)

            # Prepare token record
            token_record = {
                "id": token_id,
                "token": hashed_token,
                "user_id": token_data.user_id,
                "session_id": token_data.session_id,
                "is_revoked": False,
                "expires_at": token_data.expires_at.isoformat(),
                "created_at": now.isoformat(),
                "revoked_at": None,
                "last_used_at": None,
            }

            # Insert into database
            result = self.supabase.table(self.table).insert(token_record).execute()

            if not result.data or len(result.data) == 0:
                raise Exception("Failed to create refresh token")

            logger.info(f"Refresh token created: {token_id} for user {token_data.user_id}")
            return RefreshToken(**result.data[0])

        except Exception as e:
            logger.error(f"Error creating refresh token: {str(e)}")
            raise Exception(f"Failed to create refresh token: {str(e)}")

    async def find_by_token(self, token: str) -> Optional[RefreshToken]:
        """
        Find refresh token by token value

        Args:
            token: Plain text token

        Returns:
            Optional[RefreshToken]: Token if found and valid, None otherwise
        """
        try:
            hashed_token = self._hash_token(token)
            result = (
                self.supabase.table(self.table)
                .select("*")
                .eq("token", hashed_token)
                .eq("is_revoked", False)
                .execute()
            )

            if result.data and len(result.data) > 0:
                token_data = result.data[0]

                # Check if token is expired
                expires_at = datetime.fromisoformat(token_data["expires_at"])
                if expires_at < datetime.utcnow():
                    logger.warning(f"Refresh token expired: {token_data['id']}")
                    return None

                return RefreshToken(**token_data)

            return None

        except Exception as e:
            logger.error(f"Error finding refresh token: {str(e)}")
            return None

    async def find_by_session(self, session_id: str) -> Optional[RefreshToken]:
        """
        Find refresh token by session ID

        Args:
            session_id: Session ID

        Returns:
            Optional[RefreshToken]: Token if found, None otherwise
        """
        try:
            result = (
                self.supabase.table(self.table)
                .select("*")
                .eq("session_id", session_id)
                .eq("is_revoked", False)
                .execute()
            )

            if result.data and len(result.data) > 0:
                return RefreshToken(**result.data[0])

            return None

        except Exception as e:
            logger.error(f"Error finding refresh token by session: {str(e)}")
            return None

    async def find_user_tokens(
        self, user_id: str, valid_only: bool = True
    ) -> List[RefreshTokenResponse]:
        """
        Find all refresh tokens for a user

        Args:
            user_id: User ID
            valid_only: Return only non-revoked tokens

        Returns:
            List[RefreshTokenResponse]: List of user refresh tokens
        """
        try:
            query = self.supabase.table(self.table).select("*").eq("user_id", user_id)

            if valid_only:
                query = query.eq("is_revoked", False)

            result = query.order("created_at", desc=True).execute()

            if result.data:
                return [RefreshTokenResponse(**token) for token in result.data]

            return []

        except Exception as e:
            logger.error(f"Error finding user refresh tokens: {str(e)}")
            return []

    async def update_last_used(self, token_id: str) -> bool:
        """
        Update token last used timestamp

        Args:
            token_id: Token ID

        Returns:
            bool: True if updated successfully
        """
        try:
            result = (
                self.supabase.table(self.table)
                .update({"last_used_at": datetime.utcnow().isoformat()})
                .eq("id", token_id)
                .execute()
            )

            return bool(result.data and len(result.data) > 0)

        except Exception as e:
            logger.error(f"Error updating token last used: {str(e)}")
            return False

    async def revoke_token(self, token_id: str) -> bool:
        """
        Revoke a refresh token

        Args:
            token_id: Token ID

        Returns:
            bool: True if revoked successfully
        """
        try:
            now = datetime.utcnow()
            result = (
                self.supabase.table(self.table)
                .update({
                    "is_revoked": True,
                    "revoked_at": now.isoformat(),
                })
                .eq("id", token_id)
                .execute()
            )

            success = bool(result.data and len(result.data) > 0)
            if success:
                logger.info(f"Refresh token revoked: {token_id}")

            return success

        except Exception as e:
            logger.error(f"Error revoking refresh token: {str(e)}")
            return False

    async def revoke_by_token_value(self, token: str) -> bool:
        """
        Revoke a refresh token by its value

        Args:
            token: Plain text token

        Returns:
            bool: True if revoked successfully
        """
        try:
            hashed_token = self._hash_token(token)
            now = datetime.utcnow()
            result = (
                self.supabase.table(self.table)
                .update({
                    "is_revoked": True,
                    "revoked_at": now.isoformat(),
                })
                .eq("token", hashed_token)
                .execute()
            )

            success = bool(result.data and len(result.data) > 0)
            if success:
                logger.info(f"Refresh token revoked by value")

            return success

        except Exception as e:
            logger.error(f"Error revoking refresh token by value: {str(e)}")
            return False

    async def revoke_by_session(self, session_id: str) -> bool:
        """
        Revoke refresh token by session ID

        Args:
            session_id: Session ID

        Returns:
            bool: True if revoked successfully
        """
        try:
            now = datetime.utcnow()
            result = (
                self.supabase.table(self.table)
                .update({
                    "is_revoked": True,
                    "revoked_at": now.isoformat(),
                })
                .eq("session_id", session_id)
                .execute()
            )

            success = bool(result.data and len(result.data) > 0)
            if success:
                logger.info(f"Refresh tokens revoked for session: {session_id}")

            return success

        except Exception as e:
            logger.error(f"Error revoking tokens by session: {str(e)}")
            return False

    async def revoke_all_user_tokens(self, user_id: str) -> int:
        """
        Revoke all refresh tokens for a user

        Args:
            user_id: User ID

        Returns:
            int: Number of tokens revoked
        """
        try:
            now = datetime.utcnow()
            result = (
                self.supabase.table(self.table)
                .update({
                    "is_revoked": True,
                    "revoked_at": now.isoformat(),
                })
                .eq("user_id", user_id)
                .eq("is_revoked", False)
                .execute()
            )

            count = len(result.data) if result.data else 0
            logger.info(f"Revoked {count} refresh tokens for user {user_id}")
            return count

        except Exception as e:
            logger.error(f"Error revoking user refresh tokens: {str(e)}")
            return 0

    async def cleanup_expired_tokens(self) -> int:
        """
        Clean up expired refresh tokens (mark as revoked)

        Returns:
            int: Number of tokens cleaned up
        """
        try:
            now = datetime.utcnow()
            result = (
                self.supabase.table(self.table)
                .update({
                    "is_revoked": True,
                    "revoked_at": now.isoformat(),
                })
                .eq("is_revoked", False)
                .lt("expires_at", now.isoformat())
                .execute()
            )

            count = len(result.data) if result.data else 0
            if count > 0:
                logger.info(f"Cleaned up {count} expired refresh tokens")

            return count

        except Exception as e:
            logger.error(f"Error cleaning up expired tokens: {str(e)}")
            return 0

    async def delete_old_tokens(self, days: int = 90) -> int:
        """
        Delete old revoked refresh tokens

        Args:
            days: Delete tokens older than this many days

        Returns:
            int: Number of tokens deleted
        """
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            result = (
                self.supabase.table(self.table)
                .delete()
                .eq("is_revoked", True)
                .lt("created_at", cutoff_date.isoformat())
                .execute()
            )

            count = len(result.data) if result.data else 0
            if count > 0:
                logger.info(f"Deleted {count} old refresh tokens")

            return count

        except Exception as e:
            logger.error(f"Error deleting old tokens: {str(e)}")
            return 0
