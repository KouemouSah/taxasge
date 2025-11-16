"""
📁 TaxasGE Files API
Firebase Storage file upload/download management
Supports declarations, fiscal services, user documents, and system assets

Author: KOUEMOU SAH Jean Emac
Date: 16 novembre 2025
Version: 1.0.0
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Query, Path, status
from fastapi.responses import StreamingResponse, JSONResponse
from typing import List, Optional, Dict, Any
from uuid import UUID
import uuid
from datetime import datetime
from loguru import logger

from app.services.firebase_storage_service import (
    firebase_storage_service,
    UploadResult,
    DownloadResult,
    get_taxasge_folder_info
)
from app.api.v1.auth import require_admin, require_operator, get_current_user
from app.models.user import UserResponse

router = APIRouter(prefix="/files", tags=["Files"])


# ============================================================================
# INFORMATION ENDPOINT
# ============================================================================

@router.get("/", response_model=Dict[str, Any])
async def get_files_info():
    """Get Files API information and capabilities"""
    return {
        "message": "TaxasGE Files API - Firebase Storage Management",
        "version": "1.0.0",
        "description": "Upload, download, and manage files in Firebase Storage with security rules",
        "endpoints": {
            "upload_declaration": "POST /upload/declaration - Upload declaration attachment",
            "upload_fiscal_service": "POST /upload/fiscal-service - Upload fiscal service attachment",
            "upload_user_document": "POST /upload/user-document - Upload user document",
            "upload_profile_picture": "POST /upload/profile-picture - Upload profile picture",
            "upload_official_document": "POST /upload/official-document - Upload official document (admin)",
            "upload_tax_form_template": "POST /upload/tax-form-template - Upload tax form template (admin)",
            "upload_system_asset": "POST /upload/system-asset - Upload system asset (admin)",
            "upload_backup": "POST /upload/backup - Upload backup (admin)",
            "upload_report": "POST /upload/report - Upload report (admin)",
            "upload_audit_document": "POST /upload/audit-document - Upload audit document (admin)",
            "upload_notification_attachment": "POST /upload/notification-attachment - Upload notification attachment",
            "upload_temporary": "POST /upload/temporary - Upload temporary file",
            "download": "GET /{file_path}/download - Download file",
            "delete": "DELETE /{file_path} - Delete file",
            "info": "GET /info - Get storage folder information"
        },
        "features": [
            "100% aligned with storage.rules (11 folders)",
            "Automatic file validation (size, MIME type, hash)",
            "Separation: declarations vs fiscal services",
            "Metadata tracking (uploadedBy, uploadedAt, applicationId)",
            "Antivirus protection (dangerous extensions blocked)",
            "GDPR-compliant retention policies (365 days)",
            "Row-level security access control",
            "Hash-based deduplication (SHA-256)"
        ],
        "storage_structure": get_taxasge_folder_info(),
        "file_limits": {
            "max_size_general": "10MB",
            "max_size_documents": "5MB",
            "max_size_images": "2MB",
            "supported_formats": ["PDF", "DOC", "DOCX", "XLS", "XLSX", "JPG", "PNG", "WEBP", "JSON"],
            "blocked_extensions": [".exe", ".bat", ".cmd", ".scr", ".vbs", ".ps1"]
        },
        "security": {
            "authentication": "Required for all uploads",
            "authorization": "Based on user role (admin/operator/user)",
            "storage_rules": "Firebase security rules enforced",
            "encryption": "At-rest and in-transit encryption"
        }
    }


@router.get("/info", response_model=Dict[str, Any])
async def get_storage_info():
    """Get detailed storage folder information"""
    return {
        "storage_structure": get_taxasge_folder_info(),
        "total_folders": 11,
        "service_methods": 13,
        "alignment": "100% with storage.rules"
    }


# ============================================================================
# DECLARATION ATTACHMENTS
# ============================================================================

@router.post("/upload/declaration", response_model=UploadResult, status_code=status.HTTP_201_CREATED)
async def upload_declaration_attachment(
    file: UploadFile = File(...),
    application_id: str = Form(...),
    declaration_type: str = Form(..., description="IVA, IRPF, TVA, etc."),
    allowed_users: List[str] = Form(..., description="User IDs with access"),
    metadata: Optional[str] = Form(None, description="JSON metadata"),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Upload declaration attachment (IVA, IRPF, TVA declarations)

    Storage path: application-attachments/{applicationId}/{fileName}
    Metadata: attachmentType="declaration", declarationType=IVA/IRPF/TVA
    """
    try:
        # Parse metadata if provided
        import json
        parsed_metadata = json.loads(metadata) if metadata else {}

        # Add user info to metadata
        parsed_metadata["uploadedBy"] = str(current_user.id)

        result = await firebase_storage_service.upload_declaration_attachment(
            application_id=application_id,
            file=file.file,
            allowed_users=allowed_users,
            declaration_type=declaration_type,
            metadata=parsed_metadata
        )

        logger.info(f"Declaration attachment uploaded: {result.file_id} by user {current_user.id}")
        return result

    except ValueError as e:
        logger.error(f"Validation error uploading declaration: {str(e)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error uploading declaration attachment: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ============================================================================
# FISCAL SERVICE ATTACHMENTS
# ============================================================================

@router.post("/upload/fiscal-service", response_model=UploadResult, status_code=status.HTTP_201_CREATED)
async def upload_fiscal_service_attachment(
    file: UploadFile = File(...),
    application_id: str = Form(...),
    service_type: str = Form(..., description="fiscal_json, etc."),
    allowed_users: List[str] = Form(..., description="User IDs with access"),
    metadata: Optional[str] = Form(None, description="JSON metadata"),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Upload fiscal service attachment (fiscal_json services)

    Storage path: application-attachments/{applicationId}/{fileName}
    Metadata: attachmentType="fiscal_service", serviceType=fiscal_json
    """
    try:
        # Parse metadata if provided
        import json
        parsed_metadata = json.loads(metadata) if metadata else {}

        # Add user info to metadata
        parsed_metadata["uploadedBy"] = str(current_user.id)

        result = await firebase_storage_service.upload_fiscal_service_attachment(
            application_id=application_id,
            file=file.file,
            allowed_users=allowed_users,
            service_type=service_type,
            metadata=parsed_metadata
        )

        logger.info(f"Fiscal service attachment uploaded: {result.file_id} by user {current_user.id}")
        return result

    except ValueError as e:
        logger.error(f"Validation error uploading fiscal service: {str(e)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error uploading fiscal service attachment: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ============================================================================
# USER DOCUMENTS
# ============================================================================

@router.post("/upload/user-document", response_model=UploadResult, status_code=status.HTTP_201_CREATED)
async def upload_user_document_endpoint(
    file: UploadFile = File(...),
    application_id: str = Form(...),
    metadata: Optional[str] = Form(None, description="JSON metadata"),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Upload user document

    Storage path: user-documents/{userId}/{applicationId}/{fileName}
    """
    try:
        # Parse metadata if provided
        import json
        parsed_metadata = json.loads(metadata) if metadata else {}

        result = await firebase_storage_service.upload_user_document(
            user_id=str(current_user.id),
            application_id=application_id,
            file=file.file,
            metadata=parsed_metadata
        )

        logger.info(f"User document uploaded: {result.file_id} by user {current_user.id}")
        return result

    except ValueError as e:
        logger.error(f"Validation error uploading user document: {str(e)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error uploading user document: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ============================================================================
# PROFILE PICTURES
# ============================================================================

@router.post("/upload/profile-picture", response_model=UploadResult, status_code=status.HTTP_201_CREATED)
async def upload_profile_picture_endpoint(
    file: UploadFile = File(...),
    metadata: Optional[str] = Form(None, description="JSON metadata"),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Upload profile picture

    Storage path: profile-pictures/{userId}/{fileName}
    Max size: 2MB
    """
    try:
        # Parse metadata if provided
        import json
        parsed_metadata = json.loads(metadata) if metadata else {}

        result = await firebase_storage_service.upload_profile_picture(
            user_id=str(current_user.id),
            file=file.file,
            metadata=parsed_metadata
        )

        logger.info(f"Profile picture uploaded: {result.file_id} by user {current_user.id}")
        return result

    except ValueError as e:
        logger.error(f"Validation error uploading profile picture: {str(e)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error uploading profile picture: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ============================================================================
# TEMPORARY FILES
# ============================================================================

@router.post("/upload/temporary", response_model=UploadResult, status_code=status.HTTP_201_CREATED)
async def upload_temporary_file_endpoint(
    file: UploadFile = File(...),
    session_id: Optional[str] = Form(None, description="Session ID (auto-generated if not provided)"),
    metadata: Optional[str] = Form(None, description="JSON metadata"),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Upload temporary file (auto-deleted after 15 minutes)

    Storage path: temp-uploads/{userId}/{sessionId}/{fileName}
    """
    try:
        # Generate session ID if not provided
        if not session_id:
            session_id = str(uuid.uuid4())

        # Parse metadata if provided
        import json
        parsed_metadata = json.loads(metadata) if metadata else {}

        result = await firebase_storage_service.upload_temporary_file(
            user_id=str(current_user.id),
            session_id=session_id,
            file=file.file,
            metadata=parsed_metadata
        )

        logger.info(f"Temporary file uploaded: {result.file_id} by user {current_user.id}")
        return result

    except ValueError as e:
        logger.error(f"Validation error uploading temporary file: {str(e)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error uploading temporary file: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ============================================================================
# ADMIN ONLY ENDPOINTS
# ============================================================================

@router.post("/upload/official-document", response_model=UploadResult, status_code=status.HTTP_201_CREATED)
async def upload_official_document_endpoint(
    file: UploadFile = File(...),
    category: str = Form(..., description="reference, service-templates, etc."),
    version: str = Form(..., description="Document version"),
    metadata: Optional[str] = Form(None, description="JSON metadata"),
    current_user: UserResponse = Depends(require_admin)
):
    """
    Upload official document (admin only)

    Storage path: official-documents/{category}/{fileName}
    """
    try:
        # Parse metadata if provided
        import json
        parsed_metadata = json.loads(metadata) if metadata else {}

        result = await firebase_storage_service.upload_official_document(
            category=category,
            file=file.file,
            official_user_id=str(current_user.id),
            version=version,
            metadata=parsed_metadata
        )

        logger.info(f"Official document uploaded: {result.file_id} by admin {current_user.id}")
        return result

    except ValueError as e:
        logger.error(f"Validation error uploading official document: {str(e)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error uploading official document: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/upload/tax-form-template", response_model=UploadResult, status_code=status.HTTP_201_CREATED)
async def upload_tax_form_template_endpoint(
    file: UploadFile = File(...),
    form_id: str = Form(..., description="IVA_DESTAJO, IMPRESO_COMUN, etc."),
    form_version: str = Form(..., description="Form version"),
    metadata: Optional[str] = Form(None, description="JSON metadata"),
    current_user: UserResponse = Depends(require_admin)
):
    """
    Upload tax form template (admin only)

    Storage path: tax-forms/{formId}/{fileName}
    """
    try:
        # Parse metadata if provided
        import json
        parsed_metadata = json.loads(metadata) if metadata else {}

        result = await firebase_storage_service.upload_tax_form_template(
            form_id=form_id,
            file=file.file,
            official_user_id=str(current_user.id),
            form_version=form_version,
            metadata=parsed_metadata
        )

        logger.info(f"Tax form template uploaded: {result.file_id} by admin {current_user.id}")
        return result

    except ValueError as e:
        logger.error(f"Validation error uploading tax form template: {str(e)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error uploading tax form template: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/upload/system-asset", response_model=UploadResult, status_code=status.HTTP_201_CREATED)
async def upload_system_asset_endpoint(
    file: UploadFile = File(...),
    asset_type: str = Form(..., description="form-templates, logos, icons, etc."),
    metadata: Optional[str] = Form(None, description="JSON metadata"),
    current_user: UserResponse = Depends(require_admin)
):
    """
    Upload system asset (admin only)

    Storage path: system-assets/{assetType}/{fileName}
    """
    try:
        # Parse metadata if provided
        import json
        parsed_metadata = json.loads(metadata) if metadata else {}

        result = await firebase_storage_service.upload_system_asset(
            asset_type=asset_type,
            file=file.file,
            admin_user_id=str(current_user.id),
            metadata=parsed_metadata
        )

        logger.info(f"System asset uploaded: {result.file_id} by admin {current_user.id}")
        return result

    except ValueError as e:
        logger.error(f"Validation error uploading system asset: {str(e)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error uploading system asset: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/upload/backup", response_model=UploadResult, status_code=status.HTTP_201_CREATED)
async def upload_backup_endpoint(
    file: UploadFile = File(...),
    backup_id: str = Form(..., description="Backup identifier"),
    metadata: Optional[str] = Form(None, description="JSON metadata"),
    current_user: UserResponse = Depends(require_admin)
):
    """
    Upload backup file (admin only)

    Storage path: backups/{backupId}/{fileName}
    """
    try:
        # Parse metadata if provided
        import json
        parsed_metadata = json.loads(metadata) if metadata else {}

        result = await firebase_storage_service.upload_backup(
            backup_id=backup_id,
            file=file.file,
            admin_user_id=str(current_user.id),
            metadata=parsed_metadata
        )

        logger.info(f"Backup uploaded: {result.file_id} by admin {current_user.id}")
        return result

    except ValueError as e:
        logger.error(f"Validation error uploading backup: {str(e)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error uploading backup: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/upload/report", response_model=UploadResult, status_code=status.HTTP_201_CREATED)
async def upload_report_endpoint(
    file: UploadFile = File(...),
    report_type: str = Form(..., description="agent-reports, system-logs, etc."),
    metadata: Optional[str] = Form(None, description="JSON metadata"),
    current_user: UserResponse = Depends(require_admin)
):
    """
    Upload report file (admin only)

    Storage path: reports/{reportType}/{fileName}
    """
    try:
        # Parse metadata if provided
        import json
        parsed_metadata = json.loads(metadata) if metadata else {}

        result = await firebase_storage_service.upload_report(
            report_type=report_type,
            file=file.file,
            admin_user_id=str(current_user.id),
            metadata=parsed_metadata
        )

        logger.info(f"Report uploaded: {result.file_id} by admin {current_user.id}")
        return result

    except ValueError as e:
        logger.error(f"Validation error uploading report: {str(e)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error uploading report: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/upload/audit-document", response_model=UploadResult, status_code=status.HTTP_201_CREATED)
async def upload_audit_document_endpoint(
    file: UploadFile = File(...),
    year: int = Form(..., description="Audit year"),
    month: int = Form(..., description="Audit month (1-12)"),
    metadata: Optional[str] = Form(None, description="JSON metadata"),
    current_user: UserResponse = Depends(require_admin)
):
    """
    Upload audit document (admin only)

    Storage path: audit-documents/{year}/{month}/{fileName}
    """
    try:
        # Parse metadata if provided
        import json
        parsed_metadata = json.loads(metadata) if metadata else {}

        result = await firebase_storage_service.upload_audit_document(
            year=year,
            month=month,
            file=file.file,
            admin_user_id=str(current_user.id),
            metadata=parsed_metadata
        )

        logger.info(f"Audit document uploaded: {result.file_id} by admin {current_user.id}")
        return result

    except ValueError as e:
        logger.error(f"Validation error uploading audit document: {str(e)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error uploading audit document: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/upload/notification-attachment", response_model=UploadResult, status_code=status.HTTP_201_CREATED)
async def upload_notification_attachment_endpoint(
    file: UploadFile = File(...),
    notification_id: str = Form(..., description="Notification identifier"),
    recipients: List[str] = Form(..., description="User IDs of recipients"),
    metadata: Optional[str] = Form(None, description="JSON metadata"),
    current_user: UserResponse = Depends(require_admin)
):
    """
    Upload notification attachment (admin only)

    Storage path: notification-attachments/{notificationId}/{fileName}
    """
    try:
        # Parse metadata if provided
        import json
        parsed_metadata = json.loads(metadata) if metadata else {}

        result = await firebase_storage_service.upload_notification_attachment(
            notification_id=notification_id,
            file=file.file,
            recipients=recipients,
            official_user_id=str(current_user.id),
            metadata=parsed_metadata
        )

        logger.info(f"Notification attachment uploaded: {result.file_id} by admin {current_user.id}")
        return result

    except ValueError as e:
        logger.error(f"Validation error uploading notification attachment: {str(e)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error uploading notification attachment: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ============================================================================
# FILE MANAGEMENT
# ============================================================================

@router.delete("/{file_path:path}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file_endpoint(
    file_path: str = Path(..., description="Full file path in storage"),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Delete file from Firebase Storage

    User can only delete their own files unless admin
    """
    try:
        await firebase_storage_service.delete_file(
            file_path=file_path,
            user_id=str(current_user.id)
        )

        logger.info(f"File deleted: {file_path} by user {current_user.id}")
        return {"message": "File deleted successfully"}

    except PermissionError as e:
        logger.error(f"Permission denied deleting file: {str(e)}")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except FileNotFoundError as e:
        logger.error(f"File not found: {str(e)}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Error deleting file: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ============================================================================
# HEALTH CHECK
# ============================================================================

@router.get("/health", response_model=Dict[str, str])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "TaxasGE Files API",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }
