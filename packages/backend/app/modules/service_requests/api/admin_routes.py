"""
Admin Routes for Service Requests Configuration.

RESTful endpoints for administrators to manage:
- Workflows (CRUD)
- Workflow Document Requirements
- Tariff Configurations
- Appointment Settings
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path, Body, BackgroundTasks
from typing import List, Optional, Dict, Any
import asyncpg
import json
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator

from app.database.connection import get_database
from app.modules.auth.middleware.auth_middleware import get_current_user
from app.modules.permissions.middleware.permission_middleware import permission_required
from app.core.events import EventBus, EventType


router = APIRouter(
    prefix="/admin/service-requests",
    tags=["Admin - Service Requests Configuration"]
)

def _parse_config(config_value):
    """Parse config JSONB field - handles both string and dict."""
    if config_value is None:
        return {}
    if isinstance(config_value, dict):
        return config_value
    if isinstance(config_value, str):
        try:
            return json.loads(config_value)
        except (json.JSONDecodeError, TypeError):
            return {}
    return {}




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
    # Hierarchical grouping fields (migration 049)
    parent_workflow_code: Optional[str] = Field(None, max_length=50, description="Parent workflow for UI grouping")
    tags: Optional[List[str]] = Field(default_factory=list, description="Tags for sub-categorization")
    is_parent: bool = Field(default=False, description="True = category header workflow")


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
    # Hierarchical grouping fields (migration 049)
    parent_workflow_code: Optional[str] = Field(None, max_length=50)
    tags: Optional[List[str]] = None
    is_parent: Optional[bool] = None


class WorkflowSourceType(str, Enum):
    """
    Type de source du workflow.
    - predefined: Workflow avec classe Python hardcodée (ex: PasaporteWorkflow)
    - dynamic: Workflow créé en BD, utilise GenericWorkflow
    """
    PREDEFINED = "predefined"
    DYNAMIC = "dynamic"


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
    # Hierarchical grouping fields (migration 049)
    parent_workflow_code: Optional[str] = None
    tags: List[str] = []
    is_parent: bool = False
    # Computed fields (not in DB)
    documents_count: Optional[int] = None
    tariffs_count: Optional[int] = None
    # Source type: predefined (Python class) or dynamic (DB only)
    source_type: WorkflowSourceType = WorkflowSourceType.PREDEFINED

    @classmethod
    def from_row(cls, row: dict, documents_count: int = 0, tariffs_count: int = 0) -> "WorkflowResponse":
        """Create WorkflowResponse from DB row with computed source_type"""
        # Parse tags from JSONB (can be list or string)
        tags_value = row.get('tags')
        if isinstance(tags_value, list):
            tags = tags_value
        elif isinstance(tags_value, str):
            import json
            try:
                tags = json.loads(tags_value)
            except (json.JSONDecodeError, TypeError):
                tags = []
        else:
            tags = []

        return cls(
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
            config=_parse_config(row.get('config')),
            is_active=row['is_active'],
            parent_workflow_code=row.get('parent_workflow_code'),
            tags=tags,
            is_parent=row.get('is_parent', False) or False,
            documents_count=documents_count,
            tariffs_count=tariffs_count,
            source_type=WorkflowSourceType.DYNAMIC if row['is_generic'] else WorkflowSourceType.PREDEFINED,
        )


# ─────────────────────────────────────────────────────────────────
# WORKFLOW_DOCUMENT_REQUIREMENTS (table: workflow_document_requirements)
# ─────────────────────────────────────────────────────────────────

from enum import Enum

class DocumentConditionType(str, Enum):
    """
    Document condition type enum - matches DB enum document_condition_type_enum.
    See DATABASE_SCHEMA_REFERENCE.md for full list.
    """
    ALWAYS = "always"
    AGE_LESS_THAN = "age_less_than"
    AGE_GREATER_THAN = "age_greater_than"
    IS_RENEWAL = "is_renewal"
    IS_NEW = "is_new"
    IS_DUPLICATE = "is_duplicate"
    HAS_PREVIOUS = "has_previous"
    IS_MINOR = "is_minor"
    IS_ADULT = "is_adult"
    IS_FOREIGN = "is_foreign"
    IS_NATIONAL = "is_national"
    CUSTOM = "custom"


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
from pydantic import field_validator


def parse_time_string(value: str) -> Time:
    """Parse time string in formats: HH:MM, HH:MM:SS, or HH:MM AM/PM"""
    if isinstance(value, Time):
        return value
    if not isinstance(value, str):
        raise ValueError(f"Invalid time format: {value}")

    value = value.strip()

    # Handle AM/PM format (e.g., "08:00 AM", "04:00 PM")
    is_pm = False
    if value.upper().endswith(' AM'):
        value = value[:-3].strip()
    elif value.upper().endswith(' PM'):
        value = value[:-3].strip()
        is_pm = True

    parts = value.split(':')
    if len(parts) == 2:
        hour, minute = int(parts[0]), int(parts[1])
        second = 0
    elif len(parts) == 3:
        hour, minute, second = int(parts[0]), int(parts[1]), int(parts[2])
    else:
        raise ValueError(f"Invalid time format: {value}")

    # Convert PM to 24-hour
    if is_pm and hour < 12:
        hour += 12
    elif not is_pm and hour == 12:
        hour = 0

    return Time(hour, minute, second)


class AppointmentSlotConfigCreate(BaseModel):
    """Create appointment slot config - aligned with migration 030 (entity_locations)"""
    entity_location_id: str = Field(..., description="FK to entity_locations table")
    day_of_week: int = Field(..., ge=0, le=6, description="0=Monday, 6=Sunday")
    start_time: str = Field(..., description="Start time in HH:MM format")
    end_time: str = Field(..., description="End time in HH:MM format")
    slot_duration_minutes: int = Field(default=30, ge=5, le=120)
    max_appointments_per_slot: int = Field(default=10, ge=1, le=100)
    is_active: bool = True
    # Note: entity_code, location_name, location_address are resolved from entity_locations FK

    @field_validator('start_time', 'end_time', mode='before')
    @classmethod
    def validate_time(cls, v):
        """Accept time as string and validate format"""
        if isinstance(v, Time):
            return v.strftime('%H:%M:%S')
        if isinstance(v, str):
            # Validate by parsing, then return normalized format
            t = parse_time_string(v)
            return t.strftime('%H:%M:%S')
        raise ValueError(f"Invalid time: {v}")


class AppointmentSlotConfigUpdate(BaseModel):
    """Update appointment slot config"""
    entity_location_id: Optional[str] = Field(None, description="FK to entity_locations table")
    start_time: Optional[str] = Field(None, description="Start time in HH:MM format")
    end_time: Optional[str] = Field(None, description="End time in HH:MM format")
    slot_duration_minutes: Optional[int] = Field(None, ge=5, le=120)
    max_appointments_per_slot: Optional[int] = Field(None, ge=1, le=100)
    is_active: Optional[bool] = None

    @field_validator('start_time', 'end_time', mode='before')
    @classmethod
    def validate_time(cls, v):
        """Accept time as string and validate format"""
        if v is None:
            return None
        if isinstance(v, Time):
            return v.strftime('%H:%M:%S')
        if isinstance(v, str):
            # Validate by parsing, then return normalized format
            t = parse_time_string(v)
            return t.strftime('%H:%M:%S')
        raise ValueError(f"Invalid time: {v}")


class AppointmentSlotConfigResponse(BaseModel):
    """Appointment slot config response - aligned with migration 030 schema"""
    id: str  # UUID
    entity_location_id: Optional[str] = None  # FK to entity_locations
    entity_code: str
    day_of_week: int
    start_time: str
    end_time: str
    slot_duration_minutes: int
    max_appointments_per_slot: int
    is_active: bool
    # Note: location_name/location_address removed in migration 030
    # Get from entity_locations table via entity_location_id FK


class AppointmentSlotConfigBatchCreate(BaseModel):
    """Batch create appointment slot configs - for multiple days at once"""
    entity_location_id: str = Field(..., description="FK to entity_locations table")
    days_of_week: List[int] = Field(..., min_length=1, max_length=7, description="List of days (0=Monday, 6=Sunday)")
    start_time: str = Field(..., description="Start time in HH:MM format")
    end_time: str = Field(..., description="End time in HH:MM format")
    slot_duration_minutes: int = Field(default=30, ge=5, le=120)
    max_appointments_per_slot: int = Field(default=10, ge=1, le=100)
    is_active: bool = True

    @field_validator('days_of_week')
    @classmethod
    def validate_days(cls, v):
        """Validate each day is between 0-6 and unique"""
        if not all(0 <= d <= 6 for d in v):
            raise ValueError("Each day must be between 0 (Monday) and 6 (Sunday)")
        if len(v) != len(set(v)):
            raise ValueError("Days must be unique")
        return sorted(v)

    @field_validator('start_time', 'end_time', mode='before')
    @classmethod
    def validate_time(cls, v):
        """Accept time as string and validate format"""
        if isinstance(v, Time):
            return v.strftime('%H:%M:%S')
        if isinstance(v, str):
            t = parse_time_string(v)
            return t.strftime('%H:%M:%S')
        raise ValueError(f"Invalid time: {v}")


class AppointmentSlotConfigBatchResponse(BaseModel):
    """Response for batch slot creation"""
    created: List[AppointmentSlotConfigResponse]
    skipped: List[dict] = []  # Days that were skipped (already exist)
    total_created: int
    total_skipped: int


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


class AppointmentBlockedDateUpdate(BaseModel):
    """Update blocked date"""
    reason: Optional[str] = Field(None, max_length=255)
    is_recurring: Optional[bool] = None


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


class AppointmentDelayRuleUpdate(BaseModel):
    """Update delay rule"""
    delay_business_days: Optional[int] = Field(None, ge=0, le=30)
    is_active: Optional[bool] = None


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
    _=Depends(permission_required("admin:manage_workflows"))
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

    results = []
    for row in rows:
        row_dict = dict(row)
        row_dict['config'] = _parse_config(row['config'])
        results.append(WorkflowResponse.from_row(
            row_dict,
            documents_count=row['documents_count'],
            tariffs_count=row['tariffs_count']
        ))
    return results


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
    _=Depends(permission_required("admin:manage_workflows"))
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

    row_dict = dict(row)
    row_dict['config'] = _parse_config(row['config'])
    return WorkflowResponse.from_row(
        row_dict,
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
    _=Depends(permission_required("admin:manage_workflows"))
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
    tags_json = json.dumps(workflow.tags) if workflow.tags else '[]'

    row = await db.fetchrow("""
        INSERT INTO workflows (
            code, name_es, description_es, category, entity_code,
            workflow_type, requires_agent_validation, requires_appointment,
            is_generic, appointment_delay_days, appointment_entity_code,
            sla_hours, max_processing_days, display_order, icon, color,
            config, is_active, parent_workflow_code, tags, is_parent,
            created_at, updated_at
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
            $17::jsonb, $18, $19, $20::jsonb, $21, NOW(), NOW()
        )
        RETURNING *
    """, workflow.code, workflow.name_es, workflow.description_es,
        workflow.category, workflow.entity_code, workflow.workflow_type,
        workflow.requires_agent_validation, workflow.requires_appointment,
        workflow.is_generic, workflow.appointment_delay_days,
        workflow.appointment_entity_code, workflow.sla_hours,
        workflow.max_processing_days, workflow.display_order,
        workflow.icon, workflow.color, config_json, workflow.is_active,
        workflow.parent_workflow_code, tags_json, workflow.is_parent)

    return WorkflowResponse.from_row(row)


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
    _=Depends(permission_required("admin:manage_workflows"))
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

    return WorkflowResponse.from_row(row)


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
    _=Depends(permission_required("admin:manage_workflows"))
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
    _=Depends(permission_required("admin:manage_workflows"))
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
    _=Depends(permission_required("admin:manage_workflows"))
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
    _=Depends(permission_required("admin:manage_workflows"))
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
    _=Depends(permission_required("admin:manage_workflows"))
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
    _=Depends(permission_required("admin:manage_workflows"))
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
    _=Depends(permission_required("admin:manage_workflows"))
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
    _=Depends(permission_required("admin:manage_tariffs"))
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
    _=Depends(permission_required("admin:manage_tariffs"))
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
    _=Depends(permission_required("admin:manage_tariffs"))
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
    _=Depends(permission_required("admin:manage_tariffs"))
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
    description="Get all appointment slot configurations by entity or location."
)
async def list_slot_configs(
    entity_code: Optional[str] = Query(None, description="Filter by entity code"),
    entity_location_id: Optional[str] = Query(None, description="Filter by entity location ID"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("admin:manage_appointments"))
):
    query = "SELECT * FROM appointment_slot_configs WHERE 1=1"
    params = []

    if entity_location_id:
        params.append(entity_location_id)
        query += f" AND entity_location_id = ${len(params)}::uuid"

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
            entity_location_id=str(row['entity_location_id']) if row.get('entity_location_id') else None,
            entity_code=row['entity_code'],
            day_of_week=row['day_of_week'],
            start_time=str(row['start_time']),
            end_time=str(row['end_time']),
            slot_duration_minutes=row['slot_duration_minutes'],
            max_appointments_per_slot=row['max_appointments_per_slot'],
            is_active=row['is_active']
        )
        for row in rows
    ]


@router.post(
    "/appointments/slot-configs",
    response_model=AppointmentSlotConfigResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create appointment slot configuration",
    description="Create a new appointment slot configuration using entity_location_id."
)
async def create_slot_config(
    slot: AppointmentSlotConfigCreate = Body(...),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("admin:manage_appointments"))
):
    from loguru import logger

    try:
        # Parse time strings to datetime.time objects for database
        start_time_obj = parse_time_string(slot.start_time)
        end_time_obj = parse_time_string(slot.end_time)

        # 1. Fetch entity_location to resolve entity_code, location_name, location_address
        location = await db.fetchrow("""
            SELECT id, entity_code, location_name, location_address
            FROM entity_locations
            WHERE id = $1::uuid AND is_active = TRUE
        """, slot.entity_location_id)

        if not location:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Entity location not found or inactive: {slot.entity_location_id}"
            )

        # 2. Check for duplicate (same location + day + start_time)
        existing = await db.fetchrow("""
            SELECT id FROM appointment_slot_configs
            WHERE entity_location_id = $1::uuid AND day_of_week = $2 AND start_time = $3::time
        """, slot.entity_location_id, slot.day_of_week, start_time_obj)

        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Slot configuration already exists for this location, day, and start time"
            )

        # 3. Insert the slot config (location_name/location_address removed in migration 030)
        row = await db.fetchrow("""
            INSERT INTO appointment_slot_configs (
                entity_location_id, entity_code, day_of_week, start_time, end_time,
                slot_duration_minutes, max_appointments_per_slot, is_active
            ) VALUES ($1::uuid, $2, $3, $4::time, $5::time, $6, $7, $8)
            RETURNING *
        """,
            slot.entity_location_id,
            location['entity_code'],
            slot.day_of_week,
            start_time_obj,
            end_time_obj,
            slot.slot_duration_minutes,
            slot.max_appointments_per_slot,
            slot.is_active
        )

        logger.info(f"Created slot config: {row['id']} for {location['entity_code']} day={slot.day_of_week}")

        return AppointmentSlotConfigResponse(
            id=str(row['id']),
            entity_location_id=str(row['entity_location_id']) if row.get('entity_location_id') else None,
            entity_code=row['entity_code'],
            day_of_week=row['day_of_week'],
            start_time=str(row['start_time']),
            end_time=str(row['end_time']),
            slot_duration_minutes=row['slot_duration_minutes'],
            max_appointments_per_slot=row['max_appointments_per_slot'],
            is_active=row['is_active']
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating slot config: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create slot configuration: {str(e)}"
        )


@router.post(
    "/appointments/slot-configs/batch",
    response_model=AppointmentSlotConfigBatchResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Batch create appointment slot configurations",
    description="Create multiple appointment slot configurations for different days in a single request."
)
async def create_slot_configs_batch(
    batch: AppointmentSlotConfigBatchCreate = Body(...),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("admin:manage_appointments"))
):
    """
    Create slot configurations for multiple days at once.

    This is more efficient than creating slots one by one when you want
    the same schedule for multiple days (e.g., Monday-Friday).

    Slots that already exist will be skipped (not cause an error).
    """
    from loguru import logger

    try:
        # Parse time strings
        start_time_obj = parse_time_string(batch.start_time)
        end_time_obj = parse_time_string(batch.end_time)

        # 1. Fetch entity_location
        location = await db.fetchrow("""
            SELECT id, entity_code, location_name, location_address
            FROM entity_locations
            WHERE id = $1::uuid AND is_active = TRUE
        """, batch.entity_location_id)

        if not location:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Entity location not found or inactive: {batch.entity_location_id}"
            )

        created = []
        skipped = []

        # 2. Create slot for each day
        for day in batch.days_of_week:
            # Check if already exists
            existing = await db.fetchrow("""
                SELECT id FROM appointment_slot_configs
                WHERE entity_location_id = $1::uuid AND day_of_week = $2 AND start_time = $3::time
            """, batch.entity_location_id, day, start_time_obj)

            if existing:
                skipped.append({
                    "day_of_week": day,
                    "reason": "already_exists",
                    "existing_id": str(existing['id'])
                })
                continue

            # Insert
            row = await db.fetchrow("""
                INSERT INTO appointment_slot_configs (
                    entity_location_id, entity_code, day_of_week, start_time, end_time,
                    slot_duration_minutes, max_appointments_per_slot, is_active
                ) VALUES ($1::uuid, $2, $3, $4::time, $5::time, $6, $7, $8)
                RETURNING *
            """,
                batch.entity_location_id,
                location['entity_code'],
                day,
                start_time_obj,
                end_time_obj,
                batch.slot_duration_minutes,
                batch.max_appointments_per_slot,
                batch.is_active
            )

            created.append(AppointmentSlotConfigResponse(
                id=str(row['id']),
                entity_location_id=str(row['entity_location_id']) if row.get('entity_location_id') else None,
                entity_code=row['entity_code'],
                day_of_week=row['day_of_week'],
                start_time=str(row['start_time']),
                end_time=str(row['end_time']),
                slot_duration_minutes=row['slot_duration_minutes'],
                max_appointments_per_slot=row['max_appointments_per_slot'],
                is_active=row['is_active']
            ))

        logger.info(
            f"Batch created {len(created)} slot configs for {location['entity_code']}, "
            f"skipped {len(skipped)} (already exist)"
        )

        return AppointmentSlotConfigBatchResponse(
            created=created,
            skipped=skipped,
            total_created=len(created),
            total_skipped=len(skipped)
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in batch slot config creation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create slot configurations: {str(e)}"
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
    _=Depends(permission_required("admin:manage_appointments"))
):
    updates = []
    params = [slot_id]
    param_idx = 2

    # Handle entity_location_id change - need to also update entity_code, location_name, location_address
    slot_data = slot.model_dump(exclude_unset=True)
    if 'entity_location_id' in slot_data and slot_data['entity_location_id']:
        # Fetch the new location data
        new_location = await db.fetchrow("""
            SELECT id, entity_code, location_name, location_address
            FROM entity_locations
            WHERE id = $1::uuid AND is_active = TRUE
        """, slot_data['entity_location_id'])

        if not new_location:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Entity location not found or inactive: {slot_data['entity_location_id']}"
            )

        # Add entity_location_id update
        updates.append(f"entity_location_id = ${param_idx}::uuid")
        params.append(slot_data['entity_location_id'])
        param_idx += 1

        # Also update entity_code (location_name/location_address removed in migration 030)
        updates.append(f"entity_code = ${param_idx}")
        params.append(new_location['entity_code'])
        param_idx += 1

    # Handle other fields
    for field, value in slot_data.items():
        if field != 'entity_location_id' and value is not None:
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
            entity_location_id=str(row['entity_location_id']) if row.get('entity_location_id') else None,
            entity_code=row['entity_code'],
            day_of_week=row['day_of_week'],
            start_time=str(row['start_time']),
            end_time=str(row['end_time']),
            slot_duration_minutes=row['slot_duration_minutes'],
            max_appointments_per_slot=row['max_appointments_per_slot'],
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
        entity_location_id=str(row['entity_location_id']) if row.get('entity_location_id') else None,
        entity_code=row['entity_code'],
        day_of_week=row['day_of_week'],
        start_time=str(row['start_time']),
        end_time=str(row['end_time']),
        slot_duration_minutes=row['slot_duration_minutes'],
        max_appointments_per_slot=row['max_appointments_per_slot'],
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
    _=Depends(permission_required("admin:manage_appointments"))
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
    _=Depends(permission_required("admin:manage_appointments"))
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
    _=Depends(permission_required("admin:manage_appointments"))
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


@router.put(
    "/appointments/blocked-dates/{blocked_date_id}",
    response_model=AppointmentBlockedDateResponse,
    summary="Update blocked date",
    description="Update a blocked appointment date."
)
async def update_blocked_date(
    blocked_date_id: str = Path(..., description="Blocked date ID (UUID)"),
    data: AppointmentBlockedDateUpdate = Body(...),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("admin:manage_appointments"))
):
    # Build update query dynamically
    updates = []
    params = [blocked_date_id]

    if data.reason is not None:
        params.append(data.reason)
        updates.append(f"reason = ${len(params)}")

    if data.is_recurring is not None:
        params.append(data.is_recurring)
        updates.append(f"is_recurring = ${len(params)}")

    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )

    query = f"""
        UPDATE appointment_blocked_dates
        SET {', '.join(updates)}
        WHERE id = $1::uuid
        RETURNING *
    """

    row = await db.fetchrow(query, *params)

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blocked date not found"
        )

    return AppointmentBlockedDateResponse(
        id=str(row['id']),
        entity_code=row['entity_code'],
        blocked_date=str(row['blocked_date']),
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
    _=Depends(permission_required("admin:manage_appointments"))
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
    _=Depends(permission_required("admin:manage_appointments"))
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
    _=Depends(permission_required("admin:manage_appointments"))
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


@router.put(
    "/appointments/delay-rules/{rule_id}",
    response_model=AppointmentDelayRuleResponse,
    summary="Update delay rule",
    description="Update an appointment delay rule."
)
async def update_delay_rule(
    rule_id: str = Path(..., description="Delay rule ID (UUID)"),
    data: AppointmentDelayRuleUpdate = Body(...),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("admin:manage_appointments"))
):
    # Build update query dynamically
    updates = []
    params = [rule_id]

    if data.delay_business_days is not None:
        params.append(data.delay_business_days)
        updates.append(f"delay_business_days = ${len(params)}")

    if data.is_active is not None:
        params.append(data.is_active)
        updates.append(f"is_active = ${len(params)}")

    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )

    query = f"""
        UPDATE appointment_delay_rules
        SET {', '.join(updates)}
        WHERE id = $1::uuid
        RETURNING *
    """

    row = await db.fetchrow(query, *params)

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Delay rule not found"
        )

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
    _=Depends(permission_required("admin:manage_appointments"))
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


# =============================================================================
# TARIFF SUPPLEMENTS MANAGEMENT
# =============================================================================

class TariffSupplementCreate(BaseModel):
    """Create a new tariff supplement"""
    code: str = Field(..., min_length=1, max_length=50, pattern=r'^[A-Z][A-Z0-9_]*$')
    name_es: str = Field(..., min_length=1, max_length=255)
    amount: float = Field(..., gt=0)
    currency: str = Field(default="XAF", max_length=3)
    legal_reference: Optional[str] = Field(None, max_length=255)
    effective_from: Optional[str] = Field(None, description="Date in YYYY-MM-DD format")
    effective_to: Optional[str] = Field(None, description="Date in YYYY-MM-DD format")
    is_active: bool = Field(default=True)


class TariffSupplementUpdate(BaseModel):
    """Update an existing tariff supplement"""
    name_es: Optional[str] = Field(None, min_length=1, max_length=255)
    amount: Optional[float] = Field(None, gt=0)
    currency: Optional[str] = Field(None, max_length=3)
    legal_reference: Optional[str] = Field(None, max_length=255)
    effective_from: Optional[str] = Field(None, description="Date in YYYY-MM-DD format")
    effective_to: Optional[str] = Field(None, description="Date in YYYY-MM-DD format")
    is_active: Optional[bool] = None


class TariffSupplementResponse(BaseModel):
    """Response model for tariff supplement"""
    id: int
    code: str
    name_es: str
    amount: float
    currency: str
    legal_reference: Optional[str]
    effective_from: str
    effective_to: Optional[str]
    is_active: bool
    created_at: Optional[str]
    updated_at: Optional[str]


class WorkflowSupplementConfigCreate(BaseModel):
    """Add supplement to a workflow"""
    supplement_code: str = Field(..., min_length=1, max_length=50)
    quantity_per_request: int = Field(default=1, ge=1, le=100)
    is_required: bool = Field(default=True)
    is_active: bool = Field(default=True)


class WorkflowSupplementConfigUpdate(BaseModel):
    """Update workflow supplement configuration"""
    quantity_per_request: Optional[int] = Field(None, ge=1, le=100)
    is_required: Optional[bool] = None
    is_active: Optional[bool] = None


class WorkflowSupplementConfigResponse(BaseModel):
    """Response model for workflow supplement configuration"""
    id: int
    workflow_code: str
    supplement_code: str
    supplement_name: Optional[str] = None
    supplement_amount: Optional[float] = None
    quantity_per_request: int
    is_required: bool
    is_active: bool
    created_at: Optional[str]
    updated_at: Optional[str]


@router.get(
    "/supplements",
    response_model=List[TariffSupplementResponse],
    summary="List all tariff supplements",
    description="Get all configured tariff supplements (cédulas, pólizas, timbres, etc.)"
)
async def list_supplements(
    active_only: bool = Query(False, description="Filter active supplements only"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("admin:manage_tariffs"))
):
    where_clause = "WHERE is_active = true" if active_only else ""
    query = f"""
        SELECT id, code, name_es, amount, currency, legal_reference,
               effective_from::text, effective_to::text, is_active,
               created_at::text, updated_at::text
        FROM tariff_supplements
        {where_clause}
        ORDER BY code
    """
    rows = await db.fetch(query)
    return [TariffSupplementResponse(**dict(row)) for row in rows]


@router.get(
    "/supplements/{code}",
    response_model=TariffSupplementResponse,
    summary="Get a single tariff supplement",
    description="Get details of a specific tariff supplement by code."
)
async def get_supplement(
    code: str = Path(..., description="Supplement code"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("admin:manage_tariffs"))
):
    query = """
        SELECT id, code, name_es, amount, currency, legal_reference,
               effective_from::text, effective_to::text, is_active,
               created_at::text, updated_at::text
        FROM tariff_supplements
        WHERE code = $1
    """
    row = await db.fetchrow(query, code)
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Supplement with code '{code}' not found"
        )
    return TariffSupplementResponse(**dict(row))


@router.post(
    "/supplements",
    response_model=TariffSupplementResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a tariff supplement",
    description="Create a new tariff supplement configuration."
)
async def create_supplement(
    data: TariffSupplementCreate,
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("admin:manage_tariffs"))
):
    # Check if code already exists
    existing = await db.fetchrow(
        "SELECT code FROM tariff_supplements WHERE code = $1", data.code
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Supplement with code '{data.code}' already exists"
        )

    query = """
        INSERT INTO tariff_supplements (
            code, name_es, amount, currency, legal_reference,
            effective_from, effective_to, is_active, created_by
        )
        VALUES ($1, $2, $3, $4, $5, COALESCE($6::date, CURRENT_DATE), $7::date, $8, $9)
        RETURNING id, code, name_es, amount, currency, legal_reference,
                  effective_from::text, effective_to::text, is_active,
                  created_at::text, updated_at::text
    """
    row = await db.fetchrow(
        query,
        data.code,
        data.name_es,
        data.amount,
        data.currency,
        data.legal_reference,
        data.effective_from,
        data.effective_to,
        data.is_active,
        current_user.get("id")
    )
    return TariffSupplementResponse(**dict(row))


@router.put(
    "/supplements/{code}",
    response_model=TariffSupplementResponse,
    summary="Update a tariff supplement",
    description="Update an existing tariff supplement."
)
async def update_supplement(
    code: str = Path(..., description="Supplement code"),
    data: TariffSupplementUpdate = None,
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("admin:manage_tariffs"))
):
    # Build dynamic update query
    params = [code]
    updates = []

    if data.name_es is not None:
        params.append(data.name_es)
        updates.append(f"name_es = ${len(params)}")

    if data.amount is not None:
        params.append(data.amount)
        updates.append(f"amount = ${len(params)}")

    if data.currency is not None:
        params.append(data.currency)
        updates.append(f"currency = ${len(params)}")

    if data.legal_reference is not None:
        params.append(data.legal_reference if data.legal_reference else None)
        updates.append(f"legal_reference = ${len(params)}")

    if data.effective_from is not None:
        params.append(data.effective_from)
        updates.append(f"effective_from = ${len(params)}::date")

    if data.effective_to is not None:
        params.append(data.effective_to if data.effective_to else None)
        updates.append(f"effective_to = ${len(params)}::date")

    if data.is_active is not None:
        params.append(data.is_active)
        updates.append(f"is_active = ${len(params)}")

    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )

    # Add updated_by and updated_at
    params.append(current_user.get("id"))
    updates.append(f"updated_by = ${len(params)}")
    updates.append("updated_at = now()")

    query = f"""
        UPDATE tariff_supplements
        SET {', '.join(updates)}
        WHERE code = $1
        RETURNING id, code, name_es, amount, currency, legal_reference,
                  effective_from::text, effective_to::text, is_active,
                  created_at::text, updated_at::text
    """
    row = await db.fetchrow(query, *params)

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Supplement with code '{code}' not found"
        )

    return TariffSupplementResponse(**dict(row))


@router.delete(
    "/supplements/{code}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a tariff supplement",
    description="Delete a tariff supplement. Will fail if supplement is used in workflows."
)
async def delete_supplement(
    code: str = Path(..., description="Supplement code"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("admin:manage_tariffs"))
):
    # Check if supplement is used in any workflow config
    usage = await db.fetchrow(
        "SELECT COUNT(*) as count FROM workflow_supplement_config WHERE supplement_code = $1",
        code
    )
    if usage and usage['count'] > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot delete supplement '{code}': it is used in {usage['count']} workflow(s). Remove from workflows first."
        )

    result = await db.execute(
        "DELETE FROM tariff_supplements WHERE code = $1", code
    )

    if 'DELETE 0' in result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Supplement with code '{code}' not found"
        )

    return None


# =============================================================================
# WORKFLOW SUPPLEMENT CONFIG MANAGEMENT
# =============================================================================

@router.get(
    "/workflows/{workflow_code}/supplements",
    response_model=List[WorkflowSupplementConfigResponse],
    summary="List workflow supplements",
    description="Get all supplements configured for a specific workflow."
)
async def list_workflow_supplements(
    workflow_code: str = Path(..., description="Workflow code"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("admin:manage_tariffs"))
):
    query = """
        SELECT wsc.id, wsc.workflow_code, wsc.supplement_code,
               ts.name_es as supplement_name, ts.amount as supplement_amount,
               wsc.quantity_per_request, wsc.is_required, wsc.is_active,
               wsc.created_at::text, wsc.updated_at::text
        FROM workflow_supplement_config wsc
        LEFT JOIN tariff_supplements ts ON ts.code = wsc.supplement_code
        WHERE wsc.workflow_code = $1
        ORDER BY wsc.supplement_code
    """
    rows = await db.fetch(query, workflow_code)
    return [WorkflowSupplementConfigResponse(**dict(row)) for row in rows]


@router.post(
    "/workflows/{workflow_code}/supplements",
    response_model=WorkflowSupplementConfigResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add supplement to workflow",
    description="Add a tariff supplement to a workflow configuration."
)
async def add_workflow_supplement(
    workflow_code: str = Path(..., description="Workflow code"),
    data: WorkflowSupplementConfigCreate = None,
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("admin:manage_tariffs"))
):
    # Check if supplement exists
    supplement = await db.fetchrow(
        "SELECT code, name_es, amount FROM tariff_supplements WHERE code = $1",
        data.supplement_code
    )
    if not supplement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Supplement with code '{data.supplement_code}' not found"
        )

    # Check if already configured for this workflow
    existing = await db.fetchrow(
        """SELECT id FROM workflow_supplement_config
           WHERE workflow_code = $1 AND supplement_code = $2""",
        workflow_code, data.supplement_code
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Supplement '{data.supplement_code}' is already configured for workflow '{workflow_code}'"
        )

    query = """
        INSERT INTO workflow_supplement_config (
            workflow_code, supplement_code, quantity_per_request, is_required, is_active
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, workflow_code, supplement_code, quantity_per_request, is_required, is_active,
                  created_at::text, updated_at::text
    """
    row = await db.fetchrow(
        query,
        workflow_code,
        data.supplement_code,
        data.quantity_per_request,
        data.is_required,
        data.is_active
    )
    result = dict(row)
    result['supplement_name'] = supplement['name_es']
    result['supplement_amount'] = float(supplement['amount'])
    return WorkflowSupplementConfigResponse(**result)


@router.put(
    "/workflows/{workflow_code}/supplements/{supplement_code}",
    response_model=WorkflowSupplementConfigResponse,
    summary="Update workflow supplement config",
    description="Update the configuration of a supplement for a workflow."
)
async def update_workflow_supplement(
    workflow_code: str = Path(..., description="Workflow code"),
    supplement_code: str = Path(..., description="Supplement code"),
    data: WorkflowSupplementConfigUpdate = None,
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("admin:manage_tariffs"))
):
    # Build dynamic update query
    params = [workflow_code, supplement_code]
    updates = []

    if data.quantity_per_request is not None:
        params.append(data.quantity_per_request)
        updates.append(f"quantity_per_request = ${len(params)}")

    if data.is_required is not None:
        params.append(data.is_required)
        updates.append(f"is_required = ${len(params)}")

    if data.is_active is not None:
        params.append(data.is_active)
        updates.append(f"is_active = ${len(params)}")

    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )

    updates.append("updated_at = now()")

    query = f"""
        UPDATE workflow_supplement_config
        SET {', '.join(updates)}
        WHERE workflow_code = $1 AND supplement_code = $2
        RETURNING id, workflow_code, supplement_code, quantity_per_request, is_required, is_active,
                  created_at::text, updated_at::text
    """
    row = await db.fetchrow(query, *params)

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Supplement '{supplement_code}' not found for workflow '{workflow_code}'"
        )

    # Get supplement details
    supplement = await db.fetchrow(
        "SELECT name_es, amount FROM tariff_supplements WHERE code = $1",
        supplement_code
    )
    result = dict(row)
    if supplement:
        result['supplement_name'] = supplement['name_es']
        result['supplement_amount'] = float(supplement['amount'])
    return WorkflowSupplementConfigResponse(**result)


@router.delete(
    "/workflows/{workflow_code}/supplements/{supplement_code}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove supplement from workflow",
    description="Remove a supplement configuration from a workflow."
)
async def remove_workflow_supplement(
    workflow_code: str = Path(..., description="Workflow code"),
    supplement_code: str = Path(..., description="Supplement code"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("admin:manage_tariffs"))
):
    result = await db.execute(
        """DELETE FROM workflow_supplement_config
           WHERE workflow_code = $1 AND supplement_code = $2""",
        workflow_code, supplement_code
    )

    if 'DELETE 0' in result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Supplement '{supplement_code}' not found for workflow '{workflow_code}'"
        )

    return None


# ═══════════════════════════════════════════════════════════════
# MAINTENANCE - Cleanup Operations
# ═══════════════════════════════════════════════════════════════

class CleanupResponse(BaseModel):
    """Response model for cleanup operations"""
    deleted_requests: int = Field(..., description="Number of service requests deleted")
    deleted_documents: int = Field(..., description="Number of documents deleted")
    deleted_files: int = Field(..., description="Number of files deleted from storage")
    errors: List[str] = Field(default=[], description="Any errors encountered during cleanup")


@router.post(
    "/maintenance/cleanup-abandoned",
    response_model=CleanupResponse,
    summary="Clean up abandoned service requests",
    description="""
    Delete service requests that have been in DRAFT status for too long.

    **Purpose:**
    - Free up storage space from abandoned sessions
    - Remove orphan data from users who started but never completed requests
    - Maintain database hygiene

    **Default behavior:**
    - Deletes DRAFT requests older than 2 hours
    - Deletes associated documents from database
    - Deletes files from Firebase Storage

    **Recommended:**
    - Call this endpoint via Cloud Scheduler every hour
    - Or trigger manually when needed
    """
)
async def cleanup_abandoned_requests(
    max_age_hours: int = Query(2, ge=1, le=168, description="Maximum age in hours for DRAFT requests (1-168)"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("admin:manage_system"))
):
    """Clean up abandoned DRAFT requests older than max_age_hours"""
    from ..services.service_request_service import service_request_service

    stats = await service_request_service.cleanup_abandoned_requests(
        db=db,
        max_age_hours=max_age_hours
    )

    return CleanupResponse(**stats)


# ═══════════════════════════════════════════════════════════════
# TREASURY AGENT - Payment Validation
# ═══════════════════════════════════════════════════════════════

class PaymentValidationRequest(BaseModel):
    """Request model for agent validation."""
    comment: Optional[str] = Field(None, max_length=500, description="Validation comment")


class PaymentRejectionRequest(BaseModel):
    """Request model for agent rejection."""
    reason: str = Field(..., min_length=10, max_length=500, description="Rejection reason")


class PaymentLockRequest(BaseModel):
    """Request model for agent lock."""
    duration_minutes: int = Field(
        default=15,
        ge=5,
        le=60,
        description="Lock duration in minutes (5-60)"
    )


class PendingPaymentResponse(BaseModel):
    """Response for a pending payment."""
    payment_id: str
    payment_reference: str
    service_request_id: Optional[str] = None
    request_reference: Optional[str] = None
    workflow_code: Optional[str] = None
    user_id: str
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    payment_method: str
    total_amount: float
    currency: str = "XAF"
    calculation_details: Optional[Dict[str, Any]] = None
    workflow_status: str
    locked_by_agent_id: Optional[int] = None
    lock_expires_at: Optional[str] = None
    created_at: str
    hours_waiting: float


class PendingPaymentsListResponse(BaseModel):
    """List of pending payments."""
    payments: List[PendingPaymentResponse]
    total: int
    page: int = 1
    page_size: int = 20


class PaymentActionResponse(BaseModel):
    """Response for payment actions."""
    success: bool
    payment_id: str
    status: str
    message_es: Optional[str] = None
    error: Optional[str] = None


@router.get(
    "/treasury/payments/pending",
    response_model=PendingPaymentsListResponse,
    summary="Get pending payments for validation",
    description="""
    Get list of payments pending Treasury Agent validation.

    **Filters:**
    - payment_method: 'cash' or 'check' (default: all manual methods)
    - workflow_status: Filter by workflow status

    **Permissions:**
    - Requires 'treasury:validate_payments' permission
    """
)
async def get_pending_payments(
    payment_method: Optional[str] = Query(None, description="Filter by payment method"),
    workflow_status: Optional[str] = Query(
        "pending_agent_review",
        description="Filter by workflow status"
    ),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("treasury:validate_payments"))
):
    """Get payments pending Treasury Agent validation"""
    from datetime import datetime

    # Build query
    where_clauses = ["sp.workflow_status = $1"]
    params = [workflow_status or "pending_agent_review"]
    param_idx = 2

    if payment_method:
        where_clauses.append(f"sp.payment_method = ${param_idx}")
        params.append(payment_method)
        param_idx += 1
    else:
        # Default: only manual validation methods
        where_clauses.append(f"sp.payment_method IN ('cash', 'check')")

    where_sql = " AND ".join(where_clauses)

    query = f"""
        SELECT
            sp.id AS payment_id,
            sp.payment_reference,
            sp.service_request_id,
            sr.reference_number AS request_reference,
            sr.workflow_code,
            sp.user_id,
            u.first_name || ' ' || u.last_name AS user_name,
            u.email AS user_email,
            sp.payment_method,
            sp.total_amount,
            sp.currency,
            sp.calculation_details,
            sp.workflow_status,
            sp.locked_by_agent_id,
            sp.lock_expires_at,
            sp.created_at,
            EXTRACT(EPOCH FROM (NOW() - sp.created_at)) / 3600 AS hours_waiting
        FROM service_payments sp
        LEFT JOIN service_requests sr ON sr.id = sp.service_request_id
        LEFT JOIN users u ON u.id = sp.user_id
        WHERE {where_sql}
        ORDER BY sp.created_at ASC
        LIMIT ${param_idx} OFFSET ${param_idx + 1}
    """
    params.extend([limit, offset])

    rows = await db.fetch(query, *params)

    # Get total count
    count_query = f"""
        SELECT COUNT(*) FROM service_payments sp
        WHERE {where_sql}
    """
    total = await db.fetchval(count_query, *params[:param_idx-1])

    payments = []
    for row in rows:
        payments.append(PendingPaymentResponse(
            payment_id=str(row["payment_id"]),
            payment_reference=row["payment_reference"],
            service_request_id=str(row["service_request_id"]) if row["service_request_id"] else None,
            request_reference=row["request_reference"],
            workflow_code=row["workflow_code"],
            user_id=str(row["user_id"]),
            user_name=row["user_name"],
            user_email=row["user_email"],
            payment_method=row["payment_method"],
            total_amount=float(row["total_amount"]),
            currency=row["currency"],
            calculation_details=row["calculation_details"],
            workflow_status=row["workflow_status"],
            locked_by_agent_id=row["locked_by_agent_id"],
            lock_expires_at=row["lock_expires_at"].isoformat() if row["lock_expires_at"] else None,
            created_at=row["created_at"].isoformat(),
            hours_waiting=float(row["hours_waiting"] or 0),
        ))

    # Calculate page from offset and limit
    current_page = (offset // limit) + 1 if limit else 1

    return PendingPaymentsListResponse(
        payments=payments,
        total=total or 0,
        page=current_page,
        page_size=limit
    )


@router.get(
    "/treasury/payments/{payment_id}",
    response_model=PendingPaymentResponse,
    summary="Get single payment details",
    description="""
    Get details of a specific payment by ID.

    **Permissions:**
    - Requires 'treasury:validate_payments' permission
    """
)
async def get_payment_details(
    payment_id: str = Path(..., description="Payment UUID"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("treasury:validate_payments"))
):
    """Get single payment details for Treasury Agent review"""
    query = """
        SELECT
            sp.id AS payment_id,
            sp.payment_reference,
            sp.service_request_id,
            sr.reference_number AS request_reference,
            sr.workflow_code,
            sp.user_id,
            u.first_name || ' ' || u.last_name AS user_name,
            u.email AS user_email,
            sp.payment_method,
            sp.total_amount,
            sp.currency,
            sp.calculation_details,
            sp.workflow_status,
            sp.locked_by_agent_id,
            sp.lock_expires_at,
            sp.created_at,
            EXTRACT(EPOCH FROM (NOW() - sp.created_at)) / 3600 AS hours_waiting
        FROM service_payments sp
        LEFT JOIN service_requests sr ON sr.id = sp.service_request_id
        LEFT JOIN users u ON u.id = sp.user_id
        WHERE sp.id = $1
    """
    row = await db.fetchrow(query, payment_id)

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment not found: {payment_id}"
        )

    return PendingPaymentResponse(
        payment_id=str(row["payment_id"]),
        payment_reference=row["payment_reference"],
        service_request_id=str(row["service_request_id"]) if row["service_request_id"] else None,
        request_reference=row["request_reference"],
        workflow_code=row["workflow_code"],
        user_id=str(row["user_id"]),
        user_name=row["user_name"],
        user_email=row["user_email"],
        payment_method=row["payment_method"],
        total_amount=float(row["total_amount"]),
        currency=row["currency"],
        calculation_details=row["calculation_details"],
        workflow_status=row["workflow_status"],
        locked_by_agent_id=row["locked_by_agent_id"],
        lock_expires_at=row["lock_expires_at"].isoformat() if row["lock_expires_at"] else None,
        created_at=row["created_at"].isoformat(),
        hours_waiting=float(row["hours_waiting"] or 0),
    )


@router.post(
    "/treasury/payments/{payment_id}/lock",
    response_model=PaymentActionResponse,
    summary="Lock payment for review",
    description="""
    Lock a payment for exclusive review by this agent.

    **Behavior:**
    - Sets locked_by_agent_id to current user
    - Sets lock_expires_at to now + duration_minutes
    - Prevents other agents from modifying

    **Permissions:**
    - Requires 'treasury:validate_payments' permission
    """
)
async def lock_payment(
    payment_id: str = Path(..., description="Payment UUID"),
    body: PaymentLockRequest = Body(default=PaymentLockRequest()),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("treasury:validate_payments"))
):
    """Lock payment for exclusive review"""
    from datetime import datetime, timedelta

    # Check if payment exists and is pending
    payment = await db.fetchrow(
        "SELECT id, workflow_status, locked_by_agent_id, lock_expires_at FROM service_payments WHERE id = $1",
        payment_id
    )

    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment not found: {payment_id}"
        )

    # Check if already locked by another agent
    if payment["locked_by_agent_id"] and payment["locked_by_agent_id"] != current_user.id:
        if payment["lock_expires_at"] and payment["lock_expires_at"] > datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Payment is locked by another agent"
            )

    # Lock the payment
    lock_expires = datetime.utcnow() + timedelta(minutes=body.duration_minutes)

    await db.execute(
        """
        UPDATE service_payments
        SET locked_by_agent_id = $1, lock_expires_at = $2, workflow_status = 'locked_by_agent'
        WHERE id = $3
        """,
        current_user.id, lock_expires, payment_id
    )

    return PaymentActionResponse(
        success=True,
        payment_id=payment_id,
        status="locked_by_agent",
        message_es=f"Pago bloqueado hasta {lock_expires.strftime('%H:%M')}"
    )


@router.post(
    "/treasury/payments/{payment_id}/validate",
    response_model=PaymentActionResponse,
    summary="Validate payment",
    description="""
    Validate (approve) a cash/check payment.

    **Behavior:**
    - Sets workflow_status to 'approved'
    - Sets validated_by_agent_id and validated_at
    - Generates receipt_number
    - Updates service_request payment_status

    **Permissions:**
    - Requires 'treasury:validate_payments' permission
    - Must have lock on the payment
    """
)
async def validate_payment(
    payment_id: str = Path(..., description="Payment UUID"),
    body: PaymentValidationRequest = Body(default=PaymentValidationRequest()),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("treasury:validate_payments"))
):
    """Validate (approve) a payment"""
    from app.modules.payments.services.processors import payment_processor_registry

    # Verify lock ownership
    payment = await db.fetchrow(
        "SELECT id, locked_by_agent_id, service_request_id FROM service_payments WHERE id = $1",
        payment_id
    )

    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment not found: {payment_id}"
        )

    if payment["locked_by_agent_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must lock the payment before validating"
        )

    # Validate via registry
    result = await payment_processor_registry.validate_manual_payment(
        db=db,
        payment_id=payment_id,
        agent_id=current_user.id,
        comment=body.comment
    )

    if not result.paid:
        return PaymentActionResponse(
            success=False,
            payment_id=payment_id,
            status=result.status.value,
            error=result.error
        )

    # Update service_request if linked
    if payment["service_request_id"]:
        await db.execute(
            """
            UPDATE service_requests
            SET payment_status = 'completed', paid_at = NOW(), updated_at = NOW()
            WHERE id = $1
            """,
            payment["service_request_id"]
        )

    # Publish PAYMENT_CASH_VALIDATED event
    try:
        # Get user info for notification
        user_info = await db.fetchrow(
            """
            SELECT u.id, u.email, u.first_name, u.last_name, u.phone_number, u.preferred_language
            FROM service_payments sp
            JOIN service_requests sr ON sr.id = sp.service_request_id
            JOIN users u ON u.id = sr.user_id
            WHERE sp.id = $1
            """,
            payment_id
        )
        payment_info = await db.fetchrow(
            "SELECT amount, currency, receipt_number, payment_method FROM service_payments WHERE id = $1",
            payment_id
        )

        if user_info:
            EventBus.publish_nowait(
                EventType.PAYMENT_CASH_VALIDATED,
                {
                    "payment_id": payment_id,
                    "user_id": user_info["id"],
                    "user_email": user_info["email"],
                    "user_name": f"{user_info['first_name']} {user_info['last_name']}",
                    "user_phone": user_info["phone_number"],
                    "preferred_language": user_info["preferred_language"] or "es",
                    "request_id": payment["service_request_id"],
                    "amount": float(payment_info["amount"]) if payment_info["amount"] else None,
                    "currency": payment_info["currency"] or "XAF",
                    "receipt_number": payment_info["receipt_number"],
                    "payment_method": payment_info["payment_method"],
                    "agent_id": current_user.id,
                    "timestamp": datetime.now().isoformat(),
                }
            )
    except Exception as e:
        # Non-blocking - log but don't fail the request
        pass

    return PaymentActionResponse(
        success=True,
        payment_id=payment_id,
        status="approved",
        message_es="Pago validado correctamente. Recibo generado."
    )


@router.post(
    "/treasury/payments/{payment_id}/reject",
    response_model=PaymentActionResponse,
    summary="Reject payment",
    description="""
    Reject a cash/check payment.

    **Behavior:**
    - Sets workflow_status to 'rejected'
    - Records rejection reason
    - Notifies user

    **Permissions:**
    - Requires 'treasury:validate_payments' permission
    - Must have lock on the payment
    """
)
async def reject_payment(
    payment_id: str = Path(..., description="Payment UUID"),
    body: PaymentRejectionRequest = ...,
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("treasury:validate_payments"))
):
    """Reject a payment"""
    from app.modules.payments.services.processors import payment_processor_registry

    # Verify lock ownership
    payment = await db.fetchrow(
        "SELECT id, locked_by_agent_id FROM service_payments WHERE id = $1",
        payment_id
    )

    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment not found: {payment_id}"
        )

    if payment["locked_by_agent_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must lock the payment before rejecting"
        )

    # Reject via registry
    result = await payment_processor_registry.reject_manual_payment(
        db=db,
        payment_id=payment_id,
        agent_id=current_user.id,
        reason=body.reason
    )

    # Publish PAYMENT_CASH_REJECTED event
    try:
        # Get user and payment info for notification
        user_info = await db.fetchrow(
            """
            SELECT u.id, u.email, u.first_name, u.last_name, u.phone_number, u.preferred_language,
                   sp.service_request_id, sp.amount, sp.currency, sp.payment_method
            FROM service_payments sp
            JOIN service_requests sr ON sr.id = sp.service_request_id
            JOIN users u ON u.id = sr.user_id
            WHERE sp.id = $1
            """,
            payment_id
        )

        if user_info:
            EventBus.publish_nowait(
                EventType.PAYMENT_CASH_REJECTED,
                {
                    "payment_id": payment_id,
                    "user_id": user_info["id"],
                    "user_email": user_info["email"],
                    "user_name": f"{user_info['first_name']} {user_info['last_name']}",
                    "user_phone": user_info["phone_number"],
                    "preferred_language": user_info["preferred_language"] or "es",
                    "request_id": user_info["service_request_id"],
                    "amount": float(user_info["amount"]) if user_info["amount"] else None,
                    "currency": user_info["currency"] or "XAF",
                    "payment_method": user_info["payment_method"],
                    "reason": body.reason,
                    "agent_id": current_user.id,
                    "timestamp": datetime.now().isoformat(),
                }
            )
    except Exception:
        # Non-blocking
        pass

    return PaymentActionResponse(
        success=True,
        payment_id=payment_id,
        status="rejected",
        message_es="Pago rechazado."
    )


@router.post(
    "/treasury/payments/{payment_id}/unlock",
    response_model=PaymentActionResponse,
    summary="Release payment lock",
    description="""
    Release lock on a payment without validating.

    **Behavior:**
    - Clears locked_by_agent_id and lock_expires_at
    - Returns status to 'pending_agent_review'

    **Permissions:**
    - Requires 'treasury:validate_payments' permission
    - Must be the agent who locked it
    """
)
async def unlock_payment(
    payment_id: str = Path(..., description="Payment UUID"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("treasury:validate_payments"))
):
    """Release lock on a payment"""
    # Verify ownership
    payment = await db.fetchrow(
        "SELECT id, locked_by_agent_id FROM service_payments WHERE id = $1",
        payment_id
    )

    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment not found: {payment_id}"
        )

    if payment["locked_by_agent_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only unlock payments you locked"
        )

    await db.execute(
        """
        UPDATE service_payments
        SET locked_by_agent_id = NULL, lock_expires_at = NULL, workflow_status = 'pending_agent_review'
        WHERE id = $1
        """,
        payment_id
    )

    return PaymentActionResponse(
        success=True,
        payment_id=payment_id,
        status="pending_agent_review",
        message_es="Bloqueo liberado."
    )


# ═══════════════════════════════════════════════════════════════
# PAYMENT METHOD CONFIGURATIONS
# ═══════════════════════════════════════════════════════════════

class PaymentMethodConfigResponse(BaseModel):
    """Response model for payment method configuration.
    Note: Translations (FR/EN) are managed via entity_translations table.
    """
    id: int
    code: str
    label_es: str
    processor_type: str
    requires_phone: bool = False
    requires_redirect: bool = False
    requires_agent_validation: bool = False
    is_active: bool = True
    display_order: int = 0
    icon: str = "credit-card"
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    fees_percentage: float = 0
    fees_fixed: float = 0
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class PaymentMethodConfigCreate(BaseModel):
    """Create model for payment method configuration.
    Note: Translations (FR/EN) are managed via entity_translations table.
    """
    code: str = Field(..., pattern=r'^[a-z_]+$', max_length=50)
    label_es: str = Field(..., max_length=100)
    processor_type: str = Field(default="manual", pattern="^(bange_api|manual)$")
    requires_phone: bool = False
    requires_redirect: bool = False
    requires_agent_validation: bool = False
    is_active: bool = True
    display_order: int = Field(default=0, ge=0)
    icon: str = Field(default="credit-card", max_length=50)
    min_amount: Optional[float] = Field(None, ge=0)
    max_amount: Optional[float] = Field(None, ge=0)
    fees_percentage: float = Field(default=0, ge=0, le=100)
    fees_fixed: float = Field(default=0, ge=0)


class PaymentMethodConfigUpdate(BaseModel):
    """Update model for payment method configuration.
    Note: Translations (FR/EN) are managed via entity_translations table.
    """
    label_es: Optional[str] = Field(None, max_length=100)
    processor_type: Optional[str] = Field(None, pattern="^(bange_api|manual)$")
    requires_phone: Optional[bool] = None
    requires_redirect: Optional[bool] = None
    requires_agent_validation: Optional[bool] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = Field(None, ge=0)
    icon: Optional[str] = Field(None, max_length=50)
    min_amount: Optional[float] = Field(None, ge=0)
    max_amount: Optional[float] = Field(None, ge=0)
    fees_percentage: Optional[float] = Field(None, ge=0, le=100)
    fees_fixed: Optional[float] = Field(None, ge=0)


class PaymentMethodReorderRequest(BaseModel):
    """Request model for reordering payment methods."""
    order: List[str] = Field(..., description="List of method codes in desired order")


@router.get(
    "/payment-methods",
    response_model=List[PaymentMethodConfigResponse],
    summary="List payment method configurations",
    description="""
    Get all payment method configurations.

    **Permissions:**
    - Requires 'webhooks.view' permission
    """
)
async def list_payment_methods(
    active_only: bool = Query(False, description="Show only active methods"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("webhooks.view"))
):
    """List all payment method configurations"""
    query = """
        SELECT
            id, code, label_es,
            processor_type, requires_phone, requires_redirect,
            requires_agent_validation, is_active, display_order,
            icon, min_amount, max_amount, fees_percentage, fees_fixed,
            created_at, updated_at
        FROM payment_method_configurations
    """
    if active_only:
        query += " WHERE is_active = TRUE"
    query += " ORDER BY display_order ASC, code ASC"

    rows = await db.fetch(query)

    return [
        PaymentMethodConfigResponse(
            id=row["id"],
            code=row["code"],
            label_es=row["label_es"],
            processor_type=row["processor_type"],
            requires_phone=row["requires_phone"],
            requires_redirect=row["requires_redirect"],
            requires_agent_validation=row["requires_agent_validation"],
            is_active=row["is_active"],
            display_order=row["display_order"],
            icon=row["icon"],
            min_amount=float(row["min_amount"]) if row["min_amount"] else None,
            max_amount=float(row["max_amount"]) if row["max_amount"] else None,
            fees_percentage=float(row["fees_percentage"]) if row["fees_percentage"] else 0,
            fees_fixed=float(row["fees_fixed"]) if row["fees_fixed"] else 0,
            created_at=row["created_at"].isoformat() if row["created_at"] else None,
            updated_at=row["updated_at"].isoformat() if row["updated_at"] else None,
        )
        for row in rows
    ]


@router.get(
    "/payment-methods/{code}",
    response_model=PaymentMethodConfigResponse,
    summary="Get payment method by code",
    description="""
    Get a specific payment method configuration by code.

    **Permissions:**
    - Requires 'webhooks.view' permission
    """
)
async def get_payment_method(
    code: str = Path(..., description="Payment method code"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("webhooks.view"))
):
    """Get payment method configuration by code"""
    query = """
        SELECT
            id, code, label_es,
            processor_type, requires_phone, requires_redirect,
            requires_agent_validation, is_active, display_order,
            icon, min_amount, max_amount, fees_percentage, fees_fixed,
            created_at, updated_at
        FROM payment_method_configurations
        WHERE code = $1
    """
    row = await db.fetchrow(query, code)

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment method not found: {code}"
        )

    return PaymentMethodConfigResponse(
        id=row["id"],
        code=row["code"],
        label_es=row["label_es"],
        processor_type=row["processor_type"],
        requires_phone=row["requires_phone"],
        requires_redirect=row["requires_redirect"],
        requires_agent_validation=row["requires_agent_validation"],
        is_active=row["is_active"],
        display_order=row["display_order"],
        icon=row["icon"],
        min_amount=float(row["min_amount"]) if row["min_amount"] else None,
        max_amount=float(row["max_amount"]) if row["max_amount"] else None,
        fees_percentage=float(row["fees_percentage"]) if row["fees_percentage"] else 0,
        fees_fixed=float(row["fees_fixed"]) if row["fees_fixed"] else 0,
        created_at=row["created_at"].isoformat() if row["created_at"] else None,
        updated_at=row["updated_at"].isoformat() if row["updated_at"] else None,
    )


@router.post(
    "/payment-methods",
    response_model=PaymentMethodConfigResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create payment method configuration",
    description="""
    Create a new payment method configuration.

    **Permissions:**
    - Requires 'webhooks.create' permission
    """
)
async def create_payment_method(
    body: PaymentMethodConfigCreate,
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("webhooks.create"))
):
    """Create new payment method configuration"""
    # Check if code already exists
    existing = await db.fetchval(
        "SELECT id FROM payment_method_configurations WHERE code = $1",
        body.code
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Payment method with code '{body.code}' already exists"
        )

    query = """
        INSERT INTO payment_method_configurations (
            code, label_es,
            processor_type, requires_phone, requires_redirect,
            requires_agent_validation, is_active, display_order,
            icon, min_amount, max_amount, fees_percentage, fees_fixed
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id, created_at, updated_at
    """
    row = await db.fetchrow(
        query,
        body.code, body.label_es,
        body.processor_type, body.requires_phone, body.requires_redirect,
        body.requires_agent_validation, body.is_active, body.display_order,
        body.icon, body.min_amount, body.max_amount, body.fees_percentage, body.fees_fixed
    )

    return PaymentMethodConfigResponse(
        id=row["id"],
        code=body.code,
        label_es=body.label_es,
        processor_type=body.processor_type,
        requires_phone=body.requires_phone,
        requires_redirect=body.requires_redirect,
        requires_agent_validation=body.requires_agent_validation,
        is_active=body.is_active,
        display_order=body.display_order,
        icon=body.icon,
        min_amount=body.min_amount,
        max_amount=body.max_amount,
        fees_percentage=body.fees_percentage,
        fees_fixed=body.fees_fixed,
        created_at=row["created_at"].isoformat() if row["created_at"] else None,
        updated_at=row["updated_at"].isoformat() if row["updated_at"] else None,
    )


@router.put(
    "/payment-methods/{code}",
    response_model=PaymentMethodConfigResponse,
    summary="Update payment method configuration",
    description="""
    Update an existing payment method configuration.

    **Permissions:**
    - Requires 'webhooks.update' permission
    """
)
async def update_payment_method(
    code: str = Path(..., description="Payment method code"),
    body: PaymentMethodConfigUpdate = ...,
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("webhooks.update"))
):
    """Update payment method configuration"""
    # Check if exists
    existing = await db.fetchrow(
        "SELECT id FROM payment_method_configurations WHERE code = $1",
        code
    )
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment method not found: {code}"
        )

    # Build dynamic update query
    updates = []
    params = []
    param_idx = 1

    update_fields = body.model_dump(exclude_unset=True)
    for field, value in update_fields.items():
        if value is not None:
            updates.append(f"{field} = ${param_idx}")
            params.append(value)
            param_idx += 1

    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )

    updates.append(f"updated_at = NOW()")
    params.append(code)

    query = f"""
        UPDATE payment_method_configurations
        SET {', '.join(updates)}
        WHERE code = ${param_idx}
        RETURNING id, code, label_es,
            processor_type, requires_phone, requires_redirect,
            requires_agent_validation, is_active, display_order,
            icon, min_amount, max_amount, fees_percentage, fees_fixed,
            created_at, updated_at
    """
    row = await db.fetchrow(query, *params)

    return PaymentMethodConfigResponse(
        id=row["id"],
        code=row["code"],
        label_es=row["label_es"],
        processor_type=row["processor_type"],
        requires_phone=row["requires_phone"],
        requires_redirect=row["requires_redirect"],
        requires_agent_validation=row["requires_agent_validation"],
        is_active=row["is_active"],
        display_order=row["display_order"],
        icon=row["icon"],
        min_amount=float(row["min_amount"]) if row["min_amount"] else None,
        max_amount=float(row["max_amount"]) if row["max_amount"] else None,
        fees_percentage=float(row["fees_percentage"]) if row["fees_percentage"] else 0,
        fees_fixed=float(row["fees_fixed"]) if row["fees_fixed"] else 0,
        created_at=row["created_at"].isoformat() if row["created_at"] else None,
        updated_at=row["updated_at"].isoformat() if row["updated_at"] else None,
    )


@router.delete(
    "/payment-methods/{code}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete payment method configuration",
    description="""
    Delete a payment method configuration.

    **Note:** Cannot delete default system methods (mobile_money, card, bank_transfer, cash, check).

    **Permissions:**
    - Requires 'webhooks.delete' permission
    """
)
async def delete_payment_method(
    code: str = Path(..., description="Payment method code"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("webhooks.delete"))
):
    """Delete payment method configuration"""
    # Prevent deletion of default methods
    default_methods = {"mobile_money", "card", "bank_transfer", "cash", "check"}
    if code in default_methods:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Cannot delete default payment method: {code}"
        )

    result = await db.execute(
        "DELETE FROM payment_method_configurations WHERE code = $1",
        code
    )

    if result == "DELETE 0":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment method not found: {code}"
        )


@router.patch(
    "/payment-methods/reorder",
    response_model=List[PaymentMethodConfigResponse],
    summary="Reorder payment methods",
    description="""
    Update the display order of payment methods.

    **Permissions:**
    - Requires 'webhooks.update' permission
    """
)
async def reorder_payment_methods(
    body: PaymentMethodReorderRequest,
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("webhooks.update"))
):
    """Reorder payment methods by updating display_order"""
    # Update display_order for each method in the list
    for idx, code in enumerate(body.order):
        await db.execute(
            "UPDATE payment_method_configurations SET display_order = $1, updated_at = NOW() WHERE code = $2",
            idx + 1, code
        )

    # Return updated list
    return await list_payment_methods(active_only=False, db=db, current_user=current_user, _=None)


# ═══════════════════════════════════════════════════════════════
# TREASURY AUDIT (Phase 1A)
# ═══════════════════════════════════════════════════════════════

class AuditEntryResponse(BaseModel):
    """Response for a single audit entry."""
    id: str
    payment_id: str
    payment_reference: str
    service_request_id: Optional[str] = None
    service_request_reference: Optional[str] = None
    action: str
    from_status: Optional[str] = None
    to_status: Optional[str] = None
    comment: Optional[str] = None
    agent_id: Optional[int] = None
    agent_name: Optional[str] = None
    agent_email: Optional[str] = None
    action_duration_seconds: Optional[int] = None
    ip_address: Optional[str] = None
    created_at: str


class AuditListResponse(BaseModel):
    """List of audit entries."""
    entries: List[AuditEntryResponse]
    total: int
    page: int = 1
    page_size: int = 50


class PaymentAuditDetailResponse(BaseModel):
    """Detailed audit history for a single payment."""
    payment_id: str
    payment_reference: str
    service_request_id: Optional[str] = None
    service_request_reference: Optional[str] = None
    workflow_code: Optional[str] = None
    current_status: str
    created_at: str
    timeline: List[AuditEntryResponse]
    total_processing_minutes: Optional[float] = None
    lock_count: int = 0


@router.get(
    "/treasury/audit",
    response_model=AuditListResponse,
    summary="Get Treasury audit history",
    description="""
    Get audit trail of all Treasury actions (lock, validate, reject, etc.)

    **Filters:**
    - payment_id: Filter by specific payment
    - agent_id: Filter by agent who performed action
    - action: Filter by action type (lock_for_review, approve, reject, etc.)
    - date_from / date_to: Filter by date range

    **Permissions:**
    - Requires 'treasury.audit.view' permission
    """
)
async def get_treasury_audit(
    payment_id: Optional[str] = Query(None, description="Filter by payment ID"),
    agent_id: Optional[int] = Query(None, description="Filter by agent ID"),
    action: Optional[str] = Query(None, description="Filter by action type"),
    date_from: Optional[date] = Query(None, description="Start date"),
    date_to: Optional[date] = Query(None, description="End date"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("treasury.audit.view"))
):
    """Get Treasury audit trail"""
    # Build dynamic WHERE clause
    where_clauses = ["1=1"]
    params = []
    param_idx = 1

    if payment_id:
        where_clauses.append(f"pva.payment_id = ${param_idx}::uuid")
        params.append(payment_id)
        param_idx += 1

    if agent_id:
        where_clauses.append(f"pva.agent_id = ${param_idx}")
        params.append(agent_id)
        param_idx += 1

    if action:
        where_clauses.append(f"pva.action::text = ${param_idx}")
        params.append(action)
        param_idx += 1

    if date_from:
        where_clauses.append(f"pva.created_at >= ${param_idx}")
        params.append(date_from)
        param_idx += 1

    if date_to:
        where_clauses.append(f"pva.created_at < ${param_idx} + INTERVAL '1 day'")
        params.append(date_to)
        param_idx += 1

    where_sql = " AND ".join(where_clauses)
    offset = (page - 1) * page_size

    query = f"""
        SELECT
            pva.id,
            pva.payment_id,
            sp.payment_reference,
            sp.service_request_id,
            sr.reference AS service_request_reference,
            pva.action::text AS action,
            pva.from_status::text AS from_status,
            pva.to_status::text AS to_status,
            pva.comment,
            pva.agent_id,
            u.full_name AS agent_name,
            u.email AS agent_email,
            pva.action_duration_seconds,
            pva.ip_address::text AS ip_address,
            pva.created_at
        FROM payment_validation_audit pva
        JOIN service_payments sp ON sp.id = pva.payment_id
        LEFT JOIN service_requests sr ON sr.id = sp.service_request_id
        LEFT JOIN ministry_agents ma ON ma.id = pva.agent_id
        LEFT JOIN users u ON u.id = pva.agent_user_id
        WHERE {where_sql}
        ORDER BY pva.created_at DESC
        LIMIT ${param_idx} OFFSET ${param_idx + 1}
    """
    params.extend([page_size, offset])

    rows = await db.fetch(query, *params)

    # Get total count
    count_query = f"""
        SELECT COUNT(*)
        FROM payment_validation_audit pva
        WHERE {where_sql}
    """
    total = await db.fetchval(count_query, *params[:param_idx - 1])

    entries = []
    for row in rows:
        entries.append(AuditEntryResponse(
            id=str(row["id"]),
            payment_id=str(row["payment_id"]),
            payment_reference=row["payment_reference"],
            service_request_id=str(row["service_request_id"]) if row["service_request_id"] else None,
            service_request_reference=row["service_request_reference"],
            action=row["action"],
            from_status=row["from_status"],
            to_status=row["to_status"],
            comment=row["comment"],
            agent_id=row["agent_id"],
            agent_name=row["agent_name"],
            agent_email=row["agent_email"],
            action_duration_seconds=row["action_duration_seconds"],
            ip_address=row["ip_address"],
            created_at=row["created_at"].isoformat(),
        ))

    return AuditListResponse(
        entries=entries,
        total=total or 0,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/treasury/payments/{payment_id}/audit",
    response_model=PaymentAuditDetailResponse,
    summary="Get payment audit history",
    description="""
    Get complete audit history for a specific payment.

    Returns timeline of all actions with processing time metrics.

    **Permissions:**
    - Requires 'treasury.audit.view' permission
    """
)
async def get_payment_audit_history(
    payment_id: str = Path(..., description="Payment ID"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("treasury.audit.view"))
):
    """Get complete audit history for a payment"""
    # Get payment info
    payment = await db.fetchrow("""
        SELECT
            sp.id,
            sp.payment_reference,
            sp.service_request_id,
            sr.reference AS service_request_reference,
            sr.workflow_code,
            sp.workflow_status,
            sp.created_at
        FROM service_payments sp
        LEFT JOIN service_requests sr ON sr.id = sp.service_request_id
        WHERE sp.id = $1::uuid
    """, payment_id)

    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment not found: {payment_id}"
        )

    # Get audit entries
    audit_rows = await db.fetch("""
        SELECT
            pva.id,
            pva.payment_id,
            pva.action::text AS action,
            pva.from_status::text AS from_status,
            pva.to_status::text AS to_status,
            pva.comment,
            pva.agent_id,
            u.full_name AS agent_name,
            u.email AS agent_email,
            pva.action_duration_seconds,
            pva.ip_address::text AS ip_address,
            pva.created_at
        FROM payment_validation_audit pva
        LEFT JOIN ministry_agents ma ON ma.id = pva.agent_id
        LEFT JOIN users u ON u.id = pva.agent_user_id
        WHERE pva.payment_id = $1::uuid
        ORDER BY pva.created_at ASC
    """, payment_id)

    # Get lock count
    lock_count = await db.fetchval("""
        SELECT COUNT(*) FROM payment_lock_history
        WHERE payment_id = $1::uuid
    """, payment_id)

    # Calculate total processing time
    total_processing = await db.fetchval("""
        SELECT EXTRACT(EPOCH FROM (
            COALESCE(sp.validated_at, NOW()) - sp.created_at
        )) / 60
        FROM service_payments sp
        WHERE sp.id = $1::uuid
          AND sp.validated_at IS NOT NULL
    """, payment_id)

    timeline = []
    for row in audit_rows:
        timeline.append(AuditEntryResponse(
            id=str(row["id"]),
            payment_id=str(row["payment_id"]),
            payment_reference=payment["payment_reference"],
            action=row["action"],
            from_status=row["from_status"],
            to_status=row["to_status"],
            comment=row["comment"],
            agent_id=row["agent_id"],
            agent_name=row["agent_name"],
            agent_email=row["agent_email"],
            action_duration_seconds=row["action_duration_seconds"],
            ip_address=row["ip_address"],
            created_at=row["created_at"].isoformat(),
        ))

    return PaymentAuditDetailResponse(
        payment_id=str(payment["id"]),
        payment_reference=payment["payment_reference"],
        service_request_id=str(payment["service_request_id"]) if payment["service_request_id"] else None,
        service_request_reference=payment["service_request_reference"],
        workflow_code=payment["workflow_code"],
        current_status=payment["workflow_status"],
        created_at=payment["created_at"].isoformat(),
        timeline=timeline,
        total_processing_minutes=float(total_processing) if total_processing else None,
        lock_count=lock_count or 0,
    )


# ═══════════════════════════════════════════════════════════════
# TREASURY SLA STATS (Phase 1B)
# ═══════════════════════════════════════════════════════════════

class SLAStatsResponse(BaseModel):
    """SLA statistics for Treasury dashboard."""
    total_pending: int
    on_time: int
    warning: int
    critical: int
    breached: int
    avg_processing_minutes: Optional[float] = None
    max_processing_minutes: Optional[float] = None
    sla_respect_rate: float
    by_payment_method: Optional[Dict[str, Dict[str, int]]] = None


@router.get(
    "/treasury/stats/sla",
    response_model=SLAStatsResponse,
    summary="Get SLA statistics",
    description="""
    Get SLA statistics for pending payments.

    **SLA Status Categories:**
    - on_time: SLA deadline > 6 hours from now
    - warning: SLA deadline 2-6 hours from now
    - critical: SLA deadline < 2 hours from now
    - breached: SLA deadline passed

    **Permissions:**
    - Requires 'treasury.stats.view' permission
    """
)
async def get_sla_stats(
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("treasury.stats.view"))
):
    """Get SLA statistics for Treasury dashboard"""
    # Get SLA breakdown for pending payments
    sla_stats = await db.fetchrow("""
        WITH pending_payments AS (
            SELECT
                id,
                payment_method,
                sla_target_date,
                created_at,
                CASE
                    WHEN sla_target_date IS NULL THEN 'on_time'
                    WHEN sla_target_date < NOW() THEN 'breached'
                    WHEN sla_target_date - NOW() < INTERVAL '2 hours' THEN 'critical'
                    WHEN sla_target_date - NOW() < INTERVAL '6 hours' THEN 'warning'
                    ELSE 'on_time'
                END AS sla_status
            FROM service_payments
            WHERE workflow_status NOT IN (
                'completed', 'cancelled_by_user', 'cancelled_by_agent', 'expired'
            )
        )
        SELECT
            COUNT(*) AS total_pending,
            COUNT(*) FILTER (WHERE sla_status = 'on_time') AS on_time,
            COUNT(*) FILTER (WHERE sla_status = 'warning') AS warning,
            COUNT(*) FILTER (WHERE sla_status = 'critical') AS critical,
            COUNT(*) FILTER (WHERE sla_status = 'breached') AS breached
        FROM pending_payments
    """)

    # Get processing time stats for completed payments
    time_stats = await db.fetchrow("""
        SELECT
            AVG(EXTRACT(EPOCH FROM (validated_at - created_at)) / 60) AS avg_minutes,
            MAX(EXTRACT(EPOCH FROM (validated_at - created_at)) / 60) AS max_minutes
        FROM service_payments
        WHERE workflow_status = 'completed'
          AND validated_at IS NOT NULL
          AND validated_at >= NOW() - INTERVAL '30 days'
    """)

    # Calculate SLA respect rate from completed payments
    sla_rate = await db.fetchrow("""
        SELECT
            COUNT(*) AS total_completed,
            COUNT(*) FILTER (WHERE sla_escalated = false OR sla_escalated IS NULL) AS respected
        FROM service_payments
        WHERE workflow_status = 'completed'
          AND validated_at >= NOW() - INTERVAL '30 days'
    """)

    # Get breakdown by payment method
    method_breakdown = await db.fetch("""
        WITH pending_payments AS (
            SELECT
                payment_method::text AS method,
                CASE
                    WHEN sla_target_date IS NULL THEN 'on_time'
                    WHEN sla_target_date < NOW() THEN 'breached'
                    WHEN sla_target_date - NOW() < INTERVAL '2 hours' THEN 'critical'
                    WHEN sla_target_date - NOW() < INTERVAL '6 hours' THEN 'warning'
                    ELSE 'on_time'
                END AS sla_status
            FROM service_payments
            WHERE workflow_status NOT IN (
                'completed', 'cancelled_by_user', 'cancelled_by_agent', 'expired'
            )
        )
        SELECT
            method,
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE sla_status = 'on_time') AS on_time,
            COUNT(*) FILTER (WHERE sla_status = 'warning') AS warning,
            COUNT(*) FILTER (WHERE sla_status = 'critical') AS critical,
            COUNT(*) FILTER (WHERE sla_status = 'breached') AS breached
        FROM pending_payments
        GROUP BY method
    """)

    by_method = {}
    for row in method_breakdown:
        by_method[row["method"]] = {
            "total": row["total"],
            "on_time": row["on_time"],
            "warning": row["warning"],
            "critical": row["critical"],
            "breached": row["breached"],
        }

    # Calculate SLA respect rate
    total_completed = sla_rate["total_completed"] or 0
    respected = sla_rate["respected"] or 0
    respect_rate = (respected / total_completed * 100) if total_completed > 0 else 100.0

    return SLAStatsResponse(
        total_pending=sla_stats["total_pending"] or 0,
        on_time=sla_stats["on_time"] or 0,
        warning=sla_stats["warning"] or 0,
        critical=sla_stats["critical"] or 0,
        breached=sla_stats["breached"] or 0,
        avg_processing_minutes=float(time_stats["avg_minutes"]) if time_stats["avg_minutes"] else None,
        max_processing_minutes=float(time_stats["max_minutes"]) if time_stats["max_minutes"] else None,
        sla_respect_rate=round(respect_rate, 2),
        by_payment_method=by_method if by_method else None,
    )


# ═══════════════════════════════════════════════════════════════
# TREASURY KPIs (Phase 4)
# ═══════════════════════════════════════════════════════════════


class PaymentMethodKPI(BaseModel):
    method: str
    count: int
    amount: float
    percentage: float
    success_rate: float
    avg_processing_minutes: Optional[float] = None


class MinistryKPI(BaseModel):
    ministry_id: int
    ministry_name: str
    count: int
    amount: float
    percentage: float


class DailyTrend(BaseModel):
    date: str
    count: int
    amount: float


class PeriodComparison(BaseModel):
    total_collected_change: float
    transactions_change: float
    trend: str  # 'up', 'down', 'stable'


class KPIResponse(BaseModel):
    period: str
    date_from: str
    date_to: str
    total_collected: float
    total_transactions: int
    avg_transaction_amount: float
    sla_respect_rate: float
    by_payment_method: List[PaymentMethodKPI]
    by_ministry: List[MinistryKPI]
    daily_trend: List[DailyTrend]
    previous_period: Optional[PeriodComparison] = None


class AgentStats(BaseModel):
    agent_id: int
    agent_name: str
    agent_email: Optional[str] = None
    validations_count: int
    rejections_count: int
    avg_processing_minutes: float
    sla_respect_rate: float
    current_workload: int


class AgentPerformanceResponse(BaseModel):
    period: str
    date_from: str
    date_to: str
    agents: List[AgentStats]
    total_validations: int
    total_rejections: int


@router.get(
    "/treasury/stats/kpis",
    response_model=KPIResponse,
    summary="Get Treasury KPIs",
    description="""
    Get comprehensive Treasury KPIs for the dashboard.

    **Period Options:**
    - day: Current day
    - week: Current week (Mon-Sun)
    - month: Current month
    - year: Current year
    - custom: Use date_from and date_to

    **Returns:**
    - Total collected amount and transaction count
    - Breakdown by payment method
    - Top 10 ministries by amount
    - Daily trend for the period
    - Comparison with previous period

    **Permissions:**
    - Requires 'treasury.stats.view' permission
    """
)
async def get_treasury_kpis(
    period: str = Query("month", regex="^(day|week|month|year|custom)$"),
    date_from: Optional[str] = Query(None, description="Start date (YYYY-MM-DD) for custom period"),
    date_to: Optional[str] = Query(None, description="End date (YYYY-MM-DD) for custom period"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("treasury.stats.view"))
):
    """Get Treasury KPIs for executive dashboard"""
    from datetime import datetime, timedelta

    # Calculate date range based on period
    now = datetime.now()
    if period == "day":
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = now
    elif period == "week":
        start_date = now - timedelta(days=now.weekday())
        start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = now
    elif period == "month":
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end_date = now
    elif period == "year":
        start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        end_date = now
    else:  # custom
        if not date_from or not date_to:
            raise HTTPException(status_code=400, detail="date_from and date_to required for custom period")
        start_date = datetime.strptime(date_from, "%Y-%m-%d")
        end_date = datetime.strptime(date_to, "%Y-%m-%d").replace(hour=23, minute=59, second=59)

    # Get main KPIs
    main_stats = await db.fetchrow("""
        SELECT
            COALESCE(SUM(total_amount), 0) AS total_collected,
            COUNT(*) AS total_transactions,
            COALESCE(AVG(total_amount), 0) AS avg_amount
        FROM service_payments
        WHERE workflow_status = 'completed'
          AND completed_at BETWEEN $1 AND $2
    """, start_date, end_date)

    # Get SLA respect rate
    sla_stats = await db.fetchrow("""
        SELECT
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE sla_escalated = false OR sla_escalated IS NULL) AS respected
        FROM service_payments
        WHERE workflow_status = 'completed'
          AND completed_at BETWEEN $1 AND $2
    """, start_date, end_date)

    total_for_sla = sla_stats["total"] or 0
    sla_rate = (sla_stats["respected"] / total_for_sla * 100) if total_for_sla > 0 else 100.0

    # Get breakdown by payment method
    method_stats = await db.fetch("""
        SELECT
            payment_method::text AS method,
            COUNT(*) AS count,
            COALESCE(SUM(total_amount), 0) AS amount,
            AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 60) AS avg_minutes,
            COUNT(*) FILTER (WHERE sla_escalated = false OR sla_escalated IS NULL)::float /
                NULLIF(COUNT(*), 0) * 100 AS success_rate
        FROM service_payments
        WHERE workflow_status = 'completed'
          AND completed_at BETWEEN $1 AND $2
        GROUP BY payment_method
        ORDER BY amount DESC
    """, start_date, end_date)

    total_amount = float(main_stats["total_collected"]) or 1
    by_payment_method = [
        PaymentMethodKPI(
            method=row["method"] or "unknown",
            count=row["count"],
            amount=float(row["amount"]),
            percentage=round(float(row["amount"]) / total_amount * 100, 1),
            success_rate=round(float(row["success_rate"]) if row["success_rate"] else 100.0, 1),
            avg_processing_minutes=round(float(row["avg_minutes"]), 1) if row["avg_minutes"] else None
        )
        for row in method_stats
    ]

    # Get top 10 ministries
    ministry_stats = await db.fetch("""
        SELECT
            sp.ministry_id,
            COALESCE(m.name_es, 'Sin Ministerio') AS ministry_name,
            COUNT(*) AS count,
            COALESCE(SUM(sp.total_amount), 0) AS amount
        FROM service_payments sp
        LEFT JOIN ministries m ON m.id = sp.ministry_id
        WHERE sp.workflow_status = 'completed'
          AND sp.completed_at BETWEEN $1 AND $2
        GROUP BY sp.ministry_id, m.name_es
        ORDER BY amount DESC
        LIMIT 10
    """, start_date, end_date)

    by_ministry = [
        MinistryKPI(
            ministry_id=row["ministry_id"] or 0,
            ministry_name=row["ministry_name"],
            count=row["count"],
            amount=float(row["amount"]),
            percentage=round(float(row["amount"]) / total_amount * 100, 1) if total_amount > 0 else 0
        )
        for row in ministry_stats
    ]

    # Get daily trend
    daily_stats = await db.fetch("""
        SELECT
            DATE(completed_at) AS date,
            COUNT(*) AS count,
            COALESCE(SUM(total_amount), 0) AS amount
        FROM service_payments
        WHERE workflow_status = 'completed'
          AND completed_at BETWEEN $1 AND $2
        GROUP BY DATE(completed_at)
        ORDER BY date
    """, start_date, end_date)

    daily_trend = [
        DailyTrend(
            date=str(row["date"]),
            count=row["count"],
            amount=float(row["amount"])
        )
        for row in daily_stats
    ]

    # Get previous period comparison
    period_duration = end_date - start_date
    prev_start = start_date - period_duration - timedelta(days=1)
    prev_end = start_date - timedelta(days=1)

    prev_stats = await db.fetchrow("""
        SELECT
            COALESCE(SUM(total_amount), 0) AS total_collected,
            COUNT(*) AS total_transactions
        FROM service_payments
        WHERE workflow_status = 'completed'
          AND completed_at BETWEEN $1 AND $2
    """, prev_start, prev_end)

    prev_collected = float(prev_stats["total_collected"]) if prev_stats["total_collected"] else 0
    prev_transactions = prev_stats["total_transactions"] or 0

    previous_period = None
    if prev_collected > 0 or prev_transactions > 0:
        collected_change = ((float(main_stats["total_collected"]) - prev_collected) / prev_collected * 100) if prev_collected > 0 else 0
        trans_change = ((main_stats["total_transactions"] - prev_transactions) / prev_transactions * 100) if prev_transactions > 0 else 0

        trend = "stable"
        if collected_change > 5:
            trend = "up"
        elif collected_change < -5:
            trend = "down"

        previous_period = PeriodComparison(
            total_collected_change=round(collected_change, 1),
            transactions_change=round(trans_change, 1),
            trend=trend
        )

    return KPIResponse(
        period=period,
        date_from=str(start_date.date()),
        date_to=str(end_date.date()),
        total_collected=float(main_stats["total_collected"]),
        total_transactions=main_stats["total_transactions"],
        avg_transaction_amount=float(main_stats["avg_amount"]),
        sla_respect_rate=round(sla_rate, 1),
        by_payment_method=by_payment_method,
        by_ministry=by_ministry,
        daily_trend=daily_trend,
        previous_period=previous_period
    )


@router.get(
    "/treasury/stats/agents",
    response_model=AgentPerformanceResponse,
    summary="Get Agent Performance Statistics",
    description="""
    Get performance statistics for Treasury agents.

    **Returns:**
    - Validations and rejections per agent
    - Average processing time
    - SLA respect rate
    - Current workload

    **Permissions:**
    - Requires 'treasury.stats.view' permission
    """
)
async def get_agent_performance(
    period: str = Query("month", regex="^(day|week|month|year|custom)$"),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("treasury.stats.view"))
):
    """Get agent performance statistics"""
    from datetime import datetime, timedelta

    # Calculate date range
    now = datetime.now()
    if period == "day":
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = now
    elif period == "week":
        start_date = now - timedelta(days=now.weekday())
        start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = now
    elif period == "month":
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end_date = now
    elif period == "year":
        start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        end_date = now
    else:  # custom
        if not date_from or not date_to:
            raise HTTPException(status_code=400, detail="date_from and date_to required for custom period")
        start_date = datetime.strptime(date_from, "%Y-%m-%d")
        end_date = datetime.strptime(date_to, "%Y-%m-%d").replace(hour=23, minute=59, second=59)

    # Get agent performance from audit log
    agent_stats = await db.fetch("""
        WITH agent_actions AS (
            SELECT
                pva.agent_id,
                pva.agent_user_id,
                u.full_name AS agent_name,
                u.email AS agent_email,
                pva.action,
                pva.action_duration_seconds,
                sp.sla_escalated
            FROM payment_validation_audit pva
            JOIN users u ON u.id = pva.agent_user_id
            JOIN service_payments sp ON sp.id = pva.payment_id
            WHERE pva.created_at BETWEEN $1 AND $2
              AND pva.agent_user_id IS NOT NULL
        ),
        agent_summary AS (
            SELECT
                agent_id,
                agent_user_id,
                agent_name,
                agent_email,
                COUNT(*) FILTER (WHERE action = 'approve') AS validations,
                COUNT(*) FILTER (WHERE action = 'reject') AS rejections,
                AVG(action_duration_seconds) / 60.0 AS avg_minutes,
                COUNT(*) FILTER (WHERE sla_escalated = false OR sla_escalated IS NULL)::float /
                    NULLIF(COUNT(*), 0) * 100 AS sla_rate
            FROM agent_actions
            GROUP BY agent_id, agent_user_id, agent_name, agent_email
        )
        SELECT
            as2.agent_id,
            as2.agent_user_id,
            as2.agent_name,
            as2.agent_email,
            as2.validations,
            as2.rejections,
            as2.avg_minutes,
            as2.sla_rate,
            COALESCE(aw.current_load, 0) AS current_workload
        FROM agent_summary as2
        LEFT JOIN agent_workloads aw ON aw.agent_id = as2.agent_id
        ORDER BY (as2.validations + as2.rejections) DESC
    """, start_date, end_date)

    agents = [
        AgentStats(
            agent_id=row["agent_id"] or row["agent_user_id"] or 0,
            agent_name=row["agent_name"] or "Unknown",
            agent_email=row["agent_email"],
            validations_count=row["validations"] or 0,
            rejections_count=row["rejections"] or 0,
            avg_processing_minutes=round(float(row["avg_minutes"]) if row["avg_minutes"] else 0, 1),
            sla_respect_rate=round(float(row["sla_rate"]) if row["sla_rate"] else 100.0, 1),
            current_workload=row["current_workload"] or 0
        )
        for row in agent_stats
    ]

    total_validations = sum(a.validations_count for a in agents)
    total_rejections = sum(a.rejections_count for a in agents)

    return AgentPerformanceResponse(
        period=period,
        date_from=str(start_date.date()),
        date_to=str(end_date.date()),
        agents=agents,
        total_validations=total_validations,
        total_rejections=total_rejections
    )


# ═══════════════════════════════════════════════════════════════
# TREASURY ANOMALIES (Phase 2A)
# ═══════════════════════════════════════════════════════════════

class AnomalyType(str):
    AMOUNT_MISMATCH = "amount_mismatch"
    DUPLICATE_SUSPECTED = "duplicate_suspected"
    RECONCILIATION_FAILED = "reconciliation_failed"
    VALIDATED_NOT_RECEIVED = "validated_not_received"
    SLA_BREACHED = "sla_breached"
    HIGH_AMOUNT = "high_amount"
    SUSPICIOUS_PATTERN = "suspicious_pattern"
    MANUAL_FLAG = "manual_flag"


class AnomalyStatus(str):
    OPEN = "open"
    INVESTIGATING = "investigating"
    RESOLVED = "resolved"
    FALSE_POSITIVE = "false_positive"
    ESCALATED = "escalated"


class AnomalySeverity(str):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AnomalyResponse(BaseModel):
    """Response for a single anomaly."""
    id: str
    entity_type: str
    entity_id: str
    payment_reference: Optional[str] = None
    service_request_id: Optional[str] = None
    service_request_reference: Optional[str] = None
    anomaly_type: str
    severity: str
    status: str
    title: str
    description: Optional[str] = None
    detection_rule: Optional[str] = None
    expected_amount: Optional[float] = None
    actual_amount: Optional[float] = None
    difference_amount: Optional[float] = None
    resolution_notes: Optional[str] = None
    resolved_at: Optional[str] = None
    resolved_by_name: Optional[str] = None
    detected_at: str
    detected_by: str
    updated_at: str


class AnomalySummary(BaseModel):
    """Summary counts by status."""
    open: int = 0
    investigating: int = 0
    resolved: int = 0
    false_positive: int = 0
    escalated: int = 0
    total: int = 0


class AnomalyListResponse(BaseModel):
    """List of anomalies with summary."""
    anomalies: List[AnomalyResponse]
    total: int
    page: int = 1
    page_size: int = 20
    summary: AnomalySummary


class AnomalyCreate(BaseModel):
    """Create anomaly request."""
    entity_type: str = Field(..., pattern="^(service_payment|bank_transaction|payment)$")
    entity_id: str
    anomaly_type: str
    severity: str = "medium"
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    expected_amount: Optional[float] = None
    actual_amount: Optional[float] = None


class AnomalyStatusUpdate(BaseModel):
    """Update anomaly status."""
    status: str
    comment: Optional[str] = None
    resolution_notes: Optional[str] = None


class AnomalyActionResponse(BaseModel):
    """Response after an action on anomaly."""
    id: str
    anomaly_id: str
    action: str
    from_status: Optional[str] = None
    to_status: Optional[str] = None
    comment: Optional[str] = None
    performed_by_name: Optional[str] = None
    performed_at: str


@router.get(
    "/treasury/anomalies",
    response_model=AnomalyListResponse,
    summary="List payment anomalies",
    description="""
    Get list of payment anomalies with filters.

    **Filters:**
    - status: Filter by anomaly status
    - severity: Filter by severity level
    - anomaly_type: Filter by type of anomaly
    - date_from / date_to: Filter by detection date range

    **Permissions:**
    - Requires 'treasury.anomalies.view' permission
    """
)
async def list_anomalies(
    status: Optional[str] = Query(None, description="Filter by status"),
    severity: Optional[str] = Query(None, description="Filter by severity"),
    anomaly_type: Optional[str] = Query(None, description="Filter by type"),
    date_from: Optional[date] = Query(None, description="Start date"),
    date_to: Optional[date] = Query(None, description="End date"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("treasury.anomalies.view"))
):
    """Get list of payment anomalies."""
    # Build dynamic WHERE clause
    where_clauses = ["1=1"]
    params = []
    param_idx = 1

    if status:
        where_clauses.append(f"pa.status::text = ${param_idx}")
        params.append(status)
        param_idx += 1

    if severity:
        where_clauses.append(f"pa.severity::text = ${param_idx}")
        params.append(severity)
        param_idx += 1

    if anomaly_type:
        where_clauses.append(f"pa.anomaly_type::text = ${param_idx}")
        params.append(anomaly_type)
        param_idx += 1

    if date_from:
        where_clauses.append(f"pa.detected_at >= ${param_idx}")
        params.append(date_from)
        param_idx += 1

    if date_to:
        where_clauses.append(f"pa.detected_at < ${param_idx} + INTERVAL '1 day'")
        params.append(date_to)
        param_idx += 1

    where_sql = " AND ".join(where_clauses)
    offset = (page - 1) * page_size

    # Main query
    query = f"""
        SELECT
            pa.id,
            pa.entity_type,
            pa.entity_id,
            pa.payment_reference,
            pa.service_request_id,
            sr.reference AS service_request_reference,
            pa.anomaly_type::text AS anomaly_type,
            pa.severity::text AS severity,
            pa.status::text AS status,
            pa.title,
            pa.description,
            pa.detection_rule,
            pa.expected_amount,
            pa.actual_amount,
            pa.difference_amount,
            pa.resolution_notes,
            pa.resolved_at,
            u.full_name AS resolved_by_name,
            pa.detected_at,
            pa.detected_by,
            pa.updated_at
        FROM payment_anomalies pa
        LEFT JOIN service_requests sr ON sr.id = pa.service_request_id
        LEFT JOIN users u ON u.id = pa.resolved_by
        WHERE {where_sql}
        ORDER BY
            CASE pa.status
                WHEN 'open' THEN 1
                WHEN 'investigating' THEN 2
                WHEN 'escalated' THEN 3
                ELSE 4
            END,
            CASE pa.severity
                WHEN 'critical' THEN 1
                WHEN 'high' THEN 2
                WHEN 'medium' THEN 3
                ELSE 4
            END,
            pa.detected_at DESC
        LIMIT ${param_idx} OFFSET ${param_idx + 1}
    """
    params.extend([page_size, offset])

    rows = await db.fetch(query, *params)

    # Get total count
    count_query = f"""
        SELECT COUNT(*) FROM payment_anomalies pa WHERE {where_sql}
    """
    total = await db.fetchval(count_query, *params[:param_idx - 1])

    # Get summary
    summary_query = """
        SELECT
            status::text,
            COUNT(*) as count
        FROM payment_anomalies
        GROUP BY status
    """
    summary_rows = await db.fetch(summary_query)
    summary = AnomalySummary()
    for row in summary_rows:
        setattr(summary, row["status"], row["count"])
        summary.total += row["count"]

    # Build response
    anomalies = []
    for row in rows:
        anomalies.append(AnomalyResponse(
            id=str(row["id"]),
            entity_type=row["entity_type"],
            entity_id=str(row["entity_id"]),
            payment_reference=row["payment_reference"],
            service_request_id=str(row["service_request_id"]) if row["service_request_id"] else None,
            service_request_reference=row["service_request_reference"],
            anomaly_type=row["anomaly_type"],
            severity=row["severity"],
            status=row["status"],
            title=row["title"],
            description=row["description"],
            detection_rule=row["detection_rule"],
            expected_amount=float(row["expected_amount"]) if row["expected_amount"] else None,
            actual_amount=float(row["actual_amount"]) if row["actual_amount"] else None,
            difference_amount=float(row["difference_amount"]) if row["difference_amount"] else None,
            resolution_notes=row["resolution_notes"],
            resolved_at=row["resolved_at"].isoformat() if row["resolved_at"] else None,
            resolved_by_name=row["resolved_by_name"],
            detected_at=row["detected_at"].isoformat(),
            detected_by=row["detected_by"],
            updated_at=row["updated_at"].isoformat(),
        ))

    return AnomalyListResponse(
        anomalies=anomalies,
        total=total or 0,
        page=page,
        page_size=page_size,
        summary=summary,
    )


@router.get(
    "/treasury/anomalies/{anomaly_id}",
    response_model=AnomalyResponse,
    summary="Get anomaly details",
    description="""
    Get detailed information for a specific anomaly.

    **Permissions:**
    - Requires 'treasury.anomalies.view' permission
    """
)
async def get_anomaly(
    anomaly_id: str = Path(..., description="Anomaly ID"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("treasury.anomalies.view"))
):
    """Get anomaly by ID."""
    row = await db.fetchrow("""
        SELECT
            pa.id,
            pa.entity_type,
            pa.entity_id,
            pa.payment_reference,
            pa.service_request_id,
            sr.reference AS service_request_reference,
            pa.anomaly_type::text AS anomaly_type,
            pa.severity::text AS severity,
            pa.status::text AS status,
            pa.title,
            pa.description,
            pa.detection_rule,
            pa.expected_amount,
            pa.actual_amount,
            pa.difference_amount,
            pa.resolution_notes,
            pa.resolved_at,
            u.full_name AS resolved_by_name,
            pa.detected_at,
            pa.detected_by,
            pa.updated_at
        FROM payment_anomalies pa
        LEFT JOIN service_requests sr ON sr.id = pa.service_request_id
        LEFT JOIN users u ON u.id = pa.resolved_by
        WHERE pa.id = $1::uuid
    """, anomaly_id)

    if not row:
        raise HTTPException(status_code=404, detail="Anomaly not found")

    return AnomalyResponse(
        id=str(row["id"]),
        entity_type=row["entity_type"],
        entity_id=str(row["entity_id"]),
        payment_reference=row["payment_reference"],
        service_request_id=str(row["service_request_id"]) if row["service_request_id"] else None,
        service_request_reference=row["service_request_reference"],
        anomaly_type=row["anomaly_type"],
        severity=row["severity"],
        status=row["status"],
        title=row["title"],
        description=row["description"],
        detection_rule=row["detection_rule"],
        expected_amount=float(row["expected_amount"]) if row["expected_amount"] else None,
        actual_amount=float(row["actual_amount"]) if row["actual_amount"] else None,
        difference_amount=float(row["difference_amount"]) if row["difference_amount"] else None,
        resolution_notes=row["resolution_notes"],
        resolved_at=row["resolved_at"].isoformat() if row["resolved_at"] else None,
        resolved_by_name=row["resolved_by_name"],
        detected_at=row["detected_at"].isoformat(),
        detected_by=row["detected_by"],
        updated_at=row["updated_at"].isoformat(),
    )


@router.post(
    "/treasury/anomalies",
    response_model=AnomalyResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create manual anomaly",
    description="""
    Create a new anomaly manually (flagged by agent).

    **Permissions:**
    - Requires 'treasury.anomalies.create' permission
    """
)
async def create_anomaly(
    body: AnomalyCreate,
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("treasury.anomalies.create"))
):
    """Create manual anomaly."""
    # Get payment reference if entity is service_payment
    payment_reference = None
    service_request_id = None
    if body.entity_type == "service_payment":
        payment = await db.fetchrow(
            "SELECT payment_reference, service_request_id FROM service_payments WHERE id = $1::uuid",
            body.entity_id
        )
        if payment:
            payment_reference = payment["payment_reference"]
            service_request_id = payment["service_request_id"]

    # Insert anomaly
    row = await db.fetchrow("""
        INSERT INTO payment_anomalies (
            entity_type, entity_id, payment_reference, service_request_id,
            anomaly_type, severity, title, description,
            expected_amount, actual_amount, detected_by
        ) VALUES (
            $1, $2::uuid, $3, $4,
            $5::anomaly_type_enum, $6::anomaly_severity_enum, $7, $8,
            $9, $10, $11
        )
        RETURNING id, detected_at, updated_at
    """,
        body.entity_type,
        body.entity_id,
        payment_reference,
        service_request_id,
        body.anomaly_type,
        body.severity,
        body.title,
        body.description,
        body.expected_amount,
        body.actual_amount,
        str(current_user["id"]),
    )

    # Record action
    await db.execute("""
        INSERT INTO anomaly_actions (anomaly_id, action, to_status, comment, performed_by)
        VALUES ($1, 'status_change', 'open', 'Anomalia creada manualmente', $2::uuid)
    """, row["id"], current_user["id"])

    return AnomalyResponse(
        id=str(row["id"]),
        entity_type=body.entity_type,
        entity_id=body.entity_id,
        payment_reference=payment_reference,
        service_request_id=str(service_request_id) if service_request_id else None,
        service_request_reference=None,
        anomaly_type=body.anomaly_type,
        severity=body.severity,
        status="open",
        title=body.title,
        description=body.description,
        detection_rule=None,
        expected_amount=body.expected_amount,
        actual_amount=body.actual_amount,
        difference_amount=abs(body.expected_amount - body.actual_amount) if body.expected_amount and body.actual_amount else None,
        resolution_notes=None,
        resolved_at=None,
        resolved_by_name=None,
        detected_at=row["detected_at"].isoformat(),
        detected_by=str(current_user["id"]),
        updated_at=row["updated_at"].isoformat(),
    )


@router.patch(
    "/treasury/anomalies/{anomaly_id}/status",
    response_model=AnomalyResponse,
    summary="Update anomaly status",
    description="""
    Update the status of an anomaly.

    **Valid transitions:**
    - open → investigating, resolved, false_positive, escalated
    - investigating → resolved, false_positive, escalated
    - escalated → resolved, false_positive

    **Permissions:**
    - Requires 'treasury.anomalies.update' permission
    """
)
async def update_anomaly_status(
    anomaly_id: str = Path(..., description="Anomaly ID"),
    body: AnomalyStatusUpdate = Body(...),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("treasury.anomalies.update"))
):
    """Update anomaly status."""
    # Get current anomaly
    current = await db.fetchrow(
        "SELECT status::text as status FROM payment_anomalies WHERE id = $1::uuid",
        anomaly_id
    )
    if not current:
        raise HTTPException(status_code=404, detail="Anomaly not found")

    from_status = current["status"]
    to_status = body.status

    # Validate transition
    valid_transitions = {
        "open": ["investigating", "resolved", "false_positive", "escalated"],
        "investigating": ["resolved", "false_positive", "escalated", "open"],
        "escalated": ["resolved", "false_positive", "investigating"],
        "resolved": [],
        "false_positive": [],
    }
    if to_status not in valid_transitions.get(from_status, []):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid transition from {from_status} to {to_status}"
        )

    # Update anomaly
    update_fields = ["status = $2::anomaly_status_enum", "updated_at = NOW()"]
    params = [anomaly_id, to_status]
    param_idx = 3

    if to_status in ("resolved", "false_positive"):
        if not body.resolution_notes:
            raise HTTPException(
                status_code=400,
                detail="Resolution notes required when resolving anomaly"
            )
        update_fields.append(f"resolved_at = NOW()")
        update_fields.append(f"resolved_by = ${param_idx}::uuid")
        params.append(current_user["id"])
        param_idx += 1
        update_fields.append(f"resolution_notes = ${param_idx}")
        params.append(body.resolution_notes)
        param_idx += 1

    await db.execute(f"""
        UPDATE payment_anomalies
        SET {', '.join(update_fields)}
        WHERE id = $1::uuid
    """, *params)

    # Record action
    await db.execute("""
        INSERT INTO anomaly_actions (anomaly_id, action, from_status, to_status, comment, performed_by)
        VALUES ($1::uuid, 'status_change', $2::anomaly_status_enum, $3::anomaly_status_enum, $4, $5::uuid)
    """, anomaly_id, from_status, to_status, body.comment, current_user["id"])

    # Return updated anomaly
    return await get_anomaly(anomaly_id, db, current_user, None)


@router.get(
    "/treasury/anomalies/{anomaly_id}/actions",
    response_model=List[AnomalyActionResponse],
    summary="Get anomaly action history",
    description="""
    Get the history of actions performed on an anomaly.

    **Permissions:**
    - Requires 'treasury.anomalies.view' permission
    """
)
async def get_anomaly_actions(
    anomaly_id: str = Path(..., description="Anomaly ID"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("treasury.anomalies.view"))
):
    """Get anomaly action history."""
    rows = await db.fetch("""
        SELECT
            aa.id,
            aa.anomaly_id,
            aa.action,
            aa.from_status::text AS from_status,
            aa.to_status::text AS to_status,
            aa.comment,
            u.full_name AS performed_by_name,
            aa.performed_at
        FROM anomaly_actions aa
        LEFT JOIN users u ON u.id = aa.performed_by
        WHERE aa.anomaly_id = $1::uuid
        ORDER BY aa.performed_at DESC
    """, anomaly_id)

    return [
        AnomalyActionResponse(
            id=str(row["id"]),
            anomaly_id=str(row["anomaly_id"]),
            action=row["action"],
            from_status=row["from_status"],
            to_status=row["to_status"],
            comment=row["comment"],
            performed_by_name=row["performed_by_name"],
            performed_at=row["performed_at"].isoformat(),
        )
        for row in rows
    ]


@router.post(
    "/treasury/anomalies/{anomaly_id}/comment",
    response_model=AnomalyActionResponse,
    summary="Add comment to anomaly",
    description="""
    Add a comment to an anomaly without changing its status.

    **Permissions:**
    - Requires 'treasury.anomalies.update' permission
    """
)
async def add_anomaly_comment(
    anomaly_id: str = Path(..., description="Anomaly ID"),
    body: Dict[str, str] = Body(..., example={"comment": "Comment text"}),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("treasury.anomalies.update"))
):
    """Add comment to anomaly."""
    comment = body.get("comment")
    if not comment:
        raise HTTPException(status_code=400, detail="Comment is required")

    # Verify anomaly exists
    exists = await db.fetchval(
        "SELECT 1 FROM payment_anomalies WHERE id = $1::uuid",
        anomaly_id
    )
    if not exists:
        raise HTTPException(status_code=404, detail="Anomaly not found")

    # Insert comment action
    row = await db.fetchrow("""
        INSERT INTO anomaly_actions (anomaly_id, action, comment, performed_by)
        VALUES ($1::uuid, 'comment', $2, $3::uuid)
        RETURNING id, performed_at
    """, anomaly_id, comment, current_user["id"])

    return AnomalyActionResponse(
        id=str(row["id"]),
        anomaly_id=anomaly_id,
        action="comment",
        from_status=None,
        to_status=None,
        comment=comment,
        performed_by_name=current_user.get("full_name"),
        performed_at=row["performed_at"].isoformat(),
    )


class AnomalyDetectionRequest(BaseModel):
    """Request to run anomaly detection."""
    detection_types: Optional[List[str]] = Field(
        None,
        description="Specific detection types to run. If null, runs all.",
        example=["duplicate_payment", "amount_mismatch"]
    )


class AnomalyDetectionResponse(BaseModel):
    """Response from anomaly detection run."""
    detected_at: str
    anomalies_found: int
    by_type: Dict[str, Any]


@router.post(
    "/treasury/anomalies/detect",
    response_model=AnomalyDetectionResponse,
    summary="Run anomaly detection",
    description="""
    Trigger automatic anomaly detection algorithms.

    **Detection types:**
    - duplicate_payment: Same user, amount, service within 24h
    - amount_mismatch: >1% difference between payment and bank transaction
    - orphan_transaction: Bank transactions without matching payments
    - late_validation: Payments exceeding 24h SLA threshold
    - suspicious_pattern: Users with 5+ payments in 24 hours

    **Permissions:**
    - Requires 'treasury.anomalies.create' permission
    """
)
async def run_anomaly_detection(
    body: Optional[AnomalyDetectionRequest] = Body(None),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("treasury.anomalies.create"))
):
    """Run automatic anomaly detection."""
    from app.modules.service_requests.services.treasury_anomaly_service import treasury_anomaly_service

    detection_types = body.detection_types if body else None

    try:
        results = await treasury_anomaly_service.run_detection(
            db=db,
            detection_types=detection_types
        )

        return AnomalyDetectionResponse(
            detected_at=results["detected_at"],
            anomalies_found=results["anomalies_found"],
            by_type=results["by_type"]
        )
    except Exception as e:
        logger.error(f"Anomaly detection failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Anomaly detection failed: {str(e)}"
        )


# ============================================================================
# TREASURY EXPORTS (Phase 2B)
# ============================================================================

class ExportType(str, Enum):
    """Export type enum matching DB."""
    SAGE_X3 = "sage_x3"
    MINISTRY_REPORT = "ministry_report"
    BANK_CENTRAL = "bank_central"
    AUDIT_REPORT = "audit_report"
    RECONCILIATION = "reconciliation"
    CUSTOM = "custom"


class ExportFormat(str, Enum):
    """Export format enum."""
    CSV = "csv"
    XLSX = "xlsx"
    PDF = "pdf"
    XML = "xml"
    JSON = "json"


class ExportStatus(str, Enum):
    """Export status enum matching DB."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class ExportFilters(BaseModel):
    """Filters for export generation."""
    ministry_id: Optional[str] = None
    payment_method: Optional[str] = None
    workflow_code: Optional[str] = None
    status: Optional[str] = None


