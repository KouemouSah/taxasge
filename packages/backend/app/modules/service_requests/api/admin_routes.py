"""
Admin Routes for Service Requests Configuration.

RESTful endpoints for administrators to manage:
- Workflows (CRUD)
- Workflow Document Requirements
- Tariff Configurations
- Appointment Settings
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path, Body
from typing import List, Optional, Dict, Any
import asyncpg
from datetime import date
from decimal import Decimal

from pydantic import BaseModel, Field

from app.database.connection import get_database
from app.modules.auth.middleware.auth_middleware import get_current_user
from app.modules.permissions.middleware.permission_middleware import require_permission


router = APIRouter(
    prefix="/admin/service-requests",
    tags=["Admin - Service Requests Configuration"]
)


# ═══════════════════════════════════════════════════════════════
# PYDANTIC MODELS - Aligned with DATABASE_SCHEMA_REFERENCE.md
# ═══════════════════════════════════════════════════════════════

# ─────────────────────────────────────────────────────────────────
# WORKFLOWS (table: workflows - migration 028)
# ─────────────────────────────────────────────────────────────────

class WorkflowCreate(BaseModel):
    """Create a new workflow configuration - matches DB schema"""
    code: str = Field(..., pattern=r'^[A-Z][A-Z0-9_]+$', max_length=100)
    name_es: str = Field(..., max_length=255)
    description_es: Optional[str] = None
    category: str = Field(..., max_length=50)
    entity_code: str = Field(..., max_length=50)
    workflow_type: str = Field(default="standard", pattern="^(standard|direct_payment|multi_phase)$")
    requires_agent_validation: bool = True
    requires_appointment: bool = False
    is_generic: bool = True
    appointment_delay_days: Optional[int] = Field(None, ge=0, le=90)
    appointment_entity_code: Optional[str] = Field(None, max_length=50)
    sla_hours: int = Field(default=48, ge=1, le=720)
    max_processing_days: Optional[int] = Field(None, ge=1, le=365)
    display_order: int = Field(default=0, ge=0)
    icon: Optional[str] = Field(None, max_length=50)
    color: Optional[str] = Field(None, max_length=20)
    config: Optional[Dict[str, Any]] = Field(default_factory=dict)
    is_active: bool = True


class WorkflowUpdate(BaseModel):
    """Update workflow configuration"""
    name_es: Optional[str] = Field(None, max_length=255)
    description_es: Optional[str] = None
    workflow_type: Optional[str] = Field(None, pattern="^(standard|direct_payment|multi_phase)$")
    requires_agent_validation: Optional[bool] = None
    requires_appointment: Optional[bool] = None
    appointment_delay_days: Optional[int] = Field(None, ge=0, le=90)
    appointment_entity_code: Optional[str] = Field(None, max_length=50)
    sla_hours: Optional[int] = Field(None, ge=1, le=720)
    max_processing_days: Optional[int] = Field(None, ge=1, le=365)
    display_order: Optional[int] = Field(None, ge=0)
    icon: Optional[str] = Field(None, max_length=50)
    color: Optional[str] = Field(None, max_length=20)
    config: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class WorkflowResponse(BaseModel):
    """Workflow response - all DB fields"""
    code: str
    name_es: str
    description_es: Optional[str]
    category: str
    entity_code: str
    workflow_type: str
    requires_agent_validation: bool
    requires_appointment: bool
    is_generic: bool
    appointment_delay_days: Optional[int]
    appointment_entity_code: Optional[str]
    sla_hours: int
    max_processing_days: Optional[int]
    display_order: int
    icon: Optional[str]
    color: Optional[str]
    config: Optional[Dict[str, Any]]
    is_active: bool
    # Computed fields (not in DB)
    documents_count: Optional[int] = None
    tariffs_count: Optional[int] = None


# ─────────────────────────────────────────────────────────────────
# WORKFLOW_DOCUMENT_REQUIREMENTS (table: workflow_document_requirements)
# ─────────────────────────────────────────────────────────────────

from enum import Enum

class DocumentConditionType(str, Enum):
    """Document condition type enum - matches DB enum"""
    ALWAYS = "always"
    IF_SOLICITUD_TYPE = "if_solicitud_type"
    IF_FORM_FIELD = "if_form_field"
    IF_DOCUMENT_EXISTS = "if_document_exists"


class DocumentRequirementCreate(BaseModel):
    """Create document requirement - matches DB schema"""
    document_code: str = Field(..., max_length=100)
    document_name_es: str = Field(..., max_length=255)
    document_template_id: Optional[int] = None
    condition_type: DocumentConditionType = DocumentConditionType.ALWAYS
    condition_value: Optional[Dict[str, Any]] = Field(default_factory=dict)
    is_required: bool = True
    display_order: int = Field(default=0, ge=0)
    instructions_es: Optional[str] = None
    extraction_schema_key: Optional[str] = Field(None, max_length=100)
    is_active: bool = True


class DocumentRequirementUpdate(BaseModel):
    """Update document requirement"""
    document_name_es: Optional[str] = Field(None, max_length=255)
    document_template_id: Optional[int] = None
    condition_type: Optional[DocumentConditionType] = None
    condition_value: Optional[Dict[str, Any]] = None
    is_required: Optional[bool] = None
    display_order: Optional[int] = Field(None, ge=0)
    instructions_es: Optional[str] = None
    extraction_schema_key: Optional[str] = Field(None, max_length=100)
    is_active: Optional[bool] = None


class DocumentRequirementResponse(BaseModel):
    """Document requirement response - matches DB schema"""
    id: str  # UUID in DB
    workflow_code: str
    document_code: str
    document_name_es: str
    document_template_id: Optional[int]
    condition_type: str
    condition_value: Optional[Dict[str, Any]]
    is_required: bool
    display_order: int
    instructions_es: Optional[str]
    extraction_schema_key: Optional[str]
    is_active: bool


# ─────────────────────────────────────────────────────────────────
# WORKFLOW_TARIFFS (table: workflow_tariffs - NOT tariff_configurations)
# ─────────────────────────────────────────────────────────────────

class TariffType(str, Enum):
    """Tariff type enum - matches DB constraint"""
    FIXED = "FIXED"
    PERCENTAGE = "PERCENTAGE"
    NOTA_INGRESO = "NOTA_INGRESO"


class WorkflowTariffCreate(BaseModel):
    """Create workflow tariff - matches workflow_tariffs table"""
    workflow_code: str = Field(..., max_length=100)
    solicitud_type: str = Field(default="expedicion", max_length=50)
    tariff_type: TariffType = TariffType.FIXED
    amount: Decimal = Field(..., ge=0)
    percentage_rate: Optional[Decimal] = Field(None, ge=0, le=100)
    currency: str = Field(default="XAF", max_length=3)
    legal_reference: Optional[str] = Field(None, max_length=255)
    effective_from: date
    effective_to: Optional[date] = None
    is_active: bool = True


class WorkflowTariffUpdate(BaseModel):
    """Update workflow tariff"""
    solicitud_type: Optional[str] = Field(None, max_length=50)
    tariff_type: Optional[TariffType] = None
    amount: Optional[Decimal] = Field(None, ge=0)
    percentage_rate: Optional[Decimal] = Field(None, ge=0, le=100)
    currency: Optional[str] = Field(None, max_length=3)
    legal_reference: Optional[str] = Field(None, max_length=255)
    effective_to: Optional[date] = None
    is_active: Optional[bool] = None


class WorkflowTariffResponse(BaseModel):
    """Workflow tariff response - matches DB schema"""
    id: int
    workflow_code: str
    solicitud_type: str
    tariff_type: str
    amount: float
    percentage_rate: Optional[float]
    currency: str
    legal_reference: Optional[str]
    effective_from: str
    effective_to: Optional[str]
    is_active: bool


# ─────────────────────────────────────────────────────────────────
# APPOINTMENT_SLOT_CONFIGS (table: appointment_slot_configs)
# ─────────────────────────────────────────────────────────────────

from datetime import time as Time

class AppointmentSlotConfigCreate(BaseModel):
    """Create appointment slot config - matches DB schema"""
    entity_code: str = Field(..., max_length=50)
    day_of_week: int = Field(..., ge=0, le=6, description="0=Monday, 6=Sunday")
    start_time: Time
    end_time: Time
    slot_duration_minutes: int = Field(default=30, ge=5, le=120)
    max_appointments_per_slot: int = Field(default=10, ge=1, le=100)
    location_name: Optional[str] = Field(None, max_length=255)
    location_address: Optional[str] = None
    is_active: bool = True


class AppointmentSlotConfigUpdate(BaseModel):
    """Update appointment slot config"""
    start_time: Optional[Time] = None
    end_time: Optional[Time] = None
    slot_duration_minutes: Optional[int] = Field(None, ge=5, le=120)
    max_appointments_per_slot: Optional[int] = Field(None, ge=1, le=100)
    location_name: Optional[str] = Field(None, max_length=255)
    location_address: Optional[str] = None
    is_active: Optional[bool] = None


class AppointmentSlotConfigResponse(BaseModel):
    """Appointment slot config response"""
    id: str  # UUID
    entity_code: str
    day_of_week: int
    start_time: str
    end_time: str
    slot_duration_minutes: int
    max_appointments_per_slot: int
    location_name: Optional[str]
    location_address: Optional[str]
    is_active: bool


# ─────────────────────────────────────────────────────────────────
# APPOINTMENT_BLOCKED_DATES (table: appointment_blocked_dates)
# ─────────────────────────────────────────────────────────────────

class AppointmentBlockedDateCreate(BaseModel):
    """Create blocked date - matches DB schema"""
    entity_code: Optional[str] = Field(None, max_length=50, description="NULL = applies to all entities")
    blocked_date: date
    reason: Optional[str] = Field(None, max_length=255)
    is_recurring: bool = Field(default=False, description="True = same date every year")


class AppointmentBlockedDateResponse(BaseModel):
    """Blocked date response"""
    id: str  # UUID
    entity_code: Optional[str]
    blocked_date: str
    reason: Optional[str]
    is_recurring: bool


# ─────────────────────────────────────────────────────────────────
# APPOINTMENT_DELAY_RULES (table: appointment_delay_rules)
# ─────────────────────────────────────────────────────────────────

class AppointmentDelayRuleCreate(BaseModel):
    """Create delay rule - matches DB schema"""
    workflow_code: Optional[str] = Field(None, max_length=100, description="NULL = default for all workflows")
    priority: str = Field(..., description="URGENT, HIGH, NORMAL, LOW")
    delay_business_days: int = Field(default=3, ge=0, le=30)
    is_active: bool = True


class AppointmentDelayRuleResponse(BaseModel):
    """Delay rule response"""
    id: str  # UUID
    workflow_code: Optional[str]
    priority: str
    delay_business_days: int
    is_active: bool


# Legacy aliases for backward compatibility
TariffConfigCreate = WorkflowTariffCreate
TariffConfigUpdate = WorkflowTariffUpdate
TariffConfigResponse = WorkflowTariffResponse


# ═══════════════════════════════════════════════════════════════
# WORKFLOW CRUD
# ═══════════════════════════════════════════════════════════════

@router.get(
    "/workflows",
    response_model=List[WorkflowResponse],
    summary="List all workflows",
    description="Get all workflow configurations with optional filtering."
)
async def list_workflows(
    category: Optional[str] = Query(None, description="Filter by category"),
    entity_code: Optional[str] = Query(None, description="Filter by entity"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    is_generic: Optional[bool] = Query(None, description="Filter generic workflows only"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(require_permission("admin:manage_workflows"))
):
    query = """
        SELECT
            w.*,
            (SELECT COUNT(*) FROM workflow_document_requirements
             WHERE workflow_code = w.code) as documents_count,
            (SELECT COUNT(*) FROM workflow_tariffs
             WHERE workflow_code = w.code AND is_active = true) as tariffs_count
        FROM workflows w
        WHERE 1=1
    """
    params = []

    if category:
        params.append(category)
        query += f" AND w.category = ${len(params)}"

    if entity_code:
        params.append(entity_code)
        query += f" AND w.entity_code = ${len(params)}"

    if is_active is not None:
        params.append(is_active)
        query += f" AND w.is_active = ${len(params)}"

    if is_generic is not None:
        params.append(is_generic)
        query += f" AND w.is_generic = ${len(params)}"

    query += " ORDER BY w.display_order, w.category, w.name_es"

    rows = await db.fetch(query, *params)

    return [
        WorkflowResponse(
            code=row['code'],
            name_es=row['name_es'],
            description_es=row['description_es'],
            category=row['category'],
            entity_code=row['entity_code'],
            workflow_type=row['workflow_type'],
            requires_agent_validation=row['requires_agent_validation'],
            requires_appointment=row['requires_appointment'],
            is_generic=row['is_generic'],
            appointment_delay_days=row['appointment_delay_days'],
            appointment_entity_code=row['appointment_entity_code'],
            sla_hours=row['sla_hours'],
            max_processing_days=row['max_processing_days'],
            display_order=row['display_order'] or 0,
            icon=row['icon'],
            color=row['color'],
            config=row['config'],
            is_active=row['is_active'],
            documents_count=row['documents_count'],
            tariffs_count=row['tariffs_count']
        )
        for row in rows
    ]


@router.get(
    "/workflows/{code}",
    response_model=WorkflowResponse,
    summary="Get workflow details",
    description="Get a specific workflow configuration by code."
)
async def get_workflow(
    code: str = Path(..., description="Workflow code"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(require_permission("admin:manage_workflows"))
):
    row = await db.fetchrow("""
        SELECT
            w.*,
            (SELECT COUNT(*) FROM workflow_document_requirements
             WHERE workflow_code = w.code) as documents_count,
            (SELECT COUNT(*) FROM workflow_tariffs
             WHERE workflow_code = w.code AND is_active = true) as tariffs_count
        FROM workflows w
        WHERE w.code = $1
    """, code)

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workflow not found: {code}"
        )

    return WorkflowResponse(
        code=row['code'],
        name_es=row['name_es'],
        description_es=row['description_es'],
        category=row['category'],
        entity_code=row['entity_code'],
        workflow_type=row['workflow_type'],
        requires_agent_validation=row['requires_agent_validation'],
        requires_appointment=row['requires_appointment'],
        is_generic=row['is_generic'],
        appointment_delay_days=row['appointment_delay_days'],
        appointment_entity_code=row['appointment_entity_code'],
        sla_hours=row['sla_hours'],
        max_processing_days=row['max_processing_days'],
        display_order=row['display_order'] or 0,
        icon=row['icon'],
        color=row['color'],
        config=row['config'],
        is_active=row['is_active'],
        documents_count=row['documents_count'],
        tariffs_count=row['tariffs_count']
    )


@router.post(
    "/workflows",
    response_model=WorkflowResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create workflow",
    description="""
    Create a new workflow configuration.

    **Note:** Only generic workflows can be created through the API.
    Hardcoded workflows (pasaporte, residencia, etc.) are defined in Python code.
    """
)
async def create_workflow(
    workflow: WorkflowCreate = Body(...),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(require_permission("admin:manage_workflows"))
):
    # Check if code already exists
    existing = await db.fetchval(
        "SELECT 1 FROM workflows WHERE code = $1", workflow.code
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Workflow already exists: {workflow.code}"
        )

    import json
    config_json = json.dumps(workflow.config) if workflow.config else '{}'

    row = await db.fetchrow("""
        INSERT INTO workflows (
            code, name_es, description_es, category, entity_code,
            workflow_type, requires_agent_validation, requires_appointment,
            is_generic, appointment_delay_days, appointment_entity_code,
            sla_hours, max_processing_days, display_order, icon, color,
            config, is_active, created_at, updated_at
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
            $17::jsonb, $18, NOW(), NOW()
        )
        RETURNING *
    """, workflow.code, workflow.name_es, workflow.description_es,
        workflow.category, workflow.entity_code, workflow.workflow_type,
        workflow.requires_agent_validation, workflow.requires_appointment,
        workflow.is_generic, workflow.appointment_delay_days,
        workflow.appointment_entity_code, workflow.sla_hours,
        workflow.max_processing_days, workflow.display_order,
        workflow.icon, workflow.color, config_json, workflow.is_active)

    return WorkflowResponse(
        code=row['code'],
        name_es=row['name_es'],
        description_es=row['description_es'],
        category=row['category'],
        entity_code=row['entity_code'],
        workflow_type=row['workflow_type'],
        requires_agent_validation=row['requires_agent_validation'],
        requires_appointment=row['requires_appointment'],
        is_generic=row['is_generic'],
        appointment_delay_days=row['appointment_delay_days'],
        appointment_entity_code=row['appointment_entity_code'],
        sla_hours=row['sla_hours'],
        max_processing_days=row['max_processing_days'],
        display_order=row['display_order'] or 0,
        icon=row['icon'],
        color=row['color'],
        config=row['config'],
        is_active=row['is_active']
    )


@router.put(
    "/workflows/{code}",
    response_model=WorkflowResponse,
    summary="Update workflow",
    description="Update an existing workflow configuration."
)
async def update_workflow(
    code: str = Path(..., description="Workflow code"),
    workflow: WorkflowUpdate = Body(...),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(require_permission("admin:manage_workflows"))
):
    import json

    # Check if workflow exists
    existing = await db.fetchrow(
        "SELECT * FROM workflows WHERE code = $1", code
    )
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workflow not found: {code}"
        )

    # Build update query dynamically
    updates = []
    params = [code]
    param_idx = 2

    for field, value in workflow.model_dump(exclude_unset=True).items():
        if value is not None:
            # Handle JSONB config field
            if field == 'config':
                updates.append(f"{field} = ${param_idx}::jsonb")
                params.append(json.dumps(value))
            else:
                updates.append(f"{field} = ${param_idx}")
                params.append(value)
            param_idx += 1

    if not updates:
        return await get_workflow(code, db, current_user, _)

    updates.append(f"updated_at = NOW()")

    query = f"""
        UPDATE workflows
        SET {', '.join(updates)}
        WHERE code = $1
        RETURNING *
    """

    row = await db.fetchrow(query, *params)

    return WorkflowResponse(
        code=row['code'],
        name_es=row['name_es'],
        description_es=row['description_es'],
        category=row['category'],
        entity_code=row['entity_code'],
        workflow_type=row['workflow_type'],
        requires_agent_validation=row['requires_agent_validation'],
        requires_appointment=row['requires_appointment'],
        is_generic=row['is_generic'],
        appointment_delay_days=row['appointment_delay_days'],
        appointment_entity_code=row['appointment_entity_code'],
        sla_hours=row['sla_hours'],
        max_processing_days=row['max_processing_days'],
        display_order=row['display_order'] or 0,
        icon=row['icon'],
        color=row['color'],
        config=row['config'],
        is_active=row['is_active']
    )


@router.patch(
    "/workflows/{code}/activate",
    summary="Activate or deactivate workflow",
    description="Toggle workflow active status."
)
async def toggle_workflow_status(
    code: str = Path(..., description="Workflow code"),
    is_active: bool = Body(..., embed=True),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(require_permission("admin:manage_workflows"))
):
    result = await db.execute("""
        UPDATE workflows
        SET is_active = $2, updated_at = NOW()
        WHERE code = $1
    """, code, is_active)

    if 'UPDATE 0' in result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workflow not found: {code}"
        )

    return {
        "message": f"Workflow {'activated' if is_active else 'deactivated'}",
        "code": code,
        "is_active": is_active
    }


@router.delete(
    "/workflows/{code}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete workflow",
    description="""
    Delete a workflow configuration.

    **Warning:** This also deletes associated document requirements and tariffs.
    Hardcoded workflows cannot be deleted.
    """
)
async def delete_workflow(
    code: str = Path(..., description="Workflow code"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(require_permission("admin:manage_workflows"))
):
    # Check if it's a generic workflow
    workflow = await db.fetchrow(
        "SELECT is_generic FROM workflows WHERE code = $1", code
    )

    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workflow not found: {code}"
        )

    if not workflow['is_generic']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete hardcoded workflows. Deactivate instead."
        )

    # Check for existing service requests
    has_requests = await db.fetchval("""
        SELECT 1 FROM service_requests WHERE workflow_code = $1 LIMIT 1
    """, code)

    if has_requests:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete workflow with existing service requests. Deactivate instead."
        )

    # Delete in order (foreign key constraints)
    await db.execute(
        "DELETE FROM workflow_tariffs WHERE workflow_code = $1", code
    )
    await db.execute(
        "DELETE FROM workflow_document_requirements WHERE workflow_code = $1", code
    )
    await db.execute("DELETE FROM workflows WHERE code = $1", code)

    return None


# ═══════════════════════════════════════════════════════════════
# DOCUMENT REQUIREMENTS
# ═══════════════════════════════════════════════════════════════

@router.get(
    "/workflows/{code}/documents",
    response_model=List[DocumentRequirementResponse],
    summary="List document requirements",
    description="Get all document requirements for a workflow."
)
async def list_document_requirements(
    code: str = Path(..., description="Workflow code"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(require_permission("admin:manage_workflows"))
):
    rows = await db.fetch("""
        SELECT * FROM workflow_document_requirements
        WHERE workflow_code = $1
        ORDER BY display_order, document_code
    """, code)

    return [
        DocumentRequirementResponse(
            id=str(row['id']),
            workflow_code=row['workflow_code'],
            document_code=row['document_code'],
            document_name_es=row['document_name_es'],
            document_template_id=row.get('document_template_id'),
            condition_type=row.get('condition_type', 'always'),
            condition_value=row.get('condition_value'),
            is_required=row['is_required'],
            display_order=row['display_order'],
            instructions_es=row['instructions_es'],
            extraction_schema_key=row['extraction_schema_key'],
            is_active=row.get('is_active', True)
        )
        for row in rows
    ]


@router.post(
    "/workflows/{code}/documents",
    response_model=DocumentRequirementResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add document requirement",
    description="Add a new document requirement to a workflow."
)
async def add_document_requirement(
    code: str = Path(..., description="Workflow code"),
    doc: DocumentRequirementCreate = Body(...),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(require_permission("admin:manage_workflows"))
):
    import json

    # Check workflow exists
    workflow_exists = await db.fetchval(
        "SELECT 1 FROM workflows WHERE code = $1", code
    )
    if not workflow_exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workflow not found: {code}"
        )

    # Check if document code already exists for this workflow
    existing = await db.fetchval("""
        SELECT 1 FROM workflow_document_requirements
        WHERE workflow_code = $1 AND document_code = $2
    """, code, doc.document_code)

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Document {doc.document_code} already exists for workflow {code}"
        )

    condition_value_json = json.dumps(doc.condition_value) if doc.condition_value else None

    row = await db.fetchrow("""
        INSERT INTO workflow_document_requirements (
            workflow_code, document_code, document_name_es,
            document_template_id, condition_type, condition_value,
            is_required, display_order, instructions_es,
            extraction_schema_key, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, $11)
        RETURNING *
    """, code, doc.document_code, doc.document_name_es,
        doc.document_template_id, doc.condition_type.value,
        condition_value_json, doc.is_required, doc.display_order,
        doc.instructions_es, doc.extraction_schema_key, doc.is_active)

    return DocumentRequirementResponse(
        id=str(row['id']),
        workflow_code=row['workflow_code'],
        document_code=row['document_code'],
        document_name_es=row['document_name_es'],
        document_template_id=row.get('document_template_id'),
        condition_type=row.get('condition_type', 'always'),
        condition_value=row.get('condition_value'),
        is_required=row['is_required'],
        display_order=row['display_order'],
        instructions_es=row['instructions_es'],
        extraction_schema_key=row['extraction_schema_key'],
        is_active=row.get('is_active', True)
    )


@router.put(
    "/workflows/{code}/documents/{doc_code}",
    response_model=DocumentRequirementResponse,
    summary="Update document requirement",
    description="Update a document requirement."
)
async def update_document_requirement(
    code: str = Path(..., description="Workflow code"),
    doc_code: str = Path(..., description="Document code"),
    doc: DocumentRequirementUpdate = Body(...),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(require_permission("admin:manage_workflows"))
):
    import json

    # Build update query
    updates = []
    params = [code, doc_code]
    param_idx = 3

    for field, value in doc.model_dump(exclude_unset=True).items():
        if value is not None:
            # Handle enum and JSONB fields
            if field == 'condition_type':
                updates.append(f"{field} = ${param_idx}")
                params.append(value.value if hasattr(value, 'value') else value)
            elif field == 'condition_value':
                updates.append(f"{field} = ${param_idx}::jsonb")
                params.append(json.dumps(value))
            else:
                updates.append(f"{field} = ${param_idx}")
                params.append(value)
            param_idx += 1

    if not updates:
        # Return existing
        row = await db.fetchrow("""
            SELECT * FROM workflow_document_requirements
            WHERE workflow_code = $1 AND document_code = $2
        """, code, doc_code)

        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document requirement not found"
            )

        return DocumentRequirementResponse(
            id=str(row['id']),
            workflow_code=row['workflow_code'],
            document_code=row['document_code'],
            document_name_es=row['document_name_es'],
            document_template_id=row.get('document_template_id'),
            condition_type=row.get('condition_type', 'always'),
            condition_value=row.get('condition_value'),
            is_required=row['is_required'],
            display_order=row['display_order'],
            instructions_es=row['instructions_es'],
            extraction_schema_key=row['extraction_schema_key'],
            is_active=row.get('is_active', True)
        )

    query = f"""
        UPDATE workflow_document_requirements
        SET {', '.join(updates)}
        WHERE workflow_code = $1 AND document_code = $2
        RETURNING *
    """

    row = await db.fetchrow(query, *params)

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document requirement not found"
        )

    return DocumentRequirementResponse(
        id=str(row['id']),
        workflow_code=row['workflow_code'],
        document_code=row['document_code'],
        document_name_es=row['document_name_es'],
        document_template_id=row.get('document_template_id'),
        condition_type=row.get('condition_type', 'always'),
        condition_value=row.get('condition_value'),
        is_required=row['is_required'],
        display_order=row['display_order'],
        instructions_es=row['instructions_es'],
        extraction_schema_key=row['extraction_schema_key'],
        is_active=row.get('is_active', True)
    )


@router.delete(
    "/workflows/{code}/documents/{doc_code}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove document requirement",
    description="Remove a document requirement from a workflow."
)
async def remove_document_requirement(
    code: str = Path(..., description="Workflow code"),
    doc_code: str = Path(..., description="Document code"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(require_permission("admin:manage_workflows"))
):
    result = await db.execute("""
        DELETE FROM workflow_document_requirements
        WHERE workflow_code = $1 AND document_code = $2
    """, code, doc_code)

    if 'DELETE 0' in result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document requirement not found"
        )

    return None


@router.patch(
    "/workflows/{code}/documents/reorder",
    summary="Reorder document requirements",
    description="Update the display order of document requirements."
)
async def reorder_documents(
    code: str = Path(..., description="Workflow code"),
    order: List[Dict[str, int]] = Body(
        ...,
        description="List of {document_code: display_order} pairs"
    ),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(require_permission("admin:manage_workflows"))
):
    for item in order:
        doc_code = item.get('document_code')
        display_order = item.get('display_order', 0)

        await db.execute("""
            UPDATE workflow_document_requirements
            SET display_order = $3
            WHERE workflow_code = $1 AND document_code = $2
        """, code, doc_code, display_order)

    return {"message": "Documents reordered successfully"}


# ═══════════════════════════════════════════════════════════════
# WORKFLOW TARIFFS (table: workflow_tariffs)
# ═══════════════════════════════════════════════════════════════

@router.get(
    "/tariffs",
    response_model=List[WorkflowTariffResponse],
    summary="List all workflow tariffs",
    description="Get all workflow tariff configurations with optional filtering."
)
async def list_tariffs(
    workflow_code: Optional[str] = Query(None, description="Filter by workflow"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(require_permission("admin:manage_tariffs"))
):
    query = "SELECT * FROM workflow_tariffs WHERE 1=1"
    params = []

    if workflow_code:
        params.append(workflow_code)
        query += f" AND workflow_code = ${len(params)}"

    if is_active is not None:
        params.append(is_active)
        query += f" AND is_active = ${len(params)}"

    query += " ORDER BY workflow_code, effective_from DESC"

    rows = await db.fetch(query, *params)

    return [
        WorkflowTariffResponse(
            id=row['id'],
            workflow_code=row['workflow_code'],
            solicitud_type=row['solicitud_type'],
            tariff_type=row['tariff_type'],
            amount=float(row['amount']) if row['amount'] else 0,
            percentage_rate=float(row['percentage_rate']) if row['percentage_rate'] else None,
            currency=row['currency'],
            legal_reference=row['legal_reference'],
            effective_from=row['effective_from'].isoformat() if row['effective_from'] else None,
            effective_to=row['effective_to'].isoformat() if row['effective_to'] else None,
            is_active=row['is_active']
        )
        for row in rows
    ]


@router.post(
    "/tariffs",
    response_model=WorkflowTariffResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create workflow tariff",
    description="Create a new workflow tariff configuration."
)
async def create_tariff(
    tariff: WorkflowTariffCreate = Body(...),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(require_permission("admin:manage_tariffs"))
):
    # Check workflow exists
    workflow_exists = await db.fetchval(
        "SELECT 1 FROM workflows WHERE code = $1", tariff.workflow_code
    )
    if not workflow_exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workflow not found: {tariff.workflow_code}"
        )

    row = await db.fetchrow("""
        INSERT INTO workflow_tariffs (
            workflow_code, solicitud_type, tariff_type, amount,
            percentage_rate, currency, legal_reference,
            effective_from, effective_to, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
    """, tariff.workflow_code, tariff.solicitud_type, tariff.tariff_type.value,
        tariff.amount, tariff.percentage_rate, tariff.currency,
        tariff.legal_reference, tariff.effective_from, tariff.effective_to,
        tariff.is_active)

    return WorkflowTariffResponse(
        id=row['id'],
        workflow_code=row['workflow_code'],
        solicitud_type=row['solicitud_type'],
        tariff_type=row['tariff_type'],
        amount=float(row['amount']) if row['amount'] else 0,
        percentage_rate=float(row['percentage_rate']) if row['percentage_rate'] else None,
        currency=row['currency'],
        legal_reference=row['legal_reference'],
        effective_from=row['effective_from'].isoformat() if row['effective_from'] else None,
        effective_to=row['effective_to'].isoformat() if row['effective_to'] else None,
        is_active=row['is_active']
    )


@router.put(
    "/tariffs/{tariff_id}",
    response_model=WorkflowTariffResponse,
    summary="Update workflow tariff",
    description="Update an existing workflow tariff configuration."
)
async def update_tariff(
    tariff_id: int = Path(..., description="Tariff ID"),
    tariff: WorkflowTariffUpdate = Body(...),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(require_permission("admin:manage_tariffs"))
):
    updates = []
    params = [tariff_id]
    param_idx = 2

    for field, value in tariff.model_dump(exclude_unset=True).items():
        if value is not None:
            # Handle enum fields
            if field == 'tariff_type':
                updates.append(f"{field} = ${param_idx}")
                params.append(value.value if hasattr(value, 'value') else value)
            else:
                updates.append(f"{field} = ${param_idx}")
                params.append(value)
            param_idx += 1

    if not updates:
        row = await db.fetchrow(
            "SELECT * FROM workflow_tariffs WHERE id = $1", tariff_id
        )
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workflow tariff not found"
            )
        return WorkflowTariffResponse(
            id=row['id'],
            workflow_code=row['workflow_code'],
            solicitud_type=row['solicitud_type'],
            tariff_type=row['tariff_type'],
            amount=float(row['amount']) if row['amount'] else 0,
            percentage_rate=float(row['percentage_rate']) if row['percentage_rate'] else None,
            currency=row['currency'],
            legal_reference=row['legal_reference'],
            effective_from=row['effective_from'].isoformat() if row['effective_from'] else None,
            effective_to=row['effective_to'].isoformat() if row['effective_to'] else None,
            is_active=row['is_active']
        )

    query = f"""
        UPDATE workflow_tariffs
        SET {', '.join(updates)}
        WHERE id = $1
        RETURNING *
    """

    row = await db.fetchrow(query, *params)

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow tariff not found"
        )

    return WorkflowTariffResponse(
        id=row['id'],
        workflow_code=row['workflow_code'],
        solicitud_type=row['solicitud_type'],
        tariff_type=row['tariff_type'],
        amount=float(row['amount']) if row['amount'] else 0,
        percentage_rate=float(row['percentage_rate']) if row['percentage_rate'] else None,
        currency=row['currency'],
        legal_reference=row['legal_reference'],
        effective_from=row['effective_from'].isoformat() if row['effective_from'] else None,
        effective_to=row['effective_to'].isoformat() if row['effective_to'] else None,
        is_active=row['is_active']
    )


@router.delete(
    "/tariffs/{tariff_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete workflow tariff",
    description="Delete a workflow tariff configuration."
)
async def delete_tariff(
    tariff_id: int = Path(..., description="Tariff ID"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(require_permission("admin:manage_tariffs"))
):
    result = await db.execute(
        "DELETE FROM workflow_tariffs WHERE id = $1", tariff_id
    )

    if 'DELETE 0' in result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow tariff not found"
        )

    return None


# ═══════════════════════════════════════════════════════════════
# APPOINTMENT SETTINGS
# ═══════════════════════════════════════════════════════════════

@router.get(
    "/appointments/slot-configs",
    response_model=List[AppointmentSlotConfigResponse],
    summary="List appointment slot configurations",
    description="Get all appointment slot configurations by entity."
)
async def list_slot_configs(
    entity_code: Optional[str] = Query(None, description="Filter by entity"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(require_permission("admin:manage_appointments"))
):
    query = "SELECT * FROM appointment_slot_configs WHERE 1=1"
    params = []

    if entity_code:
        params.append(entity_code)
        query += f" AND entity_code = ${len(params)}"

    if is_active is not None:
        params.append(is_active)
        query += f" AND is_active = ${len(params)}"

    query += " ORDER BY entity_code, day_of_week, start_time"

    rows = await db.fetch(query, *params)

    return [
        AppointmentSlotConfigResponse(
            id=str(row['id']),
            entity_code=row['entity_code'],
            day_of_week=row['day_of_week'],
            start_time=str(row['start_time']),
            end_time=str(row['end_time']),
            slot_duration_minutes=row['slot_duration_minutes'],
            max_appointments_per_slot=row['max_appointments_per_slot'],
            location_name=row['location_name'],
            location_address=row['location_address'],
            is_active=row['is_active']
        )
        for row in rows
    ]


@router.post(
    "/appointments/slot-configs",
    response_model=AppointmentSlotConfigResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create appointment slot configuration",
    description="Create a new appointment slot configuration."
)
async def create_slot_config(
    slot: AppointmentSlotConfigCreate = Body(...),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(require_permission("admin:manage_appointments"))
):
    row = await db.fetchrow("""
        INSERT INTO appointment_slot_configs (
            entity_code, day_of_week, start_time, end_time,
            slot_duration_minutes, max_appointments_per_slot,
            location_name, location_address, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
    """, slot.entity_code, slot.day_of_week, slot.start_time, slot.end_time,
        slot.slot_duration_minutes, slot.max_appointments_per_slot,
        slot.location_name, slot.location_address, slot.is_active)

    return AppointmentSlotConfigResponse(
        id=str(row['id']),
        entity_code=row['entity_code'],
        day_of_week=row['day_of_week'],
        start_time=str(row['start_time']),
        end_time=str(row['end_time']),
        slot_duration_minutes=row['slot_duration_minutes'],
        max_appointments_per_slot=row['max_appointments_per_slot'],
        location_name=row['location_name'],
        location_address=row['location_address'],
        is_active=row['is_active']
    )


@router.put(
    "/appointments/slot-configs/{slot_id}",
    response_model=AppointmentSlotConfigResponse,
    summary="Update appointment slot configuration",
    description="Update an existing appointment slot configuration."
)
async def update_slot_config(
    slot_id: str = Path(..., description="Slot config ID (UUID)"),
    slot: AppointmentSlotConfigUpdate = Body(...),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(require_permission("admin:manage_appointments"))
):
    updates = []
    params = [slot_id]
    param_idx = 2

    for field, value in slot.model_dump(exclude_unset=True).items():
        if value is not None:
            updates.append(f"{field} = ${param_idx}")
            params.append(value)
            param_idx += 1

    if not updates:
        row = await db.fetchrow(
            "SELECT * FROM appointment_slot_configs WHERE id = $1::uuid", slot_id
        )
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Slot configuration not found"
            )
        return AppointmentSlotConfigResponse(
            id=str(row['id']),
            entity_code=row['entity_code'],
            day_of_week=row['day_of_week'],
            start_time=str(row['start_time']),
            end_time=str(row['end_time']),
            slot_duration_minutes=row['slot_duration_minutes'],
            max_appointments_per_slot=row['max_appointments_per_slot'],
            location_name=row['location_name'],
            location_address=row['location_address'],
            is_active=row['is_active']
        )

    updates.append("updated_at = NOW()")

    query = f"""
        UPDATE appointment_slot_configs
        SET {', '.join(updates)}
        WHERE id = $1::uuid
        RETURNING *
    """

    row = await db.fetchrow(query, *params)

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Slot configuration not found"
        )

    return AppointmentSlotConfigResponse(
        id=str(row['id']),
        entity_code=row['entity_code'],
        day_of_week=row['day_of_week'],
        start_time=str(row['start_time']),
        end_time=str(row['end_time']),
        slot_duration_minutes=row['slot_duration_minutes'],
        max_appointments_per_slot=row['max_appointments_per_slot'],
        location_name=row['location_name'],
        location_address=row['location_address'],
        is_active=row['is_active']
    )


@router.delete(
    "/appointments/slot-configs/{slot_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete appointment slot configuration",
    description="Delete an appointment slot configuration."
)
async def delete_slot_config(
    slot_id: str = Path(..., description="Slot config ID (UUID)"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(require_permission("admin:manage_appointments"))
):
    result = await db.execute(
        "DELETE FROM appointment_slot_configs WHERE id = $1::uuid", slot_id
    )

    if 'DELETE 0' in result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Slot configuration not found"
        )

    return None


@router.get(
    "/appointments/blocked-dates",
    response_model=List[AppointmentBlockedDateResponse],
    summary="List blocked dates",
    description="Get all blocked appointment dates."
)
async def list_blocked_dates(
    entity_code: Optional[str] = Query(None, description="Filter by entity"),
    from_date: Optional[date] = Query(None, description="From date"),
    to_date: Optional[date] = Query(None, description="To date"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(require_permission("admin:manage_appointments"))
):
    query = "SELECT * FROM appointment_blocked_dates WHERE 1=1"
    params = []

    if entity_code:
        params.append(entity_code)
        query += f" AND (entity_code = ${len(params)} OR entity_code IS NULL)"

    if from_date:
        params.append(from_date)
        query += f" AND blocked_date >= ${len(params)}"

    if to_date:
        params.append(to_date)
        query += f" AND blocked_date <= ${len(params)}"

    query += " ORDER BY blocked_date"

    rows = await db.fetch(query, *params)

    return [
        AppointmentBlockedDateResponse(
            id=str(row['id']),
            entity_code=row['entity_code'],
            blocked_date=row['blocked_date'].isoformat(),
            reason=row['reason'],
            is_recurring=row['is_recurring']
        )
        for row in rows
    ]


@router.post(
    "/appointments/blocked-dates",
    response_model=AppointmentBlockedDateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add blocked date",
    description="Block a date for appointments."
)
async def add_blocked_date(
    blocked: AppointmentBlockedDateCreate = Body(...),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(require_permission("admin:manage_appointments"))
):
    row = await db.fetchrow("""
        INSERT INTO appointment_blocked_dates (entity_code, blocked_date, reason, is_recurring)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (entity_code, blocked_date) DO UPDATE SET reason = $3, is_recurring = $4
        RETURNING *
    """, blocked.entity_code, blocked.blocked_date, blocked.reason, blocked.is_recurring)

    return AppointmentBlockedDateResponse(
        id=str(row['id']),
        entity_code=row['entity_code'],
        blocked_date=row['blocked_date'].isoformat(),
        reason=row['reason'],
        is_recurring=row['is_recurring']
    )


@router.delete(
    "/appointments/blocked-dates/{blocked_date_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove blocked date",
    description="Unblock an appointment date."
)
async def remove_blocked_date(
    blocked_date_id: str = Path(..., description="Blocked date ID (UUID)"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(require_permission("admin:manage_appointments"))
):
    result = await db.execute(
        "DELETE FROM appointment_blocked_dates WHERE id = $1::uuid", blocked_date_id
    )

    if 'DELETE 0' in result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blocked date not found"
        )

    return None


# ═══════════════════════════════════════════════════════════════
# APPOINTMENT DELAY RULES
# ═══════════════════════════════════════════════════════════════

@router.get(
    "/appointments/delay-rules",
    response_model=List[AppointmentDelayRuleResponse],
    summary="List delay rules",
    description="Get all appointment delay rules."
)
async def list_delay_rules(
    workflow_code: Optional[str] = Query(None, description="Filter by workflow"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(require_permission("admin:manage_appointments"))
):
    query = "SELECT * FROM appointment_delay_rules WHERE 1=1"
    params = []

    if workflow_code:
        params.append(workflow_code)
        query += f" AND workflow_code = ${len(params)}"

    query += " ORDER BY workflow_code NULLS FIRST, priority"

    rows = await db.fetch(query, *params)

    return [
        AppointmentDelayRuleResponse(
            id=str(row['id']),
            workflow_code=row['workflow_code'],
            priority=row['priority'],
            delay_business_days=row['delay_business_days'],
            is_active=row['is_active']
        )
        for row in rows
    ]


@router.post(
    "/appointments/delay-rules",
    response_model=AppointmentDelayRuleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create delay rule",
    description="Create a new appointment delay rule."
)
async def create_delay_rule(
    rule: AppointmentDelayRuleCreate = Body(...),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(require_permission("admin:manage_appointments"))
):
    row = await db.fetchrow("""
        INSERT INTO appointment_delay_rules (
            workflow_code, priority, delay_business_days, is_active
        ) VALUES ($1, $2::service_request_priority_enum, $3, $4)
        ON CONFLICT (workflow_code, priority) DO UPDATE SET
            delay_business_days = EXCLUDED.delay_business_days,
            is_active = EXCLUDED.is_active
        RETURNING *
    """, rule.workflow_code, rule.priority, rule.delay_business_days, rule.is_active)

    return AppointmentDelayRuleResponse(
        id=str(row['id']),
        workflow_code=row['workflow_code'],
        priority=row['priority'],
        delay_business_days=row['delay_business_days'],
        is_active=row['is_active']
    )


@router.delete(
    "/appointments/delay-rules/{rule_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete delay rule",
    description="Delete an appointment delay rule."
)
async def delete_delay_rule(
    rule_id: str = Path(..., description="Delay rule ID (UUID)"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(require_permission("admin:manage_appointments"))
):
    result = await db.execute(
        "DELETE FROM appointment_delay_rules WHERE id = $1::uuid", rule_id
    )

    if 'DELETE 0' in result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Delay rule not found"
        )

    return None
