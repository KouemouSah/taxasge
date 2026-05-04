"""
Pydantic models for the dashboard_registrations admin API (E1 phase 2).

The DTOs power 3 endpoints:
- GET /api/v1/dashboards/reports-config         (refactored, returns DashboardReportEntry)
- GET /api/v1/dashboards/admin/configs          (new, DashboardConfigDTO)
- PUT /api/v1/dashboards/admin/configs/{id}     (new, accepts DashboardConfigUpdateRequest)

Regex constraints mirror the BD CHECK constraints in migration 317
(chk_looker_report_id_format, chk_looker_page_id_format) so that an invalid
input is rejected at the Pydantic layer (422) before ever reaching the BD.
"""

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

# Source label visible to the frontend.
# - "db"           → row exists in dashboard_registrations
# - "env_fallback" → no row, but LOOKER_REPORTS_<id>_REPORT_ID env var is set
# - "unset"        → no row, no env var (frontend renders "Awaiting setup")
DashboardConfigSource = Literal["db", "env_fallback", "unset"]


class DashboardConfigDTO(BaseModel):
    """One dashboard config row, enriched with registry metadata.

    `label`, `description`, `rls_mode` come from the in-code registry
    (_REPORTS_METADATA) — they never live in the BD because they describe
    the dashboard at the *code* level (which MV, which RLS mode).
    """

    dashboard_id: str
    label: str
    description: str
    rls_mode: str

    looker_report_id: Optional[str] = None
    looker_page_id: Optional[str] = None
    is_active: bool = True
    source: DashboardConfigSource

    updated_by: Optional[str] = Field(
        default=None,
        description="UUID of the admin who last updated this row (None if from env or unset).",
    )
    updated_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(extra="forbid")


class DashboardConfigUpdateRequest(BaseModel):
    """PUT body — only the fields an admin can edit.

    Regex constraints match migration 317 CHECK constraints exactly. A bad
    input produces a 422 from FastAPI before any BD round-trip.
    """

    looker_report_id: str = Field(
        ...,
        min_length=8,
        max_length=64,
        pattern=r"^[a-zA-Z0-9_-]{8,64}$",
        description="Looker Studio report ID extracted from the /reporting/<id>/page/... URL.",
    )
    looker_page_id: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=32,
        pattern=r"^[a-zA-Z0-9_]{1,32}$",
        description="Optional Looker Studio page ID (p_xxx). Null = first page.",
    )
    is_active: bool = Field(
        default=True,
        description="False to hide this dashboard from /reports-config without deleting the row.",
    )

    model_config = ConfigDict(extra="forbid")


class DashboardConfigsListResponse(BaseModel):
    """Response of GET /api/v1/dashboards/admin/configs."""

    configs: list[DashboardConfigDTO]

    model_config = ConfigDict(extra="forbid")
