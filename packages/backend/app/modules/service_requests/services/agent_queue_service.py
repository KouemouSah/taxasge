"""
Agent Queue Service for Service Requests.

Integrates service_requests with the agent_work_queue system.
Enables agents to receive, process, and manage service requests.
"""
from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime, timedelta
from decimal import Decimal
import asyncpg
from loguru import logger

from ..workflows.base_workflow import BaseWorkflow
from app.modules.agents.models import (
    AgentWorkQueueCreate,
    AssignmentCreate,
    AssignmentMethod,
    AssignmentStatus
)


class AgentQueueService:
    """
    Service for managing service_requests in the agent work queue.

    This service bridges the service_requests module with the agents module,
    allowing service requests to be processed through the same queue as declarations.
    """

    # Item type identifier for service_requests in agent_work_queue
    ITEM_TYPE = "service_request"

    # Default SLA hours if not specified in workflow
    DEFAULT_SLA_HOURS = 48

    # Entity code to ministry_id mapping
    # TODO: This should come from the database (ministries table)
    ENTITY_TO_MINISTRY = {
        "CNEDOGE": 1,       # Identidad
        "EXTRANJERIA": 2,   # Extranjería
        "DGT": 3,           # Tráfico
        "ONRC": 4,          # Registro Civil
        "MINFP": 5,         # Función Pública
        "ITVE": 3,          # ITV (under DGT)
        "OFIVE": 3,         # OFIVE (under DGT)
    }

    # Priority base scores by workflow category
    CATEGORY_PRIORITIES = {
        "identidad": 50,
        "residencia": 60,
        "vehiculo": 40,
        "contrato": 45,
        "conducir": 35,
        "funcion_publica": 55,
    }

    async def add_to_queue(
        self,
        db: asyncpg.Connection,
        service_request_id: UUID,
        workflow_code: str,
        entity_code: str,
        workflow_instance: Optional[BaseWorkflow] = None,
        priority_boost: int = 0
    ) -> Dict[str, Any]:
        """
        Add a service_request to the agent work queue.

        Called when a service_request transitions to SUBMITTED status.

        Args:
            db: Database connection
            service_request_id: The service request ID
            workflow_code: The workflow code (e.g., PASAPORTE_NUEVO)
            entity_code: The responsible entity code (e.g., CNEDOGE)
            workflow_instance: Optional workflow instance for custom settings
            priority_boost: Additional priority points

        Returns:
            The created queue item
        """
        # Get ministry_id from entity_code
        ministry_id = await self._get_ministry_id(db, entity_code)

        # Calculate priority score
        priority_score = await self._calculate_priority(
            db=db,
            workflow_code=workflow_code,
            workflow_instance=workflow_instance,
            priority_boost=priority_boost
        )

        # Calculate SLA deadline
        sla_deadline = await self._calculate_sla_deadline(
            db=db,
            workflow_code=workflow_code,
            workflow_instance=workflow_instance
        )

        # Check if already in queue
        existing = await db.fetchrow("""
            SELECT id FROM agent_work_queue
            WHERE item_type = $1 AND item_id = $2
            AND status NOT IN ('completed', 'cancelled')
        """, self.ITEM_TYPE, str(service_request_id))

        if existing:
            logger.warning(
                f"Service request {service_request_id} already in queue: {existing['id']}"
            )
            return await self._get_queue_item(db, existing['id'])

        # Insert into queue
        row = await db.fetchrow("""
            INSERT INTO agent_work_queue (
                item_type,
                item_id,
                ministry_id,
                declaration_type,
                priority_score,
                sla_deadline,
                status,
                created_at,
                updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW(), NOW())
            RETURNING *
        """, self.ITEM_TYPE, str(service_request_id), ministry_id,
            workflow_code, priority_score, sla_deadline)

        logger.info(
            f"Added service_request {service_request_id} to queue. "
            f"Priority: {priority_score}, SLA: {sla_deadline}"
        )

        return dict(row)

    async def _get_ministry_id(
        self,
        db: asyncpg.Connection,
        entity_code: str
    ) -> int:
        """Get ministry_id from entity_code."""

        # Try database lookup first
        ministry_id = await db.fetchval("""
            SELECT m.id
            FROM ministries m
            JOIN entities e ON e.ministry_id = m.id
            WHERE e.code = $1
        """, entity_code)

        if ministry_id:
            return ministry_id

        # Fallback to hardcoded mapping
        return self.ENTITY_TO_MINISTRY.get(entity_code, 1)

    async def _calculate_priority(
        self,
        db: asyncpg.Connection,
        workflow_code: str,
        workflow_instance: Optional[BaseWorkflow],
        priority_boost: int
    ) -> Decimal:
        """Calculate priority score for the queue item."""

        # Get workflow info from database
        workflow = await db.fetchrow("""
            SELECT category, priority_weight, sla_hours
            FROM workflows
            WHERE code = $1
        """, workflow_code)

        base_score = Decimal("50")  # Default

        if workflow:
            # Use category-based priority
            category = workflow.get('category', '').lower()
            base_score = Decimal(str(self.CATEGORY_PRIORITIES.get(category, 50)))

            # Apply workflow priority weight
            weight = workflow.get('priority_weight', 1.0)
            base_score = base_score * Decimal(str(weight))

            # Higher priority for shorter SLAs
            sla_hours = workflow.get('sla_hours', 48)
            if sla_hours <= 24:
                base_score += Decimal("20")
            elif sla_hours <= 48:
                base_score += Decimal("10")

        # Check hardcoded workflow for custom priority
        if workflow_instance is not None:
            custom_priority = getattr(workflow_instance, 'queue_priority', None)
            if custom_priority is not None:
                base_score = Decimal(str(custom_priority))

        # Add boost
        base_score += Decimal(str(priority_boost))

        return base_score

    async def _calculate_sla_deadline(
        self,
        db: asyncpg.Connection,
        workflow_code: str,
        workflow_instance: Optional[BaseWorkflow]
    ) -> datetime:
        """Calculate SLA deadline for the service request."""

        sla_hours = self.DEFAULT_SLA_HOURS

        # Check database workflow
        db_sla = await db.fetchval("""
            SELECT sla_hours FROM workflows WHERE code = $1
        """, workflow_code)

        if db_sla:
            sla_hours = db_sla

        # Check hardcoded workflow (takes precedence)
        if workflow_instance is not None:
            instance_sla = getattr(workflow_instance, 'sla_hours', None)
            if instance_sla is not None:
                sla_hours = instance_sla

        return datetime.utcnow() + timedelta(hours=sla_hours)

    async def _get_queue_item(
        self,
        db: asyncpg.Connection,
        queue_id: str
    ) -> Dict[str, Any]:
        """Get queue item by ID."""
        row = await db.fetchrow("""
            SELECT * FROM agent_work_queue WHERE id = $1
        """, queue_id)
        return dict(row) if row else {}

    async def get_pending_items(
        self,
        db: asyncpg.Connection,
        entity_code: Optional[str] = None,
        ministry_id: Optional[int] = None,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Get pending service_request items from the queue.

        Returns items ordered by priority (highest first) and creation time.
        """
        if not ministry_id and entity_code:
            ministry_id = await self._get_ministry_id(db, entity_code)

        query = """
            SELECT
                q.*,
                sr.reference_number,
                sr.workflow_code,
                sr.status as request_status,
                sr.created_at as request_created_at,
                u.full_name as citizen_name,
                u.email as citizen_email
            FROM agent_work_queue q
            JOIN service_requests sr ON sr.id::text = q.item_id
            JOIN users u ON u.id = sr.user_id
            WHERE q.item_type = $1
            AND q.status = 'pending'
            AND (q.assigned_to IS NULL OR q.locked_until < NOW())
        """
        params = [self.ITEM_TYPE]

        if ministry_id:
            query += " AND q.ministry_id = $2"
            params.append(ministry_id)

        query += """
            ORDER BY q.priority_score DESC, q.created_at ASC
            LIMIT ${}
        """.format(len(params) + 1)
        params.append(limit)

        rows = await db.fetch(query, *params)
        return [dict(row) for row in rows]

    async def assign_to_agent(
        self,
        db: asyncpg.Connection,
        queue_id: str,
        agent_id: str,
        lock_minutes: int = 30
    ) -> Dict[str, Any]:
        """
        Assign a queue item to an agent.

        Locks the item for the specified duration to prevent conflicts.
        """
        row = await db.fetchrow("""
            UPDATE agent_work_queue
            SET assigned_to = $2,
                assigned_at = NOW(),
                locked_until = NOW() + INTERVAL '1 minute' * $3,
                status = 'assigned',
                updated_at = NOW()
            WHERE id = $1
            AND (assigned_to IS NULL OR locked_until < NOW())
            RETURNING *
        """, queue_id, agent_id, lock_minutes)

        if not row:
            raise ValueError("Queue item not available for assignment")

        # Also update the service_request status
        await db.execute("""
            UPDATE service_requests
            SET status = 'UNDER_REVIEW',
                assigned_agent_id = $2,
                updated_at = NOW()
            WHERE id = $1::uuid
        """, row['item_id'], agent_id)

        logger.info(f"Assigned queue item {queue_id} to agent {agent_id}")

        return dict(row)

    async def complete_item(
        self,
        db: asyncpg.Connection,
        queue_id: str,
        agent_id: str,
        result_status: str = "approved"
    ) -> Dict[str, Any]:
        """
        Mark a queue item as completed.

        Args:
            queue_id: The queue item ID
            agent_id: The completing agent ID
            result_status: The result (approved, rejected, etc.)
        """
        row = await db.fetchrow("""
            UPDATE agent_work_queue
            SET status = 'completed',
                completed_at = NOW(),
                completed_by = $2,
                updated_at = NOW()
            WHERE id = $1
            AND assigned_to = $2
            RETURNING *
        """, queue_id, agent_id)

        if not row:
            raise ValueError("Queue item not found or not assigned to this agent")

        logger.info(
            f"Completed queue item {queue_id} by agent {agent_id}. "
            f"Result: {result_status}"
        )

        return dict(row)

    async def escalate_item(
        self,
        db: asyncpg.Connection,
        queue_id: str,
        agent_id: str,
        reason: str
    ) -> Dict[str, Any]:
        """
        Escalate a queue item.

        Increases priority and marks for supervisor attention.
        """
        row = await db.fetchrow("""
            UPDATE agent_work_queue
            SET escalated = true,
                escalated_at = NOW(),
                escalated_by = $2,
                escalation_reason = $3,
                priority_score = priority_score + 50,
                status = 'pending',
                assigned_to = NULL,
                locked_until = NULL,
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
        """, queue_id, agent_id, reason)

        if not row:
            raise ValueError("Queue item not found")

        # Update service_request
        await db.execute("""
            UPDATE service_requests
            SET is_escalated = true,
                escalation_reason = $2,
                escalated_at = NOW(),
                updated_at = NOW()
            WHERE id = $1::uuid
        """, row['item_id'], reason)

        logger.warning(
            f"Escalated queue item {queue_id}. Reason: {reason}"
        )

        return dict(row)

    async def get_agent_queue(
        self,
        db: asyncpg.Connection,
        agent_id: str,
        include_completed: bool = False,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Get all queue items assigned to an agent.
        """
        status_filter = "AND q.status IN ('assigned', 'pending')"
        if include_completed:
            status_filter = ""

        rows = await db.fetch(f"""
            SELECT
                q.*,
                sr.reference_number,
                sr.workflow_code,
                sr.status as request_status,
                sr.form_data,
                u.full_name as citizen_name
            FROM agent_work_queue q
            JOIN service_requests sr ON sr.id::text = q.item_id
            JOIN users u ON u.id = sr.user_id
            WHERE q.item_type = $1
            AND q.assigned_to = $2
            {status_filter}
            ORDER BY q.priority_score DESC, q.assigned_at DESC
            LIMIT $3
        """, self.ITEM_TYPE, agent_id, limit)

        return [dict(row) for row in rows]

    async def get_queue_stats(
        self,
        db: asyncpg.Connection,
        entity_code: Optional[str] = None,
        ministry_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Get queue statistics for an entity/ministry.
        """
        if not ministry_id and entity_code:
            ministry_id = await self._get_ministry_id(db, entity_code)

        where_clause = "WHERE item_type = $1"
        params = [self.ITEM_TYPE]

        if ministry_id:
            where_clause += " AND ministry_id = $2"
            params.append(ministry_id)

        stats = await db.fetchrow(f"""
            SELECT
                COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
                COUNT(*) FILTER (WHERE status = 'assigned') as assigned_count,
                COUNT(*) FILTER (WHERE status = 'completed'
                                 AND completed_at > NOW() - INTERVAL '24 hours') as completed_today,
                COUNT(*) FILTER (WHERE escalated = true
                                 AND status != 'completed') as escalated_count,
                COUNT(*) FILTER (WHERE sla_deadline < NOW()
                                 AND status != 'completed') as sla_violations,
                AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600)
                    FILTER (WHERE status = 'completed') as avg_processing_hours
            FROM agent_work_queue
            {where_clause}
        """, *params)

        return {
            "pending": stats['pending_count'] or 0,
            "assigned": stats['assigned_count'] or 0,
            "completed_today": stats['completed_today'] or 0,
            "escalated": stats['escalated_count'] or 0,
            "sla_violations": stats['sla_violations'] or 0,
            "avg_processing_hours": round(stats['avg_processing_hours'] or 0, 2)
        }

    async def check_sla_status(
        self,
        db: asyncpg.Connection,
        queue_id: str
    ) -> Dict[str, Any]:
        """
        Check SLA status for a queue item.
        """
        row = await db.fetchrow("""
            SELECT
                id,
                sla_deadline,
                created_at,
                status,
                CASE
                    WHEN status = 'completed' THEN 'completed'
                    WHEN sla_deadline < NOW() THEN 'violated'
                    WHEN sla_deadline < NOW() + INTERVAL '6 hours' THEN 'at_risk'
                    ELSE 'on_track'
                END as sla_status,
                EXTRACT(EPOCH FROM (sla_deadline - NOW())) / 3600 as hours_remaining
            FROM agent_work_queue
            WHERE id = $1
        """, queue_id)

        if not row:
            raise ValueError("Queue item not found")

        return {
            "queue_id": row['id'],
            "sla_deadline": row['sla_deadline'].isoformat() if row['sla_deadline'] else None,
            "status": row['sla_status'],
            "hours_remaining": round(row['hours_remaining'] or 0, 2)
        }

    async def remove_from_queue(
        self,
        db: asyncpg.Connection,
        service_request_id: UUID,
        reason: str = "cancelled"
    ) -> bool:
        """
        Remove a service_request from the queue.

        Used when a request is cancelled or no longer needs agent processing.
        """
        result = await db.execute("""
            UPDATE agent_work_queue
            SET status = 'cancelled',
                cancellation_reason = $2,
                updated_at = NOW()
            WHERE item_type = $1
            AND item_id = $3
            AND status NOT IN ('completed', 'cancelled')
        """, self.ITEM_TYPE, reason, str(service_request_id))

        removed = 'UPDATE 1' in result
        if removed:
            logger.info(f"Removed service_request {service_request_id} from queue. Reason: {reason}")

        return removed


# Singleton instance
agent_queue_service = AgentQueueService()