class ExportCreateRequest(BaseModel):
    """Request to create a new export."""
    export_type: ExportType
    export_format: ExportFormat = ExportFormat.CSV
    period_start: str  # YYYY-MM-DD
    period_end: str  # YYYY-MM-DD
    filters: Optional[ExportFilters] = None
    template_code: Optional[str] = None

    @field_validator('period_start', 'period_end')
    @classmethod
    def validate_date_format(cls, v):
        try:
            datetime.strptime(v, '%Y-%m-%d')
        except ValueError:
            raise ValueError('Date must be in YYYY-MM-DD format')
        return v


class ExportResponse(BaseModel):
    """Export response model."""
    id: str
    export_type: str
    export_format: str
    period_start: str
    period_end: str
    filters: Optional[Dict[str, Any]] = None
    status: str
    progress_percentage: int = 0
    total_records: Optional[int] = None
    total_amount: Optional[float] = None
    currency: str = "XAF"
    file_name: Optional[str] = None
    file_size_bytes: Optional[int] = None
    error_message: Optional[str] = None
    requested_by_name: Optional[str] = None
    requested_at: str
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    download_count: int = 0


class ExportListResponse(BaseModel):
    """Response for export list."""
    exports: List[ExportResponse]
    total: int


class ExportTemplateResponse(BaseModel):
    """Export template response."""
    id: int
    code: str
    name: str
    export_type: str
    export_format: str
    description: Optional[str] = None
    is_active: bool = True


