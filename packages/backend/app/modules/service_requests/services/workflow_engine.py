"""
WorkflowEngine - Orchestrates workflow execution for service requests.

Responsibilities:
- Register and manage available workflows
- Execute workflow steps
- Handle state transitions
- Coordinate with document processor, tariff service, and validators
"""
import asyncio
from typing import Dict, List, Optional, Type, Any
from uuid import UUID
from datetime import datetime
import logging

import asyncpg

from ..models.enums import (
    WorkflowCode,
    WorkflowCategory,
    ServiceRequestStatus,
    SolicitudType
)
from ..workflows.base_workflow import (
    BaseWorkflow,
    WorkflowStep,
    WorkflowContext,
    ValidationResult,
    DocumentRequirement,
    StepType
)
from .schema_loader import schema_loader
from .gemini_document_processor import gemini_document_processor

logger = logging.getLogger(__name__)


class WorkflowEngine:
    """
    Central engine for managing and executing service request workflows.

    Usage:
        # Register workflows at startup
        workflow_engine.register(PasaporteWorkflow)
        workflow_engine.register(ResidenciaWorkflow)

        # Get workflow for a code
        workflow = workflow_engine.get_workflow(WorkflowCode.PASAPORTE_NUEVO)

        # Execute a step
        result = await workflow_engine.execute_step(context, step_number)
    """

    def __init__(self):
        self._workflows: Dict[WorkflowCode, BaseWorkflow] = {}
        self._workflow_classes: Dict[WorkflowCode, Type[BaseWorkflow]] = {}

    def register(self, workflow_class: Type[BaseWorkflow]) -> None:
        """
        Register a workflow class.

        Args:
            workflow_class: The workflow class to register
        """
        workflow = workflow_class()
        code = workflow.workflow_code

        if code in self._workflows:
            logger.warning(f"Workflow {code.value} already registered, replacing")

        self._workflows[code] = workflow
        self._workflow_classes[code] = workflow_class
        logger.info(f"Registered workflow: {code.value}")

    def register_many(self, workflow_classes: List[Type[BaseWorkflow]]) -> None:
        """Register multiple workflow classes."""
        for cls in workflow_classes:
            self.register(cls)

    def get_workflow(self, code: WorkflowCode) -> Optional[BaseWorkflow]:
        """Get a registered workflow by code."""
        return self._workflows.get(code)

    def get_workflow_by_string(self, code_str: str) -> Optional[BaseWorkflow]:
        """Get workflow by string code (for API usage)."""
        try:
            code = WorkflowCode(code_str)
            return self.get_workflow(code)
        except ValueError:
            logger.warning(f"Unknown workflow code: {code_str}")
            return None

    def get_all_workflows(self) -> Dict[WorkflowCode, BaseWorkflow]:
        """Get all registered workflows."""
        return self._workflows.copy()

    def get_workflows_by_category(self, category: WorkflowCategory) -> List[BaseWorkflow]:
        """Get all workflows in a category."""
        return [
            w for w in self._workflows.values()
            if w.category == category
        ]

    def is_registered(self, code: WorkflowCode) -> bool:
        """Check if a workflow is registered."""
        return code in self._workflows

    # === Context Management ===

    def create_context(
        self,
        service_request_id: UUID,
        user_id: UUID,
        workflow_code: WorkflowCode,
        solicitud_type: SolicitudType,
        sub_type: Optional[str] = None
    ) -> WorkflowContext:
        """Create a new workflow context."""
        workflow = self.get_workflow(workflow_code)
        if not workflow:
            raise ValueError(f"Unknown workflow: {workflow_code}")

        if sub_type and sub_type not in workflow.allowed_sub_types:
            raise ValueError(
                f"Invalid sub_type '{sub_type}' for workflow {workflow_code}. "
                f"Allowed: {workflow.allowed_sub_types}"
            )

        context = WorkflowContext(
            service_request_id=service_request_id,
            user_id=user_id,
            workflow_code=workflow_code,
            solicitud_type=solicitud_type,
            sub_type=sub_type,
            entity_code=workflow.entity_code.value
        )

        return context

    async def load_context_from_db(
        self,
        db: asyncpg.Connection,
        service_request_id: UUID
    ) -> Optional[WorkflowContext]:
        """Load workflow context from database."""
        query = """
            SELECT
                sr.id,
                sr.user_id,
                sr.workflow_code,
                sr.solicitud_type,
                sr.status,
                sr.form_data,
                sr.entity_code,
                sr.assigned_to,
                sr.payment_id,
                sr.created_at,
                sr.updated_at,
                sr.submitted_at
            FROM service_requests sr
            WHERE sr.id = $1
        """
        row = await db.fetchrow(query, service_request_id)

        if not row:
            return None

        try:
            workflow_code = WorkflowCode(row["workflow_code"])
        except ValueError:
            logger.error(f"Unknown workflow_code in DB: {row['workflow_code']}")
            return None

        # Get sub_type from form_data if present
        form_data = row["form_data"] or {}
        sub_type = form_data.get("tipo") or form_data.get("sub_type")

        context = WorkflowContext(
            service_request_id=row["id"],
            user_id=row["user_id"],
            workflow_code=workflow_code,
            solicitud_type=SolicitudType(row["solicitud_type"]) if row["solicitud_type"] else SolicitudType.EXPEDICION,
            sub_type=sub_type,
            status=ServiceRequestStatus(row["status"]),
            form_data=form_data,
            entity_code=row["entity_code"],
            assigned_to=row["assigned_to"],
            payment_id=row["payment_id"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
            submitted_at=row["submitted_at"]
        )

        # Load documents
        docs_query = """
            SELECT document_code, id
            FROM service_request_documents
            WHERE service_request_id = $1
        """
        docs = await db.fetch(docs_query, service_request_id)
        context.documents_uploaded = {doc["document_code"]: doc["id"] for doc in docs}

        # Load extracted data for each document
        for doc in docs:
            ext_query = """
                SELECT extraction_data
                FROM service_request_documents
                WHERE id = $1
            """
            ext_row = await db.fetchrow(ext_query, doc["id"])
            if ext_row and ext_row["extraction_data"]:
                context.extracted_data[doc["document_code"]] = ext_row["extraction_data"]

        return context

    async def save_context_to_db(
        self,
        db: asyncpg.Connection,
        context: WorkflowContext
    ) -> None:
        """Save workflow context to database."""
        # Merge sub_type into form_data
        form_data = context.form_data.copy()
        if context.sub_type:
            form_data["sub_type"] = context.sub_type

        query = """
            UPDATE service_requests
            SET
                status = $2,
                form_data = $3,
                entity_code = $4,
                assigned_to = $5,
                updated_at = NOW()
            WHERE id = $1
        """
        await db.execute(
            query,
            context.service_request_id,
            context.status.value,
            form_data,
            context.entity_code,
            context.assigned_to
        )

    # === Step Execution ===

    async def execute_step(
        self,
        db: asyncpg.Connection,
        context: WorkflowContext,
        step_number: int,
        step_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Execute a workflow step.

        Args:
            db: Database connection
            context: Current workflow context
            step_number: Step number to execute
            step_data: Optional data for the step (form input, selections, etc.)

        Returns:
            Result of step execution including next step, validations, etc.
        """
        workflow = self.get_workflow(context.workflow_code)
        if not workflow:
            return {"error": f"Unknown workflow: {context.workflow_code}"}

        step = workflow.get_step(step_number)
        if not step:
            return {"error": f"Unknown step: {step_number}"}

        # Check if previous step is required and completed
        if step.requires_previous and step_number > 1:
            if context.current_step < step_number - 1:
                return {
                    "error": "Previous step not completed",
                    "current_step": context.current_step
                }

        result = {
            "step_number": step_number,
            "step_id": step.step_id,
            "step_type": step.step_type.value,
            "success": True
        }

        try:
            if step.step_type == StepType.SELECTION:
                result.update(await self._execute_selection_step(workflow, context, step, step_data))

            elif step.step_type == StepType.DOCUMENT_UPLOAD:
                result.update(await self._execute_document_step(db, workflow, context, step, step_data))

            elif step.step_type == StepType.FORM_REVIEW:
                result.update(await self._execute_form_review_step(context, step, step_data))

            elif step.step_type == StepType.VALIDATION:
                result.update(await self._execute_validation_step(workflow, context, step))

            elif step.step_type == StepType.PAYMENT:
                result.update(await self._execute_payment_step(workflow, context, step, step_data))

            elif step.step_type == StepType.CONFIRMATION:
                result.update(await self._execute_confirmation_step(db, workflow, context, step))

            else:
                # Custom step - delegate to workflow
                result.update(await self._execute_custom_step(workflow, context, step, step_data))

            # Update context step if successful
            if result.get("success", False):
                context.current_step = step_number
                context.updated_at = datetime.utcnow()

            # Add next step info
            next_step = workflow.get_step(step_number + 1)
            if next_step:
                result["next_step"] = {
                    "number": next_step.step_number,
                    "id": next_step.step_id,
                    "type": next_step.step_type.value,
                    "title_es": next_step.title_es
                }

        except Exception as e:
            logger.exception(f"Error executing step {step_number}: {e}")
            result["success"] = False
            result["error"] = str(e)

        return result

    async def _execute_selection_step(
        self,
        workflow: BaseWorkflow,
        context: WorkflowContext,
        step: WorkflowStep,
        step_data: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Execute a selection step (e.g., choose sub-type)."""
        if not step_data or "selection" not in step_data:
            # Return available options
            return {
                "options": workflow.allowed_sub_types,
                "requires_selection": True
            }

        selection = step_data["selection"]
        if selection not in workflow.allowed_sub_types:
            return {
                "success": False,
                "error": f"Invalid selection: {selection}",
                "options": workflow.allowed_sub_types
            }

        context.sub_type = selection

        # Get documents required for this sub-type
        docs = workflow.get_document_requirements(selection)

        return {
            "selection": selection,
            "documents_required": [
                {
                    "code": d.document_code,
                    "name_es": d.document_name_es,
                    "is_required": d.is_required,
                    "schema_key": d.schema_key,
                    "instructions_es": d.instructions_es
                }
                for d in docs if d.should_show(context)
            ]
        }

    async def _execute_document_step(
        self,
        db: asyncpg.Connection,
        workflow: BaseWorkflow,
        context: WorkflowContext,
        step: WorkflowStep,
        step_data: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Execute document upload step with extraction."""
        # Get required documents for current context
        applicable_docs = step.get_applicable_documents(context)

        if not step_data:
            # Return what's needed
            return {
                "documents_required": [
                    {
                        "code": d.document_code,
                        "name_es": d.document_name_es,
                        "is_required": d.is_required,
                        "uploaded": d.document_code in context.documents_uploaded,
                        "schema_key": d.schema_key
                    }
                    for d in applicable_docs
                ]
            }

        # Document upload is handled by separate endpoint
        # This step just validates all required docs are uploaded

        missing = []
        for doc in applicable_docs:
            if doc.is_required and doc.document_code not in context.documents_uploaded:
                missing.append({
                    "code": doc.document_code,
                    "name_es": doc.document_name_es
                })

        if missing:
            return {
                "success": False,
                "error": "Missing required documents",
                "missing_documents": missing
            }

        return {
            "all_documents_uploaded": True,
            "documents_count": len(context.documents_uploaded)
        }

    async def _execute_form_review_step(
        self,
        context: WorkflowContext,
        step: WorkflowStep,
        step_data: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Execute form review step."""
        if not step_data:
            # Return pre-filled form data from extractions
            return {
                "form_data": context.form_data,
                "extracted_data": context.extracted_data,
                "requires_review": True
            }

        # User has confirmed/corrected data
        if "confirmed_data" in step_data:
            context.form_data.update(step_data["confirmed_data"])

        return {
            "form_data_updated": True
        }

    async def _execute_validation_step(
        self,
        workflow: BaseWorkflow,
        context: WorkflowContext,
        step: WorkflowStep
    ) -> Dict[str, Any]:
        """Execute validation step with cross-document checks."""
        results = workflow.validate_step(step.step_number, context)
        context.validation_results = results

        errors = [r for r in results if r.is_error]
        warnings = [r for r in results if r.is_warning]

        return {
            "validation_complete": True,
            "has_errors": len(errors) > 0,
            "errors": [
                {
                    "rule_id": e.rule_id,
                    "message_es": e.message_es,
                    "document_code": e.document_code
                }
                for e in errors
            ],
            "warnings": [
                {
                    "rule_id": w.rule_id,
                    "message_es": w.message_es,
                    "document_code": w.document_code
                }
                for w in warnings
            ],
            "success": len(errors) == 0
        }

    async def _execute_payment_step(
        self,
        workflow: BaseWorkflow,
        context: WorkflowContext,
        step: WorkflowStep,
        step_data: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Execute payment step."""
        tariff = workflow.calculate_tariff(context)

        if not step_data:
            # Return payment info
            return {
                "amount": tariff,
                "currency": "XAF",
                "payment_methods": ["MTN_MOBILE_MONEY", "ORANGE_MONEY", "BANGE_WALLET"],
                "requires_payment": True
            }

        # Payment processing is handled by payment module
        # This step just verifies payment was completed
        if context.payment_status == "completed":
            return {"payment_complete": True}

        return {
            "success": False,
            "error": "Payment not completed",
            "payment_status": context.payment_status
        }

    async def _execute_confirmation_step(
        self,
        db: asyncpg.Connection,
        workflow: BaseWorkflow,
        context: WorkflowContext,
        step: WorkflowStep
    ) -> Dict[str, Any]:
        """Execute confirmation and submission step."""
        # Verify all previous steps completed
        if context.has_errors():
            return {
                "success": False,
                "error": "Cannot submit with validation errors",
                "errors": [
                    {"rule_id": e.rule_id, "message_es": e.message_es}
                    for e in context.get_errors()
                ]
            }

        # Update status to submitted
        context.status = ServiceRequestStatus.SUBMITTED
        context.submitted_at = datetime.utcnow()

        # Save to database
        await self.save_context_to_db(db, context)

        return {
            "submitted": True,
            "reference": str(context.service_request_id)[:8].upper(),
            "submitted_at": context.submitted_at.isoformat(),
            "next_status": workflow.get_next_status(context.status).value if workflow.get_next_status(context.status) else None
        }

    async def _execute_custom_step(
        self,
        workflow: BaseWorkflow,
        context: WorkflowContext,
        step: WorkflowStep,
        step_data: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Execute a custom workflow-specific step."""
        # Custom steps are handled by workflow-specific logic
        # This is a placeholder for workflow extensions
        return {
            "custom_step": True,
            "step_id": step.step_id
        }

    # === Status Transitions ===

    async def transition_status(
        self,
        db: asyncpg.Connection,
        context: WorkflowContext,
        new_status: ServiceRequestStatus,
        reason: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Transition service request to a new status.

        Args:
            db: Database connection
            context: Current workflow context
            new_status: Target status
            reason: Optional reason for transition (e.g., rejection reason)

        Returns:
            Result of transition including success status
        """
        workflow = self.get_workflow(context.workflow_code)
        if not workflow:
            return {"error": f"Unknown workflow: {context.workflow_code}"}

        if not workflow.can_transition_to(context.status, new_status):
            return {
                "success": False,
                "error": f"Cannot transition from {context.status.value} to {new_status.value}"
            }

        old_status = context.status
        context.status = new_status
        context.updated_at = datetime.utcnow()

        # Record in history
        history_query = """
            INSERT INTO service_request_history
            (service_request_id, previous_status, new_status, notes, created_at)
            VALUES ($1, $2, $3, $4, NOW())
        """
        await db.execute(
            history_query,
            context.service_request_id,
            old_status.value,
            new_status.value,
            reason
        )

        # Update service_requests table
        update_query = """
            UPDATE service_requests
            SET status = $2, updated_at = NOW()
            WHERE id = $1
        """

        # Special handling for certain statuses
        if new_status == ServiceRequestStatus.REJECTED:
            update_query = """
                UPDATE service_requests
                SET status = $2, rejection_reason = $3, updated_at = NOW()
                WHERE id = $1
            """
            await db.execute(update_query, context.service_request_id, new_status.value, reason)
        elif new_status == ServiceRequestStatus.SUBMITTED:
            update_query = """
                UPDATE service_requests
                SET status = $2, submitted_at = NOW(), updated_at = NOW()
                WHERE id = $1
            """
            await db.execute(update_query, context.service_request_id, new_status.value)
        elif new_status == ServiceRequestStatus.COMPLETED:
            update_query = """
                UPDATE service_requests
                SET status = $2, completed_at = NOW(), updated_at = NOW()
                WHERE id = $1
            """
            await db.execute(update_query, context.service_request_id, new_status.value)
        else:
            await db.execute(update_query, context.service_request_id, new_status.value)

        logger.info(
            f"Transitioned service request {context.service_request_id} "
            f"from {old_status.value} to {new_status.value}"
        )

        return {
            "success": True,
            "previous_status": old_status.value,
            "new_status": new_status.value,
            "next_status": workflow.get_next_status(new_status).value if workflow.get_next_status(new_status) else None
        }

    # === Workflow Info ===

    def get_available_workflows(self) -> List[Dict[str, Any]]:
        """Get list of all available workflows."""
        return [w.get_info() for w in self._workflows.values()]

    def get_workflows_for_display(self) -> Dict[str, List[Dict[str, Any]]]:
        """Get workflows grouped by category for display."""
        result: Dict[str, List[Dict[str, Any]]] = {}

        for workflow in self._workflows.values():
            category = workflow.category.value
            if category not in result:
                result[category] = []

            result[category].append({
                "code": workflow.workflow_code.value,
                "name_es": workflow.service_name_es,
                "name_fr": workflow.service_name_fr,
                "entity_code": workflow.entity_code.value,
                "sub_types": workflow.allowed_sub_types
            })

        return result


# Singleton instance
workflow_engine = WorkflowEngine()
