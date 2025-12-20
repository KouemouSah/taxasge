"""
User Profile API for TaxasGE Backend
Self-service user profile management endpoints
"""

from fastapi import APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from datetime import datetime
from loguru import logger

from app.modules.users.models import (
    UserUpdate, UserResponse, PasswordChange, UserActivity
)
from app.modules.users.repositories import UserRepository
from app.modules.auth.middleware.auth_middleware import get_current_user
from app.modules.auth.services.password_service import PasswordService
from app.database.connection import get_database

# Create router
router = APIRouter(tags=["Users - Profile"])
security = HTTPBearer()

# Initialize repository
user_repository = UserRepository()


@router.get("/profile", response_model=UserResponse)
async def get_user_profile(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Get current user profile

    Returns authenticated user's profile information
    """
    try:
        # Log activity
        activity = UserActivity(
            user_id=current_user.id,
            action="view_profile",
            resource="user_profile",
            timestamp=datetime.utcnow()
        )
        await user_repository.log_user_activity(activity)

        return current_user
    except Exception as e:
        logger.error(f"Error getting user profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving user profile"
        )


@router.put("/profile", response_model=UserResponse)
async def update_user_profile(
    user_update: UserUpdate,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Update current user profile

    **VALIDATION:**
    - Email format: EmailStr (RFC 5322)
    - Email uniqueness: 409 Conflict if duplicate
    - Phone E.164 format: +240XXXXXXXXX
    - Users cannot update their own status
    """
    try:
        # Convert update model to dict, excluding None values
        update_data = {
            k: v for k, v in user_update.dict(exclude_unset=True).items()
            if v is not None
        }

        # Email uniqueness check
        if "email" in update_data and update_data["email"] != current_user.email:
            existing_user = await user_repository.find_by_email(update_data["email"])
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Email already in use"
                )

        # Users cannot update their own status (admin only)
        if "status" in update_data:
            del update_data["status"]

        if not update_data:
            return current_user

        updated_user = await user_repository.update(current_user.id, update_data)
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Log activity
        activity = UserActivity(
            user_id=current_user.id,
            action="update_profile",
            resource="user_profile",
            metadata={"updated_fields": list(update_data.keys())},
            timestamp=datetime.utcnow()
        )
        await user_repository.log_user_activity(activity)

        return updated_user

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating user profile"
        )


