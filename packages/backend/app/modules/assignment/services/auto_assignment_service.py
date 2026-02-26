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

from app.config import get_settings

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
        workflow_code: Optional[str] = None,
        entity_code: Optional[str] = None,
        entity_location_id: Optional[UUID] = None,
        complexity_score: Optional[int] = None,
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
            workflow_code: Workflow code to determine entity (fallback if no entity_code)
            entity_code: Entity code for deterministic routing (preferred over workflow_code)
            entity_location_id: Specific site UUID for location-based routing (migration 104)
            complexity_score: Computed complexity 0-100 (migration 136). Used for predictive escalation.

        Returns:
            Assignment or None if no agent available

        Note:
            CRITICAL: Prefer entity_code over workflow_code for routing.
            For multi-entity workflows (RESIDENCIA handled by EXTRANJERIA + CNEDOGE),
            workflow_code lookup is nondeterministic. entity_code is authoritative.
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

        # Resolve entity: entity_code (deterministic) > workflow_code (nondeterministic)
        if not entity_uuid and entity_code:
            entity_uuid = await self.workload_repository._get_entity_id_by_code(db, entity_code)
            if entity_uuid:
                logger.info(f"Resolved entity_code '{entity_code}' to entity_id '{entity_uuid}'")

        # Fallback to workflow_code if no entity resolved yet
        effective_workflow = workflow_code or item_type

        # Get available agents filtered by entity + location
        available_agents = await self.workload_repository.get_available_agents(
            db,
            max_workload_pct=get_settings().QUEUE_MAX_WORKLOAD_PCT,
            entity_id=entity_uuid,
            workflow_code=effective_workflow if not entity_uuid else None,
            entity_location_id=entity_location_id,
        )

        if not available_agents:
            logger.warning(f"No available agents for item {item_id}")
            return None

        # Use rules engine first (explicit rules take precedence)
        selected_agent_profile_id = await self.rules_engine.select_best_agent(
            db=db,
            item_type=item_type,
            item_data=item_data,
            rules=rules,
            available_agents=available_agents,
            priority_level=priority_level
        )

        if not selected_agent_profile_id:
            # Multi-criteria scoring (Phase 2 Intelligence)
            # Use complexity_score if available; fallback to priority_level * 10
            effective_complexity = complexity_score if complexity_score is not None else priority_level * 10
            selected_agent_profile_id = await self._score_and_select(
                db=db,
                agents=available_agents,
                workflow_code=effective_workflow,
                entity_location_id=entity_location_id,
                complexity_score=effective_complexity,
            )

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

    async def _score_and_select(
        self,
        db,
        agents: List[AgentWorkload],
        workflow_code: Optional[str] = None,
        entity_location_id: Optional[UUID] = None,
        complexity_score: int = 50,
    ) -> Optional[UUID]:
        """Multi-criteria scoring: select the most ADAPTED agent, not just least loaded.

        Criteria (configurable weights):
          1. Workload    (30%) — lower capacity_percentage = higher score
          2. Success     (25%) — higher success_rate for this workflow = higher score
          3. Specialization (20%) — workflow in agent.specializations = bonus
          4. Site match  (15%) — matching entity_location_id = bonus
          5. Speed       (10%) — lower avg_processing_hours = higher score

        For new agents with no proficiency data, defaults to neutral scores
        so they still receive assignments and build up history.

        Predictive escalation: for complex items (high complexity_score),
        agents with low success_rate on the workflow get a penalty.
        complexity_score is computed from real signals (workflow weight,
        doc count, payment amount) — NOT from administrative priority_level.
        """
        if not agents:
            return None

        # Single agent: skip scoring overhead
        if len(agents) == 1:
            return agents[0].agent_profile_id

        settings = get_settings()

        agent_ids = [a.agent_profile_id for a in agents]

        # Batch-fetch proficiency data for all agents + this workflow
        prof_map: Dict[UUID, Any] = {}
        if workflow_code:
            proficiencies = await db.fetch("""
                SELECT agent_profile_id, success_rate, avg_processing_hours,
                       completions_total, escalations_total
                FROM agent_workflow_proficiency
                WHERE workflow_code = $1 AND agent_profile_id = ANY($2::uuid[])
            """, workflow_code, agent_ids)
            prof_map = {row["agent_profile_id"]: row for row in proficiencies}

        # Batch-fetch actual entity_location_id for site match scoring
        location_match_set: set = set()
        if entity_location_id:
            matched = await db.fetch("""
                SELECT id FROM agent_profiles
                WHERE id = ANY($1::uuid[])
                  AND entity_location_id = $2
            """, agent_ids, entity_location_id)
            location_match_set = {row["id"] for row in matched}

        scores = []
        for agent in agents:
            prof = prof_map.get(agent.agent_profile_id)

            # 1. Workload (lower capacity = higher score, 0-100 range)
            w_score = (1.0 - min(agent.capacity_percentage, 100.0) / 100.0) * 100.0

            # 2. Success rate for this workflow (0-100)
            if prof and (prof["completions_total"] + prof["escalations_total"]) > 0:
                s_score = float(prof["success_rate"])
            else:
                # New agent: neutral score (doesn't penalize, doesn't boost)
                s_score = settings.SCORING_NEW_AGENT_DEFAULT

            # 3. Specialization: workflow in agent's specializations list
            specs = agent.specializations or []
            spec_score = 100.0 if (workflow_code and workflow_code in specs) else 0.0

            # 4. Site match: agent at the requested location
            if entity_location_id:
                site_score = 100.0 if agent.agent_profile_id in location_match_set else 0.0
            else:
                site_score = 50.0  # No location preference — neutral

            # 5. Speed: lower avg_processing_hours = faster = higher score
            if prof and prof["avg_processing_hours"] and prof["completions_total"] > 0:
                avg_h = float(prof["avg_processing_hours"])
            else:
                avg_h = 24.0  # Default assumption for new agents
            speed_score = max(0.0, (1.0 - min(avg_h, 48.0) / 48.0)) * 100.0

            # Weighted total
            total = (
                settings.SCORING_WEIGHT_WORKLOAD * w_score
                + settings.SCORING_WEIGHT_SUCCESS * s_score
                + settings.SCORING_WEIGHT_SPECIALIZATION * spec_score
                + settings.SCORING_WEIGHT_SITE * site_score
                + settings.SCORING_WEIGHT_SPEED * speed_score
            )

            # Predictive escalation penalty: complex items should avoid
            # agents with low success rate on this workflow.
            # complexity_score (0-100) computed from real signals (migration 136)
            # replaces priority_level which was administrative, not complexity.
            if (
                prof
                and complexity_score >= settings.ESCALATION_PREDICTIVE_COMPLEXITY_THRESHOLD
                and prof["completions_total"] >= settings.ESCALATION_PREDICTIVE_MIN_COMPLETIONS
                and float(prof["success_rate"]) < settings.ESCALATION_PREDICTIVE_SUCCESS_THRESHOLD
            ):
                total *= 0.5  # Halve score for underperformers on complex items

            scores.append((agent.agent_profile_id, total, agent.current_assignments))

        # Best score wins. Tie-breaker: lowest current_assignments
        scores.sort(key=lambda x: (-x[1], x[2]))

        if scores:
            winner = scores[0]
            logger.info(
                f"Multi-criteria scoring: selected agent {winner[0]} "
                f"(score={winner[1]:.1f}, assignments={winner[2]}) "
                f"from {len(agents)} candidates for workflow={workflow_code}"
            )
            return winner[0]

        return None

    def _select_by_load_balance(
        self,
        available_agents: List[AgentWorkload]
    ) -> Optional[UUID]:
        """Select agent with lowest workload (simple fallback).

        Used only when _score_and_select is not applicable.
        """
        if not available_agents:
            return None

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
        """Rebalance workload across agents.

        Delegates to workload_rebalance_service which handles:
        - Overloaded/underloaded detection per entity
        - Mobility scoring (lowest-priority items moved first)
        - Specialization-aware target selection
        - Proper DB updates (assignments + service_requests + history)

        Args:
            db: Database connection
            entity_type: Filter by entity type (optional)
            entity_id: Filter by entity ID (optional)

        Returns:
            Number of assignments rebalanced
        """
        from app.modules.assignment.services.workload_rebalance_service import (
            rebalance_entity_workload,
        )

        entity_uuid = None
        if entity_id:
            try:
                entity_uuid = UUID(entity_id)
            except (ValueError, TypeError):
                pass

        result = await rebalance_entity_workload(
            entity_id=entity_uuid,
            db=db,
            performed_by=None,
        )
        return result["reassignments_made"]


def get_auto_assignment_service(
    assignment_repo: AssignmentRepository = Depends(get_assignment_repository),
    workload_repo: WorkloadRepository = Depends(get_workload_repository),
    rules_repo: RulesRepository = Depends(get_rules_repository),
    rules_engine: RulesEngine = Depends(get_rules_engine)
) -> AutoAssignmentService:
    """Dependency injection for AutoAssignmentService"""
    return AutoAssignmentService(assignment_repo, workload_repo, rules_repo, rules_engine)
