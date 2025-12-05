"""
Agent Workload Models - Pydantic schemas for agent workload tracking

Based on DATABASE_SCHEMA_REFERENCE.md:
- Agent performance and workload metrics
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from uuid import UUID


class AgentWorkload(BaseModel):
    """Agent workload information"""
    agent_id: UUID
    agent_name: str
    current_assignments: int = 0
    max_assignments: int = 20
    pending_count: int = 0
    in_progress_count: int = 0
    completed_today: int = 0
    workload_percentage: float = 0.0
    is_available: bool = True
    last_assignment_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AgentWorkloadStats(BaseModel):
    """Agent workload statistics"""
    period_start: date
    period_end: date
    total_assigned: int = 0
    total_completed: int = 0
    average_processing_time_hours: float = 0.0
    completion_rate: float = 0.0


class AgentPerformanceMetrics(BaseModel):
    """Agent performance metrics"""
    agent_id: UUID
    agent_name: str
    period: str
    declarations_processed: int = 0
    average_time_to_complete_hours: float = 0.0
    on_time_completion_rate: float = 0.0
    rejection_rate: float = 0.0
    quality_score: float = 0.0
    ranking: Optional[int] = None
