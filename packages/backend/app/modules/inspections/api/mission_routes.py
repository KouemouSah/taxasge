"""Mission Routes — API endpoints for field mission planning.

Prefix: /api/v1/inspections/missions

9 endpoints for supervisor mission planning + agent availability.
"""

import logging
from typing import Optional
from uuid import UUID
from datetime import date

from fastapi import APIRouter, HTTPException, Depends, Query

from app.database.connection import get_database
from app.modules.auth.middleware.auth_middleware import get_current_user
from app.modules.users.models.user import UserResponse
from app.modules.permissions.middleware.permission_middleware import (
    permission_required,
)
from app.modules.inspections.models.mission import (
    MissionCreate,
    MissionUpdate,
    MissionAgentBatchAssign,
    MissionCompleteRequest,
    MissionResponse,
    MissionListResponse,
    MissionListItem,
    ZoneSuggestion,
    AgentAvailability,
)
from app.modules.inspections.services.mission_service import (
    MissionService,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/inspections/missions", tags=["Inspection Missions"])


# ============================================================
# Static paths BEFORE /{id}
# ============================================================


@router.post("/", status_code=201)
async def create_mission(
    data: MissionCreate,
    db=Depends(get_database),
    current_user: UserResponse = Depends(get_current_user),
    _: None = Depends(permission_required("inspection.manage_missions")),
):
    """Create a new field mission."""
    try:
        async with db.transaction():
            result = await MissionService.create_mission(
                db, UUID(current_user.id), data.model_dump(),
            )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return result


@router.get("/")
async def list_missions(
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db=Depends(get_database),
    current_user: UserResponse = Depends(get_current_user),
    _: None = Depends(permission_required("inspection.view_entity")),
):
    """List missions. Supervisors see entity-wide, agents see assigned."""
    try:
        items, total = await MissionService.list_missions(
            db, UUID(current_user.id),
            date_from=date_from, date_to=date_to,
            status=status, page=page, page_size=page_size,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return MissionListResponse(
        items=[MissionListItem(**i) for i in items],
        total=total,
    )


@router.get("/suggest-zones")
async def suggest_zones(
    db=Depends(get_database),
    current_user: UserResponse = Depends(get_current_user),
    _: None = Depends(permission_required("inspection.manage_missions")),
):
    """Auto-suggest priority zones for mission planning."""
    try:
        zones = await MissionService.suggest_zones(
            db, UUID(current_user.id),
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return [ZoneSuggestion(**z) for z in zones]


@router.get("/agents/availability")
async def get_agents_availability(
    mission_date: date = Query(...),
    db=Depends(get_database),
    current_user: UserResponse = Depends(get_current_user),
    _: None = Depends(permission_required("inspection.manage_missions")),
):
    """Get agent availability for a specific date."""
    try:
        agents = await MissionService.get_agents_availability(
            db, UUID(current_user.id), mission_date,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return [AgentAvailability(**a) for a in agents]


# ============================================================
# Dynamic paths — /{mission_id}
# ============================================================


@router.get("/{mission_id}")
async def get_mission(
    mission_id: UUID,
    db=Depends(get_database),
    current_user: UserResponse = Depends(get_current_user),
    _: None = Depends(permission_required("inspection.view_entity")),
):
    """Get mission detail — IDOR-protected via service layer."""
    try:
        result = await MissionService.get_mission(
            db, UUID(current_user.id), mission_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return MissionResponse(**result)


@router.put("/{mission_id}")
async def update_mission(
    mission_id: UUID,
    data: MissionUpdate,
    db=Depends(get_database),
    current_user: UserResponse = Depends(get_current_user),
    _: None = Depends(permission_required("inspection.manage_missions")),
):
    """Update mission details (title, notes, zones, status)."""
    try:
        async with db.transaction():
            result = await MissionService.update_mission(
                db, UUID(current_user.id), mission_id,
                data.model_dump(exclude_unset=True),
            )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return result


@router.post("/{mission_id}/agents", status_code=201)
async def assign_agents(
    mission_id: UUID,
    data: MissionAgentBatchAssign,
    db=Depends(get_database),
    current_user: UserResponse = Depends(get_current_user),
    _: None = Depends(permission_required("inspection.manage_missions")),
):
    """Batch assign agents to a mission."""
    try:
        async with db.transaction():
            agents = await MissionService.assign_agents(
                db, UUID(current_user.id), mission_id,
                [a.model_dump() for a in data.agents],
            )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return agents


@router.delete("/{mission_id}/agents/{agent_id}", status_code=204)
async def remove_agent(
    mission_id: UUID,
    agent_id: UUID,
    db=Depends(get_database),
    current_user: UserResponse = Depends(get_current_user),
    _: None = Depends(permission_required("inspection.manage_missions")),
):
    """Remove an agent from a mission."""
    try:
        async with db.transaction():
            success = await MissionService.remove_agent(
                db, UUID(current_user.id), mission_id, agent_id,
            )
        if not success:
            raise HTTPException(status_code=404, detail="Agent not found in mission")
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


@router.post("/{mission_id}/complete")
async def complete_mission(
    mission_id: UUID,
    data: MissionCompleteRequest,
    db=Depends(get_database),
    current_user: UserResponse = Depends(get_current_user),
    _: None = Depends(permission_required("inspection.manage_missions")),
):
    """Complete a mission with optional notes."""
    try:
        async with db.transaction():
            result = await MissionService.complete_mission(
                db, UUID(current_user.id), mission_id,
                notes=data.notes,
            )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return result
