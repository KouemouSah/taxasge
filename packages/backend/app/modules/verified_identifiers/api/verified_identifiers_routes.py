"""
API Routes for Verified Identifiers

Endpoints for:
- Batch importing verified identifiers (admin)
- Statistics and monitoring (admin)
- Manual verification by agents
- Re-verification triggers
"""

from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from loguru import logger

from app.database.connection import get_db_pool
from app.modules.auth.dependencies import get_current_user, require_permission
from app.modules.users.models.user import User

from ..services.verification_service import VerificationService
from ..services.batch_import_service import BatchImportService, BatchImportError
from ..repositories.verified_identifiers_repository import VerifiedIdentifiersRepository
from ..models.verified_identifier import (
    BatchImportResult,
    ManualVerificationRequest,
    ReVerificationRequest,
    VerificationStatsResponse,
    VerificationQueueStats,
    VerificationConfigResponse,
    ServiceRequestVerificationResult,
)

router = APIRouter(prefix="/verified-identifiers", tags=["Verified Identifiers"])


# =============================================================================
# DEPENDENCIES
# =============================================================================

async def get_verification_service() -> VerificationService:
    """Get verification service instance."""
    pool = await get_db_pool()
    return VerificationService(pool)


async def get_batch_import_service() -> BatchImportService:
    """Get batch import service instance."""
    pool = await get_db_pool()
    return BatchImportService(pool)


async def get_repository() -> VerifiedIdentifiersRepository:
    """Get repository instance."""
    pool = await get_db_pool()
    return VerifiedIdentifiersRepository(pool)


# =============================================================================
# BATCH IMPORT ENDPOINTS (Admin only)
# =============================================================================

@router.post(
    "/import",
    response_model=BatchImportResult,
    dependencies=[Depends(require_permission("identifiers.import"))],
    summary="Import verified identifiers from file"
)
async def import_batch(
    file: UploadFile = File(..., description="CSV or JSON file with identifiers"),
    source: str = Form(..., description="Source: cnedoge, trafico, hacienda, ornc, registro_civil"),
    identifier_type: str = Form(..., description="Type: dni, pasaporte, permiso_residencia, nif, cuve, etc."),
    current_user: User = Depends(get_current_user),
    service: BatchImportService = Depends(get_batch_import_service)
):
    """
    Import batch of verified identifiers from external sources.

    **Admin only** - Requires `identifiers.import` permission.

    Supported formats:
    - **CSV**: `identifier,expires_at,metadata`
    - **JSON**: `{"identifiers": [{"identifier": "...", "expires_at": "...", "metadata": {...}}]}`

    Sources: cnedoge, trafico, hacienda, ornc, registro_civil, ministerio_funcion_publica

    Identifier types: dni, pasaporte, permiso_residencia, nif, cuve, matricula_vehiculo,
    certificado_conducir, registro_civil, contrato_ornc
    """
    content = await file.read()

    # Determine format from filename
    filename = file.filename or ""
    if filename.endswith(".csv"):
        file_format = "csv"
    elif filename.endswith(".json"):
        file_format = "json"
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be .csv or .json"
        )

    try:
        result = await service.import_batch(
            file_content=content,
            file_format=file_format,
            source=source,
            identifier_type=identifier_type,
            imported_by=str(current_user.id)
        )
        return result

    except BatchImportError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Batch import failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Import failed. Check file format and try again."
        )


@router.post(
    "/import/validate",
    dependencies=[Depends(require_permission("identifiers.import"))],
    summary="Validate import file without importing"
)
async def validate_import_file(
    file: UploadFile = File(..., description="CSV or JSON file to validate"),
    service: BatchImportService = Depends(get_batch_import_service)
):
    """
    Validate an import file without actually importing.

    Returns record count, sample records, and any parse errors.
    """
    content = await file.read()
    filename = file.filename or ""

    if filename.endswith(".csv"):
        file_format = "csv"
    elif filename.endswith(".json"):
        file_format = "json"
    else:
        return {"valid": False, "error": "File must be .csv or .json"}

    return await service.validate_file(content, file_format)


# =============================================================================
# STATISTICS ENDPOINTS (Admin only)
# =============================================================================

@router.get(
    "/stats",
    response_model=VerificationStatsResponse,
    dependencies=[Depends(require_permission("identifiers.stats"))],
    summary="Get verified identifiers statistics"
)
async def get_stats(
    repo: VerifiedIdentifiersRepository = Depends(get_repository)
):
    """
    Get statistics about verified identifiers.

    No sensitive data is exposed - only counts by type and source.
    """
    stats = await repo.get_stats()
    return VerificationStatsResponse(
        total_identifiers=stats["total_identifiers"],
        by_type=stats["by_type"],
        by_source=stats["by_source"],
        active_count=stats["active_count"],
        expired_count=stats["expired_count"],
        expiring_soon=stats["expiring_soon"]
    )


