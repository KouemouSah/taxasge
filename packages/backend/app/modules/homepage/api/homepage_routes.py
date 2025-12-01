"""
Homepage API Routes
Thin layer that delegates to HomepageService
"""

from fastapi import APIRouter, HTTPException, Depends, Query, status, Request
from typing import Optional
import asyncpg
import redis.asyncio as redis
from loguru import logger

from app.modules.homepage.models import (
    HomepageStats, CategoryDirectory, ServicesByTypeResponse,
    MinistryDirectory, MinistryDetails, MinistryItem,
    SearchRequest, SearchResponse, SearchResultItem, SearchFacets, FacetItem
)
import time
from app.modules.homepage.services import HomepageService
from app.modules.homepage.repositories import HomepageRepository
from app.modules.fiscal_services.models.service_details import ServiceDetailsResponse
from app.modules.fiscal_services.repositories.service_details_repository import ServiceDetailsRepository


# ============================================================================
# DEPENDENCIES
# ============================================================================

async def get_db(request: Request) -> asyncpg.Connection:
    """Get database connection from centralized connection pool"""
    from app.database.connection import get_database
    async for conn in get_database():
        yield conn


async def get_redis_optional(request: Request) -> Optional[redis.Redis]:
    """
    Get optional Redis connection from app state

    Returns None if Redis unavailable (graceful fallback)
    """
    return getattr(request.app.state, 'redis', None)


async def get_homepage_service(
    db: asyncpg.Connection = Depends(get_db),
    redis_client: Optional[redis.Redis] = Depends(get_redis_optional)
) -> HomepageService:
    """Factory for HomepageService with injected dependencies"""
    return HomepageService(db, redis_client)


# ============================================================================
# ROUTER
# ============================================================================

router = APIRouter()


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/", summary="Homepage API Info")
async def homepage_api_info():
    """
    Homepage API information and capabilities

    Returns overview of available endpoints and features
    """
    return {
        "message": "TaxasGE Homepage API",
        "version": "2.0.0",
        "description": "Provides dynamic statistics and category directory for the homepage",
        "architecture": "3-tier (models → services → repositories → api)",
        "endpoints": {
            "stats": "GET /stats - Dynamic homepage statistics (services, ministries, categories, sectors)",
            "categories": "GET /categories - Category directory with service counts and translations"
        },
        "features": {
            "optimized_queries": "Single SQL query instead of multiple round-trips (3-4x faster)",
            "multilingual": "Full support for ES/FR/EN via entity_translations table",
            "redis_caching": "Intelligent caching with TTL (30min stats, 1h categories)",
            "cache_invalidation": "Automatic invalidation on data changes",
            "active_only": "Only counts active services, ministries, categories, and sectors",
            "graceful_fallback": "Works without Redis (direct DB queries)"
        },
        "performance": {
            "stats_query_time": "~15ms (optimized CTE query)",
            "categories_query_time": "~25ms (single JOIN query)",
            "cached_response_time": "~2-5ms",
            "improvement_vs_legacy": "70-80% reduction in latency"
        },
        "cache_ttl": {
            "stats": "30 minutes",
            "categories": "1 hour per language"
        }
    }


@router.get("/stats", response_model=HomepageStats, summary="Get Homepage Statistics")
async def get_homepage_stats(
    service: HomepageService = Depends(get_homepage_service)
):
    """
    Get dynamic homepage statistics calculated from database with Redis caching

    **Returns:**
    - `total_services`: Count of active fiscal services (status = 'active')
    - `total_ministries`: Count of active ministries (is_active = true)
    - `total_categories`: Count of active categories (is_active = true)
    - `total_sectors`: Count of active sectors (is_active = true)
    - `last_updated`: ISO timestamp of when stats were calculated

    **Performance:**
    - First request (cache miss): ~15ms (single optimized CTE query)
    - Subsequent requests (cache hit): ~2-5ms
    - Cache TTL: 30 minutes

    **Cache Strategy:**
    - Cache is automatically invalidated when fiscal services, ministries, categories, or sectors are modified
    - Uses Redis if available, falls back to direct DB queries
    """
    try:
        return await service.get_stats()

    except asyncpg.PostgresError as e:
        logger.error(f"Database error in get_homepage_stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error in get_homepage_stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/categories", response_model=CategoryDirectory, summary="Get Category Directory")
