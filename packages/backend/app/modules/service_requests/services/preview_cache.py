"""
Preview Cache Service - Abstraction for document preview caching.

Supports:
- In-memory cache (development/single instance)
- Redis cache (production/multi-instance)

Usage:
    preview_cache = PreviewCache()  # Uses config to select backend
    await preview_cache.set(preview_id, data, ttl_seconds=1800)
    data = await preview_cache.get(preview_id)
    await preview_cache.delete(preview_id)
"""
import json
import logging
from abc import ABC, abstractmethod
from datetime import datetime, timedelta
from typing import Dict, Optional, Any

logger = logging.getLogger(__name__)


class CacheBackend(ABC):
    """Abstract base class for cache backends."""

    @abstractmethod
    async def get(self, key: str) -> Optional[Dict[str, Any]]:
        """Get value from cache."""
        pass

    @abstractmethod
    async def set(self, key: str, value: Dict[str, Any], ttl_seconds: int) -> bool:
        """Set value in cache with TTL."""
        pass

    @abstractmethod
    async def delete(self, key: str) -> bool:
        """Delete value from cache."""
        pass

    @abstractmethod
    async def cleanup_expired(self) -> int:
        """Remove expired entries. Returns count of removed entries."""
        pass


class InMemoryCache(CacheBackend):
    """
    In-memory cache implementation.

    WARNING: Not suitable for production with multiple instances.
    Data is lost on restart.
    """

    def __init__(self):
        self._store: Dict[str, Dict[str, Any]] = {}

    async def get(self, key: str) -> Optional[Dict[str, Any]]:
        """Get value if exists and not expired."""
        entry = self._store.get(key)
        if not entry:
            return None

        expires_at = entry.get("_expires_at")
        if expires_at and datetime.utcnow() > expires_at:
            # Expired - remove and return None
            del self._store[key]
            return None

        # Return without internal fields
        result = {k: v for k, v in entry.items() if not k.startswith("_")}
        return result

    async def set(self, key: str, value: Dict[str, Any], ttl_seconds: int) -> bool:
        """Set value with expiration."""
        expires_at = datetime.utcnow() + timedelta(seconds=ttl_seconds)
        self._store[key] = {
            **value,
            "_expires_at": expires_at
        }
        return True

    async def delete(self, key: str) -> bool:
        """Delete key if exists."""
        if key in self._store:
            del self._store[key]
            return True
        return False

    async def cleanup_expired(self) -> int:
        """Remove all expired entries."""
        now = datetime.utcnow()
        expired_keys = [
            k for k, v in self._store.items()
            if v.get("_expires_at") and now > v["_expires_at"]
        ]
        for key in expired_keys:
            del self._store[key]
        return len(expired_keys)


