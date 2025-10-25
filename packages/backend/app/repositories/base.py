"""
Base repository pattern for TaxasGE Backend
Generic repository with both PostgreSQL and Supabase support
"""

from abc import ABC, abstractmethod
from typing import TypeVar, Generic, List, Optional, Dict, Any, Union
from uuid import uuid4
import asyncpg
from datetime import datetime
from loguru import logger

from app.database.connection import db_manager, get_database
from app.database.supabase_client import supabase_client, SupabaseClient

T = TypeVar('T')


class BaseRepository(ABC, Generic[T]):
    """Abstract base repository class"""

    def __init__(self, table_name: str):
        self.table_name = table_name
        self.db_manager = db_manager
        self.supabase = supabase_client

    @abstractmethod
    def _map_to_model(self, data: Dict[str, Any]) -> T:
        """Map database row to model instance"""
        pass

    @abstractmethod
    def _map_from_model(self, model: T) -> Dict[str, Any]:
        """Map model instance to database row"""
        pass

    async def find_by_id(self, id: str, use_supabase: bool = True) -> Optional[T]:
        """Find entity by ID"""
        try:
            if use_supabase and self.supabase.enabled:
                result = await self.supabase.select(
                    self.table_name,
                    filters={"id": id}
                )
                if result:
                    return self._map_to_model(result[0])
            else:
                query = f"SELECT * FROM {self.table_name} WHERE id = $1"
                result = await self.db_manager.execute_single(query, id)
                if result:
                    return self._map_to_model(dict(result))

        except Exception as e:
            logger.error(f"❌ Error finding {self.table_name} by ID {id}: {e}")

        return None

    async def find_all(
        self,
        filters: Optional[Dict[str, Any]] = None,
        order_by: Optional[str] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None,
        use_supabase: bool = True
    ) -> List[T]:
        """Find all entities with optional filtering"""
        try:
            if use_supabase and self.supabase.enabled:
                # Build Supabase query
                order = f"{order_by}" if order_by else None
                results = await self.supabase.select(
                    self.table_name,
                    filters=filters,
                    order=order,
                    limit=limit
                )
                return [self._map_to_model(row) for row in results]
            else:
                # Build PostgreSQL query
                query_parts = [f"SELECT * FROM {self.table_name}"]
                params = []
                param_count = 0

                # Add WHERE conditions
                if filters:
                    conditions = []
                    for key, value in filters.items():
                        param_count += 1
                        conditions.append(f"{key} = ${param_count}")
                        params.append(value)
                    query_parts.append(f"WHERE {' AND '.join(conditions)}")

                # Add ORDER BY
                if order_by:
                    query_parts.append(f"ORDER BY {order_by}")

                # Add LIMIT and OFFSET
                if limit:
                    param_count += 1
                    query_parts.append(f"LIMIT ${param_count}")
                    params.append(limit)

                if offset:
                    param_count += 1
                    query_parts.append(f"OFFSET ${param_count}")
                    params.append(offset)

                query = " ".join(query_parts)
                results = await self.db_manager.execute_query(query, *params)
                return [self._map_to_model(dict(row)) for row in results]

        except Exception as e:
            logger.error(f"❌ Error finding all {self.table_name}: {e}")
            return []

    async def create(self, model: T, use_supabase: bool = True) -> Optional[T]:
        """Create new entity"""
        try:
            data = self._map_from_model(model)

            # Add ID if not present
            if "id" not in data or not data["id"]:
                data["id"] = str(uuid4())

            # Add timestamps
            now = datetime.utcnow()
            data["created_at"] = now
            data["updated_at"] = now

            if use_supabase and self.supabase.enabled:
                result = await self.supabase.insert(self.table_name, data)
                if result:
                    return self._map_to_model(result)
            else:
                # Build INSERT query
                columns = list(data.keys())
                placeholders = [f"${i+1}" for i in range(len(columns))]
                values = list(data.values())

                query = f"""
                    INSERT INTO {self.table_name} ({', '.join(columns)})
                    VALUES ({', '.join(placeholders)})
                    RETURNING *
                """

                result = await self.db_manager.execute_single(query, *values)
                if result:
                    return self._map_to_model(dict(result))

        except Exception as e:
            logger.error(f"❌ Error creating {self.table_name}: {e}")

        return None

    async def update(
        self,
        id: str,
        updates: Dict[str, Any],
        use_supabase: bool = True
    ) -> Optional[T]:
        """Update entity by ID"""
        try:
            # Add updated timestamp
            updates["updated_at"] = datetime.utcnow()

            if use_supabase and self.supabase.enabled:
                results = await self.supabase.update(
                    self.table_name,
                    filters={"id": id},
                    data=updates
                )
                if results:
                    return self._map_to_model(results[0])
            else:
                # Build UPDATE query
                set_clauses = []
                params = []
                param_count = 0

                for key, value in updates.items():
                    param_count += 1
                    set_clauses.append(f"{key} = ${param_count}")
                    params.append(value)

                param_count += 1
                params.append(id)

                query = f"""
                    UPDATE {self.table_name}
                    SET {', '.join(set_clauses)}
                    WHERE id = ${param_count}
                    RETURNING *
                """

                result = await self.db_manager.execute_single(query, *params)
                if result:
                    return self._map_to_model(dict(result))

        except Exception as e:
            logger.error(f"❌ Error updating {self.table_name} {id}: {e}")

        return None

    async def delete(self, id: str, use_supabase: bool = True) -> bool:
        """Delete entity by ID"""
        try:
            if use_supabase and self.supabase.enabled:
                results = await self.supabase.delete(
                    self.table_name,
                    filters={"id": id}
                )
                return len(results) > 0
            else:
                query = f"DELETE FROM {self.table_name} WHERE id = $1"
                result = await self.db_manager.execute_command(query, id)
                return "DELETE 1" in result

        except Exception as e:
            logger.error(f"❌ Error deleting {self.table_name} {id}: {e}")
            return False

    async def count(
        self,
        filters: Optional[Dict[str, Any]] = None,
        use_supabase: bool = True
    ) -> int:
        """Count entities with optional filtering"""
        try:
            if use_supabase and self.supabase.enabled:
                # For counting, we'll use PostgreSQL approach even with Supabase
                # as Supabase REST API doesn't have direct count endpoint
                pass

            # Build COUNT query
            query_parts = [f"SELECT COUNT(*) FROM {self.table_name}"]
            params = []
            param_count = 0

            if filters:
                conditions = []
                for key, value in filters.items():
                    param_count += 1
                    conditions.append(f"{key} = ${param_count}")
                    params.append(value)
                query_parts.append(f"WHERE {' AND '.join(conditions)}")

            query = " ".join(query_parts)
            result = await self.db_manager.execute_scalar(query, *params)
            return result or 0

        except Exception as e:
            logger.error(f"❌ Error counting {self.table_name}: {e}")
            return 0

    async def search(
        self,
        search_query: str,
        search_columns: List[str],
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 20,
        use_supabase: bool = True
    ) -> List[T]:
        """Full-text search in specified columns"""
        try:
            if use_supabase and self.supabase.enabled:
                # Use Supabase full-text search if available
                # This assumes search columns have FTS indexes
                for column in search_columns:
                    try:
                        results = await self.supabase.search(
                            self.table_name,
                            column,
                            search_query,
                            limit
                        )
                        if results:
                            return [self._map_to_model(row) for row in results]
                    except:
                        continue

            # Fallback to PostgreSQL ILIKE search
            search_conditions = []
            params = [f"%{search_query}%"] * len(search_columns)
            param_count = 0

            for column in search_columns:
                param_count += 1
                search_conditions.append(f"{column} ILIKE ${param_count}")

            query_parts = [
                f"SELECT * FROM {self.table_name}",
                f"WHERE ({' OR '.join(search_conditions)})"
            ]

            # Add additional filters
            if filters:
                for key, value in filters.items():
                    param_count += 1
                    query_parts.append(f"AND {key} = ${param_count}")
                    params.append(value)

            query_parts.append(f"LIMIT {limit}")
            query = " ".join(query_parts)

            results = await self.db_manager.execute_query(query, *params)
            return [self._map_to_model(dict(row)) for row in results]

        except Exception as e:
            logger.error(f"❌ Error searching {self.table_name}: {e}")
            return []

    async def exists(self, id: str, use_supabase: bool = True) -> bool:
        """Check if entity exists by ID"""
        try:
            entity = await self.find_by_id(id, use_supabase)
            return entity is not None
        except Exception as e:
            logger.error(f"❌ Error checking existence of {self.table_name} {id}: {e}")
            return False

    async def bulk_create(self, models: List[T], use_supabase: bool = True) -> List[T]:
        """Create multiple entities"""
        created_models = []
        for model in models:
            created = await self.create(model, use_supabase)
            if created:
                created_models.append(created)
        return created_models

    async def bulk_update(
        self,
        updates_list: List[Dict[str, Any]],
        use_supabase: bool = True
    ) -> List[T]:
        """Update multiple entities"""
        updated_models = []
        for update_data in updates_list:
            if "id" not in update_data:
                continue
            entity_id = update_data.pop("id")
            updated = await self.update(entity_id, update_data, use_supabase)
            if updated:
                updated_models.append(updated)
        return updated_models