@router.get(
    "/treasury/exports",
    response_model=ExportListResponse,
    summary="List treasury exports",
    description="""
    List export jobs with filters.

    **Permissions:**
    - Requires 'treasury.exports.view' permission
    """
)
async def list_treasury_exports(
    status: Optional[ExportStatus] = Query(None, description="Filter by status"),
    export_type: Optional[ExportType] = Query(None, description="Filter by type"),
    period_start: Optional[str] = Query(None, description="Filter by period start (YYYY-MM-DD)"),
    period_end: Optional[str] = Query(None, description="Filter by period end (YYYY-MM-DD)"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("treasury.exports.view"))
):
    """List treasury exports with filters."""
    conditions = []
    params = []
    param_count = 0

    if status:
        param_count += 1
        conditions.append(f"te.status = ${param_count}::export_status_enum")
        params.append(status.value)

    if export_type:
        param_count += 1
        conditions.append(f"te.export_type = ${param_count}::export_type_enum")
        params.append(export_type.value)

    if period_start:
        param_count += 1
        conditions.append(f"te.period_start >= ${param_count}::date")
        params.append(period_start)

    if period_end:
        param_count += 1
        conditions.append(f"te.period_end <= ${param_count}::date")
        params.append(period_end)

    where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""

    # Count total
    count_query = f"""
        SELECT COUNT(*) FROM treasury_exports te
        {where_clause}
    """
    total = await db.fetchval(count_query, *params)

    # Fetch exports with pagination
    offset = (page - 1) * page_size
    param_count += 1
    limit_param = param_count
    param_count += 1
    offset_param = param_count

    query = f"""
        SELECT
            te.id,
            te.export_type::text,
            te.export_format,
            te.period_start,
            te.period_end,
            te.filters,
            te.status::text,
            te.progress_percentage,
            te.total_records,
            te.total_amount,
            te.currency,
            te.file_name,
            te.file_size_bytes,
            te.error_message,
            te.requested_at,
            te.started_at,
            te.completed_at,
            te.download_count,
            u.full_name as requested_by_name
        FROM treasury_exports te
        LEFT JOIN users u ON u.id = te.requested_by
        {where_clause}
        ORDER BY te.requested_at DESC
        LIMIT ${limit_param} OFFSET ${offset_param}
    """
    params.extend([page_size, offset])
    rows = await db.fetch(query, *params)

    exports = []
    for row in rows:
        exports.append(ExportResponse(
            id=str(row["id"]),
            export_type=row["export_type"],
            export_format=row["export_format"],
            period_start=row["period_start"].isoformat() if row["period_start"] else None,
            period_end=row["period_end"].isoformat() if row["period_end"] else None,
            filters=row["filters"],
            status=row["status"],
            progress_percentage=row["progress_percentage"] or 0,
            total_records=row["total_records"],
            total_amount=float(row["total_amount"]) if row["total_amount"] else None,
            currency=row["currency"] or "XAF",
            file_name=row["file_name"],
            file_size_bytes=row["file_size_bytes"],
            error_message=row["error_message"],
            requested_by_name=row["requested_by_name"],
            requested_at=row["requested_at"].isoformat() if row["requested_at"] else None,
            started_at=row["started_at"].isoformat() if row["started_at"] else None,
            completed_at=row["completed_at"].isoformat() if row["completed_at"] else None,
            download_count=row["download_count"] or 0,
        ))

    return ExportListResponse(exports=exports, total=total or 0)


