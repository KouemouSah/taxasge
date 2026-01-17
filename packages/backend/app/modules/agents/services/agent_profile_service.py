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
import json

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

    # ========================================================================
    # AGENT INVITATION FLOW (2-step: invite → activate)
    # ========================================================================

    async def initiate_agent_invitation(
        self,
        data,  # AgentInviteRequest
        created_by: UUID,
    ) -> Dict[str, Any]:
        """
        Step 1: Initiate agent invitation.

        This method:
        1. Validates the data
        2. Generates a verification code
        3. Stores invitation in pending_registrations with metadata
        4. Sends invitation email to the agent

        The agent must click the link and set their password to complete registration.

        Args:
            data: AgentInviteRequest model (no password)
            created_by: UUID of admin performing the invitation

        Returns:
            Dict with email, message, expires_at
        """
        import secrets
        from app.modules.auth.repositories.pending_registration_repository import PendingRegistrationRepository
        from app.modules.communications.services.email_service import EmailService

        # Check if email already exists
        from app.database.connection import db_manager
        existing = await db_manager.execute_single(
            "SELECT id FROM users WHERE email = $1",
            data.user.email.lower()
        )
        if existing:
            raise ValueError(f"Un compte existe déjà avec l'email {data.user.email}")

        # Generate 6-digit verification code
        verification_code = ''.join([str(secrets.randbelow(10)) for _ in range(6)])

        # Prepare user data (without password)
        user_data = {
            'first_name': data.user.first_name,
            'last_name': data.user.last_name,
            'phone_number': data.user.phone_number,
            'preferred_language': data.user.preferred_language,
        }

        # Prepare agent profile data
        agent_data = {
            'agent_type': data.agent_type.value,
            'is_supervisor': data.is_supervisor,
            'entity_id': str(data.entity_id) if data.entity_id else None,
            'ministry_id': data.ministry_id,
            'agent_role': data.agent_role,
            'rbac_role_id': str(data.rbac_role_id) if data.rbac_role_id else None,
            'can_approve_unlimited': data.can_approve_unlimited,
            'max_approval_amount': float(data.max_approval_amount) if data.max_approval_amount else None,
            'can_escalate': data.can_escalate,
            'can_assign_tasks': data.can_assign_tasks,
            'can_reassign': data.can_reassign,
            'specializations': data.specializations or [],
            'working_hours_start': str(data.working_hours_start) if data.working_hours_start else None,
            'working_hours_end': str(data.working_hours_end) if data.working_hours_end else None,
            'working_days': data.working_days or [1, 2, 3, 4, 5],
        }

        # Store in pending_registrations
        pending_repo = PendingRegistrationRepository()
        await pending_repo.create_agent_invitation(
            email=data.user.email.lower(),
            verification_code=verification_code,
            user_data=user_data,
            agent_data=agent_data,
            created_by=str(created_by),
            expires_in_minutes=1440  # 24 hours
        )

        # Send invitation email
        from app.modules.communications.services.email_service import get_email_service
        email_service = get_email_service()
        try:
            email_service.send_agent_invitation(
                to_email=data.user.email,
                first_name=data.user.first_name,
                verification_code=verification_code,
                language=data.user.preferred_language or 'es'
            )
            logger.info(f"Agent invitation email sent to {data.user.email}")
        except Exception as e:
            logger.error(f"Failed to send agent invitation email: {e}")
            # Don't fail the invitation, email can be resent

        logger.info(
            f"Agent invitation initiated: email={data.user.email}, "
            f"type={data.agent_type.value}, created_by={created_by}"
        )

        return {
            "email": data.user.email,
            "full_name": f"{data.user.first_name} {data.user.last_name}",
            "message": "Invitation envoyée. L'agent doit valider son email et définir son mot de passe.",
            "expires_in_hours": 24,
        }

    async def finalize_agent_creation(
        self,
        conn,
        email: str,
        verification_code: str,
        password: str,
    ) -> Dict[str, Any]:
        """
        Step 2: Finalize agent creation after email validation.

        This method:
        1. Verifies the code and retrieves stored metadata
        2. Creates the user with the provided password
        3. Creates the agent profile
        4. Assigns RBAC permissions
        5. Creates workload record
        6. Deletes the pending registration

        Args:
            conn: Database connection
            email: Agent's email
            verification_code: 6-digit code from email
            password: Password chosen by the agent

        Returns:
            Dict with user_id, profile_id, tokens, etc.
        """
        import bcrypt
        from app.modules.auth.repositories.pending_registration_repository import PendingRegistrationRepository

        pending_repo = PendingRegistrationRepository()

        # Verify code and get metadata
        metadata = await pending_repo.verify_code_and_get_data(email.lower(), verification_code)

        if not metadata:
            raise ValueError("Code de vérification invalide ou expiré")

        if metadata.get('registration_type') != 'agent':
            raise ValueError("Cette invitation n'est pas pour un agent")

        user_data = metadata.get('user_data', {})
        agent_data = metadata.get('agent_data', {})
        created_by = metadata.get('created_by')

        # Hash password
        password_hash = bcrypt.hashpw(
            password.encode('utf-8'),
            bcrypt.gensalt(rounds=12)
        ).decode('utf-8')

        async with conn.transaction():
            # 1. Create user
            user_query = """
                INSERT INTO users (email, password_hash, first_name, last_name,
                                   phone_number, role, preferred_language, status,
                                   email_verified, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, 'agent', $6, 'active', TRUE, NOW(), NOW())
                RETURNING id, email, first_name, last_name
            """
            user_row = await conn.fetchrow(
                user_query,
                email.lower(),
                password_hash,
                user_data.get('first_name'),
                user_data.get('last_name'),
                user_data.get('phone_number'),
                user_data.get('preferred_language', 'es'),
            )
            user_id = user_row["id"]

            # 2. Create agent profile
            entity_id = UUID(agent_data['entity_id']) if agent_data.get('entity_id') else None
            rbac_role_id = UUID(agent_data['rbac_role_id']) if agent_data.get('rbac_role_id') else None
            assigned_by = UUID(created_by) if created_by else None

            # Convert time strings back to datetime.time objects for PostgreSQL TIME columns
            from datetime import time as dt_time
            working_hours_start = None
            working_hours_end = None
            if agent_data.get('working_hours_start'):
                try:
                    parts = agent_data['working_hours_start'].split(':')
                    working_hours_start = dt_time(int(parts[0]), int(parts[1]))
                except (ValueError, IndexError):
                    working_hours_start = dt_time(8, 0)  # Default 08:00
            if agent_data.get('working_hours_end'):
                try:
                    parts = agent_data['working_hours_end'].split(':')
                    working_hours_end = dt_time(int(parts[0]), int(parts[1]))
                except (ValueError, IndexError):
                    working_hours_end = dt_time(17, 0)  # Default 17:00

            profile_query = """
                INSERT INTO agent_profiles (
                    user_id, agent_type, is_supervisor, entity_id, ministry_id,
                    agent_role, can_approve_unlimited, max_approval_amount,
                    can_escalate, can_assign_tasks, can_reassign,
                    specializations, working_hours_start, working_hours_end,
                    working_days, is_active, assigned_by, assigned_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13, $14, $15, TRUE, $16, NOW()
                )
                RETURNING id
            """
            profile_row = await conn.fetchrow(
                profile_query,
                user_id,
                agent_data.get('agent_type'),
                agent_data.get('is_supervisor', False),
                entity_id,
                agent_data.get('ministry_id'),
                agent_data.get('agent_role', 'validator'),
                agent_data.get('can_approve_unlimited', False),
                agent_data.get('max_approval_amount'),
                agent_data.get('can_escalate', True),
                agent_data.get('can_assign_tasks', False),
                agent_data.get('can_reassign', False),
                json.dumps(agent_data.get('specializations', [])),
                working_hours_start,
                working_hours_end,
                agent_data.get('working_days', [1, 2, 3, 4, 5]),
                assigned_by,
            )
            profile_id = profile_row["id"]

            # 3. Assign RBAC role if provided
            if rbac_role_id:
                role_check = await conn.fetchrow(
                    """SELECT id FROM roles WHERE id = $1
                       AND (entity_type IN ('agent', 'ministry_agent', 'entity_agent')
                            OR entity_type IS NULL)""",
                    rbac_role_id
                )
                if role_check:
                    perms_query = """
                        SELECT permission_id FROM role_permissions
                        WHERE role_id = $1 AND granted = TRUE
                    """
                    role_permissions = await conn.fetch(perms_query, rbac_role_id)

                    for perm in role_permissions:
                        await conn.execute("""
                            INSERT INTO user_permissions (user_id, permission_id, granted, granted_by, granted_at)
                            VALUES ($1, $2, TRUE, $3, NOW())
                            ON CONFLICT (user_id, permission_id) DO UPDATE SET granted = TRUE
                        """, user_id, perm["permission_id"], assigned_by)

                    logger.info(f"Assigned RBAC role {rbac_role_id} to agent {user_id}")

            # 4. Create workload record
            await conn.execute("""
                INSERT INTO agent_workloads (agent_profile_id, current_assignments,
                    pending_declarations, in_progress_declarations, max_concurrent_assignments,
                    capacity_percentage, workload_status, availability)
                VALUES ($1, 0, 0, 0, 10, 0, 'available', 'available')
            """, profile_id)

        # 5. Delete pending registration
        await pending_repo.delete_by_email(email.lower())

        logger.info(
            f"Agent creation finalized: user={user_id}, profile={profile_id}, "
            f"type={agent_data.get('agent_type')}"
        )

        return {
            "user_id": user_id,
            "user_email": email,
            "user_full_name": f"{user_data.get('first_name')} {user_data.get('last_name')}",
            "profile_id": profile_id,
            "agent_type": agent_data.get('agent_type'),
            "is_supervisor": agent_data.get('is_supervisor', False),
            "message": "Compte agent créé avec succès. Vous pouvez maintenant vous connecter.",
        }

    # ========================================================================
    # ADMIN INVITATION FLOW (2-step: invite → activate)
    # ========================================================================

    async def initiate_admin_invitation(
        self,
        data,  # AdminInviteRequest
        created_by: UUID,
    ) -> Dict[str, Any]:
        """
        Step 1: Initiate admin invitation.

        Similar to agent invitation but for admin users (no profile needed).
        """
        import secrets
        from app.modules.auth.repositories.pending_registration_repository import PendingRegistrationRepository
        from app.modules.communications.services.email_service import EmailService
        from app.database.connection import db_manager

        # Check if email already exists
        existing = await db_manager.execute_single(
            "SELECT id FROM users WHERE email = $1",
            data.email.lower()
        )
        if existing:
            raise ValueError(f"Un compte existe déjà avec l'email {data.email}")

        # Generate 6-digit verification code
        verification_code = ''.join([str(secrets.randbelow(10)) for _ in range(6)])

        # Prepare user data
        user_data = {
            'first_name': data.first_name,
            'last_name': data.last_name,
            'phone_number': data.phone_number,
            'preferred_language': data.preferred_language,
        }

        # Store in pending_registrations
        pending_repo = PendingRegistrationRepository()
        await pending_repo.create_admin_invitation(
            email=data.email.lower(),
            verification_code=verification_code,
            user_data=user_data,
            created_by=str(created_by),
            expires_in_minutes=1440  # 24 hours
        )

        # Send invitation email
        from app.modules.communications.services.email_service import get_email_service
        email_service = get_email_service()
        try:
            email_service.send_admin_invitation(
                to_email=data.email,
                first_name=data.first_name,
                verification_code=verification_code,
                language=data.preferred_language or 'es'
            )
            logger.info(f"Admin invitation email sent to {data.email}")
        except Exception as e:
            logger.error(f"Failed to send admin invitation email: {e}")

        logger.info(f"Admin invitation initiated: email={data.email}, created_by={created_by}")

        return {
            "email": data.email,
            "full_name": f"{data.first_name} {data.last_name}",
            "message": "Invitation envoyée. L'administrateur doit valider son email et définir son mot de passe.",
            "expires_in_hours": 24,
        }

    async def finalize_admin_creation(
        self,
        conn,
        email: str,
        verification_code: str,
        password: str,
    ) -> Dict[str, Any]:
        """
        Step 2: Finalize admin creation after email validation.
        """
        import bcrypt
        from app.modules.auth.repositories.pending_registration_repository import PendingRegistrationRepository

        pending_repo = PendingRegistrationRepository()

        # Verify code and get metadata
        metadata = await pending_repo.verify_code_and_get_data(email.lower(), verification_code)

        if not metadata:
            raise ValueError("Code de vérification invalide ou expiré")

        if metadata.get('registration_type') != 'admin':
            raise ValueError("Cette invitation n'est pas pour un administrateur")

        user_data = metadata.get('user_data', {})

        # Hash password
        password_hash = bcrypt.hashpw(
            password.encode('utf-8'),
            bcrypt.gensalt(rounds=12)
        ).decode('utf-8')

        # Create user with admin role
        user_query = """
            INSERT INTO users (email, password_hash, first_name, last_name,
                               phone_number, role, preferred_language, status,
                               email_verified, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, 'admin', $6, 'active', TRUE, NOW(), NOW())
            RETURNING id, email, first_name, last_name
        """
        user_row = await conn.fetchrow(
            user_query,
            email.lower(),
            password_hash,
            user_data.get('first_name'),
            user_data.get('last_name'),
            user_data.get('phone_number'),
            user_data.get('preferred_language', 'es'),
        )

        # Delete pending registration
        await pending_repo.delete_by_email(email.lower())

        logger.info(f"Admin creation finalized: user={user_row['id']} ({email})")

        return {
            "user_id": user_row["id"],
            "email": email,
            "full_name": f"{user_data.get('first_name')} {user_data.get('last_name')}",
            "role": "admin",
            "message": "Compte administrateur créé avec succès. Vous pouvez maintenant vous connecter.",
        }


# Singleton instance
agent_profile_service = AgentProfileService()
