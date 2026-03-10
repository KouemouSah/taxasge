"""Bundle Repository — Data access layer for commerce zones and service bundles."""

import logging
from decimal import Decimal
from typing import Dict, List, Optional, Tuple
from uuid import UUID

logger = logging.getLogger(__name__)


class BundleRepository:
    """Repository for commerce_zones, service_bundles, and service_bundle_items."""

    # ------------------------------------------------------------------
    # Commerce Zones
    # ------------------------------------------------------------------

    @staticmethod
    async def list_zones(conn) -> List[Dict]:
        """List all commerce zones sorted by display_order."""
        rows = await conn.fetch("""
            SELECT id, zone_code, zone_tier, zone_rank,
                   name_es, description_es, display_order,
                   created_at, updated_at
            FROM commerce_zones
            ORDER BY display_order
        """)
        return [dict(r) for r in rows]

    # ------------------------------------------------------------------
    # Service Bundles — Read
    # ------------------------------------------------------------------

    @staticmethod
    async def list_bundles(
        conn,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
        commerce_type: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Dict], int]:
        """List bundles with pagination, filters, and item/zone counts."""
        conditions = []
        params = []
        idx = 1

        if is_active is not None:
            conditions.append(f"sb.is_active = ${idx}")
            params.append(is_active)
            idx += 1

        if search:
            conditions.append(f"(sb.name_es ILIKE ${idx} OR sb.bundle_code ILIKE ${idx})")
            params.append(f"%{search}%")
            idx += 1

        if commerce_type:
            conditions.append(f"sb.commerce_type = ${idx}")
            params.append(commerce_type)
            idx += 1

        where = "WHERE " + " AND ".join(conditions) if conditions else ""

        # Count
        count_row = await conn.fetchrow(
            f"SELECT COUNT(*) as total FROM service_bundles sb {where}",
            *params,
        )
        total = count_row["total"]

        # Data with item/zone counts
        offset = (page - 1) * page_size
        params_data = params + [page_size, offset]
        rows = await conn.fetch(f"""
            SELECT sb.*,
                   COALESCE(stats.item_count, 0) as item_count,
                   COALESCE(stats.zone_count, 0) as zone_count
            FROM service_bundles sb
            LEFT JOIN LATERAL (
                SELECT COUNT(*) as item_count,
                       COUNT(DISTINCT zone_id) as zone_count
                FROM service_bundle_items
                WHERE bundle_id = sb.id AND is_active = true
            ) stats ON true
            {where}
            ORDER BY sb.bundle_code
            LIMIT ${idx} OFFSET ${idx + 1}
        """, *params_data)

        return [dict(r) for r in rows], total

    @staticmethod
    async def get_bundle(conn, bundle_id: UUID) -> Optional[Dict]:
        """Get a single bundle by ID with item/zone counts."""
        row = await conn.fetchrow("""
            SELECT sb.*,
                   COALESCE(stats.item_count, 0) as item_count,
                   COALESCE(stats.zone_count, 0) as zone_count
            FROM service_bundles sb
            LEFT JOIN LATERAL (
                SELECT COUNT(*) as item_count,
                       COUNT(DISTINCT zone_id) as zone_count
                FROM service_bundle_items
                WHERE bundle_id = sb.id AND is_active = true
            ) stats ON true
            WHERE sb.id = $1
        """, bundle_id)
        return dict(row) if row else None

    # ------------------------------------------------------------------
    # Bundle Items — Read
    # ------------------------------------------------------------------

    @staticmethod
    async def get_bundle_items(
        conn, bundle_id: UUID, zone_id: UUID
    ) -> List[Dict]:
        """Get items for a bundle+zone with enriched service/ministry names."""
        rows = await conn.fetch("""
            SELECT sbi.id, sbi.bundle_id, sbi.fiscal_service_id, sbi.zone_id,
                   sbi.ministry_id, sbi.amount, sbi.is_fixed_across_zones,
                   sbi.display_order, sbi.notes, sbi.is_active,
                   fs.service_code, fs.name_es as service_name,
                   m.name_es as ministry_name
            FROM service_bundle_items sbi
            JOIN fiscal_services fs ON sbi.fiscal_service_id = fs.id
            LEFT JOIN ministries m ON sbi.ministry_id = m.id
            WHERE sbi.bundle_id = $1 AND sbi.zone_id = $2 AND sbi.is_active = true
            ORDER BY sbi.display_order, fs.service_code
        """, bundle_id, zone_id)
        return [dict(r) for r in rows]

    @staticmethod
    async def calculate_total(
        conn, bundle_id: UUID, zone_id: UUID
    ) -> Decimal:
        """Calculate total amount for a bundle+zone."""
        row = await conn.fetchrow("""
            SELECT COALESCE(SUM(amount), 0) as total
            FROM service_bundle_items
            WHERE bundle_id = $1 AND zone_id = $2 AND is_active = true
        """, bundle_id, zone_id)
        return row["total"]

    @staticmethod
    async def get_pricing_matrix(conn, bundle_id: UUID) -> List[Dict]:
        """Get all items across all zones for a bundle (for matrix view)."""
        rows = await conn.fetch("""
            SELECT sbi.id, sbi.bundle_id, sbi.fiscal_service_id, sbi.zone_id,
                   sbi.ministry_id, sbi.amount, sbi.is_fixed_across_zones,
                   sbi.display_order, sbi.notes, sbi.is_active,
                   fs.service_code, fs.name_es as service_name,
                   m.name_es as ministry_name
            FROM service_bundle_items sbi
            JOIN fiscal_services fs ON sbi.fiscal_service_id = fs.id
            LEFT JOIN ministries m ON sbi.ministry_id = m.id
            JOIN commerce_zones cz ON sbi.zone_id = cz.id
            WHERE sbi.bundle_id = $1 AND sbi.is_active = true
            ORDER BY sbi.display_order, fs.service_code, cz.display_order
        """, bundle_id)
        return [dict(r) for r in rows]

    @staticmethod
    async def get_zone_totals(conn, bundle_id: UUID) -> List[Dict]:
        """Get total amount per zone for a bundle."""
        rows = await conn.fetch("""
            SELECT cz.id, cz.zone_code, cz.zone_tier, cz.zone_rank,
                   cz.name_es, cz.description_es, cz.display_order,
                   cz.created_at, cz.updated_at,
                   COALESCE(SUM(sbi.amount), 0) as total_amount,
                   COUNT(sbi.id) as item_count
            FROM commerce_zones cz
            LEFT JOIN service_bundle_items sbi
                ON sbi.zone_id = cz.id AND sbi.bundle_id = $1 AND sbi.is_active = true
            GROUP BY cz.id
            ORDER BY cz.display_order
        """, bundle_id)
        return [dict(r) for r in rows]

    # ------------------------------------------------------------------
    # Required Documents (deduced from bundle services)
    # ------------------------------------------------------------------

    @staticmethod
    async def get_required_documents(conn, bundle_id: UUID) -> List[Dict]:
        """Get distinct documents required by all services in the bundle."""
        rows = await conn.fetch("""
            SELECT DISTINCT dt.id as document_template_id,
                   dt.document_name_es, dt.template_code,
                   sda.is_required_expedition as is_required
            FROM service_bundle_items sbi
            JOIN service_document_assignments sda ON sda.fiscal_service_id = sbi.fiscal_service_id
            JOIN document_templates dt ON dt.id = sda.document_template_id
            WHERE sbi.bundle_id = $1 AND sbi.is_active = true
            ORDER BY dt.document_name_es
        """, bundle_id)
        return [dict(r) for r in rows]

    # ------------------------------------------------------------------
    # Service Bundles — Write
    # ------------------------------------------------------------------

    @staticmethod
    async def create_bundle(conn, data: Dict, user_id: Optional[UUID] = None) -> Dict:
        """Create a new service bundle."""
        row = await conn.fetchrow("""
            INSERT INTO service_bundles
                (bundle_code, commerce_type, name_es, description_es, legal_reference,
                 is_active, installment_eligible, max_installments, installment_frequency,
                 created_by, updated_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10)
            RETURNING *
        """,
            data["bundle_code"], data["commerce_type"], data["name_es"],
            data.get("description_es"), data.get("legal_reference"),
            data.get("is_active", True),
            data.get("installment_eligible", False),
            data.get("max_installments", 1),
            data.get("installment_frequency", "monthly"),
            user_id,
        )
        result = dict(row)
        result["item_count"] = 0
        result["zone_count"] = 0
        return result

    @staticmethod
    async def update_bundle(
        conn, bundle_id: UUID, data: Dict, user_id: Optional[UUID] = None
    ) -> Optional[Dict]:
        """Update bundle metadata."""
        sets = []
        params = []
        idx = 1

        for field in [
            "bundle_code", "commerce_type", "name_es", "description_es",
            "legal_reference", "is_active", "installment_eligible",
            "max_installments", "installment_frequency",
        ]:
            if field in data and data[field] is not None:
                sets.append(f"{field} = ${idx}")
                params.append(data[field])
                idx += 1

        if not sets:
            return await BundleRepository.get_bundle(conn, bundle_id)

        sets.append(f"updated_by = ${idx}")
        params.append(user_id)
        idx += 1

        sets.append("updated_at = now()")

        params.append(bundle_id)
        row = await conn.fetchrow(f"""
            UPDATE service_bundles
            SET {', '.join(sets)}
            WHERE id = ${idx}
            RETURNING *
        """, *params)

        if not row:
            return None
        result = dict(row)
        result["item_count"] = 0
        result["zone_count"] = 0
        return result

    @staticmethod
    async def delete_bundle(conn, bundle_id: UUID) -> bool:
        """Soft delete a bundle (set is_active=false)."""
        result = await conn.execute("""
            UPDATE service_bundles SET is_active = false, updated_at = now()
            WHERE id = $1
        """, bundle_id)
        return result == "UPDATE 1"

    # ------------------------------------------------------------------
    # Bundle Items — Write
    # ------------------------------------------------------------------

    @staticmethod
    async def upsert_item(conn, bundle_id: UUID, data: Dict) -> Dict:
        """Insert or update a bundle item (ON CONFLICT upsert)."""
        row = await conn.fetchrow("""
            INSERT INTO service_bundle_items
                (bundle_id, fiscal_service_id, zone_id, ministry_id,
                 amount, is_fixed_across_zones, display_order, notes, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (bundle_id, fiscal_service_id, zone_id)
            DO UPDATE SET
                amount = EXCLUDED.amount,
                ministry_id = EXCLUDED.ministry_id,
                is_fixed_across_zones = EXCLUDED.is_fixed_across_zones,
                display_order = EXCLUDED.display_order,
                notes = EXCLUDED.notes,
                is_active = EXCLUDED.is_active,
                updated_at = now()
            RETURNING *
        """,
            bundle_id,
            data["fiscal_service_id"],
            data["zone_id"],
            data.get("ministry_id"),
            data["amount"],
            data.get("is_fixed_across_zones", False),
            data.get("display_order", 0),
            data.get("notes"),
            data.get("is_active", True),
        )
        return dict(row)

    @staticmethod
    async def delete_item(conn, item_id: UUID) -> bool:
        """Delete a bundle item."""
        result = await conn.execute(
            "DELETE FROM service_bundle_items WHERE id = $1", item_id
        )
        return result == "DELETE 1"

    @staticmethod
    async def copy_zone_prices(
        conn,
        bundle_id: UUID,
        source_zone_id: UUID,
        target_zone_id: UUID,
        multiplier: Decimal = Decimal("1.0"),
    ) -> int:
        """Copy all item prices from one zone to another with optional multiplier."""
        result = await conn.execute("""
            INSERT INTO service_bundle_items
                (bundle_id, fiscal_service_id, zone_id, ministry_id,
                 amount, is_fixed_across_zones, display_order, notes, is_active)
            SELECT bundle_id, fiscal_service_id, $3, ministry_id,
                   ROUND(amount * $4, 2), is_fixed_across_zones, display_order, notes, is_active
            FROM service_bundle_items
            WHERE bundle_id = $1 AND zone_id = $2 AND is_active = true
            ON CONFLICT (bundle_id, fiscal_service_id, zone_id)
            DO UPDATE SET
                amount = EXCLUDED.amount,
                ministry_id = EXCLUDED.ministry_id,
                updated_at = now()
        """, bundle_id, source_zone_id, target_zone_id, multiplier)
        # Parse "INSERT 0 N" or "INSERT N N"
        try:
            return int(result.split()[-1])
        except (IndexError, ValueError):
            return 0
