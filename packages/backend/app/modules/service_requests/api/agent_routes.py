"""
Agent Routes for Service Requests.

RESTful endpoints for agents to process service requests.
Includes queue management, approval/rejection, and appointment scheduling.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path, Body
from typing import List, Optional
from uuid import UUID
from datetime import date, time, datetime
import asyncpg

from pydantic import BaseModel, Field

from app.database.connection import get_database
from app.modules.auth.middleware.auth_middleware import get_current_user
from app.modules.permissions.middleware.permission_middleware import permission_required
from ..services.agent_queue_service import agent_queue_service
from ..services.appointment_scheduler import appointment_scheduler
from ..services.service_request_service import service_request_service
from ..services.workflow_engine import workflow_engine
from ..models.service_request import ServiceRequestResponse
from app.core.events import EventBus, EventType


router = APIRouter(
    prefix="/agent/service-requests",
    tags=["Agent - Service Requests"]
)


# ═══════════════════════════════════════════════════════════════
# PYDANTIC MODELS FOR AGENT ACTIONS
# ═══════════════════════════════════════════════════════════════

class AgentDecision(BaseModel):
    """Agent decision on a service request"""
    decision: str = Field(
        ...,
        pattern="^(approve|reject|request_documents)$",
        description="Decision: approve, reject, or request_documents"
    )
    comments: Optional[str] = Field(None, max_length=2000)
    rejection_reason: Optional[str] = Field(None, max_length=500)
    requested_documents: Optional[List[str]] = Field(
        default=None,
        description="List of document codes to request"
    )


class AppointmentSchedule(BaseModel):
    """Manual appointment scheduling"""
    appointment_date: date
    appointment_time: time
    location: Optional[str] = None
    notes: Optional[str] = None


class EscalationRequest(BaseModel):
    """Escalation request"""
    reason: str = Field(..., min_length=10, max_length=500)
    priority_boost: int = Field(default=10, ge=0, le=50)


class QueueItemResponse(BaseModel):
    """Queue item with service request details"""
    queue_id: str
    item_type: str
    item_id: str
    workflow_code: str
    reference_number: str
    citizen_name: str
    priority_score: float
    sla_deadline: Optional[str]
    sla_status: str
    status: str
    assigned_to: Optional[str]
    created_at: str


class QueueStatsResponse(BaseModel):
    """Queue statistics"""
    pending: int
    assigned: int
    completed_today: int
    escalated: int
    sla_violations: int
    avg_processing_hours: float


# ═══════════════════════════════════════════════════════════════
# QUEUE MANAGEMENT
# ═══════════════════════════════════════════════════════════════

@router.get(
    "/queue",
    response_model=List[QueueItemResponse],
    summary="Get pending queue items",
    description="""
    Get pending service request items from the work queue.

    Returns items ordered by priority (highest first) and creation time.
    Only shows items from the agent's assigned ministry/entity.

    **Pagination:**
    - Use `page` and `page_size` for paginated results
    - Default returns all items (no limit) for agent visibility
    """
)
async def get_queue(
    entity_code: Optional[str] = Query(None, description="Filter by entity code"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(1000, ge=1, description="Items per page (default: all)"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("service_request.view_queue"))
):
    # Calculate offset for pagination
    offset = (page - 1) * page_size

    items = await agent_queue_service.get_pending_items(
        db=db,
        entity_code=entity_code,
        limit=page_size,
        offset=offset
    )

    result = []
    for item in items:
        sla_status = "on_track"
        if item.get('sla_deadline'):
            from datetime import datetime
            deadline = item['sla_deadline']
            now = datetime.utcnow()
            if deadline.replace(tzinfo=None) < now:
                sla_status = "violated"
            elif (deadline.replace(tzinfo=None) - now).total_seconds() < 6 * 3600:
                sla_status = "at_risk"

        result.append(QueueItemResponse(
            queue_id=str(item['id']),
            item_type=item['item_type'],
            item_id=item['item_id'],
            workflow_code=item.get('workflow_code', item.get('declaration_type', '')),
            reference_number=item.get('reference_number', ''),
            citizen_name=item.get('citizen_name', 'Unknown'),
            priority_score=float(item.get('priority_score', 0)),
            sla_deadline=item['sla_deadline'].isoformat() if item.get('sla_deadline') else None,
            sla_status=sla_status,
            status=item['status'],
            assigned_to=item.get('assigned_to'),
            created_at=item['created_at'].isoformat()
        ))

    return result


@router.get(
    "/queue/stats",
    response_model=QueueStatsResponse,
    summary="Get queue statistics",
    description="Get statistics about the current queue status."
)
async def get_queue_stats(
    entity_code: Optional[str] = Query(None, description="Filter by entity code"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("service_request.view_queue_stats"))
):
    stats = await agent_queue_service.get_queue_stats(
        db=db,
        entity_code=entity_code
    )
    return QueueStatsResponse(**stats)


@router.get(
    "/my-queue",
    response_model=List[QueueItemResponse],
    summary="Get my assigned items",
    description="""
    Get all queue items currently assigned to the authenticated agent.

    **Pagination:**
    - Use `page` and `page_size` for paginated results
    - Default returns all assigned items (no limit)
    """
)
async def get_my_queue(
    include_completed: bool = Query(False, description="Include completed items"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(1000, ge=1, description="Items per page (default: all)"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("service_request.process"))
):
    # Calculate offset for pagination
    offset = (page - 1) * page_size

    items = await agent_queue_service.get_agent_queue(
        db=db,
        agent_id=str(current_user.id),
        include_completed=include_completed,
        limit=page_size,
        offset=offset
    )

    result = []
    for item in items:
        sla_status = "on_track"
        if item.get('sla_deadline'):
            from datetime import datetime
            deadline = item['sla_deadline']
            now = datetime.utcnow()
            if deadline.replace(tzinfo=None) < now:
                sla_status = "violated"
            elif (deadline.replace(tzinfo=None) - now).total_seconds() < 6 * 3600:
                sla_status = "at_risk"

        result.append(QueueItemResponse(
            queue_id=str(item['id']),
            item_type=item['item_type'],
            item_id=item['item_id'],
            workflow_code=item.get('workflow_code', item.get('declaration_type', '')),
            reference_number=item.get('reference_number', ''),
            citizen_name=item.get('citizen_name', 'Unknown'),
            priority_score=float(item.get('priority_score', 0)),
            sla_deadline=item['sla_deadline'].isoformat() if item.get('sla_deadline') else None,
            sla_status=sla_status,
            status=item['status'],
            assigned_to=item.get('assigned_to'),
            created_at=item['created_at'].isoformat()
        ))

    return result


# ═══════════════════════════════════════════════════════════════
# ITEM MANAGEMENT
# ═══════════════════════════════════════════════════════════════

@router.post(
    "/queue/{queue_id}/release",
    summary="Release queue item for reassignment",
    description="""
    Release an assigned queue item back to the pending queue.

    This will trigger auto-assignment to find a new agent.
    Use this when you cannot complete the assigned task.
    """
)
async def release_item(
    queue_id: str = Path(..., description="Queue item ID"),
    reason: Optional[str] = Body(None, embed=True),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("service_request.process"))
):
    # Get queue item info before releasing
    queue_item = await db.fetchrow(
        "SELECT item_id FROM agent_work_queue WHERE id = $1 AND assigned_to = $2",
        queue_id, str(current_user.id)
    )

    if not queue_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Queue item not found or not assigned to you"
        )

    # Release the queue item
    await db.execute("""
        UPDATE agent_work_queue
        SET assigned_to = NULL,
            status = 'pending',
            updated_at = NOW()
        WHERE id = $1
        AND assigned_to = $2
    """, queue_id, str(current_user.id))

    # Also update service_request
    await db.execute("""
        UPDATE service_requests
        SET assigned_to = NULL,
            assigned_at = NULL,
            status = 'SUBMITTED',
            updated_at = NOW()
        WHERE id = $1
    """, queue_item['item_id'])

    # Cancel the assignment record
    await db.execute("""
        UPDATE assignments
        SET status = 'cancelled',
            notes = COALESCE(notes, '') || ' [Released by agent: ' || COALESCE($2, 'no reason') || ']',
            updated_at = NOW()
        WHERE item_id = $1
        AND status IN ('assigned', 'in_progress')
    """, queue_item['item_id'], reason)

    # TODO: Trigger auto-assignment for the released item
    # This could be done via event bus or directly here

    return {"message": "Item released back to queue for reassignment"}


# ═══════════════════════════════════════════════════════════════
# SERVICE REQUEST PROCESSING
# ═══════════════════════════════════════════════════════════════

@router.get(
    "/{request_id}",
    response_model=ServiceRequestResponse,
    summary="Get service request details (agent view)",
    description="""
    Get complete details of a service request for agent review.

    Includes all documents, extraction data, form data, and validation status.
    """
)
async def get_request_for_review(
    request_id: UUID = Path(..., description="Service request ID"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("service_request.view"))
):
    # Agents can view any request assigned to their ministry
    request = await db.fetchrow("""
        SELECT * FROM service_requests WHERE id = $1
    """, request_id)

    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service request not found"
        )

    # Use service to get full response
    return await service_request_service.get_request(
        db=db,
        request_id=request_id,
        user_id=request['user_id'],  # Use request owner's context
        is_agent=True  # Flag to skip ownership check
    )


@router.post(
    "/{request_id}/decision",
    summary="Make decision on service request",
    description="""
    Approve, reject, or request additional documents for a service request.

    **Approve:** Validates the dossier and proceeds to next workflow step.
    **Reject:** Rejects the request with a reason.
    **Request Documents:** Asks citizen for additional/corrected documents.
    """
)
async def make_decision(
    request_id: UUID = Path(..., description="Service request ID"),
    decision: AgentDecision = Body(...),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("service_request.process"))
):
    # Verify agent is assigned to this request
    queue_item = await db.fetchrow("""
        SELECT * FROM agent_work_queue
        WHERE item_id = $1
        AND item_type = 'service_request'
        AND assigned_to = $2
        AND status = 'assigned'
    """, str(request_id), str(current_user.id))

    if not queue_item:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This request is not assigned to you"
        )

    request = await db.fetchrow("""
        SELECT * FROM service_requests WHERE id = $1
    """, request_id)

    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service request not found"
        )

    if decision.decision == "approve":
        # Transition to DOSSIER_VALIDE
        new_status = "DOSSIER_VALIDE"

        await db.execute("""
            UPDATE service_requests
            SET status = $1,
                agent_decision = 'approved',
                agent_comments = $3,
                validated_by = $4,
                validated_at = NOW(),
                updated_at = NOW()
            WHERE id = $2
        """, new_status, request_id, decision.comments, str(current_user.id))

        # Complete queue item
        await agent_queue_service.complete_item(
            db=db,
            queue_id=str(queue_item['id']),
            agent_id=str(current_user.id),
            result_status="approved"
        )

        # Schedule appointment if workflow requires it
        workflow_code = request['workflow_code']
        workflow_data = await db.fetchrow("""
            SELECT requires_appointment FROM workflows WHERE code = $1
        """, workflow_code)

        appointment_info = None
        if workflow_data and workflow_data['requires_appointment']:
            reservation = await appointment_scheduler.reserve_appointment(
                db=db,
                service_request_id=request_id,
                workflow_code=workflow_code,
                validation_date=date.today()
            )
            appointment_info = {
                "date": reservation.appointment_date.isoformat(),
                "time": reservation.appointment_time.isoformat(),
                "location": reservation.appointment_location
            }

        # Publish REQUEST_APPROVED event
        try:
            user_info = await db.fetchrow(
                "SELECT id, email, first_name, last_name, phone_number, preferred_language FROM users WHERE id = $1",
                request['user_id']
            )
            if user_info:
                EventBus.publish_nowait(
                    EventType.REQUEST_APPROVED,
                    {
                        "request_id": str(request_id),
                        "user_id": str(user_info['id']),
                        "user_email": user_info['email'],
                        "user_name": f"{user_info['first_name']} {user_info['last_name']}",
                        "user_phone": user_info['phone_number'],
                        "preferred_language": user_info['preferred_language'] or 'es',
                        "workflow_code": request['workflow_code'],
                        "agent_id": str(current_user.id),
                        "appointment_date": appointment_info['date'] if appointment_info else None,
                        "appointment_time": appointment_info['time'] if appointment_info else None,
                        "location": appointment_info['location'] if appointment_info else None,
                        "timestamp": datetime.now().isoformat(),
                    }
                )
        except Exception:
            pass  # Non-blocking

        return {
            "message": "Service request approved",
            "new_status": new_status,
            "appointment": appointment_info
        }

    elif decision.decision == "reject":
        if not decision.rejection_reason:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Rejection reason is required"
            )

        await db.execute("""
            UPDATE service_requests
            SET status = 'REJECTED',
                agent_decision = 'rejected',
                rejection_reason = $2,
                agent_comments = $3,
                validated_by = $4,
                validated_at = NOW(),
                updated_at = NOW()
            WHERE id = $1
        """, request_id, decision.rejection_reason, decision.comments, str(current_user.id))

        # Complete queue item
        await agent_queue_service.complete_item(
            db=db,
            queue_id=str(queue_item['id']),
            agent_id=str(current_user.id),
            result_status="rejected"
        )

        # Publish REQUEST_REJECTED event
        try:
            user_info = await db.fetchrow(
                "SELECT id, email, first_name, last_name, phone_number, preferred_language FROM users WHERE id = $1",
                request['user_id']
            )
            if user_info:
                EventBus.publish_nowait(
                    EventType.REQUEST_REJECTED,
                    {
                        "request_id": str(request_id),
                        "user_id": str(user_info['id']),
                        "user_email": user_info['email'],
                        "user_name": f"{user_info['first_name']} {user_info['last_name']}",
                        "user_phone": user_info['phone_number'],
                        "preferred_language": user_info['preferred_language'] or 'es',
                        "workflow_code": request['workflow_code'],
                        "agent_id": str(current_user.id),
                        "reason": decision.rejection_reason,
                        "timestamp": datetime.now().isoformat(),
                    }
                )
        except Exception:
            pass  # Non-blocking

        return {
            "message": "Service request rejected",
            "new_status": "REJECTED",
            "reason": decision.rejection_reason
        }

    elif decision.decision == "request_documents":
        if not decision.requested_documents:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="List of requested documents is required"
            )

        await db.execute("""
            UPDATE service_requests
            SET status = 'DOCUMENTS_REQUIRED',
                agent_comments = $2,
                missing_documents = $3,
                updated_at = NOW()
            WHERE id = $1
        """, request_id, decision.comments, decision.requested_documents)

        # Release queue item (will be re-queued when documents are uploaded)
        await db.execute("""
            UPDATE agent_work_queue
            SET status = 'pending',
                assigned_to = NULL,
                updated_at = NOW()
            WHERE id = $1
        """, str(queue_item['id']))

        return {
            "message": "Additional documents requested",
            "new_status": "DOCUMENTS_REQUIRED",
            "requested_documents": decision.requested_documents
        }


# ═══════════════════════════════════════════════════════════════
# ESCALATION
# ═══════════════════════════════════════════════════════════════

@router.post(
    "/{request_id}/escalate",
    summary="Escalate service request",
    description="""
    Escalate a service request to a supervisor.

    The request will be released from your queue with increased priority.
    """
)
async def escalate_request(
    request_id: UUID = Path(..., description="Service request ID"),
    escalation: EscalationRequest = Body(...),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("service_request.escalate"))
):
    # Find queue item
    queue_item = await db.fetchrow("""
        SELECT id FROM agent_work_queue
        WHERE item_id = $1
        AND item_type = 'service_request'
        AND status != 'completed'
    """, str(request_id))

    if not queue_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Queue item not found"
        )

    await agent_queue_service.escalate_item(
        db=db,
        queue_id=str(queue_item['id']),
        agent_id=str(current_user.id),
        reason=escalation.reason
    )

    return {
        "message": "Service request escalated",
        "reason": escalation.reason
    }


# ═══════════════════════════════════════════════════════════════
# APPOINTMENT MANAGEMENT
# ═══════════════════════════════════════════════════════════════

@router.post(
    "/{request_id}/appointment",
    summary="Schedule appointment manually",
    description="""
    Manually schedule an appointment for a service request.

    Use this when automatic scheduling is not appropriate
    or when rescheduling is needed.
    """
)
async def schedule_appointment(
    request_id: UUID = Path(..., description="Service request ID"),
    schedule: AppointmentSchedule = Body(...),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("service_request.schedule_appointment"))
):
    # Check if appointment exists
    existing = await db.fetchrow("""
        SELECT id FROM appointment_reservations
        WHERE service_request_id = $1
        AND status != 'cancelled'
    """, request_id)

    if existing:
        # Reschedule
        reservation = await appointment_scheduler.reschedule_appointment(
            db=db,
            service_request_id=request_id,
            new_date=schedule.appointment_date,
            new_time=schedule.appointment_time,
            reason="Agent manual reschedule"
        )
    else:
        # Get workflow info for entity
        request = await db.fetchrow("""
            SELECT workflow_code FROM service_requests WHERE id = $1
        """, request_id)

        if not request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service request not found"
            )

        # Reserve new appointment
        reservation = await appointment_scheduler.reserve_appointment(
            db=db,
            service_request_id=request_id,
            workflow_code=request['workflow_code'],
            validation_date=date.today()
        )

        # Update with manual date/time
        await db.execute("""
            UPDATE appointment_reservations
            SET appointment_date = $2,
                appointment_time = $3,
                location = COALESCE($4, location)
            WHERE id = $1
        """, reservation.id, schedule.appointment_date,
            schedule.appointment_time, schedule.location)

        await db.execute("""
            UPDATE service_requests
            SET cita_date = $2,
                cita_time = $3,
                cita_location = COALESCE($4, cita_location),
                updated_at = NOW()
            WHERE id = $1
        """, request_id, schedule.appointment_date,
            schedule.appointment_time, schedule.location)

    return {
        "message": "Appointment scheduled",
        "date": schedule.appointment_date.isoformat(),
        "time": schedule.appointment_time.isoformat(),
        "location": schedule.location
    }


@router.delete(
    "/{request_id}/appointment",
    summary="Cancel appointment",
    description="Cancel an existing appointment for a service request."
)
async def cancel_appointment(
    request_id: UUID = Path(..., description="Service request ID"),
    reason: Optional[str] = Body(None, embed=True),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("service_request.schedule_appointment"))
):
    # Get request info before cancellation (for notification)
    request_info = await db.fetchrow("""
        SELECT sr.user_id, sr.workflow_code,
               ah.appointment_date, ah.appointment_time, ah.location_name
        FROM service_requests sr
        LEFT JOIN appointment_holds ah ON ah.service_request_id = sr.id AND ah.status = 'confirmed'
        WHERE sr.id = $1
    """, request_id)

    cancelled = await appointment_scheduler.cancel_appointment(
        db=db,
        service_request_id=request_id,
        reason=reason or "Agent cancellation"
    )

    if not cancelled:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active appointment found"
        )

    # Publish APPOINTMENT_CANCELLED event for notification
    if request_info:
        try:
            user_info = await db.fetchrow(
                "SELECT id, email, first_name, last_name, phone_number, preferred_language FROM users WHERE id = $1",
                request_info['user_id']
            )
            if user_info:
                EventBus.publish_nowait(
                    EventType.APPOINTMENT_CANCELLED,
                    {
                        "request_id": str(request_id),
                        "user_id": str(user_info['id']),
                        "user_email": user_info['email'],
                        "user_name": f"{user_info['first_name']} {user_info['last_name']}",
                        "user_phone": user_info['phone_number'],
                        "preferred_language": user_info['preferred_language'] or 'es',
                        "workflow_code": request_info['workflow_code'],
                        "appointment_date": str(request_info['appointment_date']) if request_info.get('appointment_date') else None,
                        "appointment_time": str(request_info['appointment_time']) if request_info.get('appointment_time') else None,
                        "location": request_info.get('location_name'),
                        "reason": reason or "Agent cancellation",
                        "timestamp": datetime.now().isoformat(),
                    }
                )
        except Exception:
            pass  # Non-blocking

    return {"message": "Appointment cancelled"}


# ═══════════════════════════════════════════════════════════════
# MY ESCALATIONS
# ═══════════════════════════════════════════════════════════════

class EscalationItemResponse(BaseModel):
    """Escalation item response for agent view"""
    id: str
    queue_id: str
    reason: str
    priority_score: float
    status: str  # pending, assigned, completed
    escalation_status: str  # pending, in_review, resolved, reassigned
    case_reference: str
    case_type: str
    notes: Optional[str]
    created_at: str
    escalated_at: str


@router.get(
    "/my-escalations",
    response_model=List[EscalationItemResponse],
    summary="Get my escalated items",
    description="""
    Get all items that I have escalated.

    Returns items from agent_work_queue where:
    - escalated = true
    - escalated_by = current user
    """
)
async def get_my_escalations(
    include_resolved: bool = Query(False, description="Include resolved escalations"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("service_request.escalate"))
):
    offset = (page - 1) * page_size

    status_filter = "AND q.status != 'completed'" if not include_resolved else ""

    rows = await db.fetch(f"""
        SELECT
            q.id as queue_id,
            q.item_id,
            q.escalation_reason,
            q.priority_score,
            q.status,
            q.escalated_at,
            q.created_at,
            sr.reference as case_reference,
            sr.workflow_code as case_type,
            sr.notes,
            CASE
                WHEN q.status = 'completed' THEN 'resolved'
                WHEN q.assigned_to IS NOT NULL THEN 'in_review'
                ELSE 'pending'
            END as escalation_status
        FROM agent_work_queue q
        JOIN service_requests sr ON sr.id = q.item_id
        WHERE q.item_type = 'service_request'
        AND q.escalated = true
        AND q.escalated_by = $1
        {status_filter}
        ORDER BY q.escalated_at DESC
        LIMIT $2 OFFSET $3
    """, str(current_user.id), page_size, offset)

    return [
        EscalationItemResponse(
            id=str(row['item_id']),
            queue_id=str(row['queue_id']),
            reason=row['escalation_reason'] or '',
            priority_score=float(row['priority_score']),
            status=row['status'],
            escalation_status=row['escalation_status'],
            case_reference=row['case_reference'] or '',
            case_type=row['case_type'] or '',
            notes=row['notes'],
            created_at=row['created_at'].isoformat(),
            escalated_at=row['escalated_at'].isoformat() if row['escalated_at'] else row['created_at'].isoformat()
        )
        for row in rows
    ]


# ═══════════════════════════════════════════════════════════════
# APPOINTMENT MANAGEMENT
# ═══════════════════════════════════════════════════════════════

@router.get(
    "/appointments/available",
    summary="Get available appointment slots",
    description="Get list of available appointment slots for a given entity."
)
async def get_available_slots(
    entity_code: str = Query(..., description="Entity code (e.g., CNEDOGE)"),
    from_date: Optional[date] = Query(None, description="Start date (defaults to today)"),
    limit: int = Query(30, ge=1, description="Number of slots to return"),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("service_request.view"))
):
    if not from_date:
        from_date = date.today()

    slots = await appointment_scheduler.get_available_slots(
        db=db,
        entity_code=entity_code,
        from_date=from_date,
        limit=limit
    )

    return [
        {
            "date": slot.date.isoformat(),
            "start_time": slot.start_time.isoformat(),
            "end_time": slot.end_time.isoformat(),
            "slots_available": slot.slots_available
        }
        for slot in slots
    ]


# ═══════════════════════════════════════════════════════════════
# DOCUMENT VALIDATION
# ═══════════════════════════════════════════════════════════════

class DocumentValidationRequest(BaseModel):
    """Request body for document validation"""
    comment: Optional[str] = None


class DocumentRejectionRequest(BaseModel):
    """Request body for document rejection"""
    reason: str = Field(..., min_length=5, description="Rejection reason")


@router.post(
    "/documents/{document_id}/validate",
    summary="Validate a document",
    description="Mark a document as validated by agent."
)
async def validate_document(
    document_id: str,
    body: DocumentValidationRequest = None,
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("service_request.review"))
):
    """Validate a document uploaded by a citizen."""
    # Get document with user info
    doc = await db.fetchrow("""
        SELECT uf.id, uf.user_id, uf.document_type, uf.file_name, uf.validation_status,
               u.email, u.phone_number as phone, u.first_name, u.last_name, u.preferred_language
        FROM uploaded_files uf
        JOIN users u ON u.id = uf.user_id
        WHERE uf.id = $1
    """, document_id)

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if doc["validation_status"] == "validated":
        raise HTTPException(status_code=400, detail="Document already validated")

    # Update document status
    await db.execute("""
        UPDATE uploaded_files
        SET validation_status = 'validated',
            validated_at = NOW(),
            validated_by = $2,
            updated_at = NOW()
        WHERE id = $1
    """, document_id, str(current_user.id))

    # Publish DOCUMENT_VALIDATED event
    try:
        EventBus.publish_nowait(
            EventType.DOCUMENT_VALIDATED,
            {
                "document_id": document_id,
                "user_id": str(doc["user_id"]),
                "user_email": doc["email"],
                "user_phone": doc["phone"],
                "user_name": f"{doc['first_name'] or ''} {doc['last_name'] or ''}".strip(),
                "preferred_language": doc.get("preferred_language", "es"),
                "document_type": doc["document_type"],
                "file_name": doc["file_name"],
                "agent_id": str(current_user.id),
            }
        )
        logger.info(f"DOCUMENT_VALIDATED event published for document {document_id}")
    except Exception as e:
        logger.error(f"Failed to publish DOCUMENT_VALIDATED event: {e}")

    return {"message": "Document validated", "document_id": document_id}


@router.post(
    "/documents/{document_id}/reject",
    summary="Reject a document",
    description="Mark a document as rejected with reason."
)
async def reject_document(
    document_id: str,
    body: DocumentRejectionRequest,
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("service_request.review"))
):
    """Reject a document uploaded by a citizen."""
    # Get document with user info
    doc = await db.fetchrow("""
        SELECT uf.id, uf.user_id, uf.document_type, uf.file_name, uf.validation_status,
               u.email, u.phone_number as phone, u.first_name, u.last_name, u.preferred_language
        FROM uploaded_files uf
        JOIN users u ON u.id = uf.user_id
        WHERE uf.id = $1
    """, document_id)

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if doc["validation_status"] == "rejected":
        raise HTTPException(status_code=400, detail="Document already rejected")

    # Update document status
    await db.execute("""
        UPDATE uploaded_files
        SET validation_status = 'rejected',
            rejection_reason = $2,
            validated_at = NOW(),
            validated_by = $3,
            updated_at = NOW()
        WHERE id = $1
    """, document_id, body.reason, str(current_user.id))

    # Publish DOCUMENT_REJECTED event
    try:
        EventBus.publish_nowait(
            EventType.DOCUMENT_REJECTED,
            {
                "document_id": document_id,
                "user_id": str(doc["user_id"]),
                "user_email": doc["email"],
                "user_phone": doc["phone"],
                "user_name": f"{doc['first_name'] or ''} {doc['last_name'] or ''}".strip(),
                "preferred_language": doc.get("preferred_language", "es"),
                "document_type": doc["document_type"],
                "file_name": doc["file_name"],
                "reason": body.reason,
                "agent_id": str(current_user.id),
            }
        )
        logger.info(f"DOCUMENT_REJECTED event published for document {document_id}")
    except Exception as e:
        logger.error(f"Failed to publish DOCUMENT_REJECTED event: {e}")

    return {"message": "Document rejected", "document_id": document_id, "reason": body.reason}


# ═══════════════════════════════════════════════════════════════
# APPOINTMENT ATTENDANCE TRACKING
# ═══════════════════════════════════════════════════════════════

@router.post(
    "/appointments/{request_id}/mark-arrived",
    summary="Mark citizen as arrived",
    description="Agent marks that the citizen has arrived for their appointment."
)
async def mark_appointment_arrived(
    request_id: str,
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("service_request.review"))
):
    """Mark that citizen arrived for appointment."""
    # Get request with user and appointment info
    request = await db.fetchrow("""
        SELECT sr.id, sr.user_id, sr.status, sr.workflow_code, sr.reference,
               sr.cita_date as appointment_date, sr.cita_time as appointment_time,
               sr.cita_location as location,
               u.email, u.phone_number as phone, u.first_name, u.last_name, u.preferred_language
        FROM service_requests sr
        JOIN users u ON u.id = sr.user_id
        WHERE sr.id = $1::uuid
    """, request_id)

    if not request:
        raise HTTPException(status_code=404, detail="Service request not found")

    # Update appointment status
    await db.execute("""
        UPDATE service_requests
        SET appointment_status = 'arrived',
            arrived_at = NOW(),
            updated_at = NOW()
        WHERE id = $1::uuid
    """, request_id)

    # Update appointment_holds if exists
    await db.execute("""
        UPDATE appointment_holds
        SET status = 'completed', completed_at = NOW()
        WHERE service_request_id = $1::uuid AND status = 'confirmed'
    """, request_id)

    # Publish APPOINTMENT_COMPLETED event
    try:
        EventBus.publish_nowait(
            EventType.APPOINTMENT_COMPLETED,
            {
                "request_id": request_id,
                "user_id": str(request["user_id"]),
                "user_email": request["email"],
                "user_phone": request["phone"],
                "user_name": f"{request['first_name'] or ''} {request['last_name'] or ''}".strip(),
                "preferred_language": request.get("preferred_language", "es"),
                "workflow_code": request["workflow_code"],
                "reference": request["reference"],
                "appointment_date": str(request["appointment_date"]) if request.get("appointment_date") else None,
                "appointment_time": str(request["appointment_time"]) if request.get("appointment_time") else None,
                "location": request.get("location"),
                "agent_id": str(current_user.id),
            }
        )
        logger.info(f"APPOINTMENT_COMPLETED event published for request {request_id}")
    except Exception as e:
        logger.error(f"Failed to publish APPOINTMENT_COMPLETED event: {e}")

    return {"message": "Citizen marked as arrived", "request_id": request_id}


@router.post(
    "/appointments/{request_id}/mark-no-show",
    summary="Mark citizen as no-show",
    description="Agent marks that the citizen did not arrive for their appointment."
)
async def mark_appointment_no_show(
    request_id: str,
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("service_request.review"))
):
    """Mark that citizen did not arrive for appointment (no-show)."""
    # Get request with user and appointment info
    request = await db.fetchrow("""
        SELECT sr.id, sr.user_id, sr.status, sr.workflow_code, sr.reference,
               sr.cita_date as appointment_date, sr.cita_time as appointment_time,
               sr.cita_location as location,
               u.email, u.phone_number as phone, u.first_name, u.last_name, u.preferred_language
        FROM service_requests sr
        JOIN users u ON u.id = sr.user_id
        WHERE sr.id = $1::uuid
    """, request_id)

    if not request:
        raise HTTPException(status_code=404, detail="Service request not found")

    # Update appointment status
    await db.execute("""
        UPDATE service_requests
        SET appointment_status = 'no_show',
            no_show_at = NOW(),
            updated_at = NOW()
        WHERE id = $1::uuid
    """, request_id)

    # Update appointment_holds if exists
    await db.execute("""
        UPDATE appointment_holds
        SET status = 'no_show', completed_at = NOW()
        WHERE service_request_id = $1::uuid AND status = 'confirmed'
    """, request_id)

    # Publish APPOINTMENT_NO_SHOW event
    try:
        EventBus.publish_nowait(
            EventType.APPOINTMENT_NO_SHOW,
            {
                "request_id": request_id,
                "user_id": str(request["user_id"]),
                "user_email": request["email"],
                "user_phone": request["phone"],
                "user_name": f"{request['first_name'] or ''} {request['last_name'] or ''}".strip(),
                "preferred_language": request.get("preferred_language", "es"),
                "workflow_code": request["workflow_code"],
                "reference": request["reference"],
                "appointment_date": str(request["appointment_date"]) if request.get("appointment_date") else None,
                "appointment_time": str(request["appointment_time"]) if request.get("appointment_time") else None,
                "location": request.get("location"),
                "agent_id": str(current_user.id),
            }
        )
        logger.info(f"APPOINTMENT_NO_SHOW event published for request {request_id}")
    except Exception as e:
        logger.error(f"Failed to publish APPOINTMENT_NO_SHOW event: {e}")

    return {"message": "Citizen marked as no-show", "request_id": request_id}
