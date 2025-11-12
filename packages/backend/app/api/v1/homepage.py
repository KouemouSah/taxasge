"""
🏠 TaxasGE Homepage API
Provides dynamic statistics and category directory for the homepage
All data is calculated from PostgreSQL database, not static values
"""

from fastapi import APIRouter, HTTPException, Depends, Query, status
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
from loguru import logger
import asyncpg

# Create router
router = APIRouter()


# Response Models
class HomepageStats(BaseModel):
    """Dynamic homepage statistics calculated from database"""
    total_services: int = Field(..., description="Total number of active fiscal services")
    total_ministries: int = Field(..., description="Total number of active ministries")
    total_categories: int = Field(..., description="Total number of active categories")
    total_sectors: int = Field(..., description="Total number of active sectors")
    last_updated: str = Field(..., description="ISO timestamp of when stats were calculated")


class CategoryWithServices(BaseModel):
    """Category with service count"""
    id: int = Field(..., description="Category ID")
    category_code: str = Field(..., description="Category code")
    name_es: str = Field(..., description="Category name in Spanish")
    description_es: Optional[str] = Field(None, description="Category description in Spanish")
    icon: Optional[str] = Field(None, description="Category icon")
    color: Optional[str] = Field(None, description="Category color")
    service_count: int = Field(..., description="Number of active services in this category")
    ministry_name: Optional[str] = Field(None, description="Associated ministry name")
    sector_name: Optional[str] = Field(None, description="Associated sector name")


class CategoryDirectory(BaseModel):
    """Category directory response"""
    total_categories: int = Field(..., description="Total number of categories")
    total_services: int = Field(..., description="Total number of services across all categories")
    categories: List[CategoryWithServices] = Field(..., description="List of categories with service counts")
    last_updated: str = Field(..., description="ISO timestamp")


# Import get_db dependency from main
# Note: This import is done at the function level to avoid circular import issues
def get_db_dependency():
    """Lazy import of get_db to avoid circular imports"""
    from app.main import get_db
    return get_db


# API Endpoints

@router.get("/stats", response_model=HomepageStats)
async def get_homepage_stats(db: asyncpg.Connection = Depends(get_db_dependency())):
    """
    Get dynamic homepage statistics calculated from database

    Returns:
    - total_services: Count of active fiscal services (status = 'active')
    - total_ministries: Count of active ministries (is_active = true)
    - total_categories: Count of active categories (is_active = true)
    - total_sectors: Count of active sectors (is_active = true)

    All values are calculated in real-time from PostgreSQL, not static.
    """
    try:
        start_time = datetime.now()

        # Query 1: Count active fiscal services
        # CRITICAL: Only count services where status = 'active'
        services_query = """
            SELECT COUNT(*) as total
            FROM fiscal_services
            WHERE status = 'active'::service_status_enum
        """
        services_count = await db.fetchval(services_query)

        # Query 2: Count active ministries
        ministries_query = """
            SELECT COUNT(*) as total
            FROM ministries
            WHERE is_active = true
        """
        ministries_count = await db.fetchval(ministries_query)

        # Query 3: Count active categories
        categories_query = """
            SELECT COUNT(*) as total
            FROM categories
            WHERE is_active = true
        """
        categories_count = await db.fetchval(categories_query)

        # Query 4: Count active sectors
        sectors_query = """
            SELECT COUNT(*) as total
            FROM sectors
            WHERE is_active = true
        """
        sectors_count = await db.fetchval(sectors_query)

        execution_time = (datetime.now() - start_time).total_seconds() * 1000

        logger.info(
            f"Homepage stats calculated: services={services_count}, "
            f"ministries={ministries_count}, categories={categories_count}, "
            f"sectors={sectors_count}, time={execution_time:.2f}ms"
        )

        return HomepageStats(
            total_services=services_count or 0,
            total_ministries=ministries_count or 0,
            total_categories=categories_count or 0,
            total_sectors=sectors_count or 0,
            last_updated=datetime.utcnow().isoformat()
        )

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


@router.get("/categories", response_model=CategoryDirectory)
async def get_category_directory(
    db: asyncpg.Connection = Depends(get_db_dependency()),
    language: str = Query("es", pattern="^(es|fr|en)$", description="Language code")
):
    """
    Get category directory with service counts for homepage

    Returns categories sorted by service count (descending) with:
    - Category information (name, description, icon, color)
    - Number of active services in each category
    - Associated ministry and sector names

    Service counts are calculated dynamically from active fiscal services only.
    """
    try:
        start_time = datetime.now()

        # Complex query to get categories with service counts
        # CRITICAL: Only count services where status = 'active'
        # Join with ministries and sectors for additional context
        query = """
            SELECT
                c.id,
                c.category_code,
                c.name_es,
                c.description_es,
                c.icon,
                c.color,
                c.ministry_id,
                c.sector_id,
                m.name_es as ministry_name,
                s.name_es as sector_name,
                COUNT(fs.id) as service_count
            FROM categories c
            LEFT JOIN ministries m ON c.ministry_id = m.id
            LEFT JOIN sectors s ON c.sector_id = s.id
            LEFT JOIN fiscal_services fs ON fs.category_id = c.id
                AND fs.status = 'active'::service_status_enum
            WHERE c.is_active = true
            GROUP BY c.id, c.category_code, c.name_es, c.description_es,
                     c.icon, c.color, c.ministry_id, c.sector_id,
                     m.name_es, s.name_es
            ORDER BY service_count DESC, c.name_es ASC
        """

        rows = await db.fetch(query)

        # Build category list
        categories = []
        total_services = 0

        for row in rows:
            service_count = row['service_count'] or 0
            total_services += service_count

            categories.append(CategoryWithServices(
                id=row['id'],
                category_code=row['category_code'],
                name_es=row['name_es'],
                description_es=row['description_es'],
                icon=row['icon'],
                color=row['color'],
                service_count=service_count,
                ministry_name=row['ministry_name'],
                sector_name=row['sector_name']
            ))

        execution_time = (datetime.now() - start_time).total_seconds() * 1000

        logger.info(
            f"Category directory generated: {len(categories)} categories, "
            f"{total_services} total services, time={execution_time:.2f}ms"
        )

        return CategoryDirectory(
            total_categories=len(categories),
            total_services=total_services,
            categories=categories,
            last_updated=datetime.utcnow().isoformat()
        )

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


@router.get("/")
async def homepage_api_info():
    """Homepage API information"""
    return {
        "message": "TaxasGE Homepage API",
        "version": "1.0.0",
        "description": "Provides dynamic statistics and category directory for the homepage",
        "endpoints": {
            "stats": "GET /stats - Dynamic homepage statistics (services, ministries, categories, sectors)",
            "categories": "GET /categories - Category directory with service counts"
        },
        "features": {
            "dynamic_calculation": "All statistics calculated from PostgreSQL in real-time",
            "active_only": "Only counts active services, ministries, categories, and sectors",
            "error_handling": "Comprehensive error handling with detailed logging",
            "performance": "Optimized queries with proper indexing"
        },
        "note": "All values are calculated dynamically. No static/hardcoded values."
    }
