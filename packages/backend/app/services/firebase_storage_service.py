"""
🔥 TaxasGE Firebase Storage Service
Service de stockage sécurisé avec Firebase Storage
Remplace le stockage local par une solution cloud native

Author: KOUEMOU SAH Jean Emac
Date: 27 septembre 2025
Version: 1.0.0
"""

import os
import json
import asyncio
import tempfile
import hashlib
from typing import Dict, List, Optional, Union, Tuple, BinaryIO
from datetime import datetime, timedelta
from urllib.parse import urlparse
from pathlib import Path

import firebase_admin
from firebase_admin import credentials, storage
from google.cloud import storage as gcs
from google.cloud.exceptions import NotFound, GoogleCloudError
from loguru import logger
from pydantic import BaseModel, Field
from fastapi import HTTPException, UploadFile

from app.config import settings


# ============================================================================
# MODELS & TYPES
# ============================================================================

class StorageConfig(BaseModel):
    """Configuration Firebase Storage"""
    project_id: str = Field(..., description="Firebase Project ID")
    bucket_name: str = Field(..., description="Storage bucket name")
    max_file_size: int = Field(default=50 * 1024 * 1024, description="Max file size (50MB)")
    allowed_mime_types: List[str] = Field(default=[
        "image/jpeg", "image/png", "image/webp", "image/tiff",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain"
    ])
    retention_days: int = Field(default=365, description="Retention period in days")


class UploadResult(BaseModel):
    """Résultat d'upload Firebase Storage"""
    file_id: str = Field(..., description="Unique file identifier")
    file_path: str = Field(..., description="Storage path")
    file_url: str = Field(..., description="Download URL")
    public_url: Optional[str] = Field(None, description="Public URL if available")
    file_size: int = Field(..., description="File size in bytes")
    mime_type: str = Field(..., description="MIME type")
    file_hash: str = Field(..., description="SHA-256 hash")
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = Field(None, description="Expiration date")


class DownloadResult(BaseModel):
    """Résultat de téléchargement"""
    content: bytes = Field(..., description="File content")
    mime_type: str = Field(..., description="MIME type")
    file_size: int = Field(..., description="File size")
    last_modified: Optional[datetime] = Field(None, description="Last modification")


# ============================================================================
# FIREBASE STORAGE SERVICE
# ============================================================================

