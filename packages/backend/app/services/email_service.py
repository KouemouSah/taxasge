"""
Email Service for TaxasGE Backend
Handles email sending via SMTP (Gmail) for auth features
MODULE_02: Authentication Advanced Features
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, List
from loguru import logger


class EmailService:
    """Service for sending emails via SMTP"""

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
        self, to_email: str, verification_code: str, user_name: Optional[str] = None
    ) -> bool:
        """
        Send email verification code

        Args:
            to_email: Recipient email address
            verification_code: 6-digit verification code
            user_name: User's name (optional)

        Returns:
            bool: True if email sent successfully, False otherwise
        """
        subject = "TaxasGE - Verify Your Email Address"

        greeting = f"Hello {user_name}," if user_name else "Hello,"

        body_html = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2563eb;">Email Verification</h2>
                    <p>{greeting}</p>
                    <p>Thank you for registering with TaxasGE. Please verify your email address by entering the following code:</p>
                    <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                        <h1 style="margin: 0; color: #2563eb; letter-spacing: 8px; font-size: 32px;">{verification_code}</h1>
                    </div>
                    <p>This code will expire in <strong>15 minutes</strong>.</p>
                    <p>If you didn't request this code, please ignore this email.</p>
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 12px;">
                        This is an automated message from TaxasGE Platform. Please do not reply to this email.
                    </p>
                </div>
            </body>
        </html>
        """

        body_text = f"""
        Email Verification

        {greeting}

        Thank you for registering with TaxasGE. Please verify your email address by entering the following code:

        {verification_code}

        This code will expire in 15 minutes.

        If you didn't request this code, please ignore this email.

        ---
        This is an automated message from TaxasGE Platform.
        """

        return self.send_email(to_email, subject, body_html, body_text)

    def send_password_reset_email(
        self, to_email: str, reset_token: str, user_name: Optional[str] = None
    ) -> bool:
        """
        Send password reset email with reset link

        Args:
            to_email: Recipient email address
            reset_token: Password reset token
            user_name: User's name (optional)

        Returns:
            bool: True if email sent successfully, False otherwise
        """
        subject = "TaxasGE - Password Reset Request"

        # TODO: Replace with actual frontend URL from environment variable
        # For now using placeholder
        reset_url = f"https://taxasge.com/reset-password?token={reset_token}"

        greeting = f"Hello {user_name}," if user_name else "Hello,"

        body_html = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2563eb;">Password Reset Request</h2>
                    <p>{greeting}</p>
                    <p>We received a request to reset your password for your TaxasGE account.</p>
                    <p>Click the button below to reset your password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{reset_url}"
                           style="background-color: #2563eb; color: white; padding: 12px 30px;
                                  text-decoration: none; border-radius: 6px; display: inline-block;
                                  font-weight: bold;">
                            Reset Password
                        </a>
                    </div>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="background-color: #f3f4f6; padding: 10px; word-break: break-all; border-radius: 4px;">
                        {reset_url}
                    </p>
                    <p>This link will expire in <strong>1 hour</strong>.</p>
                    <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 12px;">
                        This is an automated message from TaxasGE Platform. Please do not reply to this email.
                    </p>
                </div>
            </body>
        </html>
        """

        body_text = f"""
        Password Reset Request

        {greeting}

        We received a request to reset your password for your TaxasGE account.

        Click the link below to reset your password:
        {reset_url}

        This link will expire in 1 hour.

        If you didn't request a password reset, please ignore this email and your password will remain unchanged.

        ---
        This is an automated message from TaxasGE Platform.
        """

        return self.send_email(to_email, subject, body_html, body_text)

    def send_password_reset_confirmation(
        self, to_email: str, user_name: Optional[str] = None
    ) -> bool:
        """
        Send password reset confirmation email

        Args:
            to_email: Recipient email address
            user_name: User's name (optional)

        Returns:
            bool: True if email sent successfully, False otherwise
        """
        subject = "TaxasGE - Password Successfully Reset"

        greeting = f"Hello {user_name}," if user_name else "Hello,"

        body_html = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #10b981;">Password Reset Successful</h2>
                    <p>{greeting}</p>
                    <p>Your password has been successfully reset.</p>
                    <p>You can now log in to your TaxasGE account using your new password.</p>
                    <p>If you didn't make this change, please contact our support team immediately.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://taxasge.com/login"
                           style="background-color: #2563eb; color: white; padding: 12px 30px;
                                  text-decoration: none; border-radius: 6px; display: inline-block;
                                  font-weight: bold;">
                            Log In to TaxasGE
                        </a>
                    </div>
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 12px;">
                        This is an automated message from TaxasGE Platform. Please do not reply to this email.
                    </p>
                </div>
            </body>
        </html>
        """

        body_text = f"""
        Password Reset Successful

        {greeting}

        Your password has been successfully reset.

        You can now log in to your TaxasGE account using your new password.

        If you didn't make this change, please contact our support team immediately.

        ---
        This is an automated message from TaxasGE Platform.
        """

        return self.send_email(to_email, subject, body_html, body_text)

    def send_2fa_code(
        self, to_email: str, code: str, user_name: Optional[str] = None
    ) -> bool:
        """
        Send 2FA verification code via email (backup method)

        Args:
            to_email: Recipient email address
            code: 6-digit 2FA code
            user_name: User's name (optional)

        Returns:
            bool: True if email sent successfully, False otherwise
        """
        subject = "TaxasGE - Two-Factor Authentication Code"

        greeting = f"Hello {user_name}," if user_name else "Hello,"

        body_html = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2563eb;">Two-Factor Authentication</h2>
                    <p>{greeting}</p>
                    <p>Your two-factor authentication code is:</p>
                    <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                        <h1 style="margin: 0; color: #2563eb; letter-spacing: 8px; font-size: 32px;">{code}</h1>
                    </div>
                    <p>This code will expire in <strong>5 minutes</strong>.</p>
                    <p>If you didn't request this code, someone may be trying to access your account. Please secure your account immediately.</p>
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 12px;">
                        This is an automated message from TaxasGE Platform. Please do not reply to this email.
                    </p>
                </div>
            </body>
        </html>
        """

        body_text = f"""
        Two-Factor Authentication

        {greeting}

        Your two-factor authentication code is:

        {code}

        This code will expire in 5 minutes.

        If you didn't request this code, someone may be trying to access your account. Please secure your account immediately.

        ---
        This is an automated message from TaxasGE Platform.
        """

        return self.send_email(to_email, subject, body_html, body_text)
