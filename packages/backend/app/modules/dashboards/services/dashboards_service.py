"""
Dashboards service — business logic for the Looker Studio community connector.

Phase B.1 (this file): hard-coded `recaudacion` dashboard backed by
mv_treasury_daily_kpis. No RLS yet.

Phase B.2 will:
- Add per-dashboard SQL builders (adopcion, agentes, services, …)
- Filter rows by user.ministry_id when role != admin / treasury_supervisor
- Add audit log of every getData() call

The MV mv_treasury_daily_kpis is owned by `postgres` and refreshed by an
existing scheduler job — see Memory rule #22 (don't depend on MVs as the
single source of truth; verify staleness via refreshed_at).
"""

from datetime import date, datetime, timezone
from typing import Any, Optional

import asyncpg
from loguru import logger

from app.modules.dashboards.models import (
    DashboardDataResponse,
    DashboardDataRow,
    DashboardSchemaResponse,
    LookerSchemaField,
    LookerSchemaSemantics,
)
from app.modules.dashboards.services.rls import (
    DashboardAccessContext,
    DashboardAccessDenied,
    build_access_filter,
)


class DashboardNotFoundError(Exception):
    """Raised when a dashboard_id has no implementation."""


# ---------------------------------------------------------------------------
# Schema definitions per dashboard
# ---------------------------------------------------------------------------

_SCHEMA_RECAUDACION: list[LookerSchemaField] = [
    LookerSchemaField(
        name="report_date",
        label="Date",
        dataType="STRING",
        semantics=LookerSchemaSemantics(conceptType="DIMENSION", semanticType="YEAR_MONTH_DAY"),
    ),
    LookerSchemaField(
        name="ministry_name",
        label="Ministry",
        dataType="STRING",
        semantics=LookerSchemaSemantics(conceptType="DIMENSION"),
    ),
    LookerSchemaField(
        name="entity_name",
        label="Entity",
        dataType="STRING",
        semantics=LookerSchemaSemantics(conceptType="DIMENSION"),
    ),
    LookerSchemaField(
        name="payment_method",
        label="Method",
        dataType="STRING",
        semantics=LookerSchemaSemantics(conceptType="DIMENSION"),
    ),
    LookerSchemaField(
        name="workflow_code",
        label="Workflow",
        dataType="STRING",
        semantics=LookerSchemaSemantics(conceptType="DIMENSION"),
    ),
    LookerSchemaField(
        name="service_name",
        label="Service",
        dataType="STRING",
        semantics=LookerSchemaSemantics(conceptType="DIMENSION"),
    ),
    LookerSchemaField(
        name="payment_count",
        label="Payments",
        dataType="NUMBER",
        semantics=LookerSchemaSemantics(conceptType="METRIC"),
    ),
    LookerSchemaField(
        name="completed_count",
        label="Completed",
        dataType="NUMBER",
        semantics=LookerSchemaSemantics(conceptType="METRIC"),
    ),
    LookerSchemaField(
        name="rejected_count",
        label="Rejected",
        dataType="NUMBER",
        semantics=LookerSchemaSemantics(conceptType="METRIC"),
    ),
    LookerSchemaField(
        name="total_amount",
        label="Total recaudado",
        dataType="NUMBER",
        semantics=LookerSchemaSemantics(conceptType="METRIC", semanticType="CURRENCY_XAF"),
    ),
    LookerSchemaField(
        name="avg_amount",
        label="Avg payment",
        dataType="NUMBER",
        semantics=LookerSchemaSemantics(conceptType="METRIC", semanticType="CURRENCY_XAF"),
    ),
    LookerSchemaField(
        name="avg_processing_minutes",
        label="Avg processing (min)",
        dataType="NUMBER",
        semantics=LookerSchemaSemantics(conceptType="METRIC"),
    ),
    LookerSchemaField(
        name="sla_breached_count",
        label="SLA breached",
        dataType="NUMBER",
        semantics=LookerSchemaSemantics(conceptType="METRIC"),
    ),
]


_DASHBOARD_REGISTRY: dict[str, dict[str, Any]] = {
    "recaudacion": {
        "schema": _SCHEMA_RECAUDACION,
        "table": "mv_treasury_daily_kpis",
        "date_column": "report_date",
    },
    # B.3 to add: adopcion, agentes, services
}


# Recaudación-shape rows: the column list we SELECT in `getData()`. Stays
# in sync with _SCHEMA_RECAUDACION.name order.
_RECAUDACION_COLUMNS = [f.name for f in _SCHEMA_RECAUDACION]


# ---------------------------------------------------------------------------
# Service
# ---------------------------------------------------------------------------


