"""
City API Routes.

Endpoints for cities and entities management.
"""

from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status

from asyncpg import Connection
from app.database.connection import get_database
from app.modules.auth.middleware.auth_middleware import get_current_user, require_admin
from app.modules.cities.services.city_service import CityService, EntityService
from app.modules.cities.models.city import (
    CityCreate, CityUpdate, CityResponse, CitySimple, CityListResponse,
    EntityCreate, EntityUpdate, EntityResponse, EntitySimple, EntityListResponse,
)

router = APIRouter(tags=["cities"])


# ============================================================================
# City Endpoints
# ============================================================================

@router.get("/cities", response_model=CityListResponse)
async def get_cities(
    region: Optional[str] = Query(None, description="Filter by region (Insular/Continental)"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    db: Connection = Depends(get_database),
):
    """Get all cities with optional filters."""
    service = CityService(db)
    return await service.get_all_cities(region=region, is_active=is_active)


@router.get("/cities/simple", response_model=List[CitySimple])
async def get_cities_simple(
    is_active: bool = Query(True, description="Filter by active status"),
    db: Connection = Depends(get_database),
):
    """Get simplified city list for dropdowns."""
    service = CityService(db)
    return await service.get_cities_simple(is_active)


@router.get("/cities/{city_id}", response_model=CityResponse)
async def get_city(
    city_id: UUID,
    db: Connection = Depends(get_database),
):
    """Get a city by ID."""
    service = CityService(db)
    city = await service.get_city_by_id(city_id)
    if not city:
        raise HTTPException(status_code=404, detail="City not found")
    return city


@router.post("/cities", response_model=CityResponse, status_code=status.HTTP_201_CREATED)
async def create_city(
    data: CityCreate,
    db: Connection = Depends(get_database),
    current_user: dict = Depends(require_admin),
):
    """Create a new city. Requires admin role."""
    service = CityService(db)
    try:
        return await service.create_city(data, created_by=current_user.get("id"))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/cities/{city_id}", response_model=CityResponse)
async def update_city(
    city_id: UUID,
    data: CityUpdate,
    db: Connection = Depends(get_database),
    current_user: dict = Depends(require_admin),
):
    """Update a city. Requires admin role."""
    service = CityService(db)
    try:
        city = await service.update_city(city_id, data, updated_by=current_user.get("id"))
        if not city:
            raise HTTPException(status_code=404, detail="City not found")
        return city
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/cities/{city_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_city(
    city_id: UUID,
    db: Connection = Depends(get_database),
    current_user: dict = Depends(require_admin),
):
    """Delete a city. Requires admin role."""
    service = CityService(db)
    deleted = await service.delete_city(city_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="City not found")


# ============================================================================
# Entity Endpoints
# ============================================================================

@router.get("/entities", response_model=EntityListResponse)
async def get_entities(
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    db: Connection = Depends(get_database),
):
    """Get all entities with optional filters."""
    service = EntityService(db)
    return await service.get_all_entities(is_active=is_active)


@router.get("/entities/simple", response_model=List[EntitySimple])
async def get_entities_simple(
    is_active: bool = Query(True, description="Filter by active status"),
    db: Connection = Depends(get_database),
):
    """Get simplified entity list for dropdowns."""
    service = EntityService(db)
    return await service.get_entities_simple(is_active)


@router.get("/entities/{entity_id}", response_model=EntityResponse)
async def get_entity(
    entity_id: UUID,
    db: Connection = Depends(get_database),
):
    """Get an entity by ID."""
    service = EntityService(db)
    entity = await service.get_entity_by_id(entity_id)
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    return entity


@router.post("/entities", response_model=EntityResponse, status_code=status.HTTP_201_CREATED)
async def create_entity(
    data: EntityCreate,
    db: Connection = Depends(get_database),
    current_user: dict = Depends(require_admin),
):
    """Create a new entity. Requires admin role."""
    service = EntityService(db)
    try:
        return await service.create_entity(data, created_by=current_user.get("id"))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/entities/{entity_id}", response_model=EntityResponse)
async def update_entity(
    entity_id: UUID,
    data: EntityUpdate,
    db: Connection = Depends(get_database),
    current_user: dict = Depends(require_admin),
):
    """Update an entity. Requires admin role."""
    service = EntityService(db)
    try:
        entity = await service.update_entity(entity_id, data, updated_by=current_user.get("id"))
        if not entity:
            raise HTTPException(status_code=404, detail="Entity not found")
        return entity
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/entities/{entity_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_entity(
    entity_id: UUID,
    db: Connection = Depends(get_database),
    current_user: dict = Depends(require_admin),
):
    """Delete an entity. Requires admin role."""
    service = EntityService(db)
    deleted = await service.delete_entity(entity_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Entity not found")