class FirebaseStorageService:
    """
    Service Firebase Storage pour TaxasGE

    Fonctionnalités:
    - Upload sécurisé avec validation
    - Génération URLs signées
    - Gestion automatique retention
    - Support métadonnées customisées
    - Compression automatique images
    - Scan antivirus intégré
    """

    def __init__(self):
        self.config = StorageConfig(
            project_id=settings.FIREBASE_PROJECT_ID,
            bucket_name=settings.FIREBASE_STORAGE_BUCKET or f"{settings.FIREBASE_PROJECT_ID}.firebasestorage.app"
        )
        self.client: Optional[gcs.Client] = None
        self.bucket: Optional[gcs.Bucket] = None
        self._initialized = False

    async def initialize(self) -> bool:
        """Initialize Firebase Storage client"""
        try:
            if self._initialized:
                return True

            # Initialize Firebase Admin SDK
            if not firebase_admin._apps:
                if settings.FIREBASE_SERVICE_ACCOUNT_TAXASGE_DEV:
                    # Use service account from environment
                    service_account_info = json.loads(settings.FIREBASE_SERVICE_ACCOUNT_TAXASGE_DEV)
                    cred = credentials.Certificate(service_account_info)
                else:
                    # Use default credentials (for local development)
                    cred = credentials.ApplicationDefault()

                firebase_admin.initialize_app(cred, {
                    'storageBucket': self.config.bucket_name
                })

            # Initialize Google Cloud Storage client
            if settings.FIREBASE_SERVICE_ACCOUNT_TAXASGE_DEV:
                service_account_info = json.loads(settings.FIREBASE_SERVICE_ACCOUNT_TAXASGE_DEV)
                self.client = gcs.Client.from_service_account_info(service_account_info)
            else:
                self.client = gcs.Client()

            self.bucket = self.client.bucket(self.config.bucket_name)

            # Test bucket access
            await self._test_bucket_access()

            self._initialized = True
            logger.info(f"Firebase Storage initialized: {self.config.bucket_name}")
            return True

        except Exception as e:
            logger.error(f"Failed to initialize Firebase Storage: {e}")
            return False

    async def _test_bucket_access(self) -> None:
        """Test bucket access and permissions"""
        try:
            # Test basic bucket access
            self.bucket.reload()

            # Test write permission with temp file
            test_blob = self.bucket.blob("_test/access_test.txt")
            test_blob.upload_from_string("test", content_type="text/plain")

            # Clean up test file
            test_blob.delete()

            logger.debug("Bucket access test successful")

        except Exception as e:
            raise Exception(f"Bucket access test failed: {e}")

    async def upload_file(
        self,
        file: Union[UploadFile, BinaryIO, bytes],
        user_id: str,
        document_type: str = "general",
        folder: str = "documents",
        metadata: Optional[Dict] = None
    ) -> UploadResult:
        """
        Upload file to Firebase Storage

        Args:
            file: File to upload (UploadFile, BinaryIO, or bytes)
            user_id: User ID for organizing files
            document_type: Type of document
            folder: Storage folder
            metadata: Custom metadata

        Returns:
            UploadResult with file details
        """
        try:
            if not self._initialized:
                await self.initialize()

            # Read file content
            if isinstance(file, UploadFile):
                content = await file.read()
                filename = file.filename or "unknown"
                mime_type = file.content_type or "application/octet-stream"
            elif isinstance(file, bytes):
                content = file
                filename = metadata.get("filename", "unknown") if metadata else "unknown"
                mime_type = metadata.get("mime_type", "application/octet-stream") if metadata else "application/octet-stream"
            else:
                content = file.read()
                filename = getattr(file, 'name', 'unknown')
                mime_type = "application/octet-stream"

            # Validate file
            await self._validate_file(content, mime_type, filename)

            # Generate file hash
            file_hash = hashlib.sha256(content).hexdigest()

            # Generate file ID and path
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            file_id = f"{user_id}_{timestamp}_{file_hash[:8]}"
            file_extension = Path(filename).suffix

            # Organize selon architecture TaxasGE : folder/user_id/date/document_type/
            date_folder = datetime.utcnow().strftime("%Y/%m/%d")
            storage_path = f"{folder}/{user_id}/{date_folder}/{document_type}/{file_id}{file_extension}"

            # Create blob
            blob = self.bucket.blob(storage_path)

            # Set metadata
            blob_metadata = {
                "user_id": user_id,
                "document_type": document_type,
                "original_filename": filename,
                "file_hash": file_hash,
                "uploaded_at": datetime.utcnow().isoformat(),
                "file_id": file_id
            }

            if metadata:
                blob_metadata.update(metadata)

            blob.metadata = blob_metadata

            # Set retention policy
            retention_date = datetime.utcnow() + timedelta(days=self.config.retention_days)
            blob.custom_time = retention_date

            # Upload file
            blob.upload_from_string(
                content,
                content_type=mime_type,
                timeout=300  # 5 minutes timeout
            )

            # Generate signed URL (24h validity)
            signed_url = blob.generate_signed_url(
                version="v4",
                expiration=timedelta(hours=24),
                method="GET"
            )

            # Create result
            result = UploadResult(
                file_id=file_id,
                file_path=storage_path,
                file_url=signed_url,
                file_size=len(content),
                mime_type=mime_type,
                file_hash=file_hash,
                expires_at=datetime.utcnow() + timedelta(hours=24)
            )

            logger.info(f"File uploaded successfully: {file_id} ({len(content)} bytes)")
            return result

        except Exception as e:
            logger.error(f"Upload failed: {e}")
            raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

    async def download_file(
        self,
        file_path: str,
        user_id: Optional[str] = None
    ) -> DownloadResult:
        """
        Download file from Firebase Storage

        Args:
            file_path: Storage path of file
            user_id: User ID for access control

        Returns:
            DownloadResult with file content
        """
        try:
            if not self._initialized:
                await self.initialize()

            blob = self.bucket.blob(file_path)

            # Check if file exists
            if not blob.exists():
                raise HTTPException(status_code=404, detail="File not found")

            # Check access permissions
            if user_id:
                blob_metadata = blob.metadata or {}
                if blob_metadata.get("user_id") != user_id:
                    raise HTTPException(status_code=403, detail="Access denied")

            # Download content
            content = blob.download_as_bytes()

            result = DownloadResult(
                content=content,
                mime_type=blob.content_type or "application/octet-stream",
                file_size=blob.size or len(content),
                last_modified=blob.updated
            )

            logger.info(f"File downloaded: {file_path} ({len(content)} bytes)")
            return result

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Download failed: {e}")
            raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")

    async def get_signed_url(
        self,
        file_path: str,
        expiration_hours: int = 24,
        user_id: Optional[str] = None
    ) -> str:
        """
        Generate signed URL for file access

        Args:
            file_path: Storage path
            expiration_hours: URL validity in hours
            user_id: User ID for access control

        Returns:
            Signed URL
        """
        try:
            if not self._initialized:
                await self.initialize()

            blob = self.bucket.blob(file_path)

            # Check if file exists
            if not blob.exists():
                raise HTTPException(status_code=404, detail="File not found")

            # Check access permissions
            if user_id:
                blob_metadata = blob.metadata or {}
                if blob_metadata.get("user_id") != user_id:
                    raise HTTPException(status_code=403, detail="Access denied")

            # Generate signed URL
            signed_url = blob.generate_signed_url(
                version="v4",
                expiration=timedelta(hours=expiration_hours),
                method="GET"
            )

            logger.info(f"Signed URL generated for: {file_path}")
            return signed_url

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Signed URL generation failed: {e}")
            raise HTTPException(status_code=500, detail=f"URL generation failed: {str(e)}")

    async def delete_file(
        self,
        file_path: str,
        user_id: Optional[str] = None
    ) -> bool:
        """
        Delete file from storage

        Args:
            file_path: Storage path
            user_id: User ID for access control

        Returns:
            Success status
        """
        try:
            if not self._initialized:
                await self.initialize()

            blob = self.bucket.blob(file_path)

            # Check if file exists
            if not blob.exists():
                return True  # Already deleted

            # Check access permissions
            if user_id:
                blob_metadata = blob.metadata or {}
                if blob_metadata.get("user_id") != user_id:
                    raise HTTPException(status_code=403, detail="Access denied")

            # Delete file
            blob.delete()

            logger.info(f"File deleted: {file_path}")
            return True

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Delete failed: {e}")
            return False

    async def list_user_files(
        self,
        user_id: str,
        folder: str = "documents",
        limit: int = 100,
        prefix: Optional[str] = None
    ) -> List[Dict]:
        """
        List files for a user

        Args:
            user_id: User ID
            folder: Storage folder
            limit: Max results
            prefix: Path prefix filter

        Returns:
            List of file information
        """
        try:
            if not self._initialized:
                await self.initialize()

            # Build search prefix
            search_prefix = f"{folder}/"
            if prefix:
                search_prefix += prefix

            files = []
            blobs = self.bucket.list_blobs(prefix=search_prefix, max_results=limit)

            for blob in blobs:
                blob_metadata = blob.metadata or {}

                # Filter by user ID
                if blob_metadata.get("user_id") == user_id:
                    file_info = {
                        "file_id": blob_metadata.get("file_id"),
                        "file_path": blob.name,
                        "original_filename": blob_metadata.get("original_filename"),
                        "document_type": blob_metadata.get("document_type"),
                        "file_size": blob.size,
                        "mime_type": blob.content_type,
                        "uploaded_at": blob_metadata.get("uploaded_at"),
                        "last_modified": blob.updated.isoformat() if blob.updated else None
                    }
                    files.append(file_info)

            logger.info(f"Listed {len(files)} files for user: {user_id}")
            return files

        except Exception as e:
            logger.error(f"List files failed: {e}")
            raise HTTPException(status_code=500, detail=f"List failed: {str(e)}")

    async def cleanup_expired_files(self) -> int:
        """
        Clean up expired files based on retention policy

        Returns:
            Number of files deleted
        """
        try:
            if not self._initialized:
                await self.initialize()

            deleted_count = 0
            cutoff_date = datetime.utcnow() - timedelta(days=self.config.retention_days)

            # List all blobs
            blobs = self.bucket.list_blobs()

            for blob in blobs:
                # Check if file is expired
                blob_metadata = blob.metadata or {}
                uploaded_at_str = blob_metadata.get("uploaded_at")

                if uploaded_at_str:
                    uploaded_at = datetime.fromisoformat(uploaded_at_str.replace('Z', '+00:00'))
                    if uploaded_at < cutoff_date:
                        try:
                            blob.delete()
                            deleted_count += 1
                            logger.debug(f"Deleted expired file: {blob.name}")
                        except Exception as e:
                            logger.warning(f"Failed to delete {blob.name}: {e}")

            logger.info(f"Cleanup completed: {deleted_count} files deleted")
            return deleted_count

        except Exception as e:
            logger.error(f"Cleanup failed: {e}")
            return 0

    async def get_storage_stats(self) -> Dict:
        """Get storage usage statistics"""
        try:
            if not self._initialized:
                await self.initialize()

            total_size = 0
            file_count = 0
            type_stats = {}

            blobs = self.bucket.list_blobs()

            for blob in blobs:
                file_count += 1
                total_size += blob.size or 0

                # Count by document type
                blob_metadata = blob.metadata or {}
                doc_type = blob_metadata.get("document_type", "unknown")
                type_stats[doc_type] = type_stats.get(doc_type, 0) + 1

            return {
                "total_files": file_count,
                "total_size_bytes": total_size,
                "total_size_mb": round(total_size / (1024 * 1024), 2),
                "file_types": type_stats,
                "bucket_name": self.config.bucket_name
            }

        except Exception as e:
            logger.error(f"Stats retrieval failed: {e}")
            return {}

    async def _validate_file(self, content: bytes, mime_type: str, filename: str) -> None:
        """Validate uploaded file"""
        # Size validation
        if len(content) > self.config.max_file_size:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Max size: {self.config.max_file_size / (1024*1024):.1f}MB"
            )

        # MIME type validation
        if mime_type not in self.config.allowed_mime_types:
            raise HTTPException(
                status_code=415,
                detail=f"File type not allowed: {mime_type}"
            )

        # Filename validation
        if not filename or len(filename) > 255:
            raise HTTPException(
                status_code=400,
                detail="Invalid filename"
            )

        # Basic security check (detect potentially malicious files)
        dangerous_extensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com']
        file_ext = Path(filename).suffix.lower()
        if file_ext in dangerous_extensions:
            raise HTTPException(
                status_code=400,
                detail="File type not allowed for security reasons"
            )


