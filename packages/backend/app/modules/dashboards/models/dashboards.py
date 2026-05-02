"""
Pydantic models for dashboards endpoints.

The shape matches what the Looker Studio Community Connector expects in its
`getSchema()` and `getData()` responses (see
https://developers.google.com/looker-studio/connector/reference#getschema,
https://developers.google.com/looker-studio/connector/reference#getdata).
"""

from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


# Looker Studio field semantic type subset we use today.
# Full list: https://developers.google.com/looker-studio/connector/reference#semantictype
LookerSemanticType = Literal[
    "TEXT",
    "URL",
    "BOOLEAN",
    "NUMBER",
    "PERCENT",
    "CURRENCY_XAF",
    "CURRENCY_USD",
    "CURRENCY_EUR",
    "DURATION",
    "YEAR",
    "YEAR_MONTH",
    "YEAR_MONTH_DAY",
    "YEAR_MONTH_DAY_HOUR",
    "YEAR_MONTH_DAY_SECOND",
    "COUNTRY",
    "LATITUDE_LONGITUDE",
]

LookerDataType = Literal["STRING", "NUMBER", "BOOLEAN"]
LookerConceptType = Literal["DIMENSION", "METRIC"]


class LookerSchemaSemantics(BaseModel):
    """Looker semantic descriptor for a field."""

    conceptType: LookerConceptType
    semanticType: Optional[LookerSemanticType] = None

    model_config = ConfigDict(extra="forbid")


class LookerSchemaField(BaseModel):
    """One column the connector exposes to Looker Studio."""

    name: str = Field(..., description="Stable identifier — used as the SQL alias")
    label: str = Field(..., description="Human-readable label rendered in chart legends")
    dataType: LookerDataType
    semantics: LookerSchemaSemantics
    description: Optional[str] = None

    model_config = ConfigDict(extra="forbid")


class DashboardSchemaResponse(BaseModel):
    """Response of GET /api/v1/dashboards/{id}/schema"""

    dashboard_id: str
    schema_version: int = 1
    fields: list[LookerSchemaField] = Field(..., alias="schema")
    refreshed_at: datetime
    notes: Optional[str] = None

    # alias='schema' is the JSON key expected by the Looker Studio connector
    # (see https://developers.google.com/looker-studio/connector/reference#getschema).
    # Internally we name the field `fields` to avoid shadowing BaseModel.schema().
    model_config = ConfigDict(extra="forbid", populate_by_name=True)


class DashboardDataRow(BaseModel):
    """One row of the dataset returned to Looker."""

    values: list[Any] = Field(
        ..., description="Cell values in the same order as the schema fields. None for NULL."
    )

    model_config = ConfigDict(extra="forbid")


class DashboardDataResponse(BaseModel):
    """Response of GET /api/v1/dashboards/{id}/data"""

    dashboard_id: str
    fields: list[LookerSchemaField] = Field(..., alias="schema")
    rows: list[DashboardDataRow]
    row_count: int
    filters_applied: list[str] = Field(
        default_factory=list,
        description="Human-readable list of filters Looker passed; useful for B.2 RLS audit.",
    )
    refreshed_at: datetime

    # alias='schema' is the Looker connector's expected JSON key.
    model_config = ConfigDict(extra="forbid", populate_by_name=True)


class DashboardPingResponse(BaseModel):
    """Response of GET /api/v1/dashboards/_ping — confirms connector auth works."""

    user_email: str
    user_id: str
    role: Optional[str] = None
    ministry_id: Optional[int] = Field(
        default=None,
        description="Set in B.2 once RLS is wired; None means 'no per-ministry filter applied'.",
    )

    model_config = ConfigDict(extra="forbid")
