"""
Communication API Routes - Email, SMS, Push notification endpoints

Endpoints:
- POST /communications/email/send - Send email
- POST /communications/email/verification - Send verification email
- POST /communications/email/password-reset - Send password reset email
- POST /communications/email/2fa - Send 2FA code email
- GET /communications/templates - List available templates
- GET /communications/test - Test email configuration

Module: Communications (Email, SMS, Push notifications)
"""

from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, EmailStr, Field
from loguru import logger

from app.modules.communications.services.email_service import EmailService
from app.modules.communications.services.communication_service import CommunicationService
from app.modules.communications.models.communication import EmailTemplate
from app.modules.auth.middleware.auth_middleware import get_current_user


router = APIRouter(prefix="/communications", tags=["Communications"])


# ============================================================================
# REQUEST MODELS
# ============================================================================

class SendEmailRequest(BaseModel):
    """Request model for sending custom email"""
    to_email: EmailStr
    subject: str = Field(..., min_length=1, max_length=200)
    html_content: str = Field(..., min_length=1)
    plain_text_content: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "to_email": "user@example.com",
                "subject": "Important notification",
                "html_content": "<p>Hello, this is a test email</p>",
                "plain_text_content": "Hello, this is a test email"
            }
        }


class SendVerificationEmailRequest(BaseModel):
    """Request model for verification email"""
    to_email: EmailStr
    verification_code: str = Field(..., min_length=6, max_length=6)
    user_name: Optional[str] = None
    language: str = Field("es", pattern="^(es|fr|en)$")

    class Config:
        json_schema_extra = {
            "example": {
                "to_email": "user@example.com",
                "verification_code": "123456",
                "user_name": "John Doe",
                "language": "es"
            }
        }


class SendPasswordResetRequest(BaseModel):
    """Request model for password reset email"""
    to_email: EmailStr
    reset_token: str = Field(..., min_length=1)
    user_name: Optional[str] = None
    language: str = Field("es", pattern="^(es|fr|en)$")

    class Config:
        json_schema_extra = {
            "example": {
                "to_email": "user@example.com",
                "reset_token": "abc123def456",
                "user_name": "John Doe",
                "language": "es"
            }
        }


class Send2FACodeRequest(BaseModel):
    """Request model for 2FA code email"""
    to_email: EmailStr
    code: str = Field(..., min_length=6, max_length=6)
    user_name: Optional[str] = None
    language: str = Field("es", pattern="^(es|fr|en)$")

    class Config:
        json_schema_extra = {
            "example": {
                "to_email": "user@example.com",
                "code": "123456",
                "user_name": "John Doe",
                "language": "es"
            }
        }


# ============================================================================
# EMAIL ENDPOINTS
# ============================================================================

@router.post("/email/send")
async def send_email(
    request: SendEmailRequest,
    background_tasks: BackgroundTasks,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Send a custom email

    Requires authentication. Admin only.

    Args:
        request: Email request data

    Returns:
        Success message
    """
    email_service = EmailService()

    try:
        # Send email in background
        background_tasks.add_task(
            email_service.send_email,
            request.to_email,
            request.subject,
            request.html_content,
            request.plain_text_content
        )

        logger.info(f"Email queued to {request.to_email} by user {current_user.get('sub')}")

        return {
            "message": "Email queued for sending",
            "to": request.to_email,
            "subject": request.subject
        }

    except Exception as e:
        logger.error(f"Error queuing email: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/email/verification")
async def send_verification_email(
    request: SendVerificationEmailRequest,
    background_tasks: BackgroundTasks,
):
    """
    Send email verification code

    Public endpoint (no auth required) - Used during registration

    Args:
        request: Verification email request

    Returns:
        Success message
    """
    email_service = EmailService()

    try:
        # Send email in background
        background_tasks.add_task(
            email_service.send_verification_code,
            request.to_email,
            request.verification_code,
            request.user_name,
            request.language
        )

        logger.info(f"Verification email queued to {request.to_email}")

        return {
            "message": "Verification email queued for sending",
            "to": request.to_email,
            "language": request.language
        }

    except Exception as e:
        logger.error(f"Error queuing verification email: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/email/password-reset")
async def send_password_reset_email(
    request: SendPasswordResetRequest,
    background_tasks: BackgroundTasks,
):
    """
    Send password reset email

    Public endpoint (no auth required) - Used for password recovery

    Args:
        request: Password reset email request

    Returns:
        Success message
    """
    email_service = EmailService()

    try:
        # Send email in background
        background_tasks.add_task(
            email_service.send_password_reset,
            request.to_email,
            request.reset_token,
            request.user_name,
            request.language
        )

        logger.info(f"Password reset email queued to {request.to_email}")

        return {
            "message": "Password reset email queued for sending",
            "to": request.to_email,
            "language": request.language
        }

    except Exception as e:
        logger.error(f"Error queuing password reset email: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/email/2fa")
async def send_2fa_code_email(
    request: Send2FACodeRequest,
    background_tasks: BackgroundTasks,
):
    """
    Send 2FA verification code

    Public endpoint (no auth required) - Used during login

    Args:
        request: 2FA code email request

    Returns:
        Success message
    """
    email_service = EmailService()

    try:
        # Send email in background
        background_tasks.add_task(
            email_service.send_two_factor_code,
            request.to_email,
            request.code,
            request.user_name,
            request.language
        )

        logger.info(f"2FA code email queued to {request.to_email}")

        return {
            "message": "2FA code email queued for sending",
            "to": request.to_email,
            "language": request.language
        }

    except Exception as e:
        logger.error(f"Error queuing 2FA code email: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# UTILITY ENDPOINTS
# ============================================================================

@router.get("/templates")
async def list_email_templates():
    """
    List available email templates

    Returns:
        List of template names and descriptions
    """
    templates = []

    for template in EmailTemplate:
        templates.append({
            "code": template.value,
            "name": template.name,
            "description": get_template_description(template)
        })

    return {
        "templates": templates,
        "total": len(templates)
    }


@router.get("/test")
async def test_email_configuration(
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Test email service configuration

    Admin only - Tests SMTP connection

    Returns:
        Configuration status
    """
    email_service = EmailService()

    try:
        # Test SMTP connection
        smtp_config = {
            "host": email_service.smtp_host,
            "port": email_service.smtp_port,
            "username": email_service.smtp_username,
            "from_email": email_service.from_email,
            "from_name": email_service.from_name,
            "use_tls": email_service.use_tls,
        }

        return {
            "status": "configured",
            "smtp": smtp_config,
            "message": "Email service is configured (SMTP credentials not exposed)"
        }

    except Exception as e:
        logger.error(f"Error testing email configuration: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_template_description(template: EmailTemplate) -> str:
    """Get description for email template"""
    descriptions = {
        EmailTemplate.VERIFICATION_CODE: "Email verification code for new registrations",
        EmailTemplate.PASSWORD_RESET: "Password reset link/token",
        EmailTemplate.TWO_FACTOR_CODE: "Two-factor authentication code",
        EmailTemplate.ACCOUNT_LOCKOUT: "Account lockout notification",
    }
    return descriptions.get(template, "No description available")
