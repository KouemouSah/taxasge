"""
Agent Profile Service - Business logic for agent profile management

Uses the new agent_profiles table for unified agent management.
Supports ministry_agent and entity_agent types with is_supervisor capability.
"""

from typing import Dict, Any, Optional, List
from uuid import UUID
from loguru import logger
from decimal import Decimal
import asyncpg

from app.modules.agents.repositories.agent_profile_repository import (
    agent_profile_repository,
    AgentProfileRepository,
)
from app.modules.agents.repositories.workload_repository import WorkloadRepository
from app.modules.agents.models.agent_profile import (
    AgentProfileCreate,
    AgentProfileUpdate,
    AgentListFilters,
    AgentType,
)


class AgentProfileService:
    """Service for agent profile management"""

    def __init__(
        self,
        profile_repository: Optional[AgentProfileRepository] = None,
        workload_repository: Optional[WorkloadRepository] = None,
    ):
        self.profile_repo = profile_repository or agent_profile_repository
        self.workload_repo = workload_repository or WorkloadRepository()

    # ========================================================================
    # CRUD OPERATIONS
    # ========================================================================

    async def create_agent_profile(
        self,
        conn: asyncpg.Connection,
        profile_data: AgentProfileCreate,
        create_workload: bool = True,
    ) -> Dict[str, Any]:
        """
        Create a new agent profile with optional workload initialization.

        Args:
            conn: Database connection
            profile_data: Profile creation data
            create_workload: Whether to create initial workload record

        Returns:
            Created profile with details
        """
        # Validate agent type requirements
        validation = self._validate_profile_data(profile_data)
        if not validation["valid"]:
            raise ValueError(validation["error"])

        # Create the profile
        profile = await self.profile_repo.create(conn, profile_data)
        profile_id = profile["id"]

        logger.info(
            f"Created agent profile {profile_id} for user {profile_data.user_id} "
            f"(type: {profile_data.agent_type}, supervisor: {profile_data.is_supervisor})"
        )

        # Create workload record if requested
        if create_workload:
            workload = await self.workload_repo.create_workload_for_profile(
                conn, str(profile_id)
            )
            if workload:
                logger.debug(f"Created workload record for profile {profile_id}")

        # Return profile with details
        return await self.profile_repo.get_with_details(conn, UUID(str(profile_id)))

    async def get_agent_profile(
        self,
        conn: asyncpg.Connection,
        profile_id: UUID,
        include_details: bool = True,
    ) -> Optional[Dict[str, Any]]:
        """Get agent profile by ID, optionally with full details."""
        if include_details:
            return await self.profile_repo.get_with_details(conn, profile_id)
        return await self.profile_repo.get_by_id(conn, profile_id)

    async def get_agent_by_user_id(
        self,
        conn: asyncpg.Connection,
        user_id: UUID,
        active_only: bool = True,
    ) -> Optional[Dict[str, Any]]:
        """Get agent profile by user ID."""
        profile = await self.profile_repo.get_by_user_id(conn, user_id, active_only)
        if profile:
            return await self.profile_repo.get_with_details(conn, UUID(str(profile["id"])))
        return None

    async def update_agent_profile(
        self,
        conn: asyncpg.Connection,
        profile_id: UUID,
        update_data: AgentProfileUpdate,
    ) -> Optional[Dict[str, Any]]:
        """Update an agent profile."""
        profile = await self.profile_repo.update(conn, profile_id, update_data)
        if profile:
            logger.info(f"Updated agent profile {profile_id}")
            return await self.profile_repo.get_with_details(conn, profile_id)
        return None

    async def deactivate_agent_profile(
        self,
        conn: asyncpg.Connection,
        profile_id: UUID,
        deactivated_by: UUID,
        reason: Optional[str] = None,
    ) -> bool:
        """Deactivate an agent profile."""
        success = await self.profile_repo.deactivate(
            conn, profile_id, deactivated_by, reason
        )
        if success:
            logger.info(
                f"Deactivated agent profile {profile_id} by {deactivated_by}: {reason}"
            )
        return success

    async def reactivate_agent_profile(
        self,
        conn: asyncpg.Connection,
        profile_id: UUID,
    ) -> bool:
        """Reactivate a deactivated agent profile."""
        success = await self.profile_repo.reactivate(conn, profile_id)
        if success:
            logger.info(f"Reactivated agent profile {profile_id}")
        return success

    # ========================================================================
    # LIST & SEARCH
    # ========================================================================

    async def list_agent_profiles(
        self,
        conn: asyncpg.Connection,
        filters: AgentListFilters,
    ) -> Dict[str, Any]:
        """
        List agent profiles with filters and pagination.

        Returns:
            {
                "items": List of profiles,
                "total": Total count,
                "limit": Page size,
                "offset": Current offset
            }
        """
        profiles, total = await self.profile_repo.list_agents(conn, filters)
        return {
            "items": profiles,
            "total": total,
            "limit": filters.limit,
            "offset": filters.offset,
        }

    async def get_agents_by_ministry(
        self,
        conn: asyncpg.Connection,
        ministry_id: int,
        supervisors_only: bool = False,
        active_only: bool = True,
    ) -> List[Dict[str, Any]]:
        """Get all agents for a ministry."""
        filters = AgentListFilters(
            ministry_id=ministry_id,
            is_supervisor=True if supervisors_only else None,
            is_active=active_only,
            limit=1000,
        )
        profiles, _ = await self.profile_repo.list_agents(conn, filters)
        return profiles

    async def get_agents_by_entity(
        self,
        conn: asyncpg.Connection,
        entity_id: UUID,
        supervisors_only: bool = False,
        active_only: bool = True,
    ) -> List[Dict[str, Any]]:
        """Get all agents for an entity."""
        filters = AgentListFilters(
            entity_id=entity_id,
            is_supervisor=True if supervisors_only else None,
            is_active=active_only,
            limit=1000,
        )
        profiles, _ = await self.profile_repo.list_agents(conn, filters)
        return profiles

    async def get_dgi_agents(
        self,
        conn: asyncpg.Connection,
        active_only: bool = True,
    ) -> List[Dict[str, Any]]:
        """Get all DGI agents."""
        filters = AgentListFilters(
            agent_category="dgi",
            is_active=active_only,
            limit=1000,
        )
        profiles, _ = await self.profile_repo.list_agents(conn, filters)
        return profiles

    async def get_treasury_agents(
        self,
        conn: asyncpg.Connection,
        active_only: bool = True,
    ) -> List[Dict[str, Any]]:
        """Get all Treasury agents."""
        filters = AgentListFilters(
            agent_category="treasury",
            is_active=active_only,
            limit=1000,
        )
        profiles, _ = await self.profile_repo.list_agents(conn, filters)
        return profiles

    # ========================================================================
    # ASSIGNMENT & AVAILABILITY
    # ========================================================================

    async def get_available_agents_for_assignment(
        self,
        conn: asyncpg.Connection,
        ministry_id: Optional[int] = None,
        entity_id: Optional[UUID] = None,
        min_approval_amount: Optional[Decimal] = None,
        exclude_overloaded: bool = True,
    ) -> List[Dict[str, Any]]:
        """
        Get agents available for task assignment.

        Args:
            conn: Database connection
            ministry_id: Filter by ministry
            entity_id: Filter by entity
            min_approval_amount: Minimum approval amount needed
            exclude_overloaded: Exclude overloaded agents

        Returns:
            List of available agents sorted by capacity
        """
        return await self.profile_repo.get_available_agents(
            conn,
            ministry_id=ministry_id,
            entity_id=entity_id,
            min_approval_amount=float(min_approval_amount) if min_approval_amount else None,
            exclude_overloaded=exclude_overloaded,
        )

    async def get_supervisors(
        self,
        conn: asyncpg.Connection,
        ministry_id: Optional[int] = None,
        entity_id: Optional[UUID] = None,
    ) -> List[Dict[str, Any]]:
        """Get supervisor agents."""
        return await self.profile_repo.get_supervisors(
            conn, ministry_id=ministry_id, entity_id=entity_id
        )

    async def find_best_agent_for_task(
        self,
        conn: asyncpg.Connection,
        ministry_id: Optional[int] = None,
        entity_id: Optional[UUID] = None,
        required_amount: Optional[Decimal] = None,
        specialization: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Find the best available agent for a task.

        Returns the agent with lowest workload who meets all requirements.
        """
        agents = await self.get_available_agents_for_assignment(
            conn,
            ministry_id=ministry_id,
            entity_id=entity_id,
            min_approval_amount=required_amount,
        )

        if not agents:
            logger.warning(
                f"No available agents found for ministry={ministry_id}, entity={entity_id}"
            )
            return None

        # Filter by specialization if provided
        if specialization:
            specialized = [
                a for a in agents
                if specialization in (a.get("specializations") or [])
            ]
            if specialized:
                agents = specialized

        # Return agent with lowest capacity (already sorted by repository)
        best_agent = agents[0]
        logger.info(
            f"Best agent for task: {best_agent.get('id')} "
            f"(capacity: {best_agent.get('capacity_percentage')}%)"
        )
        return best_agent

    # ========================================================================
    # STATISTICS
    # ========================================================================

    async def get_ministry_agent_stats(
        self,
        conn: asyncpg.Connection,
        ministry_id: int,
    ) -> Dict[str, int]:
        """Get agent count statistics for a ministry."""
        return await self.profile_repo.count_by_ministry(conn, ministry_id)

    async def get_entity_agent_stats(
        self,
        conn: asyncpg.Connection,
        entity_id: UUID,
    ) -> Dict[str, int]:
        """Get agent count statistics for an entity."""
        return await self.profile_repo.count_by_entity(conn, entity_id)

    # ========================================================================
    # HELPERS
    # ========================================================================

    def _validate_profile_data(
        self,
        profile_data: AgentProfileCreate,
    ) -> Dict[str, Any]:
        """Validate profile creation data."""
        # Agent must be assigned to either ministry or entity
        if not profile_data.ministry_id and not profile_data.entity_id:
            return {
                "valid": False,
                "error": "Agent must be assigned to a ministry or entity",
            }

        # Entity agent must have entity_id
        if profile_data.agent_type == AgentType.ENTITY_AGENT and not profile_data.entity_id:
            return {
                "valid": False,
                "error": "Entity agent must have an entity_id",
            }

        # Ministry agent must have ministry_id
        if profile_data.agent_type == AgentType.MINISTRY_AGENT and not profile_data.ministry_id:
            return {
                "valid": False,
                "error": "Ministry agent must have a ministry_id",
            }

        return {"valid": True, "error": None}


# Singleton instance
agent_profile_service = AgentProfileService()
