"""Dashboards service package."""

from app.modules.dashboards.services.dashboards_service import (
    DashboardsService,
    DashboardNotFoundError,
)
from app.modules.dashboards.services.rls import (
    DashboardAccessContext,
    DashboardAccessDenied,
    STAFF_ROLES,
    build_access_filter,
    resolve_user_access,
)

__all__ = [
    "DashboardsService",
    "DashboardNotFoundError",
    "DashboardAccessContext",
    "DashboardAccessDenied",
    "STAFF_ROLES",
    "build_access_filter",
    "resolve_user_access",
]
