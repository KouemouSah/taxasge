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
    async def list_ministries(
        self, conn: asyncpg.Connection, language: str = "es"
    ) -> List[Dict[str, Any]]:
        """List all ministries with i18n support"""
        query = """
            SELECT
                m.id, m.ministry_code,
                COALESCE(et_name.translation_text, m.name_es) as name_es,
                COALESCE(et_desc.translation_text, m.description_es) as description_es,
                m.display_order, m.icon, m.color,
                m.website_url, m.contact_email, m.contact_phone,
                m.is_active, m.created_at, m.updated_at
            FROM ministries m
            LEFT JOIN entity_translations et_name ON
                et_name.entity_type = 'ministry'
                AND et_name.entity_code = m.ministry_code
                AND et_name.field_name = 'name'
                AND et_name.language_code = $1
            LEFT JOIN entity_translations et_desc ON
                et_desc.entity_type = 'ministry'
                AND et_desc.entity_code = m.ministry_code
                AND et_desc.field_name = 'description'
                AND et_desc.language_code = $1
            ORDER BY m.display_order, m.ministry_code
        """
        results = await conn.fetch(query, language)
        return [dict(r) for r in results]

    async def get_ministry_by_id(self, conn: asyncpg.Connection, ministry_id: int) -> Optional[Dict[str, Any]]:
        """Get ministry by ID"""
        query = "SELECT * FROM ministries WHERE id = $1"
        result = await conn.fetchrow(query, ministry_id)
        return dict(result) if result else None

    async def get_ministry_by_code(self, conn: asyncpg.Connection, ministry_code: str) -> Optional[Dict[str, Any]]:
        """Get ministry by code"""
        query = "SELECT * FROM ministries WHERE ministry_code = $1"
        result = await conn.fetchrow(query, ministry_code)
        return dict(result) if result else None

    async def create_ministry(self, conn: asyncpg.Connection, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new ministry"""
        query = """
            INSERT INTO ministries (
                ministry_code, name_es, description_es, display_order,
                icon, color, website_url, contact_email, contact_phone, is_active
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        """
        result = await conn.fetchrow(
            query,
            data.get("ministry_code"),
            data.get("name_es"),
            data.get("description_es"),
            data.get("display_order", 0),
            data.get("icon"),
            data.get("color"),
            data.get("website_url"),
            data.get("contact_email"),
            data.get("contact_phone"),
            data.get("is_active", True),
        )
        return dict(result)

    async def update_ministry(
        self, conn: asyncpg.Connection, ministry_id: int, data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Update ministry"""
        updates = []
        params = [ministry_id]
        param_idx = 2

        for field, value in data.items():
            if value is not None:
                updates.append(f"{field} = ${param_idx}")
                params.append(value)
                param_idx += 1

        if not updates:
            return await self.get_ministry_by_id(conn, ministry_id)

        updates.append("updated_at = NOW()")
        query = f"UPDATE ministries SET {', '.join(updates)} WHERE id = $1 RETURNING *"
        result = await conn.fetchrow(query, *params)
        return dict(result) if result else None

    async def delete_ministry(self, conn: asyncpg.Connection, ministry_id: int) -> bool:
        """Delete ministry (fails if has sectors)"""
        # Check for dependent sectors
        check_query = "SELECT COUNT(*) FROM sectors WHERE ministry_id = $1"
        count = await conn.fetchval(check_query, ministry_id)

        if count > 0:
            raise ValueError(f"Cannot delete ministry: {count} sectors depend on it")

        result = await conn.execute("DELETE FROM ministries WHERE id = $1", ministry_id)
        return result == "DELETE 1"

    # ========== SECTORS ==========
    async def list_sectors(
        self, conn: asyncpg.Connection, ministry_id: Optional[int] = None, language: str = "es"
    ) -> List[Dict[str, Any]]:
        """List sectors with i18n support, optionally filtered by ministry"""
        base_query = """
            SELECT
                s.id, s.sector_code, s.ministry_id,
                COALESCE(et_name.translation_text, s.name_es) as name_es,
                COALESCE(et_desc.translation_text, s.description_es) as description_es,
                s.display_order, s.icon, s.color,
                s.is_active, s.created_at, s.updated_at
            FROM sectors s
            LEFT JOIN entity_translations et_name ON
                et_name.entity_type = 'sector'
                AND et_name.entity_code = s.sector_code
                AND et_name.field_name = 'name'
                AND et_name.language_code = $1
            LEFT JOIN entity_translations et_desc ON
                et_desc.entity_type = 'sector'
                AND et_desc.entity_code = s.sector_code
                AND et_desc.field_name = 'description'
                AND et_desc.language_code = $1
        """
        if ministry_id:
            query = base_query + " WHERE s.ministry_id = $2 ORDER BY s.display_order, s.sector_code"
            results = await conn.fetch(query, language, ministry_id)
        else:
            query = base_query + " ORDER BY s.display_order, s.sector_code"
            results = await conn.fetch(query, language)
        return [dict(r) for r in results]

    async def get_sector_by_id(self, conn: asyncpg.Connection, sector_id: int) -> Optional[Dict[str, Any]]:
        """Get sector by ID"""
        query = "SELECT * FROM sectors WHERE id = $1"
        result = await conn.fetchrow(query, sector_id)
        return dict(result) if result else None

    async def get_sector_by_code(self, conn: asyncpg.Connection, sector_code: str) -> Optional[Dict[str, Any]]:
        """Get sector by code"""
        query = "SELECT * FROM sectors WHERE sector_code = $1"
        result = await conn.fetchrow(query, sector_code)
        return dict(result) if result else None

    async def create_sector(self, conn: asyncpg.Connection, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new sector"""
        # Verify ministry exists
        ministry = await self.get_ministry_by_id(conn, data.get("ministry_id"))
        if not ministry:
            raise ValueError(f"Ministry with ID {data.get('ministry_id')} not found")

        query = """
            INSERT INTO sectors (
                sector_code, ministry_id, name_es, description_es,
                display_order, icon, color, is_active
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        """
        result = await conn.fetchrow(
            query,
            data.get("sector_code"),
            data.get("ministry_id"),
            data.get("name_es"),
            data.get("description_es"),
            data.get("display_order", 0),
            data.get("icon"),
            data.get("color"),
            data.get("is_active", True),
        )
        return dict(result)

    async def update_sector(
        self, conn: asyncpg.Connection, sector_id: int, data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Update sector"""
        # If ministry_id is being updated, verify it exists
        if "ministry_id" in data and data["ministry_id"] is not None:
            ministry = await self.get_ministry_by_id(conn, data["ministry_id"])
            if not ministry:
                raise ValueError(f"Ministry with ID {data['ministry_id']} not found")

        updates = []
        params = [sector_id]
        param_idx = 2

        for field, value in data.items():
            if value is not None:
                updates.append(f"{field} = ${param_idx}")
                params.append(value)
                param_idx += 1

        if not updates:
            return await self.get_sector_by_id(conn, sector_id)

        updates.append("updated_at = NOW()")
        query = f"UPDATE sectors SET {', '.join(updates)} WHERE id = $1 RETURNING *"
        result = await conn.fetchrow(query, *params)
        return dict(result) if result else None

    async def delete_sector(self, conn: asyncpg.Connection, sector_id: int) -> bool:
        """Delete sector (fails if has categories)"""
        # Check for dependent categories
        check_query = "SELECT COUNT(*) FROM categories WHERE sector_id = $1"
        count = await conn.fetchval(check_query, sector_id)

        if count > 0:
            raise ValueError(f"Cannot delete sector: {count} categories depend on it")

        result = await conn.execute("DELETE FROM sectors WHERE id = $1", sector_id)
        return result == "DELETE 1"

    # ========== CATEGORIES ==========
    async def list_categories(
        self, conn: asyncpg.Connection, sector_id: Optional[int] = None, language: str = "es"
    ) -> List[Dict[str, Any]]:
        """List categories with i18n support, optionally filtered by sector"""
        base_query = """
            SELECT
                c.id, c.category_code, c.sector_id, c.ministry_id, c.service_type,
                COALESCE(et_name.translation_text, c.name_es) as name_es,
                COALESCE(et_desc.translation_text, c.description_es) as description_es,
                c.display_order, c.icon, c.color,
                c.is_active, c.created_at, c.updated_at
            FROM categories c
            LEFT JOIN entity_translations et_name ON
                et_name.entity_type = 'category'
                AND et_name.entity_code = c.category_code
                AND et_name.field_name = 'name'
                AND et_name.language_code = $1
            LEFT JOIN entity_translations et_desc ON
                et_desc.entity_type = 'category'
                AND et_desc.entity_code = c.category_code
                AND et_desc.field_name = 'description'
                AND et_desc.language_code = $1
        """
        if sector_id:
            query = base_query + " WHERE c.sector_id = $2 ORDER BY c.display_order, c.category_code"
            results = await conn.fetch(query, language, sector_id)
        else:
            query = base_query + " ORDER BY c.display_order, c.category_code"
            results = await conn.fetch(query, language)
        return [dict(r) for r in results]

    async def get_category_by_id(self, conn: asyncpg.Connection, category_id: int) -> Optional[Dict[str, Any]]:
        """Get category by ID"""
        query = "SELECT * FROM categories WHERE id = $1"
        result = await conn.fetchrow(query, category_id)
        return dict(result) if result else None

    async def get_category_by_code(self, conn: asyncpg.Connection, category_code: str) -> Optional[Dict[str, Any]]:
        """Get category by code"""
        query = "SELECT * FROM categories WHERE category_code = $1"
        result = await conn.fetchrow(query, category_code)
        return dict(result) if result else None

    async def create_category(self, conn: asyncpg.Connection, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new category"""
        # Verify sector exists if provided
        if data.get("sector_id"):
            sector = await self.get_sector_by_id(conn, data.get("sector_id"))
            if not sector:
                raise ValueError(f"Sector with ID {data.get('sector_id')} not found")

        # Verify ministry exists if provided
        if data.get("ministry_id"):
            ministry = await self.get_ministry_by_id(conn, data.get("ministry_id"))
            if not ministry:
                raise ValueError(f"Ministry with ID {data.get('ministry_id')} not found")

        query = """
            INSERT INTO categories (
                category_code, sector_id, ministry_id, service_type,
                name_es, description_es, display_order, icon, color, is_active
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        """
        result = await conn.fetchrow(
            query,
            data.get("category_code"),
            data.get("sector_id"),
            data.get("ministry_id"),
            data.get("service_type"),
            data.get("name_es"),
            data.get("description_es"),
            data.get("display_order", 0),
            data.get("icon"),
            data.get("color"),
            data.get("is_active", True),
        )
        return dict(result)

    async def update_category(
        self, conn: asyncpg.Connection, category_id: int, data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Update category"""
        # Verify sector exists if being updated
        if "sector_id" in data and data["sector_id"] is not None:
            sector = await self.get_sector_by_id(conn, data["sector_id"])
            if not sector:
                raise ValueError(f"Sector with ID {data['sector_id']} not found")

        # Verify ministry exists if being updated
        if "ministry_id" in data and data["ministry_id"] is not None:
            ministry = await self.get_ministry_by_id(conn, data["ministry_id"])
            if not ministry:
                raise ValueError(f"Ministry with ID {data['ministry_id']} not found")

        updates = []
        params = [category_id]
        param_idx = 2

        for field, value in data.items():
            if value is not None:
                updates.append(f"{field} = ${param_idx}")
                params.append(value)
                param_idx += 1

        if not updates:
            return await self.get_category_by_id(conn, category_id)

        updates.append("updated_at = NOW()")
        query = f"UPDATE categories SET {', '.join(updates)} WHERE id = $1 RETURNING *"
        result = await conn.fetchrow(query, *params)
        return dict(result) if result else None

    async def delete_category(self, conn: asyncpg.Connection, category_id: int) -> bool:
        """Delete category (fails if has fiscal services)"""
        # Check for dependent fiscal services
        check_query = "SELECT COUNT(*) FROM fiscal_services WHERE category_id = $1"
        count = await conn.fetchval(check_query, category_id)

        if count > 0:
            raise ValueError(f"Cannot delete category: {count} fiscal services depend on it")

        result = await conn.execute("DELETE FROM categories WHERE id = $1", category_id)
        return result == "DELETE 1"

    # ========== FISCAL SERVICES ==========
    async def create(
        self, conn: asyncpg.Connection, service: FiscalServiceCreate
    ) -> Dict[str, Any]:
        """Create fiscal service - matches database schema exactly"""
        import json

        query = """
            INSERT INTO fiscal_services (
                service_code, category_id, name_es, description_es,
                service_type, calculation_method,
                tasa_expedicion, tasa_renovacion,
                base_percentage, percentage_of, unit_rate, unit_type,
                expedition_formula, expedition_unit_measure,
                renewal_formula, renewal_unit_measure,
                calculation_config, rate_tiers,
                tier_group_name, is_tier_component,
                validity_period_months, renewal_frequency_months, grace_period_days,
                late_penalty_percentage, late_penalty_fixed,
                penalty_calculation_rules, eligibility_criteria, exemption_conditions,
                parent_service_id, legal_reference, regulatory_articles,
                tariff_effective_from, tariff_effective_to,
                processing_time_days, priority, complexity_level, status,
                created_at, updated_at
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
                $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
                $31, $32, $33, $34, $35, $36, $37,
                NOW(), NOW()
            )
            RETURNING *
        """
        result = await conn.fetchrow(
            query,
            service.service_code,
            service.category_id,
            service.name_es,
            service.description_es,
            service.service_type.value if service.service_type else None,
            service.calculation_method.value if service.calculation_method else None,
            service.tasa_expedicion,
            service.tasa_renovacion,
            service.base_percentage,
            service.percentage_of,
            service.unit_rate,
            service.unit_type,
            service.expedition_formula,
            service.expedition_unit_measure,
            service.renewal_formula,
            service.renewal_unit_measure,
            json.dumps(service.calculation_config) if service.calculation_config else '{}',
            json.dumps(service.rate_tiers) if service.rate_tiers else '[]',
            service.tier_group_name,
            service.is_tier_component,
            service.validity_period_months,
            service.renewal_frequency_months,
            service.grace_period_days,
            service.late_penalty_percentage,
            service.late_penalty_fixed,
            json.dumps(service.penalty_calculation_rules) if service.penalty_calculation_rules else '{}',
            json.dumps(service.eligibility_criteria) if service.eligibility_criteria else '{}',
            json.dumps(service.exemption_conditions) if service.exemption_conditions else '[]',
            service.parent_service_id,
            service.legal_reference,
            service.regulatory_articles,
            service.tariff_effective_from,
            service.tariff_effective_to,
            service.processing_time_days,
            service.priority,
            service.complexity_level,
            service.status.value if service.status else 'active',
        )

        service_dict = dict(result)

        return service_dict

    async def get_by_id(
        self, conn: asyncpg.Connection, service_id: int
    ) -> Optional[Dict[str, Any]]:
        """Get fiscal service by ID with hierarchical data"""
        query = """
            SELECT
                fs.*,
                c.name_es as category_name,
                s.name_es as sector_name,
                m.name_es as ministry_name
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

        # Ensure JSONB/array fields have proper defaults (Pydantic expects dict/list)
        # Handle None, empty strings, and invalid types
        json_dict_fields = ["calculation_config", "penalty_calculation_rules", "eligibility_criteria"]
        json_list_fields = ["rate_tiers", "exemption_conditions", "regulatory_articles"]

        for field in json_dict_fields:
            val = service_dict.get(field)
            if not isinstance(val, dict):
                service_dict[field] = {}

        for field in json_list_fields:
            val = service_dict.get(field)
            if not isinstance(val, (list, tuple)):
                service_dict[field] = []
            elif isinstance(val, tuple):
                # Convert PostgreSQL ARRAY (tuple) to list
                service_dict[field] = list(val)

        # Get keywords
        keywords = await conn.fetch(
            "SELECT keyword FROM service_keywords WHERE fiscal_service_id = $1",
            service_id,
        )
        service_dict["keywords"] = [k["keyword"] for k in keywords]

        # NOTE: fiscal_service_data → MODULE DECLARATIONS (user data, not catalog)

        # Get required documents
        docs = await conn.fetch(
            """SELECT d.document_name_es
               FROM service_document_assignments sda
               JOIN document_templates d ON sda.document_template_id = d.id
               WHERE sda.fiscal_service_id = $1""",
            service_id,
        )
        service_dict["required_documents"] = [d["document_name_es"] for d in docs]

        return service_dict

    async def get_by_code(
        self, conn: asyncpg.Connection, code: str
    ) -> Optional[Dict[str, Any]]:
        """Get fiscal service by service_code"""
        query = "SELECT * FROM fiscal_services WHERE service_code = $1"
        result = await conn.fetchrow(query, code)
        return dict(result) if result else None

    async def list(
        self,
        conn: asyncpg.Connection,
        category_id: Optional[str] = None,
        status: Optional[str] = None,
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

        if status is not None:
            conditions.append(f"fs.status = ${param_idx}")
            params.append(status)
            param_idx += 1

        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

        # Count
        count_query = f"SELECT COUNT(*) FROM fiscal_services fs {where_clause}"
        total = await conn.fetchval(count_query, *params)

        # Data - Optimized query with aggregated keywords
        data_query = f"""
            SELECT
                fs.id,
                fs.service_code,
                fs.category_id,
                fs.name_es,
                fs.description_es,
                fs.service_type,
                fs.calculation_method,
                fs.tasa_expedicion,
                fs.tasa_renovacion,
                fs.status,
                fs.priority,
                fs.processing_time_days,
                fs.view_count,
                fs.created_at,
                fs.updated_at,
                c.name_es as category_name,
                s.name_es as sector_name,
                m.name_es as ministry_name,
                COALESCE(
                    (SELECT array_agg(sk.keyword)
                     FROM service_keywords sk
                     WHERE sk.fiscal_service_id = fs.id),
                    ARRAY[]::text[]
                ) as keywords
            FROM fiscal_services fs
            LEFT JOIN categories c ON fs.category_id = c.id
            LEFT JOIN sectors s ON c.sector_id = s.id
            LEFT JOIN ministries m ON s.ministry_id = m.id
            {where_clause}
            ORDER BY fs.service_code
            LIMIT ${param_idx} OFFSET ${param_idx + 1}
        """
        params.extend([limit, offset])
        results = await conn.fetch(data_query, *params)

        services = []
        for r in results:
            service = dict(r)
            service["keywords"] = list(service.get("keywords") or [])
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
                f"(fs.name_es ILIKE ${param_idx} OR fs.description_es ILIKE ${param_idx} OR EXISTS (SELECT 1 FROM service_keywords sk WHERE sk.fiscal_service_id = fs.id AND sk.keyword ILIKE ${param_idx}))"
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

        if search.status is not None:
            conditions.append(f"fs.status = ${param_idx}")
            params.append(search.status)
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
                c.name_es as category_name,
                s.name_es as sector_name,
                m.name_es as ministry_name
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
                c.name_es as category_name,
                s.name_es as sector_name,
                m.name_es as ministry_name
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
                c.name_es as category_name,
                s.name_es as sector_name,
                m.name_es as ministry_name
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
        self, conn: asyncpg.Connection, service_id: int, update_data: FiscalServiceUpdate
    ) -> Optional[Dict[str, Any]]:
        """Update fiscal service - matches database schema"""
        import json

        updates = []
        params = [service_id]
        param_idx = 2

        # Fields that need special handling (enums and JSON)
        enum_fields = {"service_type", "calculation_method", "status"}
        json_fields = {"calculation_config", "rate_tiers", "penalty_calculation_rules",
                       "eligibility_criteria", "exemption_conditions"}

        for field, value in update_data.model_dump(exclude_unset=True).items():
            if value is not None:
                if field in enum_fields:
                    updates.append(f"{field} = ${param_idx}")
                    params.append(value.value if hasattr(value, 'value') else value)
                elif field in json_fields:
                    updates.append(f"{field} = ${param_idx}")
                    params.append(json.dumps(value) if not isinstance(value, str) else value)
                else:
                    updates.append(f"{field} = ${param_idx}")
                    params.append(value)
                param_idx += 1

        if not updates:
            return await self.get_by_id(conn, service_id)

        updates.append("updated_at = NOW()")

        query = f"UPDATE fiscal_services SET {', '.join(updates)} WHERE id = $1 RETURNING *"
        result = await conn.fetchrow(query, *params)

        if not result:
            return None

        return await self.get_by_id(conn, service_id)

    async def delete(self, conn: asyncpg.Connection, service_id: int) -> bool:
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
        self, conn: asyncpg.Connection, service_id: int
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
