"""
Repository for the `dashboard_registrations` table (migrations 317 + 319).

Stateless static methods — easy to mock in tests, no shared connection state.
All SELECTs project the same column list (no SELECT *) so that adding a
column to the table doesn't silently change the API contract.
"""

from typing import Optional

import asyncpg


# Column projection shared by all SELECTs. Includes the dual-provider columns
# from migration 319 (provider, grafana_dashboard_uid, grafana_org_id).
_COLS = (
    "dashboard_id, looker_report_id, looker_page_id, "
    "provider::text AS provider, grafana_dashboard_uid, grafana_org_id, "
    "is_active, updated_by, updated_at, created_at"
)


class DashboardConfigRepository:
    """asyncpg DAO for dashboard_registrations (E1 admin config + Grafana provider)."""

    @staticmethod
    async def list_active(conn: asyncpg.Connection) -> list[asyncpg.Record]:
        """Rows used by GET /reports-config — only the active ones, ordered."""
        return await conn.fetch(
            f"SELECT {_COLS} FROM dashboard_registrations "
            "WHERE is_active = true ORDER BY dashboard_id"
        )

    @staticmethod
    async def list_all(conn: asyncpg.Connection) -> list[asyncpg.Record]:
        """Rows used by the admin UI — both active and inactive, ordered."""
        return await conn.fetch(
            f"SELECT {_COLS} FROM dashboard_registrations ORDER BY dashboard_id"
        )

    @staticmethod
    async def get_by_id(
        conn: asyncpg.Connection, dashboard_id: str
    ) -> Optional[asyncpg.Record]:
        """Used to fetch the previous state for the audit log diff."""
        return await conn.fetchrow(
            f"SELECT {_COLS} FROM dashboard_registrations WHERE dashboard_id = $1",
            dashboard_id,
        )

    @staticmethod
    async def upsert(
        conn: asyncpg.Connection,
        *,
        dashboard_id: str,
        provider: str,
        looker_report_id: Optional[str],
        looker_page_id: Optional[str],
        grafana_dashboard_uid: Optional[str],
        grafana_org_id: int,
        is_active: bool,
        updated_by: str,
    ) -> asyncpg.Record:
        """Atomic UPSERT with RETURNING — 1 round-trip vs SELECT+UPDATE.

        Note on dual-provider semantics:
        - When provider='looker_studio', the looker_* fields are authoritative;
          grafana_* fields can stay populated (saved-for-later) but are unused.
        - When provider='grafana', the grafana_* fields are authoritative;
          looker_* fields can stay populated.
        - The BD CHECK chk_grafana_uid_required_when_grafana enforces that
          a 'grafana' row has a non-null grafana_dashboard_uid (defense in depth
          since the Pydantic validator already enforces this on input).
        """
        return await conn.fetchrow(
            f"""
            INSERT INTO dashboard_registrations
                (dashboard_id, provider, looker_report_id, looker_page_id,
                 grafana_dashboard_uid, grafana_org_id,
                 is_active, updated_by, updated_at, created_at)
            VALUES (
                $1, $2::dashboard_provider_enum, $3, $4,
                $5, $6,
                $7, $8::uuid, NOW(), NOW()
            )
            ON CONFLICT (dashboard_id) DO UPDATE SET
                provider              = EXCLUDED.provider,
                looker_report_id      = EXCLUDED.looker_report_id,
                looker_page_id        = EXCLUDED.looker_page_id,
                grafana_dashboard_uid = EXCLUDED.grafana_dashboard_uid,
                grafana_org_id        = EXCLUDED.grafana_org_id,
                is_active             = EXCLUDED.is_active,
                updated_by            = EXCLUDED.updated_by,
                updated_at            = NOW()
            RETURNING {_COLS}
            """,
            dashboard_id,
            provider,
            looker_report_id,
            looker_page_id,
            grafana_dashboard_uid,
            grafana_org_id,
            is_active,
            updated_by,
        )
