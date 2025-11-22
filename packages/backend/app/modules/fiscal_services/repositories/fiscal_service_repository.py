"""Fiscal Service Repository - Data access for 850 services"""

from typing import Optional, List, Dict, Any
from loguru import logger
import asyncpg

from app.modules.fiscal_services.models import (
    FiscalServiceCreate,
    FiscalServiceUpdate,
    FiscalServiceSearchRequest,
)


class FiscalServiceRepository:
    """Repository for fiscal services catalog"""

    # ========== MINISTRIES ==========
    async def list_ministries(self, conn: asyncpg.Connection) -> List[Dict[str, Any]]:
        """List all ministries"""
        query = "SELECT * FROM ministries ORDER BY code"
        results = await conn.fetch(query)
        return [dict(r) for r in results]

    # ========== SECTORS ==========
    async def list_sectors(
        self, conn: asyncpg.Connection, ministry_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """List sectors, optionally filtered by ministry"""
        if ministry_id:
            query = "SELECT * FROM sectors WHERE ministry_id = $1 ORDER BY code"
            results = await conn.fetch(query, ministry_id)
        else:
            query = "SELECT * FROM sectors ORDER BY code"
            results = await conn.fetch(query)
        return [dict(r) for r in results]

    # ========== CATEGORIES ==========
    async def list_categories(
        self, conn: asyncpg.Connection, sector_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """List categories, optionally filtered by sector"""
        if sector_id:
            query = "SELECT * FROM categories WHERE sector_id = $1 ORDER BY code"
            results = await conn.fetch(query, sector_id)
        else:
            query = "SELECT * FROM categories ORDER BY code"
            results = await conn.fetch(query)
        return [dict(r) for r in results]

    # ========== FISCAL SERVICES ==========
    async def create(
        self, conn: asyncpg.Connection, service: FiscalServiceCreate
    ) -> Dict[str, Any]:
        """Create fiscal service"""
        query = """
            INSERT INTO fiscal_services (
                category_id, code, name_fr, name_en, description_fr, description_en,
                base_amount, calculation_type, is_active, requires_documents,
                requires_procedure, estimated_duration_days, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
            RETURNING *
        """
        result = await conn.fetchrow(
            query,
            service.category_id,
            service.code,
            service.name_fr,
            service.name_en,
            service.description_fr,
            service.description_en,
            service.base_amount,
            service.calculation_type.value,
            service.is_active,
            service.requires_documents,
            service.requires_procedure,
            service.estimated_duration_days,
        )

        service_dict = dict(result)

        # Add keywords
        if service.keywords:
            for keyword in service.keywords:
                await conn.execute(
                    "INSERT INTO service_keywords (fiscal_service_id, keyword) VALUES ($1, $2)",
                    service_dict["id"],
                    keyword.lower(),
                )

        return service_dict

    async def get_by_id(
        self, conn: asyncpg.Connection, service_id: str
    ) -> Optional[Dict[str, Any]]:
        """Get fiscal service by ID with hierarchical data"""
        query = """
            SELECT
                fs.*,
                c.name_fr as category_name,
                s.name_fr as sector_name,
                m.name_fr as ministry_name
            FROM fiscal_services fs
            JOIN categories c ON fs.category_id = c.id
            JOIN sectors s ON c.sector_id = s.id
            JOIN ministries m ON s.ministry_id = m.id
            WHERE fs.id = $1
        """
        result = await conn.fetchrow(query, service_id)
        if not result:
            return None

        service_dict = dict(result)

        # Get keywords
        keywords = await conn.fetch(
            "SELECT keyword FROM service_keywords WHERE fiscal_service_id = $1",
            service_id,
        )
        service_dict["keywords"] = [k["keyword"] for k in keywords]

        # NOTE: fiscal_service_data → MODULE DECLARATIONS (user data, not catalog)

        # Get required documents
        docs = await conn.fetch(
            """SELECT d.name_fr
               FROM service_document_assignments sda
               JOIN document_templates d ON sda.document_template_id = d.id
               WHERE sda.fiscal_service_id = $1""",
            service_id,
        )
        service_dict["required_documents"] = [d["name_fr"] for d in docs]

        return service_dict

    async def get_by_code(
        self, conn: asyncpg.Connection, code: str
    ) -> Optional[Dict[str, Any]]:
        """Get fiscal service by code"""
        query = "SELECT * FROM fiscal_services WHERE code = $1"
        result = await conn.fetchrow(query, code)
        return dict(result) if result else None

    async def list(
        self,
        conn: asyncpg.Connection,
        category_id: Optional[str] = None,
        is_active: Optional[bool] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[List[Dict[str, Any]], int]:
        """List fiscal services with filters"""
        conditions = []
        params = []
        param_idx = 1

        if category_id:
            conditions.append(f"fs.category_id = ${param_idx}")
            params.append(category_id)
            param_idx += 1

        if is_active is not None:
            conditions.append(f"fs.is_active = ${param_idx}")
            params.append(is_active)
            param_idx += 1

        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

        # Count
        count_query = f"SELECT COUNT(*) FROM fiscal_services fs {where_clause}"
        total = await conn.fetchval(count_query, *params)

        # Data
        data_query = f"""
            SELECT
                fs.*,
                c.name_fr as category_name,
                s.name_fr as sector_name,
                m.name_fr as ministry_name
            FROM fiscal_services fs
            JOIN categories c ON fs.category_id = c.id
            JOIN sectors s ON c.sector_id = s.id
            JOIN ministries m ON s.ministry_id = m.id
            {where_clause}
            ORDER BY fs.code
            LIMIT ${param_idx} OFFSET ${param_idx + 1}
        """
        params.extend([limit, offset])
        results = await conn.fetch(data_query, *params)

        services = []
        for r in results:
            service = dict(r)
            # Get keywords
            keywords = await conn.fetch(
                "SELECT keyword FROM service_keywords WHERE fiscal_service_id = $1",
                service["id"],
            )
            service["keywords"] = [k["keyword"] for k in keywords]
            service["required_documents"] = []
            services.append(service)

        return services, total

    async def search(
        self, conn: asyncpg.Connection, search: FiscalServiceSearchRequest, limit: int = 50, offset: int = 0
    ) -> tuple[List[Dict[str, Any]], int]:
        """Advanced search for fiscal services"""
        conditions = []
        params = []
        param_idx = 1

        # Text search
        if search.query:
            conditions.append(
                f"(fs.name_fr ILIKE ${param_idx} OR fs.description_fr ILIKE ${param_idx} OR EXISTS (SELECT 1 FROM service_keywords sk WHERE sk.fiscal_service_id = fs.id AND sk.keyword ILIKE ${param_idx}))"
            )
            params.append(f"%{search.query}%")
            param_idx += 1

        if search.ministry_id:
            conditions.append(f"m.id = ${param_idx}")
            params.append(search.ministry_id)
            param_idx += 1

        if search.sector_id:
            conditions.append(f"s.id = ${param_idx}")
            params.append(search.sector_id)
            param_idx += 1

        if search.category_id:
            conditions.append(f"fs.category_id = ${param_idx}")
            params.append(search.category_id)
            param_idx += 1

        if search.calculation_type:
            conditions.append(f"fs.calculation_type = ${param_idx}")
            params.append(search.calculation_type.value)
            param_idx += 1

        if search.is_active is not None:
            conditions.append(f"fs.is_active = ${param_idx}")
            params.append(search.is_active)
            param_idx += 1

        if search.requires_documents is not None:
            conditions.append(f"fs.requires_documents = ${param_idx}")
            params.append(search.requires_documents)
            param_idx += 1

        if search.requires_procedure is not None:
            conditions.append(f"fs.requires_procedure = ${param_idx}")
            params.append(search.requires_procedure)
            param_idx += 1

        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

        # Count
        count_query = f"""
            SELECT COUNT(DISTINCT fs.id)
            FROM fiscal_services fs
            JOIN categories c ON fs.category_id = c.id
            JOIN sectors s ON c.sector_id = s.id
            JOIN ministries m ON s.ministry_id = m.id
            {where_clause}
        """
        total = await conn.fetchval(count_query, *params)

        # Data
        data_query = f"""
            SELECT DISTINCT
                fs.*,
                c.name_fr as category_name,
                s.name_fr as sector_name,
                m.name_fr as ministry_name
            FROM fiscal_services fs
            JOIN categories c ON fs.category_id = c.id
            JOIN sectors s ON c.sector_id = s.id
            JOIN ministries m ON s.ministry_id = m.id
            {where_clause}
            ORDER BY fs.usage_count DESC, fs.code
            LIMIT ${param_idx} OFFSET ${param_idx + 1}
        """
        params.extend([limit, offset])
        results = await conn.fetch(data_query, *params)

        services = []
        for r in results:
            service = dict(r)
            keywords = await conn.fetch(
                "SELECT keyword FROM service_keywords WHERE fiscal_service_id = $1",
                service["id"],
            )
            service["keywords"] = [k["keyword"] for k in keywords]
            service["required_documents"] = []
            services.append(service)

        return services, total

    async def get_popular(
        self, conn: asyncpg.Connection, limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get most used services"""
        query = """
            SELECT
                fs.*,
                c.name_fr as category_name,
                s.name_fr as sector_name,
                m.name_fr as ministry_name
            FROM fiscal_services fs
            JOIN categories c ON fs.category_id = c.id
            JOIN sectors s ON c.sector_id = s.id
            JOIN ministries m ON s.ministry_id = m.id
            WHERE fs.is_active = true
            ORDER BY fs.usage_count DESC, fs.last_used_at DESC NULLS LAST
            LIMIT $1
        """
        results = await conn.fetch(query, limit)

        services = []
        for r in results:
            service = dict(r)
            keywords = await conn.fetch(
                "SELECT keyword FROM service_keywords WHERE fiscal_service_id = $1",
                service["id"],
            )
            service["keywords"] = [k["keyword"] for k in keywords]
            service["required_documents"] = []
            services.append(service)

        return services

    async def get_recent(
        self, conn: asyncpg.Connection, limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get recently used services"""
        query = """
            SELECT
                fs.*,
                c.name_fr as category_name,
                s.name_fr as sector_name,
                m.name_fr as ministry_name
            FROM fiscal_services fs
            JOIN categories c ON fs.category_id = c.id
            JOIN sectors s ON c.sector_id = s.id
            JOIN ministries m ON s.ministry_id = m.id
            WHERE fs.is_active = true AND fs.last_used_at IS NOT NULL
            ORDER BY fs.last_used_at DESC
            LIMIT $1
        """
        results = await conn.fetch(query, limit)

        services = []
        for r in results:
            service = dict(r)
            keywords = await conn.fetch(
                "SELECT keyword FROM service_keywords WHERE fiscal_service_id = $1",
                service["id"],
            )
            service["keywords"] = [k["keyword"] for k in keywords]
            service["required_documents"] = []
            services.append(service)

        return services

    async def update(
        self, conn: asyncpg.Connection, service_id: str, update_data: FiscalServiceUpdate
    ) -> Optional[Dict[str, Any]]:
        """Update fiscal service"""
        updates = []
        params = [service_id]
        param_idx = 2

        for field, value in update_data.dict(exclude_unset=True, exclude={"keywords"}).items():
            if value is not None:
                if field == "calculation_type":
                    updates.append(f"{field} = ${param_idx}")
                    params.append(value.value)
                else:
                    updates.append(f"{field} = ${param_idx}")
                    params.append(value)
                param_idx += 1

        if not updates:
            return await self.get_by_id(conn, service_id)

        updates.append(f"updated_at = NOW()")

        query = f"UPDATE fiscal_services SET {', '.join(updates)} WHERE id = $1 RETURNING *"
        result = await conn.fetchrow(query, *params)

        if not result:
            return None

        # Update keywords if provided
        if update_data.keywords is not None:
            await conn.execute(
                "DELETE FROM service_keywords WHERE fiscal_service_id = $1", service_id
            )
            for keyword in update_data.keywords:
                await conn.execute(
                    "INSERT INTO service_keywords (fiscal_service_id, keyword) VALUES ($1, $2)",
                    service_id,
                    keyword.lower(),
                )

        return await self.get_by_id(conn, service_id)

    async def delete(self, conn: asyncpg.Connection, service_id: str) -> bool:
        """Delete fiscal service"""
        # Delete keywords
        await conn.execute(
            "DELETE FROM service_keywords WHERE fiscal_service_id = $1", service_id
        )
        # NOTE: fiscal_service_data → MODULE DECLARATIONS (not deleted here)
        # Delete document assignments
        await conn.execute(
            "DELETE FROM service_document_assignments WHERE fiscal_service_id = $1",
            service_id,
        )
        # Delete procedure assignments
        await conn.execute(
            "DELETE FROM service_procedure_assignments WHERE fiscal_service_id = $1",
            service_id,
        )
        # Delete service
        result = await conn.execute(
            "DELETE FROM fiscal_services WHERE id = $1", service_id
        )
        return result == "DELETE 1"

    async def increment_usage(
        self, conn: asyncpg.Connection, service_id: str
    ) -> None:
        """Increment usage counter"""
        await conn.execute(
            """UPDATE fiscal_services
               SET calculation_count = calculation_count + 1, updated_at = NOW()
               WHERE id = $1""",
            service_id,
        )

    async def get_statistics(self, conn: asyncpg.Connection) -> Dict[str, Any]:
        """
        Get comprehensive fiscal services statistics

        Migrated from legacy /api/v1/taxes/stats/overview
        Aligned with DATABASE_SCHEMA_REFERENCE.md
        """
        # Total counts by status
        status_counts = await conn.fetch("""
            SELECT status, COUNT(*) as count
            FROM fiscal_services
            GROUP BY status
        """)

        total_services = sum(row["count"] for row in status_counts)
        active_services = next((row["count"] for row in status_counts if row["status"] == "active"), 0)
        inactive_services = total_services - active_services

        # Services by type
        type_counts = await conn.fetch("""
            SELECT service_type, COUNT(*) as count
            FROM fiscal_services
            GROUP BY service_type
            ORDER BY count DESC
        """)

        # Services by category
        category_counts = await conn.fetch("""
            SELECT c.name_es, COUNT(fs.id) as count
            FROM fiscal_services fs
            JOIN categories c ON fs.category_id = c.id
            GROUP BY c.id, c.name_es
            ORDER BY count DESC
        """)

        # Services by ministry
        ministry_counts = await conn.fetch("""
            SELECT m.name_es, COUNT(fs.id) as count
            FROM fiscal_services fs
            JOIN categories c ON fs.category_id = c.id
            JOIN sectors s ON c.sector_id = s.id
            JOIN ministries m ON s.ministry_id = m.id
            GROUP BY m.id, m.name_es
            ORDER BY count DESC
        """)

        # Average processing time
        avg_processing = await conn.fetchval("""
            SELECT COALESCE(AVG(processing_time_days), 1.0)
            FROM fiscal_services
            WHERE processing_time_days IS NOT NULL
        """)

        # Most used services (top 10)
        most_used = await conn.fetch("""
            SELECT id, service_code, name_es, calculation_count, view_count
            FROM fiscal_services
            WHERE status = 'active'
            ORDER BY calculation_count DESC, view_count DESC
            LIMIT 10
        """)

        # Total stats
        totals = await conn.fetchrow("""
            SELECT
                COALESCE(SUM(calculation_count), 0) as total_calculations,
                COALESCE(SUM(view_count), 0) as total_views
            FROM fiscal_services
        """)

        return {
            "total_services": total_services,
            "active_services": active_services,
            "inactive_services": inactive_services,
            "services_by_type": {row["service_type"]: row["count"] for row in type_counts},
            "services_by_category": {row["name_es"]: row["count"] for row in category_counts},
            "services_by_ministry": {row["name_es"]: row["count"] for row in ministry_counts},
            "services_by_status": {row["status"]: row["count"] for row in status_counts},
            "average_processing_time": float(avg_processing),
            "most_used_services": [dict(row) for row in most_used],
            "total_calculations": totals["total_calculations"],
            "total_views": totals["total_views"],
        }

    async def bulk_create(
        self, conn: asyncpg.Connection, services: List[Any], created_by: str
    ) -> Dict[str, Any]:
        """
        Bulk create fiscal services

        Migrated from legacy /api/v1/taxes/bulk/import
        Aligned with DATABASE_SCHEMA_REFERENCE.md

        Args:
            conn: Database connection
            services: List of FiscalServiceCreate models
            created_by: User ID creating the services

        Returns:
            Dict with successful and failed counts
        """
        successful = 0
        failed = 0
        errors = []

        for service in services:
            try:
                # Check if code already exists
                existing = await self.get_by_code(conn, service.code)
                if existing:
                    failed += 1
                    errors.append({
                        "code": service.code,
                        "error": "Service code already exists"
                    })
                    continue

                # Create service
                await self.create(conn, service)
                successful += 1

            except Exception as e:
                failed += 1
                errors.append({
                    "code": service.code if hasattr(service, 'code') else "unknown",
                    "error": str(e)
                })

        return {
            "successful": successful,
            "failed": failed,
            "errors": errors
        }

    async def bulk_update_status(
        self,
        conn: asyncpg.Connection,
        service_ids: List[str],
        new_status: Any,
        updated_by: str
    ) -> Dict[str, int]:
        """
        Bulk update service status

        Migrated from legacy /api/v1/taxes/bulk/update-status
        Aligned with DATABASE_SCHEMA_REFERENCE.md

        Args:
            conn: Database connection
            service_ids: List of service IDs to update
            new_status: New ServiceStatusEnum value
            updated_by: User ID performing the update

        Returns:
            Dict with updated and failed counts
        """
        updated = 0
        failed = 0

        for service_id in service_ids:
            try:
                result = await conn.execute("""
                    UPDATE fiscal_services
                    SET status = $1, updated_at = NOW(), updated_by = $2
                    WHERE id = $3
                """, new_status.value, updated_by, service_id)

                if result == "UPDATE 1":
                    updated += 1
                else:
                    failed += 1

            except Exception:
                failed += 1

        return {
            "updated": updated,
            "failed": failed
        }
