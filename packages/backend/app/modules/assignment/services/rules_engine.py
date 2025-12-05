"""
Rules Engine - Assignment rule evaluation and agent selection

Handles:
- Rule-based agent selection
- Load balancing
- Specialization matching
"""

from typing import Optional, List
from uuid import UUID
from fastapi import Depends
from loguru import logger

from app.modules.assignment.models.assignment_rule import AssignmentRule
from app.modules.assignment.repositories.rules_repository import (
    RulesRepository,
    get_rules_repository,
)
from app.modules.assignment.repositories.workload_repository import (
    WorkloadRepository,
    get_workload_repository,
)


class RulesEngine:
    """Engine for evaluating assignment rules and selecting agents"""

    def __init__(
        self,
        rules_repository: Optional[RulesRepository] = None,
        workload_repository: Optional[WorkloadRepository] = None
    ):
        self.rules_repository = rules_repository or RulesRepository()
        self.workload_repository = workload_repository or WorkloadRepository()
        logger.info("RulesEngine initialized")

    async def select_agent(
        self,
        db,
        declaration_type: str,
        priority: int
    ) -> Optional[UUID]:
        """Select best agent for a declaration based on rules"""
        # Get active rules
        rules = await self.rules_repository.get_active_rules(db)

        if not rules:
            # Fallback to load balancing
            return await self._select_by_load_balance(db)

        # Apply rules in priority order
        for rule in sorted(rules, key=lambda r: r.priority):
            agent_id = await self._apply_rule(db, rule, declaration_type, priority)
            if agent_id:
                return agent_id

        return None

    async def _select_by_load_balance(self, db) -> Optional[UUID]:
        """Select agent with lowest workload"""
        workloads = await self.workload_repository.get_available_agents(db)
        if not workloads:
            return None

        # Return agent with lowest workload percentage
        best_agent = min(workloads, key=lambda w: w.workload_percentage)
        return best_agent.agent_id

    async def _apply_rule(
        self,
        db,
        rule: AssignmentRule,
        declaration_type: str,
        priority: int
    ) -> Optional[UUID]:
        """Apply a single rule and return matching agent"""
        # Placeholder for rule application logic
        return None


async def get_rules_engine(
    rules_repo: RulesRepository = Depends(get_rules_repository),
    workload_repo: WorkloadRepository = Depends(get_workload_repository)
) -> RulesEngine:
    """Dependency injection for RulesEngine"""
    return RulesEngine(rules_repo, workload_repo)
