"""
Homepage Service - Business Logic Layer
Orchestrates repository and cache for homepage data
"""

from typing import Dict, Any, Optional
from datetime import datetime
import asyncpg
import redis.asyncio as redis
from loguru import logger

from app.modules.homepage.repositories import HomepageRepository
from app.modules.homepage.services.cache_service import HomepageCacheService
from app.modules.homepage.models import (
    HomepageStats,
    CategoryDirectory,
    CategoryWithServices
)


class HomepageService:
    """
    Business logic for homepage data

    Coordinates between repository (database) and cache service (Redis)
    Implements cache-aside pattern with intelligent invalidation
    """

    def __init__(
        self,
        db: asyncpg.Connection,
        redis_client: Optional[redis.Redis] = None
    ):
        self.repository = HomepageRepository(db)
        self.cache = HomepageCacheService(redis_client)

    # ========================================================================
    # STATS
    # ========================================================================

    async def get_stats(self) -> HomepageStats:
        """
        Get homepage statistics with caching

        Cache-aside pattern:
        1. Check cache
        2. If miss, query database
        3. Store in cache
        4. Return result

        Returns:
            HomepageStats with current counts
        """
        start_time = datetime.now()

        # Step 1: Check cache
        cached_stats = await self.cache.get_cached_stats()
        if cached_stats:
            return HomepageStats(**cached_stats)

        # Step 2: Query database
        stats_data = await self.repository.get_stats()

        # Add timestamp
        stats_data["last_updated"] = datetime.utcnow().isoformat()

        # Step 3: Cache for future requests
        await self.cache.cache_stats(stats_data)

        execution_time = (datetime.now() - start_time).total_seconds() * 1000
        logger.info(
            f"Homepage stats calculated: services={stats_data['total_services']}, "
            f"ministries={stats_data['total_ministries']}, "
            f"categories={stats_data['total_categories']}, "
            f"sectors={stats_data['total_sectors']}, "
            f"time={execution_time:.2f}ms"
        )

        return HomepageStats(**stats_data)

    # ========================================================================
    # CATEGORIES
    # ========================================================================

    async def get_category_directory(self, language: str = "es") -> CategoryDirectory:
        """
        Get category directory with service counts

        Supports multilingual content via entity_translations table

        Args:
            language: Language code (es, fr, en)

        Returns:
            CategoryDirectory with categories sorted by service count
        """
        start_time = datetime.now()

        # Step 1: Check cache (language-specific)
        cached_data = await self.cache.get_cached_categories(language)
        if cached_data:
            return CategoryDirectory(**cached_data)

        # Step 2: Query database
        categories_rows = await self.repository.get_category_directory(language)

        # Step 3: Build response
        categories = []
        total_services = 0

        for row in categories_rows:
            service_count = row['service_count'] or 0
            total_services += service_count

            categories.append(CategoryWithServices(
                id=row['id'],
                category_code=row['category_code'],
                name=row['name'],
                description=row['description'],
                icon=row['icon'],
                color=row['color'],
                service_count=service_count,
                ministry_name=row['ministry_name'],
                sector_name=row['sector_name']
            ))

        result_data = {
            "total_categories": len(categories),
            "total_services": total_services,
            "categories": [cat.model_dump() for cat in categories],
            "last_updated": datetime.utcnow().isoformat()
        }

        # Step 4: Cache for future requests
        await self.cache.cache_categories(result_data, language)

        execution_time = (datetime.now() - start_time).total_seconds() * 1000
        logger.info(
            f"Category directory generated ({language}): {len(categories)} categories, "
            f"{total_services} total services, time={execution_time:.2f}ms"
        )

        return CategoryDirectory(**result_data)

    # ========================================================================
    # CACHE MANAGEMENT (for administrative use)
    # ========================================================================

    async def invalidate_cache(self, scope: str = "all") -> Dict[str, Any]:
        """
        Invalidate homepage cache

        Args:
            scope: "stats", "categories", or "all"

        Returns:
            Dict with invalidation results
        """
        results = {"invalidated": []}

        if scope in ["stats", "all"]:
            if await self.cache.invalidate_stats_cache():
                results["invalidated"].append("stats")

        if scope in ["categories", "all"]:
            if await self.cache.invalidate_categories_cache():
                results["invalidated"].append("categories")

        results["success"] = len(results["invalidated"]) > 0
        results["timestamp"] = datetime.utcnow().isoformat()

        return results
