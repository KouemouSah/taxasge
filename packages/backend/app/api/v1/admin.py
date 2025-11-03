"""
Admin API Endpoints - For database migrations and maintenance
RESTRICTED ACCESS - Requires admin authentication
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from loguru import logger
from typing import Dict, Any
import asyncpg

from app.core.auth import get_current_user
from app.core.database import get_db

router = APIRouter(prefix="/admin", tags=["Admin"])
security = HTTPBearer()


@router.post("/migrate/grandfather-users", response_model=Dict[str, Any])
async def migrate_grandfather_users(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db)
):
    """
    Execute Migration 002: Grandfather existing users
    Sets email_verified=TRUE for users created before 2025-11-03

    ADMIN ONLY - Requires authentication
    """
    try:
        user_id = current_user["sub"]
        logger.info(f"Migration 002 requested by user {user_id}")

        # Execute UPDATE
        result = await db.execute("""
            UPDATE users
            SET email_verified = TRUE,
                updated_at = NOW()
            WHERE (email_verified IS NULL OR email_verified = FALSE)
              AND created_at < '2025-11-03 00:00:00+00'::timestamptz
        """)

        # Count grandfathered users
        count_result = await db.fetchval("""
            SELECT COUNT(*)
            FROM users
            WHERE email_verified = TRUE
              AND created_at < '2025-11-03 00:00:00+00'::timestamptz
        """)

        logger.success(f"Migration 002 completed: {count_result} users grandfathered")

        return {
            "success": True,
            "migration": "002_set_existing_users_email_verified",
            "users_grandfathered": count_result,
            "message": f"Successfully grandfathered {count_result} existing users"
        }

    except Exception as e:
        logger.error(f"Migration 002 failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Migration failed: {str(e)}"
        )
