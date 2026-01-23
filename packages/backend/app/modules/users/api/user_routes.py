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
from app.database.connection import get_database, db_manager

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
    - Sends email notification to user (ONLY if password change succeeds)
    - Sends SMS notification if user has phone number configured
    """
    import uuid

    try:
        # Convert user_id to UUID for database operations
        try:
            user_uuid = uuid.UUID(str(current_user.id))
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user ID format"
            )

        # Use database connection manager for all DB operations
        async with db_manager.get_connection() as db:
            # Get hashed password from database
            query = "SELECT password_hash FROM users WHERE id = $1"
            result = await db.fetchrow(query, user_uuid)

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

            # Update password in database with RETURNING to confirm update
            update_query = """
                UPDATE users
                SET password_hash = $1, updated_at = NOW()
                WHERE id = $2
                RETURNING id
            """
            update_result = await db.fetchrow(update_query, new_password_hash, user_uuid)

            # Verify the update was successful
            if not update_result:
                logger.error(f"Password update failed for user {current_user.id} - no rows affected")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to update password"
                )

            logger.info(f"Password successfully updated for user {current_user.id}")

            # Log activity (non-blocking - errors won't affect response)
            try:
                activity = UserActivity(
                    user_id=current_user.id,
                    action="change_password",
                    resource="user_password",
                    timestamp=datetime.utcnow()
                )
                await user_repository.log_user_activity(activity)
            except Exception as log_error:
                logger.warning(f"Failed to log password change activity: {log_error}")

        # =================================================================
        # SEND SECURITY NOTIFICATIONS via EventBus (SMS + Email)
        # IMPORTANT: Only send AFTER password change is confirmed
        # Uses fire-and-forget pattern (non-blocking)
        # =================================================================
        try:
            from app.core.events import EventBus, EventType

            now = datetime.utcnow()

            # Publish password changed event - notification handler will send email + SMS
            EventBus.publish_nowait(EventType.USER_PASSWORD_CHANGED, {
                "user_id": str(current_user.id),
                "user_email": current_user.email,
                "user_phone": current_user.phone_number,
                "user_name": f"{current_user.first_name} {current_user.last_name}",
                "preferred_language": current_user.preferred_language or "es",
                "date": now.strftime("%d/%m/%Y"),
                "time": now.strftime("%H:%M"),
            })
            logger.info(f"USER_PASSWORD_CHANGED event published for user {current_user.id}")

        except Exception as event_error:
            # Log but don't fail - password change was successful
            logger.error(f"Failed to publish password change event: {event_error}")

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