@router.get(
    "/treasury/exports/templates",
    response_model=List[ExportTemplateResponse],
    summary="List export templates",
    description="""
    List available export templates.

    **Permissions:**
    - Requires 'treasury.exports.view' permission
    """
)
async def list_export_templates(
    export_type: Optional[ExportType] = Query(None, description="Filter by type"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("treasury.exports.view"))
):
    """List available export templates."""
    if export_type:
        rows = await db.fetch("""
            SELECT id, code, name_es, export_type::text, export_format, description_es, is_active
            FROM export_templates
            WHERE is_active = true AND export_type = $1::export_type_enum
            ORDER BY name_es
        """, export_type.value)
    else:
        rows = await db.fetch("""
            SELECT id, code, name_es, export_type::text, export_format, description_es, is_active
            FROM export_templates
            WHERE is_active = true
            ORDER BY export_type, name_es
        """)

    return [
        ExportTemplateResponse(
            id=row["id"],
            code=row["code"],
            name=row["name_es"],
            export_type=row["export_type"],
            export_format=row["export_format"],
            description=row["description_es"],
            is_active=row["is_active"],
        )
        for row in rows
    ]


@router.post(
    "/treasury/exports/generate",
    response_model=ExportResponse,
    status_code=201,
    summary="Generate new export",
    description="""
    Request generation of a new export. The export is generated synchronously
    and the file is available for download once the response is returned.

    **Permissions:**
    - Requires 'treasury.exports.create' permission

    **Export Types:**
    - sage_x3: SAGE X3 accounting integration (CSV format)
    - ministry_report: Ministry monthly report (PDF/XLSX)
    - bank_central: BEAC format
    - audit_report: Internal audit report
    - reconciliation: Bank reconciliation export
    - custom: Custom export

    **Formats:**
    - csv: Comma-separated values (SAGE X3 compatible)
    - xlsx: Microsoft Excel
    - pdf: PDF report (ministry_report only)
    - json: JSON format
    """
)
async def generate_treasury_export(
    request: ExportCreateRequest,
    background_tasks: BackgroundTasks,
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("treasury.exports.create"))
):
    """Generate a new treasury export."""
    from ..services.treasury_export_service import treasury_export_service

    # Validate period
    start_date = datetime.strptime(request.period_start, '%Y-%m-%d').date()
    end_date = datetime.strptime(request.period_end, '%Y-%m-%d').date()

    if end_date < start_date:
        raise HTTPException(
            status_code=400,
            detail="period_end must be >= period_start"
        )

    # Validate format for export type
    if request.export_type.value == "ministry_report" and request.export_format.value not in ["pdf", "xlsx"]:
        request.export_format = ExportFormat.PDF

    # Generate filename using DB function
    file_name = await db.fetchval("""
        SELECT generate_export_filename($1::export_type_enum, $2::date, $3::date, $4)
    """, request.export_type.value, start_date, end_date, request.export_format.value)

    # Insert export request
    filters_json = request.filters.model_dump() if request.filters else None

    row = await db.fetchrow("""
        INSERT INTO treasury_exports (
            export_type, export_format, period_start, period_end,
            filters, status, requested_by, file_name
        )
        VALUES (
            $1::export_type_enum, $2, $3::date, $4::date,
            $5::jsonb, 'pending'::export_status_enum, $6::uuid, $7
        )
        RETURNING
            id, export_type::text, export_format, period_start, period_end,
            filters, status::text, progress_percentage, requested_at
    """, request.export_type.value, request.export_format.value,
        start_date, end_date, json.dumps(filters_json) if filters_json else None,
        current_user["id"], file_name)

    export_id = str(row["id"])

    # Generate export file synchronously (could be moved to background task for large exports)
    try:
        result = await treasury_export_service.generate_export(
            db=db,
            export_id=export_id,
            export_type=request.export_type.value,
            export_format=request.export_format.value,
            period_start=start_date,
            period_end=end_date,
            filters=filters_json,
            requested_by=current_user["id"],
        )

        # Fetch updated record
        updated_row = await db.fetchrow("""
            SELECT
                id, export_type::text, export_format, period_start, period_end,
                filters, status::text, progress_percentage, total_records,
                total_amount, currency, file_name, file_size_bytes,
                requested_at, completed_at
            FROM treasury_exports
            WHERE id = $1::uuid
        """, export_id)

        return ExportResponse(
            id=str(updated_row["id"]),
            export_type=updated_row["export_type"],
            export_format=updated_row["export_format"],
            period_start=updated_row["period_start"].isoformat(),
            period_end=updated_row["period_end"].isoformat(),
            filters=updated_row["filters"],
            status=updated_row["status"],
            progress_percentage=updated_row["progress_percentage"] or 100,
            total_records=updated_row["total_records"],
            total_amount=float(updated_row["total_amount"]) if updated_row["total_amount"] else None,
            currency=updated_row["currency"] or "XAF",
            file_name=updated_row["file_name"],
            file_size_bytes=updated_row["file_size_bytes"],
            requested_by_name=current_user.get("full_name"),
            requested_at=updated_row["requested_at"].isoformat(),
            completed_at=updated_row["completed_at"].isoformat() if updated_row["completed_at"] else None,
        )

    except Exception as e:
        # Return with error status
        error_row = await db.fetchrow("""
            SELECT
                id, export_type::text, export_format, period_start, period_end,
                filters, status::text, progress_percentage, error_message,
                requested_at
            FROM treasury_exports
            WHERE id = $1::uuid
        """, export_id)

        return ExportResponse(
            id=str(error_row["id"]),
            export_type=error_row["export_type"],
            export_format=error_row["export_format"],
            period_start=error_row["period_start"].isoformat(),
            period_end=error_row["period_end"].isoformat(),
            filters=error_row["filters"],
            status=error_row["status"],
            progress_percentage=error_row["progress_percentage"] or 0,
            error_message=error_row["error_message"],
            requested_by_name=current_user.get("full_name"),
            requested_at=error_row["requested_at"].isoformat(),
        )


