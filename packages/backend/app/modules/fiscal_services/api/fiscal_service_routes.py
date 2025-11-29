"""Fiscal Service Routes - 850 tax services catalog API"""

from fastapi import APIRouter, HTTPException, Depends, status, Query
from fastapi.security import HTTPBearer
from typing import Dict, Any, List
from loguru import logger
import time

from app.modules.fiscal_services.models import (
    MinistryResponse,
    SectorResponse,
    CategoryResponse,
    FiscalServiceCreate,
    FiscalServiceUpdate,
    FiscalServiceResponse,
    FiscalServiceListResponse,
    FiscalServiceSearchRequest,
    CalculateServiceRequest,
    CalculateServiceResponse,
    FiscalServiceStats,
)
from app.modules.fiscal_services.models.search import (
    SearchDBRequest,
    SearchDBResponse,
    ServiceResultItem,
    SearchFacets,
    FacetItem,
)
from app.modules.fiscal_services.models.service_details import (
    ServiceDetailsResponse,
    DocumentDetailItem,
    ProcedureDetailItem,
    ProcedureStepDetailItem,
    CategoryDetailItem,
    SectorDetailItem,
    MinistryDetailItem,
    PricingInfo,
    RelatedServiceItem,
    KeywordItem,
)
from app.modules.fiscal_services.repositories import FiscalServiceRepository
from app.modules.fiscal_services.repositories.search_repository import SearchRepository
from app.modules.fiscal_services.repositories.service_details_repository import ServiceDetailsRepository
from app.modules.fiscal_services.services import CalculationService
from app.modules.auth.middleware.auth_middleware import get_current_user
from app.modules.permissions.middleware.permission_middleware import require_permission
from app.database.connection import get_database

router = APIRouter(tags=["Fiscal Services"])
security = HTTPBearer()
repository = FiscalServiceRepository()
search_repository = SearchRepository()
details_repository = ServiceDetailsRepository()
calculation_service = CalculationService()


# ========== HIERARCHY ENDPOINTS ==========

@router.get("/ministries", response_model=List[MinistryResponse])
async def list_ministries(db=Depends(get_database)):
    """List all ministries (Ministères)"""
    ministries = await repository.list_ministries(db)
    return [MinistryResponse(**m) for m in ministries]


@router.get("/sectors", response_model=List[SectorResponse])
async def list_sectors(
    ministry_id: str = Query(None, description="Filter by ministry"),
    db=Depends(get_database),
):
    """List sectors (Secteurs), optionally filtered by ministry"""
    sectors = await repository.list_sectors(db, ministry_id)
    return [SectorResponse(**s) for s in sectors]


@router.get("/categories", response_model=List[CategoryResponse])
async def list_categories(
    sector_id: str = Query(None, description="Filter by sector"),
    db=Depends(get_database),
):
    """List categories (Catégories), optionally filtered by sector"""
    categories = await repository.list_categories(db, sector_id)
    return [CategoryResponse(**c) for c in categories]


# ========== FISCAL SERVICES PUBLIC ENDPOINTS ==========

