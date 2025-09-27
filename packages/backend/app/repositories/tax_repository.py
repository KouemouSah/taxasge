"""
Tax repository for TaxasGE Backend
Handles tax service data persistence with PostgreSQL and Supabase
"""

from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from loguru import logger
from decimal import Decimal

from app.repositories.base import BaseRepository
from app.models.tax import (
    TaxService, TaxServiceCreate, TaxServiceUpdate, TaxServiceResponse,
    TaxServiceSearchFilter, PriceCalculationRequest, PriceCalculationResponse,
    TaxServiceStats, ServiceCategory, ServiceSubCategory, ServiceStatus, PriceType
)
from app.models.user import UserActivity


class TaxRepository(BaseRepository[TaxServiceResponse]):
    """Repository for tax service management operations"""

    def __init__(self):
        super().__init__("tax_services")

    def _map_to_model(self, data: Dict[str, Any]) -> TaxServiceResponse:
        """Map database row to TaxServiceResponse model"""
        return TaxServiceResponse(
            id=data["id"],
            code=data["code"],
            name_es=data["name_es"],
            name_fr=data["name_fr"],
            name_en=data["name_en"],
            description_es=data.get("description_es"),
            description_fr=data.get("description_fr"),
            description_en=data.get("description_en"),
            category_id=data["category_id"],
            subcategory_id=data.get("subcategory_id"),
            ministry=data.get("ministry"),
            department=data.get("department"),
            price_structure=data["price_structure"],
            processing_time_days=data.get("processing_time_days"),
            urgent_processing_days=data.get("urgent_processing_days"),
            required_documents=data.get("required_documents", []),
            eligibility_criteria=data.get("eligibility_criteria"),
            procedures=data.get("procedures"),
            status=ServiceStatus(data["status"]),
            is_online_available=data.get("is_online_available", True),
            is_urgent_available=data.get("is_urgent_available", False),
            keywords=data.get("keywords", []),
            tags=data.get("tags", []),
            created_at=data["created_at"],
            updated_at=data["updated_at"],
            effective_from=data.get("effective_from"),
            effective_until=data.get("effective_until"),
            usage_count=data.get("usage_count", 0),
            average_rating=data.get("average_rating"),
            last_used=data.get("last_used")
        )

    def _map_from_model(self, model: TaxServiceResponse) -> Dict[str, Any]:
        """Map TaxServiceResponse model to database row"""
        return {
            "id": model.id,
            "code": model.code,
            "name_es": model.name_es,
            "name_fr": model.name_fr,
            "name_en": model.name_en,
            "description_es": model.description_es,
            "description_fr": model.description_fr,
            "description_en": model.description_en,
            "category_id": model.category_id,
            "subcategory_id": model.subcategory_id,
            "ministry": model.ministry,
            "department": model.department,
            "price_structure": model.price_structure.dict() if hasattr(model.price_structure, 'dict') else model.price_structure,
            "processing_time_days": model.processing_time_days,
            "urgent_processing_days": model.urgent_processing_days,
            "required_documents": [doc.dict() if hasattr(doc, 'dict') else doc for doc in model.required_documents],
            "eligibility_criteria": model.eligibility_criteria,
            "procedures": model.procedures,
            "status": model.status.value,
            "is_online_available": model.is_online_available,
            "is_urgent_available": model.is_urgent_available,
            "keywords": model.keywords,
            "tags": model.tags,
            "created_at": model.created_at,
            "updated_at": model.updated_at,
            "effective_from": model.effective_from,
            "effective_until": model.effective_until,
            "usage_count": model.usage_count,
            "average_rating": model.average_rating,
            "last_used": model.last_used
        }

    async def find_by_code(self, code: str) -> Optional[TaxServiceResponse]:
        """Find tax service by code"""
        try:
            if self.supabase.enabled:
                results = await self.supabase.select(
                    self.table_name,
                    filters={"code": code}
                )
                if results:
                    return self._map_to_model(results[0])
            else:
                query = f"SELECT * FROM {self.table_name} WHERE code = $1"
                result = await self.db_manager.execute_single(query, code)
                if result:
                    return self._map_to_model(dict(result))

        except Exception as e:
            logger.error(f"❌ Error finding tax service by code {code}: {e}")

        return None

    async def create_service(self, service_data: TaxServiceCreate) -> Optional[TaxServiceResponse]:
        """Create new tax service"""
        try:
            # Convert TaxServiceCreate to TaxService for storage
            data = {
                "code": service_data.code,
                "name_es": service_data.name_es,
                "name_fr": service_data.name_fr,
                "name_en": service_data.name_en,
                "description_es": service_data.description_es,
                "description_fr": service_data.description_fr,
                "description_en": service_data.description_en,
                "category_id": service_data.category_id,
                "subcategory_id": service_data.subcategory_id,
                "ministry": service_data.ministry,
                "department": service_data.department,
                "price_structure": service_data.price_structure.dict(),
                "processing_time_days": service_data.processing_time_days,
                "urgent_processing_days": service_data.urgent_processing_days,
                "required_documents": [doc.dict() for doc in service_data.required_documents],
                "eligibility_criteria": service_data.eligibility_criteria,
                "procedures": service_data.procedures,
                "status": ServiceStatus.active.value,
                "is_online_available": service_data.is_online_available,
                "is_urgent_available": service_data.is_urgent_available,
                "keywords": service_data.keywords,
                "tags": service_data.tags,
                "usage_count": 0
            }

            return await self.create(self._map_to_model(data))

        except Exception as e:
            logger.error(f"❌ Error creating tax service: {e}")
            return None

    async def update_service(self, service_id: str, updates: TaxServiceUpdate) -> Optional[TaxServiceResponse]:
        """Update tax service"""
        try:
            # Build update data
            update_data = {}
            update_dict = updates.dict(exclude_unset=True)

            for key, value in update_dict.items():
                if value is not None:
                    if key == "status":
                        update_data[key] = value.value
                    elif key == "price_structure" and hasattr(value, 'dict'):
                        update_data[key] = value.dict()
                    elif key == "required_documents":
                        update_data[key] = [doc.dict() if hasattr(doc, 'dict') else doc for doc in value]
                    else:
                        update_data[key] = value

            return await self.update(service_id, update_data)

        except Exception as e:
            logger.error(f"❌ Error updating tax service {service_id}: {e}")
            return None

    async def search_services(self, search_filter: TaxServiceSearchFilter) -> List[TaxServiceResponse]:
        """Search tax services with advanced filtering"""
        try:
            filters = {}

            # Build filters
            if search_filter.category_id:
                filters["category_id"] = search_filter.category_id
            if search_filter.subcategory_id:
                filters["subcategory_id"] = search_filter.subcategory_id
            if search_filter.ministry:
                filters["ministry"] = search_filter.ministry
            if search_filter.status:
                filters["status"] = search_filter.status.value
            if search_filter.is_online_available is not None:
                filters["is_online_available"] = search_filter.is_online_available
            if search_filter.is_urgent_available is not None:
                filters["is_urgent_available"] = search_filter.is_urgent_available

            # Text search
            if search_filter.query:
                search_columns = ["name_es", "name_fr", "name_en", "description_es", "code"]
                return await self.search(
                    search_filter.query,
                    search_columns,
                    filters
                )

            # Standard filtering
            return await self.find_all(filters=filters)

        except Exception as e:
            logger.error(f"❌ Error searching tax services: {e}")
            return []

    async def calculate_price(self, service: TaxServiceResponse, request: PriceCalculationRequest) -> PriceCalculationResponse:
        """Calculate price for tax service"""
        try:
            price_structure = service.price_structure
            base_price = price_structure.get("base_price", 0) if isinstance(price_structure, dict) else price_structure.base_price

            # Start with base price
            calculated_price = Decimal(str(base_price))
            breakdown = {"base_price": calculated_price}

            # Handle different price types
            price_type = price_structure.get("type", "fixed") if isinstance(price_structure, dict) else price_structure.type

            if price_type == "percentage" and request.base_amount:
                percentage = price_structure.get("percentage", 0) if isinstance(price_structure, dict) else price_structure.percentage
                calculated_price = Decimal(str(request.base_amount)) * (Decimal(str(percentage)) / 100)
                breakdown["percentage_calculation"] = {
                    "base_amount": request.base_amount,
                    "percentage": percentage,
                    "result": calculated_price
                }

            elif price_type == "per_unit" and request.quantity:
                calculated_price = Decimal(str(base_price)) * Decimal(str(request.quantity))
                breakdown["unit_calculation"] = {
                    "base_price": base_price,
                    "quantity": request.quantity,
                    "result": calculated_price
                }

            # Apply processing fee
            processing_fee = Decimal("0")
            if isinstance(price_structure, dict) and "processing_fee" in price_structure:
                processing_fee = Decimal(str(price_structure["processing_fee"]))
            elif hasattr(price_structure, 'processing_fee') and price_structure.processing_fee:
                processing_fee = price_structure.processing_fee

            # Apply urgency multiplier
            urgency_fee = Decimal("0")
            if request.is_urgent:
                urgency_multiplier = price_structure.get("urgency_multiplier", 1.5) if isinstance(price_structure, dict) else getattr(price_structure, 'urgency_multiplier', 1.5)
                urgency_fee = calculated_price * (Decimal(str(urgency_multiplier)) - 1)
                breakdown["urgency_fee"] = urgency_fee

            total_price = calculated_price + processing_fee + urgency_fee

            # Determine processing time
            processing_time = service.processing_time_days or 5
            if request.is_urgent and service.urgent_processing_days:
                processing_time = service.urgent_processing_days

            return PriceCalculationResponse(
                service_id=service.id,
                base_price=calculated_price,
                processing_fee=processing_fee if processing_fee > 0 else None,
                urgency_fee=urgency_fee if urgency_fee > 0 else None,
                total_price=total_price,
                currency="XAF",
                breakdown=breakdown,
                processing_time_days=processing_time
            )

        except Exception as e:
            logger.error(f"❌ Error calculating price for service {service.id}: {e}")
            raise e

    async def get_service_stats(self) -> TaxServiceStats:
        """Get comprehensive tax service statistics"""
        try:
            total_services = await self.count()
            active_services = await self.count({"status": ServiceStatus.active.value})
            online_services = await self.count({"is_online_available": True})

            # Services by category
            category_stats_query = """
                SELECT category_id, COUNT(*) as count
                FROM tax_services
                GROUP BY category_id
            """
            category_results = await self.db_manager.execute_query(category_stats_query)
            services_by_category = {row["category_id"]: row["count"] for row in category_results}

            # Services by ministry
            ministry_stats_query = """
                SELECT ministry, COUNT(*) as count
                FROM tax_services
                WHERE ministry IS NOT NULL
                GROUP BY ministry
            """
            ministry_results = await self.db_manager.execute_query(ministry_stats_query)
            services_by_ministry = {row["ministry"]: row["count"] for row in ministry_results}

            # Average processing time
            avg_processing_query = """
                SELECT AVG(processing_time_days) as avg_time
                FROM tax_services
                WHERE processing_time_days IS NOT NULL
            """
            avg_result = await self.db_manager.execute_scalar(avg_processing_query)
            average_processing_time = float(avg_result or 0)

            # Most used services
            most_used_query = """
                SELECT id, name_es, usage_count
                FROM tax_services
                ORDER BY usage_count DESC
                LIMIT 10
            """
            most_used_results = await self.db_manager.execute_query(most_used_query)
            most_used_services = [
                {
                    "id": row["id"],
                    "name": row["name_es"],
                    "usage_count": row["usage_count"]
                }
                for row in most_used_results
            ]

            return TaxServiceStats(
                total_services=total_services,
                active_services=active_services,
                online_services=online_services,
                services_by_category=services_by_category,
                services_by_ministry=services_by_ministry,
                average_processing_time=average_processing_time,
                most_used_services=most_used_services,
                revenue_by_category={}  # Would need declaration/payment data
            )

        except Exception as e:
            logger.error(f"❌ Error getting tax service stats: {e}")
            return TaxServiceStats(
                total_services=0,
                active_services=0,
                online_services=0,
                services_by_category={},
                services_by_ministry={},
                average_processing_time=0.0,
                most_used_services=[],
                revenue_by_category={}
            )

    async def get_categories(self) -> List[ServiceCategory]:
        """Get all service categories"""
        try:
            if self.supabase.enabled:
                results = await self.supabase.select("service_categories")
                return [
                    ServiceCategory(
                        id=row["id"],
                        name_es=row["name_es"],
                        name_fr=row["name_fr"],
                        name_en=row["name_en"],
                        description_es=row.get("description_es"),
                        description_fr=row.get("description_fr"),
                        description_en=row.get("description_en"),
                        parent_id=row.get("parent_id"),
                        icon=row.get("icon"),
                        order=row.get("order", 0),
                        is_active=row.get("is_active", True)
                    )
                    for row in results
                ]
            else:
                query = "SELECT * FROM service_categories ORDER BY order ASC, name_es ASC"
                results = await self.db_manager.execute_query(query)
                return [
                    ServiceCategory(
                        id=row["id"],
                        name_es=row["name_es"],
                        name_fr=row["name_fr"],
                        name_en=row["name_en"],
                        description_es=row.get("description_es"),
                        description_fr=row.get("description_fr"),
                        description_en=row.get("description_en"),
                        parent_id=row.get("parent_id"),
                        icon=row.get("icon"),
                        order=row.get("order", 0),
                        is_active=row.get("is_active", True)
                    )
                    for row in results
                ]

        except Exception as e:
            logger.error(f"❌ Error getting service categories: {e}")
            return []

    async def find_category_by_id(self, category_id: str) -> Optional[ServiceCategory]:
        """Find service category by ID"""
        try:
            if self.supabase.enabled:
                results = await self.supabase.select(
                    "service_categories",
                    filters={"id": category_id}
                )
                if results:
                    row = results[0]
                    return ServiceCategory(
                        id=row["id"],
                        name_es=row["name_es"],
                        name_fr=row["name_fr"],
                        name_en=row["name_en"],
                        description_es=row.get("description_es"),
                        description_fr=row.get("description_fr"),
                        description_en=row.get("description_en"),
                        parent_id=row.get("parent_id"),
                        icon=row.get("icon"),
                        order=row.get("order", 0),
                        is_active=row.get("is_active", True)
                    )
            else:
                query = "SELECT * FROM service_categories WHERE id = $1"
                result = await self.db_manager.execute_single(query, category_id)
                if result:
                    return ServiceCategory(
                        id=result["id"],
                        name_es=result["name_es"],
                        name_fr=result["name_fr"],
                        name_en=result["name_en"],
                        description_es=result.get("description_es"),
                        description_fr=result.get("description_fr"),
                        description_en=result.get("description_en"),
                        parent_id=result.get("parent_id"),
                        icon=result.get("icon"),
                        order=result.get("order", 0),
                        is_active=result.get("is_active", True)
                    )

        except Exception as e:
            logger.error(f"❌ Error finding category {category_id}: {e}")

        return None

    async def create_category(self, category_data: ServiceCategory) -> Optional[ServiceCategory]:
        """Create new service category"""
        try:
            data = {
                "id": category_data.id,
                "name_es": category_data.name_es,
                "name_fr": category_data.name_fr,
                "name_en": category_data.name_en,
                "description_es": category_data.description_es,
                "description_fr": category_data.description_fr,
                "description_en": category_data.description_en,
                "parent_id": category_data.parent_id,
                "icon": category_data.icon,
                "order": category_data.order,
                "is_active": category_data.is_active
            }

            if self.supabase.enabled:
                result = await self.supabase.insert("service_categories", data)
                if result:
                    return ServiceCategory(**result)
            else:
                columns = list(data.keys())
                placeholders = [f"${i+1}" for i in range(len(columns))]
                values = list(data.values())

                query = f"""
                    INSERT INTO service_categories ({', '.join(columns)})
                    VALUES ({', '.join(placeholders)})
                    RETURNING *
                """

                result = await self.db_manager.execute_single(query, *values)
                if result:
                    return ServiceCategory(**dict(result))

        except Exception as e:
            logger.error(f"❌ Error creating service category: {e}")

        return None

    async def has_active_declarations(self, service_id: str) -> bool:
        """Check if service has active declarations"""
        try:
            query = """
                SELECT COUNT(*) FROM tax_declarations
                WHERE service_id = $1 AND status IN ('pending', 'processing', 'approved')
            """
            count = await self.db_manager.execute_scalar(query, service_id)
            return (count or 0) > 0

        except Exception as e:
            logger.error(f"❌ Error checking active declarations for service {service_id}: {e}")
            return False

    async def log_activity(self, user_id: str, action: str, resource: str = None, metadata: Dict[str, Any] = None):
        """Log user activity"""
        try:
            activity = UserActivity(
                user_id=user_id,
                action=action,
                resource=resource,
                metadata=metadata,
                timestamp=datetime.utcnow()
            )

            if self.supabase.enabled:
                data = {
                    "user_id": activity.user_id,
                    "action": activity.action,
                    "resource": activity.resource,
                    "metadata": activity.metadata,
                    "timestamp": activity.timestamp
                }
                await self.supabase.insert("user_activities", data)
            else:
                query = """
                    INSERT INTO user_activities
                    (user_id, action, resource, metadata, timestamp)
                    VALUES ($1, $2, $3, $4, $5)
                """
                await self.db_manager.execute_command(
                    query,
                    activity.user_id,
                    activity.action,
                    activity.resource,
                    activity.metadata,
                    activity.timestamp
                )

        except Exception as e:
            logger.error(f"❌ Error logging activity: {e}")

    async def bulk_create_services(self, services_data: List[TaxServiceCreate]) -> Dict[str, List]:
        """Bulk create tax services"""
        successful = []
        failed = []

        for service_data in services_data:
            try:
                created_service = await self.create_service(service_data)
                if created_service:
                    successful.append(created_service)
                else:
                    failed.append({"data": service_data, "error": "Creation failed"})
            except Exception as e:
                failed.append({"data": service_data, "error": str(e)})

        return {"successful": successful, "failed": failed}

    async def bulk_update_status(self, service_ids: List[str], new_status: ServiceStatus) -> Dict[str, Any]:
        """Bulk update service status"""
        try:
            updates = {"status": new_status.value, "updated_at": datetime.utcnow()}
            updated_count = 0
            failed_updates = []

            for service_id in service_ids:
                try:
                    result = await self.update(service_id, updates)
                    if result:
                        updated_count += 1
                    else:
                        failed_updates.append({"service_id": service_id, "error": "Update failed"})
                except Exception as e:
                    failed_updates.append({"service_id": service_id, "error": str(e)})

            return {
                "updated_count": updated_count,
                "failed_updates": failed_updates
            }

        except Exception as e:
            logger.error(f"❌ Error in bulk status update: {e}")
            return {"updated_count": 0, "failed_updates": service_ids}


# Global tax repository instance
tax_repository = TaxRepository()