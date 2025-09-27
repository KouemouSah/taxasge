"""
Tax Service Management API for TaxasGE Backend
Administrative CRUD operations for fiscal services management
"""

from fastapi import APIRouter, HTTPException, Depends, Query, Path, status, Body
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any
from loguru import logger
from datetime import datetime

from app.models.tax import (
    TaxService, TaxServiceCreate, TaxServiceUpdate, TaxServiceResponse,
    TaxServiceListResponse, TaxServiceSearchFilter, PriceCalculationRequest,
    PriceCalculationResponse, TaxServiceStats, ServiceCategory, ServiceSubCategory
)
from app.models.user import UserResponse
from app.repositories.tax_repository import tax_repository
from app.api.v1.auth import require_admin, require_operator, get_current_user

router = APIRouter(prefix="/taxes", tags=["Tax Management"])


@router.get("/", response_model=Dict[str, Any])
async def get_tax_management_info():
    """Get Tax Management API information"""
    return {
        "message": "TaxasGE Tax Service Management API",
        "version": "1.0.0",
        "description": "Administrative interface for managing fiscal services",
        "endpoints": {
            "list": "GET /list - List all tax services with pagination",
            "create": "POST /create - Create new tax service (admin only)",
            "update": "PUT /{service_id} - Update tax service (admin/operator)",
            "delete": "DELETE /{service_id} - Delete tax service (admin only)",
            "details": "GET /{service_id} - Get service details",
            "search": "POST /search - Advanced search with filters",
            "calculate": "POST /{service_id}/calculate - Calculate service price",
            "stats": "GET /stats - Get tax services statistics",
            "categories": "GET /categories - Manage service categories",
            "bulk": "POST /bulk - Bulk operations"
        },
        "features": [
            "Full CRUD operations for tax services",
            "Category and subcategory management",
            "Advanced search and filtering",
            "Real-time price calculation",
            "Bulk operations support",
            "Comprehensive statistics",
            "Multi-language support",
            "Activity logging"
        ]
    }


@router.get("/list", response_model=TaxServiceListResponse)
async def list_tax_services(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Page size"),
    category_id: Optional[str] = Query(None, description="Filter by category"),
    status: Optional[str] = Query(None, description="Filter by status"),
    language: str = Query("es", pattern="^(es|fr|en)$", description="Response language"),
    current_user: UserResponse = Depends(get_current_user)
):
    """List all tax services with pagination and filtering"""
    try:
        # Build filters
        filters = {}
        if category_id:
            filters["category_id"] = category_id
        if status:
            filters["status"] = status

        # Calculate offset
        offset = (page - 1) * size

        # Get services from repository
        services = await tax_repository.find_all(
            filters=filters,
            limit=size,
            offset=offset,
            order_by="created_at DESC"
        )

        # Get total count
        total = await tax_repository.count(filters)

        # Calculate pagination info
        pages = (total + size - 1) // size

        # Get categories if needed
        categories = await tax_repository.get_categories() if page == 1 else None

        # Log activity
        await tax_repository.log_activity(
            user_id=current_user.id,
            action="list_tax_services",
            metadata={
                "page": page,
                "size": size,
                "filters": filters,
                "total_results": total
            }
        )

        return TaxServiceListResponse(
            services=services,
            total=total,
            page=page,
            size=size,
            pages=pages,
            categories=categories
        )

    except Exception as e:
        logger.error(f"L Error listing tax services: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving tax services"
        )


@router.post("/create", response_model=TaxServiceResponse)
async def create_tax_service(
    service_data: TaxServiceCreate,
    admin_user: UserResponse = Depends(require_admin)
):
    """Create new tax service (admin only)"""
    try:
        # Check if service code already exists
        existing = await tax_repository.find_by_code(service_data.code)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Service with code '{service_data.code}' already exists"
            )

        # Create service
        new_service = await tax_repository.create_service(service_data)
        if not new_service:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create tax service"
            )

        # Log activity
        await tax_repository.log_activity(
            user_id=admin_user.id,
            action="create_tax_service",
            resource=new_service.id,
            metadata={
                "service_code": service_data.code,
                "service_name": service_data.name_es,
                "category_id": service_data.category_id
            }
        )

        logger.info(f" Tax service created: {new_service.id} by admin {admin_user.id}")
        return new_service

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"L Error creating tax service: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating tax service"
        )


