"""
Pydantic models for the dashboard_registrations admin API (E1 phase 2 + Grafana E1).

The DTOs power 3 endpoints:
- GET /api/v1/dashboards/reports-config         (refactored, returns DashboardReportEntry)
- GET /api/v1/dashboards/admin/configs          (new, DashboardConfigDTO)
- PUT /api/v1/dashboards/admin/configs/{id}     (new, accepts DashboardConfigUpdateRequest)

Regex constraints mirror the BD CHECK constraints in migrations 317 + 319
(Looker fields + Grafana fields) so that an invalid input is rejected at
the Pydantic layer (422) before ever reaching the BD.
"""

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator

# Source label visible to the frontend.
# - "db"           → row exists in dashboard_registrations
# - "env_fallback" → no row, but LOOKER_REPORTS_<id>_REPORT_ID env var is set
# - "unset"        → no row, no env var (frontend renders "Awaiting setup")
DashboardConfigSource = Literal["db", "env_fallback", "unset"]

# Provider type for the embed iframe.
# - "looker_studio" : iframe Looker Studio (default, mig 317)
# - "grafana"       : iframe Grafana (mig 319)
DashboardProvider = Literal["looker_studio", "grafana"]


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

    # Provider switch — looker_studio (default) or grafana (since mig 319)
    provider: DashboardProvider = "looker_studio"

    # Looker Studio fields (used when provider == 'looker_studio')
    looker_report_id: Optional[str] = None
    looker_page_id: Optional[str] = None

    # Grafana fields (used when provider == 'grafana')
    grafana_dashboard_uid: Optional[str] = None
    grafana_org_id: int = 1

    is_active: bool = True
    source: DashboardConfigSource

    # Computed embed URL — backend builds it from the active provider's fields.
    # None when the active provider has no config yet.
    embed_url: Optional[str] = None

    updated_by: Optional[str] = Field(
        default=None,
        description="UUID of the admin who last updated this row (None if from env or unset).",
    )
    updated_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(extra="forbid")


class DashboardConfigUpdateRequest(BaseModel):
    """PUT body — only the fields an admin can edit.

    Regex constraints match migration 317 + 319 CHECK constraints exactly.
    A bad input produces a 422 from FastAPI before any BD round-trip.

    The validator below enforces the provider-vs-fields business rule:
    - If provider='looker_studio', looker_report_id is REQUIRED
    - If provider='grafana', grafana_dashboard_uid is REQUIRED
    Both groups can be populated simultaneously (so admin can switch
    provider without losing config) — only the active provider's fields
    are validated as required.
    """

    provider: DashboardProvider = Field(
        default="looker_studio",
        description="Which provider to use for the iframe embed: looker_studio (default) or grafana.",
    )

    # Looker Studio fields — optional at the field level, conditionally
    # required by the validator below.
    looker_report_id: Optional[str] = Field(
        default=None,
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

    # Grafana fields — optional at the field level, conditionally required.
    grafana_dashboard_uid: Optional[str] = Field(
        default=None,
        min_length=4,
        max_length=40,
        pattern=r"^[a-zA-Z0-9_-]{4,40}$",
        description="Grafana dashboard UID (e.g. 'facil-recaudacion'). Required when provider='grafana'.",
    )
    grafana_org_id: int = Field(
        default=1,
        ge=1,
        le=999,
        description="Grafana organization ID. Default 1 (single-org Cloud).",
    )

    is_active: bool = Field(
        default=True,
        description="False to hide this dashboard from /reports-config without deleting the row.",
    )

    model_config = ConfigDict(extra="forbid")

    @model_validator(mode="after")
    def _check_provider_fields(self) -> "DashboardConfigUpdateRequest":
        """Enforce that the active provider has its required field set."""
        if self.provider == "looker_studio" and not self.looker_report_id:
            raise ValueError(
                "looker_report_id is required when provider='looker_studio'"
            )
        if self.provider == "grafana" and not self.grafana_dashboard_uid:
            raise ValueError(
                "grafana_dashboard_uid is required when provider='grafana'"
            )
        return self


class DashboardConfigsListResponse(BaseModel):
    """Response of GET /api/v1/dashboards/admin/configs."""

    configs: list[DashboardConfigDTO]

    model_config = ConfigDict(extra="forbid")
