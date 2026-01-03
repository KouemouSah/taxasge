"""
City Service.

Business logic layer for cities and entities management.
"""

from typing import List, Optional
from uuid import UUID
import logging

from app.database.connection import Database
from app.modules.cities.repositories.city_repository import CityRepository, EntityRepository
from app.modules.cities.models.city import (
    CityCreate, CityUpdate, CityResponse, CitySimple, CityListResponse,
    EntityCreate, EntityUpdate, EntityResponse, EntitySimple, EntityListResponse,
)

logger = logging.getLogger(__name__)


class CityService:
    """Service for city operations."""

    def __init__(self, db: Database):
        self.repository = CityRepository(db)

    async def get_all_cities(
        self,
        region: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> CityListResponse:
        """Get all cities with optional filters."""
        cities = await self.repository.get_all_cities(region=region, is_active=is_active)
        return CityListResponse(items=cities, total=len(cities))

    async def get_cities_simple(self, is_active: bool = True) -> List[CitySimple]:
        """Get simplified city list for dropdowns."""
        return await self.repository.get_cities_simple(is_active)

    async def get_city_by_id(self, city_id: UUID) -> Optional[CityResponse]:
        """Get a city by ID."""
        return await self.repository.get_city_by_id(city_id)

    async def get_city_by_name(self, name: str) -> Optional[CityResponse]:
        """Get a city by name."""
        return await self.repository.get_city_by_name(name)

    async def create_city(
        self,
        data: CityCreate,
        created_by: Optional[UUID] = None
    ) -> CityResponse:
        """Create a new city."""
        # Check if city already exists
        existing = await self.repository.get_city_by_name(data.name)
        if existing:
            raise ValueError(f"City '{data.name}' already exists")

        return await self.repository.create_city(data, created_by)

    async def update_city(
        self,
        city_id: UUID,
        data: CityUpdate,
        updated_by: Optional[UUID] = None
    ) -> Optional[CityResponse]:
        """Update a city."""
        # Check if city exists
        existing = await self.repository.get_city_by_id(city_id)
        if not existing:
            return None

        # Check for name conflict if name is being updated
        if data.name and data.name.lower() != existing.name.lower():
            conflict = await self.repository.get_city_by_name(data.name)
            if conflict:
                raise ValueError(f"City '{data.name}' already exists")

        return await self.repository.update_city(city_id, data, updated_by)

    async def delete_city(self, city_id: UUID) -> bool:
        """Delete a city."""
        return await self.repository.delete_city(city_id)


class EntityService:
    """Service for entity operations."""

    def __init__(self, db: Database):
        self.repository = EntityRepository(db)

    async def get_all_entities(
        self,
        is_active: Optional[bool] = None,
    ) -> EntityListResponse:
        """Get all entities with optional filters."""
        entities = await self.repository.get_all_entities(is_active=is_active)
        return EntityListResponse(items=entities, total=len(entities))

    async def get_entities_simple(self, is_active: bool = True) -> List[EntitySimple]:
        """Get simplified entity list for dropdowns."""
        return await self.repository.get_entities_simple(is_active)

    async def get_entity_by_id(self, entity_id: UUID) -> Optional[EntityResponse]:
        """Get an entity by ID."""
        return await self.repository.get_entity_by_id(entity_id)

    async def get_entity_by_code(self, code: str) -> Optional[EntityResponse]:
        """Get an entity by code."""
        return await self.repository.get_entity_by_code(code)

    async def create_entity(
        self,
        data: EntityCreate,
        created_by: Optional[UUID] = None
    ) -> EntityResponse:
        """Create a new entity."""
        # Check if entity already exists
        existing = await self.repository.get_entity_by_code(data.code)
        if existing:
            raise ValueError(f"Entity '{data.code}' already exists")

        return await self.repository.create_entity(data, created_by)

    async def update_entity(
        self,
        entity_id: UUID,
        data: EntityUpdate,
        updated_by: Optional[UUID] = None
    ) -> Optional[EntityResponse]:
        """Update an entity."""
        # Check if entity exists
        existing = await self.repository.get_entity_by_id(entity_id)
        if not existing:
            return None

        # Check for code conflict if code is being updated
        if data.code and data.code.upper() != existing.code.upper():
            conflict = await self.repository.get_entity_by_code(data.code)
            if conflict:
                raise ValueError(f"Entity '{data.code}' already exists")

        return await self.repository.update_entity(entity_id, data, updated_by)

    async def delete_entity(self, entity_id: UUID) -> bool:
        """Delete an entity."""
        return await self.repository.delete_entity(entity_id)
