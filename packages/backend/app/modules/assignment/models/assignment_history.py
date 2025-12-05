"""
Assignment History Models - Pydantic schemas for assignment tracking

Based on DATABASE_SCHEMA_REFERENCE.md tables:
- declaration_assignments (assignment tracking)
- assignment_history (history of changes)
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
from uuid import UUID


class AssignmentStatus(str, Enum):
    """Assignment status enum"""
    PENDING = "pending"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    REJECTED = "rejected"
    REASSIGNED = "reassigned"


class ReassignmentReason(str, Enum):
    """Reason for reassignment"""
    WORKLOAD_BALANCE = "workload_balance"
    AGENT_UNAVAILABLE = "agent_unavailable"
    ESCALATION = "escalation"
    SPECIALIZATION = "specialization"
    SUPERVISOR_REQUEST = "supervisor_request"
    OTHER = "other"


class AssignmentCreate(BaseModel):
    """Create assignment request"""
    declaration_id: UUID
    agent_id: UUID
    priority: int = Field(default=5, ge=1, le=10)
    notes: Optional[str] = None


class AssignmentUpdate(BaseModel):
    """Update assignment request"""
    status: Optional[AssignmentStatus] = None
    priority: Optional[int] = Field(None, ge=1, le=10)
    notes: Optional[str] = None


class Assignment(BaseModel):
    """Assignment response model"""
    id: UUID
    declaration_id: UUID
    agent_id: UUID
    assigned_by: Optional[UUID] = None
    status: AssignmentStatus
    priority: int
    assigned_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class ReassignmentCreate(BaseModel):
    """Reassignment request"""
    assignment_id: UUID
    new_agent_id: UUID
    reason: ReassignmentReason
    notes: Optional[str] = None


class AssignmentStats(BaseModel):
    """Assignment statistics"""
    total_assignments: int = 0
    pending_count: int = 0
    in_progress_count: int = 0
    completed_count: int = 0
    average_processing_time_hours: Optional[float] = None


class AssignmentBulkReassign(BaseModel):
    """Bulk reassignment request"""
    assignment_ids: List[UUID]
    new_agent_id: UUID
    reason: ReassignmentReason
    notes: Optional[str] = None


class BulkReassignResult(BaseModel):
    """Bulk reassignment result"""
    successful: int = 0
    failed: int = 0
    errors: List[Dict[str, Any]] = []
