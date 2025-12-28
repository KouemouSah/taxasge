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
from app.modules.permissions.dependencies import require_permission


router = APIRouter(
    prefix="/admin/service-requests",
    tags=["Admin - Service Requests Configuration"]
)


# ═══════════════════════════════════════════════════════════════
# PYDANTIC MODELS
# ═══════════════════════════════════════════════════════════════

class WorkflowCreate(BaseModel):
    """Create a new workflow configuration"""
    code: str = Field(..., pattern=r'^[A-Z][A-Z0-9_]+$', max_length=100)
    name_es: str = Field(..., max_length=255)
    description_es: Optional[str] = None
    category: str = Field(..., max_length=50)
    entity_code: str = Field(..., max_length=50)
    workflow_type: str = Field(default="standard", pattern="^(standard|direct_payment)$")
    requires_agent_validation: bool = True
    requires_appointment: bool = False
    is_generic: bool = True
    appointment_delay_days: Optional[int] = Field(None, ge=0, le=90)
    appointment_entity_code: Optional[str] = None
    sla_hours: int = Field(default=48, ge=1, le=720)
    max_processing_days: Optional[int] = Field(None, ge=1, le=365)
    priority_weight: Decimal = Field(default=Decimal("1.0"), ge=0, le=10)
    is_active: bool = True


class WorkflowUpdate(BaseModel):
    """Update workflow configuration"""
    name_es: Optional[str] = Field(None, max_length=255)
    description_es: Optional[str] = None
    workflow_type: Optional[str] = Field(None, pattern="^(standard|direct_payment)$")
    requires_agent_validation: Optional[bool] = None
    requires_appointment: Optional[bool] = None
    appointment_delay_days: Optional[int] = Field(None, ge=0, le=90)
    appointment_entity_code: Optional[str] = None
    sla_hours: Optional[int] = Field(None, ge=1, le=720)
    max_processing_days: Optional[int] = Field(None, ge=1, le=365)
    priority_weight: Optional[Decimal] = Field(None, ge=0, le=10)
    is_active: Optional[bool] = None


class WorkflowResponse(BaseModel):
    """Workflow response"""
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
    priority_weight: float
    is_active: bool
    documents_count: Optional[int] = None
    tariffs_count: Optional[int] = None


class DocumentRequirementCreate(BaseModel):
    """Create document requirement for workflow"""
    document_code: str = Field(..., max_length=50)
    document_name_es: str = Field(..., max_length=255)
    is_required: bool = True
    display_order: int = Field(default=0, ge=0)
    extraction_schema_key: Optional[str] = None
    instructions_es: Optional[str] = None
    conditions: Optional[Dict[str, Any]] = None


class DocumentRequirementUpdate(BaseModel):
    """Update document requirement"""
    document_name_es: Optional[str] = Field(None, max_length=255)
    is_required: Optional[bool] = None
    display_order: Optional[int] = Field(None, ge=0)
    extraction_schema_key: Optional[str] = None
    instructions_es: Optional[str] = None
    conditions: Optional[Dict[str, Any]] = None


class DocumentRequirementResponse(BaseModel):
    """Document requirement response"""
    id: int
    workflow_code: str
    document_code: str
    document_name_es: str
    is_required: bool
    display_order: int
    extraction_schema_key: Optional[str]
    instructions_es: Optional[str]
    conditions: Optional[Dict[str, Any]]


class TariffConfigCreate(BaseModel):
    """Create tariff configuration"""
    workflow_code: str = Field(..., max_length=100)
    tariff_type: str = Field(..., pattern="^(fixed|percentage|rbc|nota_ingreso)$")
    fixed_amount: Optional[int] = Field(None, ge=0)
    percentage: Optional[Decimal] = Field(None, ge=0, le=100)
    rbc_formula: Optional[str] = None
    rbc_params: Optional[Dict[str, Any]] = None
    description_es: Optional[str] = None
    valid_from: date
    valid_to: Optional[date] = None
    is_active: bool = True


