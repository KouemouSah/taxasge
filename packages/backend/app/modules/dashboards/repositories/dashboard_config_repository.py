"""
Repository for the `dashboard_registrations` table (migration 317).

Stateless static methods — easy to mock in tests, no shared connection state.
All SELECTs project the same column list (no SELECT *) so that adding a
column to the table doesn't silently change the API contract.
"""

from typing import Optional

import asyncpg


_COLS = (
    "dashboard_id, looker_report_id, looker_page_id, is_active, "
    "updated_by, updated_at, created_at"
)


class DashboardConfigRepository:
    """asyncpg DAO for dashboard_registrations (E1 admin config)."""

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
        looker_report_id: str,
        looker_page_id: Optional[str],
        is_active: bool,
        updated_by: str,
    ) -> asyncpg.Record:
        """Atomic UPSERT with RETURNING — 1 round-trip vs SELECT+UPDATE.

        $5::uuid cast is explicit so a malformed user_id surfaces as
        InvalidTextRepresentation instead of being silently coerced.
        """
        return await conn.fetchrow(
            f"""
            INSERT INTO dashboard_registrations
                (dashboard_id, looker_report_id, looker_page_id, is_active,
                 updated_by, updated_at, created_at)
            VALUES ($1, $2, $3, $4, $5::uuid, NOW(), NOW())
            ON CONFLICT (dashboard_id) DO UPDATE SET
                looker_report_id = EXCLUDED.looker_report_id,
                looker_page_id   = EXCLUDED.looker_page_id,
                is_active        = EXCLUDED.is_active,
                updated_by       = EXCLUDED.updated_by,
                updated_at       = NOW()
            RETURNING {_COLS}
            """,
            dashboard_id,
            looker_report_id,
            looker_page_id,
            is_active,
            updated_by,
        )
