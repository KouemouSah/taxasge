"""
Repository for pending_registrations table
Handles email verification codes with expiration and metadata for agent/admin invitations

Module: Auth
Architecture: 3-tier (Routes → Services → Repositories)

Migration 055 adds metadata JSONB column for storing:
- registration_type: 'user' | 'agent' | 'admin'
- agent_data: profile configuration for agents
- user_data: name, phone, language for agents/admins
- created_by: admin UUID who initiated the invitation
"""
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from loguru import logger
import json

from app.database.connection import db_manager


class PendingRegistrationRepository:
    """Repository for managing pending email verifications"""

    def __init__(self):
        self.db_manager = db_manager

    async def create(
        self,
        email: str,
        verification_code: str,
        expires_in_minutes: int = 15,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Create pending registration entry

        Args:
            email: User email
            verification_code: 6-digit code
            expires_in_minutes: TTL in minutes (default 15)
            metadata: Optional JSONB data for agent/admin invitations

        Returns:
            str: Created record ID

        Raises:
            Exception: If email already has pending verification
        """
        try:
            expires_at = datetime.now(timezone.utc) + timedelta(minutes=expires_in_minutes)
            metadata_json = json.dumps(metadata or {})

            query = """
                INSERT INTO pending_registrations (email, verification_code, expires_at, metadata)
                VALUES ($1, $2, $3, $4::jsonb)
                ON CONFLICT (email) DO UPDATE
                SET verification_code = $2,
                    expires_at = $3,
                    metadata = $4::jsonb,
                    created_at = NOW(),
                    verification_attempts = 0
                RETURNING id
            """

            row = await self.db_manager.execute_single(
                query, email, verification_code, expires_at, metadata_json
            )

            reg_type = (metadata or {}).get('registration_type', 'user')
            logger.info(f"Pending registration created/updated for {email} (type={reg_type}), expires {expires_at}")
            return str(row['id'])

        except Exception as e:
            logger.error(f"Error creating pending registration for {email}: {e}")
            raise

    async def create_agent_invitation(
        self,
        email: str,
        verification_code: str,
        user_data: Dict[str, Any],
        agent_data: Dict[str, Any],
        created_by: str,
        expires_in_minutes: int = 1440  # 24 hours for agent invitations
    ) -> str:
        """
        Create pending agent invitation

        Args:
            email: Agent's email
            verification_code: 6-digit code
            user_data: User info (first_name, last_name, phone_number, preferred_language)
            agent_data: Agent profile config (agent_type, entity_id, ministry_id, etc.)
            created_by: Admin UUID who initiated the invitation
            expires_in_minutes: TTL in minutes (default 24 hours)

        Returns:
            str: Created record ID
        """
        metadata = {
            'registration_type': 'agent',
            'user_data': user_data,
            'agent_data': agent_data,
            'created_by': str(created_by),
        }

        return await self.create(
            email=email,
            verification_code=verification_code,
            expires_in_minutes=expires_in_minutes,
            metadata=metadata
        )

    async def create_admin_invitation(
        self,
        email: str,
        verification_code: str,
        user_data: Dict[str, Any],
        created_by: str,
        expires_in_minutes: int = 1440  # 24 hours
    ) -> str:
        """
        Create pending admin invitation

        Args:
            email: Admin's email
            verification_code: 6-digit code
            user_data: User info (first_name, last_name, phone_number, preferred_language)
            created_by: Admin UUID who initiated the invitation
            expires_in_minutes: TTL in minutes (default 24 hours)

        Returns:
            str: Created record ID
        """
        metadata = {
            'registration_type': 'admin',
            'user_data': user_data,
            'created_by': str(created_by),
        }

        return await self.create(
            email=email,
            verification_code=verification_code,
            expires_in_minutes=expires_in_minutes,
            metadata=metadata
        )

    async def find_by_email(self, email: str) -> Optional[dict]:
        """
        Find pending registration by email

        Args:
            email: User email

        Returns:
            Optional[dict]: Pending registration data or None
        """
        try:
            query = "SELECT * FROM pending_registrations WHERE email = $1"
            row = await self.db_manager.execute_single(query, email)
            return dict(row) if row else None

        except Exception as e:
            logger.error(f"Error finding pending registration for {email}: {e}")
            return None

    async def verify_code(self, email: str, code: str) -> bool:
        """
        Verify code and check expiration

        Args:
            email: User email
            code: 6-digit code

        Returns:
            bool: True if code is valid and not expired

        Side effects:
            - Increments verification_attempts if code is wrong
            - Deletes record if attempts >= 5 or expired
        """
        try:
            pending = await self.find_by_email(email)

            if not pending:
                logger.warning(f"No pending registration found for {email}")
                return False

            # Use timezone-aware datetime for comparison
            now_utc = datetime.now(timezone.utc)
            logger.info(f"Verifying code for {email}: stored='{pending['verification_code']}', received='{code}', expires_at={pending['expires_at']}, now={now_utc}")

            # Check if expired
            if now_utc > pending['expires_at']:
                await self.delete_by_email(email)
                logger.info(f"Verification code expired for {email}")
                return False

            # Check if too many attempts
            if pending['verification_attempts'] >= 5:
                await self.delete_by_email(email)
                logger.warning(f"Too many verification attempts for {email}")
                return False

            # Check code
            if pending['verification_code'] != code:
                await self.increment_attempts(email)
                logger.warning(f"Wrong verification code for {email} (attempt {pending['verification_attempts'] + 1}/5) - stored:'{pending['verification_code']}' != received:'{code}'")
                return False

            # Success
            logger.info(f"Verification code valid for {email}")
            return True

        except Exception as e:
            logger.error(f"Error verifying code for {email}: {e}")
            return False

    async def verify_code_and_get_data(self, email: str, code: str) -> Optional[Dict[str, Any]]:
        """
        Verify code and return metadata if valid

        Args:
            email: User email
            code: 6-digit code

        Returns:
            Optional[Dict]: Metadata if valid, None if invalid/expired

        Side effects:
            - Increments verification_attempts if code is wrong
            - Deletes record if attempts >= 5 or expired
        """
        try:
            pending = await self.find_by_email(email)

            if not pending:
                logger.warning(f"No pending registration found for {email}")
                return None

            now_utc = datetime.now(timezone.utc)

            # Check if expired
            if now_utc > pending['expires_at']:
                await self.delete_by_email(email)
                logger.info(f"Verification code expired for {email}")
                return None

            # Check if too many attempts
            if pending['verification_attempts'] >= 5:
                await self.delete_by_email(email)
                logger.warning(f"Too many verification attempts for {email}")
                return None

            # Check code
            if pending['verification_code'] != code:
                await self.increment_attempts(email)
                logger.warning(f"Wrong verification code for {email}")
                return None

            # Success - return metadata (parse JSON if needed)
            logger.info(f"Verification code valid for {email}, returning metadata")
            raw_metadata = pending.get('metadata', {})
            logger.info(f"Raw metadata type: {type(raw_metadata)}, value: {raw_metadata}")

            # asyncpg may return JSONB as string depending on pool config
            metadata = raw_metadata
            if isinstance(metadata, (str, bytes)):
                if isinstance(metadata, bytes):
                    metadata = metadata.decode('utf-8')
                try:
                    metadata = json.loads(metadata) if metadata else {}
                    # Handle double-serialization case
                    while isinstance(metadata, str):
                        logger.warning(f"Double-serialized metadata detected, parsing again")
                        metadata = json.loads(metadata)
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse metadata JSON: {e}, raw: {raw_metadata}")
                    return {}

            if not isinstance(metadata, dict):
                logger.error(f"Metadata is not a dict after parsing: {type(metadata)}")
                return {}

            logger.info(f"Parsed metadata keys: {list(metadata.keys()) if metadata else 'empty'}")
            return metadata if metadata else {}

        except Exception as e:
            logger.error(f"Error verifying code for {email}: {e}")
            return None

    async def delete_by_email(self, email: str) -> bool:
        """
        Delete pending registration

        Args:
            email: User email

        Returns:
            bool: True if deleted
        """
        try:
            query = "DELETE FROM pending_registrations WHERE email = $1"
            await self.db_manager.execute_command(query, email)
            logger.info(f"Deleted pending registration for {email}")
            return True

        except Exception as e:
            logger.error(f"Error deleting pending registration for {email}: {e}")
            return False

    async def increment_attempts(self, email: str):
        """Increment verification attempts counter"""
        try:
            query = """
                UPDATE pending_registrations
                SET verification_attempts = verification_attempts + 1
                WHERE email = $1
            """
            await self.db_manager.execute_command(query, email)

        except Exception as e:
            logger.error(f"Error incrementing attempts for {email}: {e}")

    async def cleanup_expired(self) -> int:
        """
        Delete expired pending registrations (cron job)

        Returns:
            int: Number of deleted records
        """
        try:
            query = "DELETE FROM pending_registrations WHERE expires_at < NOW()"
            result = await self.db_manager.execute_command(query)

            # Extract count from result (e.g., "DELETE 5")
            count = int(result.split()[-1]) if result else 0
            logger.info(f"Cleaned up {count} expired pending registrations")
            return count

        except Exception as e:
            logger.error(f"Error cleaning up expired registrations: {e}")
            return 0
