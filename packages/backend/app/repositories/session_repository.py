"""
Session Repository for TaxasGE Backend
Handles session data access and management
"""

from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from loguru import logger
import uuid

from app.database.supabase_client import get_supabase_client
from app.models.auth_models import (
    Session,
    SessionCreate,
    SessionResponse,
    SessionStatus,
)


class SessionRepository:
    """Repository for session data access"""

    def __init__(self):
        """Initialize session repository with Supabase client"""
        self.supabase = get_supabase_client()
        self.table = "sessions"

    async def create_session(self, session_data: SessionCreate) -> Session:
        """
        Create a new session

        Args:
            session_data: Session creation data

        Returns:
            Session: Created session

        Raises:
            Exception: If session creation fails
        """
        try:
            session_id = str(uuid.uuid4())
            now = datetime.utcnow()

            # Prepare session record
            session_record = {
                "id": session_id,
                "user_id": session_data.user_id,
                "access_token": session_data.access_token,
                "refresh_token": session_data.refresh_token,
                "status": SessionStatus.active.value,
                "ip_address": session_data.ip_address,
                "user_agent": session_data.user_agent,
                "device_info": session_data.device_info,
                "expires_at": session_data.expires_at.isoformat(),
                "created_at": now.isoformat(),
                "last_activity": now.isoformat(),
                "revoked_at": None,
            }

            # Insert into database
            result = self.supabase.table(self.table).insert(session_record).execute()

            if not result.data or len(result.data) == 0:
                raise Exception("Failed to create session")

            logger.info(f"Session created: {session_id} for user {session_data.user_id}")
            return Session(**result.data[0])

        except Exception as e:
            logger.error(f"Error creating session: {str(e)}")
            raise Exception(f"Failed to create session: {str(e)}")

    async def find_by_id(self, session_id: str) -> Optional[Session]:
        """
        Find session by ID

        Args:
            session_id: Session ID

        Returns:
            Optional[Session]: Session if found, None otherwise
        """
        try:
            result = (
                self.supabase.table(self.table)
                .select("*")
                .eq("id", session_id)
                .execute()
            )

            if result.data and len(result.data) > 0:
                return Session(**result.data[0])

            return None

        except Exception as e:
            logger.error(f"Error finding session by ID: {str(e)}")
            return None

    async def find_by_access_token(self, access_token: str) -> Optional[Session]:
        """
        Find session by access token

        Args:
            access_token: Access token

        Returns:
            Optional[Session]: Session if found, None otherwise
        """
        try:
            result = (
                self.supabase.table(self.table)
                .select("*")
                .eq("access_token", access_token)
                .eq("status", SessionStatus.active.value)
                .execute()
            )

            if result.data and len(result.data) > 0:
                return Session(**result.data[0])

            return None

        except Exception as e:
            logger.error(f"Error finding session by access token: {str(e)}")
            return None

    async def find_by_refresh_token(self, refresh_token: str) -> Optional[Session]:
        """
        Find session by refresh token

        Args:
            refresh_token: Refresh token

        Returns:
            Optional[Session]: Session if found, None otherwise
        """
        try:
            result = (
                self.supabase.table(self.table)
                .select("*")
                .eq("refresh_token", refresh_token)
                .eq("status", SessionStatus.active.value)
                .execute()
            )

            if result.data and len(result.data) > 0:
                return Session(**result.data[0])

            return None

        except Exception as e:
            logger.error(f"Error finding session by refresh token: {str(e)}")
            return None

    async def find_user_sessions(
        self, user_id: str, active_only: bool = True
    ) -> List[SessionResponse]:
        """
        Find all sessions for a user

        Args:
            user_id: User ID
            active_only: Return only active sessions

        Returns:
            List[SessionResponse]: List of user sessions
        """
        try:
            query = self.supabase.table(self.table).select("*").eq("user_id", user_id)

            if active_only:
                query = query.eq("status", SessionStatus.active.value)

            result = query.order("created_at", desc=True).execute()

            if result.data:
                return [SessionResponse(**session) for session in result.data]

            return []

        except Exception as e:
            logger.error(f"Error finding user sessions: {str(e)}")
            return []

    async def update_last_activity(self, session_id: str) -> bool:
        """
        Update session last activity timestamp

        Args:
            session_id: Session ID

        Returns:
            bool: True if updated successfully
        """
        try:
            result = (
                self.supabase.table(self.table)
                .update({"last_activity": datetime.utcnow().isoformat()})
                .eq("id", session_id)
                .execute()
            )

            return bool(result.data and len(result.data) > 0)

        except Exception as e:
            logger.error(f"Error updating session activity: {str(e)}")
            return False

    async def revoke_session(self, session_id: str) -> bool:
        """
        Revoke a session

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
                    "status": SessionStatus.revoked.value,
                    "revoked_at": now.isoformat(),
                })
                .eq("id", session_id)
                .execute()
            )

            success = bool(result.data and len(result.data) > 0)
            if success:
                logger.info(f"Session revoked: {session_id}")

            return success

        except Exception as e:
            logger.error(f"Error revoking session: {str(e)}")
            return False

    async def revoke_all_user_sessions(self, user_id: str) -> int:
        """
        Revoke all active sessions for a user

        Args:
            user_id: User ID

        Returns:
            int: Number of sessions revoked
        """
        try:
            now = datetime.utcnow()
            result = (
                self.supabase.table(self.table)
                .update({
                    "status": SessionStatus.revoked.value,
                    "revoked_at": now.isoformat(),
                })
                .eq("user_id", user_id)
                .eq("status", SessionStatus.active.value)
                .execute()
            )

            count = len(result.data) if result.data else 0
            logger.info(f"Revoked {count} sessions for user {user_id}")
            return count

        except Exception as e:
            logger.error(f"Error revoking user sessions: {str(e)}")
            return 0

    async def cleanup_expired_sessions(self) -> int:
        """
        Clean up expired sessions (mark as expired)

        Returns:
            int: Number of sessions cleaned up
        """
        try:
            now = datetime.utcnow()
            result = (
                self.supabase.table(self.table)
                .update({
                    "status": SessionStatus.expired.value,
                })
                .eq("status", SessionStatus.active.value)
                .lt("expires_at", now.isoformat())
                .execute()
            )

            count = len(result.data) if result.data else 0
            if count > 0:
                logger.info(f"Cleaned up {count} expired sessions")

            return count

        except Exception as e:
            logger.error(f"Error cleaning up expired sessions: {str(e)}")
            return 0

    async def delete_old_sessions(self, days: int = 30) -> int:
        """
        Delete old revoked/expired sessions

        Args:
            days: Delete sessions older than this many days

        Returns:
            int: Number of sessions deleted
        """
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            result = (
                self.supabase.table(self.table)
                .delete()
                .in_("status", [SessionStatus.expired.value, SessionStatus.revoked.value])
                .lt("created_at", cutoff_date.isoformat())
                .execute()
            )

            count = len(result.data) if result.data else 0
            if count > 0:
                logger.info(f"Deleted {count} old sessions")

            return count

        except Exception as e:
            logger.error(f"Error deleting old sessions: {str(e)}")
            return 0

    async def get_session_stats(self, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Get session statistics

        Args:
            user_id: Optional user ID to filter stats

        Returns:
            Dict: Session statistics
        """
        try:
            query = self.supabase.table(self.table).select("*")

            if user_id:
                query = query.eq("user_id", user_id)

            result = query.execute()

            if not result.data:
                return {
                    "total_sessions": 0,
                    "active_sessions": 0,
                    "expired_sessions": 0,
                    "revoked_sessions": 0,
                }

            sessions = result.data
            return {
                "total_sessions": len(sessions),
                "active_sessions": len([s for s in sessions if s["status"] == SessionStatus.active.value]),
                "expired_sessions": len([s for s in sessions if s["status"] == SessionStatus.expired.value]),
                "revoked_sessions": len([s for s in sessions if s["status"] == SessionStatus.revoked.value]),
            }

        except Exception as e:
            logger.error(f"Error getting session stats: {str(e)}")
            return {
                "total_sessions": 0,
                "active_sessions": 0,
                "expired_sessions": 0,
                "revoked_sessions": 0,
            }