async def get_category_directory(
    language: str = Query(
        "es",
        pattern="^(es|fr|en)$",
        description="Language code for translations (es=Spanish, fr=French, en=English)"
    ),
    service: HomepageService = Depends(get_homepage_service)
):
    """
    Get category directory with service counts for homepage with Redis caching

    **Returns categories sorted by service count (descending) with:**
    - Category information (name, description, icon, color) - **translated**
    - Number of active services in each category
    - Associated ministry and sector names - **translated**

    **Multilingual Support:**
    - Uses `entity_translations` table for proper i18n
    - Falls back to Spanish (name_es, description_es) if translation not available
    - Supports: `es` (Spanish), `fr` (French), `en` (English)

    **Performance:**
    - First request per language (cache miss): ~25ms (single optimized JOIN query)
    - Subsequent requests (cache hit): ~2-5ms
    - Cache TTL: 1 hour per language

    **Cache Strategy:**
    - Each language has separate cache (e.g., `homepage:categories:v2:es`)
    - Cache is automatically invalidated when categories, services, or translations are modified
    - Uses Redis if available, falls back to direct DB queries

    **Example:**
    ```
    GET /homepage/categories?language=fr
    ```
    Returns categories with French translations if available, Spanish fallback otherwise
    """
    try:
        return await service.get_category_directory(language)

    except asyncpg.PostgresError as e:
        logger.error(f"Database error in get_category_directory: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error in get_category_directory: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/services-by-type", response_model=ServicesByTypeResponse, summary="Get Services by Type")
async def get_services_by_type(
    type: str = Query(
        ...,
        description="Service type (document_processing, license_permit, residence_permit, registration_fee, inspection_fee, administrative_tax, customs_duty, declaration_tax)"
    ),
    letter: Optional[str] = Query(
        None,
        pattern="^[A-Z]$",
        description="Filter by first letter (A-Z)"
    ),
    language: str = Query(
        "es",
        pattern="^(es|fr|en)$",
        description="Language code for translations"
    ),
    limit: int = Query(
        10,
        ge=1,
        le=100,
        description="Maximum number of services to return (1-100)"
    ),
    service: HomepageService = Depends(get_homepage_service)
):
    """
    Get services filtered by service type and optionally by first letter

    **Service Types:**
    - `document_processing`: Document processing services
    - `license_permit`: License and permit services
    - `residence_permit`: Residence permit services
    - `registration_fee`: Registration fees
    - `inspection_fee`: Inspection fees
    - `administrative_tax`: Administrative taxes
    - `customs_duty`: Customs duties
    - `declaration_tax`: Declaration taxes

    **Query Parameters:**
    - `type` (required): Service type filter
    - `letter` (optional): Filter by first letter A-Z
    - `language` (optional): Language for translations (es/fr/en), default: es
    - `limit` (optional): Max results (1-100), default: 10

    **Returns:**
    - List of services matching the filters
    - Total count of services for this type/letter
    - Flag indicating if there are more results beyond the limit

    **Examples:**
    ```
    GET /homepage/services-by-type?type=document_processing
    GET /homepage/services-by-type?type=license_permit&letter=A
    GET /homepage/services-by-type?type=customs_duty&letter=C&limit=20&language=fr
    ```

    **Performance:**
    - Optimized query with translations
    - Typically returns in ~15-30ms
    """
    try:
        # Validate service type enum value
        valid_types = [
            "document_processing",
            "license_permit",
            "residence_permit",
            "registration_fee",
            "inspection_fee",
            "administrative_tax",
            "customs_duty",
            "declaration_tax"
        ]

        if type not in valid_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid service type. Must be one of: {', '.join(valid_types)}"
            )

        result = await service.get_services_by_type(
            service_type=type,
            language=language,
            letter=letter,
            limit=limit
        )

        return ServicesByTypeResponse(**result)

    except HTTPException:
        raise
    except asyncpg.PostgresError as e:
        logger.error(f"Database error in get_services_by_type: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error in get_services_by_type: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/service/{service_id}", response_model=ServiceDetailsResponse, summary="Get Service Details")
