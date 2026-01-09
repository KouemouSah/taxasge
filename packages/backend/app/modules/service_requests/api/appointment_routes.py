"""
Appointment Routes for Citizen-First Flow.

This router handles the NEW workflow where citizens:
1. Select a location (Malabo or Bata) BEFORE payment
2. Select from available appointment slots BEFORE payment
3. Slot is temporarily held during payment (15 min)
4. Hold is confirmed after payment success
5. Fallback: submit without appointment if no slots available

Flow: DRAFT → DOCUMENTS → REVIEW → SELECT_LOCATION → SELECT_SLOT → PAYMENT → SUBMITTED
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from datetime import date, datetime
from uuid import UUID
import asyncpg
import logging

from app.database.connection import get_database
from app.modules.auth.middleware.auth_middleware import get_current_user
from app.modules.users.models.user import UserResponse

from ..models.appointments import (
    EntityLocationResponse,
    AvailableSlotResponse,
    HoldSlotRequest,
    HoldSlotResponse,
    ConfirmHoldResponse,
    AppointmentHoldStatus,
    SubmitWithoutAppointmentRequest,
    SubmitWithoutAppointmentResponse,
    ReleaseHoldResponse,
    AppointmentLocationsListResponse,
    AppointmentSlotsListResponse,
)
from ..services.appointment_service import appointment_service
from app.core.events import EventBus, EventType

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/service-requests",
    tags=["Service Requests - Appointments"]
)


# =============================================================================
# LOCATION ENDPOINTS
# =============================================================================

@router.get(
    "/{request_id}/appointments/locations",
    response_model=AppointmentLocationsListResponse,
    summary="Get available locations for appointment",
    description="""
    Get available locations (Malabo and Bata) for appointment selection.

    Locations are determined by the workflow's entity code:
    - PASAPORTE, DIP → CNEDOGE (Malabo, Bata)
    - CONDUCIR, VEHICULO → DGT (Malabo, Bata)
    - RESIDENCIA, VISA → EXTRANJERIA (Malabo, Bata)
    - FUNCIONARIO, CARNET → MINFP (Malabo, Bata)
    """
)
async def get_appointment_locations(
    request_id: UUID,
    db: asyncpg.Connection = Depends(get_database),
    current_user: UserResponse = Depends(get_current_user)
):
    """Get available locations for a service request."""
    # Get service request
    request = await db.fetchrow("""
        SELECT id, user_id, workflow_code, status
        FROM service_requests
        WHERE id = $1
    """, request_id)

    if not request:
        raise HTTPException(status_code=404, detail="Service request not found")

    # Verify ownership
    if str(request['user_id']) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")

    # Get entity code for this workflow
    entity_code = await appointment_service.get_entity_code_for_workflow(
        db, request['workflow_code']
    )

    # Get locations from appointment_slot_configs table (grouped by city)
    # Uses the city column added in migration 029
    rows = await db.fetch("""
        SELECT DISTINCT ON (city, location_name)
            id,
            entity_code,
            location_name,
            location_address,
            city,
            region
        FROM appointment_slot_configs
        WHERE entity_code = $1
        AND is_active = TRUE
        AND city IS NOT NULL
        ORDER BY city, location_name, id
    """, entity_code)

    locations = [
        EntityLocationResponse(
            id=row['id'],
            entity_code=row['entity_code'],
            location_code=f"{row['entity_code']}_{row['city']}".upper(),  # Generated code
            location_name=row['location_name'],
            city=row['city'],
            province=row['city'],  # Province = city for GE (Malabo/Bata are provinces)
            region=row['region'],
            address=row['location_address'],
            phone=None,  # Not stored in slot configs
            email=None,  # Not stored in slot configs
            is_main_office=(row['city'] == 'Malabo')  # Malabo is main office
        )
        for row in rows
    ]

    return AppointmentLocationsListResponse(
        entity_code=entity_code,
        locations=locations,
        count=len(locations)
    )


# =============================================================================
# SLOT ENDPOINTS
# =============================================================================

@router.get(
    "/{request_id}/appointments/slots",
    response_model=AppointmentSlotsListResponse,
    summary="Get available appointment slots",
    description="""
    Get available appointment slots for a specific location.

    Returns up to 6 available slots, starting from the minimum delay date
    (7 business days by default). Considers both confirmed reservations
    AND active holds when calculating availability.
    """
)
async def get_available_slots(
    request_id: UUID,
    location_name: str = Query(..., description="Location name (e.g., 'CNEDOGE Malabo')"),
    from_date: Optional[date] = Query(None, description="Start date (defaults to min delay date)"),
    limit: int = Query(6, ge=1, le=20, description="Max slots to return"),
    db: asyncpg.Connection = Depends(get_database),
    current_user: UserResponse = Depends(get_current_user)
):
    """Get available appointment slots for a location."""
    # Get service request
    request = await db.fetchrow("""
        SELECT id, user_id, workflow_code, status
        FROM service_requests
        WHERE id = $1
    """, request_id)

    if not request:
        raise HTTPException(status_code=404, detail="Service request not found")

    # Verify ownership
    if str(request['user_id']) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")

    # Get entity code
    entity_code = await appointment_service.get_entity_code_for_workflow(
        db, request['workflow_code']
    )

    # Get available slots
    slots = await appointment_service.get_available_slots(
        db=db,
        entity_code=entity_code,
        location_name=location_name,
        from_date=from_date,
        limit=limit
    )

    slot_responses = [
        AvailableSlotResponse(
            slot_date=slot.slot_date,
            slot_time=slot.slot_time,
            location_name=slot.location_name,
            location_address=slot.location_address,
            slots_remaining=slot.slots_remaining,
            city=slot.city  # Include city for statistics (migration 029)
        )
        for slot in slots
    ]

    return AppointmentSlotsListResponse(
        entity_code=entity_code,
        location_name=location_name,
        from_date=from_date or date.today(),
        slots=slot_responses,
        count=len(slot_responses),
        has_availability=len(slot_responses) > 0
    )


# =============================================================================
# HOLD ENDPOINTS
# =============================================================================

@router.post(
    "/{request_id}/appointments/hold",
    response_model=HoldSlotResponse,
    summary="Hold an appointment slot",
    description="""
    Create a temporary hold on an appointment slot before payment.

    The hold is valid for 15 minutes while user completes payment.
    After 15 minutes without payment, the hold expires automatically.
    Any previous hold for this request is released.
    """
)
async def hold_appointment_slot(
    request_id: UUID,
    hold_request: HoldSlotRequest,
    db: asyncpg.Connection = Depends(get_database),
    current_user: UserResponse = Depends(get_current_user)
):
    """Create a temporary hold on an appointment slot."""
    # Get service request
    request = await db.fetchrow("""
        SELECT id, user_id, workflow_code, status
        FROM service_requests
        WHERE id = $1
    """, request_id)

    if not request:
        raise HTTPException(status_code=404, detail="Service request not found")

    # Verify ownership
    if str(request['user_id']) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")

    # Get entity code
    entity_code = await appointment_service.get_entity_code_for_workflow(
        db, request['workflow_code']
    )

    # Create hold
    result = await appointment_service.hold_slot(
        db=db,
        service_request_id=request_id,
        entity_code=entity_code,
        location_name=hold_request.location_name,
        location_address=hold_request.location_address,
        appointment_date=hold_request.appointment_date,
        appointment_time=hold_request.appointment_time
    )

    if result.success and result.hold:
        return HoldSlotResponse(
            success=True,
            hold_id=result.hold.id,
            location_name=result.hold.location_name,
            appointment_date=result.hold.appointment_date,
            appointment_time=result.hold.appointment_time,
            expires_at=result.hold.expires_at,
            expires_in_seconds=result.expires_in_seconds
        )
    else:
        return HoldSlotResponse(
            success=False,
            error=result.error or "Failed to hold appointment slot"
        )


@router.get(
    "/{request_id}/appointments/hold-status",
    response_model=AppointmentHoldStatus,
    summary="Get appointment hold status",
    description="""
    Get the current hold status for a service request.

    Returns whether there's an active hold, its details, and expiry info.
    Used to display hold status in UI and decide next steps.
    """
)
async def get_hold_status(
    request_id: UUID,
    db: asyncpg.Connection = Depends(get_database),
    current_user: UserResponse = Depends(get_current_user)
):
    """Get the current hold status for a service request."""
    # Get service request
    request = await db.fetchrow("""
        SELECT id, user_id, workflow_code, status
        FROM service_requests
        WHERE id = $1
    """, request_id)

    if not request:
        raise HTTPException(status_code=404, detail="Service request not found")

    # Verify ownership
    if str(request['user_id']) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")

    # Get hold status
    hold = await appointment_service.get_hold_status(db, request_id)

    if hold:
        from datetime import datetime
        now = datetime.now(hold.expires_at.tzinfo) if hold.expires_at.tzinfo else datetime.utcnow()
        is_expired = hold.status.value == 'expired' or (
            hold.status.value == 'held' and now > hold.expires_at
        )

        return AppointmentHoldStatus(
            has_hold=True,
            status=hold.status.value,
            location_name=hold.location_name,
            city=hold.city,  # Include city from appointment_holds table
            appointment_date=hold.appointment_date,
            appointment_time=hold.appointment_time,
            expires_at=hold.expires_at,
            is_expired=is_expired
        )
    else:
        return AppointmentHoldStatus(
            has_hold=False,
            status=None,
            is_expired=False
        )


@router.delete(
    "/{request_id}/appointments/hold",
    response_model=ReleaseHoldResponse,
    summary="Release appointment hold",
    description="""
    Release a held appointment slot.

    Called when user wants to select a different slot or cancel.
    The slot becomes available for other users.
    """
)
async def release_hold(
    request_id: UUID,
    db: asyncpg.Connection = Depends(get_database),
    current_user: UserResponse = Depends(get_current_user)
):
    """Release a held appointment slot."""
    # Get service request
    request = await db.fetchrow("""
        SELECT id, user_id, workflow_code, status
        FROM service_requests
        WHERE id = $1
    """, request_id)

    if not request:
        raise HTTPException(status_code=404, detail="Service request not found")

    # Verify ownership
    if str(request['user_id']) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")

    # Release hold
    released = await appointment_service.release_hold(db, request_id)

    if released:
        return ReleaseHoldResponse(
            success=True,
            message="Appointment hold released successfully"
        )
    else:
        return ReleaseHoldResponse(
            success=False,
            message="No active hold found to release"
        )


# =============================================================================
# FALLBACK ENDPOINTS
# =============================================================================

@router.post(
    "/{request_id}/appointments/fallback",
    response_model=SubmitWithoutAppointmentResponse,
    summary="Submit without appointment (fallback)",
    description="""
    Submit a request without an appointment when no slots are available.

    User selects their preferred location, and an agent will assign
    an appointment later. Used when all slots are booked.
    """
)
async def submit_without_appointment(
    request_id: UUID,
    fallback_request: SubmitWithoutAppointmentRequest,
    db: asyncpg.Connection = Depends(get_database),
    current_user: UserResponse = Depends(get_current_user)
):
    """Submit request without appointment (fallback when no slots)."""
    # Get service request
    request = await db.fetchrow("""
        SELECT id, user_id, workflow_code, status
        FROM service_requests
        WHERE id = $1
    """, request_id)

    if not request:
        raise HTTPException(status_code=404, detail="Service request not found")

    # Verify ownership
    if str(request['user_id']) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")

    # Submit without appointment
    result = await appointment_service.submit_without_appointment(
        db=db,
        service_request_id=request_id,
        location_name=fallback_request.preferred_location
    )

    if result.success:
        return SubmitWithoutAppointmentResponse(
            success=True,
            location_name=result.location_name,
            message="Su solicitud ha sido enviada. Un agente le asignará una cita pronto."
        )
    else:
        return SubmitWithoutAppointmentResponse(
            success=False,
            error=result.error or "Failed to submit request"
        )


# =============================================================================
# CONFIRM ENDPOINT (Called by Payment Webhook)
# =============================================================================

@router.post(
    "/{request_id}/appointments/confirm",
    response_model=ConfirmHoldResponse,
    summary="Confirm appointment hold after payment",
    description="""
    Confirm a held appointment after successful payment.

    This endpoint is called by the payment webhook after payment success.
    It creates a permanent reservation and updates the service request
    with cita_date, cita_time, and cita_location.

    Note: This requires elevated permissions (payment webhook or admin).
    """
)
async def confirm_appointment_hold(
    request_id: UUID,
    db: asyncpg.Connection = Depends(get_database),
    current_user: UserResponse = Depends(get_current_user)
):
    """Confirm appointment hold after payment (webhook endpoint)."""
    # This endpoint should be called by payment webhook
    # For now, allow owner or admin to call it

    # Get service request
    request = await db.fetchrow("""
        SELECT id, user_id, workflow_code, status
        FROM service_requests
        WHERE id = $1
    """, request_id)

    if not request:
        raise HTTPException(status_code=404, detail="Service request not found")

    # Verify ownership or admin
    is_owner = str(request['user_id']) == str(current_user.id)
    is_admin = current_user.role in ['admin', 'supervisor', 'dgi_agent']

    if not is_owner and not is_admin:
        raise HTTPException(status_code=403, detail="Access denied")

    # Confirm hold
    result = await appointment_service.confirm_hold(db, request_id)

    # Publish APPOINTMENT_BOOKED event if successful
    if result.success:
        try:
            EventBus.publish_nowait(
                EventType.APPOINTMENT_BOOKED,
                {
                    "request_id": str(request_id),
                    "user_id": str(request['user_id']),
                    "user_email": current_user.email,
                    "user_name": f"{current_user.first_name} {current_user.last_name}",
                    "user_phone": getattr(current_user, 'phone_number', None),
                    "preferred_language": getattr(current_user, 'preferred_language', 'es'),
                    "workflow_code": request['workflow_code'],
                    "appointment_date": str(result.appointment_date) if result.appointment_date else None,
                    "appointment_time": str(result.appointment_time) if result.appointment_time else None,
                    "location": result.location_name,
                    "timestamp": datetime.now().isoformat(),
                }
            )
        except Exception:
            pass  # Non-blocking

    return ConfirmHoldResponse(
        success=result.success,
        appointment_date=result.appointment_date,
        appointment_time=result.appointment_time,
        location_name=result.location_name,
        city=result.city,  # Include city from confirm_appointment_hold function
        error=result.error
    )
