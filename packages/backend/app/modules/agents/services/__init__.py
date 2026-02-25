"""Agent services

NOTE: AssignmentService and AutoAssignmentService are DEPRECATED in this module.
Use app.modules.assignment.services instead (entity_code routing, migration 131).
Importing them will NOT crash, but instantiating them will raise DeprecationError.
"""

from app.modules.agents.services.agent_service import AgentService
from app.modules.agents.services.assignment_service import AssignmentService
from app.modules.agents.services.workload_service import WorkloadService

__all__ = ["AgentService", "AssignmentService", "WorkloadService"]
