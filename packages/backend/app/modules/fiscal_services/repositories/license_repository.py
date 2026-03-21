"""License Repository — Data access for commercial_licenses, license_obligations, license_compliance_events."""

import logging
from typing import Dict, List, Optional, Tuple
from uuid import UUID

logger = logging.getLogger(__name__)


class LicenseRepository:
    """Repository for the OMS (Obligation Management System) tables."""

    # ==================================================================
    # Licenses — Read
    # ==================================================================

    @staticmethod
    async def get_license(conn, license_id: UUID) -> Optional[Dict]:
        """Get a single license with enriched JOINs."""
        row = await conn.fetchrow("""
            SELECT cl.*,
                   co.legal_name as company_name,
                   sb.name_es as bundle_name,
                   cz.zone_code
            FROM commercial_licenses cl
            LEFT JOIN companies co ON cl.company_id = co.id
            LEFT JOIN service_bundles sb ON cl.bundle_id = sb.id
            LEFT JOIN commerce_zones cz ON cl.zone_id = cz.id
            WHERE cl.id = $1
        """, license_id)
        return dict(row) if row else None

    @staticmethod
    async def get_license_by_scope(
        conn, company_id: UUID, bundle_id: UUID, fiscal_year: int
    ) -> Optional[Dict]:
        """Lookup by UNIQUE(company, bundle, year)."""
        row = await conn.fetchrow("""
            SELECT cl.*,
                   co.legal_name as company_name,
                   sb.name_es as bundle_name,
                   cz.zone_code
            FROM commercial_licenses cl
            LEFT JOIN companies co ON cl.company_id = co.id
            LEFT JOIN service_bundles sb ON cl.bundle_id = sb.id
            LEFT JOIN commerce_zones cz ON cl.zone_id = cz.id
            WHERE cl.company_id = $1 AND cl.bundle_id = $2 AND cl.fiscal_year = $3
        """, company_id, bundle_id, fiscal_year)
        return dict(row) if row else None

    @staticmethod
    async def list_licenses(
        conn,
        company_id: Optional[UUID] = None,
        bundle_id: Optional[UUID] = None,
        fiscal_year: Optional[int] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Dict], int]:
        """List licenses with filters, paginated.

        search: ILIKE on company legal_name or bundle name_es.
        """
        conditions = []
        params = []
        idx = 1

        if company_id:
            conditions.append(f"cl.company_id = ${idx}")
            params.append(company_id)
            idx += 1

        if bundle_id:
            conditions.append(f"cl.bundle_id = ${idx}")
            params.append(bundle_id)
            idx += 1

        if fiscal_year:
            conditions.append(f"cl.fiscal_year = ${idx}")
            params.append(fiscal_year)
            idx += 1

        if status:
            conditions.append(f"cl.status = ${idx}")
            params.append(status)
            idx += 1

        if search:
            conditions.append(
                f"(co.legal_name ILIKE ${idx} OR sb.name_es ILIKE ${idx})"
            )
            escaped = search.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
            params.append(f"%{escaped}%")
            idx += 1

        where = "WHERE " + " AND ".join(conditions) if conditions else ""

        # JOINs needed for both count (when search active) and data
        joins = """
            LEFT JOIN companies co ON cl.company_id = co.id
            LEFT JOIN service_bundles sb ON cl.bundle_id = sb.id
            LEFT JOIN commerce_zones cz ON cl.zone_id = cz.id
        """

        # Count — need JOINs when search is active
        if search:
            count_row = await conn.fetchrow(
                f"SELECT COUNT(*) as total FROM commercial_licenses cl {joins} {where}",
                *params,
            )
        else:
            count_row = await conn.fetchrow(
                f"SELECT COUNT(*) as total FROM commercial_licenses cl {where}",
                *params,
            )
        total = count_row["total"]

        # Data
        offset = (page - 1) * page_size
        params_data = params + [page_size, offset]
        rows = await conn.fetch(f"""
            SELECT cl.*,
                   co.legal_name as company_name,
                   sb.name_es as bundle_name,
                   cz.zone_code
            FROM commercial_licenses cl
            {joins}
            {where}
            ORDER BY cl.fiscal_year DESC, cl.created_at DESC
            LIMIT ${idx} OFFSET ${idx + 1}
        """, *params_data)

        return [dict(r) for r in rows], total

    # ==================================================================
    # Licenses — Write
    # ==================================================================

    @staticmethod
    async def create_license(conn, data: Dict, user_id: Optional[UUID] = None) -> Dict:
        """Create a commercial license dossier."""
        row = await conn.fetchrow("""
            INSERT INTO commercial_licenses
                (company_id, service_request_id, bundle_id, zone_id, city_id,
                 fiscal_year, processing_mode, total_amount, obligations_total,
                 deadline, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        """,
            data["company_id"],
            data.get("service_request_id"),
            data["bundle_id"],
            data["zone_id"],
            data.get("city_id"),
            data["fiscal_year"],
            data.get("processing_mode", "per_line"),
            data["total_amount"],
            data["obligations_total"],
            data.get("deadline"),
            user_id,
        )
        return await LicenseRepository.get_license(conn, row["id"])

    @staticmethod
    async def update_license(
        conn, license_id: UUID, data: Dict
    ) -> Optional[Dict]:
        """Partial update of a license."""
        allowed = [
            "status", "amount_paid", "penalty_amount",
            "obligations_paid", "obligations_overdue",
            "completed_at", "closed_at",
        ]
        sets = []
        params = []
        idx = 1

        for field in allowed:
            if field in data:
                sets.append(f"{field} = ${idx}")
                val = data[field]
                if hasattr(val, "value"):
                    val = val.value
                params.append(val)
                idx += 1

        if not sets:
            return await LicenseRepository.get_license(conn, license_id)

        params.append(license_id)
        row = await conn.fetchrow(f"""
            UPDATE commercial_licenses
            SET {', '.join(sets)}
            WHERE id = ${idx}
            RETURNING id
        """, *params)

        if not row:
            return None
        return await LicenseRepository.get_license(conn, license_id)

    # ==================================================================
    # Obligations — Read
    # ==================================================================

    @staticmethod
    async def list_obligations(
        conn,
        license_id: UUID,
        fee_type: Optional[str] = None,
        status: Optional[str] = None,
        page: int = 1,
        page_size: int = 100,
    ) -> Tuple[List[Dict], int]:
        """List obligations for a license with enriched JOINs."""
        conditions = ["lo.license_id = $1"]
        params = [license_id]
        idx = 2

        if fee_type:
            conditions.append(f"lo.fee_type = ${idx}")
            params.append(fee_type)
            idx += 1

        if status:
            conditions.append(f"lo.status = ${idx}")
            params.append(status)
            idx += 1

        where = "WHERE " + " AND ".join(conditions)

        count_row = await conn.fetchrow(
            f"SELECT COUNT(*) as total FROM license_obligations lo {where}",
            *params,
        )
        total = count_row["total"]

        offset = (page - 1) * page_size
        params_data = params + [page_size, offset]
        rows = await conn.fetch(f"""
            SELECT lo.*,
                   fs.name_es as service_name,
                   fs.service_code,
                   m.name_es as ministry_name
            FROM license_obligations lo
            LEFT JOIN fiscal_services fs ON lo.fiscal_service_id = fs.id
            LEFT JOIN ministries m ON lo.ministry_id = m.id
            {where}
            ORDER BY lo.fee_type, fs.service_code
            LIMIT ${idx} OFFSET ${idx + 1}
        """, *params_data)

        return [dict(r) for r in rows], total

    @staticmethod
    async def get_obligation(conn, obligation_id: UUID) -> Optional[Dict]:
        """Get a single obligation with JOINs."""
        row = await conn.fetchrow("""
            SELECT lo.*,
                   fs.name_es as service_name,
                   fs.service_code,
                   m.name_es as ministry_name
            FROM license_obligations lo
            LEFT JOIN fiscal_services fs ON lo.fiscal_service_id = fs.id
            LEFT JOIN ministries m ON lo.ministry_id = m.id
            WHERE lo.id = $1
        """, obligation_id)
        return dict(row) if row else None

    @staticmethod
    async def get_obligations_grouped_by_fee_type(
        conn, license_id: UUID
    ) -> Dict:
        """Group obligations by fee_type with sub-totals."""
        rows = await conn.fetch("""
            SELECT fee_type,
                   COUNT(*) as count,
                   SUM(amount) as subtotal,
                   SUM(penalty_amount) as penalty_subtotal,
                   COUNT(*) FILTER (WHERE status = 'paid') as paid_count,
                   COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
                   COUNT(*) FILTER (WHERE status = 'overdue') as overdue_count
            FROM license_obligations
            WHERE license_id = $1
            GROUP BY fee_type
            ORDER BY fee_type
        """, license_id)
        return {r["fee_type"]: dict(r) for r in rows}

    @staticmethod
    async def count_by_status(conn, license_id: UUID) -> Dict:
        """Count obligations by status for a license."""
        rows = await conn.fetch("""
            SELECT status, COUNT(*) as count
            FROM license_obligations
            WHERE license_id = $1
            GROUP BY status
        """, license_id)
        return {r["status"]: r["count"] for r in rows}

    # ==================================================================
    # Obligations — Write
    # ==================================================================

    @staticmethod
    async def create_obligations_batch(
        conn, license_id: UUID, items: List[Dict]
    ) -> List[Dict]:
        """Bulk insert obligations from bundle items.

        Uses a single INSERT with multiple VALUES rows (no N+1).
        """
        if not items:
            return []

        # Build VALUES clause with dynamic parameters
        values_parts = []
        params = []
        idx = 1
        for item in items:
            values_parts.append(
                f"(${idx}, ${idx+1}, ${idx+2}, ${idx+3}, ${idx+4}, "
                f"${idx+5}, ${idx+6}, ${idx+7}, ${idx+8})"
            )
            params.extend([
                license_id,
                item["bundle_item_id"],
                item["fiscal_service_id"],
                item.get("ministry_id"),
                item["fee_type"],
                item["amount"],
                item.get("due_date"),
                item.get("penalty_config"),
                item.get("deadline_config"),
            ])
            idx += 9

        values_sql = ", ".join(values_parts)
        rows = await conn.fetch(f"""
            INSERT INTO license_obligations
                (license_id, bundle_item_id, fiscal_service_id, ministry_id,
                 fee_type, amount, due_date, penalty_config, deadline_config)
            VALUES {values_sql}
            RETURNING *
        """, *params)

        return [dict(r) for r in rows]

    @staticmethod
    async def update_obligation_status(
        conn, obligation_id: UUID, data: Dict
    ) -> Optional[Dict]:
        """Update obligation status and related fields."""
        sets = []
        params = []
        idx = 1

        for field in ["status", "payment_id", "paid_at", "penalty_amount",
                       "issued_document_id", "user_document_id"]:
            if field in data:
                sets.append(f"{field} = ${idx}")
                val = data[field]
                if hasattr(val, "value"):
                    val = val.value
                params.append(val)
                idx += 1

        if not sets:
            return await LicenseRepository.get_obligation(conn, obligation_id)

        params.append(obligation_id)
        row = await conn.fetchrow(f"""
            UPDATE license_obligations
            SET {', '.join(sets)}
            WHERE id = ${idx}
            RETURNING id
        """, *params)

        if not row:
            return None
        return await LicenseRepository.get_obligation(conn, obligation_id)

    # ==================================================================
    # Events — Append-only
    # ==================================================================

    @staticmethod
    async def log_event(
        conn,
        license_id: UUID,
        event_type: str,
        event_data: Optional[Dict] = None,
        obligation_id: Optional[UUID] = None,
        triggered_by: Optional[UUID] = None,
    ) -> Dict:
        """Insert a compliance event (append-only)."""
        row = await conn.fetchrow("""
            INSERT INTO license_compliance_events
                (license_id, obligation_id, event_type, event_data, triggered_by)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        """,
            license_id,
            obligation_id,
            event_type,
            event_data or {},
            triggered_by,
        )
        return dict(row)

    @staticmethod
    async def log_events_batch(
        conn,
        license_id: UUID,
        event_type: str,
        items: List[Dict],
        triggered_by: Optional[UUID] = None,
    ) -> List[Dict]:
        """Bulk insert compliance events (single INSERT, no N+1).

        Each item must have:
          - obligation_id: UUID
          - event_data: Dict
        """
        if not items:
            return []

        values_parts = []
        params = []
        idx = 1
        for item in items:
            values_parts.append(
                f"(${idx}, ${idx+1}, ${idx+2}, ${idx+3}, ${idx+4})"
            )
            params.extend([
                license_id,
                item.get("obligation_id"),
                event_type,
                item.get("event_data", {}),
                triggered_by,
            ])
            idx += 5

        values_sql = ", ".join(values_parts)
        rows = await conn.fetch(f"""
            INSERT INTO license_compliance_events
                (license_id, obligation_id, event_type, event_data, triggered_by)
            VALUES {values_sql}
            RETURNING *
        """, *params)

        return [dict(r) for r in rows]

    @staticmethod
    async def list_events(
        conn,
        license_id: UUID,
        event_type: Optional[str] = None,
        obligation_id: Optional[UUID] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> Tuple[List[Dict], int]:
        """List compliance events for a license (timeline)."""
        conditions = ["lce.license_id = $1"]
        params = [license_id]
        idx = 2

        if event_type:
            conditions.append(f"lce.event_type = ${idx}")
            params.append(event_type)
            idx += 1

        if obligation_id:
            conditions.append(f"lce.obligation_id = ${idx}")
            params.append(obligation_id)
            idx += 1

        where = "WHERE " + " AND ".join(conditions)

        count_row = await conn.fetchrow(
            f"SELECT COUNT(*) as total FROM license_compliance_events lce {where}",
            *params,
        )
        total = count_row["total"]

        offset = (page - 1) * page_size
        params_data = params + [page_size, offset]
        rows = await conn.fetch(f"""
            SELECT lce.*
            FROM license_compliance_events lce
            {where}
            ORDER BY lce.created_at DESC
            LIMIT ${idx} OFFSET ${idx + 1}
        """, *params_data)

        return [dict(r) for r in rows], total

    # ==================================================================
    # Agent Queue (OMS Post-Payment Processing)
    # ==================================================================

    @staticmethod
    async def get_agent_queue(
        conn,
        ministry_id: Optional[int] = None,
        processing_mode: Optional[str] = None,
        status_filter: Optional[List[str]] = None,
        fee_type: Optional[str] = None,
        search: Optional[str] = None,
        agent_profile_id: Optional[UUID] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> Tuple[List[Dict], int]:
        """Get obligation queue for OMS post-payment agents.

        Ministry agent (Mode A): filter by ministry_id + processing_mode='per_line'
        Polyvalent agent (Mode B): filter by processing_mode='consolidated'

        When agent_profile_id is provided, only obligations assigned to this agent
        are returned (via JOIN assignments). Supervisors pass agent_profile_id=None
        to see all obligations in their scope.
        """
        if status_filter is None:
            status_filter = ["processing"]

        conditions = []
        params = []
        idx = 1
        assignment_join = ""

        # Status filter
        placeholders = ", ".join(f"${idx + i}" for i in range(len(status_filter)))
        conditions.append(f"lo.status IN ({placeholders})")
        params.extend(status_filter)
        idx += len(status_filter)

        # Ministry filter (Mode A agents)
        if ministry_id is not None:
            conditions.append(f"lo.ministry_id = ${idx}")
            params.append(ministry_id)
            idx += 1

        # Processing mode filter (Mode A vs Mode B)
        if processing_mode:
            conditions.append(f"cl.processing_mode = ${idx}")
            params.append(processing_mode)
            idx += 1

        # Fee type filter
        if fee_type:
            conditions.append(f"lo.fee_type = ${idx}")
            params.append(fee_type)
            idx += 1

        # Search filter (company name, NIF, registration_number, service name)
        if search:
            conditions.append(f"""(
                co.legal_name ILIKE ${idx}
                OR co.nif ILIKE ${idx}
                OR co.registration_number ILIKE ${idx}
                OR fs.name_es ILIKE ${idx}
            )""")
            params.append(f"%{search}%")
            idx += 1

        # Assignment filter (non-supervisors only see their assigned obligations)
        if agent_profile_id is not None:
            assignment_join = f"""
            JOIN assignments a ON a.item_id = lo.id
                AND a.item_type = 'obligation_processing'
                AND a.agent_profile_id = ${idx}
                AND a.status IN ('assigned', 'in_progress')
            """
            params.append(agent_profile_id)
            idx += 1

        where = "WHERE " + " AND ".join(conditions)

        count_row = await conn.fetchrow(f"""
            SELECT COUNT(*) as total
            FROM license_obligations lo
            JOIN commercial_licenses cl ON cl.id = lo.license_id
            LEFT JOIN companies co ON cl.company_id = co.id
            LEFT JOIN fiscal_services fs ON lo.fiscal_service_id = fs.id
            {assignment_join}
            {where}
        """, *params)
        total = count_row["total"]

        offset = (page - 1) * page_size
        params_data = params + [page_size, offset]
        rows = await conn.fetch(f"""
            SELECT lo.*,
                   fs.name_es as service_name,
                   fs.service_code,
                   m.name_es as ministry_name,
                   cl.fiscal_year,
                   cl.processing_mode,
                   co.legal_name as company_name,
                   co.nif as company_nif,
                   cz.zone_code
            FROM license_obligations lo
            JOIN commercial_licenses cl ON cl.id = lo.license_id
            LEFT JOIN fiscal_services fs ON lo.fiscal_service_id = fs.id
            LEFT JOIN ministries m ON lo.ministry_id = m.id
            LEFT JOIN companies co ON cl.company_id = co.id
            LEFT JOIN commerce_zones cz ON cl.zone_id = cz.id
            {assignment_join}
            {where}
            ORDER BY lo.due_date ASC NULLS LAST, lo.amount DESC
            LIMIT ${idx} OFFSET ${idx + 1}
        """, *params_data)

        return [dict(r) for r in rows], total

    @staticmethod
    async def get_agent_queue_stats(
        conn,
        ministry_id: Optional[int] = None,
        processing_mode: Optional[str] = None,
        fee_type: Optional[str] = None,
        agent_profile_id: Optional[UUID] = None,
    ) -> Dict:
        """Aggregated stats for agent OMS dashboard.

        When agent_profile_id is provided, stats are scoped to assigned obligations.
        fee_type is used for independent agents (ayuntamiento=municipal, camara=chamber).
        """
        conditions = []
        params = []
        idx = 1
        assignment_join = ""

        if ministry_id is not None:
            conditions.append(f"lo.ministry_id = ${idx}")
            params.append(ministry_id)
            idx += 1

        if processing_mode:
            conditions.append(f"cl.processing_mode = ${idx}")
            params.append(processing_mode)
            idx += 1

        if fee_type:
            conditions.append(f"lo.fee_type = ${idx}")
            params.append(fee_type)
            idx += 1

        if agent_profile_id is not None:
            assignment_join = f"""
            JOIN assignments a ON a.item_id = lo.id
                AND a.item_type = 'obligation_processing'
                AND a.agent_profile_id = ${idx}
                AND a.status IN ('assigned', 'in_progress', 'completed')
            """
            params.append(agent_profile_id)
            idx += 1

        where = "WHERE " + " AND ".join(conditions) if conditions else ""

        row = await conn.fetchrow(f"""
            SELECT
                COUNT(*) FILTER (WHERE lo.status = 'processing') as pending_count,
                COUNT(*) FILTER (
                    WHERE lo.status = 'completed'
                    AND lo.updated_at::date = CURRENT_DATE
                ) as completed_today,
                COALESCE(SUM(lo.amount) FILTER (
                    WHERE lo.status = 'processing'
                ), 0) as total_amount_pending,
                COALESCE(SUM(lo.amount) FILTER (
                    WHERE lo.status = 'completed'
                    AND lo.updated_at::date = CURRENT_DATE
                ), 0) as total_amount_completed_today
            FROM license_obligations lo
            JOIN commercial_licenses cl ON cl.id = lo.license_id
            {assignment_join}
            {where}
        """, *params)
        return dict(row)

    @staticmethod
    async def get_compliance_summary(
        conn,
        fiscal_year: int,
        ministry_id: Optional[int] = None,
    ) -> List[Dict]:
        """Aggregated compliance summary by fee_type for a fiscal year.

        Single query using LATERAL JOIN for overdue companies — no N+1.
        Returns 1 row per fee_type with: counts, amounts, recovery %, overdue companies.
        """
        import json as _json

        conditions = ["cl.fiscal_year = $1"]
        params: list = [fiscal_year]
        idx = 2

        if ministry_id is not None:
            conditions.append(f"lo.ministry_id = ${idx}")
            params.append(ministry_id)
            idx += 1

        where = "WHERE " + " AND ".join(conditions)
        ministry_clause = f"AND lo2.ministry_id = $2" if ministry_id is not None else ""

        # Single query: aggregation + overdue companies via LATERAL subquery
        rows = await conn.fetch(f"""
            WITH fee_stats AS (
                SELECT
                    lo.fee_type,
                    COUNT(*) as total_obligations,
                    COUNT(*) FILTER (
                        WHERE lo.status IN ('paid', 'completed', 'processing')
                    ) as paid,
                    COUNT(*) FILTER (
                        WHERE lo.status IN ('pending', 'selected', 'payment_pending')
                    ) as pending,
                    COUNT(*) FILTER (WHERE lo.status = 'overdue') as overdue,
                    COALESCE(SUM(lo.amount), 0) as total_amount,
                    COALESCE(SUM(lo.amount) FILTER (
                        WHERE lo.status IN ('paid', 'completed', 'processing')
                    ), 0) as paid_amount,
                    COALESCE(SUM(lo.amount) FILTER (
                        WHERE lo.status = 'overdue'
                    ), 0) as overdue_amount,
                    COALESCE(SUM(lo.penalty_amount) FILTER (
                        WHERE lo.status = 'overdue'
                    ), 0) as overdue_penalty
                FROM license_obligations lo
                JOIN commercial_licenses cl ON cl.id = lo.license_id
                {where}
                GROUP BY lo.fee_type
            ),
            overdue_companies AS (
                SELECT
                    lo2.fee_type,
                    co.legal_name as company_name,
                    co.nif as company_nif,
                    cz.zone_code,
                    cl2.id as license_id,
                    SUM(lo2.amount) as amount,
                    COALESCE(SUM(lo2.penalty_amount), 0) as penalty,
                    ROW_NUMBER() OVER (
                        PARTITION BY lo2.fee_type
                        ORDER BY SUM(lo2.amount) DESC
                    ) as rn
                FROM license_obligations lo2
                JOIN commercial_licenses cl2 ON cl2.id = lo2.license_id
                LEFT JOIN companies co ON cl2.company_id = co.id
                LEFT JOIN commerce_zones cz ON cl2.zone_id = cz.id
                WHERE lo2.status = 'overdue'
                  AND cl2.fiscal_year = $1
                  {ministry_clause}
                GROUP BY lo2.fee_type, co.legal_name, co.nif,
                         cz.zone_code, cl2.id
            )
            SELECT
                fs.*,
                COALESCE(
                    JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'company_name', oc.company_name,
                            'company_nif', oc.company_nif,
                            'zone', oc.zone_code,
                            'license_id', oc.license_id::text,
                            'amount', oc.amount,
                            'penalty', oc.penalty
                        ) ORDER BY oc.amount DESC
                    ) FILTER (WHERE oc.company_name IS NOT NULL AND oc.rn <= 50),
                    '[]'::json
                ) as overdue_companies_json
            FROM fee_stats fs
            LEFT JOIN overdue_companies oc ON oc.fee_type = fs.fee_type
            GROUP BY fs.fee_type, fs.total_obligations, fs.paid,
                     fs.pending, fs.overdue, fs.total_amount,
                     fs.paid_amount, fs.overdue_amount, fs.overdue_penalty
            ORDER BY fs.overdue_amount DESC
        """, *params)

        result = []
        for r in rows:
            total = float(r["total_amount"]) if r["total_amount"] else 0
            paid = float(r["paid_amount"]) if r["paid_amount"] else 0
            recovery_pct = round((paid / total) * 100) if total > 0 else 0

            # Parse JSON-aggregated overdue companies (already sorted, limited)
            raw_companies = r["overdue_companies_json"]
            if isinstance(raw_companies, str):
                overdue_companies = _json.loads(raw_companies)
            elif isinstance(raw_companies, list):
                overdue_companies = raw_companies
            else:
                overdue_companies = []

            result.append({
                "fee_type": r["fee_type"],
                "total_obligations": r["total_obligations"],
                "paid": r["paid"],
                "pending": r["pending"],
                "overdue": r["overdue"],
                "total_amount": float(r["total_amount"]),
                "paid_amount": float(r["paid_amount"]),
                "overdue_amount": float(r["overdue_amount"]),
                "overdue_penalty": float(r["overdue_penalty"]),
                "recovery_pct": recovery_pct,
                "overdue_companies": [
                    {
                        "company_name": c["company_name"] or "—",
                        "company_nif": c["company_nif"],
                        "zone": c["zone_code"],
                        "license_id": str(c["license_id"]),
                        "amount": float(c["amount"]),
                        "penalty": float(c["penalty"]),
                    }
                    for c in overdue_companies
                ],
            })

        return result

    # ==================================================================
    # Stats
    # ==================================================================

    @staticmethod
    async def get_dashboard_stats(
        conn, fiscal_year: Optional[int] = None
    ) -> Dict:
        """Aggregate stats for admin dashboard."""
        year_filter = ""
        params = []
        if fiscal_year:
            year_filter = "WHERE cl.fiscal_year = $1"
            params = [fiscal_year]

        row = await conn.fetchrow(f"""
            SELECT
                COUNT(*) as total_licenses,
                COUNT(*) FILTER (WHERE cl.status = 'open') as open_licenses,
                COUNT(*) FILTER (WHERE cl.status = 'partial') as partial_licenses,
                COUNT(*) FILTER (WHERE cl.status = 'complete') as complete_licenses,
                COUNT(*) FILTER (WHERE cl.status = 'overdue') as overdue_licenses,
                COALESCE(SUM(cl.total_amount), 0) as total_amount,
                COALESCE(SUM(cl.amount_paid), 0) as amount_paid,
                COALESCE(SUM(cl.penalty_amount), 0) as penalty_amount,
                COALESCE(AVG(cl.compliance_score), 0) as avg_compliance_score
            FROM commercial_licenses cl
            {year_filter}
        """, *params)
        return dict(row)
