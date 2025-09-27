"""
Supabase client for TaxasGE Backend
High-level Supabase integration with authentication and storage
"""

from typing import Optional, Dict, Any, List
from loguru import logger
import httpx
import asyncio
from datetime import datetime

from app.config import settings


class SupabaseClient:
    """High-level Supabase client for REST API operations"""

    def __init__(self):
        if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
            logger.warning("⚠️ Supabase credentials not configured")
            self.enabled = False
            return

        self.enabled = True
        self.base_url = settings.SUPABASE_URL
        self.headers = {
            "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
        self.client = httpx.AsyncClient(
            timeout=30.0,
            headers=self.headers
        )

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()

    async def close(self):
        """Close HTTP client"""
        if hasattr(self, 'client'):
            await self.client.aclose()

    def _get_table_url(self, table: str) -> str:
        """Get REST API URL for table"""
        return f"{self.base_url}/rest/v1/{table}"

    async def select(self, table: str, columns: str = "*", filters: Optional[Dict] = None,
                    order: Optional[str] = None, limit: Optional[int] = None) -> List[Dict]:
        """Select data from Supabase table"""
        if not self.enabled:
            return []

        try:
            url = self._get_table_url(table)
            params = {"select": columns}

            # Add filters
            if filters:
                for key, value in filters.items():
                    if isinstance(value, str):
                        params[key] = f"eq.{value}"
                    elif isinstance(value, dict):
                        # Support for operators like {"operator": "gte", "value": 100}
                        op = value.get("operator", "eq")
                        params[key] = f"{op}.{value['value']}"
                    else:
                        params[key] = f"eq.{value}"

            # Add ordering
            if order:
                params["order"] = order

            # Add limit
            if limit:
                params["limit"] = str(limit)

            response = await self.client.get(url, params=params)
            response.raise_for_status()
            return response.json()

        except Exception as e:
            logger.error(f"L Supabase select error on {table}: {e}")
            return []

    async def insert(self, table: str, data: Dict[str, Any]) -> Optional[Dict]:
        """Insert data into Supabase table"""
        if not self.enabled:
            return None

        try:
            url = self._get_table_url(table)

            # Add timestamp fields
            now = datetime.utcnow().isoformat()
            if "created_at" not in data:
                data["created_at"] = now
            if "updated_at" not in data:
                data["updated_at"] = now

            response = await self.client.post(url, json=data)
            response.raise_for_status()

            result = response.json()
            if isinstance(result, list) and result:
                return result[0]
            return result

        except Exception as e:
            logger.error(f"L Supabase insert error on {table}: {e}")
            return None

    async def update(self, table: str, filters: Dict[str, Any], data: Dict[str, Any]) -> List[Dict]:
        """Update data in Supabase table"""
        if not self.enabled:
            return []

        try:
            url = self._get_table_url(table)

            # Add updated timestamp
            data["updated_at"] = datetime.utcnow().isoformat()

            # Build filter params
            params = {}
            for key, value in filters.items():
                params[key] = f"eq.{value}"

            response = await self.client.patch(url, json=data, params=params)
            response.raise_for_status()
            return response.json()

        except Exception as e:
            logger.error(f"L Supabase update error on {table}: {e}")
            return []

    async def delete(self, table: str, filters: Dict[str, Any]) -> List[Dict]:
        """Delete data from Supabase table"""
        if not self.enabled:
            return []

        try:
            url = self._get_table_url(table)

            # Build filter params
            params = {}
            for key, value in filters.items():
                params[key] = f"eq.{value}"

            response = await self.client.delete(url, params=params)
            response.raise_for_status()
            return response.json()

        except Exception as e:
            logger.error(f"L Supabase delete error on {table}: {e}")
            return []

    async def rpc(self, function_name: str, params: Optional[Dict] = None) -> Any:
        """Call Supabase stored procedure/function"""
        if not self.enabled:
            return None

        try:
            url = f"{self.base_url}/rest/v1/rpc/{function_name}"
            response = await self.client.post(url, json=params or {})
            response.raise_for_status()
            return response.json()

        except Exception as e:
            logger.error(f"L Supabase RPC error on {function_name}: {e}")
            return None

    async def search(self, table: str, column: str, query: str, limit: int = 20) -> List[Dict]:
        """Full-text search in Supabase table"""
        if not self.enabled:
            return []

        try:
            url = self._get_table_url(table)
            params = {
                "select": "*",
                column: f"fts.{query}",
                "limit": str(limit)
            }

            response = await self.client.get(url, params=params)
            response.raise_for_status()
            return response.json()

        except Exception as e:
            logger.error(f"L Supabase search error on {table}: {e}")
            return []

    async def health_check(self) -> bool:
        """Check if Supabase is accessible"""
        if not self.enabled:
            return False

        try:
            # Simple health check using the users table or any existing table
            response = await self.client.get(
                f"{self.base_url}/rest/v1/",
                params={"select": "1", "limit": "1"}
            )
            return response.status_code < 400

        except Exception as e:
            logger.error(f"L Supabase health check failed: {e}")
            return False


# Global Supabase client instance
supabase_client = SupabaseClient()


# FastAPI dependency
async def get_supabase() -> SupabaseClient:
    """FastAPI dependency to get Supabase client"""
    return supabase_client


# Convenience functions for common operations
async def supabase_select(table: str, **kwargs) -> List[Dict]:
    """Convenience function for Supabase select"""
    return await supabase_client.select(table, **kwargs)


async def supabase_insert(table: str, data: Dict[str, Any]) -> Optional[Dict]:
    """Convenience function for Supabase insert"""
    return await supabase_client.insert(table, data)


async def supabase_update(table: str, filters: Dict[str, Any], data: Dict[str, Any]) -> List[Dict]:
    """Convenience function for Supabase update"""
    return await supabase_client.update(table, filters, data)


async def supabase_delete(table: str, filters: Dict[str, Any]) -> List[Dict]:
    """Convenience function for Supabase delete"""
    return await supabase_client.delete(table, filters)


async def supabase_search(table: str, column: str, query: str, limit: int = 20) -> List[Dict]:
    """Convenience function for Supabase search"""
    return await supabase_client.search(table, column, query, limit)