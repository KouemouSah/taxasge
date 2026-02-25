"""
Auto Assignment Service - DEPRECATED & DISABLED

SUPERSEDED BY: app.modules.assignment.services.auto_assignment_service
which uses entity_code routing (migration 131) instead of ministry_id.

All active callers (agent_queue_handler, payment_assignment_handler,
service_request_service, outbox_service) import from the assignment module.

DO NOT USE THIS MODULE. Instantiation will raise DeprecationError.
"""

from loguru import logger


class AutoAssignmentService:
    """DEPRECATED: Use app.modules.assignment.services.auto_assignment_service instead."""

    def __init__(self, *args, **kwargs):
        raise DeprecationError(
            "agents.services.AutoAssignmentService is DEPRECATED. "
            "Use app.modules.assignment.services.auto_assignment_service instead. "
            "See migration 131 for entity_code routing."
        )


class DeprecationError(Exception):
    """Raised when deprecated code is accidentally used."""
    pass


def get_auto_assignment_service():
    """DEPRECATED: Use app.modules.assignment.services.auto_assignment_service."""
    raise DeprecationError(
        "agents.services.get_auto_assignment_service() is DEPRECATED. "
        "Import from app.modules.assignment.services instead."
    )
