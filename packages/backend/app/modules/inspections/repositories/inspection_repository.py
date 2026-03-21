"""Inspection Repository — Data access layer for field inspections."""

import logging
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Dict, List, Optional, Tuple
from uuid import UUID

logger = logging.getLogger(__name__)


class InspectionRepository:
    """Data access for field_inspections table."""

    # ============================================================
    # CREATE
    # ============================================================

    @staticmethod
    async def create(conn, data: Dict) -> Dict:
        """Insert a new inspection."""
        row = await conn.fetchrow("""
            INSERT INTO field_inspections (
                agent_id, agent_profile_id, entity_id, entity_location_id,
                license_id, company_id, inspection_date, status, result,
                notes, unpaid_obligations_count, unpaid_obligations_amount,
                total_obligations_count
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *
        """,
            data["agent_id"], data["agent_profile_id"],
            data["entity_id"], data["entity_location_id"],
            data["license_id"], data["company_id"],
            data.get("inspection_date", date.today()),
            "in_progress", "pending",
            data.get("notes"),
            data.get("unpaid_obligations_count", 0),
            data.get("unpaid_obligations_amount", Decimal("0")),
            data.get("total_obligations_count", 0),
        )
        return dict(row) if row else None

    # ============================================================
    # READ
    # ============================================================

    @staticmethod
    async def get_by_id(conn, inspection_id: UUID) -> Optional[Dict]:
        """Get inspection with enriched company/agent data."""
        row = await conn.fetchrow("""
            SELECT fi.*,
                   c.name AS company_name,
                   c.nif AS company_nif,
                   u.full_name AS agent_name,
                   e.code AS entity_code
            FROM field_inspections fi
            JOIN companies c ON c.id = fi.company_id
            JOIN users u ON u.id = fi.agent_id
            JOIN entities e ON e.id = fi.entity_id
            WHERE fi.id = $1
        """, inspection_id)
        return dict(row) if row else None

    @staticmethod
    async def list_by_agent(
        conn, agent_id: UUID,
        inspection_date: Optional[date] = None,
        status: Optional[str] = None,
        page: int = 1, page_size: int = 20,
    ) -> Tuple[List[Dict], int]:
        """List inspections for an agent."""
        conditions = ["fi.agent_id = $1"]
        params = [agent_id]
        idx = 2

        if inspection_date:
            conditions.append(f"fi.inspection_date = ${idx}")
            params.append(inspection_date)
            idx += 1

        if status:
            conditions.append(f"fi.status = ${idx}")
            params.append(status)
            idx += 1

        where = " AND ".join(conditions)

        count_row = await conn.fetchrow(
            f"SELECT COUNT(*) FROM field_inspections fi WHERE {where}", *params
        )
        total = count_row["count"]

        rows = await conn.fetch(f"""
            SELECT fi.id, fi.inspection_date, fi.status, fi.result,
                   c.name AS company_name, c.nif AS company_nif,
                   fi.unpaid_obligations_count, fi.unpaid_obligations_amount,
                   fi.seal_applied, fi.mise_en_demeure_issued,
                   fi.payment_collected,
                   u.full_name AS agent_name,
                   e.code AS entity_code,
                   fi.created_at
            FROM field_inspections fi
            JOIN companies c ON c.id = fi.company_id
            JOIN users u ON u.id = fi.agent_id
            JOIN entities e ON e.id = fi.entity_id
            WHERE {where}
            ORDER BY fi.created_at DESC
            LIMIT ${idx} OFFSET ${idx + 1}
        """, *params, page_size, (page - 1) * page_size)

        return [dict(r) for r in rows], total

    @staticmethod
    async def list_by_entity(
        conn, entity_id: UUID,
        inspection_date: Optional[date] = None,
        status: Optional[str] = None,
        agent_id: Optional[UUID] = None,
        page: int = 1, page_size: int = 20,
    ) -> Tuple[List[Dict], int]:
        """List inspections for an entity (supervisor view)."""
        conditions = ["fi.entity_id = $1"]
        params = [entity_id]
        idx = 2

        if inspection_date:
            conditions.append(f"fi.inspection_date = ${idx}")
            params.append(inspection_date)
            idx += 1

        if status:
            conditions.append(f"fi.status = ${idx}")
            params.append(status)
            idx += 1

        if agent_id:
            conditions.append(f"fi.agent_id = ${idx}")
            params.append(agent_id)
            idx += 1

        where = " AND ".join(conditions)

        count_row = await conn.fetchrow(
            f"SELECT COUNT(*) FROM field_inspections fi WHERE {where}", *params
        )
        total = count_row["count"]

        rows = await conn.fetch(f"""
            SELECT fi.id, fi.inspection_date, fi.status, fi.result,
                   c.name AS company_name, c.nif AS company_nif,
                   fi.unpaid_obligations_count, fi.unpaid_obligations_amount,
                   fi.seal_applied, fi.mise_en_demeure_issued,
                   fi.payment_collected,
                   u.full_name AS agent_name,
                   e.code AS entity_code,
                   fi.created_at
            FROM field_inspections fi
            JOIN companies c ON c.id = fi.company_id
            JOIN users u ON u.id = fi.agent_id
            JOIN entities e ON e.id = fi.entity_id
            WHERE {where}
            ORDER BY fi.created_at DESC
            LIMIT ${idx} OFFSET ${idx + 1}
        """, *params, page_size, (page - 1) * page_size)

        return [dict(r) for r in rows], total

    # ============================================================
    # UPDATE
    # ============================================================

    @staticmethod
    async def update(conn, inspection_id: UUID, data: Dict) -> Optional[Dict]:
        """Update inspection fields."""
        if not data:
            return await InspectionRepository.get_by_id(conn, inspection_id)

        set_clauses = []
        params = []
        idx = 1

        for key, value in data.items():
            set_clauses.append(f"{key} = ${idx}")
            params.append(value)
            idx += 1

        set_clauses.append(f"updated_at = NOW()")
        params.append(inspection_id)

        row = await conn.fetchrow(f"""
            UPDATE field_inspections
            SET {', '.join(set_clauses)}
            WHERE id = ${idx}
            RETURNING *
        """, *params)

        if not row:
            return None

        # Re-fetch with JOINs for enriched response
        return await InspectionRepository.get_by_id(conn, inspection_id)

    # ============================================================
    # STATS
    # ============================================================

    @staticmethod
    async def get_stats(
        conn, agent_id: Optional[UUID] = None,
        entity_id: Optional[UUID] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
    ) -> Dict:
        """Get inspection stats for agent or entity."""
        conditions = []
        params = []
        idx = 1

        if agent_id:
            conditions.append(f"agent_id = ${idx}")
            params.append(agent_id)
            idx += 1

        if entity_id:
            conditions.append(f"entity_id = ${idx}")
            params.append(entity_id)
            idx += 1

        if date_from:
            conditions.append(f"inspection_date >= ${idx}")
            params.append(date_from)
            idx += 1

        if date_to:
            conditions.append(f"inspection_date <= ${idx}")
            params.append(date_to)
            idx += 1

        where = " AND ".join(conditions) if conditions else "TRUE"

        row = await conn.fetchrow(f"""
            SELECT
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE result = 'conforme') AS conforme,
                COUNT(*) FILTER (WHERE result = 'non_conforme') AS non_conforme,
                COUNT(*) FILTER (WHERE mise_en_demeure_issued = true) AS mise_en_demeure,
                COUNT(*) FILTER (WHERE status = 'seal_proposed') AS seals_proposed,
                COUNT(*) FILTER (WHERE status = 'seal_approved') AS seals_approved,
                COUNT(*) FILTER (WHERE payment_collected = true) AS payments_collected,
                COALESCE(SUM(payment_amount) FILTER (WHERE payment_collected = true), 0) AS total_collected_amount
            FROM field_inspections
            WHERE {where}
        """, *params)

        return dict(row) if row else {}

    # ============================================================
    # SEAL QUERIES
    # ============================================================

    @staticmethod
    async def get_pending_seals(conn, entity_id: UUID) -> List[Dict]:
        """Get seal proposals pending supervisor approval."""
        rows = await conn.fetch("""
            SELECT fi.id, fi.inspection_date,
                   c.name AS company_name, c.nif AS company_nif,
                   fi.seal_reason, fi.seal_notes, fi.seal_photo,
                   fi.seal_proposed_at,
                   u.full_name AS agent_name,
                   fi.photos,
                   fi.gps_latitude, fi.gps_longitude,
                   fi.unpaid_obligations_amount,
                   fi.unpaid_obligations_count
            FROM field_inspections fi
            JOIN companies c ON c.id = fi.company_id
            JOIN users u ON u.id = fi.agent_id
            WHERE fi.entity_id = $1
              AND fi.status = 'seal_proposed'
            ORDER BY fi.seal_proposed_at ASC
        """, entity_id)
        return [dict(r) for r in rows]

    @staticmethod
    async def get_overdue_med_count(conn, entity_id: UUID) -> int:
        """Count MED with expired deadlines and no seal yet."""
        row = await conn.fetchrow("""
            SELECT COUNT(*) AS cnt
            FROM field_inspections
            WHERE entity_id = $1
              AND mise_en_demeure_issued = true
              AND mise_en_demeure_deadline < NOW()
              AND status = 'mise_en_demeure'
        """, entity_id)
        return row["cnt"] if row else 0

    @staticmethod
    async def get_auto_approve_seals(conn, hours: int = 24) -> List[Dict]:
        """Get seal proposals that exceeded auto-approve deadline."""
        rows = await conn.fetch("""
            SELECT fi.id, fi.company_id, fi.license_id, fi.entity_id,
                   fi.seal_reason, fi.agent_id
            FROM field_inspections fi
            WHERE fi.status = 'seal_proposed'
              AND fi.seal_proposed_at < NOW() - $1::interval
        """, timedelta(hours=hours))
        return [dict(r) for r in rows]

    # ============================================================
    # RECONCILIATION
    # ============================================================

    @staticmethod
    async def get_unreconciled_cash(
        conn, agent_id: UUID,
        target_date: Optional[date] = None,
    ) -> Tuple[List[Dict], Decimal]:
        """Get agent's cash collections for reconciliation."""
        d = target_date or date.today()

        rows = await conn.fetch("""
            SELECT fi.id, fi.inspection_date,
                   c.name AS company_name, c.nif AS company_nif,
                   fi.payment_amount, fi.payment_receipt_number,
                   fi.created_at
            FROM field_inspections fi
            JOIN companies c ON c.id = fi.company_id
            WHERE fi.agent_id = $1
              AND fi.payment_collected = true
              AND fi.inspection_date = $2
            ORDER BY fi.created_at ASC
        """, agent_id, d)

        items = [dict(r) for r in rows]
        total = sum(r.get("payment_amount") or Decimal("0") for r in items)
        return items, total

    @staticmethod
    async def get_unreconciled_cash_by_entity(conn, entity_id: UUID) -> Dict:
        """Get total unreconciled cash for entity (supervisor view)."""
        row = await conn.fetchrow("""
            SELECT
                COUNT(*) AS cnt,
                COALESCE(SUM(payment_amount), 0) AS total
            FROM field_inspections
            WHERE entity_id = $1
              AND payment_collected = true
              AND inspection_date >= CURRENT_DATE - INTERVAL '7 days'
        """, entity_id)
        return {
            "count": row["cnt"] if row else 0,
            "amount": row["total"] if row else Decimal("0"),
        }

    # ============================================================
    # LICENSE VERIFICATION (Agent Mode)
    # ============================================================

    @staticmethod
    async def get_license_for_verification(
        conn, license_id: UUID, entity_id: UUID,
    ) -> Optional[Dict]:
        """Get enriched license data for agent verification."""
        row = await conn.fetchrow("""
            SELECT cl.id AS license_id, cl.company_id,
                   c.name AS company_name, c.nif AS company_nif,
                   c.registration_number AS company_registration_number,
                   c.forma_juridica, c.commerce_type,
                   cz.zone_code,
                   ci.name AS city_name,
                   cl.fiscal_year, cl.status AS license_status,
                   cl.total_amount, cl.amount_paid, cl.compliance_score
            FROM commercial_licenses cl
            JOIN companies c ON c.id = cl.company_id
            LEFT JOIN commerce_zones cz ON cz.id = cl.zone_id
            LEFT JOIN cities ci ON ci.id = cl.city_id
            WHERE cl.id = $1
        """, license_id)

        if not row:
            return None

        result = dict(row)

        # Get obligations filtered by entity's fee_type scope
        obligations = await conn.fetch("""
            SELECT lo.id, lo.fee_type, lo.amount, lo.penalty_amount,
                   lo.due_date, lo.status,
                   fs.name_es AS service_name,
                   m.name_es AS ministry_name
            FROM license_obligations lo
            LEFT JOIN fiscal_services fs ON fs.id = lo.fiscal_service_id
            LEFT JOIN ministries m ON m.id = lo.ministry_id
            WHERE lo.license_id = $1
            ORDER BY lo.fee_type, lo.due_date
        """, license_id)
        result["obligations"] = [dict(o) for o in obligations]

        # Previous inspections
        prev_inspections = await conn.fetch("""
            SELECT fi.id, fi.inspection_date, fi.status, fi.result,
                   fi.unpaid_obligations_count, fi.unpaid_obligations_amount,
                   fi.seal_applied, fi.mise_en_demeure_issued,
                   fi.payment_collected,
                   u.full_name AS agent_name,
                   e.code AS entity_code,
                   fi.created_at
            FROM field_inspections fi
            JOIN users u ON u.id = fi.agent_id
            JOIN entities e ON e.id = fi.entity_id
            WHERE fi.company_id = $1
            ORDER BY fi.inspection_date DESC
            LIMIT 10
        """, result["company_id"])
        result["previous_inspections"] = [dict(p) for p in prev_inspections]

        # Active MED
        med = await conn.fetchrow("""
            SELECT id, mise_en_demeure_deadline, mise_en_demeure_obligations,
                   inspection_date, agent_id
            FROM field_inspections
            WHERE company_id = $1
              AND mise_en_demeure_issued = true
              AND status = 'mise_en_demeure'
              AND mise_en_demeure_deadline > NOW()
            ORDER BY mise_en_demeure_deadline DESC
            LIMIT 1
        """, result["company_id"])
        result["active_mise_en_demeure"] = dict(med) if med else None

        # Seal history
        seals = await conn.fetch("""
            SELECT id, inspection_date, seal_reason, status,
                   seal_approved_at, seal_approved_by
            FROM field_inspections
            WHERE company_id = $1
              AND seal_applied = true
            ORDER BY seal_proposed_at DESC
            LIMIT 5
        """, result["company_id"])
        result["seal_history"] = [dict(s) for s in seals]

        return result

    @staticmethod
    async def find_license_by_company_nif(conn, nif: str) -> Optional[Dict]:
        """Find the current year license for a company by NIF."""
        row = await conn.fetchrow("""
            SELECT cl.id AS license_id, cl.company_id
            FROM commercial_licenses cl
            JOIN companies c ON c.id = cl.company_id
            WHERE c.nif = $1
              AND cl.fiscal_year = EXTRACT(YEAR FROM CURRENT_DATE)::int
              AND cl.status NOT IN ('closed', 'cancelled')
            ORDER BY cl.created_at DESC
            LIMIT 1
        """, nif)
        return dict(row) if row else None