@router.post("/profile/change-password", status_code=status.HTTP_200_OK)
async def change_password(
    password_change: PasswordChange,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Change user password

    **VALIDATION:**
    - Old password must match current password
    - New password must be different from old password
    - New password must meet strength requirements (8+ chars)

    **NOTIFICATIONS:**
    - Sends email notification to user
    - Sends SMS notification if user has phone number configured
    """
    try:
        # Verify old password
        user_data = await user_repository.find_by_id(current_user.id)
        if not user_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Get hashed password from database
        db = await get_database()
        query = "SELECT password_hash FROM users WHERE id = $1"
        result = await db.fetchrow(query, current_user.id)

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Verify old password
        password_service = PasswordService()
        if not password_service.verify_password(
            password_change.old_password,
            result["password_hash"]
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )

        # Hash new password
        new_password_hash = password_service.hash_password(password_change.new_password)

        # Update password in database
        update_query = """
            UPDATE users
            SET password_hash = $1, updated_at = NOW()
            WHERE id = $2
        """
        await db.execute(update_query, new_password_hash, current_user.id)

        # Log activity
        activity = UserActivity(
            user_id=current_user.id,
            action="change_password",
            resource="user_password",
            timestamp=datetime.utcnow()
        )
        await user_repository.log_user_activity(activity)

        # =====================================================================
        # SEND SECURITY NOTIFICATIONS (SMS + Email)
        # =====================================================================
        now = datetime.utcnow()
        change_date = now.strftime("%d/%m/%Y")
        change_time = now.strftime("%H:%M")

        # 1. Send Email notification
        try:
            from app.modules.communications.services.email_service import get_email_service
            from app.config import get_settings

            settings = get_settings()
            email_service = get_email_service()

            # Simple security email
            email_subject = "TaxasGE - Contraseña modificada / Mot de passe modifié"
            email_html = f"""
            <html>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #dc2626;">🔐 Alerta de Seguridad / Security Alert</h2>
                <p>Hola <strong>{current_user.first_name}</strong>,</p>
                <p>Tu contraseña de TaxasGE fue cambiada el <strong>{change_date}</strong> a las <strong>{change_time} UTC</strong>.</p>
                <p>Si no realizaste este cambio, contacta soporte inmediatamente.</p>
                <hr/>
                <p><em>Bonjour <strong>{current_user.first_name}</strong>,</em></p>
                <p><em>Votre mot de passe TaxasGE a été modifié le <strong>{change_date}</strong> à <strong>{change_time} UTC</strong>.</em></p>
                <p><em>Si vous n'avez pas effectué ce changement, contactez le support immédiatement.</em></p>
                <hr/>
                <p style="color: #666; font-size: 12px;">TaxasGE Platform - Equatorial Guinea</p>
            </body>
            </html>
            """

            email_sent = email_service.send_email(
                to_email=current_user.email,
                subject=email_subject,
                body_html=email_html
            )
            if email_sent:
                logger.info(f"Password change email notification sent to {current_user.email}")
            else:
                logger.warning(f"Failed to send password change email to {current_user.email}")

        except Exception as email_error:
            logger.error(f"Error sending password change email: {email_error}")

        # 2. Send SMS notification (if user has phone number)
        if current_user.phone_number:
            try:
                from app.modules.communications.services.sms_template_service import SmsTemplateService
                from app.modules.communications.models.sms_template import SmsTemplateRenderRequest
                from app.modules.communications.services.provider_settings_service import ProviderSettingsService
                from app.modules.communications.services.sms_provider_service import SmsService

                sms_template_service = SmsTemplateService()

                # Try to get the specific template, fallback to SECURITY_ALERT
                template = await sms_template_service.get_template_by_code(db, "SECURITY_PASSWORD_CHANGED")
                template_code = "SECURITY_PASSWORD_CHANGED"

                if not template:
                    template = await sms_template_service.get_template_by_code(db, "SECURITY_ALERT")
                    template_code = "SECURITY_ALERT"

                if template and template.is_active:
                    # Prepare variables based on template
                    if template_code == "SECURITY_PASSWORD_CHANGED":
                        variables = {"date": change_date, "time": change_time}
                    else:
                        # SECURITY_ALERT uses {{message}}
                        variables = {"message": f"Tu contraseña fue cambiada el {change_date} a las {change_time}"}

                    # Render template
                    render_request = SmsTemplateRenderRequest(
                        template_code=template_code,
                        language=current_user.preferred_language or "es",
                        variables=variables
                    )
                    rendered = await sms_template_service.render_template(db, render_request)

                    # Get SMS provider credentials
                    provider_service = ProviderSettingsService()
                    credentials = await provider_service.get_active_sms_credentials(db)

                    if credentials and credentials.get("api_key"):
                        sms_service = SmsService(
                            provider="infobip",
                            api_key=credentials["api_key"],
                            base_url="y45e8g.api.infobip.com",
                            sender_id="TaxasGE"
                        )

                        sms_result = sms_service.send_sms(
                            to=current_user.phone_number,
                            message=rendered.rendered_content
                        )

                        if sms_result.success:
                            logger.info(
                                f"Password change SMS notification sent to {current_user.phone_number}, "
                                f"message_id={sms_result.message_id}"
                            )
                        else:
                            logger.warning(
                                f"Failed to send password change SMS to {current_user.phone_number}: "
                                f"{sms_result.error}"
                            )
                    else:
                        logger.warning("No active SMS provider configured, skipping SMS notification")
                else:
                    logger.warning(f"SMS template {template_code} not found or inactive")

            except Exception as sms_error:
                logger.error(f"Error sending password change SMS: {sms_error}")

        return {
            "message": "Password changed successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error changing password: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error changing password"
        )


@router.post("/profile/avatar", response_model=UserResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Upload user avatar

    **VALIDATION:**
    - File must be an image (jpeg, jpg, png, gif)
    - Max file size: 5MB
    """
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be an image"
            )

        allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/gif"]
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type {file.content_type} not allowed. Allowed types: jpeg, jpg, png, gif"
            )

        # Read file content
        content = await file.read()

        # Validate file size (5MB max)
        max_size = 5 * 1024 * 1024  # 5MB
        if len(content) > max_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size exceeds maximum allowed size of 5MB"
            )

        # TODO: Upload to Firebase Storage
        # For now, we'll just return a placeholder URL
        avatar_url = f"https://storage.googleapis.com/taxasge-avatars/{current_user.id}/{file.filename}"

        # Update user avatar URL
        updated_user = await user_repository.update(
            current_user.id,
            {"avatar_url": avatar_url}
        )

        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Log activity
        activity = UserActivity(
            user_id=current_user.id,
            action="upload_avatar",
            resource="user_avatar",
            metadata={"filename": file.filename, "content_type": file.content_type},
            timestamp=datetime.utcnow()
        )
        await user_repository.log_user_activity(activity)

        return updated_user

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading avatar: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error uploading avatar"
        )


@router.delete("/profile/avatar", response_model=UserResponse)
async def delete_avatar(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Delete user avatar

    Removes the user's profile picture
    """
    try:
        # TODO: Delete from Firebase Storage
        # For now, we'll just remove the URL

        # Update user avatar URL to None
        updated_user = await user_repository.update(
            current_user.id,
            {"avatar_url": None}
        )

        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Log activity
        activity = UserActivity(
            user_id=current_user.id,
            action="delete_avatar",
            resource="user_avatar",
            timestamp=datetime.utcnow()
        )
        await user_repository.log_user_activity(activity)

        return updated_user

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting avatar: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting avatar"
        )
