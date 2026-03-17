"""
CompanyOnboardingService — Draft → Company lifecycle management.

Admin validates drafts → creates real company + commercial_license + obligations.
Supports: approve, reject, request-info, get-drafts, stats.
"""

import json
from datetime import date, datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

import asyncpg
from loguru import logger


class CompanyOnboardingService:
    """Manages company creation draft approval workflow."""

    async def get_drafts(
        self,
        conn: asyncpg.Connection,
        status: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
        batch_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """List drafts for admin review, ordered by confidence ASC (lowest first).

        Returns paginated response with items, total, page, page_size.
        """
        conditions = []
        params: list = []
        idx = 1

        if status:
            conditions.append(f"status = ${idx}")
            params.append(status)
            idx += 1

        if batch_id:
            conditions.append(f"batch_id = ${idx}")
            params.append(batch_id)
            idx += 1

        where = f"WHERE {' AND '.join(conditions)}" if conditions else ""

        # Count total
        total = await conn.fetchval(
            f"SELECT COUNT(*) FROM company_creation_drafts {where}",
            *params,
        )

        # Fetch page (lowest confidence first for review prioritization)
        offset = (page - 1) * page_size
        limit_idx = idx
        offset_idx = idx + 1
        rows = await conn.fetch(
            f"""SELECT id, source_type, company_data, regimen_fiscal,
                       classification_confidence, classification_reason,
                       classification_details, extraction_confidence,
                       status, reviewer_notes, reviewed_at,
                       created_company_id, created_by, created_at, updated_at
                FROM company_creation_drafts {where}
                ORDER BY
                    CASE WHEN status = 'pending_review' THEN 0
                         WHEN status = 'needs_info' THEN 1
                         WHEN status = 'auto_approved' THEN 2
                         WHEN status = 'error' THEN 3
                         ELSE 4 END,
                    classification_confidence ASC,
                    created_at DESC
                LIMIT ${limit_idx} OFFSET ${offset_idx}""",
            *params, page_size, offset,
        )

        items = []
        for r in rows:
            item = dict(r)
            # Parse JSONB fields
            if isinstance(item.get("company_data"), str):
                item["company_data"] = json.loads(item["company_data"])
            if isinstance(item.get("classification_details"), str):
                item["classification_details"] = json.loads(item["classification_details"])
            # Ensure UUID serializable
            for uid_field in ("id", "created_company_id", "created_by"):
                if item.get(uid_field):
                    item[uid_field] = str(item[uid_field])
            items.append(item)

        return {
            "items": items,
            "total": total or 0,
            "page": page,
            "page_size": page_size,
        }

    async def get_draft(
        self,
        conn: asyncpg.Connection,
        draft_id: str,
    ) -> Optional[Dict[str, Any]]:
        """Get a single draft by ID."""
        row = await conn.fetchrow(
            """SELECT * FROM company_creation_drafts WHERE id = $1""",
            draft_id,
        )
        if not row:
            return None

        item = dict(row)
        if isinstance(item.get("company_data"), str):
            item["company_data"] = json.loads(item["company_data"])
        if isinstance(item.get("classification_details"), str):
            item["classification_details"] = json.loads(item["classification_details"])
        if isinstance(item.get("extraction_details"), str):
            item["extraction_details"] = json.loads(item["extraction_details"])
        for uid_field in ("id", "created_company_id", "created_by", "reviewer_id",
                          "source_file_id"):
            if item.get(uid_field):
                item[uid_field] = str(item[uid_field])
        return item

    async def approve_draft(
        self,
        conn: asyncpg.Connection,
        draft_id: str,
        reviewer_id: str,
        notes: str = "",
    ) -> Dict[str, Any]:
        """Admin approves draft → create company + optional license.

        Transaction: draft update + company insert + license (if bundle regime).
        """
        draft = await self.get_draft(conn, draft_id)
        if not draft:
            return {"error": "Draft not found"}

        if draft["status"] not in ("pending_review", "auto_approved", "needs_info"):
            return {"error": f"Cannot approve draft with status '{draft['status']}'"}

        company_data = draft.get("company_data") or {}
        regimen = draft.get("regimen_fiscal") or "pendiente"

        # Safe type coercion for DB columns
        capital_raw = company_data.get("capital_social")
        capital_val = float(capital_raw) if capital_raw is not None else None

        employee_raw = company_data.get("employee_count")
        employee_val = int(employee_raw) if employee_raw is not None else None

        reg_date_raw = company_data.get("registration_date")
        reg_date_val = None
        if reg_date_raw:
            try:
                reg_date_val = date.fromisoformat(str(reg_date_raw)[:10])
            except (ValueError, TypeError):
                reg_date_val = None

        async with conn.transaction():
            # 1. Create company
            company_id = await conn.fetchval(
                """INSERT INTO companies
                   (legal_name, tax_id, nif, trade_name, forma_juridica, nacionalidad,
                    capital_social, registration_number, registration_date,
                    sector_actividad, subsector_actividad, objeto_social,
                    commerce_type, regimen_fiscal, employee_count,
                    address, phone, email, is_active, is_verified)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
                           $13, $14, $15, $16, $17, $18, true, true)
                   RETURNING id""",
                company_data.get("legal_name", "Unknown"),
                company_data.get("nif") or company_data.get("tax_id") or company_data.get("registration_number", "PENDING"),
                company_data.get("nif"),
                company_data.get("trade_name"),
                company_data.get("forma_juridica"),
                company_data.get("nacionalidad"),
                capital_val,
                company_data.get("registration_number"),
                reg_date_val,
                company_data.get("sector_actividad"),
                company_data.get("subsector_actividad"),
                company_data.get("objeto_social"),
                company_data.get("commerce_type"),
                regimen,
                employee_val,
                company_data.get("domicilio_fiscal") or company_data.get("address"),
                company_data.get("phone"),
                company_data.get("email"),
            )

            # 2. If bundle/mixto regime with commerce_type → create commercial license
            created_license_id = None
            commerce_type = company_data.get("commerce_type")
            if regimen in ("bundle", "mixto") and commerce_type:
                # Find matching active bundle
                bundle = await conn.fetchrow(
                    """SELECT id FROM service_bundles
                       WHERE commerce_type = $1 AND is_active = true
                       LIMIT 1""",
                    commerce_type,
                )
                if bundle:
                    from datetime import datetime
                    fiscal_year = datetime.utcnow().year
                    zone_id = company_data.get("zone_id")

                    created_license_id = await conn.fetchval(
                        """INSERT INTO commercial_licenses
                           (company_id, bundle_id, zone_id, fiscal_year,
                            total_amount, status, created_by)
                           VALUES ($1, $2, $3, $4, 0, 'open', $5)
                           RETURNING id""",
                        str(company_id), bundle["id"],
                        zone_id,
                        fiscal_year,
                        reviewer_id,
                    )

            # 3. Update draft
            await conn.execute(
                """UPDATE company_creation_drafts
                   SET status = 'approved', reviewer_id = $2,
                       reviewer_notes = $3, reviewed_at = NOW(),
                       created_company_id = $4, created_license_id = $5
                   WHERE id = $1""",
                draft_id, reviewer_id, notes,
                str(company_id),
                str(created_license_id) if created_license_id else None,
            )

            # 4. Classification history
            await conn.execute(
                """INSERT INTO company_classification_history
                   (company_id, old_regimen, new_regimen, reason, confidence,
                    details, triggered_by, created_by)
                   VALUES ($1, NULL, $2, $3, $4, $5, 'initial', $6)""",
                str(company_id),
                regimen,
                f"Draft approved: {draft.get('classification_reason', 'N/A')}",
                draft.get("classification_confidence", 0),
                json.dumps(draft.get("classification_details", {})),
                reviewer_id,
            )

        logger.info(
            f"Draft {draft_id} approved → company {company_id} "
            f"(regime={regimen}, license={created_license_id})"
        )

        return {
            "status": "approved",
            "company_id": str(company_id),
            "license_id": str(created_license_id) if created_license_id else None,
        }

    async def reject_draft(
        self,
        conn: asyncpg.Connection,
        draft_id: str,
        reviewer_id: str,
        notes: str = "",
    ) -> Dict[str, Any]:
        """Admin rejects draft."""
        row = await conn.fetchrow(
            """UPDATE company_creation_drafts
               SET status = 'rejected', reviewer_id = $2,
                   reviewer_notes = $3, reviewed_at = NOW()
               WHERE id = $1 AND status IN ('pending_review', 'auto_approved', 'needs_info')
               RETURNING id""",
            draft_id, reviewer_id, notes,
        )

        if not row:
            return {"error": "Draft not found or cannot be rejected"}

        logger.info(f"Draft {draft_id} rejected by {reviewer_id}")
        return {"status": "rejected"}

    async def request_info(
        self,
        conn: asyncpg.Connection,
        draft_id: str,
        reviewer_id: str,
        notes: str = "",
    ) -> Dict[str, Any]:
        """Admin requests more info on a draft."""
        row = await conn.fetchrow(
            """UPDATE company_creation_drafts
               SET status = 'needs_info', reviewer_id = $2,
                   reviewer_notes = $3, reviewed_at = NOW()
               WHERE id = $1 AND status IN ('pending_review', 'auto_approved')
               RETURNING id""",
            draft_id, reviewer_id, notes,
        )

        if not row:
            return {"error": "Draft not found or cannot request info"}

        logger.info(f"Draft {draft_id} needs_info by {reviewer_id}")
        return {"status": "needs_info"}

    async def get_stats(
        self,
        conn: asyncpg.Connection,
    ) -> Dict[str, Any]:
        """Classification statistics for admin dashboard."""
        # Company stats by regime
        regimen_stats = await conn.fetch(
            """SELECT COALESCE(regimen_fiscal, 'pendiente') AS regimen, COUNT(*) AS cnt
               FROM companies GROUP BY regimen_fiscal"""
        )
        by_regimen = {r["regimen"]: r["cnt"] for r in regimen_stats}

        # Draft stats
        draft_stats = await conn.fetch(
            """SELECT status, COUNT(*) AS cnt
               FROM company_creation_drafts GROUP BY status"""
        )
        drafts_by_status = {r["status"]: r["cnt"] for r in draft_stats}

        total_drafts = sum(drafts_by_status.values())
        approved = drafts_by_status.get("approved", 0) + drafts_by_status.get("auto_approved", 0)

        # Average confidence
        avg_conf = await conn.fetchval(
            "SELECT AVG(classification_confidence) FROM company_creation_drafts"
        )

        return {
            "total_companies": sum(by_regimen.values()),
            "by_regimen": by_regimen,
            "total_drafts": total_drafts,
            "drafts_pending": drafts_by_status.get("pending_review", 0),
            "drafts_approved": drafts_by_status.get("approved", 0),
            "drafts_auto_approved": drafts_by_status.get("auto_approved", 0),
            "drafts_rejected": drafts_by_status.get("rejected", 0),
            "drafts_needs_info": drafts_by_status.get("needs_info", 0),
            "auto_approval_rate": (
                round(drafts_by_status.get("auto_approved", 0) / total_drafts, 4)
                if total_drafts > 0 else 0.0
            ),
            "avg_confidence": round(float(avg_conf or 0), 4),
        }


# ── Module-level singleton ────────────────────────────────────────────────────

company_onboarding_service = CompanyOnboardingService()
