"""
Auto Assignment Service - Automatic assignment of declarations

Handles:
- Automatic assignment based on rules
- Load balancing across agents
- Specialization-based assignment
"""

from typing import Optional, List
from uuid import UUID
from fastapi import Depends
from loguru import logger

from app.modules.assignment.models.assignment_history import Assignment
from app.modules.assignment.repositories.assignment_repository import (
    AssignmentRepository,
    get_assignment_repository,
)
from app.modules.assignment.repositories.workload_repository import (
    WorkloadRepository,
    get_workload_repository,
)
from app.modules.assignment.services.rules_engine import (
    RulesEngine,
    get_rules_engine,
)


class AutoAssignmentService:
    """Service for automatic assignment operations"""

    def __init__(
        self,
        assignment_repository: Optional[AssignmentRepository] = None,
        workload_repository: Optional[WorkloadRepository] = None,
        rules_engine: Optional[RulesEngine] = None
    ):
        self.assignment_repository = assignment_repository or AssignmentRepository()
        self.workload_repository = workload_repository or WorkloadRepository()
        self.rules_engine = rules_engine or RulesEngine()
        logger.info("AutoAssignmentService initialized")

    async def auto_assign(
        self,
        db,
        declaration_id: UUID,
        declaration_type: str,
        priority: int = 5
    ) -> Optional[Assignment]:
        """Automatically assign a declaration to an available agent"""
        # Get best agent based on rules
        agent_id = await self.rules_engine.select_agent(
            db, declaration_type, priority
        )

        if not agent_id:
            logger.warning(f"No available agent for declaration {declaration_id}")
            return None

        # Create assignment
        from app.modules.assignment.models.assignment_history import AssignmentCreate
        assignment_data = AssignmentCreate(
            declaration_id=declaration_id,
            agent_id=agent_id,
            priority=priority
        )

        return await self.assignment_repository.create(db, assignment_data, None)

    async def rebalance_assignments(self, db) -> int:
        """Rebalance workload across agents"""
        # Placeholder for workload rebalancing logic
        logger.info("Rebalancing assignments across agents")
        return 0


async def get_auto_assignment_service(
    assignment_repo: AssignmentRepository = Depends(get_assignment_repository),
    workload_repo: WorkloadRepository = Depends(get_workload_repository),
    rules_engine: RulesEngine = Depends(get_rules_engine)
) -> AutoAssignmentService:
    """Dependency injection for AutoAssignmentService"""
    return AutoAssignmentService(assignment_repo, workload_repo, rules_engine)
