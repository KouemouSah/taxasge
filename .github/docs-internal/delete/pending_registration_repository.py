"""
Repository for pending_registrations table (minimal 6-column version)
Handles email verification codes with expiration
"""
from datetime import datetime, timedelta, timezone
from typing import Optional
from loguru import logger

from app.database.connection import db_manager


class PendingRegistrationRepository:
    """Repository for managing pending email verifications"""

    def __init__(self):
        self.db_manager = db_manager

    async def create(
        self,
        email: str,
        verification_code: str,
        expires_in_minutes: int = 15
    ) -> str:
        """
        Create pending registration entry

        Args:
            email: User email
            verification_code: 6-digit code
            expires_in_minutes: TTL in minutes (default 15)

        Returns:
            str: Created record ID

        Raises:
            Exception: If email already has pending verification
        """
        try:
            expires_at = datetime.now(timezone.utc) + timedelta(minutes=expires_in_minutes)

            query = """
                INSERT INTO pending_registrations (email, verification_code, expires_at)
                VALUES ($1, $2, $3)
                ON CONFLICT (email) DO UPDATE
                SET verification_code = $2,
                    expires_at = $3,
                    created_at = NOW(),
                    verification_attempts = 0
                RETURNING id
            """

            row = await self.db_manager.execute_single(
                query, email, verification_code, expires_at
            )

            logger.info(f"Pending registration created/updated for {email}, expires {expires_at}")
            return str(row['id'])

        except Exception as e:
            logger.error(f"Error creating pending registration for {email}: {e}")
            raise

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