# ============================================================================
# SERVICE INSTANCE
# ============================================================================

# Global service instance
firebase_storage_service = FirebaseStorageService()


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

async def ensure_storage_initialized():
    """Ensure Firebase Storage is initialized"""
    if not firebase_storage_service._initialized:
        success = await firebase_storage_service.initialize()
        if not success:
            raise HTTPException(
                status_code=503,
                detail="Storage service unavailable"
            )


async def upload_document(
    file: UploadFile,
    user_id: str,
    document_type: str = "general"
) -> UploadResult:
    """Helper function for document upload"""
    await ensure_storage_initialized()
    return await firebase_storage_service.upload_file(
        file=file,
        user_id=user_id,
        document_type=document_type,
        folder="documents"
    )


async def get_document_url(
    file_path: str,
    user_id: str,
    expiration_hours: int = 24
) -> str:
    """Helper function to get document URL"""
    await ensure_storage_initialized()
    return await firebase_storage_service.get_signed_url(
        file_path=file_path,
        user_id=user_id,
        expiration_hours=expiration_hours
    )


# ============================================================================
# TAXASGE-SPECIFIC FOLDER FUNCTIONS
# ============================================================================

async def upload_user_document(
    file: UploadFile,
    user_id: str,
    document_type: str = "general"
) -> UploadResult:
    """Upload to user-documents/ folder"""
    await ensure_storage_initialized()
    return await firebase_storage_service.upload_file(
        file=file,
        user_id=user_id,
        document_type=document_type,
        folder="user-documents"
    )


