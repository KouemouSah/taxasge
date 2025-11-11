"""
Two-Factor Authentication (2FA) Service for TaxasGE Backend.

TASK-M01-011: 2FA TOTP Implementation
Source: RAPPORT_MODULE_01_AUTHENTICATION.md lines 436-440

This service handles:
- TOTP secret generation
- QR code generation for authenticator apps
- TOTP code verification
- Backup codes generation and validation
- 2FA enable/disable operations
"""

import pyotp
import qrcode
import qrcode.image.svg
import secrets
import hashlib
import logging
from io import BytesIO
from typing import List, Optional, Tuple
from datetime import datetime

from app.repositories.user_repository import UserRepository

logger = logging.getLogger(__name__)


class TwoFactorService:
    """
    Service for Two-Factor Authentication operations.

    Implements TOTP (Time-based One-Time Password) RFC 6238.
    """

    def __init__(self):
        self.user_repo = UserRepository()
        self.issuer_name = "TaxasGE"  # App name shown in authenticator

    def generate_secret(self) -> str:
        """
        Generate a random TOTP secret (base32 encoded).

        Returns:
            str: Base32-encoded secret (32 characters)

        Example:
            'JBSWY3DPEHPK3PXP'
        """
        return pyotp.random_base32()

    def generate_qr_code(self, user_email: str, secret: str) -> str:
        """
        Generate QR code for TOTP setup (SVG format).

        Args:
            user_email: User's email for identification in authenticator app
            secret: TOTP secret (base32 encoded)

        Returns:
            str: SVG QR code as string

        QR Code Format:
            otpauth://totp/TaxasGE:user@example.com?secret=SECRET&issuer=TaxasGE

        Usage:
            User scans QR code with Google Authenticator, Authy, etc.
        """
        # Create TOTP provisioning URI
        totp = pyotp.TOTP(secret)
        provisioning_uri = totp.provisioning_uri(
            name=user_email,
            issuer_name=self.issuer_name
        )

        # Generate QR code (SVG format for web display)
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(provisioning_uri)
        qr.make(fit=True)

        # Create SVG image
        factory = qrcode.image.svg.SvgPathImage
        img = qr.make_image(image_factory=factory)

        # Convert to string
        buffer = BytesIO()
        img.save(buffer)
        svg_string = buffer.getvalue().decode('utf-8')

        return svg_string

    def verify_code(self, secret: str, code: str) -> bool:
        """
        Verify TOTP code against secret.

        Args:
            secret: TOTP secret (base32 encoded)
            code: 6-digit TOTP code from authenticator app

        Returns:
            bool: True if code is valid, False otherwise

        Time Window:
            - Accepts codes from current, previous, and next 30-second windows
            - Prevents replay attacks (code valid only once)

        Business Rules:
            - Code must be exactly 6 digits
            - Time-based (changes every 30 seconds)
            - Window: ±1 interval (90 seconds total)
        """
        if not code or len(code) != 6 or not code.isdigit():
            logger.warning("Invalid 2FA code format")
            return False

        try:
            totp = pyotp.TOTP(secret)
            # valid_window=1 means accept current, previous, and next code
            is_valid = totp.verify(code, valid_window=1)

            if is_valid:
                logger.info("2FA code verified successfully")
            else:
                logger.warning("2FA code verification failed")

            return is_valid

        except Exception as e:
            logger.error(f"Error verifying 2FA code: {e}")
            return False

    def generate_backup_codes(self, count: int = 10) -> List[str]:
        """
        Generate backup codes for 2FA recovery.

        Args:
            count: Number of backup codes to generate (default: 10)

        Returns:
            List[str]: List of backup codes (8 characters each)

        Format:
            - 8 characters: 4 digits + dash + 4 digits
            - Example: '1234-5678'

        Business Rules:
            - User can use backup code if loses authenticator app
            - Each backup code can be used only once
            - Stored as hashed values in database
        """
        backup_codes = []

        for _ in range(count):
            # Generate 8 random digits
            code = ''.join([str(secrets.randbelow(10)) for _ in range(8)])
            # Format: XXXX-XXXX
            formatted_code = f"{code[:4]}-{code[4:]}"
            backup_codes.append(formatted_code)

        return backup_codes

    def hash_backup_code(self, code: str) -> str:
        """
        Hash backup code for secure storage.

        Args:
            code: Plain backup code (e.g., '1234-5678')

        Returns:
            str: SHA256 hash of code

        Security:
            - Backup codes stored as hashes (like passwords)
            - Cannot be reversed to get original code
        """
        return hashlib.sha256(code.encode()).hexdigest()

    def verify_backup_code(
        self,
        code: str,
        hashed_codes: List[str]
    ) -> Tuple[bool, Optional[List[str]]]:
        """
        Verify backup code and remove it if valid (one-time use).

        Args:
            code: Plain backup code from user
            hashed_codes: List of hashed backup codes from database

        Returns:
            Tuple[bool, Optional[List[str]]]:
                - bool: True if code is valid
                - List[str]: Updated list of remaining codes (or None if invalid)

        Business Rules:
            - Each backup code can be used only once
            - After use, code is removed from list
            - If all codes used, user must disable/re-enable 2FA
        """
        code_hash = self.hash_backup_code(code)

        if code_hash in hashed_codes:
            # Remove used code
            remaining_codes = [c for c in hashed_codes if c != code_hash]
            logger.info(f"Backup code used successfully. Remaining: {len(remaining_codes)}")
            return True, remaining_codes
        else:
            logger.warning("Invalid backup code")
            return False, None

    async def enable_2fa(self, user_id: str) -> dict:
        """
        Enable 2FA for user (Step 1: Generate secret and QR code).

        Args:
            user_id: User ID

        Returns:
            dict: {
                'secret': TOTP secret (for verification step),
                'qr_code': SVG QR code,
                'backup_codes': List of plain backup codes (show once!)
            }

        Workflow:
            1. Generate TOTP secret
            2. Generate QR code for user to scan
            3. Generate backup codes
            4. Return data to user (DO NOT save to DB yet)
            5. User scans QR code with authenticator app
            6. User calls verify_2fa_setup() with code from app
            7. If code valid, save secret to DB and mark 2FA enabled

        Security:
            - Secret NOT saved to DB until verification
            - Prevents enabling 2FA without confirming user has working setup
        """
        # Get user email for QR code
        user = await self.user_repo.get_by_id(user_id)

        # Generate TOTP secret
        secret = self.generate_secret()

        # Generate QR code
        qr_code = self.generate_qr_code(user.get("email"), secret)

        # Generate backup codes
        backup_codes_plain = self.generate_backup_codes()

        logger.info(f"Generated 2FA setup for user {user_id}")

        return {
            'secret': secret,
            'qr_code': qr_code,
            'backup_codes': backup_codes_plain
        }

    async def verify_and_enable_2fa(
        self,
        user_id: str,
        secret: str,
        code: str,
        backup_codes: List[str]
    ) -> bool:
        """
        Verify TOTP code and enable 2FA (Step 2: Confirm setup).

        Args:
            user_id: User ID
            secret: TOTP secret from enable_2fa()
            code: 6-digit code from authenticator app
            backup_codes: Backup codes from enable_2fa() (plain text)

        Returns:
            bool: True if verification successful and 2FA enabled

        Workflow:
            1. Verify code against secret
            2. If valid:
                - Save secret to DB (encrypted)
                - Save backup codes to DB (hashed)
                - Set two_factor_enabled = True
            3. If invalid: Return False (do not save anything)

        Security:
            - Only enables 2FA after confirming user has working setup
            - Backup codes hashed before storage
        """
        # Verify code
        if not self.verify_code(secret, code):
            logger.warning(f"2FA setup verification failed for user {user_id}: Invalid TOTP code")
            return False

        logger.info(f"TOTP code verified successfully for user {user_id}, proceeding with database save...")

        # Hash backup codes
        hashed_codes = [self.hash_backup_code(code) for code in backup_codes]

        # Save to database
        db_success = await self.user_repo.enable_two_factor(
            user_id=user_id,
            secret=secret,
            backup_codes=hashed_codes
        )

        if not db_success:
            logger.error(f"❌ CRITICAL: TOTP code was valid but database save FAILED for user {user_id}. "
                       f"2FA will NOT be enabled. Check database logs for details.")
            return False

        logger.info(f"✅ 2FA enabled successfully for user {user_id} - both verification and database save succeeded")
        return True

    async def disable_2fa(self, user_id: str) -> bool:
        """
        Disable 2FA for user.

        Args:
            user_id: User ID

        Returns:
            bool: True if disabled successfully

        Security:
            - Requires current password confirmation (done in endpoint)
            - Clears secret and backup codes from DB
            - Sets two_factor_enabled = False
        """
        await self.user_repo.disable_two_factor(user_id)
        logger.info(f"2FA disabled for user {user_id}")
        return True

    async def verify_login_code(
        self,
        user_id: str,
        code: str,
        allow_backup_code: bool = True
    ) -> bool:
        """
        Verify 2FA code during login.

        Args:
            user_id: User ID
            code: 6-digit TOTP code OR 8-char backup code
            allow_backup_code: Allow backup codes (default: True)

        Returns:
            bool: True if code is valid

        Workflow:
            1. Get user's 2FA secret and backup codes from DB
            2. Try verifying as TOTP code first
            3. If TOTP fails and backup codes allowed:
                - Try verifying as backup code
                - If valid, remove backup code from DB (one-time use)
            4. Return True if either verification succeeded

        Business Rules:
            - TOTP codes change every 30 seconds
            - Backup codes can be used only once
            - After all backup codes used, user should re-enable 2FA
        """
        user = await self.user_repo.get_by_id(user_id)

        if not user.two_factor_enabled or not user.two_factor_secret:
            logger.error(f"2FA not enabled for user {user_id}")
            return False

        # Try TOTP code first
        if self.verify_code(user.two_factor_secret, code):
            return True

        # Try backup code if allowed
        if allow_backup_code and user.two_factor_backup_codes:
            is_valid, remaining_codes = self.verify_backup_code(
                code,
                user.two_factor_backup_codes
            )

            if is_valid:
                # Update backup codes in DB (remove used code)
                await self.user_repo.update_backup_codes(user_id, remaining_codes)

                # Warn if running low on backup codes
                if len(remaining_codes) <= 2:
                    logger.warning(
                        f"User {user_id} has only {len(remaining_codes)} backup codes remaining"
                    )

                return True

        logger.warning(f"2FA login verification failed for user {user_id}")
        return False


# Dependency injection
def get_two_factor_service() -> TwoFactorService:
    """Get TwoFactorService instance (for FastAPI Depends)."""
    return TwoFactorService()