@router.get(
    "/treasury/exports/{export_id}",
    response_model=ExportResponse,
    summary="Get export details",
    description="""
    Get details of a specific export.

    **Permissions:**
    - Requires 'treasury.exports.view' permission
    """
)
async def get_treasury_export(
    export_id: str = Path(..., description="Export ID"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("treasury.exports.view"))
):
    """Get treasury export details."""
    row = await db.fetchrow("""
        SELECT
            te.id,
            te.export_type::text,
            te.export_format,
            te.period_start,
            te.period_end,
            te.filters,
            te.status::text,
            te.progress_percentage,
            te.total_records,
            te.total_amount,
            te.currency,
            te.file_name,
            te.file_size_bytes,
            te.error_message,
            te.requested_at,
            te.started_at,
            te.completed_at,
            te.download_count,
            u.full_name as requested_by_name
        FROM treasury_exports te
        LEFT JOIN users u ON u.id = te.requested_by
        WHERE te.id = $1::uuid
    """, export_id)

    if not row:
        raise HTTPException(status_code=404, detail="Export not found")

    return ExportResponse(
        id=str(row["id"]),
        export_type=row["export_type"],
        export_format=row["export_format"],
        period_start=row["period_start"].isoformat() if row["period_start"] else None,
        period_end=row["period_end"].isoformat() if row["period_end"] else None,
        filters=row["filters"],
        status=row["status"],
        progress_percentage=row["progress_percentage"] or 0,
        total_records=row["total_records"],
        total_amount=float(row["total_amount"]) if row["total_amount"] else None,
        currency=row["currency"] or "XAF",
        file_name=row["file_name"],
        file_size_bytes=row["file_size_bytes"],
        error_message=row["error_message"],
        requested_by_name=row["requested_by_name"],
        requested_at=row["requested_at"].isoformat() if row["requested_at"] else None,
        started_at=row["started_at"].isoformat() if row["started_at"] else None,
        completed_at=row["completed_at"].isoformat() if row["completed_at"] else None,
        download_count=row["download_count"] or 0,
    )