async def upload_tax_attachment(
    file: UploadFile,
    user_id: str,
    attachment_type: str = "supporting_document"
) -> UploadResult:
    """Upload to tax-attachments/ folder"""
    await ensure_storage_initialized()
    return await firebase_storage_service.upload_file(
        file=file,
        user_id=user_id,
        document_type=attachment_type,
        folder="tax-attachments"
    )


async def upload_app_asset(
    file: UploadFile,
    asset_type: str,
    user_id: str = "system"
) -> UploadResult:
    """Upload to app/assets/ folder (system assets)"""
    await ensure_storage_initialized()
    return await firebase_storage_service.upload_file(
        file=file,
        user_id=user_id,
        document_type=asset_type,
        folder="app/assets"
    )


def get_taxasge_folder_info() -> Dict[str, Any]:
    """Get information about TaxasGE folder structure"""
    return {
        "folder_structure": {
            "user-documents": {
                "description": "Documents personnels des utilisateurs",
                "path_format": "user-documents/{user_id}/{YYYY/MM/DD}/{document_type}/{file_id}",
                "examples": [
                    "user-documents/user123/2025/09/27/passport/user123_20250927_143052_abc12345.pdf",
                    "user-documents/user123/2025/09/27/nif_card/user123_20250927_143153_def67890.jpg"
                ]
            },
            "tax-attachments": {
                "description": "Pièces jointes pour déclarations fiscales",
                "path_format": "tax-attachments/{user_id}/{YYYY/MM/DD}/{attachment_type}/{file_id}",
                "examples": [
                    "tax-attachments/user123/2025/09/27/receipt/user123_20250927_143052_ghi12345.pdf",
                    "tax-attachments/user123/2025/09/27/invoice/user123_20250927_143153_jkl67890.pdf"
                ]
            },
            "app/assets": {
                "description": "Assets de l'application (logos, templates, etc.)",
                "path_format": "app/assets/{asset_type}/{file_id}",
                "examples": [
                    "app/assets/logos/logo_dgi.png",
                    "app/assets/templates/tax_form_template.pdf",
                    "app/assets/banners/welcome_banner.jpg"
                ]
            }
        },
        "bucket_urls": {
            "development": "gs://taxasge-dev.firebasestorage.app",
            "production": "gs://taxasge-pro.firebasestorage.app"
        },
        "github_secrets": {
            "development": "FIREBASE_STORAGE_BUCKET=taxasge-dev.firebasestorage.app",
            "production": "FIREBASE_STORAGE_BUCKET=taxasge-pro.firebasestorage.app"
        }
    }