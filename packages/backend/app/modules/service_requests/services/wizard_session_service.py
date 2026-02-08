"""
Wizard Session Service - Cache-First Architecture.

Manages service request wizard sessions entirely in cache (Redis/Upstash)
until payment is initiated. Sessions expire after 30 minutes of inactivity.

Architecture:
- All data stored in cache until persist_to_db()
- Atomic transaction: Firebase upload + DB insert
- No orphan records in database
- Natural expiration via cache TTL

Flow:
1. start_session() - Create session in cache
2. preview_document() - Extract & store document (renews TTL)
3. confirm_document() - User confirms extraction data
4. save_form_data() - Save form review data
5. prepare_for_payment() - Validate & calculate tariff
6. persist_to_db() - Atomic: Firebase + DB (called by payment processor)

@since v2.0 - Cache-first wizard migration
@see .claude/plans/CACHE_FIRST_WIZARD_MIGRATION_PLAN.md
"""

import base64
import hashlib
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from uuid import UUID, uuid4

from loguru import logger
import asyncpg

from app.core.events import EventBus, EventType
from .preview_cache import preview_cache
from .gemini_document_processor import gemini_document_processor
from .tariff_calculator import tariff_calculator
from .workflow_engine import workflow_engine
from ..repositories.service_request_repository import service_request_repository
from ..repositories.document_repository import document_repository
from ..models.wizard_session import (
    WizardSessionData,
    WizardSessionStatus,
    SessionDocumentData,
    WizardSessionResponse,
    WizardDocumentPreviewResponse,
    WizardPreparePaymentResponse,
    WizardPersistResult,
)
from ..models.enums import ServiceRequestStatus, SolicitudType, WorkflowCode


# =============================================================================
# CONSTANTS
# =============================================================================

WIZARD_SESSION_TTL_SECONDS = 1800  # 30 minutes
WIZARD_SESSION_PREFIX = "wizard_session_"
MAX_DOCUMENT_SIZE_MB = 10
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
}


# =============================================================================
# CUSTOM EXCEPTIONS
# =============================================================================

class WizardSessionError(Exception):
    """Base exception for wizard session errors."""
    def __init__(self, message: str, code: str = "WIZARD_SESSION_ERROR"):
        self.message = message
        self.code = code
        super().__init__(message)


class WizardSessionExpiredError(WizardSessionError):
    """Session has expired."""
    def __init__(self, message: str = "La sesión ha expirado. Por favor, inicie de nuevo."):
        super().__init__(message, "WIZARD_SESSION_EXPIRED")


class WizardSessionNotFoundError(WizardSessionError):
    """Session not found in cache."""
    def __init__(self, message: str = "Sesión no encontrada. Por favor, inicie de nuevo."):
        super().__init__(message, "WIZARD_SESSION_NOT_FOUND")


class WizardDocumentValidationError(WizardSessionError):
    """Document validation failed."""
    def __init__(self, message: str, code: str = "DOCUMENT_VALIDATION_ERROR"):
        super().__init__(message, code)


class WizardPersistError(WizardSessionError):
    """Persist to DB failed."""
    def __init__(self, message: str, code: str = "PERSIST_ERROR", details: Dict[str, Any] = None):
        super().__init__(message, code)
        self.details = details or {}


# =============================================================================
# WIZARD SESSION SERVICE
# =============================================================================