@router.get(
    "/queue/stats",
    response_model=VerificationQueueStats,
    dependencies=[Depends(require_permission("identifiers.stats"))],
    summary="Get verification queue statistics"
)
async def get_queue_stats(
    repo: VerifiedIdentifiersRepository = Depends(get_repository)
):
    """
    Get statistics about the verification queue.
    """
    stats = await repo.get_queue_stats()
    return VerificationQueueStats(**stats)


# =============================================================================
# CONFIGURATION ENDPOINTS (Admin only)
# =============================================================================

@router.get(
    "/config",
    response_model=List[VerificationConfigResponse],
    dependencies=[Depends(require_permission("identifiers.config"))],
    summary="Get document verification configurations"
)
async def get_verification_configs(
    active_only: bool = Query(True, description="Only return active configurations"),
    repo: VerifiedIdentifiersRepository = Depends(get_repository)
):
    """
    Get all document verification configurations.

    Shows which document types are verified and how identifiers are extracted.
    """
    configs = await repo.get_active_configs()
    return [VerificationConfigResponse(
        id=str(c["id"]),
        document_code=c["document_code"],
        identifier_type=c["identifier_type"],
        extraction_paths=c["extraction_paths"],
        source=c["source"],
        is_required=c["is_required"],
        normalization_regex=c.get("normalization_regex"),
        is_active=c["is_active"]
    ) for c in configs]


# =============================================================================
# MANUAL VERIFICATION ENDPOINTS (Agents)
# =============================================================================

@router.post(
    "/requests/{request_id}/verify-manually",
    dependencies=[Depends(require_permission("requests.verify"))],
    summary="Manually verify a service request"
)
async def verify_manually(
    request_id: str,
    body: ManualVerificationRequest,
    current_user: User = Depends(get_current_user),
    service: VerificationService = Depends(get_verification_service)
):
    """
    Agent manually marks a service request as verified.

    Use this when:
    - The identifier is valid but not in the external database yet
    - External verification is not available
    - Agent has confirmed authenticity through other means
    """
    try:
        await service.manual_verification(
            request_id=request_id,
            verified_by=str(current_user.id),
            notes=body.notes,
            identifier_types=body.identifier_types
        )
        return {"status": "verified_manually", "request_id": request_id}

    except Exception as e:
        logger.error(f"Manual verification failed for {request_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Verification failed: {e}"
        )


@router.post(
    "/requests/{request_id}/re-verify",
    dependencies=[Depends(require_permission("requests.reverify"))],
    summary="Trigger re-verification of a service request"
)
async def re_verify(
    request_id: str,
    body: Optional[ReVerificationRequest] = None,
    current_user: User = Depends(get_current_user),
    service: VerificationService = Depends(get_verification_service)
):
    """
    Agent triggers re-verification of a service request.

    Use this when:
    - External data has been updated
    - Previous verification failed due to technical issues
    - Manual verification needs to be replaced with automatic
    """
    try:
        queue_id = await service.queue_for_verification(request_id)
        return {
            "status": "queued",
            "queue_id": queue_id,
            "request_id": request_id,
            "message": "Re-verification queued successfully"
        }

    except Exception as e:
        logger.error(f"Re-verification failed for {request_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Re-verification failed: {e}"
        )


@router.get(
    "/requests/{request_id}/verification-status",
    dependencies=[Depends(require_permission("requests.verify"))],
    summary="Get verification status for a service request"
)
async def get_verification_status(
    request_id: str,
    service: VerificationService = Depends(get_verification_service)
):
    """
    Get the current verification status and details for a service request.
    """
    query = """
        SELECT verification_status, verification_details, updated_at
        FROM service_requests
        WHERE id = $1
    """
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(query, request_id)

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service request not found"
        )

    return {
        "request_id": request_id,
        "status": row["verification_status"],
        "details": row["verification_details"],
        "updated_at": row["updated_at"]
    }


# =============================================================================
# TRIGGER VERIFICATION (Internal/Background)
# =============================================================================

@router.post(
    "/requests/{request_id}/verify",
    dependencies=[Depends(require_permission("requests.verify"))],
    summary="Trigger verification for a service request"
)
async def trigger_verification(
    request_id: str,
    current_user: User = Depends(get_current_user),
    service: VerificationService = Depends(get_verification_service)
):
    """
    Manually trigger verification for a service request.

    This runs the verification immediately (synchronous).
    For background processing, use /re-verify instead.
    """
    try:
        result = await service.verify_service_request(
            request_id=request_id,
            performed_by=str(current_user.id)
        )
        return {
            "request_id": request_id,
            "status": result.status.value,
            "results": {k: v.model_dump() for k, v in result.results.items()},
            "errors": result.errors
        }

    except Exception as e:
        logger.error(f"Verification failed for {request_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Verification failed: {e}"
        )