@router.get(
    "/treasury/exports/{export_id}/download",
    summary="Download export file",
    description="""
    Download the generated export file.

    **Permissions:**
    - Requires 'treasury.exports.download' permission

    Returns the file as a streaming response.
    """
)
async def download_treasury_export(
    export_id: str = Path(..., description="Export ID"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("treasury.exports.download"))
):
    """Download treasury export file."""
    # Get export details
    row = await db.fetchrow("""
        SELECT
            id, status::text, file_path, file_name, file_mime_type, export_format
        FROM treasury_exports
        WHERE id = $1::uuid
    """, export_id)

    if not row:
        raise HTTPException(status_code=404, detail="Export not found")

    if row["status"] != "completed":
        raise HTTPException(
            status_code=400,
            detail=f"Export is not ready for download. Status: {row['status']}"
        )

    if not row["file_path"]:
        raise HTTPException(
            status_code=404,
            detail="Export file not found"
        )

    # Update download count
    await db.execute("""
        UPDATE treasury_exports
        SET download_count = download_count + 1,
            downloaded_at = NOW(),
            downloaded_by = $2::uuid
        WHERE id = $1::uuid
    """, export_id, current_user["id"])

    # Determine MIME type
    mime_types = {
        "csv": "text/csv",
        "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "pdf": "application/pdf",
        "xml": "application/xml",
        "json": "application/json",
    }
    content_type = row["file_mime_type"] or mime_types.get(row["export_format"], "application/octet-stream")

    # Get signed download URL from Firebase Storage
    file_path = row["file_path"]
    download_url = file_path  # Default to path

    if file_path and file_path.startswith("treasury-exports/"):
        try:
            from app.modules.service_requests.services.treasury_export_service import treasury_export_service
            download_url = await treasury_export_service.get_download_url(
                file_path=file_path,
                expiration_hours=24
            )
        except Exception as e:
            logger.error(f"Failed to get download URL: {e}")
            # Fall back to returning the path
            download_url = file_path

    return {
        "file_name": row["file_name"] or f"export_{export_id}.{row['export_format']}",
        "download_url": download_url,
        "content_type": content_type,
        "expires_in_hours": 24
    }


