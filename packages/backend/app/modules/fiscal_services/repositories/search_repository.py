"""
Search Repository for Fiscal Services
Optimized SQL queries for the /search-db endpoint with facets
"""

from typing import Dict, Any, List, Optional, Tuple
import asyncpg
from loguru import logger
import time


class SearchRepository:
    """Repository for fiscal services search with facets"""

    async def search_services(
        self,
        conn: asyncpg.Connection,
        q: Optional[str] = None,
        category_id: Optional[int] = None,
        category_code: Optional[str] = None,
        ministry_id: Optional[int] = None,
        service_type: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        min_expedition_price: Optional[float] = None,
        max_expedition_price: Optional[float] = None,
        min_renewal_price: Optional[float] = None,
        max_renewal_price: Optional[float] = None,
        sort_by: str = "relevance",
        sort_order: str = "asc",
        page: int = 1,
        limit: int = 20,
        language: str = "es",
    ) -> Tuple[List[Dict[str, Any]], int]:
        """
        Search fiscal services with filters and pagination

        Returns:
            Tuple of (results, total_count)
        """
        # Build WHERE conditions
        conditions = ["fs.status = 'active'"]
        params: List[Any] = []
        param_idx = 1

        # Text search (Spanish only - name_es, description_es in DB)
        if q:
            conditions.append(f"""(
                fs.name_es ILIKE ${param_idx}
                OR fs.description_es ILIKE ${param_idx}
                OR c.name_es ILIKE ${param_idx}
                OR EXISTS (
                    SELECT 1 FROM service_keywords sk
                    WHERE sk.fiscal_service_id = fs.id AND sk.keyword ILIKE ${param_idx}
                )
            )""")
            params.append(f"%{q}%")
            param_idx += 1

        # Category filter
        if category_id:
            conditions.append(f"fs.category_id = ${param_idx}")
            params.append(category_id)
            param_idx += 1
        elif category_code:
            conditions.append(f"c.category_code = ${param_idx}")
            params.append(category_code)
            param_idx += 1

        # Ministry filter
        if ministry_id:
            conditions.append(f"m.id = ${param_idx}")
            params.append(ministry_id)
            param_idx += 1

        # Service type filter
        if service_type:
            conditions.append(f"fs.service_type = ${param_idx}")
            params.append(service_type)
            param_idx += 1

        # Price filters
        if min_price is not None:
            conditions.append(f"(fs.expedition_amount >= ${param_idx} OR fs.renewal_amount >= ${param_idx})")
            params.append(min_price)
            param_idx += 1

        if max_price is not None:
            conditions.append(f"(fs.expedition_amount <= ${param_idx} OR fs.renewal_amount <= ${param_idx})")
            params.append(max_price)
            param_idx += 1

        if min_expedition_price is not None:
            conditions.append(f"fs.expedition_amount >= ${param_idx}")
            params.append(min_expedition_price)
            param_idx += 1

        if max_expedition_price is not None:
            conditions.append(f"fs.expedition_amount <= ${param_idx}")
            params.append(max_expedition_price)
            param_idx += 1

        if min_renewal_price is not None:
            conditions.append(f"fs.renewal_amount >= ${param_idx}")
            params.append(min_renewal_price)
            param_idx += 1

        if max_renewal_price is not None:
            conditions.append(f"fs.renewal_amount <= ${param_idx}")
            params.append(max_renewal_price)
            param_idx += 1

        where_clause = " AND ".join(conditions)

        # Build ORDER BY
        order_map = {
            "relevance": "fs.view_count DESC, fs.calculation_count DESC",
            "name": f"COALESCE(et_name.translation_text, fs.name_es)",
            "price": "COALESCE(fs.expedition_amount, 0)",
            "popular": "fs.calculation_count DESC, fs.view_count DESC",
        }
        order_by = order_map.get(sort_by, order_map["relevance"])
        if sort_by in ["name", "price"]:
            order_by += f" {sort_order.upper()}"

        # Count query
        count_query = f"""
            SELECT COUNT(DISTINCT fs.id)
            FROM fiscal_services fs
            JOIN categories c ON fs.category_id = c.id
            LEFT JOIN sectors s ON c.sector_id = s.id
            LEFT JOIN ministries m ON s.ministry_id = m.id
            WHERE {where_clause}
        """
        total = await conn.fetchval(count_query, *params)

        # Calculate offset
        offset = (page - 1) * limit

        # Data query with translations
        data_query = f"""
            SELECT DISTINCT
                fs.id,
                COALESCE(et_name.translation_text, fs.name_es) as name,
                COALESCE(et_desc.translation_text, fs.description_es) as description,
                COALESCE(et_cat.translation_text, c.name_es) as category_name,
                COALESCE(et_min.translation_text, m.name_es) as ministry_name,
                COALESCE(et_sec.translation_text, s.name_es) as sector_name,
                fs.service_type,
                COALESCE(fs.expedition_amount, 0) as expedition_price,
                COALESCE(fs.renewal_amount, 0) as renewal_price,
                COALESCE(fs.processing_time_days, 1) as processing_time_days,
                fs.status
            FROM fiscal_services fs
            JOIN categories c ON fs.category_id = c.id
            LEFT JOIN sectors s ON c.sector_id = s.id
            LEFT JOIN ministries m ON s.ministry_id = m.id
            -- Service name translation
            LEFT JOIN entity_translations et_name ON
                et_name.entity_type = 'service'
                AND et_name.entity_code = fs.service_code
                AND et_name.field_name = 'name'
                AND et_name.language_code = ${param_idx}
            -- Service description translation
            LEFT JOIN entity_translations et_desc ON
                et_desc.entity_type = 'service'
                AND et_desc.entity_code = fs.service_code
                AND et_desc.field_name = 'description'
                AND et_desc.language_code = ${param_idx}
            -- Category name translation
            LEFT JOIN entity_translations et_cat ON
                et_cat.entity_type = 'category'
                AND et_cat.entity_code = c.category_code
                AND et_cat.field_name = 'name'
                AND et_cat.language_code = ${param_idx}
            -- Ministry name translation
            LEFT JOIN entity_translations et_min ON
                et_min.entity_type = 'ministry'
                AND et_min.entity_code = m.ministry_code
                AND et_min.field_name = 'name'
                AND et_min.language_code = ${param_idx}
            -- Sector name translation
            LEFT JOIN entity_translations et_sec ON
                et_sec.entity_type = 'sector'
                AND et_sec.entity_code = s.sector_code
                AND et_sec.field_name = 'name'
                AND et_sec.language_code = ${param_idx}
            WHERE {where_clause}
            ORDER BY {order_by}
            LIMIT ${param_idx + 1} OFFSET ${param_idx + 2}
        """
        params.extend([language, limit, offset])

        try:
            rows = await conn.fetch(data_query, *params)
            results = [dict(row) for row in rows]
            return results, total or 0
        except asyncpg.PostgresError as e:
            logger.error(f"Search query error: {e}")
            raise

    async def get_facets(
        self,
        conn: asyncpg.Connection,
        language: str = "es",
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        Get facets for filtering (categories, ministries, service types, price ranges)
        """
        facets = {
            "categories": [],
            "ministries": [],
            "service_types": [],
            "price_ranges": [],
        }

        try:
            # Categories facet
            cat_query = """
                SELECT
                    c.id,
                    c.category_code as code,
                    COALESCE(et.translation_text, c.name_es) as name,
                    COUNT(fs.id) FILTER (WHERE fs.status = 'active') as count
                FROM categories c
                LEFT JOIN fiscal_services fs ON fs.category_id = c.id
                LEFT JOIN entity_translations et ON
                    et.entity_type = 'category'
                    AND et.entity_code = c.category_code
                    AND et.field_name = 'name'
                    AND et.language_code = $1
                WHERE c.is_active = true
                GROUP BY c.id, c.category_code, c.name_es, et.translation_text
                HAVING COUNT(fs.id) FILTER (WHERE fs.status = 'active') > 0
                ORDER BY count DESC
                LIMIT 20
            """
            cat_rows = await conn.fetch(cat_query, language)
            facets["categories"] = [dict(row) for row in cat_rows]

            # Ministries facet
            min_query = """
                SELECT
                    m.id,
                    COALESCE(et.translation_text, m.name_es) as name,
                    COUNT(DISTINCT fs.id) FILTER (WHERE fs.status = 'active') as count
                FROM ministries m
                JOIN sectors s ON s.ministry_id = m.id
                JOIN categories c ON c.sector_id = s.id
                LEFT JOIN fiscal_services fs ON fs.category_id = c.id
                LEFT JOIN entity_translations et ON
                    et.entity_type = 'ministry'
                    AND et.entity_code = m.ministry_code
                    AND et.field_name = 'name'
                    AND et.language_code = $1
                WHERE m.is_active = true
                GROUP BY m.id, m.name_es, et.translation_text
                HAVING COUNT(DISTINCT fs.id) FILTER (WHERE fs.status = 'active') > 0
                ORDER BY count DESC
            """
            min_rows = await conn.fetch(min_query, language)
            facets["ministries"] = [dict(row) for row in min_rows]

            # Service types facet
            type_query = """
                SELECT
                    service_type as type,
                    COUNT(*) as count
                FROM fiscal_services
                WHERE status = 'active' AND service_type IS NOT NULL
                GROUP BY service_type
                ORDER BY count DESC
            """
            type_rows = await conn.fetch(type_query)
            facets["service_types"] = [dict(row) for row in type_rows]

            # Price ranges facet
            price_query = """
                SELECT
                    CASE
                        WHEN COALESCE(expedition_amount, 0) = 0 AND COALESCE(renewal_amount, 0) = 0 THEN 'free'
                        WHEN COALESCE(expedition_amount, 0) < 50000 THEN 'low'
                        WHEN COALESCE(expedition_amount, 0) < 200000 THEN 'medium'
                        WHEN COALESCE(expedition_amount, 0) < 500000 THEN 'high'
                        ELSE 'very_high'
                    END as range,
                    COUNT(*) as count
                FROM fiscal_services
                WHERE status = 'active'
                GROUP BY range
                ORDER BY
                    CASE range
                        WHEN 'free' THEN 1
                        WHEN 'low' THEN 2
                        WHEN 'medium' THEN 3
                        WHEN 'high' THEN 4
                        WHEN 'very_high' THEN 5
                    END
            """
            price_rows = await conn.fetch(price_query)
            facets["price_ranges"] = [dict(row) for row in price_rows]

        except asyncpg.PostgresError as e:
            logger.error(f"Facets query error: {e}")

        return facets

    async def get_suggestions(
        self,
        conn: asyncpg.Connection,
        q: Optional[str] = None,
        language: str = "es",
        limit: int = 5,
    ) -> List[str]:
        """Get search suggestions based on popular services and keywords"""
        suggestions = []

        try:
            if q:
                # Get matching keywords
                kw_query = """
                    SELECT DISTINCT keyword
                    FROM service_keywords
                    WHERE keyword ILIKE $1
                    LIMIT $2
                """
                kw_rows = await conn.fetch(kw_query, f"%{q}%", limit)
                suggestions.extend([row["keyword"] for row in kw_rows])
            else:
                # Get popular service names
                pop_query = """
                    SELECT DISTINCT COALESCE(et.translation_text, fs.name_es) as name
                    FROM fiscal_services fs
                    LEFT JOIN entity_translations et ON
                        et.entity_type = 'service'
                        AND et.entity_code = fs.service_code
                        AND et.field_name = 'name'
                        AND et.language_code = $1
                    WHERE fs.status = 'active'
                    ORDER BY fs.calculation_count DESC
                    LIMIT $2
                """
                pop_rows = await conn.fetch(pop_query, language, limit)
                suggestions.extend([row["name"] for row in pop_rows if row["name"]])

        except asyncpg.PostgresError as e:
            logger.error(f"Suggestions query error: {e}")

        return suggestions[:limit]
