"""
City Repository.

Data access layer for cities and entities tables.
"""

from typing import List, Optional
from uuid import UUID
import logging

from app.database.connection import Database
from app.modules.cities.models.city import (
    CityCreate, CityUpdate, CityResponse, CitySimple,
    EntityCreate, EntityUpdate, EntityResponse, EntitySimple,
)

logger = logging.getLogger(__name__)


class CityRepository:
    """Repository for city operations."""

    def __init__(self, db: Database):
        self.db = db

    async def get_all_cities(
        self,
        region: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> List[CityResponse]:
        """Get all cities with optional filters."""
        query = """
            SELECT id, name, region, description, is_capital, is_active,
                   created_at, updated_at
            FROM cities
            WHERE 1=1
        """
        params = []
        param_idx = 1

        if region:
            query += f" AND region = ${param_idx}"
            params.append(region)
            param_idx += 1

        if is_active is not None:
            query += f" AND is_active = ${param_idx}"
            params.append(is_active)
            param_idx += 1

        query += " ORDER BY is_capital DESC, name ASC"

        rows = await self.db.fetch(query, *params)
        return [CityResponse(**dict(row)) for row in rows]

    async def get_cities_simple(self, is_active: bool = True) -> List[CitySimple]:
        """Get simplified city list for dropdowns."""
        query = """
            SELECT id, name, region, is_capital
            FROM cities
            WHERE is_active = $1
            ORDER BY is_capital DESC, name ASC
        """
        rows = await self.db.fetch(query, is_active)
        return [CitySimple(**dict(row)) for row in rows]

    async def get_city_by_id(self, city_id: UUID) -> Optional[CityResponse]:
        """Get a city by ID."""
        query = """
            SELECT id, name, region, description, is_capital, is_active,
                   created_at, updated_at
            FROM cities
            WHERE id = $1
        """
        row = await self.db.fetchrow(query, city_id)
        return CityResponse(**dict(row)) if row else None

    async def get_city_by_name(self, name: str) -> Optional[CityResponse]:
        """Get a city by name."""
        query = """
            SELECT id, name, region, description, is_capital, is_active,
                   created_at, updated_at
            FROM cities
            WHERE LOWER(name) = LOWER($1)
        """
        row = await self.db.fetchrow(query, name)
        return CityResponse(**dict(row)) if row else None

    async def create_city(
        self,
        data: CityCreate,
        created_by: Optional[UUID] = None
    ) -> CityResponse:
        """Create a new city."""
        query = """
            INSERT INTO cities (name, region, description, is_capital, is_active, created_by)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, name, region, description, is_capital, is_active,
                      created_at, updated_at
        """
        row = await self.db.fetchrow(
            query,
            data.name,
            data.region,
            data.description,
            data.is_capital,
            data.is_active,
            created_by,
        )
        return CityResponse(**dict(row))

    async def update_city(
        self,
        city_id: UUID,
        data: CityUpdate,
        updated_by: Optional[UUID] = None
    ) -> Optional[CityResponse]:
        """Update a city."""
        # Build dynamic update query
        updates = []
        params = []
        param_idx = 1

        if data.name is not None:
            updates.append(f"name = ${param_idx}")
            params.append(data.name)
            param_idx += 1

        if data.region is not None:
            updates.append(f"region = ${param_idx}")
            params.append(data.region)
            param_idx += 1

        if data.description is not None:
            updates.append(f"description = ${param_idx}")
            params.append(data.description)
            param_idx += 1

        if data.is_capital is not None:
            updates.append(f"is_capital = ${param_idx}")
            params.append(data.is_capital)
            param_idx += 1

        if data.is_active is not None:
            updates.append(f"is_active = ${param_idx}")
            params.append(data.is_active)
            param_idx += 1

        if not updates:
            return await self.get_city_by_id(city_id)

        updates.append(f"updated_by = ${param_idx}")
        params.append(updated_by)
        param_idx += 1

        updates.append("updated_at = NOW()")

        params.append(city_id)
        query = f"""
            UPDATE cities
            SET {', '.join(updates)}
            WHERE id = ${param_idx}
            RETURNING id, name, region, description, is_capital, is_active,
                      created_at, updated_at
        """
        row = await self.db.fetchrow(query, *params)
        return CityResponse(**dict(row)) if row else None

    async def delete_city(self, city_id: UUID) -> bool:
        """Delete a city."""
        query = "DELETE FROM cities WHERE id = $1"
        result = await self.db.execute(query, city_id)
        return "DELETE 1" in result

    async def count_cities(self, is_active: Optional[bool] = None) -> int:
        """Count cities."""
        query = "SELECT COUNT(*) FROM cities"
        params = []
        if is_active is not None:
            query += " WHERE is_active = $1"
            params.append(is_active)
        row = await self.db.fetchrow(query, *params)
        return row["count"] if row else 0


class EntityRepository:
    """Repository for entity operations."""

    def __init__(self, db: Database):
        self.db = db

    async def get_all_entities(
        self,
        is_active: Optional[bool] = None,
    ) -> List[EntityResponse]:
        """Get all entities with optional filters."""
        query = """
            SELECT id, code, name, description, is_active,
                   created_at, updated_at
            FROM entities
            WHERE 1=1
        """
        params = []

        if is_active is not None:
            query += " AND is_active = $1"
            params.append(is_active)

        query += " ORDER BY code ASC"

        rows = await self.db.fetch(query, *params)
        return [EntityResponse(**dict(row)) for row in rows]

    async def get_entities_simple(self, is_active: bool = True) -> List[EntitySimple]:
        """Get simplified entity list for dropdowns."""
        query = """
            SELECT id, code, name
            FROM entities
            WHERE is_active = $1
            ORDER BY code ASC
        """
        rows = await self.db.fetch(query, is_active)
        return [EntitySimple(**dict(row)) for row in rows]

    async def get_entity_by_id(self, entity_id: UUID) -> Optional[EntityResponse]:
        """Get an entity by ID."""
        query = """
            SELECT id, code, name, description, is_active,
                   created_at, updated_at
            FROM entities
            WHERE id = $1
        """
        row = await self.db.fetchrow(query, entity_id)
        return EntityResponse(**dict(row)) if row else None

    async def get_entity_by_code(self, code: str) -> Optional[EntityResponse]:
        """Get an entity by code."""
        query = """
            SELECT id, code, name, description, is_active,
                   created_at, updated_at
            FROM entities
            WHERE UPPER(code) = UPPER($1)
        """
        row = await self.db.fetchrow(query, code)
        return EntityResponse(**dict(row)) if row else None

    async def create_entity(
        self,
        data: EntityCreate,
        created_by: Optional[UUID] = None
    ) -> EntityResponse:
        """Create a new entity."""
        query = """
            INSERT INTO entities (code, name, description, is_active, created_by)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, code, name, description, is_active,
                      created_at, updated_at
        """
        row = await self.db.fetchrow(
            query,
            data.code,
            data.name,
            data.description,
            data.is_active,
            created_by,
        )
        return EntityResponse(**dict(row))

    async def update_entity(
        self,
        entity_id: UUID,
        data: EntityUpdate,
        updated_by: Optional[UUID] = None
    ) -> Optional[EntityResponse]:
        """Update an entity."""
        updates = []
        params = []
        param_idx = 1

        if data.code is not None:
            updates.append(f"code = ${param_idx}")
            params.append(data.code)
            param_idx += 1

        if data.name is not None:
            updates.append(f"name = ${param_idx}")
            params.append(data.name)
            param_idx += 1

        if data.description is not None:
            updates.append(f"description = ${param_idx}")
            params.append(data.description)
            param_idx += 1

        if data.is_active is not None:
            updates.append(f"is_active = ${param_idx}")
            params.append(data.is_active)
            param_idx += 1

        if not updates:
            return await self.get_entity_by_id(entity_id)

        updates.append(f"updated_by = ${param_idx}")
        params.append(updated_by)
        param_idx += 1

        updates.append("updated_at = NOW()")

        params.append(entity_id)
        query = f"""
            UPDATE entities
            SET {', '.join(updates)}
            WHERE id = ${param_idx}
            RETURNING id, code, name, description, is_active,
                      created_at, updated_at
        """
        row = await self.db.fetchrow(query, *params)
        return EntityResponse(**dict(row)) if row else None

    async def delete_entity(self, entity_id: UUID) -> bool:
        """Delete an entity."""
        query = "DELETE FROM entities WHERE id = $1"
        result = await self.db.execute(query, entity_id)
        return "DELETE 1" in result

    async def count_entities(self, is_active: Optional[bool] = None) -> int:
        """Count entities."""
        query = "SELECT COUNT(*) FROM entities"
        params = []
        if is_active is not None:
            query += " WHERE is_active = $1"
            params.append(is_active)
        row = await self.db.fetchrow(query, *params)
        return row["count"] if row else 0