# ═══════════════════════════════════════════════════════════════
# TREASURY ANALYTICS (Phase 5)
# Advanced statistical analysis with pandas/scipy/sklearn
# ═══════════════════════════════════════════════════════════════

from app.modules.service_requests.models.analytics_models import (
    StatisticsResponse,
    CorrelationMatrix,
    TrendsResponse,
    AnomaliesResponse as AnalyticsAnomaliesResponse,
    PredictionsResponse,
    AnalyticsReport,
)
from app.modules.service_requests.services.treasury_analytics import treasury_analytics_service


@router.get(
    "/treasury/analytics/statistics",
    response_model=StatisticsResponse,
    summary="Get Descriptive Statistics",
    description="""
    Get descriptive statistics for treasury metrics.

    **Metrics analyzed:**
    - total_amount: Revenue statistics
    - transaction_count: Volume statistics
    - avg_processing_minutes: Processing time statistics

    **Returns:**
    - count, mean, median, std, min, max, q1, q3, iqr

    **Permissions:**
    - Requires 'treasury.stats.view' permission
    """
)
async def get_analytics_statistics(
    period: str = Query("month", regex="^(day|week|month|year)$"),
    date_from: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("treasury.stats.view"))
):
    """Get descriptive statistics for treasury data."""
    return await treasury_analytics_service.get_statistics(
        db=db,
        period=period,
        date_from=date_from,
        date_to=date_to,
    )