@router.get("", response_model=FiscalServiceListResponse)
async def list_fiscal_services(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    category_id: str = Query(None, description="Filter by category"),
    is_active: bool = Query(True, description="Filter by active status"),
    db=Depends(get_database),
):
    """List fiscal services with pagination"""
    offset = (page - 1) * page_size
    services, total = await repository.list(db, category_id, is_active, page_size, offset)
    return FiscalServiceListResponse(
        services=[FiscalServiceResponse(**s) for s in services],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{service_id}", response_model=FiscalServiceResponse)
async def get_fiscal_service(service_id: str, db=Depends(get_database)):
    """Get fiscal service by ID"""
    service = await repository.get_by_id(db, service_id)
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    return FiscalServiceResponse(**service)


@router.get("/{service_id}/details", response_model=ServiceDetailsResponse)
async def get_service_details(
    service_id: int,
    language: str = Query("es", pattern="^(es|fr|en)$", description="Language for translations"),
    include_related: bool = Query(True, description="Include related services"),
    include_keywords: bool = Query(False, description="Include search keywords"),
    db=Depends(get_database),
):
    """
    Get complete service details with documents, procedures, and related info

    This endpoint provides:
    - Full service information with translations
    - Required documents list with details
    - Procedures with all steps
    - Pricing information (expedition/renewal)
    - Category, sector, ministry hierarchy
    - Related services in same category
    - Parent and child services (if any)
    - Keywords (optional, for SEO)

    **Used by:** Frontend /services/[id] page
    """
    try:
        # Get main service details
        service = await details_repository.get_service_details(db, service_id, language)
        if not service:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Service with ID {service_id} not found"
            )

        # Get documents
        documents = await details_repository.get_service_documents(db, service_id, language)

        # Get procedures
        procedures = await details_repository.get_service_procedures(db, service_id, language)

        # Calculate total procedure steps
        total_steps = sum(len(p.get("steps", [])) for p in procedures)

        # Get related services
        related_services = []
        parent_service = None
        child_services = []

        if include_related and service.get("category_id"):
            related_services = await details_repository.get_related_services(
                db, service_id, service["category_id"], language
            )

        # Get parent service if exists
        if service.get("parent_service_id"):
            parent_service = await details_repository.get_parent_service(
                db, service["parent_service_id"], language
            )

        # Get child services
        child_services = await details_repository.get_child_services(db, service_id, language)

        # Get keywords if requested
        keywords = []
        if include_keywords:
            keywords = await details_repository.get_service_keywords(db, service_id)

        # Build pricing info
        expedition_price = service.get("expedition_price", 0) or 0
        renewal_price = service.get("renewal_price", 0) or 0
        pricing = PricingInfo(
            expedition_price=expedition_price,
            renewal_price=renewal_price,
            calculation_method=service.get("calculation_method", "fixed_both"),
            percentage_rate=service.get("percentage_rate"),
            unit_price=service.get("unit_price"),
            validity_period_months=service.get("validity_period_months"),
            renewal_frequency_months=service.get("renewal_frequency_months"),
            currency="XAF",
        )

        # Build category
        category = None
        if service.get("category_id"):
            category = CategoryDetailItem(
                id=service["category_id"],
                category_code=service.get("category_code", ""),
                name=service.get("category_name", ""),
                description=service.get("category_description"),
                icon=service.get("category_icon"),
                color=service.get("category_color"),
            )

        # Build sector
        sector = None
        if service.get("sector_id"):
            sector = SectorDetailItem(
                id=service["sector_id"],
                code=service.get("sector_code", ""),
                name=service.get("sector_name", ""),
                description=service.get("sector_description"),
            )

        # Build ministry
        ministry = None
        if service.get("ministry_id"):
            ministry = MinistryDetailItem(
                id=service["ministry_id"],
                code=service.get("ministry_code", ""),
                name=service.get("ministry_name", ""),
                description=service.get("ministry_description"),
            )

        # Build response
        return ServiceDetailsResponse(
            id=service["id"],
            service_code=service.get("service_code", ""),
            name=service.get("name", ""),
            description=service.get("description"),
            service_type=service.get("service_type", ""),
            status=service.get("status", "active"),
            pricing=pricing,
            processing_time_days=service.get("processing_time_days"),
            legal_reference=service.get("legal_reference"),
            notes=service.get("notes"),
            category=category,
            sector=sector,
            ministry=ministry,
            documents=[DocumentDetailItem(**d) for d in documents],
            documents_count=len(documents),
            procedures=[
                ProcedureDetailItem(
                    id=p["id"],
                    template_code=p.get("template_code", ""),
                    name=p.get("name", ""),
                    description=p.get("description"),
                    category=p.get("category"),
                    applies_to=p.get("applies_to"),
                    display_order=p.get("display_order", 1),
                    custom_notes=p.get("custom_notes"),
                    steps=[ProcedureStepDetailItem(**s) for s in p.get("steps", [])],
                    total_estimated_minutes=p.get("total_estimated_minutes", 0),
                )
                for p in procedures
            ],
            procedures_count=len(procedures),
            total_procedure_steps=total_steps,
            related_services=[RelatedServiceItem(**r) for r in related_services],
            parent_service=RelatedServiceItem(**parent_service) if parent_service else None,
            child_services=[RelatedServiceItem(**c) for c in child_services],
            keywords=[KeywordItem(**k) for k in keywords],
            view_count=service.get("view_count", 0) or 0,
            calculation_count=service.get("calculation_count", 0) or 0,
            last_updated=service.get("last_updated"),
            has_documents=len(documents) > 0,
            has_procedures=len(procedures) > 0,
            is_free=expedition_price == 0 and renewal_price == 0,
            requires_renewal=service.get("renewal_frequency_months") is not None,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching service details for {service_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching service details: {str(e)}"
        )


@router.post("/search", response_model=FiscalServiceListResponse)
async def search_fiscal_services(
    search: FiscalServiceSearchRequest,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db=Depends(get_database),
):
    """Advanced search for fiscal services"""
    offset = (page - 1) * page_size
    services, total = await repository.search(db, search, page_size, offset)
    return FiscalServiceListResponse(
        services=[FiscalServiceResponse(**s) for s in services],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("/search-db", response_model=SearchDBResponse)
async def search_services_db(
    request: SearchDBRequest,
    db=Depends(get_database),
):
    """
    Advanced search for fiscal services with facets (Public endpoint for Services page)

    This endpoint provides:
    - Full-text search across service names, descriptions, and keywords
    - Filtering by category, ministry, service type, and price ranges
    - Faceted search results for dynamic filtering UI
    - Multilingual support (es, fr, en)
    - Pagination and sorting

    **Used by:** Frontend /services page
    """
    start_time = time.time()

    try:
        # Search services
        results, total = await search_repository.search_services(
            conn=db,
            q=request.q,
            category_id=request.category_id,
            category_code=request.category_code,
            ministry_id=request.ministry_id,
            service_type=request.service_type,
            min_price=request.min_price,
            max_price=request.max_price,
            min_expedition_price=request.min_expedition_price,
            max_expedition_price=request.max_expedition_price,
            min_renewal_price=request.min_renewal_price,
            max_renewal_price=request.max_renewal_price,
            sort_by=request.sort_by.value,
            sort_order=request.sort_order.value,
            page=request.page,
            limit=request.limit,
            language=request.language,
        )

        # Get facets if requested
        facets = None
        if request.include_facets:
            facets_data = await search_repository.get_facets(db, request.language)
            facets = SearchFacets(
                categories=[FacetItem(**f) for f in facets_data["categories"]],
                ministries=[FacetItem(**f) for f in facets_data["ministries"]],
                service_types=[FacetItem(**f) for f in facets_data["service_types"]],
                price_ranges=[FacetItem(**f) for f in facets_data["price_ranges"]],
            )

        # Get suggestions
        suggestions = await search_repository.get_suggestions(db, request.q, request.language)

        # Calculate execution time
        execution_time_ms = (time.time() - start_time) * 1000

        # Calculate total pages
        total_pages = (total + request.limit - 1) // request.limit if total > 0 else 0

        return SearchDBResponse(
            success=True,
            query=request.q or "",
            total_results=total,
            page=request.page,
            limit=request.limit,
            total_pages=total_pages,
            results=[ServiceResultItem(**r) for r in results],
            facets=facets,
            suggestions=suggestions,
            execution_time_ms=round(execution_time_ms, 2),
            cached=False,
        )

    except Exception as e:
        logger.error(f"Search-db error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {str(e)}"
        )


@router.get("/popular/list", response_model=List[FiscalServiceResponse])
async def get_popular_services(
    limit: int = Query(10, ge=1, le=50, description="Number of popular services"),
    db=Depends(get_database),
):
    """Get most used fiscal services"""
    services = await repository.get_popular(db, limit)
    return [FiscalServiceResponse(**s) for s in services]


@router.get("/recent/list", response_model=List[FiscalServiceResponse])
async def get_recent_services(
    limit: int = Query(10, ge=1, le=50, description="Number of recent services"),
    db=Depends(get_database),
):
    """Get recently used fiscal services"""
    services = await repository.get_recent(db, limit)
    return [FiscalServiceResponse(**s) for s in services]


@router.post("/calculate", response_model=CalculateServiceResponse)
async def calculate_service_amount(
    request: CalculateServiceRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_database),
):
    """Calculate amount for a fiscal service"""
    user_id = current_user["sub"]

    # Verify service exists
    service = await repository.get_by_id(db, request.fiscal_service_id)
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")

    try:
        # Calculate
        result = await calculation_service.calculate(db, request.fiscal_service_id, request.input_data)

        # Increment usage counter
        await repository.increment_usage(db, request.fiscal_service_id)

        logger.info(f"User {user_id} calculated service {request.fiscal_service_id}")
        return CalculateServiceResponse(**result, created_at=result.get("created_at"))

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ========== ADMIN ENDPOINTS ==========

@router.post("/admin/services", response_model=FiscalServiceResponse, status_code=status.HTTP_201_CREATED)
async def create_fiscal_service(
    service: FiscalServiceCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_database),
    _: None = Depends(require_permission("fiscal_services.create"))
):
    """Create new fiscal service - Requires fiscal_services.create permission"""
    user_id = current_user["sub"]

    # Check if code already exists
    existing = await repository.get_by_code(db, service.code)
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Service code already exists")

    result = await repository.create(db, service)
    logger.info(f"Admin {user_id} created fiscal service {result['id']}")
    return FiscalServiceResponse(**result)


