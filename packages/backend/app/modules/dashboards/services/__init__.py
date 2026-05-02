"""Dashboards service package."""

from app.modules.dashboards.services.dashboards_service import (
    DashboardsService,
    DashboardNotFoundError,
)

__all__ = ["DashboardsService", "DashboardNotFoundError"]