async def get_service_details(
    service_id: int,
    language: str = Query(
        "es",
        pattern="^(es|fr|en)$",
        description="Language code for translations (es=Spanish, fr=French, en=English)"
    ),
    db: asyncpg.Connection = Depends(get_db)
):
    """
    Get complete details for a specific service (workaround endpoint via homepage)

    **Returns complete service information including:**
    - Basic info (name, description, service_type, status)
    - Pricing (expedition/renewal prices, calculation method)
    - Hierarchy (ministry → sector → category)
    - Required documents with descriptions
    - Procedures with steps
    - Related services

    **Example:**
    ```
    GET /homepage/service/123?language=fr
    ```

    **Note:** This endpoint is a workaround via the homepage module while
    the fiscal-services router is being fixed.
    """
    try:
        details_repo = ServiceDetailsRepository()

        # Get main service details
        service = await details_repo.get_service_details(db, service_id, language)
        if not service:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Service with ID {service_id} not found"
            )

        # Get documents
        documents = await details_repo.get_service_documents(db, service_id, language)

        # Get procedures with steps
        procedures = await details_repo.get_service_procedures(db, service_id, language)

        # Get related services
        related = await details_repo.get_related_services(db, service_id, language)

        # Get child services if this is a parent
        children = await details_repo.get_child_services(db, service_id, language)

        # Get parent service if this is a child
        parent = None
        if service.get('parent_service_id'):
            parent = await details_repo.get_parent_service(db, service['parent_service_id'], language)

        # Build response
        expedition_price = service.get('expedition_price', 0) or 0
        renewal_price = service.get('renewal_price', 0) or 0

        response = ServiceDetailsResponse(
            id=service['id'],
            service_code=service['service_code'],
            name=service['name'],
            description=service.get('description'),
            service_type=service['service_type'],
            status=service['status'],
            pricing={
                'expedition_price': expedition_price,
                'renewal_price': renewal_price,
                'calculation_method': service.get('calculation_method', 'fixed_amount'),
                'percentage_rate': service.get('percentage_rate'),
                'unit_price': service.get('unit_price'),
                'validity_period_months': service.get('validity_period_months'),
                'renewal_frequency_months': service.get('renewal_frequency_months'),
                'currency': 'XAF'
            },
            processing_time_days=service.get('processing_time_days'),
            legal_reference=service.get('legal_reference'),
            notes=service.get('notes'),
            category={
                'id': service['category_id'],
                'category_code': service['category_code'],
                'name': service['category_name'],
                'description': service.get('category_description'),
                'icon': service.get('category_icon'),
                'color': service.get('category_color')
            } if service.get('category_id') else None,
            sector={
                'id': service['sector_id'],
                'code': service['sector_code'],
                'name': service['sector_name'],
                'description': service.get('sector_description')
            } if service.get('sector_id') else None,
            ministry={
                'id': service['ministry_id'],
                'code': service['ministry_code'],
                'name': service['ministry_name'],
                'description': service.get('ministry_description')
            } if service.get('ministry_id') else None,
            documents=documents,
            documents_count=len(documents),
            procedures=procedures,
            procedures_count=len(procedures),
            total_procedure_steps=sum(len(p.get('steps', [])) for p in procedures),
            related_services=related,
            parent_service=parent,
            child_services=children,
            keywords=[],  # Optional
            view_count=service.get('view_count', 0),
            calculation_count=service.get('calculation_count', 0),
            last_updated=service.get('last_updated'),
            has_documents=len(documents) > 0,
            has_procedures=len(procedures) > 0,
            is_free=expedition_price == 0 and renewal_price == 0,
            requires_renewal=renewal_price > 0
        )

        return response

    except HTTPException:
        raise
    except asyncpg.PostgresError as e:
        logger.error(f"Database error in get_service_details: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error in get_service_details: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


# ============================================================================
# MINISTRY ENDPOINTS
# ============================================================================

@router.get("/ministries", response_model=MinistryDirectory, summary="Get Ministry Directory")
async def get_ministry_directory(
    language: str = Query(
        "es",
        pattern="^(es|fr|en)$",
        description="Language code for translations (es=Spanish, fr=French, en=English)"
    ),
    db: asyncpg.Connection = Depends(get_db)
):
    """
    Get ministry directory with service, sector, and category counts

    **Returns ministries sorted by service count (descending) with:**
    - Ministry information (name, description, icon, color) - **translated**
    - Number of active services under this ministry
    - Number of sectors and categories

    **Multilingual Support:**
    - Uses `entity_translations` table for proper i18n
    - Falls back to Spanish (name_es, description_es) if translation not available
    - Supports: `es` (Spanish), `fr` (French), `en` (English)

    **Example:**
    ```
    GET /homepage/ministries?language=fr
    ```
    """
    try:
        repo = HomepageRepository(db)
        ministries_data = await repo.get_ministry_directory(language)

        total_services = sum(m.get('service_count', 0) for m in ministries_data)

        return MinistryDirectory(
            total_ministries=len(ministries_data),
            total_services=total_services,
            ministries=[
                MinistryItem(
                    id=m['id'],
                    ministry_code=m['ministry_code'],
                    name=m['name'],
                    description=m.get('description'),
                    icon=m.get('icon'),
                    color=m.get('color'),
                    is_active=m.get('is_active', True),
                    service_count=m.get('service_count', 0),
                    sector_count=m.get('sector_count', 0),
                    category_count=m.get('category_count', 0)
                )
                for m in ministries_data
            ]
        )

    except asyncpg.PostgresError as e:
        logger.error(f"Database error in get_ministry_directory: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error in get_ministry_directory: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/ministry/{ministry_id}", response_model=MinistryDetails, summary="Get Ministry Details")
async def get_ministry_details(
    ministry_id: int,
    language: str = Query(
        "es",
        pattern="^(es|fr|en)$",
        description="Language code for translations (es=Spanish, fr=French, en=English)"
    ),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(12, ge=1, le=50, description="Services per page"),
    db: asyncpg.Connection = Depends(get_db)
):
    """
    Get complete ministry details with paginated services

    **Returns:**
    - Ministry information (name, description, icon, color) - **translated**
    - Service, sector, and category counts
    - Paginated list of services under this ministry

    **Example:**
    ```
    GET /homepage/ministry/86?language=fr&page=1&limit=12
    ```
    """
    try:
        repo = HomepageRepository(db)
        ministry_data = await repo.get_ministry_details(ministry_id, language, page, limit)

        if not ministry_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Ministry with ID {ministry_id} not found"
            )

        return MinistryDetails(
            id=ministry_data['id'],
            ministry_code=ministry_data['ministry_code'],
            name=ministry_data['name'],
            description=ministry_data.get('description'),
            icon=ministry_data.get('icon'),
            color=ministry_data.get('color'),
            is_active=ministry_data.get('is_active', True),
            service_count=ministry_data.get('service_count', 0),
            sector_count=ministry_data.get('sector_count', 0),
            category_count=ministry_data.get('category_count', 0),
            services=[
                {
                    'id': s['id'],
                    'service_code': s['service_code'],
                    'name': s['name'],
                    'description': s.get('description'),
                    'expedition_price': float(s.get('expedition_price', 0) or 0),
                    'renewal_price': float(s.get('renewal_price', 0) or 0),
                    'category_name': s.get('category_name'),
                    'sector_name': s.get('sector_name'),
                    'service_type': s['service_type']
                }
                for s in ministry_data.get('services', [])
            ],
            total_pages=ministry_data.get('total_pages', 1),
            current_page=ministry_data.get('current_page', 1)
        )

    except HTTPException:
        raise
    except asyncpg.PostgresError as e:
        logger.error(f"Database error in get_ministry_details: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error in get_ministry_details: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


# ============================================================================
# SEARCH ENDPOINT
# ============================================================================

@router.post("/search", response_model=SearchResponse, summary="Search Services")
async def search_services(
    request: SearchRequest,
    db: asyncpg.Connection = Depends(get_db)
):
    """
    Search fiscal services with filters, pagination, and facets

    **Request Body:**
    - `q`: Search query (optional)
    - `category_id` or `category_code`: Filter by category
    - `ministry_id`: Filter by ministry
    - `service_type`: Filter by service type
    - `min_price` / `max_price`: Price range filter
    - `sort_by`: relevance, name, price
    - `sort_order`: asc, desc
    - `page`: Page number (1-based)
    - `limit`: Results per page (1-100)
    - `include_facets`: Include facets for filtering
    - `language`: Language code (es, fr, en)

    **Example:**
    ```json
    {
      "q": "permiso",
      "ministry_id": 86,
      "sort_by": "name",
      "sort_order": "asc",
      "page": 1,
      "limit": 20,
      "include_facets": true,
      "language": "es"
    }
    ```
    """
    start_time = time.time()

    try:
        repo = HomepageRepository(db)

        # Perform search
        search_result = await repo.search_services(
            q=request.q,
            category_id=request.category_id,
            category_code=request.category_code,
            ministry_id=request.ministry_id,
            service_type=request.service_type,
            min_price=request.min_price,
            max_price=request.max_price,
            calculation_methods=request.calculation_methods,
            sort_by=request.sort_by,
            sort_order=request.sort_order,
            page=request.page,
            limit=request.limit,
            language=request.language
        )

        # Get facets if requested (with cascade filtering)
        facets = None
        if request.include_facets:
            facets_data = await repo.get_search_facets(
                language=request.language,
                ministry_id=request.ministry_id,
                category_code=request.category_code
            )
            facets = SearchFacets(
                categories=[
                    FacetItem(id=f.get('id'), code=f.get('code'), name=f.get('name'), count=f.get('count', 0))
                    for f in facets_data.get('categories', [])
                ],
                ministries=[
                    FacetItem(id=f.get('id'), code=f.get('code'), name=f.get('name'), count=f.get('count', 0))
                    for f in facets_data.get('ministries', [])
                ],
                service_types=[
                    FacetItem(type=f.get('type'), count=f.get('count', 0))
                    for f in facets_data.get('service_types', [])
                ],
                price_ranges=[]
            )

        execution_time = (time.time() - start_time) * 1000  # Convert to ms

        return SearchResponse(
            success=True,
            query=request.q or "",
            total_results=search_result['total_results'],
            page=search_result['page'],
            limit=search_result['limit'],
            total_pages=search_result['total_pages'],
            results=[
                SearchResultItem(
                    id=r['id'],
                    name=r['name'],
                    description=r.get('description'),
                    category_name=r.get('category_name', 'Sin categoría'),
                    ministry_name=r.get('ministry_name'),
                    sector_name=r.get('sector_name'),
                    service_type=r['service_type'],
                    expedition_price=r.get('expedition_price', 0),
                    renewal_price=r.get('renewal_price', 0),
                    processing_time_days=r.get('processing_time_days', 30),
                    status=r.get('status', 'active'),
                    calculation_method=r.get('calculation_method', 'fixed_expedition')
                )
                for r in search_result['results']
            ],
            facets=facets,
            suggestions=[],
            execution_time_ms=execution_time,
            cached=False
        )

    except asyncpg.PostgresError as e:
        logger.error(f"Database error in search_services: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error in search_services: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


# ========== DEBUG ENDPOINT - TO REMOVE AFTER TESTING ==========

@router.get("/debug/translations/{template_code}")
async def debug_translations(
    template_code: str,
    language: str = Query("fr", description="Language code"),
    db: asyncpg.Connection = Depends(get_db),
):
    """
    Debug endpoint to check translations for a procedure template.
    Returns all entity_translations matching the template_code pattern.
    """
    query = """
        SELECT entity_type, entity_code, language_code, field_name,
               LEFT(translation_text, 100) as translation_preview
        FROM entity_translations
        WHERE (entity_code LIKE $1 OR entity_code = $2)
        AND language_code = $3
        ORDER BY entity_type, entity_code
    """

    rows = await db.fetch(query, f"{template_code}%", template_code, language)

    # Also get the procedure template info
    proc_query = """
        SELECT pt.id, pt.template_code, pt.name_es, pts.step_number, pts.description_es
        FROM procedure_templates pt
        LEFT JOIN procedure_template_steps pts ON pts.template_id = pt.id
        WHERE pt.template_code = $1
        ORDER BY pts.step_number
    """
    proc_rows = await db.fetch(proc_query, template_code)

    # Check ALL translations for procedure_step entity type
    all_proc_step_query = """
        SELECT entity_code, field_name, LEFT(translation_text, 50) as preview
        FROM entity_translations
        WHERE entity_type = 'procedure_step'
        AND language_code = $1
        LIMIT 20
    """
    all_proc_steps = await db.fetch(all_proc_step_query, language)

    return {
        "template_code": template_code,
        "language": language,
        "translations_found": len(rows),
        "translations": [dict(r) for r in rows],
        "procedure_template": [dict(r) for r in proc_rows],
        "expected_entity_codes": [
            f"{template_code}_{r['step_number']}" for r in proc_rows if r['step_number']
        ] if proc_rows else [],
        "sample_procedure_step_translations": [dict(r) for r in all_proc_steps]
    }
