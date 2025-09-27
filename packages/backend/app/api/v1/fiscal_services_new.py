"""
🏛️ TaxasGE Fiscal Services API v2
Aligned with PostgreSQL schema - Complete fiscal services management
"""

from fastapi import APIRouter, HTTPException, Depends, Query, Path, status, Body
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any, Union
from uuid import UUID
from loguru import logger
from datetime import datetime

from app.models.tax import (
    FiscalService, FiscalServiceCreate, FiscalServiceUpdate, FiscalServiceResponse,
    FiscalServiceListResponse, FiscalServiceSearchFilter, PriceCalculationRequest,
    PriceCalculationResponse, FiscalServiceStats, ServiceTypeEnum, CalculationMethodEnum,
    Ministry, Sector, Category, Subcategory
)
from app.models.user import UserResponse
from app.repositories.fiscal_service_repository import fiscal_service_repository
from app.services.translation_service import translation_service
from app.api.v1.auth import require_admin, require_operator, get_current_user

router = APIRouter(prefix="/fiscal-services", tags=["Fiscal Services"])


@router.get("/", response_model=Dict[str, Any])
async def get_fiscal_services_info():
    """Get Fiscal Services API information"""
    return {
        "message": "TaxasGE Fiscal Services API v2",
        "version": "2.0.0",
        "description": "Complete fiscal services management aligned with PostgreSQL schema",
        "endpoints": {
            "list": "GET /list - List fiscal services with advanced filtering",
            "details": "GET /{service_id} - Get service details with translations",
            "create": "POST /create - Create new fiscal service (admin)",
            "update": "PUT /{service_id} - Update fiscal service (admin)",
            "search": "POST /search - Advanced search with filters",
            "calculate": "POST /calculate-price - Calculate service pricing",
            "stats": "GET /stats - Get comprehensive statistics (admin)",
            "hierarchy": "GET /hierarchy - Get organizational hierarchy",
            "types": "GET /types - Get available service types and methods"
        },
        "features": [
            "PostgreSQL schema aligned",
            "Centralized translation system",
            "Advanced search and filtering",
            "Price calculation engine",
            "Hierarchical organization (Ministry → Sector → Category → Subcategory → Service)",
            "Multilingual support (ES/FR/EN)",
            "Statistics and analytics",
            "Role-based access control"
        ]
    }


@router.get("/list", response_model=FiscalServiceListResponse)
async def list_fiscal_services(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Page size"),
    language: str = Query("es", pattern="^(es|fr|en)$", description="Response language"),
    category_id: Optional[UUID] = Query(None, description="Filter by category"),
    sector_id: Optional[UUID] = Query(None, description="Filter by sector"),
    ministry_id: Optional[UUID] = Query(None, description="Filter by ministry"),
    service_type: Optional[ServiceTypeEnum] = Query(None, description="Filter by service type"),
    is_online_available: Optional[bool] = Query(None, description="Filter by online availability"),
    is_urgent_available: Optional[bool] = Query(None, description="Filter by urgent availability"),
    min_expedition_amount: Optional[float] = Query(None, description="Minimum expedition amount"),
    max_expedition_amount: Optional[float] = Query(None, description="Maximum expedition amount")
):
    """List fiscal services with advanced filtering and pagination"""
    try:
        # Build search filter
        search_filter = FiscalServiceSearchFilter(
            page=page,
            size=size,
            language=language,
            category_id=category_id,
            sector_id=sector_id,
            ministry_id=ministry_id,
            service_type=service_type,
            is_online_available=is_online_available,
            is_urgent_available=is_urgent_available,
            min_expedition_amount=min_expedition_amount,
            max_expedition_amount=max_expedition_amount
        )

        # Get services from repository
        services = await fiscal_service_repository.search_services(search_filter)

        # Enrich with translations
        for service in services:
            translations = await translation_service.get_translations_for_entity(
                entity_type="fiscal_service",
                entity_id=service.id,
                language_code=language
            )
            service.name = translations.get("name")
            service.description = translations.get("description")

            # Get hierarchy translations
            if service.subcategory_id:
                subcategory_translations = await translation_service.get_translations_for_entity(
                    entity_type="subcategory",
                    entity_id=service.subcategory_id,
                    language_code=language
                )
                service.subcategory_name = subcategory_translations.get("name")

        # Get total count
        total_count = await fiscal_service_repository.count_services(search_filter)

        # Calculate pagination
        pages = (total_count + size - 1) // size

        return FiscalServiceListResponse(
            services=services,
            total=total_count,
            page=page,
            size=size,
            pages=pages,
            filters=search_filter.dict(exclude_unset=True)
        )

    except Exception as e:
        logger.error(f"Error listing fiscal services: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving fiscal services"
        )