@router.get("/{service_id}", response_model=TaxServiceResponse)
async def get_tax_service(
    service_id: str = Path(..., description="Tax service ID"),
    language: str = Query("es", pattern="^(es|fr|en)$", description="Response language"),
    current_user: UserResponse = Depends(get_current_user)
):
    """Get tax service details"""
    try:
        service = await tax_repository.find_by_id(service_id)
        if not service:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tax service '{service_id}' not found"
            )

        # Log activity
        await tax_repository.log_activity(
            user_id=current_user.id,
            action="view_tax_service",
            resource=service_id,
            metadata={"language": language}
        )

        return service

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"L Error getting tax service {service_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving tax service"
        )


@router.put("/{service_id}", response_model=TaxServiceResponse)
async def update_tax_service(
    service_id: str = Path(..., description="Tax service ID"),
    updates: TaxServiceUpdate = Body(...),
    operator_user: UserResponse = Depends(require_operator)
):
    """Update tax service (admin/operator)"""
    try:
        # Check if service exists
        existing_service = await tax_repository.find_by_id(service_id)
        if not existing_service:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tax service '{service_id}' not found"
            )

        # Update service
        updated_service = await tax_repository.update_service(service_id, updates)
        if not updated_service:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update tax service"
            )

        # Log activity
        await tax_repository.log_activity(
            user_id=operator_user.id,
            action="update_tax_service",
            resource=service_id,
            metadata={
                "updated_fields": [k for k, v in updates.dict(exclude_unset=True).items() if v is not None],
                "previous_status": existing_service.status.value,
                "new_status": updates.status.value if updates.status else existing_service.status.value
            }
        )

        logger.info(f" Tax service updated: {service_id} by {operator_user.role.value} {operator_user.id}")
        return updated_service

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"L Error updating tax service {service_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating tax service"
        )


@router.delete("/{service_id}")
async def delete_tax_service(
    service_id: str = Path(..., description="Tax service ID"),
    admin_user: UserResponse = Depends(require_admin)
):
    """Delete tax service (admin only)"""
    try:
        # Check if service exists
        existing_service = await tax_repository.find_by_id(service_id)
        if not existing_service:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tax service '{service_id}' not found"
            )

        # Check if service has active declarations
        active_declarations = await tax_repository.has_active_declarations(service_id)
        if active_declarations:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete service with active declarations"
            )

        # Delete service
        success = await tax_repository.delete(service_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete tax service"
            )

        # Log activity
        await tax_repository.log_activity(
            user_id=admin_user.id,
            action="delete_tax_service",
            resource=service_id,
            metadata={
                "service_code": existing_service.code,
                "service_name": existing_service.name_es,
                "category_id": existing_service.category_id
            }
        )

        logger.info(f" Tax service deleted: {service_id} by admin {admin_user.id}")
        return {
            "success": True,
            "message": f"Tax service '{service_id}' deleted successfully",
            "deleted_at": datetime.utcnow().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"L Error deleting tax service {service_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting tax service"
        )


@router.post("/search", response_model=TaxServiceListResponse)
async def search_tax_services(
    search_filter: TaxServiceSearchFilter,
    current_user: UserResponse = Depends(get_current_user)
):
    """Advanced search for tax services"""
    try:
        # Perform search
        services = await tax_repository.search_services(search_filter)

        # Get total count for pagination
        total = len(services)  # For simplicity, could be optimized with separate count query

        # Log activity
        await tax_repository.log_activity(
            user_id=current_user.id,
            action="search_tax_services",
            metadata={
                "query": search_filter.query,
                "filters": search_filter.dict(exclude_unset=True),
                "results_count": total
            }
        )

        return TaxServiceListResponse(
            services=services,
            total=total,
            page=1,
            size=len(services),
            pages=1
        )

    except Exception as e:
        logger.error(f"L Error searching tax services: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error searching tax services"
        )


@router.post("/{service_id}/calculate", response_model=PriceCalculationResponse)
async def calculate_service_price(
    calculation_request: PriceCalculationRequest,
    service_id: str = Path(..., description="Tax service ID"),
    current_user: UserResponse = Depends(get_current_user)
):
    """Calculate price for tax service"""
    try:
        # Get service
        service = await tax_repository.find_by_id(service_id)
        if not service:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tax service '{service_id}' not found"
            )

        # Perform calculation
        calculation_result = await tax_repository.calculate_price(service, calculation_request)

        # Log activity
        await tax_repository.log_activity(
            user_id=current_user.id,
            action="calculate_service_price",
            resource=service_id,
            metadata={
                "base_amount": calculation_request.base_amount,
                "quantity": calculation_request.quantity,
                "is_urgent": calculation_request.is_urgent,
                "calculated_total": calculation_result.total_price
            }
        )

        return calculation_result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"L Error calculating price for service {service_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error calculating service price"
        )


