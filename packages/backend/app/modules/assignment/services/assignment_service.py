"""
Assignment Service - Business logic for manual assignment operations

Handles:
- Manual assignment of declarations to agents
- Reassignment with history tracking
- Assignment status updates
"""

from typing import Optional, List
from uuid import UUID
from fastapi import Depends
from loguru import logger

from app.modules.assignment.models.assignment_history import (
    Assignment,
    AssignmentCreate,
    AssignmentUpdate,
    ReassignmentCreate,
)
from app.modules.assignment.repositories.assignment_repository import (
    AssignmentRepository,
    get_assignment_repository,
)


class AssignmentService:
    """Service for manual assignment operations"""

    def __init__(self, repository: Optional[AssignmentRepository] = None):
        self.repository = repository or AssignmentRepository()
        logger.info("AssignmentService initialized")

    async def create_assignment(
        self,
        db,
        data: AssignmentCreate,
        assigned_by: UUID
    ) -> Assignment:
        """Create a new assignment"""
        return await self.repository.create(db, data, assigned_by)

    async def get_assignment(self, db, assignment_id: UUID) -> Optional[Assignment]:
        """Get assignment by ID"""
        return await self.repository.get_by_id(db, assignment_id)

    async def update_assignment(
        self,
        db,
        assignment_id: UUID,
        data: AssignmentUpdate
    ) -> Optional[Assignment]:
        """Update assignment"""
        return await self.repository.update(db, assignment_id, data)

    async def reassign(
        self,
        db,
        data: ReassignmentCreate,
        reassigned_by: UUID
    ) -> Optional[Assignment]:
        """Reassign declaration to another agent"""
        return await self.repository.reassign(db, data, reassigned_by)

    async def list_assignments(
        self,
        db,
        agent_id: Optional[UUID] = None,
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Assignment]:
        """List assignments with optional filters"""
        return await self.repository.list_all(db, agent_id, status, limit, offset)


async def get_assignment_service(
    repository: AssignmentRepository = Depends(get_assignment_repository)
) -> AssignmentService:
    """Dependency injection for AssignmentService"""
    return AssignmentService(repository)
