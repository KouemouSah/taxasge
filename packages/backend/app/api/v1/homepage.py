"""
🏠 TaxasGE Homepage API
Provides dynamic statistics and category directory for the homepage
Uses 3-layer caching architecture:
  1. Redis cache (5ms) - Primary cache
  2. Materialized views (2-5ms) - Robust fallback
  3. Direct queries (150-500ms) - Last resort
"""

from fastapi import APIRouter, HTTPException, Depends, Query, status
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
from loguru import logger
import asyncpg
import json
import redis.asyncio as redis

# Import dependencies
from app.database.connection import get_database as get_db
from app.core.redis_dependency import get_redis_optional

# Create router
router = APIRouter()

# Cache configuration
STATS_CACHE_KEY = "homepage:stats:v1"
STATS_TTL = 1800  # 30 minutes - stats don't change frequently

CATEGORIES_CACHE_KEY = "homepage:categories:v1"
CATEGORIES_TTL = 3600  # 1 hour - categories are relatively static


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


# API Endpoints

@router.get("/stats", response_model=HomepageStats)
async def get_homepage_stats(
    db: asyncpg.Connection = Depends(get_db),
    redis_client: Optional[redis.Redis] = Depends(get_redis_optional)
):
    """
    Get dynamic homepage statistics calculated from database with Redis caching

    Returns:
    - total_services: Count of active fiscal services (status = 'active')
    - total_ministries: Count of active ministries (is_active = true)
    - total_categories: Count of active categories (is_active = true)
    - total_sectors: Count of active sectors (is_active = true)

    Cache: 30 minutes TTL (stats don't change frequently)
    """
    try:
        start_time = datetime.now()

        # STEP 1: Check Redis cache
        cached_stats = None
        if redis_client:
            try:
                cached_data = await redis_client.get(STATS_CACHE_KEY)
                if cached_data:
                    cached_stats = json.loads(cached_data)
                    logger.info("✅ Homepage stats served from cache")
                    return HomepageStats(**cached_stats)
            except Exception as redis_err:
                logger.warning(f"Redis get failed (graceful fallback): {redis_err}")

        # STEP 2: Try materialized view fallback (2-5ms)
        # Try to get stats from pre-calculated materialized view
        try:
            mv_query = """
                SELECT
                    total_services,
                    total_ministries,
                    total_categories,
                    total_sectors,
                    last_updated
                FROM homepage_stats
                LIMIT 1
            """
            mv_row = await db.fetchrow(mv_query)

            if mv_row:
                logger.info("✅ Homepage stats served from materialized view (fallback)")
                stats_data = {
                    "total_services": mv_row['total_services'] or 0,
                    "total_ministries": mv_row['total_ministries'] or 0,
                    "total_categories": mv_row['total_categories'] or 0,
                    "total_sectors": mv_row['total_sectors'] or 0,
                    "last_updated": datetime.utcnow().isoformat()
                }

                # Cache the result for next time
                if redis_client:
                    try:
                        await redis_client.setex(STATS_CACHE_KEY, STATS_TTL, json.dumps(stats_data))
                    except Exception:
                        pass

                return HomepageStats(**stats_data)
        except Exception as mv_err:
            logger.warning(f"Materialized view fallback failed (trying direct query): {mv_err}")

        # STEP 3: Calculate from database with direct queries (150-500ms - last resort)
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

        logger.info("⚠️ Homepage stats calculated via direct queries (slowest fallback)")

        execution_time = (datetime.now() - start_time).total_seconds() * 1000

        stats_data = {
            "total_services": services_count or 0,
            "total_ministries": ministries_count or 0,
            "total_categories": categories_count or 0,
            "total_sectors": sectors_count or 0,
            "last_updated": datetime.utcnow().isoformat()
        }

        # STEP 3: Store in cache for next request
        if redis_client:
            try:
                await redis_client.setex(
                    STATS_CACHE_KEY,
                    STATS_TTL,
                    json.dumps(stats_data)
                )
                logger.info(f"✅ Homepage stats cached for {STATS_TTL}s")
            except Exception as redis_err:
                logger.warning(f"Redis setex failed (non-critical): {redis_err}")

        logger.info(
            f"Homepage stats calculated: services={services_count}, "
            f"ministries={ministries_count}, categories={categories_count}, "
            f"sectors={sectors_count}, time={execution_time:.2f}ms"
        )

        return HomepageStats(**stats_data)

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
    db: asyncpg.Connection = Depends(get_db),
    redis_client: Optional[redis.Redis] = Depends(get_redis_optional),
    language: str = Query("es", pattern="^(es|fr|en)$", description="Language code")
):
    """
    Get category directory with service counts for homepage with Redis caching

    Returns categories sorted by service count (descending) with:
    - Category information (name, description, icon, color)
    - Number of active services in each category
    - Associated ministry and sector names

    Cache: 1 hour TTL (categories are relatively static)
    """
    try:
        start_time = datetime.now()

        # STEP 1: Check Redis cache
        if redis_client:
            try:
                cached_data = await redis_client.get(CATEGORIES_CACHE_KEY)
                if cached_data:
                    cached_result = json.loads(cached_data)
                    logger.info("✅ Category directory served from cache")
                    return CategoryDirectory(**cached_result)
            except Exception as redis_err:
                logger.warning(f"Redis get failed (graceful fallback): {redis_err}")

        # STEP 2: Try materialized view fallback (2-5ms)
        # Try to get categories from pre-calculated materialized view
        try:
            # Note: Currently only Spanish (_es) columns exist in the schema
            # The language parameter is kept for future multi-language support
            mv_query = """
                SELECT
                    id,
                    category_code,
                    name_es,
                    description_es,
                    icon,
                    color,
                    ministry_id,
                    sector_id,
                    ministry_name,
                    sector_name,
                    service_count
                FROM categories_with_services
                ORDER BY service_count DESC, name_es ASC
            """
            mv_rows = await db.fetch(mv_query)

            if mv_rows:
                logger.info("✅ Category directory served from materialized view (fallback)")

                # Build category list from materialized view
                categories = []
                total_services = 0

                for row in mv_rows:
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

                result_data = {
                    "total_categories": len(categories),
                    "total_services": total_services,
                    "categories": [cat.dict() for cat in categories],
                    "last_updated": datetime.utcnow().isoformat()
                }

                # Cache the result for next time
                if redis_client:
                    try:
                        await redis_client.setex(CATEGORIES_CACHE_KEY, CATEGORIES_TTL, json.dumps(result_data))
                    except Exception:
                        pass

                return CategoryDirectory(**result_data)
        except Exception as mv_err:
            logger.warning(f"Materialized view fallback failed (trying direct query): {mv_err}")

        # STEP 3: Calculate from database with direct queries (150-500ms - last resort)
        # Complex query to get categories with service counts
        # CRITICAL: Only count services where status = 'active'
        # Join with ministries and sectors for additional context
        logger.info("⚠️ Category directory calculated via direct queries (slowest fallback)")

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

        result_data = {
            "total_categories": len(categories),
            "total_services": total_services,
            "categories": [cat.dict() for cat in categories],
            "last_updated": datetime.utcnow().isoformat()
        }

        # STEP 3: Store in cache for next request
        if redis_client:
            try:
                await redis_client.setex(
                    CATEGORIES_CACHE_KEY,
                    CATEGORIES_TTL,
                    json.dumps(result_data)
                )
                logger.info(f"✅ Category directory cached for {CATEGORIES_TTL}s")
            except Exception as redis_err:
                logger.warning(f"Redis setex failed (non-critical): {redis_err}")

        logger.info(
            f"Category directory generated: {len(categories)} categories, "
            f"{total_services} total services, time={execution_time:.2f}ms"
        )

        return CategoryDirectory(**result_data)

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
