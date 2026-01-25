"""
Auto Assignment Service - Automatic assignment of items to agents

Based on DATABASE_SCHEMA_REFERENCE.md (2026-01-18):
- Table: assignments (Migration 053)
- Uses agent_profile_id instead of agent_id
- Uses item_id + item_type instead of declaration_id + declaration_type

Handles:
- Automatic assignment based on rules
- Load balancing across agents
- Specialization-based assignment
"""

from typing import Optional, List, Dict, Any
from uuid import UUID
from fastapi import Depends
from loguru import logger

from app.modules.assignment.models.assignment_history import (
    Assignment,
    AssignmentCreate,
    AssignmentMethod,
)
from app.modules.assignment.models.agent_workload import AgentWorkload
from app.modules.assignment.repositories.assignment_repository import (
    AssignmentRepository,
    get_assignment_repository,
)
from app.modules.assignment.repositories.workload_repository import (
    WorkloadRepository,
    get_workload_repository,
)
from app.modules.assignment.repositories.rules_repository import (
    RulesRepository,
    get_rules_repository,
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
        rules_repository: Optional[RulesRepository] = None,
        rules_engine: Optional[RulesEngine] = None
    ):
        self.assignment_repository = assignment_repository or AssignmentRepository()
        self.workload_repository = workload_repository or WorkloadRepository()
        self.rules_repository = rules_repository or RulesRepository()
        self.rules_engine = rules_engine or RulesEngine()
        logger.info("AutoAssignmentService initialized")

    async def auto_assign_item(
        self,
        db,
        item_id: UUID,
        item_type: str,
        item_data: Dict[str, Any],
        entity_type: str = "ministry",
        entity_id: Optional[str] = None,
        priority_level: int = 5,
        workflow_code: Optional[str] = None
    ) -> Optional[Assignment]:
        """Automatically assign an item to the best available agent

        Args:
            db: Database connection
            item_id: UUID of the item (tax_declaration, service_request, etc.)
            item_type: Type of item (declaration type or workflow code)
            item_data: Item data for rule evaluation
            entity_type: Entity type for filtering agents
            entity_id: Entity ID (UUID) for filtering agents by entity
            priority_level: Priority 1-10 (default 5)
            workflow_code: Workflow code to determine entity (e.g., 'PASAPORTE_NUEVO')

        Returns:
            Assignment or None if no agent available

        Note:
            CRITICAL: Either entity_id or workflow_code should be provided
            to ensure correct routing to the appropriate entity's agents.
            - PASAPORTE_* workflows -> CNEDOGE_PASAPORTE agents
            - RESIDENCIA_* workflows -> CNEDOGE_RESIDENCIA agents
        """
        # Get active rules for this entity
        rules = await self.rules_repository.get_active_rules(
            db, entity_type=entity_type, entity_id=entity_id
        )

        # Convert entity_id string to UUID if needed
        entity_uuid = None
        if entity_id:
            try:
                entity_uuid = UUID(entity_id) if isinstance(entity_id, str) else entity_id
            except (ValueError, TypeError):
                logger.warning(f"Invalid entity_id format: {entity_id}")

        # Use workflow_code to determine entity if not provided
        # This is the key fix: route by workflow_code -> entity -> agents
        effective_workflow = workflow_code or item_type

        # Get available agents filtered by entity
        available_agents = await self.workload_repository.get_available_agents(
            db,
            max_workload_pct=80.0,
            entity_id=entity_uuid,
            workflow_code=effective_workflow if not entity_uuid else None
        )

        if not available_agents:
            logger.warning(f"No available agents for item {item_id}")
            return None

        # Use rules engine to select best agent
        selected_agent_profile_id = await self.rules_engine.select_best_agent(
            db=db,
            item_type=item_type,
            item_data=item_data,
            rules=rules,
            available_agents=available_agents,
            priority_level=priority_level
        )

        if not selected_agent_profile_id:
            # Fallback to load balancing if no rule matched
            selected_agent_profile_id = self._select_by_load_balance(available_agents)

        if not selected_agent_profile_id:
            logger.warning(f"Could not select agent for item {item_id}")
            return None

        # Create assignment with auto method
        assignment_data = AssignmentCreate(
            item_id=item_id,
            item_type=item_type,
            agent_profile_id=selected_agent_profile_id,
            assignment_method=AssignmentMethod.AUTO,
            priority_level=priority_level
        )

        assignment = await self.assignment_repository.create(db, assignment_data, None)
        logger.info(f"Auto-assigned item {item_id} to agent_profile {selected_agent_profile_id}")
        return assignment

    def _select_by_load_balance(
        self,
        available_agents: List[AgentWorkload]
    ) -> Optional[UUID]:
        """Select agent with lowest workload (load balancing fallback)

        Args:
            available_agents: List of AgentWorkload objects

        Returns:
            agent_profile_id of the agent with lowest current_assignments
        """
        if not available_agents:
            return None

        # Sort by current_assignments (ascending) and return the first
        sorted_agents = sorted(
            available_agents,
            key=lambda a: a.current_assignments
        )
        return sorted_agents[0].agent_profile_id

    async def auto_assign(
        self,
        db,
        item_id: UUID,
        item_type: str,
        priority_level: int = 5,
        workflow_code: Optional[str] = None
    ) -> Optional[Assignment]:
        """Simple auto-assign without rule evaluation (backward compatible)

        Args:
            db: Database connection
            item_id: UUID of the item
            item_type: Type of item
            priority_level: Priority 1-10
            workflow_code: Workflow code for entity-based routing

        Note:
            For service_requests, item_type is usually the workflow_code.
            The workflow_code is used to determine which entity's agents
            should receive the assignment (e.g., PASAPORTE_NUEVO -> CNEDOGE_PASAPORTE)
        """
        return await self.auto_assign_item(
            db=db,
            item_id=item_id,
            item_type=item_type,
            item_data={},
            priority_level=priority_level,
            workflow_code=workflow_code or item_type  # Use item_type as fallback
        )

    async def rebalance_assignments(
        self,
        db,
        entity_type: Optional[str] = None,
        entity_id: Optional[str] = None
    ) -> int:
        """Rebalance workload across agents

        Args:
            db: Database connection
            entity_type: Filter by entity type (optional)
            entity_id: Filter by entity ID (optional)

        Returns:
            Number of assignments rebalanced
        """
        # Get available agents
        agents = await self.workload_repository.get_available_agents(
            db, max_workload_pct=100.0
        )

        if len(agents) < 2:
            logger.info("Not enough agents for rebalancing")
            return 0

        # Calculate average workload
        total_assignments = sum(a.current_assignments for a in agents)
        avg_assignments = total_assignments / len(agents)

        # Find overloaded and underloaded agents
        overloaded = [a for a in agents if a.current_assignments > avg_assignments * 1.2]
        underloaded = [a for a in agents if a.current_assignments < avg_assignments * 0.8]

        if not overloaded or not underloaded:
            logger.info("Workload is balanced, no rebalancing needed")
            return 0

        # TODO: Implement actual reassignment logic
        # This would involve:
        # 1. Get oldest/lowest priority assignments from overloaded agents
        # 2. Reassign them to underloaded agents
        # 3. Update workload counts

        logger.info(
            f"Rebalancing: {len(overloaded)} overloaded, {len(underloaded)} underloaded agents"
        )
        return 0  # Placeholder


def get_auto_assignment_service(
    assignment_repo: AssignmentRepository = Depends(get_assignment_repository),
    workload_repo: WorkloadRepository = Depends(get_workload_repository),
    rules_repo: RulesRepository = Depends(get_rules_repository),
    rules_engine: RulesEngine = Depends(get_rules_engine)
) -> AutoAssignmentService:
    """Dependency injection for AutoAssignmentService"""
    return AutoAssignmentService(assignment_repo, workload_repo, rules_repo, rules_engine)