@router.get("/{service_id}", response_model=FiscalServiceResponse)
async def get_fiscal_service(
    service_id: UUID = Path(..., description="Fiscal service UUID"),
    language: str = Query("es", pattern="^(es|fr|en)$", description="Response language")
):
    """Get detailed fiscal service information with translations"""
    try:
        # Get service from repository
        service = await fiscal_service_repository.find_by_id(service_id)
        if not service:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Fiscal service '{service_id}' not found"
            )

        # Enrich with translations
        translations = await translation_service.get_translations_for_entity(
            entity_type="fiscal_service",
            entity_id=service.id,
            language_code=language
        )
        service.name = translations.get("name")
        service.description = translations.get("description")

        # Get complete hierarchy with translations
        if service.subcategory_id:
            subcategory = await fiscal_service_repository.get_subcategory(service.subcategory_id)
            if subcategory:
                subcategory_translations = await translation_service.get_translations_for_entity(
                    entity_type="subcategory",
                    entity_id=subcategory.id,
                    language_code=language
                )
                service.subcategory_name = subcategory_translations.get("name")

                # Get category
                if subcategory.category_id:
                    category = await fiscal_service_repository.get_category(subcategory.category_id)
                    if category:
                        category_translations = await translation_service.get_translations_for_entity(
                            entity_type="category",
                            entity_id=category.id,
                            language_code=language
                        )
                        service.category_name = category_translations.get("name")

                        # Get sector
                        if category.sector_id:
                            sector = await fiscal_service_repository.get_sector(category.sector_id)
                            if sector:
                                sector_translations = await translation_service.get_translations_for_entity(
                                    entity_type="sector",
                                    entity_id=sector.id,
                                    language_code=language
                                )
                                service.sector_name = sector_translations.get("name")

                                # Get ministry
                                if sector.ministry_id:
                                    ministry = await fiscal_service_repository.get_ministry(sector.ministry_id)
                                    if ministry:
                                        ministry_translations = await translation_service.get_translations_for_entity(
                                            entity_type="ministry",
                                            entity_id=ministry.id,
                                            language_code=language
                                        )
                                        service.ministry_name = ministry_translations.get("name")

        return service

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting fiscal service {service_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving fiscal service"
        )


@router.post("/search", response_model=FiscalServiceListResponse)
async def search_fiscal_services(search_filter: FiscalServiceSearchFilter):
    """Advanced search for fiscal services with complex filters"""
    try:
        # Perform search
        services = await fiscal_service_repository.search_services(search_filter)

        # Enrich with translations
        for service in services:
            translations = await translation_service.get_translations_for_entity(
                entity_type="fiscal_service",
                entity_id=service.id,
                language_code=search_filter.language
            )
            service.name = translations.get("name")
            service.description = translations.get("description")

        # Get total count
        total_count = await fiscal_service_repository.count_services(search_filter)

        # Calculate pagination
        pages = (total_count + search_filter.size - 1) // search_filter.size

        return FiscalServiceListResponse(
            services=services,
            total=total_count,
            page=search_filter.page,
            size=search_filter.size,
            pages=pages,
            filters=search_filter.dict(exclude_unset=True)
        )

    except Exception as e:
        logger.error(f"Error searching fiscal services: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error searching fiscal services"
        )


