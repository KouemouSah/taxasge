"""OMS Agent Routes — Post-payment processing queue for ministry/polyvalent agents.

Prefix: /api/v1/oms

NOT for payment validation (that's the existing treasury pipeline via service_payments).
These endpoints handle post-TESORO obligation processing: agent queue, process, reject.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Any, Dict, Optional
from uuid import UUID

from app.database.connection import get_database
from app.modules.auth.middleware.auth_middleware import get_current_user
from app.modules.permissions.middleware.permission_middleware import permission_required
from app.modules.fiscal_services.models.licenses import (
    AgentQueueItem,
    AgentQueueResponse,
    AgentQueueStats,
    ObligationResponse,
    ProcessObligationRequest,
    RejectObligationRequest,
    BatchProcessRequest,
    ComplianceEventResponse,
    ComplianceEventListResponse,
)
from app.modules.fiscal_services.services.oms_agent_service import OmsAgentService
from app.modules.fiscal_services.services.license_service import LicenseService


router = APIRouter(prefix="/oms", tags=["OMS Agent Processing"])


# ============================================================
# Static paths BEFORE dynamic /{id}
# ============================================================


@router.get("/queue", response_model=AgentQueueResponse)
async def get_agent_queue(
    status: Optional[str] = Query(None, description="Filter: processing, paid, completed"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db=Depends(get_database),
    current_user: Dict[str, Any] = Depends(get_current_user),
    _: None = Depends(permission_required("fiscal_service.process_obligations")),
):
    """Get agent's obligation queue, auto-filtered by entity scope.

    Ministry agents (Mode A): see only obligations matching their ministry_id.
    Polyvalent agents (Mode B): see all consolidated obligations.
    """
    try:
        items, total = await OmsAgentService.get_queue(
            db, UUID(current_user.id),
            status=status,
            page=page, page_size=page_size,
        )
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))

    return AgentQueueResponse(
        items=[AgentQueueItem(**item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/queue/stats", response_model=AgentQueueStats)
async def get_agent_queue_stats(
    db=Depends(get_database),
    current_user: Dict[str, Any] = Depends(get_current_user),
    _: None = Depends(permission_required("fiscal_service.process_obligations")),
):
    """Agent OMS dashboard stats: pending count, completed today, amounts."""
    try:
        stats = await OmsAgentService.get_queue_stats(
            db, UUID(current_user.id),
        )
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))

    return AgentQueueStats(**stats)


# ============================================================
# Batch — static path before /{obligation_id}
# ============================================================


@router.post("/obligations/batch-process")
async def batch_process_obligations(
    data: BatchProcessRequest,
    db=Depends(get_database),
    current_user: Dict[str, Any] = Depends(get_current_user),
    _: None = Depends(permission_required("fiscal_service.process_obligations")),
):
    """Batch process multiple obligations (processing -> completed).

    All obligations must be in the agent's scope (IDOR protection).
    Single counter refresh per affected license for efficiency.
    """
    try:
        async with db.transaction():
            result = await OmsAgentService.batch_process(
                db, data.obligation_ids, UUID(current_user.id),
                issued_document_id=data.issued_document_id,
            )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    return result


# ============================================================
# Dynamic paths — /obligations/{obligation_id}
# ============================================================


@router.get("/obligations/{obligation_id}", response_model=ObligationResponse)
async def get_obligation_detail(
    obligation_id: UUID,
    db=Depends(get_database),
    current_user: Dict[str, Any] = Depends(get_current_user),
    _: None = Depends(permission_required("fiscal_service.process_obligations")),
):
    """Get obligation detail — IDOR-protected by agent scope.

    Agents can only view obligations in their ministry/mode scope.
    Allows viewing in any status (not just 'processing').
    """
    try:
        obligation, _ctx = await OmsAgentService._validate_obligation_scope(
            db, obligation_id, UUID(current_user.id),
            require_processing=False,
        )
    except ValueError as e:
        err = str(e)
        if "not found" in err:
            raise HTTPException(status_code=404, detail=err)
        raise HTTPException(status_code=403, detail=err)
    return ObligationResponse(**obligation)


@router.post("/obligations/{obligation_id}/process", response_model=ObligationResponse)
async def process_obligation(
    obligation_id: UUID,
    data: ProcessObligationRequest,
    db=Depends(get_database),
    current_user: Dict[str, Any] = Depends(get_current_user),
    _: None = Depends(permission_required("fiscal_service.process_obligations")),
):
    """Process obligation: processing -> completed.

    Validates IDOR scope (agent can only process obligations in their ministry/mode).
    Optionally attaches an issued document.
    Logs agent_approved + document_issued events.
    """
    try:
        async with db.transaction():
            result = await OmsAgentService.process_obligation(
                db, obligation_id, UUID(current_user.id),
                issued_document_id=data.issued_document_id,
                notes=data.notes,
            )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    if not result:
        raise HTTPException(status_code=404, detail="Obligation not found")
    return ObligationResponse(**result)


@router.post("/obligations/{obligation_id}/reject", response_model=ObligationResponse)
async def reject_obligation(
    obligation_id: UUID,
    data: RejectObligationRequest,
    db=Depends(get_database),
    current_user: Dict[str, Any] = Depends(get_current_user),
    _: None = Depends(permission_required("fiscal_service.process_obligations")),
):
    """Reject obligation: processing -> paid (re-routable).

    The obligation returns to 'paid' status and can be re-routed or re-processed.
    Logs agent_rejected event with reason.
    """
    try:
        async with db.transaction():
            result = await OmsAgentService.reject_obligation(
                db, obligation_id, UUID(current_user.id),
                reason=data.reason,
            )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    if not result:
        raise HTTPException(status_code=404, detail="Obligation not found")
    return ObligationResponse(**result)


@router.get("/obligations/{obligation_id}/events", response_model=ComplianceEventListResponse)
async def get_obligation_events(
    obligation_id: UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db=Depends(get_database),
    current_user: Dict[str, Any] = Depends(get_current_user),
    _: None = Depends(permission_required("fiscal_service.process_obligations")),
):
    """Get compliance events for a specific obligation — IDOR-protected."""
    try:
        obligation, _ctx = await OmsAgentService._validate_obligation_scope(
            db, obligation_id, UUID(current_user.id),
            require_processing=False,
        )
    except ValueError as e:
        err = str(e)
        if "not found" in err:
            raise HTTPException(status_code=404, detail=err)
        raise HTTPException(status_code=403, detail=err)

    events, total = await LicenseService.list_events(
        db, obligation["license_id"],
        obligation_id=obligation_id,
        page=page, page_size=page_size,
    )
    return ComplianceEventListResponse(
        items=[ComplianceEventResponse(**e) for e in events],
        total=total,
        page=page,
        page_size=page_size,
    )