class WizardSessionService:
    """
    Manages wizard sessions in cache with 30-minute TTL.

    Key features:
    - No DB writes until payment is initiated
    - All documents stored in cache (base64)
    - Atomic persist: Firebase upload + DB insert
    - Natural cleanup via TTL (no orphan records)
    """

    def __init__(self):
        self.session_ttl = WIZARD_SESSION_TTL_SECONDS
        self.cache = preview_cache
        # Warn if cache backend is in-memory (sessions won't survive across instances)
        backend = self.cache._get_backend()
        from .preview_cache import InMemoryCache
        if isinstance(backend, InMemoryCache):
            logger.critical(
                "[WizardSession] ⚠️ CRITICAL: Using InMemoryCache! "
                "Wizard sessions will NOT work on multi-instance deployments (Cloud Run). "
                "Set REDIS_URL environment variable to fix this."
            )

    # =========================================================================
    # SESSION MANAGEMENT (Private)
    # =========================================================================

    def _generate_session_id(self, user_id: UUID, workflow_code: str) -> str:
        """Generate unique session ID."""
        unique = f"{user_id}_{workflow_code}_{uuid4().hex[:8]}_{datetime.utcnow().timestamp()}"
        return f"{WIZARD_SESSION_PREFIX}{hashlib.sha256(unique.encode()).hexdigest()[:16]}"

    def _get_cache_key(self, session_id: str) -> str:
        """Get cache key for session."""
        if session_id.startswith(WIZARD_SESSION_PREFIX):
            return session_id
        return f"{WIZARD_SESSION_PREFIX}{session_id}"

    async def _get_session(self, session_id: str, user_id: UUID) -> Dict[str, Any]:
        """
        Get session from cache with validation.

        Raises:
            WizardSessionNotFoundError: Session not in cache
            WizardSessionExpiredError: Session expired
            WizardSessionError: User mismatch
        """
        cache_key = self._get_cache_key(session_id)

        try:
            data = await self.cache.get(cache_key)
        except Exception as e:
            logger.error(f"[WizardSession] Cache error getting session {session_id}: {e}")
            raise WizardSessionError("Error al acceder a la sesión. Por favor, intente de nuevo.")

        if not data:
            logger.warning(f"[WizardSession] Session not found: {session_id}")
            raise WizardSessionNotFoundError()

        # Validate user ownership
        if data.get("user_id") != str(user_id):
            logger.warning(f"[WizardSession] User mismatch for session {session_id}")
            raise WizardSessionError("No autorizado para esta sesión.", "UNAUTHORIZED")

        # Check expiration (belt and suspenders - cache TTL should handle this)
        expires_at = data.get("expires_at")
        if expires_at:
            try:
                exp_dt = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
                if datetime.utcnow() > exp_dt.replace(tzinfo=None):
                    logger.info(f"[WizardSession] Session expired: {session_id}")
                    await self.cache.delete(cache_key)
                    raise WizardSessionExpiredError()
            except (ValueError, TypeError):
                pass  # If can't parse, let cache TTL handle it

        return data

    async def _save_session(self, session_id: str, data: Dict[str, Any], renew_ttl: bool = True) -> bool:
        """
        Save session to cache with TTL.

        Args:
            session_id: Session ID
            data: Session data
            renew_ttl: If True, reset TTL to full duration
        """
        cache_key = self._get_cache_key(session_id)

        # Update timestamps (Z suffix = UTC, required for correct JS Date parsing)
        now = datetime.utcnow()
        data["updated_at"] = now.isoformat() + "Z"
        if renew_ttl:
            data["expires_at"] = (now + timedelta(seconds=self.session_ttl)).isoformat() + "Z"

        try:
            success = await self.cache.set(cache_key, data, self.session_ttl)
            if not success:
                logger.error(f"[WizardSession] Failed to save session {session_id}")
                return False
            return True
        except Exception as e:
            logger.error(f"[WizardSession] Cache error saving session {session_id}: {e}")
            return False

    def _get_doc_requirements(
        self,
        workflow,
        session: Dict[str, Any],
        context=None,
    ) -> List:
        """
        Get document requirements from workflow, handling V1/V2 signature differences.

        V2 (PredefinedWorkflow): get_document_requirements(solicitud_type, motivo, context)
        V1 (BaseWorkflow):       get_document_requirements(sub_type)

        Uses get_document_requirements_legacy() when available (Pasaporte, Conducir, Contrato)
        to convert sub_type → (solicitud_type, motivo).
        """
        if not hasattr(workflow, "get_document_requirements"):
            return []

        # V2 workflows with legacy adapter (handles sub_type → solicitud_type+motivo)
        if hasattr(workflow, "get_document_requirements_legacy"):
            return workflow.get_document_requirements_legacy(
                session.get("sub_type"), context
            )

        # V2 workflows (PredefinedWorkflow) without legacy adapter
        from ..workflows.workflow_interface import PredefinedWorkflow, RenovacionMotivo
        if isinstance(workflow, PredefinedWorkflow):
            motivo = None
            if session.get("motivo"):
                try:
                    motivo = RenovacionMotivo(session["motivo"])
                except ValueError:
                    pass
            solicitud_type = SolicitudType(session.get("solicitud_type", "expedicion"))
            return workflow.get_document_requirements(solicitud_type, motivo, context)

        # V1 workflows (BaseWorkflow) — takes sub_type string
        return workflow.get_document_requirements(session.get("sub_type"))

    def _session_to_response(self, session: Dict[str, Any], workflow=None) -> WizardSessionResponse:
        """Convert session dict to response model."""
        documents = session.get("documents", {})

        # Get required documents from workflow if available
        required_documents = []
        if workflow:
            try:
                # Build a minimal context for document requirements
                from ..workflows.workflow_interface import WorkflowContext
                ctx_form_data = dict(session.get("form_data", {}))
                if session.get("is_minor") is not None and "is_minor" not in ctx_form_data:
                    ctx_form_data["is_minor"] = session["is_minor"]
                context = WorkflowContext(
                    service_request_id=uuid4(),  # Placeholder
                    user_id=UUID(session["user_id"]),
                    workflow_code=WorkflowCode(session["workflow_code"]),
                    solicitud_type=SolicitudType(session.get("solicitud_type", "expedicion")),
                    sub_type=session.get("sub_type"),
                    form_data=ctx_form_data,
                )
                doc_reqs = self._get_doc_requirements(workflow, session, context)
                if doc_reqs:
                    for doc in doc_reqs:
                        if doc.should_show(context):
                            required_documents.append({
                                "code": doc.document_code,
                                "name_es": doc.document_name_es,
                                "is_required": doc.is_required,
                                "uploaded": doc.document_code in documents,
                            })
            except Exception as e:
                logger.warning(f"[WizardSession] Error getting required documents: {e}")

        # Calculate remaining TTL
        ttl_seconds = self.session_ttl
        expires_at_str = session.get("expires_at")
        if expires_at_str:
            try:
                expires_at = datetime.fromisoformat(expires_at_str.replace("Z", "+00:00"))
                remaining = (expires_at.replace(tzinfo=None) - datetime.utcnow()).total_seconds()
                ttl_seconds = max(0, int(remaining))
            except (ValueError, TypeError):
                pass

        # Determine workflow capabilities
        requires_appointment = False
        entity_code = session.get("entity_code")
        if workflow:
            try:
                requires_appointment = getattr(workflow, "requires_appointment", False)
            except Exception:
                pass

        return WizardSessionResponse(
            session_id=session["session_id"],
            workflow_code=session["workflow_code"],
            solicitud_type=session.get("solicitud_type", "expedicion"),
            sub_type=session.get("sub_type"),
            motivo=session.get("motivo"),
            is_minor=session.get("is_minor", False),
            status=WizardSessionStatus(session.get("status", "active")),
            current_step=session.get("current_step", 1),
            current_step_id=session.get("current_step_id"),
            documents_count=len(documents),
            documents_uploaded=list(documents.keys()),
            form_data=session.get("form_data", {}),
            extracted_data=session.get("extracted_data", {}),
            tariff=session.get("tariff"),
            created_at=datetime.fromisoformat(session["created_at"].replace("Z", "+00:00")),
            updated_at=datetime.fromisoformat(session["updated_at"].replace("Z", "+00:00")),
            expires_at=datetime.fromisoformat(session["expires_at"].replace("Z", "+00:00")),
            ttl_seconds=ttl_seconds,
            required_documents=required_documents,
            requires_appointment=requires_appointment,
            entity_code=entity_code,
        )

    # =========================================================================
    # PUBLIC API
    # =========================================================================

    async def start_session(
        self,
        user_id: UUID,
        workflow_code: str,
        solicitud_type: str = "expedicion",
        sub_type: Optional[str] = None,
        motivo: Optional[str] = None,
        is_minor: bool = False,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> WizardSessionResponse:
        """
        Start a new wizard session in cache.

        No database entry is created - all data stays in Redis until payment.

        Args:
            user_id: User ID
            workflow_code: Workflow code (e.g., "PASAPORTE")
            solicitud_type: expedicion, renovacion, or duplicado
            sub_type: Workflow-specific sub-type
            motivo: Reason for renovacion (if applicable)
            is_minor: Is the applicant a minor
            ip_address: Client IP for audit
            user_agent: Browser user agent

        Returns:
            WizardSessionResponse with session_id and details

        Raises:
            WizardSessionError: If workflow is invalid or user has existing session
        """
        logger.info(
            f"[WizardSession] Starting session: user={user_id}, "
            f"workflow={workflow_code}, type={solicitud_type}"
        )

        # Validate workflow
        workflow = workflow_engine.get_workflow_by_string(workflow_code.upper())
        if not workflow:
            raise WizardSessionError(
                f"Flujo de trabajo no encontrado: {workflow_code}",
                "INVALID_WORKFLOW"
            )

        # Get entity code from workflow
        entity_code = workflow.entity_code.value if hasattr(workflow.entity_code, 'value') else str(workflow.entity_code)

        # Create session
        session_id = self._generate_session_id(user_id, workflow_code)
        now = datetime.utcnow()
        expires_at = now + timedelta(seconds=self.session_ttl)

        session_data = {
            "session_id": session_id,
            "user_id": str(user_id),
            "workflow_code": workflow_code.upper(),
            "solicitud_type": solicitud_type,
            "sub_type": sub_type,
            "motivo": motivo,
            "entity_code": entity_code,
            "status": WizardSessionStatus.ACTIVE.value,
            "is_minor": is_minor,
            "documents": {},
            "extracted_data": {},
            "form_data": {},
            "current_step": 1,
            "current_step_id": None,
            "tariff": None,
            "validation_results": None,
            "has_errors": False,
            "created_at": now.isoformat() + "Z",
            "updated_at": now.isoformat() + "Z",
            "expires_at": expires_at.isoformat() + "Z",
            "ip_address": ip_address,
            "user_agent": user_agent,
        }

        # Save to cache
        success = await self._save_session(session_id, session_data)
        if not success:
            raise WizardSessionError("Error al crear la sesión. Por favor, intente de nuevo.")

        logger.info(f"[WizardSession] Session created: {session_id}, expires_at={expires_at}")

        return self._session_to_response(session_data, workflow)

    async def get_session(
        self,
        session_id: str,
        user_id: UUID,
    ) -> WizardSessionResponse:
        """
        Get existing wizard session.

        Args:
            session_id: Session ID
            user_id: User ID for authorization

        Returns:
            WizardSessionResponse with current session state
        """
        session = await self._get_session(session_id, user_id)
        workflow = workflow_engine.get_workflow_by_string(session["workflow_code"])
        return self._session_to_response(session, workflow)

    async def preview_document(
        self,
        session_id: str,
        user_id: UUID,
        document_code: str,
        file_content: bytes,
        file_name: str,
        mime_type: str,
    ) -> WizardDocumentPreviewResponse:
        """
        Preview document extraction and store in session.

        Extracts data using Gemini OCR and stores both content and extraction
        in the session cache. Renews session TTL.

        Args:
            session_id: Session ID
            user_id: User ID for authorization
            document_code: Document code (e.g., 'dip', 'pasaporte_antiguo')
            file_content: File binary content
            file_name: Original file name
            mime_type: MIME type

        Returns:
            WizardDocumentPreviewResponse with extraction results

        Raises:
            WizardSessionNotFoundError: Session not found
            WizardSessionExpiredError: Session expired
            WizardDocumentValidationError: Invalid document
        """
        logger.info(f"[WizardSession] Preview document: session={session_id}, doc={document_code}")

        # Validate file size
        file_size = len(file_content)
        max_size = MAX_DOCUMENT_SIZE_MB * 1024 * 1024
        if file_size > max_size:
            raise WizardDocumentValidationError(
                f"El archivo excede el tamaño máximo de {MAX_DOCUMENT_SIZE_MB}MB.",
                "FILE_TOO_LARGE"
            )

        # Validate MIME type
        if mime_type not in ALLOWED_MIME_TYPES:
            raise WizardDocumentValidationError(
                f"Formato de archivo no soportado. Use PDF, JPG o PNG.",
                "INVALID_MIME_TYPE"
            )

        # Get session
        session = await self._get_session(session_id, user_id)

        # Get workflow for document validation and schema
        workflow = workflow_engine.get_workflow_by_string(session["workflow_code"])
        if not workflow:
            raise WizardSessionError(f"Workflow not found: {session['workflow_code']}")

        # Get extraction schema key for this document
        extraction_schema_key = None
        doc_reqs = self._get_doc_requirements(workflow, session)
        for doc_req in doc_reqs:
            if doc_req.document_code == document_code:
                extraction_schema_key = doc_req.schema_key
                break

        # Get existing extractions for cross-validation
        existing_documents = session.get("extracted_data", {})

        # Extract document data using Gemini
        try:
            extraction_result = await gemini_document_processor.process(
                content=file_content,
                mime_type=mime_type,
                document_code=document_code,
                user_id=str(user_id),
                existing_documents=existing_documents,
                extraction_schema_key=extraction_schema_key,
                workflow_code=session["workflow_code"],
            )
        except Exception as e:
            logger.error(f"[WizardSession] Extraction failed: {e}", exc_info=True)
            raise WizardDocumentValidationError(
                "Error al procesar el documento. Verifique que sea legible.",
                "EXTRACTION_FAILED"
            )

        # Store document in session (including base64 content)
        now = datetime.utcnow()
        document_data = {
            "document_code": document_code,
            "file_name": file_name,
            "file_size": file_size,
            "mime_type": mime_type,
            "content_b64": base64.b64encode(file_content).decode("utf-8"),
            "extraction": extraction_result.get("extraction", {}),
            "confidence": extraction_result.get("confidence", 0),
            "processor": extraction_result.get("processor", "unknown"),
            "extraction_status": extraction_result.get("status", "pending"),
            "risk_analysis": extraction_result.get("risk_analysis"),
            "doc_hash": extraction_result.get("doc_hash"),
            "previewed_at": now.isoformat() + "Z",
            "confirmed_at": None,
            "user_corrections": None,
        }

        # Update session documents
        if "documents" not in session:
            session["documents"] = {}
        session["documents"][document_code] = document_data

        # Merge extraction into extracted_data
        if "extracted_data" not in session:
            session["extracted_data"] = {}
        session["extracted_data"][document_code] = extraction_result.get("extraction", {})

        # Save session (renews TTL)
        success = await self._save_session(session_id, session, renew_ttl=True)
        if not success:
            raise WizardSessionError("Error al guardar la vista previa.")

        logger.info(
            f"[WizardSession] Document preview saved: session={session_id}, "
            f"doc={document_code}, confidence={document_data['confidence']}"
        )

        # Calculate remaining TTL
        ttl_seconds = self.session_ttl
        expires_at_str = session.get("expires_at")
        expires_at = datetime.utcnow() + timedelta(seconds=self.session_ttl)
        if expires_at_str:
            try:
                expires_at = datetime.fromisoformat(expires_at_str.replace("Z", "+00:00"))
                remaining = (expires_at.replace(tzinfo=None) - datetime.utcnow()).total_seconds()
                ttl_seconds = max(0, int(remaining))
            except (ValueError, TypeError):
                pass

        return WizardDocumentPreviewResponse(
            session_id=session_id,
            document_code=document_code,
            file_name=file_name,
            file_size=file_size,
            extraction=extraction_result.get("extraction", {}),
            confidence=extraction_result.get("confidence", 0),
            processor=extraction_result.get("processor", "unknown"),
            extraction_status=extraction_result.get("status", "pending"),
            needs_correction=extraction_result.get("confidence", 0) < 0.7,
            risk_analysis=extraction_result.get("risk_analysis"),
            cross_validation=extraction_result.get("cross_validation"),
            expires_at=expires_at,
            ttl_seconds=ttl_seconds,
        )

    async def confirm_document(
        self,
        session_id: str,
        user_id: UUID,
        document_code: str,
        confirmed_data: Dict[str, Any],
        user_notes: Optional[str] = None,
    ) -> WizardSessionResponse:
        """
        Confirm document extraction with optional corrections.

        Args:
            session_id: Session ID
            user_id: User ID for authorization
            document_code: Document code to confirm
            confirmed_data: User-confirmed (or corrected) extraction data
            user_notes: Optional user notes

        Returns:
            Updated WizardSessionResponse
        """
        logger.info(f"[WizardSession] Confirm document: session={session_id}, doc={document_code}")

        session = await self._get_session(session_id, user_id)

        # Verify document exists in session
        if document_code not in session.get("documents", {}):
            raise WizardSessionError(
                f"Documento no encontrado en sesión: {document_code}",
                "DOCUMENT_NOT_FOUND"
            )

        now = datetime.utcnow()

        # Update document with confirmed data
        session["documents"][document_code]["confirmed_at"] = now.isoformat() + "Z"
        session["documents"][document_code]["user_corrections"] = confirmed_data
        if user_notes:
            session["documents"][document_code]["user_notes"] = user_notes

        # Update extracted_data with confirmed values
        session["extracted_data"][document_code] = confirmed_data

        # Save session
        success = await self._save_session(session_id, session, renew_ttl=True)
        if not success:
            raise WizardSessionError("Error al confirmar el documento.")

        logger.info(f"[WizardSession] Document confirmed: session={session_id}, doc={document_code}")

        workflow = workflow_engine.get_workflow_by_string(session["workflow_code"])
        return self._session_to_response(session, workflow)

    async def save_form_data(
        self,
        session_id: str,
        user_id: UUID,
        form_data: Dict[str, Any],
        step_id: Optional[str] = None,
        step_number: Optional[int] = None,
    ) -> WizardSessionResponse:
        """
        Save form data to session.

        Args:
            session_id: Session ID
            user_id: User ID for authorization
            form_data: Form data to save (merged with existing)
            step_id: Current step ID
            step_number: Current step number

        Returns:
            Updated WizardSessionResponse
        """
        logger.info(f"[WizardSession] Save form data: session={session_id}, step={step_id}")

        session = await self._get_session(session_id, user_id)

        # Merge form data (user edits take precedence)
        existing_form_data = session.get("form_data", {})
        session["form_data"] = {**existing_form_data, **form_data}

        # Update step tracking
        if step_id:
            session["current_step_id"] = step_id
        if step_number:
            session["current_step"] = step_number

        # Save session
        success = await self._save_session(session_id, session, renew_ttl=True)
        if not success:
            raise WizardSessionError("Error al guardar los datos del formulario.")

        logger.info(f"[WizardSession] Form data saved: session={session_id}")

        workflow = workflow_engine.get_workflow_by_string(session["workflow_code"])
        return self._session_to_response(session, workflow)

    async def get_form_config(
        self,
        session_id: str,
        user_id: UUID,
        step_id: str,
    ):
        """
        Get dynamic form configuration for a session step.

        Builds a WorkflowContext from the session cache and calls
        workflow.get_form_config() to get sections filtered by conditions.
        Values are pre-filled from extracted_data + form_data.

        Args:
            session_id: Session ID
            user_id: User ID for authorization
            step_id: The form_review step ID (e.g., 'form_review_1')

        Returns:
            FormConfigResponse with sections, fields, and pre-filled values
        """
        from ..models.form_config import FormConfigResponse, FormFieldResponse, FormSectionResponse
        from ..workflows.workflow_interface import WorkflowContext, RenovacionMotivo

        logger.info(f"[WizardSession] Get form config: session={session_id}, step={step_id}")

        session = await self._get_session(session_id, user_id)

        workflow = workflow_engine.get_workflow_by_string(session["workflow_code"])
        if not workflow:
            raise WizardSessionError(f"Workflow not found: {session['workflow_code']}")

        # Build context from session cache
        # Inject top-level session keys into form_data for condition evaluation
        # (is_minor is stored at session level, _build_eval_context reads from form_data)
        form_data = dict(session.get("form_data", {}))
        if session.get("is_minor") is not None and "is_minor" not in form_data:
            form_data["is_minor"] = session["is_minor"]

        context = WorkflowContext(
            service_request_id=uuid4(),  # Placeholder
            user_id=UUID(session["user_id"]),
            workflow_code=WorkflowCode(session["workflow_code"]),
            solicitud_type=SolicitudType(session.get("solicitud_type", "expedicion")),
            sub_type=session.get("sub_type"),
            form_data=form_data,
            extracted_data=session.get("extracted_data", {}),
        )

        # Set motivo if present
        if session.get("motivo"):
            try:
                context.motivo = RenovacionMotivo(session["motivo"])
            except ValueError:
                pass

        # Get form configuration (sections filtered by conditions)
        try:
            form_config = workflow.get_form_config(step_id, context)
        except ValueError as e:
            raise WizardSessionError(str(e))

        # Get form mapping to resolve values
        form_mapping = workflow.get_form_mapping(context)

        form_data = session.get("form_data", {})
        extracted_data = session.get("extracted_data", {})

        # Build response with pre-filled values
        sections_response = []
        for section in form_config.sections:
            fields_response = []
            for field in section.fields:
                # Resolve current value from form_data or extracted_data
                current_value = self._resolve_field_value(
                    field.key, form_mapping, form_data, extracted_data
                )
                fields_response.append(FormFieldResponse(
                    key=field.key,
                    label_es=field.label_es,
                    type=field.type,
                    required=field.required,
                    options=field.options,
                    readonly=field.readonly,
                    placeholder_es=field.placeholder_es,
                    validation=field.validation,
                    current_value=current_value,
                ))
            sections_response.append(FormSectionResponse(
                id=section.id,
                title_es=section.title_es,
                fields=fields_response,
                source_document=section.source_document,
                description_es=section.description_es,
            ))

        return FormConfigResponse(
            step_id=form_config.step_id,
            title_es=form_config.title_es,
            description_es=form_config.description_es,
            sections=sections_response,
        )

    @staticmethod
    def _resolve_field_value(
        field_key: str,
        form_mapping: dict,
        form_data: dict,
        extracted_data: dict,
    ):
        """Resolve a field value from form_data or extracted_data."""
        # Priority 1: Check form_data for user edits
        if field_key in form_data:
            return form_data[field_key]

        # Priority 2: Resolve from extracted_data using mapping
        extraction_path = form_mapping.get(field_key)
        if not extraction_path:
            return None

        # Parse path like "dip.titular.apellidos"
        parts = extraction_path.split(".")
        if len(parts) < 2:
            return None

        # First part is document code
        doc_code = parts[0]
        if doc_code not in extracted_data:
            return None

        # Navigate the rest of the path
        value = extracted_data[doc_code]
        for part in parts[1:]:
            if isinstance(value, dict) and part in value:
                value = value[part]
            else:
                return None

        return value

    async def prepare_for_payment(
        self,
        session_id: str,
        user_id: UUID,
        db: asyncpg.Connection,
    ) -> WizardPreparePaymentResponse:
        """
        Prepare session for payment.

        Validates all documents are uploaded, runs cross-validation,
        and calculates tariff. Does NOT persist to DB yet.

        Args:
            session_id: Session ID
            user_id: User ID for authorization
            db: Database connection (for tariff lookup)

        Returns:
            WizardPreparePaymentResponse with tariff and validation status
        """
        logger.info(f"[WizardSession] Prepare for payment: session={session_id}")

        session = await self._get_session(session_id, user_id)

        workflow = workflow_engine.get_workflow_by_string(session["workflow_code"])
        if not workflow:
            raise WizardSessionError(f"Workflow not found: {session['workflow_code']}")

        # Build context for validation and tariff
        from ..workflows.workflow_interface import WorkflowContext, RenovacionMotivo
        form_data = dict(session.get("form_data", {}))
        if session.get("is_minor") is not None and "is_minor" not in form_data:
            form_data["is_minor"] = session["is_minor"]
        context = WorkflowContext(
            service_request_id=uuid4(),  # Placeholder
            user_id=UUID(session["user_id"]),
            workflow_code=WorkflowCode(session["workflow_code"]),
            solicitud_type=SolicitudType(session.get("solicitud_type", "expedicion")),
            sub_type=session.get("sub_type"),
            form_data=form_data,
            extracted_data=session.get("extracted_data", {}),
        )

        # Set motivo if present
        if session.get("motivo"):
            try:
                context.motivo = RenovacionMotivo(session["motivo"])
            except ValueError:
                pass

        # Check required documents
        missing_documents = []
        doc_reqs = self._get_doc_requirements(workflow, session, context)
        for doc_req in doc_reqs:
            if doc_req.should_show(context) and doc_req.is_required:
                if doc_req.document_code not in session.get("documents", {}):
                    missing_documents.append(doc_req.document_code)

        # Run validation
        errors = []
        warnings = []
        if hasattr(workflow, 'validate_documents'):
            validation_results = workflow.validate_documents(context)
            for result in validation_results:
                if hasattr(result, 'is_error') and result.is_error:
                    errors.append({
                        "rule_id": result.rule_id,
                        "message_es": result.message_es,
                        "field": getattr(result, 'field', None),
                    })
                elif hasattr(result, 'is_warning') and result.is_warning:
                    warnings.append({
                        "rule_id": result.rule_id,
                        "message_es": result.message_es,
                        "field": getattr(result, 'field', None),
                    })

        # Validate required form fields across all form_review steps
        form_data = session.get("form_data", {})
        if hasattr(workflow, 'get_form_config'):
            # Check each form_review step
            step_num = 1
            while True:
                step_id = f"form_review_{step_num}"
                try:
                    form_config = workflow.get_form_config(step_id, context)
                    for section in form_config.sections:
                        for field in section.fields:
                            if field.required:
                                value = form_data.get(field.key)
                                if value is None or value == "" or value == []:
                                    errors.append({
                                        "rule_id": f"required_field_{field.key}",
                                        "message_es": f"Campo obligatorio: {field.label_es}",
                                        "field": field.key,
                                    })
                    step_num += 1
                except (ValueError, AttributeError):
                    break  # No more form_review steps

        # Calculate tariff
        tariff = await tariff_calculator.calculate(db, workflow, context)

        # Update session
        session["tariff"] = tariff
        session["validation_results"] = errors + warnings
        session["has_errors"] = len(errors) > 0 or len(missing_documents) > 0

        if not session["has_errors"] and not missing_documents:
            session["status"] = WizardSessionStatus.READY_FOR_PAYMENT.value

        # Save session
        success = await self._save_session(session_id, session, renew_ttl=True)
        if not success:
            raise WizardSessionError("Error al preparar el pago.")

        ready_for_payment = not session["has_errors"] and not missing_documents

        logger.info(
            f"[WizardSession] Prepare payment complete: session={session_id}, "
            f"ready={ready_for_payment}, errors={len(errors)}, missing_docs={len(missing_documents)}"
        )

        return WizardPreparePaymentResponse(
            session_id=session_id,
            ready_for_payment=ready_for_payment,
            tariff=tariff,
            total_amount=tariff.get("total_amount", 0),
            currency=tariff.get("currency", "XAF"),
            validation_passed=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            all_documents_uploaded=len(missing_documents) == 0,
            missing_documents=missing_documents,
        )

    async def persist_to_db(
        self,
        session_id: str,
        user_id: UUID,
        db: asyncpg.Connection,
        payment_id: Optional[str] = None,
    ) -> WizardPersistResult:
        """
        Persist session data to database (atomic transaction).

        This is called when payment is initiated. Performs:
        1. Upload documents to Firebase Storage
        2. Create service_request record
        3. Create service_request_documents records
        4. Delete session from cache

        Args:
            session_id: Session ID
            user_id: User ID for authorization
            db: Database connection
            payment_id: Payment ID if payment was created

        Returns:
            WizardPersistResult with service_request_id and reference

        Raises:
            WizardPersistError: If any step fails (rollback performed)
        """
        logger.info(f"[WizardSession] Persist to DB: session={session_id}")

        session = await self._get_session(session_id, user_id)

        # Verify session is ready
        if session.get("status") != WizardSessionStatus.READY_FOR_PAYMENT.value:
            if session.get("has_errors"):
                raise WizardPersistError(
                    "No se puede procesar: hay errores de validación pendientes.",
                    "VALIDATION_ERRORS"
                )
            # Allow even if not explicitly ready (tariff calculated)

        # Mark session as persisting
        session["status"] = WizardSessionStatus.PAYMENT_INITIATED.value
        await self._save_session(session_id, session, renew_ttl=False)

        uploaded_files = []  # Track for Firebase rollback

        try:
            # Import Firebase storage service
            from app.modules.documents.services.storage_service import firebase_storage_service

            workflow_code = session["workflow_code"]
            user_id_uuid = UUID(session["user_id"])

            # Use a DB transaction for atomicity of all DB operations
            async with db.transaction():
                # 1. Create service_request record (reference is auto-generated by DB trigger)
                request_data = await service_request_repository.create(
                    db=db,
                    user_id=user_id_uuid,
                    workflow_code=workflow_code,
                    solicitud_type=session.get("solicitud_type", "expedicion"),
                    form_data=session.get("form_data", {}),
                )
                service_request_id = request_data["id"]
                reference = request_data["reference"]

                # Update status to PAYMENT_PENDING (create() defaults to DRAFT)
                await service_request_repository.update_status(
                    db=db,
                    request_id=service_request_id,
                    new_status=ServiceRequestStatus.PAYMENT_PENDING.value,
                    performed_by=user_id_uuid,
                    comment="Cache-first wizard: payment initiated"
                )

                # 2. Upload documents to Firebase and create document records
                for doc_code, doc_data in session.get("documents", {}).items():
                    # Decode base64 content
                    file_content = base64.b64decode(doc_data["content_b64"])

                    # Upload to Firebase using upload_user_document (matches storage.rules)
                    upload_result = await firebase_storage_service.upload_user_document(
                        user_id=str(user_id_uuid),
                        application_id=str(service_request_id),
                        file=file_content,
                        metadata={
                            "filename": doc_data["file_name"],
                            "mime_type": doc_data["mime_type"],
                            "document_code": doc_code,
                            "document_name": doc_data.get("document_name") or doc_code,
                        }
                    )
                    file_path = upload_result.file_path
                    uploaded_files.append(file_path)

                    # Create document record using add_document (UPSERT)
                    doc_record = await document_repository.add_document(
                        db=db,
                        service_request_id=service_request_id,
                        document_code=doc_code,
                        document_name=doc_data.get("document_name") or doc_code,
                        file_path=file_path,
                        file_name=doc_data["file_name"],
                        file_size=doc_data["file_size"],
                        mime_type=doc_data["mime_type"],
                        uploaded_by=user_id_uuid,
                        source="cache_first_wizard",
                        file_hash=doc_data.get("doc_hash")
                    )

                    # Update extraction data (include risk_analysis for agent review)
                    extraction_data = doc_data.get("user_corrections") or doc_data.get("extraction", {})
                    risk_analysis = doc_data.get("risk_analysis")
                    if risk_analysis:
                        extraction_data["_risk_analysis"] = risk_analysis
                    await document_repository.update_extraction(
                        db=db,
                        document_id=doc_record["id"],
                        extraction_data=extraction_data,
                        extraction_confidence=doc_data.get("confidence", 0),
                        extraction_status="success" if doc_data.get("confirmed_at") else "pending"
                    )

                    # Validate if confirmed
                    if doc_data.get("confirmed_at"):
                        await document_repository.validate_document(
                            db=db,
                            document_id=doc_record["id"],
                            is_valid=True,
                            validation_errors=[],
                            validated_by=user_id_uuid
                        )

            # 3. Update session status and delete from cache (outside transaction)
            session["status"] = WizardSessionStatus.PERSISTED.value
            cache_key = self._get_cache_key(session_id)
            await self.cache.delete(cache_key)

            logger.info(
                f"[WizardSession] Persist complete: session={session_id}, "
                f"request_id={service_request_id}, reference={reference}"
            )

            # Publish event
            try:
                EventBus.publish_nowait(EventType.REQUEST_SUBMITTED, {
                    "request_id": str(service_request_id),
                    "user_id": str(user_id),
                    "workflow_code": workflow_code,
                    "reference": reference,
                })
            except Exception:
                pass  # Non-blocking

            return WizardPersistResult(
                success=True,
                service_request_id=service_request_id,
                reference=reference,
                payment_id=payment_id,
            )

        except Exception as e:
            logger.error(f"[WizardSession] Persist failed: {e}", exc_info=True)

            # Rollback: delete uploaded files from Firebase
            # (DB rollback is handled automatically by the transaction)
            for file_path in uploaded_files:
                try:
                    await firebase_storage_service.delete_file(file_path)
                    logger.info(f"[WizardSession] Rollback: deleted {file_path}")
                except Exception as del_err:
                    logger.warning(f"[WizardSession] Rollback failed for {file_path}: {del_err}")

            # Restore session status
            session["status"] = WizardSessionStatus.READY_FOR_PAYMENT.value
            await self._save_session(session_id, session, renew_ttl=True)

            raise WizardPersistError(
                f"Error al guardar la solicitud: {str(e)}",
                "PERSIST_FAILED",
                {"original_error": str(e)}
            )

    async def cancel_session(
        self,
        session_id: str,
        user_id: UUID,
        reason: Optional[str] = None,
    ) -> bool:
        """
        Cancel and delete a wizard session.

        Args:
            session_id: Session ID
            user_id: User ID for authorization
            reason: Optional cancellation reason (for logging)

        Returns:
            True if cancelled successfully
        """
        logger.info(f"[WizardSession] Cancel session: {session_id}, reason={reason}")

        # Verify ownership before deleting
        session = await self._get_session(session_id, user_id)

        # Delete from cache
        cache_key = self._get_cache_key(session_id)
        success = await self.cache.delete(cache_key)

        if success:
            logger.info(f"[WizardSession] Session cancelled: {session_id}")
        else:
            logger.warning(f"[WizardSession] Failed to delete session: {session_id}")

        return success


# =============================================================================
# SINGLETON
# =============================================================================

wizard_session_service = WizardSessionService()