@router.put("/admin/services/{service_id}", response_model=FiscalServiceResponse)
async def update_fiscal_service(
    service_id: str,
    update_data: FiscalServiceUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_database),
    _: None = Depends(require_permission("fiscal_services.update"))
):
    """Update fiscal service - Requires fiscal_services.update permission"""
    user_id = current_user["sub"]

    updated = await repository.update(db, service_id, update_data)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")

    logger.info(f"Admin {user_id} updated fiscal service {service_id}")
    return FiscalServiceResponse(**updated)


@router.delete("/admin/services/{service_id}", status_code=status.HTTP_200_OK)
async def delete_fiscal_service(
    service_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_database),
    _: None = Depends(require_permission("fiscal_services.delete"))
):
    """Delete fiscal service - Requires fiscal_services.delete permission"""
    user_id = current_user["sub"]

    deleted = await repository.delete(db, service_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")

    logger.info(f"Admin {user_id} deleted fiscal service {service_id}")
    return {"message": "Fiscal service deleted successfully"}


# ========== STATISTICS & ADMIN UTILITIES ==========

@router.get("/admin/stats", response_model=FiscalServiceStats)
async def get_fiscal_services_statistics(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_database),
    _: None = Depends(require_permission("fiscal_services.view_stats"))
):
    """
    Get comprehensive fiscal services statistics

    Requires fiscal_services.view_stats permission

    **Migrated from legacy /api/v1/taxes/stats/overview**

    Returns:
        - Total services count
        - Active/inactive breakdown
        - Services by type, category, ministry, status
        - Average processing time
        - Most used services (top 10)
        - Total calculations and views
    """
    user_id = current_user["sub"]

    try:
        stats = await repository.get_statistics(db)

        logger.info(f"Admin {user_id} retrieved fiscal services statistics")
        return FiscalServiceStats(**stats)

    except Exception as e:
        logger.error(f"Error getting fiscal services statistics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving statistics: {str(e)}"
        )


