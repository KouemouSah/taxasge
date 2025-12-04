"""
Email Service for TaxasGE Backend
Handles email sending via SMTP with templating support

Module: Communications
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from datetime import datetime
from loguru import logger

from app.modules.communications.services.template_service import get_template_service


class EmailService:
    """Service for sending emails via SMTP with template support"""

    def __init__(
        self,
        smtp_host: str,
        smtp_port: int,
        smtp_username: str,
        smtp_password: str,
        smtp_use_tls: bool = True,
        smtp_from_email: Optional[str] = None,
        smtp_from_name: str = "TaxasGE Platform",
    ):
        """
        Initialize Email service

        Args:
            smtp_host: SMTP server hostname (e.g., smtp.gmail.com)
            smtp_port: SMTP server port (e.g., 587 for TLS)
            smtp_username: SMTP username (Gmail email)
            smtp_password: SMTP password (Gmail App Password)
            smtp_use_tls: Whether to use TLS (default True)
            smtp_from_email: From email address (defaults to smtp_username)
            smtp_from_name: From name displayed in email (default "TaxasGE Platform")
        """
        self.smtp_host = smtp_host
        self.smtp_port = smtp_port
        self.smtp_username = smtp_username
        self.smtp_password = smtp_password
        self.smtp_use_tls = smtp_use_tls
        self.smtp_from_email = smtp_from_email or smtp_username
        self.smtp_from_name = smtp_from_name

        # Initialize template service
        self.template_service = get_template_service()

        # Validate configuration
        if not all([smtp_host, smtp_port, smtp_username, smtp_password]):
            logger.warning(
                "EmailService initialized with incomplete SMTP configuration. "
                "Some email features may not work."
            )

        logger.info(
            f"EmailService initialized: {smtp_host}:{smtp_port}, "
            f"from={self.smtp_from_email}, TLS={smtp_use_tls}"
        )

    def _create_smtp_connection(self) -> smtplib.SMTP:
        """
        Create and authenticate SMTP connection

        Returns:
            smtplib.SMTP: Authenticated SMTP connection

        Raises:
            smtplib.SMTPException: If connection or authentication fails
        """
        try:
            # Create SMTP connection
            server = smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=10)

            if self.smtp_use_tls:
                server.starttls()

            # Authenticate
            server.login(self.smtp_username, self.smtp_password)

            return server

        except smtplib.SMTPException as e:
            logger.error(f"SMTP connection failed: {str(e)}")
            raise

    def send_email(
        self,
        to_email: str,
        subject: str,
        body_html: str,
        body_text: Optional[str] = None,
    ) -> bool:
        """
        Send an email

        Args:
            to_email: Recipient email address
            subject: Email subject
            body_html: Email body in HTML format
            body_text: Email body in plain text (optional, defaults to HTML stripped)

        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
            # Create message
            message = MIMEMultipart("alternative")
            message["From"] = f"{self.smtp_from_name} <{self.smtp_from_email}>"
            message["To"] = to_email
            message["Subject"] = subject

            # Attach plain text version
            if body_text:
                part_text = MIMEText(body_text, "plain")
                message.attach(part_text)

            # Attach HTML version
            part_html = MIMEText(body_html, "html")
            message.attach(part_html)

            # Send email
            server = self._create_smtp_connection()
            server.sendmail(self.smtp_from_email, to_email, message.as_string())
            server.quit()

            logger.info(f"Email sent successfully to {to_email}: {subject}")
            return True

        except smtplib.SMTPException as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False

        except Exception as e:
            logger.error(f"Unexpected error sending email to {to_email}: {str(e)}")
            return False

    def send_verification_code(
        self,
        to_email: str,
        verification_code: str,
        user_name: Optional[str] = None,
        language: str = "es",
    ) -> bool:
        """
        Send email verification code

        Args:
            to_email: Recipient email address
            verification_code: 6-digit verification code
            user_name: User's name (optional)
            language: Language code (es/fr/en, default: es)

        Returns:
            bool: True if email sent successfully, False otherwise
        """
        from app.modules.communications.services.email_content import get_email_content

        content = get_email_content("verification_email", language)
        subject = content["subject"]

        html, plain_text = self.template_service.render_verification_email(
            user_name, verification_code, language
        )

        return self.send_email(to_email, subject, html, plain_text)

    def send_password_reset_email(
        self,
        to_email: str,
        reset_token: str,
        user_name: Optional[str] = None,
        language: str = "es",
    ) -> bool:
        """
        Send password reset email with reset link

        Args:
            to_email: Recipient email address
            reset_token: Password reset token
            user_name: User's name (optional)
            language: Language code (es/fr/en, default: es)

        Returns:
            bool: True if email sent successfully, False otherwise
        """
        from app.modules.communications.services.email_content import get_email_content
        from app.config import get_settings

        settings = get_settings()

        # Use configured frontend URL (production: taxasge.emacsah.com)
        frontend_url = settings.FRONTEND_URL

        # IMPORTANT: URL must match Next.js route structure
        reset_url = f"{frontend_url}/auth/reset-password/confirm?token={reset_token}"

        content = get_email_content("password_reset", language)
        subject = content["subject"]

        html, plain_text = self.template_service.render_password_reset_email(
            user_name, reset_url, language
        )

        return self.send_email(to_email, subject, html, plain_text)

    def send_password_reset_confirmation(
        self,
        to_email: str,
        user_name: Optional[str] = None,
        language: str = "es",
    ) -> bool:
        """
        Send password reset confirmation email

        Args:
            to_email: Recipient email address
            user_name: User's name (optional)
            language: Language code (es/fr/en, default: es)

        Returns:
            bool: True if email sent successfully, False otherwise
        """
        from app.modules.communications.services.email_content import get_email_content

        content = get_email_content("password_reset_confirmation", language)
        subject = content["subject"]

        html, plain_text = self.template_service.render_password_reset_confirmation_email(
            user_name, language
        )

        return self.send_email(to_email, subject, html, plain_text)

    def send_2fa_code(
        self,
        to_email: str,
        code: str,
        user_name: Optional[str] = None,
        language: str = "es",
    ) -> bool:
        """
        Send 2FA verification code via email (backup method)

        Args:
            to_email: Recipient email address
            code: 6-digit 2FA code
            user_name: User's name (optional)
            language: Language code (es/fr/en, default: es)

        Returns:
            bool: True if email sent successfully, False otherwise
        """
        from app.modules.communications.services.email_content import get_email_content

        content = get_email_content("2fa_code", language)
        subject = content["subject"]

        html, plain_text = self.template_service.render_2fa_code_email(
            user_name, code, language
        )

        return self.send_email(to_email, subject, html, plain_text)

    def send_account_lockout_notification(
        self,
        to_email: str,
        user_name: Optional[str] = None,
        locked_until: datetime = None,
        language: str = "es",
    ) -> bool:
        """
        Send account lockout notification email

        Args:
            to_email: Recipient email address
            user_name: User's name (optional)
            locked_until: Timestamp when account will be unlocked
            language: Language code (es/fr/en, default: es)

        Returns:
            bool: True if email sent successfully, False otherwise
        """
        from datetime import timezone as tz
        from app.modules.communications.services.email_content import get_email_content

        # Calculate remaining time
        if locked_until:
            remaining_minutes = int((locked_until - datetime.now(tz.utc)).total_seconds() / 60)
        else:
            remaining_minutes = 10

        content = get_email_content("account_lockout", language)
        subject = content["subject"]

        html, plain_text = self.template_service.render_account_lockout_email(
            user_name, remaining_minutes, language
        )

        return self.send_email(to_email, subject, html, plain_text)


# ============================================================================
# FACTORY FUNCTION
# ============================================================================

def get_email_service() -> EmailService:
    """
    Get configured EmailService instance

    Returns:
        EmailService: Configured email service
    """
    from app.config import get_settings
    settings = get_settings()

    return EmailService(
        smtp_host=settings.SMTP_HOST,
        smtp_port=settings.SMTP_PORT,
        smtp_username=settings.SMTP_USERNAME,
        smtp_password=settings.SMTP_PASSWORD,
        smtp_use_tls=settings.SMTP_USE_TLS,
        smtp_from_email=settings.SMTP_FROM_EMAIL,
        smtp_from_name=settings.SMTP_FROM_NAME or "TaxasGE Platform",
    )
