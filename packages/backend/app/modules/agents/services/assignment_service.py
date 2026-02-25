"""
Assignment Service - DEPRECATED & DISABLED

SUPERSEDED BY: app.modules.assignment.services.assignment_service
which uses DB-driven priority/SLA from workflows.priority_weight (migration 131)
instead of hardcoded type_priorities and base_sla_hours dicts.

DO NOT USE THIS MODULE. Instantiation will raise DeprecationError.
"""

from loguru import logger


class DeprecationError(Exception):
    """Raised when deprecated code is accidentally used."""
    pass


class AssignmentService:
    """DEPRECATED: Use app.modules.assignment.services.assignment_service instead.

    This class contained hardcoded priority dicts (tax_income, tax_vat, etc.)
    and SLA hours that don't match the current DB schema.
    The replacement reads priority_weight and sla_hours from the workflows table.
    """

    def __init__(self, *args, **kwargs):
        raise DeprecationError(
            "agents.services.AssignmentService is DEPRECATED. "
            "Use app.modules.assignment.services.assignment_service instead. "
            "See migration 131 for DB-driven priority_weight and SLA."
        )