@router.post("/admin/bulk/import", status_code=status.HTTP_201_CREATED)
async def bulk_import_fiscal_services(
    services: List[FiscalServiceCreate],
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_database),
    _: None = Depends(require_permission("fiscal_services.bulk_import"))
):
    """
    Bulk import fiscal services

    Requires fiscal_services.bulk_import permission

    **Migrated from legacy /api/v1/taxes/bulk/import**

    Limits:
        - Maximum 100 services per request

    Returns:
        - successful_imports: Number of successfully imported services
        - failed_imports: Number of failed imports
        - Details of failed services
    """
    user_id = current_user["sub"]

    if len(services) > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bulk import limited to 100 services per request"
        )

    try:
        results = await repository.bulk_create(db, services, user_id)

        logger.info(
            f"Admin {user_id} bulk imported {results['successful']}/{len(services)} services"
        )

        return {
            "success": True,
            "total_processed": len(services),
            "successful_imports": results["successful"],
            "failed_imports": results["failed"],
            "failed_services": results.get("errors", []),
            "message": f"Successfully imported {results['successful']}/{len(services)} services"
        }

    except Exception as e:
        logger.error(f"Error in bulk import: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing bulk import: {str(e)}"
        )


@router.post("/admin/bulk/update-status")
async def bulk_update_service_status(
    service_ids: List[str],
    new_status: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_database),
    _: None = Depends(require_permission("fiscal_services.bulk_update"))
):
    """
    Bulk update service status

    Requires fiscal_services.bulk_update permission

    **Migrated from legacy /api/v1/taxes/bulk/update-status**

    Limits:
        - Maximum 50 services per request

    Args:
        service_ids: List of service IDs to update
        new_status: New status (active, inactive, deprecated, under_review)

    Returns:
        - updated_count: Number of successfully updated services
        - failed_updates: Number of failed updates
    """
    user_id = current_user["sub"]

    if len(service_ids) > 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bulk status update limited to 50 services per request"
        )

    # Validate status
    from app.modules.fiscal_services.models import ServiceStatusEnum
    try:
        status_enum = ServiceStatusEnum(new_status)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status: {new_status}. Valid values: {[s.value for s in ServiceStatusEnum]}"
        )

    try:
        results = await repository.bulk_update_status(db, service_ids, status_enum, user_id)

        logger.info(
            f"Admin {user_id} bulk updated status for {results['updated']}/{len(service_ids)} services to {new_status}"
        )

        return {
            "success": True,
            "total_requested": len(service_ids),
            "updated_count": results["updated"],
            "failed_updates": results["failed"],
            "new_status": new_status,
            "message": f"Successfully updated {results['updated']}/{len(service_ids)} services"
        }

    except Exception as e:
        logger.error(f"Error in bulk status update: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing bulk update: {str(e)}"
        )