class DashboardsService:
    """Reads aggregated MVs and reshapes rows for the Looker connector."""

    def __init__(self, db_pool: asyncpg.Pool):
        self._pool = db_pool

    # -- Public API --------------------------------------------------------

    def list_dashboards(self) -> list[str]:
        return list(_DASHBOARD_REGISTRY.keys())

    def get_schema(self, dashboard_id: str) -> DashboardSchemaResponse:
        cfg = self._cfg(dashboard_id)
        return DashboardSchemaResponse(
            dashboard_id=dashboard_id,
            schema_version=1,
            fields=cfg["schema"],   # serialised as JSON key 'schema' via alias
            refreshed_at=datetime.now(timezone.utc),
            notes="B.1 skeleton — no RLS; B.2 adds per-ministry filtering.",
        )

    async def get_data(
        self,
        dashboard_id: str,
        *,
        access: DashboardAccessContext,
        fields: Optional[list[str]] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> DashboardDataResponse:
        cfg = self._cfg(dashboard_id)
        # B.1: every dashboard handled here is the recaudacion shape.
        # B.3 will branch on dashboard_id to dispatch to per-dashboard SQL builders.
        if dashboard_id != "recaudacion":
            raise DashboardNotFoundError(
                f"Dashboard '{dashboard_id}' is registered but its data builder "
                "is not implemented yet (B.1 ships recaudacion only)."
            )

        # B.2a hard guard: if the user has no access, raise 403 BEFORE building
        # any SQL — no chance of a leak via accidental empty-filter fall-through.
        if not access.has_access:
            raise DashboardAccessDenied(access)

        # Decide which columns we actually return. If `fields` is None or
        # empty, we return all schema columns. If `fields` is set, we filter
        # to that subset (Looker calls this "pruning" — only fetches what
        # the chart needs).
        requested = fields or _RECAUDACION_COLUMNS
        # Defense in depth: drop any field name not in our schema (prevents
        # SQL injection via the fields parameter — only column names from
        # our hard-coded allowlist make it into the SELECT).
        allowed = [c for c in requested if c in _RECAUDACION_COLUMNS]
        if not allowed:
            allowed = _RECAUDACION_COLUMNS

        select_cols = ", ".join(allowed)
        sql = f"SELECT {select_cols} FROM {cfg['table']}"
        params: list[Any] = []
        wheres: list[str] = []
        filters_applied: list[str] = []

        if start_date is not None:
            params.append(start_date)
            wheres.append(f"{cfg['date_column']} >= ${len(params)}")
            filters_applied.append(f"start_date={start_date.isoformat()}")
        if end_date is not None:
            params.append(end_date)
            wheres.append(f"{cfg['date_column']} <= ${len(params)}")
            filters_applied.append(f"end_date={end_date.isoformat()}")

        # B.2a — RLS filter: regular agents see only their entity_codes;
        # ministry supervisors see all entities under their ministry_ids;
        # staff (admin) bypass entirely.
        access_clause, access_params = build_access_filter(
            access, next_param_index=len(params) + 1
        )
        if access_clause is not None:
            wheres.append(access_clause)
            params.extend(access_params)
            filters_applied.append(f"rls={access.describe()}")
        else:
            filters_applied.append("rls=staff:bypass")

        if wheres:
            sql += " WHERE " + " AND ".join(wheres)
        sql += f" ORDER BY {cfg['date_column']} DESC"

        # Hard cap to protect against runaway queries — Looker connector
        # paginates differently from REST; 50K rows is plenty for daily MVs.
        sql += " LIMIT 50000"

        async with self._pool.acquire() as conn:
            try:
                records = await conn.fetch(sql, *params)
            except asyncpg.PostgresError as exc:
                logger.error(
                    "dashboards_service.get_data failed: dashboard={} err={}",
                    dashboard_id, exc,
                )
                raise

        rows = [
            DashboardDataRow(values=[record[c] for c in allowed])
            for record in records
        ]

        # Schema returned should match the columns we actually fetched
        schema_fields = [f for f in cfg["schema"] if f.name in allowed]

        return DashboardDataResponse(
            dashboard_id=dashboard_id,
            fields=schema_fields,    # serialised as JSON key 'schema' via alias
            rows=rows,
            row_count=len(rows),
            filters_applied=filters_applied,
            refreshed_at=datetime.now(timezone.utc),
        )

    # -- Internals ---------------------------------------------------------

    def _cfg(self, dashboard_id: str) -> dict[str, Any]:
        cfg = _DASHBOARD_REGISTRY.get(dashboard_id)
        if cfg is None:
            raise DashboardNotFoundError(
                f"Unknown dashboard_id '{dashboard_id}'. "
                f"Registered: {list(_DASHBOARD_REGISTRY.keys())}."
            )
        return cfg
