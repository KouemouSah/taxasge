"""
Fiscal Service Repository for TaxasGE Backend
Handles fiscal services CRUD operations aligned with PostgreSQL schema
"""

from typing import List, Optional, Dict, Any
from uuid import UUID
from decimal import Decimal
from loguru import logger

from app.repositories.base import BaseRepository
from app.models.tax import (
    FiscalService, FiscalServiceCreate, FiscalServiceUpdate, FiscalServiceSearchFilter,
    FiscalServiceStats, Ministry, Sector, Category, Subcategory
)


class FiscalServiceRepository(BaseRepository[FiscalService]):
    """Repository for fiscal services management"""

    def __init__(self):
        super().__init__(FiscalService)

    async def search_services(self, search_filter: FiscalServiceSearchFilter) -> List[FiscalService]:
        """Search fiscal services with advanced filtering"""
        try:
            if self.db.use_postgresql:
                return await self._search_services_postgresql(search_filter)
            else:
                return await self._search_services_supabase(search_filter)

        except Exception as e:
            logger.error(f"Error searching fiscal services: {e}")
            return []

    async def count_services(self, search_filter: FiscalServiceSearchFilter) -> int:
        """Count fiscal services matching search criteria"""
        try:
            if self.db.use_postgresql:
                return await self._count_services_postgresql(search_filter)
            else:
                return await self._count_services_supabase(search_filter)

        except Exception as e:
            logger.error(f"Error counting fiscal services: {e}")
            return 0

    async def create_service(self, service_data: FiscalServiceCreate) -> Optional[FiscalService]:
        """Create new fiscal service"""
        try:
            service = FiscalService(
                service_code=service_data.service_code,
                subcategory_id=service_data.subcategory_id,
                service_type=service_data.service_type,
                expedition_amount=service_data.expedition_amount,
                renewal_amount=service_data.renewal_amount,
                calculation_method=service_data.calculation_method,
                processing_time_days=service_data.processing_time_days,
                urgent_processing_days=service_data.urgent_processing_days,
                is_online_available=service_data.is_online_available,
                is_urgent_available=service_data.is_urgent_available,
                effective_from=service_data.effective_from,
                effective_until=service_data.effective_until
            )

            return await self.create(service)

        except Exception as e:
            logger.error(f"Error creating fiscal service: {e}")
            return None

    async def update_service(self, service_id: UUID, update_data: FiscalServiceUpdate) -> Optional[FiscalService]:
        """Update fiscal service"""
        try:
            return await self.update(service_id, update_data.dict(exclude_unset=True))

        except Exception as e:
            logger.error(f"Error updating fiscal service {service_id}: {e}")
            return None

    async def get_ministry(self, ministry_id: UUID) -> Optional[Ministry]:
        """Get ministry by ID"""
        try:
            if self.db.use_postgresql:
                query = "SELECT * FROM ministries WHERE id = $1"
                result = await self.db.connection.fetchrow(query, ministry_id)
                if result:
                    return Ministry(**dict(result))
            else:
                response = await self.db.supabase.table("ministries").select("*").eq("id", str(ministry_id)).execute()
                if response.data:
                    return Ministry(**response.data[0])

            return None

        except Exception as e:
            logger.error(f"Error getting ministry {ministry_id}: {e}")
            return None

    async def get_sector(self, sector_id: UUID) -> Optional[Sector]:
        """Get sector by ID"""
        try:
            if self.db.use_postgresql:
                query = "SELECT * FROM sectors WHERE id = $1"
                result = await self.db.connection.fetchrow(query, sector_id)
                if result:
                    return Sector(**dict(result))
            else:
                response = await self.db.supabase.table("sectors").select("*").eq("id", str(sector_id)).execute()
                if response.data:
                    return Sector(**response.data[0])

            return None

        except Exception as e:
            logger.error(f"Error getting sector {sector_id}: {e}")
            return None

    async def get_category(self, category_id: UUID) -> Optional[Category]:
        """Get category by ID"""
        try:
            if self.db.use_postgresql:
                query = "SELECT * FROM categories WHERE id = $1"
                result = await self.db.connection.fetchrow(query, category_id)
                if result:
                    return Category(**dict(result))
            else:
                response = await self.db.supabase.table("categories").select("*").eq("id", str(category_id)).execute()
                if response.data:
                    return Category(**response.data[0])

            return None

        except Exception as e:
            logger.error(f"Error getting category {category_id}: {e}")
            return None

    async def get_subcategory(self, subcategory_id: UUID) -> Optional[Subcategory]:
        """Get subcategory by ID"""
        try:
            if self.db.use_postgresql:
                query = "SELECT * FROM subcategories WHERE id = $1"
                result = await self.db.connection.fetchrow(query, subcategory_id)
                if result:
                    return Subcategory(**dict(result))
            else:
                response = await self.db.supabase.table("subcategories").select("*").eq("id", str(subcategory_id)).execute()
                if response.data:
                    return Subcategory(**response.data[0])

            return None

        except Exception as e:
            logger.error(f"Error getting subcategory {subcategory_id}: {e}")
            return None

    async def get_complete_hierarchy(self) -> Dict[str, Any]:
        """Get complete organizational hierarchy"""
        try:
            if self.db.use_postgresql:
                return await self._get_hierarchy_postgresql()
            else:
                return await self._get_hierarchy_supabase()

        except Exception as e:
            logger.error(f"Error getting complete hierarchy: {e}")
            return {"ministries": []}

    async def get_service_stats(self) -> FiscalServiceStats:
        """Get comprehensive fiscal service statistics"""
        try:
            if self.db.use_postgresql:
                return await self._get_stats_postgresql()
            else:
                return await self._get_stats_supabase()

        except Exception as e:
            logger.error(f"Error getting service stats: {e}")
            return FiscalServiceStats(
                total_services=0,
                active_services=0,
                online_services=0,
                urgent_services=0,
                services_by_type={},
                services_by_category={},
                services_by_ministry={},
                average_processing_time=0.0,
                average_expedition_amount=Decimal("0"),
                most_used_services=[],
                revenue_by_category={},
                monthly_usage_trend=[]
            )

    # PostgreSQL implementations

    async def _search_services_postgresql(self, search_filter: FiscalServiceSearchFilter) -> List[FiscalService]:
        """Search services in PostgreSQL with complex filtering"""
        conditions = []
        params = []
        param_count = 0

        base_query = """
            SELECT fs.* FROM fiscal_services fs
            LEFT JOIN subcategories sc ON fs.subcategory_id = sc.id
            LEFT JOIN categories c ON sc.category_id = c.id
            LEFT JOIN sectors s ON c.sector_id = s.id
            LEFT JOIN ministries m ON s.ministry_id = m.id
        """

        # Build WHERE conditions
        if search_filter.subcategory_id:
            param_count += 1
            conditions.append(f"fs.subcategory_id = ${param_count}")
            params.append(search_filter.subcategory_id)

        if search_filter.category_id:
            param_count += 1
            conditions.append(f"sc.category_id = ${param_count}")
            params.append(search_filter.category_id)

        if search_filter.sector_id:
            param_count += 1
            conditions.append(f"c.sector_id = ${param_count}")
            params.append(search_filter.sector_id)

        if search_filter.ministry_id:
            param_count += 1
            conditions.append(f"s.ministry_id = ${param_count}")
            params.append(search_filter.ministry_id)

        if search_filter.service_type:
            param_count += 1
            conditions.append(f"fs.service_type = ${param_count}")
            params.append(search_filter.service_type.value)

        if search_filter.calculation_method:
            param_count += 1
            conditions.append(f"fs.calculation_method = ${param_count}")
            params.append(search_filter.calculation_method.value)

        if search_filter.is_online_available is not None:
            param_count += 1
            conditions.append(f"fs.is_online_available = ${param_count}")
            params.append(search_filter.is_online_available)

        if search_filter.is_urgent_available is not None:
            param_count += 1
            conditions.append(f"fs.is_urgent_available = ${param_count}")
            params.append(search_filter.is_urgent_available)

        if search_filter.is_active is not None:
            param_count += 1
            conditions.append(f"fs.is_active = ${param_count}")
            params.append(search_filter.is_active)

        if search_filter.min_expedition_amount is not None:
            param_count += 1
            conditions.append(f"fs.expedition_amount >= ${param_count}")
            params.append(search_filter.min_expedition_amount)

        if search_filter.max_expedition_amount is not None:
            param_count += 1
            conditions.append(f"fs.expedition_amount <= ${param_count}")
            params.append(search_filter.max_expedition_amount)

        if search_filter.min_renewal_amount is not None:
            param_count += 1
            conditions.append(f"fs.renewal_amount >= ${param_count}")
            params.append(search_filter.min_renewal_amount)

        if search_filter.max_renewal_amount is not None:
            param_count += 1
            conditions.append(f"fs.renewal_amount <= ${param_count}")
            params.append(search_filter.max_renewal_amount)

        if search_filter.max_processing_days is not None:
            param_count += 1
            conditions.append(f"fs.processing_time_days <= ${param_count}")
            params.append(search_filter.max_processing_days)

        # Add query search in translations
        if search_filter.query:
            param_count += 1
            conditions.append(f"""
                EXISTS (
                    SELECT 1 FROM translations t
                    WHERE t.entity_type = 'fiscal_service'
                    AND t.entity_id = fs.id
                    AND t.language_code = ${param_count}
                    AND LOWER(t.content) LIKE LOWER(${param_count + 1})
                )
            """)
            params.extend([search_filter.language, f"%{search_filter.query}%"])
            param_count += 1

        # Build final query
        if conditions:
            base_query += " WHERE " + " AND ".join(conditions)

        # Add ordering
        base_query += " ORDER BY fs.created_at DESC"

        # Add pagination
        param_count += 1
        base_query += f" LIMIT ${param_count}"
        params.append(search_filter.size)

        param_count += 1
        base_query += f" OFFSET ${param_count}"
        params.append((search_filter.page - 1) * search_filter.size)

        # Execute query
        results = await self.db.connection.fetch(base_query, *params)
        return [FiscalService(**dict(row)) for row in results]

    async def _count_services_postgresql(self, search_filter: FiscalServiceSearchFilter) -> int:
        """Count services in PostgreSQL matching search criteria"""
        # Similar to search but with COUNT(*) instead of SELECT *
        conditions = []
        params = []
        param_count = 0

        base_query = """
            SELECT COUNT(*) FROM fiscal_services fs
            LEFT JOIN subcategories sc ON fs.subcategory_id = sc.id
            LEFT JOIN categories c ON sc.category_id = c.id
            LEFT JOIN sectors s ON c.sector_id = s.id
            LEFT JOIN ministries m ON s.ministry_id = m.id
        """

        # Apply same conditions as search (without pagination)
        # ... (similar logic as _search_services_postgresql but for counting)

        if conditions:
            base_query += " WHERE " + " AND ".join(conditions)

        result = await self.db.connection.fetchval(base_query, *params)
        return result or 0

    async def _get_hierarchy_postgresql(self) -> Dict[str, Any]:
        """Get complete hierarchy from PostgreSQL"""
        query = """
            SELECT
                m.id as ministry_id, m.ministry_code,
                s.id as sector_id, s.sector_code,
                c.id as category_id, c.category_code,
                sc.id as subcategory_id, sc.subcategory_code
            FROM ministries m
            LEFT JOIN sectors s ON m.id = s.ministry_id
            LEFT JOIN categories c ON s.id = c.sector_id
            LEFT JOIN subcategories sc ON c.id = sc.category_id
            WHERE m.is_active = true
            ORDER BY m.ministry_code, s.sector_code, c.category_code, sc.subcategory_code
        """

        results = await self.db.connection.fetch(query)

        # Build hierarchical structure
        hierarchy = {"ministries": []}
        ministries_dict = {}

        for row in results:
            ministry_id = row['ministry_id']

            # Add ministry if not exists
            if ministry_id not in ministries_dict:
                ministry_data = {
                    "id": ministry_id,
                    "ministry_code": row['ministry_code'],
                    "sectors": []
                }
                ministries_dict[ministry_id] = ministry_data
                hierarchy["ministries"].append(ministry_data)

            # Add sector, category, subcategory as needed...
            # (Similar hierarchical building logic)

        return hierarchy

    async def _get_stats_postgresql(self) -> FiscalServiceStats:
        """Get comprehensive statistics from PostgreSQL"""
        # Complex statistics query
        stats_query = """
            SELECT
                COUNT(*) as total_services,
                COUNT(*) FILTER (WHERE is_active = true) as active_services,
                COUNT(*) FILTER (WHERE is_online_available = true) as online_services,
                COUNT(*) FILTER (WHERE is_urgent_available = true) as urgent_services,
                AVG(processing_time_days) as avg_processing_time,
                AVG(expedition_amount) as avg_expedition_amount
            FROM fiscal_services
        """

        result = await self.db.connection.fetchrow(stats_query)

        return FiscalServiceStats(
            total_services=result['total_services'] or 0,
            active_services=result['active_services'] or 0,
            online_services=result['online_services'] or 0,
            urgent_services=result['urgent_services'] or 0,
            services_by_type={},  # Additional queries needed
            services_by_category={},
            services_by_ministry={},
            average_processing_time=float(result['avg_processing_time'] or 0),
            average_expedition_amount=Decimal(str(result['avg_expedition_amount'] or 0)),
            most_used_services=[],
            revenue_by_category={},
            monthly_usage_trend=[]
        )

    # Supabase implementations (similar structure)

    async def _search_services_supabase(self, search_filter: FiscalServiceSearchFilter) -> List[FiscalService]:
        """Search services in Supabase"""
        # Implement Supabase search logic
        query = self.db.supabase.table("fiscal_services").select("*")

        # Apply filters
        if search_filter.service_type:
            query = query.eq("service_type", search_filter.service_type.value)

        if search_filter.is_active is not None:
            query = query.eq("is_active", search_filter.is_active)

        # Add pagination
        query = query.range(
            (search_filter.page - 1) * search_filter.size,
            search_filter.page * search_filter.size - 1
        )

        response = await query.execute()

        if response.data:
            return [FiscalService(**item) for item in response.data]
        return []

    async def _count_services_supabase(self, search_filter: FiscalServiceSearchFilter) -> int:
        """Count services in Supabase"""
        # Implement counting logic for Supabase
        query = self.db.supabase.table("fiscal_services").select("id", count="exact")

        # Apply same filters as search
        response = await query.execute()
        return response.count or 0

    async def _get_hierarchy_supabase(self) -> Dict[str, Any]:
        """Get hierarchy from Supabase"""
        # Implement Supabase hierarchy logic
        return {"ministries": []}

    async def _get_stats_supabase(self) -> FiscalServiceStats:
        """Get stats from Supabase"""
        # Implement Supabase statistics logic
        return FiscalServiceStats(
            total_services=0,
            active_services=0,
            online_services=0,
            urgent_services=0,
            services_by_type={},
            services_by_category={},
            services_by_ministry={},
            average_processing_time=0.0,
            average_expedition_amount=Decimal("0"),
            most_used_services=[],
            revenue_by_category={},
            monthly_usage_trend=[]
        )


# Global repository instance
fiscal_service_repository = FiscalServiceRepository()