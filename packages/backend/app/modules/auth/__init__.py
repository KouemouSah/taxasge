"""
Auth Module for TaxasGE Backend
JWT-based authentication with 2FA support and RBAC
"""

from app.modules.auth.middleware.auth_middleware import (
    get_current_user,
    get_current_active_user,
    get_current_admin_user,
)

__all__ = [
    "get_current_user",
    "get_current_active_user",
    "get_current_admin_user",
]