# ========== DEBUG ENDPOINT - TO REMOVE AFTER TESTING ==========

@router.get("/debug/translations/{template_code}")
async def debug_translations(
    template_code: str,
    language: str = Query("fr", description="Language code"),
    db=Depends(get_database),
):
    """
    Debug endpoint to check translations for a procedure template.
    Returns all entity_translations matching the template_code pattern.
    """
    query = """
        SELECT entity_type, entity_code, language_code, field_name, translation_text
        FROM entity_translations
        WHERE (entity_code LIKE $1 OR entity_code = $2)
        AND language_code = $3
        ORDER BY entity_type, entity_code
    """

    async with db.acquire() as conn:
        rows = await conn.fetch(query, f"{template_code}%", template_code, language)

        # Also get the procedure template info
        proc_query = """
            SELECT pt.id, pt.template_code, pt.name_es, pts.step_number, pts.description_es
            FROM procedure_templates pt
            LEFT JOIN procedure_template_steps pts ON pts.template_id = pt.id
            WHERE pt.template_code = $1
            ORDER BY pts.step_number
        """
        proc_rows = await conn.fetch(proc_query, template_code)

        return {
            "translations_found": len(rows),
            "translations": [dict(r) for r in rows],
            "procedure_template": [dict(r) for r in proc_rows],
            "expected_entity_codes": [
                f"{template_code}_{r['step_number']}" for r in proc_rows if r['step_number']
            ] if proc_rows else []
        }
