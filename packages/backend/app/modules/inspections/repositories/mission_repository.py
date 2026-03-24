"""Mission Repository — Data access layer for field mission planning."""

import logging
from datetime import date
from typing import Dict, List, Optional, Tuple
from uuid import UUID

logger = logging.getLogger(__name__)


class MissionRepository:
    """Data access for field_missions and field_mission_agents tables."""

    # ============================================================
    # CREATE
    # ============================================================

    @staticmethod
    async def create(conn, data: Dict) -> Dict:
        """Insert a new field mission."""
        row = await conn.fetchrow("""
            INSERT INTO field_missions (
                entity_id, entity_location_id, supervisor_id,
                mission_date, title, notes, zone_ids, status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        """,
            data["entity_id"], data["entity_location_id"],
            data["supervisor_id"], data["mission_date"],
            data.get("title"), data.get("notes"),
            data.get("zone_ids"), data.get("status", "planned"),
        )
        return dict(row) if row else None

    # ============================================================
    # READ
    # ============================================================

    @staticmethod
    async def get_by_id(conn, mission_id: UUID) -> Optional[Dict]:
        """Get mission with enriched entity/location/supervisor data."""
        row = await conn.fetchrow("""
            SELECT fm.*,
                   e.code AS entity_code,
                   el.location_name AS location_name,
                   u.full_name AS supervisor_name,
                   (SELECT COUNT(*) FROM field_mission_agents fma
                    WHERE fma.mission_id = fm.id) AS agents_count
            FROM field_missions fm
            JOIN entities e ON e.id = fm.entity_id
            JOIN entity_locations el ON el.id = fm.entity_location_id
            JOIN users u ON u.id = fm.supervisor_id
            WHERE fm.id = $1
        """, mission_id)
        return dict(row) if row else None

    @staticmethod
    async def list_by_entity(
        conn, entity_id: UUID,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        status: Optional[str] = None,
        page: int = 1, page_size: int = 20,
    ) -> Tuple[List[Dict], int]:
        """Paginated list of missions for an entity."""
        conditions = ["fm.entity_id = $1"]
        params: list = [entity_id]
        idx = 2

        if date_from:
            conditions.append(f"fm.mission_date >= ${idx}")
            params.append(date_from)
            idx += 1

        if date_to:
            conditions.append(f"fm.mission_date <= ${idx}")
            params.append(date_to)
            idx += 1

        if status:
            conditions.append(f"fm.status = ${idx}")
            params.append(status)
            idx += 1

        where = " AND ".join(conditions)

        count_row = await conn.fetchrow(
            f"SELECT COUNT(*) FROM field_missions fm WHERE {where}", *params
        )
        total = count_row["count"]

        rows = await conn.fetch(f"""
            SELECT fm.id, fm.mission_date, fm.title, fm.status,
                   e.code AS entity_code,
                   el.location_name AS location_name,
                   COALESCE(agg.agents_count, 0) AS agents_count,
                   COALESCE(agg.inspections_done, 0) AS inspections_done,
                   COALESCE(agg.inspections_target, 0) AS inspections_target,
                   fm.created_at
            FROM field_missions fm
            JOIN entities e ON e.id = fm.entity_id
            JOIN entity_locations el ON el.id = fm.entity_location_id
            LEFT JOIN LATERAL (
                SELECT COUNT(*)::int AS agents_count,
                       COALESCE(SUM(actual_inspections), 0)::int AS inspections_done,
                       COALESCE(SUM(target_inspections), 0)::int AS inspections_target
                FROM field_mission_agents WHERE mission_id = fm.id
            ) agg ON true
            WHERE {where}
            ORDER BY fm.mission_date DESC
            LIMIT ${idx} OFFSET ${idx + 1}
        """, *params, page_size, (page - 1) * page_size)

        return [dict(r) for r in rows], total

    # ============================================================
    # UPDATE
    # ============================================================

    UPDATABLE_COLUMNS = frozenset({
        "title", "notes", "zone_ids", "status",
        "started_at", "completed_at",
    })

    @staticmethod
    async def update(conn, mission_id: UUID, data: Dict) -> Dict:
        """Update mission fields (whitelist-protected)."""
        if not data:
            return await MissionRepository.get_by_id(conn, mission_id)

        invalid_keys = set(data.keys()) - MissionRepository.UPDATABLE_COLUMNS
        if invalid_keys:
            raise ValueError(
                f"Invalid update columns: {invalid_keys}. "
                f"Allowed: {MissionRepository.UPDATABLE_COLUMNS}"
            )

        set_clauses = []
        params = []
        idx = 1

        for key, value in data.items():
            set_clauses.append(f"{key} = ${idx}")
            params.append(value)
            idx += 1

        set_clauses.append("updated_at = NOW()")
        params.append(mission_id)

        row = await conn.fetchrow(f"""
            UPDATE field_missions
            SET {', '.join(set_clauses)}
            WHERE id = ${idx}
            RETURNING *
        """, *params)

        if not row:
            return None

        # Re-fetch with JOINs for enriched response
        return await MissionRepository.get_by_id(conn, mission_id)

    # ============================================================
    # DELETE
    # ============================================================

    @staticmethod
    async def delete(conn, mission_id: UUID) -> bool:
        """Delete a mission only if status is 'planned'."""
        result = await conn.execute("""
            DELETE FROM field_missions
            WHERE id = $1 AND status = 'planned'
        """, mission_id)
        # asyncpg returns "DELETE N" where N is affected rows
        return result == "DELETE 1"

    # ============================================================
    # AGENTS
    # ============================================================

    @staticmethod
    async def add_agents(conn, mission_id: UUID, agents: List[Dict]) -> List[Dict]:
        """Batch insert agents into a mission."""
        results = []
        for agent in agents:
            row = await conn.fetchrow("""
                INSERT INTO field_mission_agents (
                    mission_id, agent_id, agent_profile_id,
                    assigned_zones, target_inspections, notes, status
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            """,
                mission_id,
                agent["agent_id"], agent["agent_profile_id"],
                agent.get("assigned_zones"), agent.get("target_inspections", 10),
                agent.get("notes"), "assigned",
            )
            if row:
                results.append(dict(row))

        # Touch mission updated_at
        await conn.execute("""
            UPDATE field_missions SET updated_at = NOW() WHERE id = $1
        """, mission_id)

        return results

    @staticmethod
    async def remove_agent(conn, mission_id: UUID, agent_id: UUID) -> bool:
        """Remove an agent from a mission."""
        result = await conn.execute("""
            DELETE FROM field_mission_agents
            WHERE mission_id = $1 AND agent_id = $2
        """, mission_id, agent_id)
        return result == "DELETE 1"

    @staticmethod
    async def get_mission_agents(conn, mission_id: UUID) -> List[Dict]:
        """Get all agents for a mission with enriched user data."""
        rows = await conn.fetch("""
            SELECT fma.*,
                   u.full_name AS agent_name,
                   ap.working_days,
                   CASE WHEN ap.is_active THEN 'available' ELSE 'unavailable' END AS availability_status,
                   CASE
                       WHEN fma.target_inspections > 0
                       THEN fma.actual_inspections * 100.0 / fma.target_inspections
                       ELSE 0.0
                   END AS progress_pct
            FROM field_mission_agents fma
            JOIN users u ON u.id = fma.agent_id
            JOIN agent_profiles ap ON ap.id = fma.agent_profile_id
            WHERE fma.mission_id = $1
            ORDER BY u.full_name ASC
        """, mission_id)
        return [dict(r) for r in rows]

    # ============================================================
    # PLANNING HELPERS
    # ============================================================

    @staticmethod
    async def suggest_zones(conn, entity_id: UUID, limit: int = 10) -> List[Dict]:
        """Suggest zones based on inspection coverage and pending obligations.

        Uses 2 CTEs:
        1. last_inspected: MAX(inspection_date) per zone for this entity
        2. zone_obligations: COUNT pending/overdue obligations per zone
        Priority score = (pending_count * days_since_last / 30) — higher = more urgent.
        """
        rows = await conn.fetch("""
            WITH last_inspected AS (
                SELECT cl.zone_id,
                       MAX(fi.inspection_date) AS last_inspection_date
                FROM field_inspections fi
                JOIN commercial_licenses cl ON cl.id = fi.license_id
                WHERE fi.entity_id = $1 AND fi.status != 'cancelled'
                GROUP BY cl.zone_id
            ),
            zone_obligations AS (
                SELECT cl.zone_id,
                       COUNT(*)::int AS pending_count
                FROM license_obligations lo
                JOIN commercial_licenses cl ON cl.id = lo.license_id
                WHERE lo.status IN ('pending', 'overdue')
                GROUP BY cl.zone_id
            )
            SELECT
                cz.id AS zone_id,
                cz.zone_code,
                cz.name_es AS zone_name,
                cz.zone_tier AS zone_tier,
                CASE
                    WHEN li.last_inspection_date IS NULL THEN NULL
                    ELSE (CURRENT_DATE - li.last_inspection_date)::int
                END AS days_since_last_inspection,
                COALESCE(zo.pending_count, 0) AS pending_obligations_count,
                CASE
                    WHEN li.last_inspection_date IS NULL THEN 'high'
                    WHEN (CURRENT_DATE - li.last_inspection_date) > 30 THEN 'high'
                    WHEN (CURRENT_DATE - li.last_inspection_date) > 14 THEN 'medium'
                    ELSE 'low'
                END AS suggested_priority
            FROM commerce_zones cz
            LEFT JOIN last_inspected li ON li.zone_id = cz.id
            LEFT JOIN zone_obligations zo ON zo.zone_id = cz.id
            ORDER BY
                (COALESCE(zo.pending_count, 0) *
                 COALESCE(CURRENT_DATE - li.last_inspection_date, 9999)
                 / 30.0) DESC
            LIMIT $2
        """, entity_id, limit)
        return [dict(r) for r in rows]

    @staticmethod
    async def get_agents_availability(
        conn, entity_id: UUID, mission_date: date,
    ) -> List[Dict]:
        """Get agent availability for a specific date."""
        rows = await conn.fetch("""
            SELECT
                ap.user_id AS agent_id,
                ap.id AS agent_profile_id,
                u.full_name AS agent_name,
                NOT EXISTS(
                    SELECT 1 FROM field_mission_agents fma
                    JOIN field_missions fm ON fm.id = fma.mission_id
                    WHERE fma.agent_id = ap.user_id
                      AND fm.mission_date = $2
                      AND fm.status != 'cancelled'
                ) AS is_available,
                (
                    SELECT fm2.title
                    FROM field_mission_agents fma2
                    JOIN field_missions fm2 ON fm2.id = fma2.mission_id
                    WHERE fma2.agent_id = ap.user_id
                      AND fm2.mission_date = $2
                      AND fm2.status != 'cancelled'
                    LIMIT 1
                ) AS current_mission,
                ap.working_days,
                CASE WHEN ap.is_active THEN 'available' ELSE 'unavailable' END AS availability_status
            FROM agent_profiles ap
            JOIN users u ON u.id = ap.user_id
            WHERE ap.entity_id = $1
              AND ap.is_active = true
              AND ap.is_supervisor = false
            ORDER BY u.full_name ASC
        """, entity_id, mission_date)
        return [dict(r) for r in rows]

    # ============================================================
    # COMPLETE / PROGRESS
    # ============================================================

    @staticmethod
    async def complete_mission(conn, mission_id: UUID) -> Optional[Dict]:
        """Mark mission as completed (only from in_progress)."""
        row = await conn.fetchrow("""
            UPDATE field_missions
            SET status = 'completed', completed_at = NOW(), updated_at = NOW()
            WHERE id = $1 AND status = 'in_progress'
            RETURNING *
        """, mission_id)

        if not row:
            return None

        # Also complete all assigned/active agents
        await conn.execute("""
            UPDATE field_mission_agents
            SET status = 'completed', completed_at = NOW()
            WHERE mission_id = $1 AND status IN ('assigned', 'active')
        """, mission_id)

        # Re-fetch with JOINs
        return await MissionRepository.get_by_id(conn, mission_id)

    @staticmethod
    async def update_agent_actual_inspections(conn, mission_id: UUID):
        """Sync actual_inspections from field_inspections count."""
        await conn.execute("""
            UPDATE field_mission_agents fma
            SET actual_inspections = (
                SELECT COUNT(*)
                FROM field_inspections fi
                WHERE fi.mission_id = fma.mission_id
                  AND fi.agent_id = fma.agent_id
                  AND fi.status != 'cancelled'
            )
            WHERE fma.mission_id = $1
        """, mission_id)