class TariffConfigUpdate(BaseModel):
    """Update tariff configuration"""
    tariff_type: Optional[str] = Field(None, pattern="^(fixed|percentage|rbc|nota_ingreso)$")
    fixed_amount: Optional[int] = Field(None, ge=0)
    percentage: Optional[Decimal] = Field(None, ge=0, le=100)
    rbc_formula: Optional[str] = None
    rbc_params: Optional[Dict[str, Any]] = None
    description_es: Optional[str] = None
    valid_to: Optional[date] = None
    is_active: Optional[bool] = None


class TariffConfigResponse(BaseModel):
    """Tariff configuration response"""
    id: int
    workflow_code: str
    tariff_type: str
    fixed_amount: Optional[int]
    percentage: Optional[float]
    rbc_formula: Optional[str]
    rbc_params: Optional[Dict[str, Any]]
    description_es: Optional[str]
    valid_from: str
    valid_to: Optional[str]
    is_active: bool


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
            (SELECT COUNT(*) FROM tariff_configurations
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

    query += " ORDER BY w.category, w.name_es"

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
            priority_weight=float(row['priority_weight'] or 1.0),
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
            (SELECT COUNT(*) FROM tariff_configurations
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
        priority_weight=float(row['priority_weight'] or 1.0),
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

    row = await db.fetchrow("""
        INSERT INTO workflows (
            code, name_es, description_es, category, entity_code,
            workflow_type, requires_agent_validation, requires_appointment,
            is_generic, appointment_delay_days, appointment_entity_code,
            sla_hours, max_processing_days, priority_weight, is_active,
            created_at, updated_at
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
            NOW(), NOW()
        )
        RETURNING *
    """, workflow.code, workflow.name_es, workflow.description_es,
        workflow.category, workflow.entity_code, workflow.workflow_type,
        workflow.requires_agent_validation, workflow.requires_appointment,
        workflow.is_generic, workflow.appointment_delay_days,
        workflow.appointment_entity_code, workflow.sla_hours,
        workflow.max_processing_days, workflow.priority_weight,
        workflow.is_active)

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
        priority_weight=float(row['priority_weight'] or 1.0),
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
        priority_weight=float(row['priority_weight'] or 1.0),
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
        "DELETE FROM tariff_configurations WHERE workflow_code = $1", code
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
            id=row['id'],
            workflow_code=row['workflow_code'],
            document_code=row['document_code'],
            document_name_es=row['document_name_es'],
            is_required=row['is_required'],
            display_order=row['display_order'],
            extraction_schema_key=row['extraction_schema_key'],
            instructions_es=row['instructions_es'],
            conditions=row['conditions']
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

    row = await db.fetchrow("""
        INSERT INTO workflow_document_requirements (
            workflow_code, document_code, document_name_es,
            is_required, display_order, extraction_schema_key,
            instructions_es, conditions
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
    """, code, doc.document_code, doc.document_name_es,
        doc.is_required, doc.display_order, doc.extraction_schema_key,
        doc.instructions_es, doc.conditions)

    return DocumentRequirementResponse(
        id=row['id'],
        workflow_code=row['workflow_code'],
        document_code=row['document_code'],
        document_name_es=row['document_name_es'],
        is_required=row['is_required'],
        display_order=row['display_order'],
        extraction_schema_key=row['extraction_schema_key'],
        instructions_es=row['instructions_es'],
        conditions=row['conditions']
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
    # Build update query
    updates = []
    params = [code, doc_code]
    param_idx = 3

    for field, value in doc.model_dump(exclude_unset=True).items():
        if value is not None:
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

        return DocumentRequirementResponse(**dict(row))

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
        id=row['id'],
        workflow_code=row['workflow_code'],
        document_code=row['document_code'],
        document_name_es=row['document_name_es'],
        is_required=row['is_required'],
        display_order=row['display_order'],
        extraction_schema_key=row['extraction_schema_key'],
        instructions_es=row['instructions_es'],
        conditions=row['conditions']
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
# TARIFF CONFIGURATIONS
# ═══════════════════════════════════════════════════════════════

@router.get(
    "/tariffs",
    response_model=List[TariffConfigResponse],
    summary="List all tariff configurations",
    description="Get all tariff configurations with optional filtering."
)
async def list_tariffs(
    workflow_code: Optional[str] = Query(None, description="Filter by workflow"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(require_permission("admin:manage_tariffs"))
):
    query = "SELECT * FROM tariff_configurations WHERE 1=1"
    params = []

    if workflow_code:
        params.append(workflow_code)
        query += f" AND workflow_code = ${len(params)}"

    if is_active is not None:
        params.append(is_active)
        query += f" AND is_active = ${len(params)}"

    query += " ORDER BY workflow_code, valid_from DESC"

    rows = await db.fetch(query, *params)

    return [
        TariffConfigResponse(
            id=row['id'],
            workflow_code=row['workflow_code'],
            tariff_type=row['tariff_type'],
            fixed_amount=row['fixed_amount'],
            percentage=float(row['percentage']) if row['percentage'] else None,
            rbc_formula=row['rbc_formula'],
            rbc_params=row['rbc_params'],
            description_es=row['description_es'],
            valid_from=row['valid_from'].isoformat(),
            valid_to=row['valid_to'].isoformat() if row['valid_to'] else None,
            is_active=row['is_active']
        )
        for row in rows
    ]


@router.post(
    "/tariffs",
    response_model=TariffConfigResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create tariff configuration",
    description="Create a new tariff configuration."
)
async def create_tariff(
    tariff: TariffConfigCreate = Body(...),
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
        INSERT INTO tariff_configurations (
            workflow_code, tariff_type, fixed_amount, percentage,
            rbc_formula, rbc_params, description_es, valid_from,
            valid_to, is_active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        RETURNING *
    """, tariff.workflow_code, tariff.tariff_type, tariff.fixed_amount,
        tariff.percentage, tariff.rbc_formula, tariff.rbc_params,
        tariff.description_es, tariff.valid_from, tariff.valid_to,
        tariff.is_active)

    return TariffConfigResponse(
        id=row['id'],
        workflow_code=row['workflow_code'],
        tariff_type=row['tariff_type'],
        fixed_amount=row['fixed_amount'],
        percentage=float(row['percentage']) if row['percentage'] else None,
        rbc_formula=row['rbc_formula'],
        rbc_params=row['rbc_params'],
        description_es=row['description_es'],
        valid_from=row['valid_from'].isoformat(),
        valid_to=row['valid_to'].isoformat() if row['valid_to'] else None,
        is_active=row['is_active']
    )


@router.put(
    "/tariffs/{tariff_id}",
    response_model=TariffConfigResponse,
    summary="Update tariff configuration",
    description="Update an existing tariff configuration."
)
async def update_tariff(
    tariff_id: int = Path(..., description="Tariff configuration ID"),
    tariff: TariffConfigUpdate = Body(...),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(require_permission("admin:manage_tariffs"))
):
    updates = []
    params = [tariff_id]
    param_idx = 2

    for field, value in tariff.model_dump(exclude_unset=True).items():
        if value is not None:
            updates.append(f"{field} = ${param_idx}")
            params.append(value)
            param_idx += 1

    if not updates:
        row = await db.fetchrow(
            "SELECT * FROM tariff_configurations WHERE id = $1", tariff_id
        )
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tariff configuration not found"
            )
        return TariffConfigResponse(
            id=row['id'],
            workflow_code=row['workflow_code'],
            tariff_type=row['tariff_type'],
            fixed_amount=row['fixed_amount'],
            percentage=float(row['percentage']) if row['percentage'] else None,
            rbc_formula=row['rbc_formula'],
            rbc_params=row['rbc_params'],
            description_es=row['description_es'],
            valid_from=row['valid_from'].isoformat(),
            valid_to=row['valid_to'].isoformat() if row['valid_to'] else None,
            is_active=row['is_active']
        )

    updates.append("updated_at = NOW()")

    query = f"""
        UPDATE tariff_configurations
        SET {', '.join(updates)}
        WHERE id = $1
        RETURNING *
    """

    row = await db.fetchrow(query, *params)

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tariff configuration not found"
        )

    return TariffConfigResponse(
        id=row['id'],
        workflow_code=row['workflow_code'],
        tariff_type=row['tariff_type'],
        fixed_amount=row['fixed_amount'],
        percentage=float(row['percentage']) if row['percentage'] else None,
        rbc_formula=row['rbc_formula'],
        rbc_params=row['rbc_params'],
        description_es=row['description_es'],
        valid_from=row['valid_from'].isoformat(),
        valid_to=row['valid_to'].isoformat() if row['valid_to'] else None,
        is_active=row['is_active']
    )


@router.delete(
    "/tariffs/{tariff_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete tariff configuration",
    description="Delete a tariff configuration."
)
async def delete_tariff(
    tariff_id: int = Path(..., description="Tariff configuration ID"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(require_permission("admin:manage_tariffs"))
):
    result = await db.execute(
        "DELETE FROM tariff_configurations WHERE id = $1", tariff_id
    )

    if 'DELETE 0' in result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tariff configuration not found"
        )

    return None


# ═══════════════════════════════════════════════════════════════
# APPOINTMENT SETTINGS
# ═══════════════════════════════════════════════════════════════

@router.get(
    "/appointments/slot-configs",
    summary="List appointment slot configurations",
    description="Get all appointment slot configurations by entity."
)
async def list_slot_configs(
    entity_code: Optional[str] = Query(None, description="Filter by entity"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(require_permission("admin:manage_appointments"))
):
    query = "SELECT * FROM appointment_slot_configs WHERE 1=1"
    params = []

    if entity_code:
        params.append(entity_code)
        query += f" AND entity_code = ${len(params)}"

    query += " ORDER BY entity_code, day_of_week"

    rows = await db.fetch(query, *params)

    return [dict(row) for row in rows]


@router.get(
    "/appointments/blocked-dates",
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
        query += f" AND entity_code = ${len(params)}"

    if from_date:
        params.append(from_date)
        query += f" AND blocked_date >= ${len(params)}"

    if to_date:
        params.append(to_date)
        query += f" AND blocked_date <= ${len(params)}"

    query += " ORDER BY blocked_date"

    rows = await db.fetch(query, *params)

    return [
        {
            "id": row['id'],
            "entity_code": row['entity_code'],
            "blocked_date": row['blocked_date'].isoformat(),
            "reason": row['reason']
        }
        for row in rows
    ]


@router.post(
    "/appointments/blocked-dates",
    status_code=status.HTTP_201_CREATED,
    summary="Add blocked date",
    description="Block a date for appointments."
)
async def add_blocked_date(
    entity_code: str = Body(..., embed=True),
    blocked_date: date = Body(..., embed=True),
    reason: Optional[str] = Body(None, embed=True),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(require_permission("admin:manage_appointments"))
):
    row = await db.fetchrow("""
        INSERT INTO appointment_blocked_dates (entity_code, blocked_date, reason)
        VALUES ($1, $2, $3)
        ON CONFLICT (entity_code, blocked_date) DO UPDATE SET reason = $3
        RETURNING *
    """, entity_code, blocked_date, reason)

    return {
        "id": row['id'],
        "entity_code": row['entity_code'],
        "blocked_date": row['blocked_date'].isoformat(),
        "reason": row['reason']
    }


@router.delete(
    "/appointments/blocked-dates/{blocked_date_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove blocked date",
    description="Unblock an appointment date."
)
async def remove_blocked_date(
    blocked_date_id: int = Path(..., description="Blocked date ID"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(require_permission("admin:manage_appointments"))
):
    result = await db.execute(
        "DELETE FROM appointment_blocked_dates WHERE id = $1", blocked_date_id
    )

    if 'DELETE 0' in result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blocked date not found"
        )

    return None
