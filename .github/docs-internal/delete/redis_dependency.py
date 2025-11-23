"""
Redis Dependency for FastAPI
Provides optional Redis connection with graceful fallback
"""

from typing import Optional
from fastapi import Request
import redis.asyncio as redis


async def get_redis_optional(request: Request) -> Optional[redis.Redis]:
    """
    Get Redis connection for FastAPI dependency injection

    Returns None if Redis is not available (graceful fallback)
    Does NOT raise exceptions like the main.py get_redis()

    Usage:
        @router.get("/endpoint")
        async def my_endpoint(redis: Optional[redis.Redis] = Depends(get_redis_optional)):
            if redis:
                # Use Redis caching
                cached = await redis.get(key)
            else:
                # Fallback - no caching
                pass
    """
    return getattr(request.app.state, 'redis', None)


async def get_redis_required(request: Request) -> redis.Redis:
    """
    Get Redis connection (raises exception if not available)

    Use this only for endpoints that MUST have Redis
    For optional caching, use get_redis_optional() instead
    """
    redis_client = getattr(request.app.state, 'redis', None)
    if redis_client is None:
        raise RuntimeError("Redis connection not available")
    return redis_client
