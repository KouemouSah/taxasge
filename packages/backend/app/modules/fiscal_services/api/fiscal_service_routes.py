"""Fiscal Service Routes - 850 tax services catalog API"""

from fastapi import APIRouter, HTTPException, Depends, status, Query
from fastapi.security import HTTPBearer
from typing import Dict, Any, List
from loguru import logger

from app.modules.fiscal_services.models import (
    MinistryResponse,
    SectorResponse,
    CategoryResponse,
    FiscalServiceCreate,
    FiscalServiceUpdate,
    FiscalServiceResponse,
    FiscalServiceListResponse,
    FiscalServiceSearchRequest,
    CalculateServiceRequest,
    CalculateServiceResponse,
)
from app.modules.fiscal_services.repositories import FiscalServiceRepository
from app.modules.fiscal_services.services import CalculationService
from app.modules.auth.middleware.auth_middleware import get_current_user
from app.modules.permissions.middleware.permission_middleware import require_permission
from app.database.connection import get_database

router = APIRouter(tags=["Fiscal Services"])
security = HTTPBearer()
repository = FiscalServiceRepository()
calculation_service = CalculationService()


# ========== HIERARCHY ENDPOINTS ==========

@router.get("/ministries", response_model=List[MinistryResponse])
async def list_ministries(db=Depends(get_database)):
    """List all ministries (Ministères)"""
    ministries = await repository.list_ministries(db)
    return [MinistryResponse(**m) for m in ministries]


@router.get("/sectors", response_model=List[SectorResponse])
async def list_sectors(
    ministry_id: str = Query(None, description="Filter by ministry"),
    db=Depends(get_database),
):
    """List sectors (Secteurs), optionally filtered by ministry"""
    sectors = await repository.list_sectors(db, ministry_id)
    return [SectorResponse(**s) for s in sectors]


@router.get("/categories", response_model=List[CategoryResponse])
async def list_categories(
    sector_id: str = Query(None, description="Filter by sector"),
    db=Depends(get_database),
):
    """List categories (Catégories), optionally filtered by sector"""
    categories = await repository.list_categories(db, sector_id)
    return [CategoryResponse(**c) for c in categories]


# ========== FISCAL SERVICES PUBLIC ENDPOINTS ==========

@router.get("", response_model=FiscalServiceListResponse)
async def list_fiscal_services(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    category_id: str = Query(None, description="Filter by category"),
    is_active: bool = Query(True, description="Filter by active status"),
    db=Depends(get_database),
):
    """List fiscal services with pagination"""
    offset = (page - 1) * page_size
    services, total = await repository.list(db, category_id, is_active, page_size, offset)
    return FiscalServiceListResponse(
        services=[FiscalServiceResponse(**s) for s in services],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{service_id}", response_model=FiscalServiceResponse)
async def get_fiscal_service(service_id: str, db=Depends(get_database)):
    """Get fiscal service by ID"""
    service = await repository.get_by_id(db, service_id)
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    return FiscalServiceResponse(**service)


@router.post("/search", response_model=FiscalServiceListResponse)
async def search_fiscal_services(
    search: FiscalServiceSearchRequest,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db=Depends(get_database),
):
    """Advanced search for fiscal services"""
    offset = (page - 1) * page_size
    services, total = await repository.search(db, search, page_size, offset)
    return FiscalServiceListResponse(
        services=[FiscalServiceResponse(**s) for s in services],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/popular/list", response_model=List[FiscalServiceResponse])
async def get_popular_services(
    limit: int = Query(10, ge=1, le=50, description="Number of popular services"),
    db=Depends(get_database),
):
    """Get most used fiscal services"""
    services = await repository.get_popular(db, limit)
    return [FiscalServiceResponse(**s) for s in services]


@router.get("/recent/list", response_model=List[FiscalServiceResponse])
async def get_recent_services(
    limit: int = Query(10, ge=1, le=50, description="Number of recent services"),
    db=Depends(get_database),
):
    """Get recently used fiscal services"""
    services = await repository.get_recent(db, limit)
    return [FiscalServiceResponse(**s) for s in services]


@router.post("/calculate", response_model=CalculateServiceResponse)
async def calculate_service_amount(
    request: CalculateServiceRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_database),
):
    """Calculate amount for a fiscal service"""
    user_id = current_user["sub"]

    # Verify service exists
    service = await repository.get_by_id(db, request.fiscal_service_id)
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")

    try:
        # Calculate
        result = await calculation_service.calculate(db, request.fiscal_service_id, request.input_data)

        # Increment usage counter
        await repository.increment_usage(db, request.fiscal_service_id)

        logger.info(f"User {user_id} calculated service {request.fiscal_service_id}")
        return CalculateServiceResponse(**result, created_at=result.get("created_at"))

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ========== ADMIN ENDPOINTS ==========

@router.post("/admin/services", response_model=FiscalServiceResponse, status_code=status.HTTP_201_CREATED)
async def create_fiscal_service(
    service: FiscalServiceCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_database),
    _: None = Depends(require_permission("fiscal_services.create"))
):
    """Create new fiscal service - Requires fiscal_services.create permission"""
    user_id = current_user["sub"]

    # Check if code already exists
    existing = await repository.get_by_code(db, service.code)
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Service code already exists")

    result = await repository.create(db, service)
    logger.info(f"Admin {user_id} created fiscal service {result['id']}")
    return FiscalServiceResponse(**result)


@router.put("/admin/services/{service_id}", response_model=FiscalServiceResponse)
async def update_fiscal_service(
    service_id: str,
    update_data: FiscalServiceUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_database),
    _: None = Depends(require_permission("fiscal_services.update"))
):
    """Update fiscal service - Requires fiscal_services.update permission"""
    user_id = current_user["sub"]

    updated = await repository.update(db, service_id, update_data)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")

    logger.info(f"Admin {user_id} updated fiscal service {service_id}")
    return FiscalServiceResponse(**updated)


@router.delete("/admin/services/{service_id}", status_code=status.HTTP_200_OK)
async def delete_fiscal_service(
    service_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db=Depends(get_database),
    _: None = Depends(require_permission("fiscal_services.delete"))
):
    """Delete fiscal service - Requires fiscal_services.delete permission"""
    user_id = current_user["sub"]

    deleted = await repository.delete(db, service_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")

    logger.info(f"Admin {user_id} deleted fiscal service {service_id}")
    return {"message": "Fiscal service deleted successfully"}
