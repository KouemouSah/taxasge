"""
Auth API routes for TaxasGE Backend
Exports routers for auth endpoints
"""

import traceback
from loguru import logger

# Try to import auth_router with detailed error logging
try:
    from app.modules.auth.api.auth_routes import router as auth_router
    logger.debug("✅ auth_router imported successfully")
except Exception as e:
    logger.error(f"❌ CRITICAL: Failed to import auth_router: {e}")
    logger.error(f"❌ Traceback:\n{traceback.format_exc()}")
    # Create a dummy router so the app doesn't crash
    from fastapi import APIRouter
    auth_router = APIRouter()

    @auth_router.get("/")
    async def auth_import_error():
        return {
            "error": "Auth module failed to load",
            "message": str(e),
            "hint": "Check Cloud Run logs for detailed traceback"
        }

# Try to import two_factor_router with detailed error logging
try:
    from app.modules.auth.api.two_factor_routes import router as two_factor_router
    logger.debug("✅ two_factor_router imported successfully")
except Exception as e:
    logger.error(f"❌ CRITICAL: Failed to import two_factor_router: {e}")
    logger.error(f"❌ Traceback:\n{traceback.format_exc()}")
    # Create a dummy router so the app doesn't crash
    from fastapi import APIRouter
    two_factor_router = APIRouter()

__all__ = [
    "auth_router",
    "two_factor_router",
]