class UpstashRedisCache(CacheBackend):
    """
    Upstash Redis cache implementation using REST API.

    Suitable for production with multiple instances and serverless.
    Requires upstash-redis package: pip install upstash-redis

    Environment variables:
    - UPSTASH_REDIS_REST_URL: REST API URL (https://xxx.upstash.io)
    - UPSTASH_REDIS_REST_TOKEN: REST API token
    """

    def __init__(self, rest_url: Optional[str] = None, rest_token: Optional[str] = None):
        self._rest_url = rest_url
        self._rest_token = rest_token
        self._client = None
        self._prefix = "preview:"

    def _get_client(self):
        """Get or create Upstash Redis client."""
        if self._client is None:
            try:
                from upstash_redis import Redis
                self._client = Redis(
                    url=self._rest_url,
                    token=self._rest_token
                )
                logger.info(f"Upstash Redis client initialized: {self._rest_url}")
            except ImportError:
                logger.error("upstash-redis package not installed. Install with: pip install upstash-redis")
                raise
            except Exception as e:
                logger.error(f"Failed to initialize Upstash Redis: {e}")
                raise
        return self._client

    async def get(self, key: str) -> Optional[Dict[str, Any]]:
        """Get value from Upstash Redis."""
        try:
            client = self._get_client()
            data = client.get(f"{self._prefix}{key}")
            if data:
                if isinstance(data, str):
                    return json.loads(data)
                return data
            return None
        except Exception as e:
            logger.error(f"Upstash Redis GET error: {e}")
            return None

    async def set(self, key: str, value: Dict[str, Any], ttl_seconds: int) -> bool:
        """Set value in Upstash Redis with expiration."""
        try:
            client = self._get_client()
            client.setex(
                f"{self._prefix}{key}",
                ttl_seconds,
                json.dumps(value, default=str)
            )
            return True
        except Exception as e:
            logger.error(f"Upstash Redis SET error: {e}")
            return False

    async def delete(self, key: str) -> bool:
        """Delete key from Upstash Redis."""
        try:
            client = self._get_client()
            result = client.delete(f"{self._prefix}{key}")
            return result > 0
        except Exception as e:
            logger.error(f"Upstash Redis DELETE error: {e}")
            return False

    async def cleanup_expired(self) -> int:
        """Redis handles expiration automatically."""
        return 0


class PreviewCache:
    """
    Preview cache with automatic backend selection.

    Uses Upstash Redis if configured, otherwise falls back to in-memory.

    Configuration (in order of preference):
    1. UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (Upstash REST API)
    2. In-memory cache (fallback, not suitable for production)
    """

    def __init__(
        self,
        upstash_url: Optional[str] = None,
        upstash_token: Optional[str] = None
    ):
        self._upstash_url = upstash_url
        self._upstash_token = upstash_token
        self._backend: Optional[CacheBackend] = None

    def _get_backend(self) -> CacheBackend:
        """Get or create the appropriate cache backend."""
        if self._backend is None:
            if self._upstash_url and self._upstash_token:
                try:
                    self._backend = UpstashRedisCache(self._upstash_url, self._upstash_token)
                    logger.info(f"Using Upstash Redis cache for previews: {self._upstash_url}")
                except Exception as e:
                    logger.warning(f"Upstash Redis unavailable, falling back to in-memory: {e}")
                    self._backend = InMemoryCache()
            else:
                logger.warning("Upstash Redis not configured, using in-memory cache (not suitable for production)")
                self._backend = InMemoryCache()
        return self._backend

    async def get(self, preview_id: str) -> Optional[Dict[str, Any]]:
        """Get preview data by ID."""
        return await self._get_backend().get(preview_id)

    async def set(self, preview_id: str, data: Dict[str, Any], ttl_seconds: int = 1800) -> bool:
        """Store preview data with 30-minute default TTL."""
        return await self._get_backend().set(preview_id, data, ttl_seconds)

    async def delete(self, preview_id: str) -> bool:
        """Delete preview after validation."""
        return await self._get_backend().delete(preview_id)

    async def cleanup_expired(self) -> int:
        """Remove expired previews."""
        return await self._get_backend().cleanup_expired()


# Singleton instance - will be configured based on app settings
def get_preview_cache() -> PreviewCache:
    """Get the preview cache singleton."""
    upstash_url = None
    upstash_token = None

    try:
        from app.config import settings
        upstash_url = getattr(settings, 'UPSTASH_REDIS_REST_URL', None)
        upstash_token = getattr(settings, 'UPSTASH_REDIS_REST_TOKEN', None)

        if upstash_url and upstash_token:
            logger.info(f"Upstash Redis configured: {upstash_url}")
        else:
            logger.warning(
                "Upstash Redis not configured - preview cache will use in-memory "
                "(set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for production)"
            )
    except Exception as e:
        logger.error(f"Error loading Upstash config from settings: {e}")

    return PreviewCache(upstash_url=upstash_url, upstash_token=upstash_token)


# Create singleton
preview_cache = get_preview_cache()
