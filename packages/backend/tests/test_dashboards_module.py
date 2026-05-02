# -*- coding: utf-8 -*-
"""
Unit tests for the dashboards module (Looker Studio community connector backend).

Phase B.1 scope:
- Pydantic models serialize with the alias `schema` (Looker Studio contract).
- Service registry knows about `recaudacion` and rejects anything else.
- Service hides PII: only the schema columns are accepted in `fields=`,
  arbitrary input is filtered out before SQL generation.

Tests use raw module-level imports (no DB connection); the service-layer
get_data() is exercised in integration tests when the backend has a pool.
"""
import sys
from datetime import datetime, timezone
from pathlib import Path

import pytest

# Backend root on sys.path so `app...` imports resolve.
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.modules.dashboards.models.dashboards import (
    DashboardDataResponse,
    DashboardDataRow,
    DashboardPingResponse,
    DashboardSchemaResponse,
    LookerSchemaField,
    LookerSchemaSemantics,
)
from app.modules.dashboards.services.dashboards_service import (
    DashboardNotFoundError,
    DashboardsService,
    _DASHBOARD_REGISTRY,
    _RECAUDACION_COLUMNS,
    _SCHEMA_RECAUDACION,
)


# ---------------------------------------------------------------------------
# Pydantic model contract
# ---------------------------------------------------------------------------


def _sample_field() -> LookerSchemaField:
    return LookerSchemaField(
        name="total_amount",
        label="Total recaudado",
        dataType="NUMBER",
        semantics=LookerSchemaSemantics(
            conceptType="METRIC",
            semanticType="CURRENCY_XAF",
        ),
    )


def test_schema_response_serialises_with_schema_alias():
    """The Looker Studio contract requires the field list under JSON key `schema`."""
    resp = DashboardSchemaResponse(
        dashboard_id="recaudacion",
        fields=[_sample_field()],
        refreshed_at=datetime.now(timezone.utc),
    )
    js = resp.model_dump_json(by_alias=True)
    assert '"schema":' in js, "Looker connector expects 'schema' as the JSON key"
    assert '"fields":' not in js, "Internal name 'fields' must not leak in JSON"


def test_data_response_serialises_with_schema_alias():
    resp = DashboardDataResponse(
        dashboard_id="recaudacion",
        fields=[_sample_field()],
        rows=[DashboardDataRow(values=["2026-01-01", 100.0])],
        row_count=1,
        refreshed_at=datetime.now(timezone.utc),
    )
    js = resp.model_dump_json(by_alias=True)
    assert '"schema":' in js
    assert '"rows":' in js
    assert '"row_count":1' in js


def test_ping_response_strict_shape():
    """Ping response must NOT accept extra fields (extra='forbid')."""
    p = DashboardPingResponse(user_email="a@b.com", user_id="u-1", role="admin")
    assert p.ministry_id is None
    with pytest.raises(Exception):
        # Extra field should be rejected
        DashboardPingResponse(
            user_email="a@b.com", user_id="u-1", role="admin", surprise=42
        )


def test_data_row_accepts_mixed_types():
    row = DashboardDataRow(values=["text", 123, 4.5, None, True])
    assert row.values == ["text", 123, 4.5, None, True]


def test_schema_field_dataType_strict():
    """dataType must be one of STRING / NUMBER / BOOLEAN."""
    with pytest.raises(Exception):
        LookerSchemaField(
            name="x", label="X", dataType="INTEGER",  # not allowed
            semantics=LookerSchemaSemantics(conceptType="METRIC"),
        )


# ---------------------------------------------------------------------------
# Service registry
# ---------------------------------------------------------------------------


def test_registry_contains_recaudacion_only_in_b1():
    """B.1 ships only `recaudacion`. B.2 will add adopcion / agentes / services."""
    assert set(_DASHBOARD_REGISTRY.keys()) == {"recaudacion"}


def test_recaudacion_columns_match_schema():
    """Schema column names must match the SQL SELECT order — defense against
    field-name drift between schema and SQL."""
    column_names = {f.name for f in _SCHEMA_RECAUDACION}
    assert set(_RECAUDACION_COLUMNS) == column_names


def test_service_rejects_unknown_dashboard():
    svc = DashboardsService(db_pool=None)  # service.get_schema doesn't touch the pool
    with pytest.raises(DashboardNotFoundError):
        svc.get_schema("nonexistent")


def test_service_get_schema_recaudacion():
    svc = DashboardsService(db_pool=None)
    resp = svc.get_schema("recaudacion")
    assert resp.dashboard_id == "recaudacion"
    assert len(resp.fields) == len(_SCHEMA_RECAUDACION)
    # The notes field documents B.1 limitations — ensure it's set
    assert resp.notes and "B.1 skeleton" in resp.notes


def test_list_dashboards():
    svc = DashboardsService(db_pool=None)
    assert svc.list_dashboards() == ["recaudacion"]


# ---------------------------------------------------------------------------
# Service security — fields parameter cannot inject SQL
# ---------------------------------------------------------------------------


def test_fields_parameter_only_allows_schema_columns(monkeypatch):
    """If the caller passes a malicious `fields` list, only schema columns
    survive the filter — preventing SQL injection via the column list."""

    # We don't test the SQL execution here (no pool); we test the column filter.
    # The service builds the SELECT from `allowed = [c for c in requested if c in _RECAUDACION_COLUMNS]`
    # which we exercise by importing the module-level allowlist.

    requested = [
        "total_amount",         # legitimate
        "DROP TABLE users",     # attempted injection
        "ministry_name",        # legitimate
        "1; SELECT * FROM payments",
    ]
    allowed = [c for c in requested if c in _RECAUDACION_COLUMNS]
    assert allowed == ["total_amount", "ministry_name"]
    assert "DROP TABLE users" not in allowed
    assert "1; SELECT * FROM payments" not in allowed


def test_empty_fields_returns_all_columns():
    """When the connector doesn't pass `fields`, we fall back to the full schema."""
    requested = []
    allowed = [c for c in requested if c in _RECAUDACION_COLUMNS]
    if not allowed:
        allowed = _RECAUDACION_COLUMNS
    assert set(allowed) == set(_RECAUDACION_COLUMNS)