@router.get("/stats/overview", response_model=TaxServiceStats)
async def get_tax_services_stats(
    admin_user: UserResponse = Depends(require_admin)
):
    """Get comprehensive tax services statistics (admin only)"""
    try:
        stats = await tax_repository.get_service_stats()

        # Log activity
        await tax_repository.log_activity(
            user_id=admin_user.id,
            action="view_tax_stats",
            metadata={"total_services": stats.total_services}
        )

        return stats

    except Exception as e:
        logger.error(f"L Error getting tax services stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving tax services statistics"
        )


@router.get("/categories", response_model=List[ServiceCategory])
async def get_service_categories(
    current_user: UserResponse = Depends(get_current_user)
):
    """Get all service categories"""
    try:
        categories = await tax_repository.get_categories()

        # Log activity
        await tax_repository.log_activity(
            user_id=current_user.id,
            action="view_categories",
            metadata={"categories_count": len(categories)}
        )

        return categories

    except Exception as e:
        logger.error(f"L Error getting service categories: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving service categories"
        )


@router.post("/categories", response_model=ServiceCategory)
async def create_service_category(
    category_data: ServiceCategory,
    admin_user: UserResponse = Depends(require_admin)
):
    """Create new service category (admin only)"""
    try:
        # Check if category already exists
        existing = await tax_repository.find_category_by_id(category_data.id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Category with ID '{category_data.id}' already exists"
            )

        # Create category
        new_category = await tax_repository.create_category(category_data)
        if not new_category:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create service category"
            )

        # Log activity
        await tax_repository.log_activity(
            user_id=admin_user.id,
            action="create_category",
            resource=new_category.id,
            metadata={
                "category_name_es": category_data.name_es,
                "parent_id": category_data.parent_id
            }
        )

        logger.info(f" Service category created: {new_category.id} by admin {admin_user.id}")
        return new_category

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"L Error creating service category: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating service category"
        )


@router.post("/bulk/import")
async def bulk_import_services(
    services_data: List[TaxServiceCreate],
    admin_user: UserResponse = Depends(require_admin)
):
    """Bulk import tax services (admin only)"""
    try:
        if len(services_data) > 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bulk import limited to 100 services per request"
            )

        # Process bulk import
        results = await tax_repository.bulk_create_services(services_data)

        # Log activity
        await tax_repository.log_activity(
            user_id=admin_user.id,
            action="bulk_import_services",
            metadata={
                "total_services": len(services_data),
                "successful_imports": len(results["successful"]),
                "failed_imports": len(results["failed"])
            }
        )

        logger.info(f" Bulk import completed: {len(results['successful'])}/{len(services_data)} services imported by admin {admin_user.id}")

        return {
            "success": True,
            "total_processed": len(services_data),
            "successful_imports": len(results["successful"]),
            "failed_imports": len(results["failed"]),
            "successful_services": results["successful"],
            "failed_services": results["failed"],
            "imported_at": datetime.utcnow().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"L Error in bulk import: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error processing bulk import"
        )


@router.post("/bulk/update-status")
async def bulk_update_service_status(
    service_ids: List[str] = Body(..., description="List of service IDs"),
    new_status: str = Body(..., description="New status for all services"),
    admin_user: UserResponse = Depends(require_admin)
):
    """Bulk update service status (admin only)"""
    try:
        if len(service_ids) > 50:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bulk status update limited to 50 services per request"
            )

        # Validate status
        from app.models.tax import ServiceStatus
        try:
            status_enum = ServiceStatus(new_status)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status: {new_status}"
            )

        # Process bulk update
        results = await tax_repository.bulk_update_status(service_ids, status_enum)

        # Log activity
        await tax_repository.log_activity(
            user_id=admin_user.id,
            action="bulk_update_status",
            metadata={
                "service_ids": service_ids,
                "new_status": new_status,
                "updated_count": results["updated_count"]
            }
        )

        logger.info(f" Bulk status update completed: {results['updated_count']}/{len(service_ids)} services updated by admin {admin_user.id}")

        return {
            "success": True,
            "total_requested": len(service_ids),
            "updated_count": results["updated_count"],
            "failed_updates": results["failed_updates"],
            "new_status": new_status,
            "updated_at": datetime.utcnow().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"L Error in bulk status update: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error processing bulk status update"
        )