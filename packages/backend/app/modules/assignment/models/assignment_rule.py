"""
Assignment Rule Models - Pydantic schemas for assignment rules

Based on DATABASE_SCHEMA_REFERENCE.md:
- Assignment rules and automation configuration
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID
from enum import Enum


class RuleType(str, Enum):
    """Type of assignment rule"""
    ROUND_ROBIN = "round_robin"
    LOAD_BALANCE = "load_balance"
    SPECIALIZATION = "specialization"
    PRIORITY_BASED = "priority_based"


class AssignmentRuleCreate(BaseModel):
    """Create assignment rule request"""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    rule_type: RuleType
    criteria: Dict[str, Any] = {}
    priority: int = Field(default=10, ge=1, le=100)
    is_active: bool = True


class AssignmentRuleUpdate(BaseModel):
    """Update assignment rule request"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    rule_type: Optional[RuleType] = None
    criteria: Optional[Dict[str, Any]] = None
    priority: Optional[int] = Field(None, ge=1, le=100)
    is_active: Optional[bool] = None


class AssignmentRule(BaseModel):
    """Assignment rule response model"""
    id: UUID
    name: str
    description: Optional[str] = None
    rule_type: RuleType
    criteria: Dict[str, Any] = {}
    priority: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by: Optional[UUID] = None

    class Config:
        from_attributes = True