@router.get(
    "/treasury/analytics/correlations",
    response_model=CorrelationMatrix,
    summary="Get Correlation Matrix",
    description="""
    Get Pearson correlations between treasury metrics.

    **Pairs analyzed:**
    - total_amount ↔ transaction_count
    - total_amount ↔ avg_processing_minutes
    - transaction_count ↔ avg_processing_minutes

    **Returns:**
    - Correlation coefficient (-1 to 1)
    - P-value (statistical significance)
    - Strength interpretation (weak/moderate/strong)

    **Permissions:**
    - Requires 'treasury.stats.view' permission
    """
)
async def get_analytics_correlations(
    period: str = Query("month", regex="^(day|week|month|year)$"),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("treasury.stats.view"))
):
    """Get correlation analysis for treasury data."""
    return await treasury_analytics_service.get_correlations(
        db=db,
        period=period,
        date_from=date_from,
        date_to=date_to,
    )


@router.get(
    "/treasury/analytics/trends",
    response_model=TrendsResponse,
    summary="Get Trend Analysis",
    description="""
    Get trend analysis using linear regression.

    **Metrics analyzed:**
    - total_amount: Revenue trend
    - transaction_count: Volume trend

    **Returns:**
    - Slope and intercept of trend line
    - R-squared (model fit quality)
    - Direction (declining/stable/growing)
    - 7-day and 30-day projections

    **Permissions:**
    - Requires 'treasury.stats.view' permission
    """
)
async def get_analytics_trends(
    period: str = Query("month", regex="^(day|week|month|year)$"),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("treasury.stats.view"))
):
    """Get trend analysis for treasury data."""
    return await treasury_analytics_service.get_trends(
        db=db,
        period=period,
        date_from=date_from,
        date_to=date_to,
    )


@router.get(
    "/treasury/analytics/anomalies",
    response_model=AnalyticsAnomaliesResponse,
    summary="Get Statistical Anomalies",
    description="""
    Detect statistical anomalies using Z-score method.

    **Detection method:**
    - Z-score > 2 or < -2 indicates anomaly
    - Applied to: total_amount, transaction_count

    **Returns:**
    - List of anomaly points with dates
    - Z-score and deviation percentage
    - Anomaly type (high/low)

    **Permissions:**
    - Requires 'treasury.stats.view' permission
    """
)
async def get_analytics_anomalies(
    period: str = Query("month", regex="^(day|week|month|year)$"),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("treasury.stats.view"))
):
    """Get statistical anomalies in treasury data."""
    return await treasury_analytics_service.get_anomalies(
        db=db,
        period=period,
        date_from=date_from,
        date_to=date_to,
    )


@router.get(
    "/treasury/analytics/predictions",
    response_model=PredictionsResponse,
    summary="Get Revenue Predictions",
    description="""
    Get revenue predictions using linear regression.

    **Model:**
    - Linear regression on historical daily revenue
    - Confidence intervals at 95% level

    **Parameters:**
    - horizon_days: Number of days to predict (1-90)

    **Returns:**
    - Predicted values with confidence intervals
    - Model R-squared (quality indicator)
    - Warning if R² < 0.7

    **Permissions:**
    - Requires 'treasury.stats.view' permission
    """
)
async def get_analytics_predictions(
    period: str = Query("month", regex="^(day|week|month|year)$"),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    horizon_days: int = Query(7, ge=1, le=90, description="Days to predict"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("treasury.stats.view"))
):
    """Get revenue predictions."""
    return await treasury_analytics_service.get_predictions(
        db=db,
        period=period,
        date_from=date_from,
        date_to=date_to,
        horizon_days=horizon_days,
    )


@router.get(
    "/treasury/analytics/report",
    response_model=AnalyticsReport,
    summary="Get Complete Analytics Report",
    description="""
    Get comprehensive analytics report with all analyses.

    **Includes:**
    - Descriptive statistics
    - Correlation analysis
    - Trend analysis with projections
    - Anomaly detection
    - Revenue predictions
    - Automated findings and recommendations

    **Fixed Variables Analyzed:**
    - total_amount (revenue)
    - transaction_count (volume)
    - avg_processing_minutes (performance)
    - sla_respect_rate (quality)

    **Report sections:**
    - Executive summary with health score
    - Detailed analysis per metric
    - Findings with severity levels
    - Business recommendations

    **Permissions:**
    - Requires 'treasury.stats.view' permission
    """
)
async def get_analytics_report(
    period: str = Query("month", regex="^(day|week|month|year)$"),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    language: str = Query("es", regex="^(es|fr|en)$", description="Report language"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("treasury.stats.view"))
):
    """Get complete analytics report."""
    return await treasury_analytics_service.generate_report(
        db=db,
        period=period,
        date_from=date_from,
        date_to=date_to,
        language=language,
    )


@router.get(
    "/treasury/analytics/explore",
    summary="Explore Custom Variables",
    description="""
    Explore correlations and statistics for custom variable pairs.

    **Use case:**
    - Ad-hoc investigation
    - Custom correlation analysis
    - Detailed metric exploration

    **Available variables:**
    - total_amount, transaction_count, avg_processing_minutes
    - success_rate, sla_respect_rate, workload_score

    **Permissions:**
    - Requires 'treasury.stats.view' permission
    """
)
async def explore_analytics(
    primary_variable: str = Query(..., description="Primary variable to analyze"),
    secondary_variable: Optional[str] = Query(None, description="Variable for correlation"),
    period: str = Query("month", regex="^(day|week|month|year)$"),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("treasury.stats.view"))
):
    """Explore custom variable analysis."""
    # Validate variables
    valid_variables = [
        "total_amount", "transaction_count", "avg_processing_minutes",
        "success_count", "failed_count"
    ]

    if primary_variable not in valid_variables:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid primary_variable. Must be one of: {valid_variables}"
        )

    if secondary_variable and secondary_variable not in valid_variables:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid secondary_variable. Must be one of: {valid_variables}"
        )

    # Get data
    df = await treasury_analytics_service.get_kpi_data(
        db=db,
        period=period,
        date_from=date_from,
        date_to=date_to,
    )

    if df.empty:
        return {
            "primary_variable": primary_variable,
            "secondary_variable": secondary_variable,
            "period": period,
            "statistics": None,
            "trend": None,
            "correlation": None,
            "anomalies": [],
            "message": "No data available for the selected period"
        }

    # Calculate statistics for primary variable
    stats = treasury_analytics_service.calculate_descriptive_stats(df, [primary_variable])

    # Calculate trend for primary variable
    trend = treasury_analytics_service.analyze_trend(df, "report_date", primary_variable)

    # Calculate anomalies for primary variable
    anomalies = treasury_analytics_service.detect_anomalies(
        df, "report_date", primary_variable,
        treasury_analytics_service.THRESHOLDS["anomaly"]["z_score"]
    )

    # Calculate correlation if secondary variable provided
    correlation = None
    if secondary_variable:
        correlations = treasury_analytics_service.calculate_correlations(
            df, [primary_variable, secondary_variable]
        )
        if correlations:
            correlation = correlations[0]

    return {
        "primary_variable": primary_variable,
        "secondary_variable": secondary_variable,
        "period": period,
        "date_from": date_from or (df["report_date"].min().strftime("%Y-%m-%d") if not df.empty else None),
        "date_to": date_to or (df["report_date"].max().strftime("%Y-%m-%d") if not df.empty else None),
        "statistics": stats[0].model_dump() if stats else None,
        "trend": trend.model_dump() if trend else None,
        "correlation": correlation.model_dump() if correlation else None,
        "anomalies": [a.model_dump() for a in anomalies],
        "total_records": len(df)
    }