@router.post("/calculate-price", response_model=PriceCalculationResponse)
async def calculate_service_price(request: PriceCalculationRequest):
    """Calculate total price for fiscal service including fees and urgency"""
    try:
        # Get service
        service = await fiscal_service_repository.find_by_id(request.service_id)
        if not service:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Fiscal service not found"
            )

        # Calculate base pricing
        expedition_amount = service.expedition_amount
        renewal_amount = service.renewal_amount

        # Apply calculation method
        if service.calculation_method == CalculationMethodEnum.percentage and request.base_amount:
            expedition_amount = (request.base_amount * expedition_amount) / 100
            renewal_amount = (request.base_amount * renewal_amount) / 100
        elif service.calculation_method == CalculationMethodEnum.per_unit and request.quantity:
            expedition_amount = expedition_amount * request.quantity
            renewal_amount = renewal_amount * request.quantity

        # Calculate fees
        processing_fee = expedition_amount * 0.05  # 5% processing fee
        urgency_fee = expedition_amount * 0.5 if request.is_urgent and service.is_urgent_available else 0

        # Total calculation
        total_amount = expedition_amount + renewal_amount + processing_fee + urgency_fee

        # Determine processing time
        processing_time = service.urgent_processing_days if request.is_urgent else service.processing_time_days
        processing_time = processing_time or 5  # Default 5 days

        return PriceCalculationResponse(
            service_id=service.id,
            expedition_amount=expedition_amount,
            renewal_amount=renewal_amount,
            processing_fee=processing_fee,
            urgency_fee=urgency_fee,
            total_amount=total_amount,
            currency="XAF",
            calculation_method=service.calculation_method,
            breakdown={
                "expedition_amount": float(expedition_amount),
                "renewal_amount": float(renewal_amount),
                "processing_fee": float(processing_fee),
                "urgency_fee": float(urgency_fee),
                "is_urgent": request.is_urgent,
                "base_amount": float(request.base_amount) if request.base_amount else None,
                "quantity": request.quantity
            },
            processing_time_days=processing_time
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error calculating price for service {request.service_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error calculating service price"
        )


@router.get("/hierarchy", response_model=Dict[str, Any])
async def get_organizational_hierarchy(
    language: str = Query("es", pattern="^(es|fr|en)$", description="Response language")
):
    """Get complete organizational hierarchy with translations"""
    try:
        hierarchy = await fiscal_service_repository.get_complete_hierarchy()

        # Enrich with translations
        for ministry in hierarchy["ministries"]:
            translations = await translation_service.get_translations_for_entity(
                entity_type="ministry",
                entity_id=ministry["id"],
                language_code=language
            )
            ministry["name"] = translations.get("name", ministry.get("ministry_code"))

            for sector in ministry.get("sectors", []):
                sector_translations = await translation_service.get_translations_for_entity(
                    entity_type="sector",
                    entity_id=sector["id"],
                    language_code=language
                )
                sector["name"] = sector_translations.get("name", sector.get("sector_code"))

                for category in sector.get("categories", []):
                    category_translations = await translation_service.get_translations_for_entity(
                        entity_type="category",
                        entity_id=category["id"],
                        language_code=language
                    )
                    category["name"] = category_translations.get("name", category.get("category_code"))

                    for subcategory in category.get("subcategories", []):
                        subcategory_translations = await translation_service.get_translations_for_entity(
                            entity_type="subcategory",
                            entity_id=subcategory["id"],
                            language_code=language
                        )
                        subcategory["name"] = subcategory_translations.get("name", subcategory.get("subcategory_code"))

        return {
            "language": language,
            "hierarchy": hierarchy,
            "summary": {
                "total_ministries": len(hierarchy["ministries"]),
                "total_sectors": sum(len(m.get("sectors", [])) for m in hierarchy["ministries"]),
                "total_categories": sum(len(s.get("categories", [])) for m in hierarchy["ministries"] for s in m.get("sectors", [])),
                "total_subcategories": sum(len(c.get("subcategories", [])) for m in hierarchy["ministries"] for s in m.get("sectors", []) for c in s.get("categories", []))
            }
        }

    except Exception as e:
        logger.error(f"Error getting organizational hierarchy: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving organizational hierarchy"
        )


@router.get("/types", response_model=Dict[str, Any])
async def get_service_types_and_methods():
    """Get available service types and calculation methods"""
    return {
        "service_types": [
            {"value": t.value, "label": t.value.replace("_", " ").title()}
            for t in ServiceTypeEnum
        ],
        "calculation_methods": [
            {"value": m.value, "label": m.value.replace("_", " ").title()}
            for m in CalculationMethodEnum
        ],
        "description": {
            "service_types": "Available fiscal service types",
            "calculation_methods": "Available pricing calculation methods"
        }
    }


# Admin endpoints

@router.post("/create", response_model=FiscalServiceResponse)
async def create_fiscal_service(
    service_data: FiscalServiceCreate,
    admin_user: UserResponse = Depends(require_admin)
):
    """Create new fiscal service (admin only)"""
    try:
        # Create service
        new_service = await fiscal_service_repository.create_service(service_data)
        if not new_service:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create fiscal service"
            )

        # Log activity
        logger.info(f"Fiscal service created: {new_service.id} by admin {admin_user.id}")
        return new_service

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating fiscal service: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating fiscal service"
        )


@router.get("/stats", response_model=FiscalServiceStats)
async def get_fiscal_service_stats(
    admin_user: UserResponse = Depends(require_admin)
):
    """Get comprehensive fiscal service statistics (admin only)"""
    try:
        stats = await fiscal_service_repository.get_service_stats()
        return stats

    except Exception as e:
        logger.error(f"Error getting fiscal service stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving fiscal service statistics"
        )