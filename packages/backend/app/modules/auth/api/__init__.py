"""
Auth API routes for TaxasGE Backend
Exports routers for auth endpoints
"""

from app.modules.auth.api.auth_routes import router as auth_router
from app.modules.auth.api.two_factor_routes import router as two_factor_router

__all__ = [
    "auth_router",
    "two_factor_router",
]
